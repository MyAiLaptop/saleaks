import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/buyer/notify
 *
 * Send notifications to subscribed buyers about new content
 * Called internally when new content is posted
 *
 * NOTE: This would integrate with an SMS provider in production
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (you'd add proper auth in production)
    const authHeader = request.headers.get('x-internal-key')
    if (authHeader !== process.env.INTERNAL_API_KEY && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { postId, category, province, content } = body

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID required' },
        { status: 400 }
      )
    }

    // Find buyers who want to be notified
    // Filter by category preference if they have one set
    const buyers = await prisma.buyerAccount.findMany({
      where: {
        verified: true,
        notifyOnNewContent: true,
        subscriptionStatus: 'ACTIVE',
        // Only notify if they're watching this category or watching all categories
        OR: [
          { notifyCategories: null }, // Watching all categories
          { notifyCategories: { contains: category } }, // Watching this category
        ],
      },
      select: {
        id: true,
        phoneNumber: true,
        organizationName: true,
        email: true,
      },
    })

    // In production, send SMS to each buyer
    const notifications: string[] = []
    for (const buyer of buyers) {
      const message = `New ${category} content available on Leakpoint! 1-hour exclusive auction starting now. View: ${process.env.NEXT_PUBLIC_APP_URL}/live/${postId}`

      // TODO: Integrate with SMS provider (Clickatell, BulkSMS, etc.)
      console.log(`[Buyer Notify] Would SMS ${buyer.phoneNumber}: ${message}`)
      notifications.push(buyer.phoneNumber)
    }

    return NextResponse.json({
      success: true,
      data: {
        notifiedCount: notifications.length,
        // In development, show who would be notified
        ...(process.env.NODE_ENV !== 'production' && { phones: notifications }),
      },
    })
  } catch (error) {
    console.error('[Buyer Notify] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}

// Utility function moved to @/lib/buyer-notify.ts for reuse
