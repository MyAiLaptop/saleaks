import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createOtp, sendOtpSms } from '@/lib/otp'
import {
  isValidSAPhoneNumber,
  formatPhoneNumber,
} from '@/lib/carrier-billing'

/**
 * POST /api/buyer/register
 *
 * Register a new buyer account or request login OTP
 * For newsrooms and media organizations to subscribe and bid on content
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, organizationName, email, contactPerson } = body

    // Validate phone number
    if (!phoneNumber || !isValidSAPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid South African phone number' },
        { status: 400 }
      )
    }

    const normalizedPhone = formatPhoneNumber(phoneNumber)

    // Check if account already exists
    const existingAccount = await prisma.buyerAccount.findUnique({
      where: { phoneNumber: normalizedPhone },
    })

    // Create OTP for verification/login
    const otpResult = await createOtp(normalizedPhone, existingAccount ? 'BUYER_LOGIN' : 'BUYER_VERIFY')

    if (!otpResult.success) {
      return NextResponse.json(
        { success: false, error: otpResult.error, cooldownRemaining: otpResult.cooldownRemaining },
        { status: 429 }
      )
    }

    // Store pending registration data in session/temp storage
    // For new accounts, we'll save the org details after OTP verification
    if (!existingAccount && (organizationName || email || contactPerson)) {
      // Store pending data for after verification
      // This could be improved with a proper temp storage solution
    }

    // Send OTP via SMS (in production)
    if (otpResult.code) {
      await sendOtpSms(normalizedPhone, otpResult.code, existingAccount ? 'BUYER_LOGIN' : 'BUYER_VERIFY')
    }

    return NextResponse.json({
      success: true,
      data: {
        isNewAccount: !existingAccount,
        existingOrganization: existingAccount?.organizationName || null,
        message: existingAccount
          ? `We sent a login code to your phone. Enter it to access your ${existingAccount.organizationName || 'buyer'} account.`
          : 'We sent a verification code to your phone. Enter it to create your buyer account.',
        // In development, include the code for testing
        ...(process.env.NODE_ENV !== 'production' && { devCode: otpResult.code }),
      },
    })
  } catch (error) {
    console.error('[Buyer Register] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
