import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFingerprint } from '@/lib/fingerprint'

// POST /api/notifications/subscribe - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, keys, preferences } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription data' },
        { status: 400 }
      )
    }

    const fingerprint = getFingerprint(request)

    // Upsert subscription (update if endpoint exists, create if not)
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        fingerprint,
        breakingNews: preferences?.breakingNews ?? true,
        liveEvents: preferences?.liveEvents ?? true,
        categories: preferences?.categories ? JSON.stringify(preferences.categories) : null,
        province: preferences?.province || null,
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        fingerprint,
        breakingNews: preferences?.breakingNews ?? true,
        liveEvents: preferences?.liveEvents ?? true,
        categories: preferences?.categories ? JSON.stringify(preferences.categories) : null,
        province: preferences?.province || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: subscription.id,
        message: 'Subscribed to notifications',
      },
    })
  } catch (error) {
    console.error('Error subscribing to notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to subscribe' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/subscribe - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Endpoint is required' },
        { status: 400 }
      )
    }

    await prisma.pushSubscription.update({
      where: { endpoint },
      data: { status: 'UNSUBSCRIBED' },
    })

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed from notifications',
    })
  } catch (error) {
    console.error('Error unsubscribing:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unsubscribe' },
      { status: 500 }
    )
  }
}
