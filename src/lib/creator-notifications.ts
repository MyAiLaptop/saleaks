import { prisma } from '@/lib/db'

// View milestones that trigger notifications
const VIEW_MILESTONES = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000]

// Notification types
export type NotificationType =
  | 'VIEW_MILESTONE'
  | 'REACTION'
  | 'BID_PLACED'
  | 'PURCHASE'
  | 'AUCTION_WON'

interface CreateNotificationParams {
  accountId: string
  postId?: string
  postPublicId?: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
}

/**
 * Create a notification for a creator
 */
export async function createCreatorNotification(params: CreateNotificationParams) {
  try {
    return await prisma.creatorNotification.create({
      data: {
        accountId: params.accountId,
        postId: params.postId,
        postPublicId: params.postPublicId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data ? JSON.stringify(params.data) : null,
      },
    })
  } catch (error) {
    console.error('[Creator Notifications] Failed to create notification:', error)
    return null
  }
}

/**
 * Check if a view count has crossed a milestone and notify the creator
 * Returns the milestone if one was crossed, null otherwise
 */
export async function checkViewMilestone(
  postId: string,
  postPublicId: string,
  accountId: string,
  newViewCount: number
): Promise<number | null> {
  // Find the highest milestone this view count qualifies for
  const crossedMilestone = VIEW_MILESTONES.filter(m => newViewCount >= m).pop()

  if (!crossedMilestone) {
    return null
  }

  // Check if we've already notified about this milestone
  const existingNotification = await prisma.creatorNotification.findFirst({
    where: {
      accountId,
      postId,
      type: 'VIEW_MILESTONE',
      data: {
        contains: `"views":${crossedMilestone}`,
      },
    },
  })

  if (existingNotification) {
    return null // Already notified
  }

  // Create the notification
  const messages: Record<number, { title: string; message: string }> = {
    10: {
      title: 'Your video hit 10 views!',
      message: 'Your content is starting to get noticed. Keep creating!',
    },
    50: {
      title: '50 views and counting!',
      message: 'Your video is gaining traction. People are watching!',
    },
    100: {
      title: '100 views milestone! 🎉',
      message: 'Your content just hit triple digits! You\'re on the rise.',
    },
    500: {
      title: '500 views! You\'re trending!',
      message: 'Half a thousand people have seen your content. Keep it up!',
    },
    1000: {
      title: '1,000 views! 🚀',
      message: 'You\'ve reached 1K views! Your voice is being heard.',
    },
    5000: {
      title: '5,000 views! Going viral!',
      message: 'Incredible! 5K people have watched your content.',
    },
    10000: {
      title: '10K views! You\'re a star! ⭐',
      message: 'Ten thousand views! Your content is making waves.',
    },
    50000: {
      title: '50,000 views! Legendary!',
      message: 'You\'ve reached 50K views. You\'re making real impact!',
    },
    100000: {
      title: '100K views! 🏆',
      message: 'One hundred thousand views! You\'ve gone viral!',
    },
  }

  const msg = messages[crossedMilestone] || {
    title: `${crossedMilestone.toLocaleString()} views!`,
    message: 'Congratulations on reaching this milestone!',
  }

  await createCreatorNotification({
    accountId,
    postId,
    postPublicId,
    type: 'VIEW_MILESTONE',
    title: msg.title,
    message: msg.message,
    data: { views: crossedMilestone },
  })

  return crossedMilestone
}

/**
 * Notify creator when their content receives a reaction
 */
export async function notifyReaction(
  postId: string,
  postPublicId: string,
  accountId: string,
  emoji: string,
  totalReactions: number
) {
  // Only notify on certain reaction milestones to avoid spam
  const reactionMilestones = [1, 10, 25, 50, 100, 500]
  const crossedMilestone = reactionMilestones.filter(m => totalReactions >= m).pop()

  if (!crossedMilestone) return

  // Check if already notified for this milestone
  const existingNotification = await prisma.creatorNotification.findFirst({
    where: {
      accountId,
      postId,
      type: 'REACTION',
      data: {
        contains: `"milestone":${crossedMilestone}`,
      },
    },
  })

  if (existingNotification) return

  const title = crossedMilestone === 1
    ? `Someone reacted to your video! ${emoji}`
    : `${totalReactions} reactions on your video! ${emoji}`

  const message = crossedMilestone === 1
    ? 'Your content got its first reaction!'
    : `Your video has received ${totalReactions} reactions. People love it!`

  await createCreatorNotification({
    accountId,
    postId,
    postPublicId,
    type: 'REACTION',
    title,
    message,
    data: { emoji, totalReactions, milestone: crossedMilestone },
  })
}

/**
 * Notify creator when someone places a bid on their content
 */
export async function notifyBidPlaced(
  postId: string,
  postPublicId: string,
  accountId: string,
  bidAmount: number, // In cents
  bidderName?: string
) {
  const amountFormatted = `R${(bidAmount / 100).toFixed(2)}`
  const bidder = bidderName || 'A buyer'

  await createCreatorNotification({
    accountId,
    postId,
    postPublicId,
    type: 'BID_PLACED',
    title: `New bid: ${amountFormatted}! 💰`,
    message: `${bidder} placed a bid on your content. Your content has value!`,
    data: { bidAmount, bidderName },
  })
}

/**
 * Notify creator when their content is purchased
 */
export async function notifyPurchase(
  postId: string,
  postPublicId: string,
  accountId: string,
  amount: number, // Creator's share in cents
  buyerName?: string
) {
  const amountFormatted = `R${(amount / 100).toFixed(2)}`
  const buyer = buyerName || 'A newsroom'

  await createCreatorNotification({
    accountId,
    postId,
    postPublicId,
    type: 'PURCHASE',
    title: `You earned ${amountFormatted}! 🎉`,
    message: `${buyer} purchased your content. Check your balance!`,
    data: { amount, buyerName },
  })
}

/**
 * Notify creator when they win an auction
 */
export async function notifyAuctionWon(
  postId: string,
  postPublicId: string,
  accountId: string,
  finalAmount: number, // In cents
  winnerName?: string
) {
  const amountFormatted = `R${(finalAmount / 100).toFixed(2)}`
  const winner = winnerName || 'A buyer'

  await createCreatorNotification({
    accountId,
    postId,
    postPublicId,
    type: 'AUCTION_WON',
    title: `Auction ended: ${amountFormatted}! 🏆`,
    message: `${winner} won the auction for your content. Payment incoming!`,
    data: { finalAmount, winnerName },
  })
}

/**
 * Get unread notification count for a creator
 */
export async function getUnreadNotificationCount(accountId: string): Promise<number> {
  return prisma.creatorNotification.count({
    where: {
      accountId,
      isRead: false,
    },
  })
}
