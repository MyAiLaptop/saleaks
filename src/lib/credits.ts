/**
 * Credit System for Buyer Accounts
 *
 * Buyers pre-purchase credits to bid on auctions.
 * When they win, credits are deducted instantly.
 * This prevents payment delays and ensures immediate content access.
 */

import { prisma } from '@/lib/db'

export type TransactionType = 'PURCHASE' | 'AUCTION_WIN' | 'REFUND' | 'BONUS' | 'ADMIN_ADJUST'

interface CreditTransactionParams {
  buyerId: string
  type: TransactionType
  amount: number // Positive for credits added, negative for spent
  referenceType?: string
  referenceId?: string
  description?: string
}

/**
 * Add or deduct credits from a buyer account
 */
export async function processCredits(params: CreditTransactionParams): Promise<{
  success: boolean
  newBalance?: number
  error?: string
}> {
  const { buyerId, type, amount, referenceType, referenceId, description } = params

  try {
    // Get current balance
    const buyer = await prisma.buyerAccount.findUnique({
      where: { id: buyerId },
      select: { creditBalance: true },
    })

    if (!buyer) {
      return { success: false, error: 'Buyer not found' }
    }

    const balanceBefore = buyer.creditBalance
    const balanceAfter = balanceBefore + amount

    // Check for insufficient funds (for negative amounts)
    if (balanceAfter < 0) {
      return { success: false, error: 'Insufficient credits' }
    }

    // Update balance and create transaction record
    await prisma.$transaction([
      prisma.buyerAccount.update({
        where: { id: buyerId },
        data: { creditBalance: balanceAfter },
      }),
      prisma.creditTransaction.create({
        data: {
          buyerId,
          type,
          amount,
          balanceBefore,
          balanceAfter,
          referenceType,
          referenceId,
          description,
        },
      }),
    ])

    return { success: true, newBalance: balanceAfter }
  } catch (error) {
    console.error('[Credits] Error processing credits:', error)
    return { success: false, error: 'Failed to process credits' }
  }
}

/**
 * Check if buyer has sufficient credits
 */
export async function hasCredits(buyerId: string, amount: number): Promise<boolean> {
  const buyer = await prisma.buyerAccount.findUnique({
    where: { id: buyerId },
    select: { creditBalance: true },
  })

  return buyer ? buyer.creditBalance >= amount : false
}

/**
 * Get buyer's current credit balance
 */
export async function getBalance(buyerId: string): Promise<number> {
  const buyer = await prisma.buyerAccount.findUnique({
    where: { id: buyerId },
    select: { creditBalance: true },
  })

  return buyer?.creditBalance || 0
}

/**
 * Deduct credits for auction win
 */
export async function deductForAuctionWin(
  buyerId: string,
  amount: number,
  postId: string,
  postTitle: string
): Promise<{ success: boolean; error?: string }> {
  return processCredits({
    buyerId,
    type: 'AUCTION_WIN',
    amount: -amount, // Negative to deduct
    referenceType: 'AUCTION',
    referenceId: postId,
    description: `Won auction: ${postTitle.substring(0, 50)}${postTitle.length > 50 ? '...' : ''}`,
  })
}

/**
 * Credit packages available for purchase
 */
export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 10000,     // R100 worth
    price: 10000,       // R100
    bonus: 0,
    description: 'Perfect for trying out the platform',
  },
  {
    id: 'basic',
    name: 'Basic',
    credits: 25000,     // R250 worth
    price: 22500,       // R225 (10% discount)
    bonus: 2500,        // R25 bonus
    description: '10% bonus credits',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 50000,     // R500 worth
    price: 42500,       // R425 (15% discount)
    bonus: 7500,        // R75 bonus
    description: '15% bonus credits',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 100000,    // R1000 worth
    price: 80000,       // R800 (20% discount)
    bonus: 20000,       // R200 bonus
    description: '20% bonus credits - best value',
    popular: false,
  },
]

/**
 * Format credits as currency string
 */
export function formatCredits(cents: number): string {
  return `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
