import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { creditSubmitterEarning } from '@/lib/submitter-earnings'

/**
 * POST /api/auction/end
 *
 * End an auction and process the winner (if any)
 * Can be called by:
 * 1. Cron job to process expired auctions
 * 2. Payment webhook after winning bidder pays
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, paymentConfirmed, paymentId } = body

    // If no postId, process all expired auctions
    if (!postId) {
      const result = await processExpiredAuctions()
      return NextResponse.json({
        success: true,
        data: result,
      })
    }

    // Get the post
    const post = await prisma.liveBillboard.findFirst({
      where: {
        OR: [
          { id: postId },
          { publicId: postId },
        ],
      },
      include: {
        bids: {
          where: { isWinning: true },
          take: 1,
        },
        media: {
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

    // If payment confirmed, finalize the exclusive sale
    if (paymentConfirmed && post.bids.length > 0) {
      const winningBid = post.bids[0]

      // Update post as sold exclusively
      await prisma.$transaction([
        prisma.liveBillboard.update({
          where: { id: post.id },
          data: {
            auctionStatus: 'SOLD',
            isExclusive: true,
            exclusiveBuyerId: winningBid.bidderPhone,
            exclusiveBuyerName: winningBid.bidderName || 'Media Organization',
            soldAt: new Date(),
          },
        }),
        prisma.auctionBid.update({
          where: { id: winningBid.id },
          data: {
            isWinner: true,
            paymentStatus: 'PAID',
            paymentId,
          },
        }),
      ])

      // Credit submitter (if revenue share enabled)
      if (post.submitterAccountId && post.media[0]) {
        const { nanoid } = await import('nanoid')
        const submitterShare = Math.floor(winningBid.amount * 0.5)

        // Create a purchase record for the auction sale
        const purchase = await prisma.mediaPurchase.create({
          data: {
            email: winningBid.bidderEmail || 'auction@saleaks.co.za',
            amount: winningBid.amount,
            submitterShare,
            platformShare: winningBid.amount - submitterShare,
            status: 'COMPLETED',
            paymentProvider: 'auction',
            paymentId,
            liveMediaId: post.media[0].id,
            downloadToken: nanoid(32),
            downloadsUsed: 0,
            maxDownloads: 99, // Unlimited for exclusive buyer
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year for exclusive
          },
        })

        await creditSubmitterEarning({
          purchaseId: purchase.id,
          mediaType: 'live',
          mediaId: post.media[0].id,
        })
      }

      console.log(`[Auction] Post ${postId} sold exclusively to ${winningBid.bidderName || winningBid.bidderPhone}`)

      return NextResponse.json({
        success: true,
        data: {
          status: 'SOLD',
          isExclusive: true,
          buyer: winningBid.bidderName || 'Media Organization',
          amount: winningBid.amount,
        },
      })
    }

    // Check if auction has expired
    if (post.auctionEndsAt && new Date() < post.auctionEndsAt) {
      return NextResponse.json(
        { success: false, error: 'Auction has not ended yet' },
        { status: 400 }
      )
    }

    // Auction ended - check for winning bid
    if (post.bids.length > 0) {
      // There's a winning bid - wait for payment
      return NextResponse.json({
        success: true,
        data: {
          status: 'AWAITING_PAYMENT',
          winningBid: {
            amount: post.bids[0].amount,
            bidder: post.bids[0].bidderName || 'Anonymous',
          },
          message: 'Awaiting payment from winning bidder',
        },
      })
    }

    // No bids - move to public sale
    await prisma.liveBillboard.update({
      where: { id: post.id },
      data: {
        auctionStatus: 'ENDED',
        isExclusive: false,
      },
    })

    console.log(`[Auction] Post ${postId} moved to public sale (no bids)`)

    return NextResponse.json({
      success: true,
      data: {
        status: 'PUBLIC_SALE',
        message: 'No bids received. Content is now available for public purchase.',
      },
    })
  } catch (error) {
    console.error('[Auction End] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to end auction' },
      { status: 500 }
    )
  }
}

/**
 * Process all expired auctions
 */
async function processExpiredAuctions() {
  const now = new Date()

  // Find all active auctions that have expired
  const expiredAuctions = await prisma.liveBillboard.findMany({
    where: {
      auctionStatus: 'ACTIVE',
      auctionEndsAt: { lt: now },
    },
    include: {
      bids: {
        where: { isWinning: true },
        take: 1,
      },
    },
  })

  let processed = 0
  let withBids = 0
  let noBids = 0

  for (const post of expiredAuctions) {
    if (post.bids.length > 0) {
      // Has winning bid - mark as awaiting payment
      // The winning bidder will be notified to complete payment
      withBids++
      // TODO: Send SMS to winning bidder to complete payment
    } else {
      // No bids - move to public sale
      await prisma.liveBillboard.update({
        where: { id: post.id },
        data: {
          auctionStatus: 'ENDED',
          isExclusive: false,
        },
      })
      noBids++
    }
    processed++
  }

  console.log(`[Auction Cron] Processed ${processed} expired auctions: ${withBids} with bids, ${noBids} to public sale`)

  return {
    processed,
    withBids,
    noBids,
  }
}
