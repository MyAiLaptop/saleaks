import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizeInput } from '@/lib/sanitize'

// Item conditions
const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'] as const

// GET - Get single listing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params

    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        OR: [
          { id: listingId },
          { publicId: listingId },
        ],
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            messages: true,
            favorites: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.marketplaceListing.update({
      where: { id: listing.id },
      data: { viewCount: { increment: 1 } },
    })

    // Check if viewer has favorited this listing
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    const userPhone = searchParams.get('userPhone')

    let isFavorited = false
    if (deviceId || userPhone) {
      const favorite = await prisma.marketplaceFavorite.findFirst({
        where: {
          listingId: listing.id,
          OR: [
            deviceId ? { deviceId } : {},
            userPhone ? { userPhone } : {},
          ].filter(c => Object.keys(c).length > 0),
        },
      })
      isFavorited = !!favorite
    }

    return NextResponse.json({
      success: true,
      data: {
        ...listing,
        sellerPhone: undefined, // Don't expose full phone
        sellerPhoneMasked: listing.sellerPhone
          ? listing.sellerPhone.slice(0, 4) + '****' + listing.sellerPhone.slice(-2)
          : null,
        hasPhone: !!listing.sellerPhone,
        isFavorited,
        messageCount: listing._count.messages,
        favoriteCount: listing._count.favorites,
      },
    })
  } catch (error) {
    console.error('[Marketplace] Error fetching listing:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listing' },
      { status: 500 }
    )
  }
}

// PUT - Update listing (seller only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params
    const body = await request.json()
    const {
      title,
      description,
      price,
      category,
      condition,
      province,
      city,
      status,
      sellerPhone,
      deviceId,
    } = body

    // Find the listing
    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        OR: [
          { id: listingId },
          { publicId: listingId },
        ],
      },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const isOwner =
      (sellerPhone && listing.sellerPhone === sellerPhone) ||
      (deviceId && listing.deviceId === deviceId)

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to edit this listing' },
        { status: 403 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (title !== undefined) {
      updateData.title = sanitizeInput(title).slice(0, 200)
    }

    if (description !== undefined) {
      updateData.description = sanitizeInput(description).slice(0, 5000)
    }

    if (price !== undefined) {
      const numericPrice = parseFloat(price)
      if (!isNaN(numericPrice) && numericPrice >= 0) {
        updateData.price = numericPrice
      }
    }

    if (category !== undefined) {
      updateData.category = category
    }

    if (condition !== undefined && CONDITIONS.includes(condition)) {
      updateData.condition = condition
    }

    if (province !== undefined) {
      updateData.province = province ? sanitizeInput(province).slice(0, 100) : null
    }

    if (city !== undefined) {
      updateData.city = city ? sanitizeInput(city).slice(0, 100) : null
    }

    if (status !== undefined && ['active', 'sold', 'removed'].includes(status)) {
      updateData.status = status
      // Set soldAt timestamp when marking as sold (for auto-cleanup after 3 days)
      if (status === 'sold') {
        updateData.soldAt = new Date()
      } else if (status === 'active') {
        // Clear soldAt if reactivating
        updateData.soldAt = null
      }
    }

    // Update the listing
    const updatedListing = await prisma.marketplaceListing.update({
      where: { id: listing.id },
      data: updateData,
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updatedListing,
        sellerPhone: undefined,
      },
    })
  } catch (error) {
    console.error('[Marketplace] Error updating listing:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update listing' },
      { status: 500 }
    )
  }
}

// DELETE - Remove listing (seller only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params
    const { searchParams } = new URL(request.url)
    const sellerPhone = searchParams.get('sellerPhone')
    const deviceId = searchParams.get('deviceId')

    // Find the listing
    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        OR: [
          { id: listingId },
          { publicId: listingId },
        ],
      },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const isOwner =
      (sellerPhone && listing.sellerPhone === sellerPhone) ||
      (deviceId && listing.deviceId === deviceId)

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this listing' },
        { status: 403 }
      )
    }

    // Soft delete - mark as removed
    await prisma.marketplaceListing.update({
      where: { id: listing.id },
      data: { status: 'removed' },
    })

    return NextResponse.json({
      success: true,
      message: 'Listing removed successfully',
    })
  } catch (error) {
    console.error('[Marketplace] Error deleting listing:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete listing' },
      { status: 500 }
    )
  }
}
