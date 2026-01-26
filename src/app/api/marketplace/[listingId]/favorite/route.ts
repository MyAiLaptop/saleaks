import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST - Toggle favorite status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params
    const body = await request.json()
    const { deviceId, userPhone } = body

    if (!deviceId && !userPhone) {
      return NextResponse.json(
        { success: false, error: 'Device ID or phone number is required' },
        { status: 400 }
      )
    }

    // Find the listing
    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        OR: [
          { id: listingId },
          { publicId: listingId },
        ],
        status: 'active',
      },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Check if already favorited
    const existingFavorite = await prisma.marketplaceFavorite.findFirst({
      where: {
        listingId: listing.id,
        OR: [
          deviceId ? { deviceId } : {},
          userPhone ? { userPhone } : {},
        ].filter(c => Object.keys(c).length > 0),
      },
    })

    if (existingFavorite) {
      // Remove favorite
      await prisma.marketplaceFavorite.delete({
        where: { id: existingFavorite.id },
      })

      // Decrement favorite count
      await prisma.marketplaceListing.update({
        where: { id: listing.id },
        data: { favoriteCount: { decrement: 1 } },
      })

      return NextResponse.json({
        success: true,
        data: { isFavorited: false },
        message: 'Removed from favorites',
      })
    } else {
      // Add favorite
      await prisma.marketplaceFavorite.create({
        data: {
          listingId: listing.id,
          deviceId,
          userPhone,
        },
      })

      // Increment favorite count
      await prisma.marketplaceListing.update({
        where: { id: listing.id },
        data: { favoriteCount: { increment: 1 } },
      })

      return NextResponse.json({
        success: true,
        data: { isFavorited: true },
        message: 'Added to favorites',
      })
    }
  } catch (error) {
    console.error('[Marketplace] Error toggling favorite:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update favorite status' },
      { status: 500 }
    )
  }
}
