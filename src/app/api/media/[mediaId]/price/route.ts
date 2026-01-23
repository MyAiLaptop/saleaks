import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Default prices in cents (ZAR)
const DEFAULT_IMAGE_PRICE = 100 // R1
const DEFAULT_VIDEO_PRICE = 300 // R3
const MIN_PRICE = 100 // R1 minimum
const MAX_PRICE = 1000000 // R10,000 maximum

interface PriceUpdateRequest {
  mediaType: 'file' | 'live'
  price: number | null // null = use default, number = custom price in cents
  forSale?: boolean
  sessionToken?: string // For live billboard posts (author verification)
}

// GET /api/media/[mediaId]/price - Get media price info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params
    const mediaType = request.nextUrl.searchParams.get('type') as 'file' | 'live'

    if (!mediaType || !['file', 'live'].includes(mediaType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid media type' },
        { status: 400 }
      )
    }

    let media: { price: number | null; forSale: boolean; mimeType: string } | null = null

    if (mediaType === 'file') {
      media = await prisma.file.findUnique({
        where: { id: mediaId },
        select: { price: true, forSale: true, mimeType: true }
      })
    } else {
      media = await prisma.liveBillboardMedia.findUnique({
        where: { id: mediaId },
        select: { price: true, forSale: true, mimeType: true }
      })
    }

    if (!media) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      )
    }

    const isVideo = media.mimeType.startsWith('video/')
    const defaultPrice = isVideo ? DEFAULT_VIDEO_PRICE : DEFAULT_IMAGE_PRICE
    const effectivePrice = media.price ?? defaultPrice

    return NextResponse.json({
      success: true,
      data: {
        price: media.price,
        effectivePrice,
        effectivePriceRands: effectivePrice / 100,
        forSale: media.forSale,
        isCustomPrice: media.price !== null,
        defaultPrice,
        defaultPriceRands: defaultPrice / 100,
      }
    })
  } catch (error) {
    console.error('Error getting price:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get price' },
      { status: 500 }
    )
  }
}

// PUT /api/media/[mediaId]/price - Update media price
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params
    const body: PriceUpdateRequest = await request.json()
    const { mediaType, price, forSale, sessionToken } = body

    if (!mediaType || !['file', 'live'].includes(mediaType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid media type' },
        { status: 400 }
      )
    }

    // Validate price if provided
    if (price !== null && price !== undefined) {
      if (typeof price !== 'number' || price < MIN_PRICE || price > MAX_PRICE) {
        return NextResponse.json(
          { success: false, error: `Price must be between R${MIN_PRICE/100} and R${MAX_PRICE/100}` },
          { status: 400 }
        )
      }
    }

    // Update based on media type
    if (mediaType === 'live') {
      // For live billboard, verify session token
      const media = await prisma.liveBillboardMedia.findUnique({
        where: { id: mediaId },
        include: { post: { select: { sessionToken: true } } }
      })

      if (!media) {
        return NextResponse.json(
          { success: false, error: 'Media not found' },
          { status: 404 }
        )
      }

      // Verify ownership
      if (media.post.sessionToken !== sessionToken) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - invalid session token' },
          { status: 403 }
        )
      }

      await prisma.liveBillboardMedia.update({
        where: { id: mediaId },
        data: {
          price: price ?? null,
          forSale: forSale ?? true,
        }
      })
    } else {
      // For regular files, require admin auth (check cookie/header)
      // For now, we'll just update it - add proper admin auth later
      const adminPassword = request.headers.get('x-admin-password')
      if (adminPassword !== process.env.ADMIN_PASSWORD) {
        return NextResponse.json(
          { success: false, error: 'Admin authentication required' },
          { status: 403 }
        )
      }

      await prisma.file.update({
        where: { id: mediaId },
        data: {
          price: price ?? null,
          forSale: forSale ?? true,
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Price updated successfully'
    })
  } catch (error) {
    console.error('Error updating price:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update price' },
      { status: 500 }
    )
  }
}
