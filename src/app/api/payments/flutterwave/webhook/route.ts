import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  verifyFlutterwaveWebhook,
  processFlutterwaveWebhook,
  FlutterwaveWebhookPayload,
} from '@/lib/flutterwave'

/**
 * POST /api/payments/flutterwave/webhook
 * Flutterwave sends payment notifications here
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text()
    const payload: FlutterwaveWebhookPayload = JSON.parse(body)

    // Verify webhook signature
    const verifHash = request.headers.get('verif-hash')
    if (!verifHash || !verifyFlutterwaveWebhook(body, verifHash)) {
      console.error('[Flutterwave Webhook] Invalid signature')
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Only process charge.completed events
    if (payload.event !== 'charge.completed') {
      console.log(`[Flutterwave Webhook] Ignoring event: ${payload.event}`)
      return NextResponse.json({ success: true, message: 'Event ignored' })
    }

    console.log(`[Flutterwave Webhook] Processing tx_ref: ${payload.data.tx_ref}`)

    // Process and verify the payment
    const result = await processFlutterwaveWebhook(payload)

    if (!result.valid) {
      console.error('[Flutterwave Webhook] Invalid payment data')
      return NextResponse.json(
        { success: false, error: 'Invalid payment data' },
        { status: 400 }
      )
    }

    // Parse tx_ref to determine payment type
    // Format: SN-{timestamp}-{random} for media purchases
    // Format: CREDITS-{timestamp}-{random} for credit purchases
    const txRef = result.txRef

    // Check if this is a credit purchase
    if (txRef.startsWith('CREDITS-')) {
      return await handleCreditPurchase(result)
    }

    // Otherwise, it's a media purchase
    return await handleMediaPurchase(result)
  } catch (error) {
    console.error('[Flutterwave Webhook] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle media purchase completion
 */
async function handleMediaPurchase(result: {
  txRef: string
  status: string
  amount: number
  flwRef: string
  transactionId: number
  customerEmail: string
  meta?: Record<string, string | number> | null
}) {
  // Find the purchase by tx_ref stored in paymentId field
  const purchase = await prisma.mediaPurchase.findFirst({
    where: {
      paymentId: result.txRef,
      paymentProvider: 'flutterwave',
    },
  })

  if (!purchase) {
    console.error(`[Flutterwave Webhook] Purchase not found: ${result.txRef}`)
    return NextResponse.json(
      { success: false, error: 'Purchase not found' },
      { status: 404 }
    )
  }

  // Check for duplicate processing
  if (purchase.status === 'COMPLETED') {
    console.log(`[Flutterwave Webhook] Purchase already completed: ${result.txRef}`)
    return NextResponse.json({ success: true, message: 'Already processed' })
  }

  // Update purchase status based on payment status
  const newStatus = result.status === 'successful' ? 'COMPLETED' : 'FAILED'

  await prisma.mediaPurchase.update({
    where: { id: purchase.id },
    data: {
      status: newStatus,
      flutterwaveRef: result.flwRef,
      flutterwaveTransactionId: result.transactionId.toString(),
      completedAt: newStatus === 'COMPLETED' ? new Date() : null,
    },
  })

  // If payment successful, credit submitter's earnings
  if (newStatus === 'COMPLETED' && purchase.submitterShare > 0) {
    // Find submitter account based on purchase type
    let submitterAccount = null

    if (purchase.fileId) {
      const file = await prisma.file.findUnique({
        where: { id: purchase.fileId },
        include: {
          post: {
            include: { submitterAccount: true },
          },
        },
      })
      submitterAccount = file?.post?.submitterAccount
    } else if (purchase.liveMediaId) {
      const liveMedia = await prisma.liveBillboardMedia.findUnique({
        where: { id: purchase.liveMediaId },
        include: {
          post: {
            include: { submitterAccount: true },
          },
        },
      })
      submitterAccount = liveMedia?.post?.submitterAccount
    }

    if (submitterAccount) {
      // Create earning record
      await prisma.submitterEarning.create({
        data: {
          accountId: submitterAccount.id,
          purchaseId: purchase.id,
          amount: purchase.submitterShare,
          grossAmount: purchase.amount,
          description: `Media sale via Flutterwave`,
          status: 'AVAILABLE',
        },
      })

      // Update submitter balance
      await prisma.submitterAccount.update({
        where: { id: submitterAccount.id },
        data: {
          balance: { increment: purchase.submitterShare },
          totalEarned: { increment: purchase.submitterShare },
        },
      })
    }
  }

  console.log(`[Flutterwave Webhook] Purchase ${newStatus}: ${result.txRef}`)
  return NextResponse.json({ success: true, status: newStatus })
}

/**
 * Handle credit package purchase completion
 */
async function handleCreditPurchase(result: {
  txRef: string
  status: string
  amount: number
  flwRef: string
  transactionId: number
  customerEmail: string
  meta?: Record<string, string | number> | null
}) {
  // Extract buyer ID and package ID from meta
  const buyerId = result.meta?.buyerId as string
  const packageId = result.meta?.packageId as string
  const credits = result.meta?.credits as number

  if (!buyerId) {
    console.error('[Flutterwave Webhook] Missing buyer ID in meta')
    return NextResponse.json(
      { success: false, error: 'Missing buyer ID' },
      { status: 400 }
    )
  }

  // Find buyer account
  const buyer = await prisma.buyerAccount.findUnique({
    where: { id: buyerId },
  })

  if (!buyer) {
    console.error(`[Flutterwave Webhook] Buyer not found: ${buyerId}`)
    return NextResponse.json(
      { success: false, error: 'Buyer not found' },
      { status: 404 }
    )
  }

  const isSuccessful = result.status === 'successful'

  if (isSuccessful && credits) {
    // Credit the buyer's account with a transaction
    await prisma.$transaction([
      // Create transaction record
      prisma.creditTransaction.create({
        data: {
          buyerId: buyerId,
          type: 'PURCHASE',
          amount: result.amount,
          balanceBefore: buyer.creditBalance,
          balanceAfter: buyer.creditBalance + credits,
          referenceType: 'FLUTTERWAVE',
          referenceId: result.flwRef,
          description: `Credit purchase: ${credits} credits via Flutterwave`,
        },
      }),
      // Add credits to buyer account
      prisma.buyerAccount.update({
        where: { id: buyerId },
        data: {
          creditBalance: { increment: credits },
        },
      }),
    ])

    console.log(`[Flutterwave Webhook] ${credits} credits added to buyer ${buyerId}`)
  } else if (!isSuccessful) {
    // Log failed transaction
    await prisma.creditTransaction.create({
      data: {
        buyerId: buyerId,
        type: 'PURCHASE',
        amount: result.amount,
        balanceBefore: buyer.creditBalance,
        balanceAfter: buyer.creditBalance,
        referenceType: 'FLUTTERWAVE',
        referenceId: result.flwRef,
        description: `Failed credit purchase via Flutterwave`,
      },
    })

    console.log(`[Flutterwave Webhook] Credit purchase failed: ${result.txRef}`)
  }

  return NextResponse.json({
    success: true,
    status: isSuccessful ? 'COMPLETED' : 'FAILED',
  })
}
