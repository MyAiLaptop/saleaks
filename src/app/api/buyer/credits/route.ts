import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { CREDIT_PACKAGES, formatCredits } from '@/lib/credits'

/**
 * GET /api/buyer/credits
 *
 * Get buyer's credit balance and transaction history
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const buyerId = cookieStore.get('buyer_id')?.value

    if (!buyerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const buyer = await prisma.buyerAccount.findUnique({
      where: { id: buyerId },
      select: {
        id: true,
        creditBalance: true,
        creditTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            type: true,
            amount: true,
            balanceBefore: true,
            balanceAfter: true,
            description: true,
            createdAt: true,
          },
        },
      },
    })

    if (!buyer) {
      return NextResponse.json(
        { success: false, error: 'Buyer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: buyer.creditBalance,
        transactions: buyer.creditTransactions,
      },
    })
  } catch (error) {
    console.error('[Credits] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credits' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/buyer/credits
 *
 * Purchase credits - initiate payment
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const buyerId = cookieStore.get('buyer_id')?.value

    if (!buyerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { packageId, paymentMethod } = body

    // Validate package
    const creditPackage = CREDIT_PACKAGES.find(p => p.id === packageId)
    if (!creditPackage) {
      return NextResponse.json(
        { success: false, error: 'Invalid credit package' },
        { status: 400 }
      )
    }

    const buyer = await prisma.buyerAccount.findUnique({
      where: { id: buyerId },
    })

    if (!buyer) {
      return NextResponse.json(
        { success: false, error: 'Buyer not found' },
        { status: 404 }
      )
    }

    // For demo/development, auto-complete purchase
    if (process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true') {
      // Add credits immediately
      const totalCredits = creditPackage.credits + creditPackage.bonus

      await prisma.$transaction([
        prisma.buyerAccount.update({
          where: { id: buyerId },
          data: {
            creditBalance: { increment: totalCredits },
            totalSpent: { increment: creditPackage.price },
          },
        }),
        prisma.creditTransaction.create({
          data: {
            buyerId,
            type: 'PURCHASE',
            amount: totalCredits,
            balanceBefore: buyer.creditBalance,
            balanceAfter: buyer.creditBalance + totalCredits,
            referenceType: 'DEMO',
            referenceId: `demo_${Date.now()}`,
            description: `Purchased ${creditPackage.name} package (${formatCredits(creditPackage.credits)} + ${formatCredits(creditPackage.bonus)} bonus)`,
          },
        }),
      ])

      return NextResponse.json({
        success: true,
        data: {
          demoMode: true,
          message: `Credits added! Your new balance is ${formatCredits(buyer.creditBalance + totalCredits)}`,
          newBalance: buyer.creditBalance + totalCredits,
          creditsAdded: totalCredits,
        },
      })
    }

    // Production: initiate payment
    if (paymentMethod === 'payfast') {
      // TODO: Integrate PayFast
      return NextResponse.json({
        success: true,
        data: {
          paymentUrl: process.env.PAYFAST_URL || 'https://sandbox.payfast.co.za/eng/process',
          paymentData: {
            merchant_id: process.env.PAYFAST_MERCHANT_ID,
            merchant_key: process.env.PAYFAST_MERCHANT_KEY,
            amount: (creditPackage.price / 100).toFixed(2),
            item_name: `Leakpoint Credits - ${creditPackage.name}`,
            custom_str1: buyerId,
            custom_str2: packageId,
          },
        },
      })
    } else if (paymentMethod === 'carrier') {
      // TODO: Integrate carrier billing
      return NextResponse.json({
        success: false,
        error: 'Carrier billing not yet available for credit purchases',
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid payment method',
    }, { status: 400 })
  } catch (error) {
    console.error('[Credits Purchase] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initiate purchase' },
      { status: 500 }
    )
  }
}
