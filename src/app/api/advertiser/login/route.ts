import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import {
  isValidSAPhoneNumber,
  formatPhoneNumber,
} from '@/lib/carrier-billing'
import { nanoid } from 'nanoid'

// Rate limiting constants
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 15
const SESSION_DURATION_DAYS = 30

/**
 * POST /api/advertiser/login
 * Login to advertiser account
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
    const account = await prisma.advertiserAccount.findUnique({
      where: { phoneNumber: normalizedPhone },
    })

    if (!account) {
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

    // Check if password is set
    if (!account.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please set a password for your account.',
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

      await prisma.advertiserAccount.update({
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

    // Generate session token and expiry
    const sessionToken = nanoid(32)
    const sessionExpiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)

    // Update account with session token and reset login attempts
    const updatedAccount = await prisma.advertiserAccount.update({
      where: { id: account.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        sessionToken,
        sessionExpiresAt,
      },
      include: {
        businessProfiles: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            publicId: true,
            name: true,
            description: true,
            logo: true,
            phone: true,
            whatsapp: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        sessionToken,
        advertiser: {
          id: updatedAccount.id,
          phoneNumber: updatedAccount.phoneNumber,
          businessName: updatedAccount.businessName,
          email: updatedAccount.email,
          creditBalance: updatedAccount.creditBalance,
          totalSpent: updatedAccount.totalSpent,
          verified: updatedAccount.verified,
          businessProfiles: updatedAccount.businessProfiles,
        },
        message: 'Signed in successfully!',
      },
    })
  } catch (error) {
    console.error('[Advertiser Login] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sign in' },
      { status: 500 }
    )
  }
}
