import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  verifyWebhookSignature,
  CarrierWebhookPayload,
} from '@/lib/carrier-billing'
import { creditSubmitterEarning } from '@/lib/submitter-earnings'

/**
 * Carrier Billing Webhook Handler
 *
 * This endpoint receives payment notifications from the carrier billing aggregator
 * when a user confirms or cancels a payment via SMS/USSD.
 *
 * TODO: Update the IP whitelist with your aggregator's IPs
 * TODO: Update signature verification based on aggregator's method
 */

// Aggregator IPs (to be filled in after signing with aggregator)
const AGGREGATOR_IPS = process.env.CARRIER_BILLING_ALLOWED_IPS?.split(',') || []

// POST /api/media/carrier-webhook - Handle carrier billing notifications
export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // Verify IP (only in production if IPs are configured)
    if (process.env.NODE_ENV === 'production' && AGGREGATOR_IPS.length > 0) {
      if (!AGGREGATOR_IPS.includes(clientIp)) {
        console.error('[Carrier Webhook] Invalid source IP:', clientIp)
        return new NextResponse('Invalid source IP', { status: 403 })
      }
    }

    // Parse webhook payload
    const payload: CarrierWebhookPayload = await request.json()

    console.log('[Carrier Webhook] Received:', {
      transactionId: payload.transactionId,
      status: payload.status,
      carrier: payload.carrier,
      amount: payload.amount,
      reference: payload.reference,
    })

    // Verify signature if provided
    const signature = request.headers.get('x-signature') || payload.signature || ''
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('[Carrier Webhook] Invalid signature')
      // In development, continue anyway for testing
      if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Invalid signature', { status: 400 })
      }
    }

    // Find the purchase by transaction reference
    // The reference format should be the purchase ID
    const purchase = await prisma.mediaPurchase.findFirst({
      where: {
        OR: [
          { id: payload.reference },
          { paymentId: payload.transactionId },
        ]
      },
    })

    if (!purchase) {
      console.error('[Carrier Webhook] Purchase not found:', payload.reference)
      return new NextResponse('Purchase not found', { status: 404 })
    }

    // Verify amount matches (convert from cents if needed)
    const expectedAmount = purchase.amount
    if (payload.amount !== expectedAmount) {
      console.error('[Carrier Webhook] Amount mismatch:', {
        expected: expectedAmount,
        received: payload.amount,
      })
      // Log but don't fail - some aggregators might send slightly different amounts
    }

    // Update purchase based on status
    switch (payload.status) {
      case 'completed':
        await prisma.mediaPurchase.update({
          where: { id: purchase.id },
          data: {
            status: 'COMPLETED',
            paymentId: payload.transactionId,
            paymentProvider: 'carrier_billing',
          }
        })
        console.log('[Carrier Webhook] Payment completed:', purchase.id)

        // Credit the submitter's account if linked
        const mediaType = purchase.liveMediaId ? 'live' : 'file'
        const mediaId = purchase.liveMediaId || purchase.fileId
        if (mediaId) {
          const creditResult = await creditSubmitterEarning({
            purchaseId: purchase.id,
            mediaType,
            mediaId,
          })
          console.log('[Carrier Webhook] Submitter credit result:', creditResult)
        }
        break

      case 'failed':
        await prisma.mediaPurchase.update({
          where: { id: purchase.id },
          data: {
            status: 'FAILED',
            paymentId: payload.transactionId,
          }
        })
        console.log('[Carrier Webhook] Payment failed:', purchase.id)
        break

      case 'cancelled':
        await prisma.mediaPurchase.update({
          where: { id: purchase.id },
          data: {
            status: 'CANCELLED',
            paymentId: payload.transactionId,
          }
        })
        console.log('[Carrier Webhook] Payment cancelled:', purchase.id)
        break

      case 'expired':
        await prisma.mediaPurchase.update({
          where: { id: purchase.id },
          data: { status: 'EXPIRED' }
        })
        console.log('[Carrier Webhook] Payment expired:', purchase.id)
        break

      case 'pending':
      case 'confirmed':
        // User has confirmed but payment not yet finalized
        console.log('[Carrier Webhook] Payment pending/confirmed:', purchase.id)
        break

      default:
        console.log('[Carrier Webhook] Unknown status:', payload.status)
    }

    // Return 200 OK to acknowledge receipt
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[Carrier Webhook] Error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

// GET /api/media/carrier-webhook - Health check for aggregator
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'carrier-billing-webhook',
    timestamp: new Date().toISOString(),
  })
}
