import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { creditSubmitterEarning } from '@/lib/submitter-earnings'
import { deductForAuctionWin, formatCredits } from '@/lib/credits'

/**
 * POST /api/auction/end
 *
 * End an auction and process the winner (if any)
 * - Deducts credits from winner's account
 * - Creates WonAuction record for download access
 * - Credits submitter with 50% share
 *
 * Can be called by:
 * 1. Cron job to process expired auctions
 * 2. Manual trigger
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId } = body

    // If no postId, process all expired auctions
    if (!postId) {
      const result = await processExpiredAuctions()
      return NextResponse.json({
        success: true,
        data: result,
      })
    }

    // Process single auction
    const result = await processSingleAuction(postId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Auction End] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to end auction' },
      { status: 500 }
    )
  }
}

/**
 * Process a single auction by postId
 */
async function processSingleAuction(postId: string) {
  // Get the post with winning bid
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
    return { success: false, error: 'Post not found' }
  }

  // Check if auction has ended
  if (post.auctionEndsAt && new Date() < post.auctionEndsAt) {
    return {
      success: false,
      error: 'Auction has not ended yet',
      endsAt: post.auctionEndsAt,
    }
  }

  // Already processed?
  if (post.auctionStatus === 'SOLD' || post.auctionStatus === 'ENDED') {
    return {
      success: true,
      data: {
        status: post.auctionStatus,
        message: 'Auction already processed',
      },
    }
  }

  // No winning bid - move to public sale
  if (post.bids.length === 0) {
    await prisma.liveBillboard.update({
      where: { id: post.id },
      data: {
        auctionStatus: 'ENDED',
        isExclusive: false,
      },
    })

    console.log(`[Auction] Post ${postId} moved to public sale (no bids)`)

    return {
      success: true,
      data: {
        status: 'PUBLIC_SALE',
        message: 'No bids received. Content is now available for public purchase.',
      },
    }
  }

  // Has winning bid - process winner
  const winningBid = post.bids[0]

  // Find buyer account
  const buyer = await prisma.buyerAccount.findUnique({
    where: { phoneNumber: winningBid.bidderPhone },
  })

  if (!buyer) {
    console.error(`[Auction] Winner buyer account not found: ${winningBid.bidderPhone}`)
    return {
      success: false,
      error: 'Winner buyer account not found',
    }
  }

  // Check buyer has sufficient credits
  if (buyer.creditBalance < winningBid.amount) {
    console.error(`[Auction] Winner has insufficient credits: ${formatCredits(buyer.creditBalance)} < ${formatCredits(winningBid.amount)}`)
    // This shouldn't happen since we validate on bid, but handle gracefully
    // Mark auction as failed and move to public sale
    await prisma.liveBillboard.update({
      where: { id: post.id },
      data: {
        auctionStatus: 'ENDED',
        isExclusive: false,
      },
    })

    return {
      success: false,
      error: 'Winner has insufficient credits. Content moved to public sale.',
    }
  }

  // Deduct credits from winner
  const creditResult = await deductForAuctionWin(
    buyer.id,
    winningBid.amount,
    post.id,
    post.content.substring(0, 50)
  )

  if (!creditResult.success) {
    console.error(`[Auction] Failed to deduct credits: ${creditResult.error}`)
    return {
      success: false,
      error: 'Failed to process payment',
    }
  }

  // Create WonAuction record for download access
  const { nanoid } = await import('nanoid')
  const downloadToken = nanoid(32)
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year

  const wonAuction = await prisma.wonAuction.create({
    data: {
      buyerId: buyer.id,
      postId: post.id,
      winningBid: winningBid.amount,
      downloadToken,
      maxDownloads: 99,
      expiresAt,
    },
  })

  // Update post as sold exclusively
  await prisma.$transaction([
    prisma.liveBillboard.update({
      where: { id: post.id },
      data: {
        auctionStatus: 'SOLD',
        isExclusive: true,
        exclusiveBuyerId: winningBid.bidderPhone,
        exclusiveBuyerName: winningBid.bidderName || buyer.organizationName || 'Media Organization',
        soldAt: new Date(),
      },
    }),
    prisma.auctionBid.update({
      where: { id: winningBid.id },
      data: {
        isWinner: true,
        paymentStatus: 'PAID',
      },
    }),
    prisma.buyerAccount.update({
      where: { id: buyer.id },
      data: {
        auctionsWon: { increment: 1 },
        totalSpent: { increment: winningBid.amount },
      },
    }),
  ])

  // Credit submitter (50% revenue share)
  if (post.submitterAccountId && post.media[0]) {
    const submitterShare = Math.floor(winningBid.amount * 0.5)

    // Create a purchase record for tracking
    const purchase = await prisma.mediaPurchase.create({
      data: {
        email: winningBid.bidderEmail || buyer.email || 'auction@spillnova.com',
        amount: winningBid.amount,
        submitterShare,
        platformShare: winningBid.amount - submitterShare,
        status: 'COMPLETED',
        paymentProvider: 'credits',
        paymentId: wonAuction.id,
        liveMediaId: post.media[0].id,
        downloadToken,
        downloadsUsed: 0,
        maxDownloads: 99,
        expiresAt,
      },
    })

    await creditSubmitterEarning({
      purchaseId: purchase.id,
      mediaType: 'live',
      mediaId: post.media[0].id,
    })

    console.log(`[Auction] Credited submitter ${formatCredits(submitterShare)} for post ${postId}`)
  }

  console.log(`[Auction] Post ${postId} sold exclusively to ${buyer.organizationName || buyer.phoneNumber} for ${formatCredits(winningBid.amount)}`)

  return {
    success: true,
    data: {
      status: 'SOLD',
      isExclusive: true,
      buyer: winningBid.bidderName || buyer.organizationName || 'Media Organization',
      amount: winningBid.amount,
      downloadToken,
    },
  }
}

/**
 * Process all expired auctions (called by cron)
 */
async function processExpiredAuctions() {
  const now = new Date()

  // Find all active auctions that have expired
  const expiredAuctions = await prisma.liveBillboard.findMany({
    where: {
      auctionStatus: 'ACTIVE',
      auctionEndsAt: { lt: now },
    },
    select: {
      id: true,
      publicId: true,
    },
  })

  let processed = 0
  let sold = 0
  let publicSale = 0
  let failed = 0

  for (const post of expiredAuctions) {
    const result = await processSingleAuction(post.id)

    processed++
    if (result.success) {
      if (result.data?.status === 'SOLD') {
        sold++
      } else if (result.data?.status === 'PUBLIC_SALE') {
        publicSale++
      }
    } else {
      failed++
    }
  }

  console.log(`[Auction Cron] Processed ${processed} auctions: ${sold} sold, ${publicSale} to public sale, ${failed} failed`)

  return {
    processed,
    sold,
    publicSale,
    failed,
  }
}
