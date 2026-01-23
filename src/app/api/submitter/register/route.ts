import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createOtp, sendOtpSms } from '@/lib/otp'
import {
  isValidSAPhoneNumber,
  formatPhoneNumber,
  detectCarrier,
  getCarrierDisplayName,
} from '@/lib/carrier-billing'

/**
 * POST /api/submitter/register
 *
 * Register a new submitter account or request login OTP
 * Only requires a phone number - sends OTP for verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber } = body

    // Validate phone number
    if (!phoneNumber || !isValidSAPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid South African phone number' },
        { status: 400 }
      )
    }

    const normalizedPhone = formatPhoneNumber(phoneNumber)
    const carrier = detectCarrier(phoneNumber)

    // Check if account already exists
    const existingAccount = await prisma.submitterAccount.findUnique({
      where: { phoneNumber: normalizedPhone },
    })

    // Create OTP for verification/login
    const otpResult = await createOtp(normalizedPhone, existingAccount ? 'LOGIN' : 'VERIFY_ACCOUNT')

    if (!otpResult.success) {
      return NextResponse.json(
        { success: false, error: otpResult.error, cooldownRemaining: otpResult.cooldownRemaining },
        { status: 429 }
      )
    }

    // Send OTP via SMS (in production)
    if (otpResult.code) {
      await sendOtpSms(normalizedPhone, otpResult.code, existingAccount ? 'LOGIN' : 'VERIFY_ACCOUNT')
    }

    return NextResponse.json({
      success: true,
      data: {
        isNewAccount: !existingAccount,
        carrier: carrier,
        carrierName: carrier ? getCarrierDisplayName(carrier) : null,
        message: existingAccount
          ? 'We sent a login code to your phone. Enter it to access your account.'
          : 'We sent a verification code to your phone. Enter it to create your account.',
        // In development, include the code for testing
        ...(process.env.NODE_ENV !== 'production' && { devCode: otpResult.code }),
      },
    })
  } catch (error) {
    console.error('[Submitter Register] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
