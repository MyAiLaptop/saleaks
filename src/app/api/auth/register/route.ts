import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import {
  isValidSAPhoneNumber,
  formatPhoneNumber,
  detectCarrier,
  getCarrierDisplayName,
} from '@/lib/carrier-billing'
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

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * POST /api/auth/register
 *
 * Register a new submitter account with phone + password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, password, email, country = 'sa' } = body

    // Validate phone number
    if (!phoneNumber || !isValidSAPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid phone number' },
        { status: 400 }
      )
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.error },
        { status: 400 }
      )
    }

    // Validate email if provided
    if (email && !validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    const normalizedPhone = formatPhoneNumber(phoneNumber)
    const carrier = detectCarrier(phoneNumber)

    // Check if account already exists
    const existingAccount = await prisma.submitterAccount.findUnique({
      where: { phoneNumber: normalizedPhone },
    })

    if (existingAccount) {
      return NextResponse.json(
        { success: false, error: 'An account with this phone number already exists. Please sign in.' },
        { status: 409 }
      )
    }

    // Check if email is already in use
    if (email) {
      const existingEmail = await prisma.submitterAccount.findFirst({
        where: { email: email.toLowerCase() },
      })
      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: 'An account with this email already exists.' },
          { status: 409 }
        )
      }
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create the account
    const account = await prisma.submitterAccount.create({
      data: {
        phoneNumber: normalizedPhone,
        passwordHash,
        email: email ? email.toLowerCase() : null,
        country,
        carrier,
        verified: true, // Account is verified upon registration with password
        verifiedAt: new Date(),
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
        carrier: carrier,
        carrierName: carrier ? getCarrierDisplayName(carrier) : null,
        balance: account.balance,
        totalEarned: account.totalEarned,
        verified: account.verified,
        isNewAccount: true,
        sessionToken,
        message: 'Account created successfully!',
      },
    })
  } catch (error) {
    console.error('[Auth Register] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
