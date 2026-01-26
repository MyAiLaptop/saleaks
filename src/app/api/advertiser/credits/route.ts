import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

// Credit packages (in cents ZAR) - Affordable tiers for small businesses
const CREDIT_PACKAGES = {
  'STARTER': { credits: 5000, price: 5000, bonus: 0 },        // R50 = R50 credits (enough for 3x 1-day ads)
  'BASIC': { credits: 12000, price: 10000, bonus: 2000 },     // R100 = R120 credits (R20 bonus)
  'STANDARD': { credits: 25000, price: 20000, bonus: 5000 },  // R200 = R250 credits (R50 bonus)
  'PREMIUM': { credits: 65000, price: 50000, bonus: 15000 },  // R500 = R650 credits (R150 bonus)
  'ENTERPRISE': { credits: 140000, price: 100000, bonus: 40000 }, // R1000 = R1400 credits (R400 bonus)
}

type PackageType = keyof typeof CREDIT_PACKAGES

/**
 * GET /api/advertiser/credits
 * Get credit balance and transaction history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const advertiserId = searchParams.get('advertiserId')
    const sessionToken = searchParams.get('sessionToken')

    if (!advertiserId || !sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Missing advertiserId or sessionToken' },
        { status: 400 }
      )
    }

    // Verify session
    const advertiser = await prisma.advertiserAccount.findFirst({
      where: {
        id: advertiserId,
        sessionToken,
        sessionExpiresAt: { gt: new Date() },
      },
    })

    if (!advertiser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Get transaction history
    const transactions = await prisma.advertiserCreditTransaction.findMany({
      where: { advertiserId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      data: {
        balance: advertiser.creditBalance,
        totalSpent: advertiser.totalSpent,
        transactions,
        packages: CREDIT_PACKAGES,
      },
    })
  } catch (error) {
    console.error('[Advertiser Credits GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get credits' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/advertiser/credits
 * Initiate credit purchase with Flutterwave
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { advertiserId, sessionToken, packageType, paymentMethod } = body

    if (!advertiserId || !sessionToken || !packageType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate package type
    if (!CREDIT_PACKAGES[packageType as PackageType]) {
      return NextResponse.json(
        { success: false, error: 'Invalid package type' },
        { status: 400 }
      )
    }

    // Verify session
    const advertiser = await prisma.advertiserAccount.findFirst({
      where: {
        id: advertiserId,
        sessionToken,
        sessionExpiresAt: { gt: new Date() },
      },
    })

    if (!advertiser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    const selectedPackage = CREDIT_PACKAGES[packageType as PackageType]
    const totalCredits = selectedPackage.credits + selectedPackage.bonus
    const txRef = `ADV_CREDIT_${advertiserId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

    // Create pending transaction record
    await prisma.advertiserCreditTransaction.create({
      data: {
        advertiserId,
        type: 'CREDIT_PURCHASE',
        amount: totalCredits,
        balanceBefore: advertiser.creditBalance,
        balanceAfter: advertiser.creditBalance + totalCredits,
        referenceType: 'PAYMENT',
        referenceId: txRef,
        description: `Credit purchase: ${packageType} package`,
        status: 'PENDING',
      },
    })

    // Initialize Flutterwave payment
    const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY
    if (!FLW_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://saleaks.co.za'

    const paymentData = {
      tx_ref: txRef,
      amount: selectedPackage.price / 100, // Convert cents to Rands
      currency: 'ZAR',
      redirect_url: `${baseUrl}/advertiser/credits/callback`,
      customer: {
        email: advertiser.email || `${advertiser.phoneNumber}@spillnova.com`,
        phonenumber: advertiser.phoneNumber,
        name: advertiser.businessName || 'Advertiser',
      },
      customizations: {
        title: 'SpillNova Ad Credits',
        description: `${packageType} package - R${(totalCredits / 100).toFixed(0)} in credits`,
        logo: `${baseUrl}/logo.png`,
      },
      meta: {
        advertiserId,
        packageType,
        totalCredits,
        transactionType: 'ADVERTISER_CREDIT',
      },
    }

    const flwResponse = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLW_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })

    const flwResult = await flwResponse.json()

    if (flwResult.status !== 'success') {
      console.error('[Advertiser Credits] Flutterwave error:', flwResult)
      return NextResponse.json(
        { success: false, error: 'Failed to initialize payment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentUrl: flwResult.data.link,
        txRef,
        package: {
          type: packageType,
          credits: selectedPackage.credits,
          bonus: selectedPackage.bonus,
          total: totalCredits,
          price: selectedPackage.price,
        },
      },
    })
  } catch (error) {
    console.error('[Advertiser Credits POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initiate credit purchase' },
      { status: 500 }
    )
  }
}

// CREDIT_PACKAGES is used internally
