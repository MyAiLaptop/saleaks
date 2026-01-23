import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyOtp } from '@/lib/otp'
import {
  isValidSAPhoneNumber,
  formatPhoneNumber,
  detectCarrier,
} from '@/lib/carrier-billing'
import { nanoid } from 'nanoid'

/**
 * POST /api/submitter/verify
 *
 * Verify OTP and create/login to submitter account
 * Returns a session token for future requests
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, code } = body

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
    const existingAccount = await prisma.submitterAccount.findUnique({
      where: { phoneNumber: normalizedPhone },
    })

    // Verify OTP
    const verifyResult = await verifyOtp(
      normalizedPhone,
      code,
      existingAccount ? 'LOGIN' : 'VERIFY_ACCOUNT'
    )

    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, error: verifyResult.error },
        { status: 400 }
      )
    }

    let account

    if (existingAccount) {
      // Existing account - just verify
      account = existingAccount
    } else {
      // New account - create it
      const carrier = detectCarrier(phoneNumber)

      account = await prisma.submitterAccount.create({
        data: {
          phoneNumber: normalizedPhone,
          carrier,
          verified: true,
          verifiedAt: new Date(),
        },
      })
    }

    // Generate a session token (stored in cookie)
    // In a real app, you'd use proper JWT or session management
    const sessionToken = nanoid(32)

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      data: {
        accountId: account.id,
        phoneNumber: account.phoneNumber,
        carrier: account.carrier,
        balance: account.balance,
        totalEarned: account.totalEarned,
        verified: account.verified,
        isNewAccount: !existingAccount,
      },
    })

    // Set session cookie (httpOnly for security)
    response.cookies.set('submitter_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    // Store session token mapping (in production, use Redis or database)
    // For now, we'll include the account ID in the token itself (not secure for production)
    response.cookies.set('submitter_id', account.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[Submitter Verify] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}
