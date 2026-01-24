import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { formatPhoneNumber } from '@/lib/carrier-billing'

/**
 * GET /api/buyer/account
 *
 * Get current buyer account info (requires session cookie)
 */
export async function GET(request: NextRequest) {
  try {
    // Get buyer ID from cookie
    const buyerId = request.cookies.get('buyer_id')?.value

    if (!buyerId) {
      return NextResponse.json(
        { success: false, error: 'Not logged in', requiresLogin: true },
        { status: 401 }
      )
    }

    const account = await prisma.buyerAccount.findUnique({
      where: { id: buyerId },
      include: {
        purchases: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!account) {
      // Clear invalid cookie
      const response = NextResponse.json(
        { success: false, error: 'Account not found', requiresLogin: true },
        { status: 404 }
      )
      response.cookies.delete('buyer_id')
      response.cookies.delete('buyer_session')
      response.cookies.delete('buyer_phone')
      return response
    }

    return NextResponse.json({
      success: true,
      data: {
        id: account.id,
        phoneNumber: account.phoneNumber,
        organizationName: account.organizationName,
        email: account.email,
        contactPerson: account.contactPerson,
        subscriptionTier: account.subscriptionTier,
        subscriptionStatus: account.subscriptionStatus,
        subscriptionEndsAt: account.subscriptionEndsAt,
        notifyOnNewContent: account.notifyOnNewContent,
        notifyOnOutbid: account.notifyOnOutbid,
        notifyCategories: account.notifyCategories ? JSON.parse(account.notifyCategories) : null,
        verified: account.verified,
        totalPurchases: account.totalPurchases,
        totalSpent: account.totalSpent,
        auctionsWon: account.auctionsWon,
        creditBalance: account.creditBalance,
        recentPurchases: account.purchases,
        createdAt: account.createdAt,
      },
    })
  } catch (error) {
    console.error('[Buyer Account GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get account' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/buyer/account
 *
 * Update buyer account settings
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get buyer ID from cookie
    const buyerId = request.cookies.get('buyer_id')?.value

    if (!buyerId) {
      return NextResponse.json(
        { success: false, error: 'Not logged in', requiresLogin: true },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      organizationName,
      email,
      contactPerson,
      notifyOnNewContent,
      notifyOnOutbid,
      notifyCategories,
    } = body

    const account = await prisma.buyerAccount.update({
      where: { id: buyerId },
      data: {
        ...(organizationName !== undefined && { organizationName }),
        ...(email !== undefined && { email }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(notifyOnNewContent !== undefined && { notifyOnNewContent }),
        ...(notifyOnOutbid !== undefined && { notifyOnOutbid }),
        ...(notifyCategories !== undefined && {
          notifyCategories: notifyCategories ? JSON.stringify(notifyCategories) : null,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: account.id,
        organizationName: account.organizationName,
        email: account.email,
        contactPerson: account.contactPerson,
        notifyOnNewContent: account.notifyOnNewContent,
        notifyOnOutbid: account.notifyOnOutbid,
        notifyCategories: account.notifyCategories ? JSON.parse(account.notifyCategories) : null,
      },
    })
  } catch (error) {
    console.error('[Buyer Account PATCH] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update account' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/buyer/account (logout)
 *
 * Clear buyer session cookies
 */
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  })

  response.cookies.delete('buyer_id')
  response.cookies.delete('buyer_session')
  response.cookies.delete('buyer_phone')

  return response
}
