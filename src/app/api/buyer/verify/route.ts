import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyOtp } from '@/lib/otp'
import {
  isValidSAPhoneNumber,
  formatPhoneNumber,
} from '@/lib/carrier-billing'
import { nanoid } from 'nanoid'

/**
 * POST /api/buyer/verify
 *
 * Verify OTP and create/login to buyer account
 * Returns a session token for future requests
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, code, organizationName, email, contactPerson } = body

    // Validate inputs
    if (!phoneNumber || !isValidSAPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number' },
        { status: 400 }
      )
    }

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Please enter the 6-digit code' },
        { status: 400 }
      )
    }

    const normalizedPhone = formatPhoneNumber(phoneNumber)

    // Check if account exists
    const existingAccount = await prisma.buyerAccount.findUnique({
      where: { phoneNumber: normalizedPhone },
    })

    // Verify OTP
    const verifyResult = await verifyOtp(
      normalizedPhone,
      code,
      existingAccount ? 'BUYER_LOGIN' : 'BUYER_VERIFY'
    )

    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, error: verifyResult.error },
        { status: 400 }
      )
    }

    let account

    if (existingAccount) {
      // Existing account - update if new details provided
      if (organizationName || email || contactPerson) {
        account = await prisma.buyerAccount.update({
          where: { id: existingAccount.id },
          data: {
            ...(organizationName && { organizationName }),
            ...(email && { email }),
            ...(contactPerson && { contactPerson }),
          },
        })
      } else {
        account = existingAccount
      }
    } else {
      // New account - create it
      account = await prisma.buyerAccount.create({
        data: {
          phoneNumber: normalizedPhone,
          organizationName: organizationName || null,
          email: email || null,
          contactPerson: contactPerson || null,
          verified: true,
          verifiedAt: new Date(),
          subscriptionTier: 'FREE',
          subscriptionStatus: 'ACTIVE',
        },
      })
    }

    // Generate a session token
    const sessionToken = nanoid(32)

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      data: {
        accountId: account.id,
        phoneNumber: account.phoneNumber,
        organizationName: account.organizationName,
        email: account.email,
        subscriptionTier: account.subscriptionTier,
        subscriptionStatus: account.subscriptionStatus,
        totalPurchases: account.totalPurchases,
        totalSpent: account.totalSpent,
        auctionsWon: account.auctionsWon,
        verified: account.verified,
        isNewAccount: !existingAccount,
      },
    })

    // Set session cookie (httpOnly for security)
    response.cookies.set('buyer_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    // Store buyer ID in cookie
    response.cookies.set('buyer_id', account.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    // Also store the phone number for easier verification
    response.cookies.set('buyer_phone', normalizedPhone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[Buyer Verify] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}
