import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'
import {
  initializeFlutterwavePayment,
  generateTxRef,
  getFlutterwaveCurrency,
  getFlutterwavePaymentMethods,
} from '@/lib/flutterwave'

// Default prices in cents (ZAR)
const DEFAULT_IMAGE_PRICE = 100 // R1
const DEFAULT_VIDEO_PRICE = 300 // R3
const PLATFORM_SHARE_PERCENT = 50 // 50% to platform, 50% to submitter

interface InitializeRequest {
  email: string
  phoneNumber?: string
  mediaType: 'file' | 'live'
  mediaId: string
  countryCode?: string // For currency selection
}

// Helper to normalize phone number
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('27')) return `+${digits}`
  if (digits.startsWith('0')) return `+27${digits.slice(1)}`
  return `+${digits}`
}

/**
 * POST /api/payments/flutterwave/initialize
 * Initialize a Flutterwave payment for media purchase
 */
export async function POST(request: NextRequest) {
  try {
    const body: InitializeRequest = await request.json()
    const { email, phoneNumber, mediaType, mediaId, countryCode = 'ZA' } = body

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email required' },
        { status: 400 }
      )
    }

    const normalizedPhone = phoneNumber ? normalizePhone(phoneNumber) : null

    // Get media details and price
    let media: {
      id: string
      mimeType: string
      price: number | null
      forSale: boolean
      originalName: string
    } | null = null
    let postPublicId: string | null = null
    let submitterPhone: string | null = null

    if (mediaType === 'file') {
      const file = await prisma.file.findUnique({
        where: { id: mediaId },
        select: {
          id: true,
          mimeType: true,
          price: true,
          forSale: true,
          originalName: true,
          post: {
            select: {
              publicId: true,
              submitterAccount: { select: { phoneNumber: true } },
            },
          },
        },
      })
      if (file) {
        media = file
        postPublicId = file.post.publicId
        submitterPhone = file.post.submitterAccount?.phoneNumber || null
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
          post: {
            select: {
              publicId: true,
              submitterPhone: true,
              submitterAccount: { select: { phoneNumber: true } },
            },
          },
        },
      })
      if (liveMedia) {
        media = liveMedia
        postPublicId = liveMedia.post.publicId
        submitterPhone =
          liveMedia.post.submitterPhone ||
          liveMedia.post.submitterAccount?.phoneNumber ||
          null
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

    // Check if this is the content owner - FREE DOWNLOAD
    const isOwner = normalizedPhone && submitterPhone && normalizedPhone === submitterPhone

    if (isOwner) {
      const downloadToken = nanoid(32)

      const purchase = await prisma.mediaPurchase.create({
        data: {
          email,
          phoneNumber: normalizedPhone,
          fileId: mediaType === 'file' ? mediaId : null,
          liveMediaId: mediaType === 'live' ? mediaId : null,
          amount: 0,
          currency: 'ZAR',
          downloadToken,
          submitterShare: 0,
          platformShare: 0,
          isOwnerDownload: true,
          status: 'COMPLETED',
          maxDownloads: 99,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          paymentProvider: 'owner',
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          message: 'This is your content! Download it for free.',
          purchaseId: purchase.id,
          downloadToken,
          price: 0,
          isOwnerDownload: true,
          canDownloadNow: true,
        },
      })
    }

    // Calculate price
    const isVideo = media.mimeType.startsWith('video/')
    const price = media.price ?? (isVideo ? DEFAULT_VIDEO_PRICE : DEFAULT_IMAGE_PRICE)

    // Revenue split
    const submitterShare = submitterPhone
      ? Math.floor((price * (100 - PLATFORM_SHARE_PERCENT)) / 100)
      : 0
    const platformShare = price - submitterShare

    // Generate tokens
    const downloadToken = nanoid(32)
    const txRef = generateTxRef('SN')

    // Determine currency based on country
    const currency = getFlutterwaveCurrency(countryCode)
    const paymentMethods = getFlutterwavePaymentMethods(countryCode)

    // Create pending purchase record
    const purchase = await prisma.mediaPurchase.create({
      data: {
        email,
        phoneNumber: normalizedPhone,
        fileId: mediaType === 'file' ? mediaId : null,
        liveMediaId: mediaType === 'live' ? mediaId : null,
        amount: price,
        currency,
        downloadToken,
        submitterShare,
        platformShare,
        isOwnerDownload: false,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        paymentProvider: 'flutterwave',
        paymentId: txRef,
      },
    })

    // Initialize Flutterwave payment
    const flutterwaveResult = await initializeFlutterwavePayment({
      amount: price,
      currency,
      email,
      phone: normalizedPhone || undefined,
      txRef,
      title: 'SpillNova Media Purchase',
      description: `Watermark-free ${isVideo ? 'Video' : 'Image'}: ${media.originalName.substring(0, 50)}`,
      meta: {
        purchaseId: purchase.id,
        mediaType,
        mediaId,
        downloadToken,
      },
      paymentOptions: paymentMethods,
    })

    if (!flutterwaveResult.success || !flutterwaveResult.paymentUrl) {
      // Clean up the pending purchase
      await prisma.mediaPurchase.delete({ where: { id: purchase.id } })

      return NextResponse.json(
        { success: false, error: flutterwaveResult.error || 'Failed to initialize payment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentUrl: flutterwaveResult.paymentUrl,
        txRef: flutterwaveResult.txRef,
        purchaseId: purchase.id,
        downloadToken,
        price: price / 100, // Return in currency units
        currency,
      },
    })
  } catch (error) {
    console.error('Error initializing Flutterwave payment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}
