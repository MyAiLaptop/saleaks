import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/advertiser/credits/callback
 * Handle Flutterwave payment callback for advertiser credits
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const txRef = searchParams.get('tx_ref')
    const transactionId = searchParams.get('transaction_id')

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://saleaks.co.za'

    if (status !== 'successful' || !txRef || !transactionId) {
      // Payment failed or cancelled
      return NextResponse.redirect(
        `${baseUrl}/advertiser/credits?status=failed&message=${encodeURIComponent('Payment was not completed')}`
      )
    }

    // Verify the transaction with Flutterwave
    const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY
    if (!FLW_SECRET_KEY) {
      return NextResponse.redirect(
        `${baseUrl}/advertiser/credits?status=error&message=${encodeURIComponent('Payment verification failed')}`
      )
    }

    const verifyResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          'Authorization': `Bearer ${FLW_SECRET_KEY}`,
        },
      }
    )

    const verifyResult = await verifyResponse.json()

    if (verifyResult.status !== 'success' || verifyResult.data.status !== 'successful') {
      return NextResponse.redirect(
        `${baseUrl}/advertiser/credits?status=failed&message=${encodeURIComponent('Payment verification failed')}`
      )
    }

    // Extract metadata
    const meta = verifyResult.data.meta || {}
    const advertiserId = meta.advertiserId
    const totalCredits = parseInt(meta.totalCredits) || 0

    if (!advertiserId || !totalCredits) {
      console.error('[Advertiser Credits Callback] Missing metadata:', meta)
      return NextResponse.redirect(
        `${baseUrl}/advertiser/credits?status=error&message=${encodeURIComponent('Invalid transaction data')}`
      )
    }

    // Find the pending transaction
    const pendingTransaction = await prisma.advertiserCreditTransaction.findFirst({
      where: {
        advertiserId,
        referenceId: txRef,
        status: 'PENDING',
      },
    })

    if (!pendingTransaction) {
      // Transaction might already be processed
      return NextResponse.redirect(
        `${baseUrl}/advertiser/credits?status=success&message=${encodeURIComponent('Credits added to your account')}`
      )
    }

    // Get current advertiser balance
    const advertiser = await prisma.advertiserAccount.findUnique({
      where: { id: advertiserId },
    })

    if (!advertiser) {
      return NextResponse.redirect(
        `${baseUrl}/advertiser/credits?status=error&message=${encodeURIComponent('Advertiser account not found')}`
      )
    }

    // Update in a transaction
    await prisma.$transaction([
      // Update advertiser balance
      prisma.advertiserAccount.update({
        where: { id: advertiserId },
        data: {
          creditBalance: { increment: totalCredits },
        },
      }),
      // Mark transaction as completed
      prisma.advertiserCreditTransaction.update({
        where: { id: pendingTransaction.id },
        data: {
          status: 'COMPLETED',
          balanceBefore: advertiser.creditBalance,
          balanceAfter: advertiser.creditBalance + totalCredits,
          referenceId: `${txRef}_${transactionId}`,
        },
      }),
    ])

    console.log(`[Advertiser Credits] Added ${totalCredits} credits to advertiser ${advertiserId}`)

    return NextResponse.redirect(
      `${baseUrl}/advertiser/credits?status=success&amount=${totalCredits}&message=${encodeURIComponent('Credits added successfully!')}`
    )
  } catch (error) {
    console.error('[Advertiser Credits Callback] Error:', error)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://saleaks.co.za'
    return NextResponse.redirect(
      `${baseUrl}/advertiser/credits?status=error&message=${encodeURIComponent('An error occurred processing your payment')}`
    )
  }
}
