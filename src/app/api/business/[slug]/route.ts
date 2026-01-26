import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/business/[slug]
 * Get public business profile by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Business slug required' },
        { status: 400 }
      )
    }

    const business = await prisma.businessProfile.findUnique({
      where: {
        publicId: slug,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        publicId: true,
        name: true,
        description: true,
        logo: true,
        phone: true,
        whatsapp: true,
        email: true,
        website: true,
        province: true,
        city: true,
        serviceAreas: true,
        categories: true,
        facebook: true,
        twitter: true,
        instagram: true,
        tiktok: true,
        status: true,
        totalViews: true,
        createdAt: true,
      },
    })

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      )
    }

    // Track profile view (fire and forget)
    prisma.businessProfile.update({
      where: { id: business.id },
      data: { totalViews: { increment: 1 } },
    }).catch(err => console.error('[Business Profile] Failed to track view:', err))

    return NextResponse.json({
      success: true,
      data: { business },
    })
  } catch (error) {
    console.error('[Business Profile GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get business profile' },
      { status: 500 }
    )
  }
}
