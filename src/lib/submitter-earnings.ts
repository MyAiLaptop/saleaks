/**
 * Submitter Earnings System
 *
 * Handles crediting submitter accounts when their content is purchased
 */

import { prisma } from '@/lib/db'

interface CreditEarningParams {
  purchaseId: string
  mediaType: 'file' | 'live'
  mediaId: string
}

/**
 * Credit a submitter's account when their content is purchased
 *
 * Looks up the post/media, finds the linked submitter account,
 * and creates an earning record + updates their balance
 */
export async function creditSubmitterEarning(params: CreditEarningParams): Promise<{
  success: boolean
  credited: boolean
  accountId?: string
  amount?: number
  error?: string
}> {
  const { purchaseId, mediaType, mediaId } = params

  try {
    // Get the purchase details
    const purchase = await prisma.mediaPurchase.findUnique({
      where: { id: purchaseId },
    })

    if (!purchase) {
      return { success: false, credited: false, error: 'Purchase not found' }
    }

    if (purchase.status !== 'COMPLETED') {
      return { success: false, credited: false, error: 'Purchase not completed' }
    }

    // Find the post and submitter account
    let submitterAccountId: string | null = null
    let description: string = ''

    if (mediaType === 'live') {
      const media = await prisma.liveBillboardMedia.findUnique({
        where: { id: mediaId },
        include: {
          post: {
            select: {
              submitterAccountId: true,
              revenueShareEnabled: true,
              publicId: true,
            },
          },
        },
      })

      if (media?.post.submitterAccountId && media.post.revenueShareEnabled) {
        submitterAccountId = media.post.submitterAccountId
        description = `Live post ${media.post.publicId}: ${media.originalName}`
      }
    } else if (mediaType === 'file') {
      const file = await prisma.file.findUnique({
        where: { id: mediaId },
        include: {
          post: {
            select: {
              submitterAccountId: true,
              revenueShareEnabled: true,
              publicId: true,
            },
          },
        },
      })

      if (file?.post.submitterAccountId && file.post.revenueShareEnabled) {
        submitterAccountId = file.post.submitterAccountId
        description = `Post ${file.post.publicId}: ${file.originalName}`
      }
    }

    // If no submitter account linked, platform keeps all
    if (!submitterAccountId) {
      console.log(`[Earnings] No submitter account linked for purchase ${purchaseId}`)
      return { success: true, credited: false }
    }

    // Check if earning already credited (avoid duplicates)
    const existingEarning = await prisma.submitterEarning.findFirst({
      where: { purchaseId },
    })

    if (existingEarning) {
      console.log(`[Earnings] Already credited for purchase ${purchaseId}`)
      return { success: true, credited: true, accountId: existingEarning.accountId, amount: existingEarning.amount }
    }

    // Credit the submitter
    const earningAmount = purchase.submitterShare

    // Create earning record and update balance in a transaction
    const [earning] = await prisma.$transaction([
      prisma.submitterEarning.create({
        data: {
          accountId: submitterAccountId,
          purchaseId,
          amount: earningAmount,
          grossAmount: purchase.amount,
          description,
          status: 'AVAILABLE', // Immediately available for withdrawal
          availableAt: new Date(),
        },
      }),
      prisma.submitterAccount.update({
        where: { id: submitterAccountId },
        data: {
          balance: { increment: earningAmount },
          totalEarned: { increment: earningAmount },
        },
      }),
    ])

    console.log(`[Earnings] Credited R${(earningAmount / 100).toFixed(2)} to account ${submitterAccountId} for purchase ${purchaseId}`)

    return {
      success: true,
      credited: true,
      accountId: submitterAccountId,
      amount: earningAmount,
    }
  } catch (error) {
    console.error('[Earnings] Error crediting submitter:', error)
    return { success: false, credited: false, error: 'Failed to credit earnings' }
  }
}

/**
 * Get earnings summary for a submitter account
 */
export async function getEarningsSummary(accountId: string): Promise<{
  available: number
  pending: number
  withdrawn: number
  total: number
}> {
  const earnings = await prisma.submitterEarning.groupBy({
    by: ['status'],
    where: { accountId },
    _sum: { amount: true },
  })

  const summary = {
    available: 0,
    pending: 0,
    withdrawn: 0,
    total: 0,
  }

  for (const group of earnings) {
    const amount = group._sum.amount || 0
    summary.total += amount

    switch (group.status) {
      case 'AVAILABLE':
        summary.available += amount
        break
      case 'PENDING':
        summary.pending += amount
        break
      case 'WITHDRAWN':
        summary.withdrawn += amount
        break
    }
  }

  return summary
}
