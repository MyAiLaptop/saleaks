import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

// Password requirements
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 128

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be less than ${MAX_PASSWORD_LENGTH} characters` }
  }
  // Check for at least one number and one letter
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter and one number' }
  }
  return { valid: true }
}

/**
 * POST /api/auth/reset-password
 *
 * Reset password using the token from forgot-password email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    // Validate inputs
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Reset token is required' },
        { status: 400 }
      )
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.error },
        { status: 400 }
      )
    }

    // Find account with this reset token
    const account = await prisma.submitterAccount.findUnique({
      where: { passwordResetToken: token },
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (!account.passwordResetExpires || account.passwordResetExpires < new Date()) {
      // Clear the expired token
      await prisma.submitterAccount.update({
        where: { id: account.id },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      })

      return NextResponse.json(
        { success: false, error: 'Reset link has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12)

    // Update the account
    await prisma.submitterAccount.update({
      where: { id: account.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        loginAttempts: 0,
        lockedUntil: null,
        verified: true,
        verifiedAt: account.verifiedAt || new Date(),
      },
    })

    // Generate a session token so user is logged in after reset
    const sessionToken = nanoid(32)

    return NextResponse.json({
      success: true,
      data: {
        accountId: account.id,
        phoneNumber: account.phoneNumber,
        email: account.email,
        sessionToken,
        message: 'Password reset successfully! You are now signed in.',
      },
    })
  } catch (error) {
    console.error('[Auth Reset Password] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/reset-password
 *
 * Validate a reset token (check if it's valid and not expired)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find account with this reset token
    const account = await prisma.submitterAccount.findUnique({
      where: { passwordResetToken: token },
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Invalid reset link' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (!account.passwordResetExpires || account.passwordResetExpires < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Reset link has expired' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        phoneNumber: account.phoneNumber.slice(0, 6) + '****', // Partially masked
      },
    })
  } catch (error) {
    console.error('[Auth Validate Token] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to validate token' },
      { status: 500 }
    )
  }
}
