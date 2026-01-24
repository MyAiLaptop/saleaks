import { prisma } from '@/lib/db'

/**
 * Utility function to notify buyers about new content
 * Can be imported and used directly in the live submission API
 */
export async function notifyBuyersOfNewContent(
  postId: string,
  category: string,
  content: string,
  province?: string
): Promise<number> {
  try {
    const buyers = await prisma.buyerAccount.findMany({
      where: {
        verified: true,
        notifyOnNewContent: true,
        subscriptionStatus: 'ACTIVE',
        OR: [
          { notifyCategories: null },
          { notifyCategories: { contains: category } },
        ],
      },
      select: {
        phoneNumber: true,
        organizationName: true,
      },
    })

    // TODO: Send SMS notifications
    for (const buyer of buyers) {
      const message = `New ${category} content on Leakpoint! Auction ends in 1 hour. ${process.env.NEXT_PUBLIC_APP_URL}/live/${postId}`
      console.log(`[Buyer Notify] SMS to ${buyer.organizationName || buyer.phoneNumber}: ${message}`)
    }

    return buyers.length
  } catch (error) {
    console.error('[Buyer Notify] Error:', error)
    return 0
  }
}
