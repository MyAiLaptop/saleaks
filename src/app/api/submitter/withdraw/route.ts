import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

const MINIMUM_WITHDRAWAL = 1000 // R10.00 in cents

/**
 * POST /api/submitter/withdraw
 *
 * Request a withdrawal of available balance
 */
export async function POST(request: NextRequest) {
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
    const { amount } = body

    // Get account
    const account = await prisma.submitterAccount.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found', requiresAuth: true },
        { status: 401 }
      )
    }

    // Validate amount
    const withdrawAmount = amount || account.balance

    if (withdrawAmount < MINIMUM_WITHDRAWAL) {
      return NextResponse.json(
        { success: false, error: `Minimum withdrawal is R${(MINIMUM_WITHDRAWAL / 100).toFixed(2)}` },
        { status: 400 }
      )
    }

    if (withdrawAmount > account.balance) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Check for pending withdrawal
    const pendingWithdrawal = await prisma.submitterWithdrawal.findFirst({
      where: {
        accountId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    })

    if (pendingWithdrawal) {
      return NextResponse.json(
        { success: false, error: 'You have a pending withdrawal. Please wait for it to complete.' },
        { status: 400 }
      )
    }

    // Create withdrawal and update balance in a transaction
    const [withdrawal] = await prisma.$transaction([
      prisma.submitterWithdrawal.create({
        data: {
          accountId,
          amount: withdrawAmount,
          method: 'AIRTIME', // Default to airtime for carrier billing
          status: 'PENDING',
          phoneNumber: account.phoneNumber,
        },
      }),
      prisma.submitterAccount.update({
        where: { id: accountId },
        data: {
          balance: { decrement: withdrawAmount },
          totalWithdrawn: { increment: withdrawAmount },
        },
      }),
      // Mark the earnings as withdrawn
      prisma.submitterEarning.updateMany({
        where: {
          accountId,
          status: 'AVAILABLE',
        },
        data: {
          status: 'WITHDRAWN',
        },
      }),
    ])

    console.log(`[Withdrawal] Created withdrawal ${withdrawal.id} for R${(withdrawAmount / 100).toFixed(2)} to ${account.phoneNumber}`)

    // TODO: In production, trigger actual payout via carrier billing reverse
    // or queue for manual processing

    return NextResponse.json({
      success: true,
      data: {
        withdrawalId: withdrawal.id,
        amount: withdrawAmount,
        method: withdrawal.method,
        status: withdrawal.status,
        message: 'Withdrawal requested. You will receive payment within 24-48 hours.',
      },
    })
  } catch (error) {
    console.error('[Submitter Withdraw] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process withdrawal' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/submitter/withdraw
 *
 * Get withdrawal history
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const accountId = cookieStore.get('submitter_id')?.value

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Not logged in', requiresAuth: true },
        { status: 401 }
      )
    }

    const withdrawals = await prisma.submitterWithdrawal.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      success: true,
      data: {
        withdrawals: withdrawals.map((w) => ({
          id: w.id,
          amount: w.amount,
          method: w.method,
          status: w.status,
          createdAt: w.createdAt,
          processedAt: w.processedAt,
        })),
      },
    })
  } catch (error) {
    console.error('[Submitter Withdraw] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get withdrawals' },
      { status: 500 }
    )
  }
}
