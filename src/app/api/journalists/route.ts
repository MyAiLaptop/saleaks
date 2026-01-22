import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashEmail, encryptEmail, generateContactToken } from '@/lib/crypto'
import { sanitizeInput } from '@/lib/sanitize'

// POST /api/journalists - Register as a journalist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, outlet, role } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      )
    }

    if (!outlet) {
      return NextResponse.json(
        { success: false, error: 'News outlet/organization is required' },
        { status: 400 }
      )
    }

    const emailHash = hashEmail(email)

    // Check if already registered
    const existing = await prisma.journalist.findUnique({
      where: { emailHash },
    })

    if (existing) {
      return NextResponse.json({
        success: false,
        error: existing.status === 'VERIFIED'
          ? 'This email is already verified as a journalist.'
          : 'This email is already pending verification.',
      }, { status: 409 })
    }

    // Create journalist registration
    const journalist = await prisma.journalist.create({
      data: {
        emailHash,
        encryptedEmail: encryptEmail(email),
        outlet: sanitizeInput(outlet).substring(0, 200),
        role: role ? sanitizeInput(role).substring(0, 100) : null,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Registration submitted. You will be notified once verified.',
        id: journalist.id,
      },
    })
  } catch (error) {
    console.error('Error registering journalist:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to register' },
      { status: 500 }
    )
  }
}

// GET /api/journalists?token=xxx - Verify journalist access
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Access token is required' },
        { status: 400 }
      )
    }

    const journalist = await prisma.journalist.findUnique({
      where: { accessToken: token },
    })

    if (!journalist) {
      return NextResponse.json(
        { success: false, error: 'Invalid access token' },
        { status: 404 }
      )
    }

    if (journalist.status !== 'VERIFIED') {
      return NextResponse.json(
        { success: false, error: 'Account not verified' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        outlet: journalist.outlet,
        role: journalist.role,
        verifiedAt: journalist.verifiedAt,
        allowDirectContact: journalist.allowDirectContact,
      },
    })
  } catch (error) {
    console.error('Error verifying journalist:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify' },
      { status: 500 }
    )
  }
}
