import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import {
  isValidSAPhoneNumber,
  formatPhoneNumber,
} from '@/lib/carrier-billing'

/**
 * POST /api/advertiser/register
 * Register a new advertiser account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, password, businessName, email } = body

    // Validate phone number
    if (!phoneNumber || !isValidSAPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid South African phone number' },
        { status: 400 }
      )
    }

    // Validate password
    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const normalizedPhone = formatPhoneNumber(phoneNumber)

    // Check if account already exists
    const existingAccount = await prisma.advertiserAccount.findUnique({
      where: { phoneNumber: normalizedPhone },
    })

    if (existingAccount) {
      return NextResponse.json(
        { success: false, error: 'An account with this phone number already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create account
    const account = await prisma.advertiserAccount.create({
      data: {
        phoneNumber: normalizedPhone,
        passwordHash,
        businessName: businessName || null,
        email: email || null,
        verified: false,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        accountId: account.id,
        phoneNumber: account.phoneNumber,
        businessName: account.businessName,
        creditBalance: account.creditBalance,
        message: 'Account created successfully! You can now log in.',
      },
    })
  } catch (error) {
    console.error('[Advertiser Register] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
