import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'
import {
  initiateCarrierPayment,
  isValidSAPhoneNumber,
  detectCarrier,
  getCarrierDisplayName,
  isCarrierBillingEnabled,
} from '@/lib/carrier-billing'

// Default prices in cents (ZAR)
const DEFAULT_IMAGE_PRICE = 100 // R1
const DEFAULT_VIDEO_PRICE = 300 // R3
const PLATFORM_SHARE_PERCENT = 50 // 50% to platform, 50% to submitter

interface CarrierPurchaseRequest {
  phoneNumber: string
  mediaType: 'file' | 'live'
  mediaId: string
}

// POST /api/media/carrier-purchase - Create a carrier billing purchase
export async function POST(request: NextRequest) {
  try {
    const body: CarrierPurchaseRequest = await request.json()
    const { phoneNumber, mediaType, mediaId } = body

    // Validate phone number
    if (!phoneNumber || !isValidSAPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid South African phone number' },
        { status: 400 }
      )
    }

    // Detect carrier
    const carrier = detectCarrier(phoneNumber)
    if (!carrier) {
      return NextResponse.json(
        { success: false, error: 'Could not detect carrier. Please use a valid SA mobile number.' },
        { status: 400 }
      )
    }

    // Get media details and price
    let media: { id: string; mimeType: string; price: number | null; forSale: boolean; originalName: string } | null = null
    let postPublicId: string | null = null

    if (mediaType === 'file') {
      const file = await prisma.file.findUnique({
        where: { id: mediaId },
        select: {
          id: true,
          mimeType: true,
          price: true,
          forSale: true,
          originalName: true,
          post: { select: { publicId: true } }
        }
      })
      if (file) {
        media = file
        postPublicId = file.post.publicId
      }
    } else if (mediaType === 'live') {
      const liveMedia = await prisma.liveBillboardMedia.findUnique({
        where: { id: mediaId },
        select: {
          id: true,
          mimeType: true,
          price: true,
          forSale: true,
          originalName: true,
          post: { select: { publicId: true } }
        }
      })
      if (liveMedia) {
        media = liveMedia
        postPublicId = liveMedia.post.publicId
      }
    }

    if (!media) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      )
    }

    if (!media.forSale) {
      return NextResponse.json(
        { success: false, error: 'This media is not available for purchase' },
        { status: 403 }
      )
    }

    // Calculate price
    const isVideo = media.mimeType.startsWith('video/')
    const price = media.price ?? (isVideo ? DEFAULT_VIDEO_PRICE : DEFAULT_IMAGE_PRICE)
    const submitterShare = Math.floor(price * (100 - PLATFORM_SHARE_PERCENT) / 100)
    const platformShare = price - submitterShare

    // Generate download token
    const downloadToken = nanoid(32)

    // Create purchase record
    const purchase = await prisma.mediaPurchase.create({
      data: {
        email: `${phoneNumber}@carrier.saleaks.co.za`, // Store phone as pseudo-email
        fileId: mediaType === 'file' ? mediaId : null,
        liveMediaId: mediaType === 'live' ? mediaId : null,
        amount: price,
        currency: 'ZAR',
        downloadToken,
        submitterShare,
        platformShare,
        status: 'PENDING',
        paymentProvider: 'carrier_billing',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours for carrier billing
      }
    })

    // Check if carrier billing is configured
    if (!isCarrierBillingEnabled()) {
      // Demo mode - simulate successful payment
      console.log('[Carrier Billing] Demo mode - simulating payment')

      return NextResponse.json({
        success: true,
        data: {
          purchaseId: purchase.id,
          carrier: carrier,
          carrierName: getCarrierDisplayName(carrier),
          price: price / 100,
          downloadToken,
          demoMode: true,
          message: `Demo mode: In production, you would receive an SMS from ${getCarrierDisplayName(carrier)} to confirm the R${(price / 100).toFixed(2)} payment.`,
        }
      })
    }

    // Initiate carrier billing payment
    const paymentResult = await initiateCarrierPayment({
      phoneNumber,
      amount: price,
      description: `SA Leaks - Watermark-free ${isVideo ? 'video' : 'image'}`,
      mediaId: media.id,
      mediaType,
      reference: purchase.id,
    })

    if (!paymentResult.success) {
      // Update purchase as failed
      await prisma.mediaPurchase.update({
        where: { id: purchase.id },
        data: { status: 'FAILED' }
      })

      return NextResponse.json(
        { success: false, error: paymentResult.error || 'Failed to initiate carrier payment' },
        { status: 400 }
      )
    }

    // Update purchase with transaction ID
    await prisma.mediaPurchase.update({
      where: { id: purchase.id },
      data: { paymentId: paymentResult.transactionId }
    })

    return NextResponse.json({
      success: true,
      data: {
        purchaseId: purchase.id,
        transactionId: paymentResult.transactionId,
        carrier: paymentResult.carrier,
        carrierName: getCarrierDisplayName(paymentResult.carrier!),
        status: paymentResult.status,
        confirmationRequired: paymentResult.confirmationRequired,
        message: paymentResult.message,
        price: price / 100,
        downloadToken,
        // Return URL for checking status
        statusUrl: `/api/media/purchase?token=${downloadToken}`,
      }
    })
  } catch (error) {
    console.error('[Carrier Purchase] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create purchase' },
      { status: 500 }
    )
  }
}

// GET /api/media/carrier-purchase - Check carrier billing availability
export async function GET() {
  return NextResponse.json({
    enabled: isCarrierBillingEnabled(),
    carriers: ['vodacom', 'mtn', 'telkom', 'cellc'],
  })
}
