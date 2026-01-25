import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import webpush from 'web-push'

// Configure web-push with VAPID keys
// In production, these should be environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@spillnova.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

interface NotificationPayload {
  title: string
  body: string
  url?: string
  category?: string
  tag?: string
  province?: string
}

// POST /api/notifications/send - Send push notification (internal use)
// This would typically be called by a cron job or after certain events
export async function POST(request: NextRequest) {
  try {
    // Simple API key auth for internal use
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.NOTIFICATION_API_KEY

    if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: NotificationPayload = await request.json()
    const { title, body: notifBody, url, category, tag, province } = body

    if (!title || !notifBody) {
      return NextResponse.json(
        { success: false, error: 'Title and body are required' },
        { status: 400 }
      )
    }

    // Build filter for subscriptions
    const whereClause: {
      status: string
      breakingNews?: boolean
      liveEvents?: boolean
      province?: string | null
    } = {
      status: 'ACTIVE',
    }

    // Filter by notification type
    if (category === 'BREAKING') {
      whereClause.breakingNews = true
    } else {
      whereClause.liveEvents = true
    }

    // Filter by province if specified
    if (province) {
      // Get subscriptions that either match the province or have no province filter
      whereClause.province = province
    }

    // Get active subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: whereClause,
    })

    // Also get subscriptions with no province filter (they want all provinces)
    const allProvinceSubscriptions = province
      ? await prisma.pushSubscription.findMany({
          where: {
            status: 'ACTIVE',
            province: null,
            ...(category === 'BREAKING' ? { breakingNews: true } : { liveEvents: true }),
          },
        })
      : []

    const allSubscriptions = [...subscriptions, ...allProvinceSubscriptions]

    // Remove duplicates
    const uniqueSubscriptions = Array.from(
      new Map(allSubscriptions.map((s) => [s.endpoint, s])).values()
    )

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'VAPID keys not configured, skipping push',
          subscriptionCount: uniqueSubscriptions.length,
        },
      })
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body: notifBody,
      url: url || '/live',
      category,
      tag: tag || `saleaks-${Date.now()}`,
    })

    // Send notifications
    const results = await Promise.allSettled(
      uniqueSubscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          )
          return { success: true, endpoint: sub.endpoint }
        } catch (error: unknown) {
          // Handle expired/invalid subscriptions
          const webPushError = error as { statusCode?: number }
          if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
            // Subscription expired, mark as expired
            await prisma.pushSubscription.update({
              where: { endpoint: sub.endpoint },
              data: { status: 'EXPIRED' },
            })
          }
          return { success: false, endpoint: sub.endpoint, error }
        }
      })
    )

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && (r.value as { success: boolean }).success
    ).length
    const failed = results.length - successful

    return NextResponse.json({
      success: true,
      data: {
        sent: successful,
        failed,
        total: uniqueSubscriptions.length,
      },
    })
  } catch (error) {
    console.error('Error sending notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
