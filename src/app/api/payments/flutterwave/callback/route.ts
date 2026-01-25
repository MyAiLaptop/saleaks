import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyFlutterwaveByTxRef } from '@/lib/flutterwave'

/**
 * GET /api/payments/flutterwave/callback
 * User is redirected here after Flutterwave payment
 * Query params: status, tx_ref, transaction_id
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const txRef = searchParams.get('tx_ref')
  const transactionId = searchParams.get('transaction_id')

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  // If payment was cancelled or failed
  if (status === 'cancelled') {
    return NextResponse.redirect(`${baseUrl}?payment=cancelled`)
  }

  if (!txRef) {
    return NextResponse.redirect(`${baseUrl}?payment=error&reason=missing_txref`)
  }

  try {
    // Verify the transaction with Flutterwave
    const verification = await verifyFlutterwaveByTxRef(txRef)

    if (!verification.success || verification.status !== 'successful') {
      console.error('[Flutterwave Callback] Verification failed:', verification.error)
      return NextResponse.redirect(`${baseUrl}?payment=failed`)
    }

    // Determine payment type and find the corresponding record
    if (txRef.startsWith('CREDITS-')) {
      // Credit purchase - redirect to buyer dashboard
      return NextResponse.redirect(`${baseUrl}/buyer/account?payment=success`)
    }

    // Media purchase - find the download token
    const purchase = await prisma.mediaPurchase.findFirst({
      where: {
        paymentId: txRef,
        paymentProvider: 'flutterwave',
      },
      select: {
        id: true,
        downloadToken: true,
        status: true,
      },
    })

    if (!purchase) {
      console.error('[Flutterwave Callback] Purchase not found:', txRef)
      return NextResponse.redirect(`${baseUrl}?payment=error&reason=purchase_not_found`)
    }

    // If purchase not yet completed (webhook might be delayed), update it now
    if (purchase.status === 'PENDING' && verification.data) {
      await prisma.mediaPurchase.update({
        where: { id: purchase.id },
        data: {
          status: 'COMPLETED',
          flutterwaveRef: verification.data.flw_ref,
          flutterwaveTransactionId: verification.data.id.toString(),
          completedAt: new Date(),
        },
      })
    }

    // Redirect to download page
    return NextResponse.redirect(`${baseUrl}/download/${purchase.downloadToken}?success=true`)
  } catch (error) {
    console.error('[Flutterwave Callback] Error:', error)
    return NextResponse.redirect(`${baseUrl}?payment=error`)
  }
}
