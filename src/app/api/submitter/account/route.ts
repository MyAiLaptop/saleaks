import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

/**
 * GET /api/submitter/account
 *
 * Get current submitter account details, balance, and earnings
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

    // Get account with earnings
    const account = await prisma.submitterAccount.findUnique({
      where: { id: accountId },
      include: {
        earnings: {
          orderBy: { createdAt: 'desc' },
          take: 20, // Last 20 earnings
        },
        withdrawals: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 withdrawals
        },
        posts: {
          select: {
            id: true,
            publicId: true,
            title: true,
            viewCount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        livePosts: {
          select: {
            id: true,
            publicId: true,
            content: true,
            viewCount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!account) {
      // Clear invalid session
      const response = NextResponse.json(
        { success: false, error: 'Account not found', requiresAuth: true },
        { status: 401 }
      )
      response.cookies.delete('submitter_session')
      response.cookies.delete('submitter_id')
      return response
    }

    // Calculate pending earnings
    const pendingEarnings = account.earnings
      .filter(e => e.status === 'PENDING')
      .reduce((sum, e) => sum + e.amount, 0)

    const availableEarnings = account.earnings
      .filter(e => e.status === 'AVAILABLE')
      .reduce((sum, e) => sum + e.amount, 0)

    return NextResponse.json({
      success: true,
      data: {
        account: {
          id: account.id,
          phoneNumber: account.phoneNumber,
          carrier: account.carrier,
          verified: account.verified,
          createdAt: account.createdAt,
        },
        balance: {
          available: account.balance, // In cents
          pending: pendingEarnings,
          totalEarned: account.totalEarned,
          totalWithdrawn: account.totalWithdrawn,
        },
        earnings: account.earnings.map(e => ({
          id: e.id,
          amount: e.amount,
          grossAmount: e.grossAmount,
          description: e.description,
          status: e.status,
          createdAt: e.createdAt,
        })),
        withdrawals: account.withdrawals.map(w => ({
          id: w.id,
          amount: w.amount,
          method: w.method,
          status: w.status,
          createdAt: w.createdAt,
          processedAt: w.processedAt,
        })),
        content: {
          posts: account.posts,
          livePosts: account.livePosts,
          totalPosts: account.posts.length + account.livePosts.length,
        },
      },
    })
  } catch (error) {
    console.error('[Submitter Account] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get account' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/submitter/account
 *
 * Logout - clear session
 */
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  })

  response.cookies.delete('submitter_session')
  response.cookies.delete('submitter_id')

  return response
}
