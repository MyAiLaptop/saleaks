import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isValidSAPhoneNumber, formatPhoneNumber } from '@/lib/carrier-billing'

// Minimum bid amount in cents (R50)
const MINIMUM_BID = 5000

// Anti-sniping: if bid in last minute, extend by 2 minutes
const SNIPE_WINDOW_MS = 60 * 1000 // 1 minute
const SNIPE_EXTENSION_MS = 2 * 60 * 1000 // 2 minutes

/**
 * POST /api/auction/bid
 *
 * Place a bid on a post's exclusive rights
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, amount, phoneNumber, displayName, email } = body

    // Validate inputs
    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    if (!phoneNumber || !isValidSAPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: 'Valid SA phone number is required to bid' },
        { status: 400 }
      )
    }

    if (!amount || amount < MINIMUM_BID) {
      return NextResponse.json(
        { success: false, error: `Minimum bid is R${(MINIMUM_BID / 100).toFixed(2)}` },
        { status: 400 }
      )
    }

    const normalizedPhone = formatPhoneNumber(phoneNumber)

    // Get the post
    const post = await prisma.liveBillboard.findUnique({
      where: { id: postId },
      include: {
        bids: {
          where: { isWinning: true },
          take: 1,
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if auction is still active
    if (post.auctionStatus !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Auction has ended' },
        { status: 400 }
      )
    }

    if (post.auctionEndsAt && new Date() > post.auctionEndsAt) {
      return NextResponse.json(
        { success: false, error: 'Auction has expired' },
        { status: 400 }
      )
    }

    // Check bid is higher than current
    if (post.currentBid && amount <= post.currentBid) {
      return NextResponse.json(
        { success: false, error: `Bid must be higher than current bid of R${(post.currentBid / 100).toFixed(2)}` },
        { status: 400 }
      )
    }

    // Anti-sniping: check if bid is in last minute
    let newAuctionEndsAt = post.auctionEndsAt
    if (post.auctionEndsAt) {
      const timeRemaining = post.auctionEndsAt.getTime() - Date.now()
      if (timeRemaining <= SNIPE_WINDOW_MS && timeRemaining > 0) {
        // Extend auction by 2 minutes
        newAuctionEndsAt = new Date(Date.now() + SNIPE_EXTENSION_MS)
        console.log(`[Auction] Anti-snipe triggered for post ${postId}, extended to ${newAuctionEndsAt}`)
      }
    }

    // Create bid and update post in transaction
    const [bid] = await prisma.$transaction([
      // Create new bid
      prisma.auctionBid.create({
        data: {
          postId,
          bidderPhone: normalizedPhone,
          bidderName: displayName || null,
          bidderEmail: email || null,
          amount,
          isWinning: true,
        },
      }),
      // Mark previous winning bid as not winning
      prisma.auctionBid.updateMany({
        where: {
          postId,
          isWinning: true,
        },
        data: {
          isWinning: false,
        },
      }),
      // Update post with new current bid
      prisma.liveBillboard.update({
        where: { id: postId },
        data: {
          currentBid: amount,
          currentBidderId: normalizedPhone,
          bidCount: { increment: 1 },
          auctionEndsAt: newAuctionEndsAt,
        },
      }),
    ])

    // TODO: Notify previous highest bidder they've been outbid (via SMS)

    console.log(`[Auction] New bid on post ${postId}: R${(amount / 100).toFixed(2)} from ${normalizedPhone}`)

    return NextResponse.json({
      success: true,
      data: {
        bidId: bid.id,
        amount,
        isHighestBid: true,
        auctionEndsAt: newAuctionEndsAt,
        message: newAuctionEndsAt !== post.auctionEndsAt
          ? 'Bid placed! Auction extended due to late bid.'
          : 'Bid placed! You are the highest bidder.',
      },
    })
  } catch (error) {
    console.error('[Auction Bid] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to place bid' },
      { status: 500 }
    )
  }
}
