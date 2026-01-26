import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Get user's favorited listings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    const userPhone = searchParams.get('userPhone')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    if (!deviceId && !userPhone) {
      return NextResponse.json(
        { success: false, error: 'Device ID or phone number is required' },
        { status: 400 }
      )
    }

    // Build where clause for favorites
    const whereClause: Record<string, unknown> = {
      OR: [
        deviceId ? { deviceId } : {},
        userPhone ? { userPhone } : {},
      ].filter(c => Object.keys(c).length > 0),
    }

    // Get favorites with listings
    const [favorites, total] = await Promise.all([
      prisma.marketplaceFavorite.findMany({
        where: whereClause,
        include: {
          listing: {
            include: {
              images: {
                orderBy: { order: 'asc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.marketplaceFavorite.count({ where: whereClause }),
    ])

    // Filter out listings that are no longer active and format response
    const activeFavorites = favorites
      .filter(f => f.listing.status === 'active')
      .map(f => ({
        favoriteId: f.id,
        favoritedAt: f.createdAt,
        listing: {
          ...f.listing,
          sellerPhone: undefined,
          hasPhone: !!f.listing.sellerPhone,
        },
      }))

    return NextResponse.json({
      success: true,
      data: {
        favorites: activeFavorites,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    })
  } catch (error) {
    console.error('[Marketplace] Error fetching favorites:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch favorites' },
      { status: 500 }
    )
  }
}
