import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

/**
 * GET /api/buyer/bids
 *
 * Get buyer's bid history, won auctions, and active bids
 */
export async function GET(request: NextRequest) {
  try {
    // Get buyer session
    const cookieStore = await cookies()
    const buyerId = cookieStore.get('buyer_id')?.value

    if (!buyerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get buyer account
    const buyer = await prisma.buyerAccount.findUnique({
      where: { id: buyerId },
    })

    if (!buyer) {
      return NextResponse.json(
        { success: false, error: 'Buyer not found' },
        { status: 404 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get('filter') || 'all' // all, active, won, outbid

    // Get all bids for this buyer's phone number
    const bidsWhere: any = {
      bidderPhone: buyer.phoneNumber,
    }

    // Filter conditions
    if (filter === 'active') {
      bidsWhere.post = {
        auctionStatus: 'ACTIVE',
        auctionEndsAt: { gt: new Date() },
      }
    } else if (filter === 'won') {
      bidsWhere.isWinning = true
      bidsWhere.post = {
        auctionStatus: 'ENDED',
      }
    } else if (filter === 'outbid') {
      bidsWhere.isWinning = false
      bidsWhere.post = {
        auctionStatus: 'ACTIVE',
      }
    }

    const bids = await prisma.auctionBid.findMany({
      where: bidsWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          select: {
            id: true,
            publicId: true,
            content: true,
            category: true,
            province: true,
            city: true,
            currentBid: true,
            bidCount: true,
            auctionStatus: true,
            auctionEndsAt: true,
            isExclusive: true,
            media: {
              take: 1,
              select: {
                thumbnailPath: true,
                watermarkedPath: true,
                mimeType: true,
              },
            },
          },
        },
      },
    })

    // Group bids by post to get unique auctions
    const auctionMap = new Map<string, any>()

    for (const bid of bids) {
      const postId = bid.post.id
      const existing = auctionMap.get(postId)

      if (!existing || bid.amount > existing.myHighestBid) {
        const isWinning = bid.isWinning && bid.amount === bid.post.currentBid
        const status = getAuctionStatusForBuyer(bid.post, isWinning)

        auctionMap.set(postId, {
          postId: bid.post.publicId,
          internalId: bid.post.id,
          content: bid.post.content.substring(0, 100) + (bid.post.content.length > 100 ? '...' : ''),
          category: bid.post.category,
          province: bid.post.province,
          city: bid.post.city,
          thumbnail: bid.post.media[0]?.thumbnailPath || bid.post.media[0]?.watermarkedPath || null,
          mediaType: bid.post.media[0]?.mimeType?.startsWith('video/') ? 'video' : 'image',
          currentBid: bid.post.currentBid || 0,
          myHighestBid: bid.amount,
          isWinning,
          bidCount: bid.post.bidCount || 0,
          auctionStatus: bid.post.auctionStatus,
          auctionEndsAt: bid.post.auctionEndsAt,
          timeRemaining: bid.post.auctionEndsAt
            ? Math.max(0, bid.post.auctionEndsAt.getTime() - Date.now())
            : 0,
          buyerStatus: status,
          lastBidAt: bid.createdAt,
        })
      }
    }

    // Convert to array and apply filter
    let auctionsArray = Array.from(auctionMap.values())

    if (filter === 'active') {
      auctionsArray = auctionsArray.filter(a => a.auctionStatus === 'ACTIVE' && a.timeRemaining > 0)
    } else if (filter === 'won') {
      auctionsArray = auctionsArray.filter(a => a.buyerStatus === 'won')
    } else if (filter === 'outbid') {
      auctionsArray = auctionsArray.filter(a => a.buyerStatus === 'outbid')
    }

    // Calculate stats
    const stats = {
      activeBids: auctionsArray.filter(a => a.auctionStatus === 'ACTIVE' && a.timeRemaining > 0).length,
      winning: auctionsArray.filter(a => a.isWinning && a.auctionStatus === 'ACTIVE').length,
      outbid: auctionsArray.filter(a => !a.isWinning && a.auctionStatus === 'ACTIVE').length,
      won: auctionsArray.filter(a => a.buyerStatus === 'won').length,
      totalBidAmount: auctionsArray.reduce((sum, a) => sum + a.myHighestBid, 0),
    }

    return NextResponse.json({
      success: true,
      data: {
        auctions: auctionsArray,
        stats,
      },
    })
  } catch (error) {
    console.error('[Buyer Bids] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bids' },
      { status: 500 }
    )
  }
}

function getAuctionStatusForBuyer(post: any, isWinning: boolean): string {
  if (post.auctionStatus === 'ENDED') {
    return isWinning ? 'won' : 'lost'
  }

  if (post.auctionEndsAt && new Date() > post.auctionEndsAt) {
    return isWinning ? 'won' : 'lost'
  }

  return isWinning ? 'winning' : 'outbid'
}
