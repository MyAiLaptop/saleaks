import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/db'
import { CREDIT_PACKAGES, formatCredits } from '@/lib/credits'
import { createPayFastPayment, isPayFastSandbox, PAYFAST_SANDBOX_CREDENTIALS } from '@/lib/payfast'

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
 * Purchase credits - initiate payment via PayFast
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

    // Demo mode - auto-complete purchase (for testing without payment)
    if (paymentMethod === 'demo' && (process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true')) {
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

    // PayFast payment
    if (paymentMethod === 'payfast') {
      // Generate unique payment ID
      const paymentId = `pay_${nanoid(16)}`

      // Create pending transaction record
      await prisma.creditTransaction.create({
        data: {
          buyerId,
          type: 'PURCHASE_PENDING',
          amount: creditPackage.credits + creditPackage.bonus,
          balanceBefore: buyer.creditBalance,
          balanceAfter: buyer.creditBalance, // Not added yet
          referenceType: 'PAYFAST',
          referenceId: paymentId,
          description: `Pending: ${creditPackage.name} package`,
        },
      })

      // Use sandbox credentials in development
      if (isPayFastSandbox()) {
        process.env.PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || PAYFAST_SANDBOX_CREDENTIALS.merchant_id
        process.env.PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || PAYFAST_SANDBOX_CREDENTIALS.merchant_key
      }

      // Create PayFast payment
      const payment = createPayFastPayment({
        paymentId,
        amount: creditPackage.price,
        itemName: `SpillNova Credits - ${creditPackage.name}`,
        itemDescription: `${formatCredits(creditPackage.credits)} credits${creditPackage.bonus > 0 ? ` + ${formatCredits(creditPackage.bonus)} bonus` : ''}`,
        buyerId,
        packageId,
        buyerEmail: buyer.email || undefined,
        buyerPhone: buyer.phoneNumber,
        buyerName: buyer.organizationName || buyer.contactPerson || undefined,
      })

      console.log(`[PayFast] Created payment ${paymentId} for buyer ${buyerId}, package ${packageId}, amount R${(creditPackage.price / 100).toFixed(2)}`)
      console.log(`[PayFast] Redirect URL: ${payment.redirectUrl}`)

      return NextResponse.json({
        success: true,
        data: {
          paymentMethod: 'payfast',
          paymentId,
          paymentUrl: payment.url,
          redirectUrl: payment.redirectUrl, // Direct redirect URL with GET params
          paymentData: payment.data,
          isSandbox: isPayFastSandbox(),
        },
      })
    }

    // Carrier billing (not implemented)
    if (paymentMethod === 'carrier') {
      return NextResponse.json({
        success: false,
        error: 'Carrier billing not yet available for credit purchases',
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid payment method. Use "payfast" or "demo".',
    }, { status: 400 })
  } catch (error) {
    console.error('[Credits Purchase] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initiate purchase' },
      { status: 500 }
    )
  }
}
