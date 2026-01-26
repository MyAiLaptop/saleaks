import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'
import {
  isValidSAPhoneNumber,
  formatPhoneNumber,
} from '@/lib/carrier-billing'

// Token expiry in hours
const RESET_TOKEN_EXPIRY_HOURS = 1

/**
 * POST /api/auth/forgot-password
 *
 * Request a password reset link sent to email
 * Can be requested with phone number or email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, email } = body

    // Must provide either phone or email
    if (!phoneNumber && !email) {
      return NextResponse.json(
        { success: false, error: 'Please provide your phone number or email' },
        { status: 400 }
      )
    }

    let account = null

    // Find account by phone number
    if (phoneNumber) {
      if (!isValidSAPhoneNumber(phoneNumber)) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid phone number' },
          { status: 400 }
        )
      }
      const normalizedPhone = formatPhoneNumber(phoneNumber)
      account = await prisma.submitterAccount.findUnique({
        where: { phoneNumber: normalizedPhone },
      })
    }

    // Find account by email
    if (!account && email) {
      account = await prisma.submitterAccount.findFirst({
        where: { email: email.toLowerCase() },
      })
    }

    // Always return success to prevent account enumeration
    // But only actually send email if account exists AND has email
    if (account && account.email) {
      // Generate reset token
      const resetToken = nanoid(32)
      const resetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

      // Save token to database
      await prisma.submitterAccount.update({
        where: { id: account.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        },
      })

      // Send reset email
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://spillnova.com'}/reset-password?token=${resetToken}`

      // TODO: Integrate email service (SendGrid, Resend, etc.)
      // For now, log the reset URL in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Password Reset] Reset URL:', resetUrl)
        console.log('[Password Reset] Token:', resetToken)
      }

      // In production, send actual email
      // await sendPasswordResetEmail(account.email, resetUrl)
    }

    // Return generic success message (don't reveal if account exists)
    return NextResponse.json({
      success: true,
      data: {
        message: 'If an account exists with that information and has an email on file, you will receive a password reset link shortly.',
      },
    })
  } catch (error) {
    console.error('[Auth Forgot Password] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
