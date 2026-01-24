import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/auction/active
 *
 * Get all active auctions with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const province = searchParams.get('province')
    const sortBy = searchParams.get('sortBy') || 'ending_soon' // ending_soon, highest_bid, newest, most_bids
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause
    const where: any = {
      auctionStatus: 'ACTIVE',
      auctionEndsAt: {
        gt: new Date(), // Not expired
      },
      status: 'LIVE', // Only live posts
    }

    if (category) {
      where.category = category
    }

    if (province) {
      where.province = province
    }

    // Determine sort order
    let orderBy: any = {}
    switch (sortBy) {
      case 'ending_soon':
        orderBy = { auctionEndsAt: 'asc' }
        break
      case 'highest_bid':
        orderBy = { currentBid: 'desc' }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'most_bids':
        orderBy = { bidCount: 'desc' }
        break
      default:
        orderBy = { auctionEndsAt: 'asc' }
    }

    // Get total count
    const total = await prisma.liveBillboard.count({ where })

    // Get auctions with media preview
    const auctions = await prisma.liveBillboard.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        publicId: true,
        content: true,
        category: true,
        province: true,
        city: true,
        displayName: true,
        currentBid: true,
        bidCount: true,
        auctionEndsAt: true,
        auctionStatus: true,
        viewCount: true,
        createdAt: true,
        media: {
          take: 1,
          select: {
            id: true,
            mimeType: true,
            watermarkedPath: true,
            thumbnailPath: true,
          },
        },
        bids: {
          where: { isWinning: true },
          take: 1,
          select: {
            bidderName: true,
          },
        },
      },
    })

    // Format response
    const formattedAuctions = auctions.map((auction) => ({
      id: auction.id,
      publicId: auction.publicId,
      content: auction.content.substring(0, 150) + (auction.content.length > 150 ? '...' : ''),
      category: auction.category,
      province: auction.province,
      city: auction.city,
      submitterName: auction.displayName || 'Anonymous',
      currentBid: auction.currentBid || 0,
      minimumBid: auction.currentBid ? auction.currentBid + 500 : 5000, // +R5 or R50 minimum
      bidCount: auction.bidCount || 0,
      highestBidder: auction.bids[0]?.bidderName || null,
      auctionEndsAt: auction.auctionEndsAt,
      timeRemaining: auction.auctionEndsAt
        ? Math.max(0, auction.auctionEndsAt.getTime() - Date.now())
        : 0,
      viewCount: auction.viewCount,
      createdAt: auction.createdAt,
      thumbnail: auction.media[0]?.thumbnailPath || auction.media[0]?.watermarkedPath || null,
      mediaType: auction.media[0]?.mimeType?.startsWith('video/') ? 'video' : 'image',
      hasMedia: auction.media.length > 0,
    }))

    return NextResponse.json({
      success: true,
      data: {
        auctions: formattedAuctions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('[Active Auctions] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch active auctions' },
      { status: 500 }
    )
  }
}
