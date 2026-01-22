import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashEmail, encryptEmail, generateVerifyToken, generateUnsubscribeToken } from '@/lib/crypto'

// POST /api/subscribe - Create a new subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, categoryId, province, frequency } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Validate frequency
    const validFrequencies = ['INSTANT', 'DAILY', 'WEEKLY']
    if (frequency && !validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { success: false, error: 'Invalid frequency' },
        { status: 400 }
      )
    }

    // Check if category exists (if provided)
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      })
      if (!category) {
        return NextResponse.json(
          { success: false, error: 'Category not found' },
          { status: 400 }
        )
      }
    }

    const emailHash = hashEmail(email)

    // Check if already subscribed
    const existing = await prisma.subscription.findUnique({
      where: { emailHash },
    })

    if (existing) {
      // Update existing subscription
      await prisma.subscription.update({
        where: { emailHash },
        data: {
          categoryId: categoryId || null,
          province: province || null,
          frequency: frequency || 'DAILY',
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          message: existing.verified
            ? 'Subscription preferences updated'
            : 'Subscription updated. Please check your email to verify.',
          alreadyVerified: existing.verified,
        },
      })
    }

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        emailHash,
        encryptedEmail: encryptEmail(email),
        categoryId: categoryId || null,
        province: province || null,
        frequency: frequency || 'DAILY',
        verifyToken: generateVerifyToken(),
        unsubscribeToken: generateUnsubscribeToken(),
      },
    })

    // In production, send verification email here
    // For now, just return success
    // await sendVerificationEmail(email, subscription.verifyToken)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Please check your email to verify your subscription.',
        // In development, include token for testing
        ...(process.env.NODE_ENV === 'development' && {
          verifyToken: subscription.verifyToken,
        }),
      },
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

// GET /api/subscribe?token=xxx - Verify subscription
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    const action = request.nextUrl.searchParams.get('action')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    if (action === 'unsubscribe') {
      // Handle unsubscribe
      const subscription = await prisma.subscription.findUnique({
        where: { unsubscribeToken: token },
      })

      if (!subscription) {
        return NextResponse.json(
          { success: false, error: 'Invalid unsubscribe token' },
          { status: 404 }
        )
      }

      await prisma.subscription.delete({
        where: { id: subscription.id },
      })

      return NextResponse.json({
        success: true,
        data: { message: 'You have been unsubscribed successfully.' },
      })
    }

    // Handle verification
    const subscription = await prisma.subscription.findUnique({
      where: { verifyToken: token },
    })

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification token' },
        { status: 404 }
      )
    }

    if (subscription.verified) {
      return NextResponse.json({
        success: true,
        data: { message: 'Email already verified.' },
      })
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { verified: true },
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Email verified successfully! You will now receive alerts.' },
    })
  } catch (error) {
    console.error('Error verifying subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify subscription' },
      { status: 500 }
    )
  }
}
