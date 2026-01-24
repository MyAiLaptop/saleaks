import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'
import crypto from 'crypto'

// Default prices in cents (ZAR)
const DEFAULT_IMAGE_PRICE = 100 // R1
const DEFAULT_VIDEO_PRICE = 300 // R3
const PLATFORM_SHARE_PERCENT = 50 // 50% to platform, 50% to submitter

// PayFast configuration
const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || ''
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || ''
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || ''
const PAYFAST_URL = process.env.NODE_ENV === 'production'
  ? 'https://www.payfast.co.za/eng/process'
  : 'https://sandbox.payfast.co.za/eng/process'

interface PurchaseRequest {
  email?: string      // Optional - either email or phone required
  phoneNumber?: string // Optional - for owner verification
  mediaType: 'file' | 'live'
  mediaId: string
}

// Generate PayFast signature
function generatePayFastSignature(data: Record<string, string>, passPhrase?: string): string {
  // Create parameter string (sorted alphabetically, URL encoded)
  const paramString = Object.keys(data)
    .sort()
    .filter(key => data[key] !== '')
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&')

  // Add passphrase if provided
  const stringToHash = passPhrase ? `${paramString}&passphrase=${encodeURIComponent(passPhrase)}` : paramString

  return crypto.createHash('md5').update(stringToHash).digest('hex')
}

// Helper to normalize phone number
function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  // Convert to +27 format
  if (digits.startsWith('27')) return `+${digits}`
  if (digits.startsWith('0')) return `+27${digits.slice(1)}`
  return `+${digits}`
}

// POST /api/media/purchase - Create a purchase session
export async function POST(request: NextRequest) {
  try {
    const body: PurchaseRequest = await request.json()
    const { email, phoneNumber, mediaType, mediaId } = body

    // Validate - need either email or phone
    if (!email && !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Email or phone number required' },
        { status: 400 }
      )
    }

    if (email && !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email required' },
        { status: 400 }
      )
    }

    const normalizedPhone = phoneNumber ? normalizePhone(phoneNumber) : null

    // Get media details and price, including submitter phone for owner verification
    let media: { id: string; mimeType: string; price: number | null; forSale: boolean; originalName: string } | null = null
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
              submitterAccount: { select: { phoneNumber: true } }
            }
          }
        }
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
              submitterAccount: { select: { phoneNumber: true } }
            }
          }
        }
      })
      if (liveMedia) {
        media = liveMedia
        postPublicId = liveMedia.post.publicId
        // Check both direct submitterPhone and linked account phone
        submitterPhone = liveMedia.post.submitterPhone || liveMedia.post.submitterAccount?.phoneNumber || null
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

    // CHECK IF THIS IS THE CONTENT OWNER - FREE DOWNLOAD!
    const isOwner = normalizedPhone && submitterPhone && normalizedPhone === submitterPhone

    if (isOwner) {
      // Owner downloading their own content - FREE!
      const downloadToken = nanoid(32)

      const purchase = await prisma.mediaPurchase.create({
        data: {
          email: email || null,
          phoneNumber: normalizedPhone,
          fileId: mediaType === 'file' ? mediaId : null,
          liveMediaId: mediaType === 'live' ? mediaId : null,
          amount: 0, // FREE for owner
          currency: 'ZAR',
          downloadToken,
          submitterShare: 0,
          platformShare: 0,
          isOwnerDownload: true,
          status: 'COMPLETED', // Immediately completed - no payment needed
          maxDownloads: 99, // Unlimited downloads for owner
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        }
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
        }
      })
    }

    // Calculate price - if submitter has no phone (anonymous), platform keeps 100%
    const isVideo = media.mimeType.startsWith('video/')
    const price = media.price ?? (isVideo ? DEFAULT_VIDEO_PRICE : DEFAULT_IMAGE_PRICE)

    // Revenue split: 50/50 if submitter provided phone, 100% to platform if anonymous
    const submitterShare = submitterPhone ? Math.floor(price * (100 - PLATFORM_SHARE_PERCENT) / 100) : 0
    const platformShare = price - submitterShare

    // Generate download token
    const downloadToken = nanoid(32)

    // Create purchase record
    const purchase = await prisma.mediaPurchase.create({
      data: {
        email: email || null,
        phoneNumber: normalizedPhone,
        fileId: mediaType === 'file' ? mediaId : null,
        liveMediaId: mediaType === 'live' ? mediaId : null,
        amount: price,
        currency: 'ZAR',
        downloadToken,
        submitterShare,
        platformShare,
        isOwnerDownload: false,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    })

    // If PayFast is configured, generate payment form data
    if (PAYFAST_MERCHANT_ID && PAYFAST_MERCHANT_KEY) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      // PayFast payment data
      const paymentData: Record<string, string> = {
        merchant_id: PAYFAST_MERCHANT_ID,
        merchant_key: PAYFAST_MERCHANT_KEY,
        return_url: `${appUrl}/download/${downloadToken}?success=true`,
        cancel_url: `${appUrl}/post/${postPublicId}?cancelled=true`,
        notify_url: `${appUrl}/api/media/payfast-webhook`,
        name_first: 'Media',
        name_last: 'Buyer',
        email_address: email || 'buyer@leakpoint.co.za', // Fallback email for PayFast
        m_payment_id: purchase.id,
        amount: (price / 100).toFixed(2), // Convert cents to Rands
        item_name: `Watermark-free ${isVideo ? 'Video' : 'Image'}: ${media.originalName.substring(0, 100)}`,
        item_description: 'High-quality media file without watermark',
        custom_str1: downloadToken,
        custom_str2: mediaType,
        custom_str3: mediaId,
      }

      // Generate signature
      const signature = generatePayFastSignature(paymentData, PAYFAST_PASSPHRASE || undefined)
      paymentData.signature = signature

      return NextResponse.json({
        success: true,
        data: {
          paymentUrl: PAYFAST_URL,
          paymentData,
          purchaseId: purchase.id,
          downloadToken,
        }
      })
    }

    // Without PayFast, return demo mode response
    return NextResponse.json({
      success: true,
      data: {
        message: 'Payment system not configured. Demo mode.',
        purchaseId: purchase.id,
        price: price / 100, // Return in Rands
        downloadToken,
        demoMode: true,
      }
    })
  } catch (error) {
    console.error('Error creating purchase:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create purchase' },
      { status: 500 }
    )
  }
}

// GET /api/media/purchase?token=xxx - Get purchase status
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token required' },
        { status: 400 }
      )
    }

    const purchase = await prisma.mediaPurchase.findUnique({
      where: { downloadToken: token },
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        downloadsUsed: true,
        maxDownloads: true,
        expiresAt: true,
        createdAt: true,
      }
    })

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    const isExpired = new Date() > purchase.expiresAt
    const downloadsRemaining = purchase.maxDownloads - purchase.downloadsUsed

    return NextResponse.json({
      success: true,
      data: {
        ...purchase,
        isExpired,
        downloadsRemaining,
        canDownload: purchase.status === 'COMPLETED' && !isExpired && downloadsRemaining > 0,
      }
    })
  } catch (error) {
    console.error('Error getting purchase:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get purchase' },
      { status: 500 }
    )
  }
}
