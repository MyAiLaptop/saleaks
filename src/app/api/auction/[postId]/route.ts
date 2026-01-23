import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/auction/[postId]
 *
 * Get auction status for a post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params

    const post = await prisma.liveBillboard.findFirst({
      where: {
        OR: [
          { id: postId },
          { publicId: postId },
        ],
      },
      select: {
        id: true,
        publicId: true,
        auctionEndsAt: true,
        auctionStatus: true,
        currentBid: true,
        bidCount: true,
        isExclusive: true,
        exclusiveBuyerName: true,
        soldAt: true,
        createdAt: true,
        bids: {
          orderBy: { amount: 'desc' },
          take: 10,
          select: {
            id: true,
            amount: true,
            bidderName: true,
            isWinning: true,
            createdAt: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Calculate time remaining
    let timeRemaining = 0
    let isActive = post.auctionStatus === 'ACTIVE'

    if (post.auctionEndsAt) {
      timeRemaining = Math.max(0, post.auctionEndsAt.getTime() - Date.now())
      if (timeRemaining === 0 && isActive) {
        isActive = false
      }
    }

    // Check if auction should be ended (but hasn't been processed yet)
    const shouldEnd = isActive && timeRemaining === 0

    return NextResponse.json({
      success: true,
      data: {
        postId: post.publicId,
        auctionStatus: shouldEnd ? 'ENDING' : post.auctionStatus,
        isActive: isActive && !shouldEnd,
        auctionEndsAt: post.auctionEndsAt,
        timeRemaining, // in milliseconds
        currentBid: post.currentBid,
        bidCount: post.bidCount,
        minimumBid: post.currentBid ? post.currentBid + 500 : 5000, // Current + R5, or R50 minimum
        isExclusive: post.isExclusive,
        exclusiveBuyerName: post.exclusiveBuyerName,
        soldAt: post.soldAt,
        recentBids: post.bids.map((bid) => ({
          id: bid.id,
          amount: bid.amount,
          bidderName: bid.bidderName || 'Anonymous Bidder',
          isWinning: bid.isWinning,
          createdAt: bid.createdAt,
        })),
        serverTime: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[Auction Status] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get auction status' },
      { status: 500 }
    )
  }
}
