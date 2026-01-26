import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import {
  isValidSAPhoneNumber,
  formatPhoneNumber,
  getCarrierDisplayName,
  type Carrier,
} from '@/lib/carrier-billing'
import { nanoid } from 'nanoid'

// Rate limiting constants
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 15

/**
 * POST /api/auth/login
 *
 * Login with phone number + password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, password } = body

    // Validate inputs
    if (!phoneNumber || !isValidSAPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid phone number' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Please enter your password' },
        { status: 400 }
      )
    }

    const normalizedPhone = formatPhoneNumber(phoneNumber)

    // Find the account
    const account = await prisma.submitterAccount.findUnique({
      where: { phoneNumber: normalizedPhone },
    })

    if (!account) {
      // Don't reveal whether account exists
      return NextResponse.json(
        { success: false, error: 'Invalid phone number or password' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (account.lockedUntil && account.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (account.lockedUntil.getTime() - Date.now()) / 60000
      )
      return NextResponse.json(
        {
          success: false,
          error: `Account is temporarily locked. Try again in ${remainingMinutes} minutes.`,
          locked: true,
          remainingMinutes,
        },
        { status: 429 }
      )
    }

    // Check if account has password set (might be old OTP-only account)
    if (!account.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'This account was created before password login was available. Please use the "Forgot Password" option to set a password.',
          needsPasswordSetup: true,
        },
        { status: 400 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, account.passwordHash)

    if (!isValidPassword) {
      // Increment failed attempts
      const newAttempts = account.loginAttempts + 1
      const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS

      await prisma.submitterAccount.update({
        where: { id: account.id },
        data: {
          loginAttempts: newAttempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
            : null,
        },
      })

      if (shouldLock) {
        return NextResponse.json(
          {
            success: false,
            error: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`,
            locked: true,
          },
          { status: 429 }
        )
      }

      const remainingAttempts = MAX_LOGIN_ATTEMPTS - newAttempts
      return NextResponse.json(
        {
          success: false,
          error: `Invalid phone number or password. ${remainingAttempts} attempts remaining.`,
        },
        { status: 401 }
      )
    }

    // Success - reset login attempts and update last login
    await prisma.submitterAccount.update({
      where: { id: account.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    })

    // Generate a session token
    const sessionToken = nanoid(32)

    return NextResponse.json({
      success: true,
      data: {
        accountId: account.id,
        phoneNumber: account.phoneNumber,
        email: account.email,
        carrier: account.carrier,
        carrierName: account.carrier ? getCarrierDisplayName(account.carrier as Carrier) : null,
        balance: account.balance,
        totalEarned: account.totalEarned,
        verified: account.verified,
        isNewAccount: false,
        sessionToken,
        message: 'Signed in successfully!',
      },
    })
  } catch (error) {
    console.error('[Auth Login] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sign in' },
      { status: 500 }
    )
  }
}
