import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

/**
 * GET /api/submitter/notifications
 *
 * Get creator notifications (engagement milestones, reactions, bids, purchases)
 */
export async function GET(request: NextRequest) {
  try {
    // Get account ID from session cookie
    const cookieStore = await cookies()
    const accountId = cookieStore.get('submitter_id')?.value

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Not logged in', requiresAuth: true },
        { status: 401 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // Build where clause
    const where = {
      accountId,
      ...(unreadOnly ? { isRead: false } : {}),
    }

    // Get notifications with count
    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.creatorNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.creatorNotification.count({ where: { accountId } }),
      prisma.creatorNotification.count({ where: { accountId, isRead: false } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          postId: n.postId,
          postPublicId: n.postPublicId,
          data: n.data ? JSON.parse(n.data) : null,
          isRead: n.isRead,
          createdAt: n.createdAt,
        })),
        pagination: {
          total: totalCount,
          unread: unreadCount,
          limit,
          offset,
          hasMore: offset + notifications.length < totalCount,
        },
      },
    })
  } catch (error) {
    console.error('[Creator Notifications] Error fetching:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/submitter/notifications
 *
 * Mark notifications as read
 * Body: { notificationIds: string[] } or { markAllRead: true }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get account ID from session cookie
    const cookieStore = await cookies()
    const accountId = cookieStore.get('submitter_id')?.value

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Not logged in', requiresAuth: true },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationIds, markAllRead } = body

    if (markAllRead) {
      // Mark all unread notifications as read
      const result = await prisma.creatorNotification.updateMany({
        where: {
          accountId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: `Marked ${result.count} notifications as read`,
        markedCount: result.count,
      })
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'notificationIds array required' },
        { status: 400 }
      )
    }

    // Mark specific notifications as read (only if they belong to this account)
    const result = await prisma.creatorNotification.updateMany({
      where: {
        id: { in: notificationIds },
        accountId, // Security: only update own notifications
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: `Marked ${result.count} notifications as read`,
      markedCount: result.count,
    })
  } catch (error) {
    console.error('[Creator Notifications] Error marking read:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}
