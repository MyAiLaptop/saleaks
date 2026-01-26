import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizeInput } from '@/lib/sanitize'
import { nanoid } from 'nanoid'

function generatePublicId(name: string): string {
  // Convert name to URL-friendly slug
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30)

  // Add random suffix for uniqueness
  return `${slug}-${nanoid(6)}`
}

/**
 * GET /api/advertiser/business
 * Get business profiles for an advertiser
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const advertiserId = searchParams.get('advertiserId')
    const sessionToken = searchParams.get('sessionToken')
    const businessId = searchParams.get('businessId')

    // Get a specific business profile by ID (public)
    if (businessId && !advertiserId) {
      const business = await prisma.businessProfile.findUnique({
        where: { id: businessId, status: 'ACTIVE' },
      })

      if (!business) {
        return NextResponse.json(
          { success: false, error: 'Business profile not found' },
          { status: 404 }
        )
      }

      // Increment view count
      await prisma.businessProfile.update({
        where: { id: businessId },
        data: { totalViews: { increment: 1 } },
      })

      return NextResponse.json({
        success: true,
        data: { business },
      })
    }

    // Get all business profiles for an advertiser (authenticated)
    if (!advertiserId || !sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Missing advertiserId or sessionToken' },
        { status: 400 }
      )
    }

    // Verify session
    const advertiser = await prisma.advertiserAccount.findFirst({
      where: {
        id: advertiserId,
        sessionToken,
        sessionExpiresAt: { gt: new Date() },
      },
    })

    if (!advertiser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    const businesses = await prisma.businessProfile.findMany({
      where: {
        advertiserId,
        status: { not: 'DELETED' },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: { businesses },
    })
  } catch (error) {
    console.error('[Business Profile GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get business profiles' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/advertiser/business
 * Create a new business profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      advertiserId,
      sessionToken,
      name,
      description,
      logo,
      coverImage,
      introVideo,
      gallery,
      phone,
      whatsapp,
      email,
      website,
      province,
      city,
      serviceAreas,
      categories,
      facebook,
      instagram,
      twitter,
      tiktok,
    } = body

    if (!advertiserId || !sessionToken || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (advertiserId, sessionToken, name)' },
        { status: 400 }
      )
    }

    // Verify session
    const advertiser = await prisma.advertiserAccount.findFirst({
      where: {
        id: advertiserId,
        sessionToken,
        sessionExpiresAt: { gt: new Date() },
      },
    })

    if (!advertiser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Check limit (max 5 business profiles per advertiser)
    const existingCount = await prisma.businessProfile.count({
      where: {
        advertiserId,
        status: { not: 'DELETED' },
      },
    })

    if (existingCount >= 5) {
      return NextResponse.json(
        { success: false, error: 'Maximum of 5 business profiles allowed per account' },
        { status: 400 }
      )
    }

    // Generate unique public ID
    const publicId = generatePublicId(name)

    // Create business profile
    const business = await prisma.businessProfile.create({
      data: {
        publicId,
        advertiserId,
        name: sanitizeInput(name),
        description: description ? sanitizeInput(description) : null,
        logo: logo || null,
        coverImage: coverImage || null,
        introVideo: introVideo || null,
        gallery: gallery ? JSON.stringify(gallery) : null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        email: email || null,
        website: website || null,
        province: province || null,
        city: city || null,
        serviceAreas: serviceAreas ? JSON.stringify(serviceAreas) : null,
        categories: categories ? JSON.stringify(categories) : null,
        facebook: facebook || null,
        instagram: instagram || null,
        twitter: twitter || null,
        tiktok: tiktok || null,
        country: 'sa',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        business,
        message: 'Business profile created successfully!',
      },
    })
  } catch (error) {
    console.error('[Business Profile POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create business profile' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/advertiser/business
 * Update a business profile
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      advertiserId,
      sessionToken,
      businessId,
      name,
      description,
      logo,
      coverImage,
      introVideo,
      gallery,
      phone,
      whatsapp,
      email,
      website,
      province,
      city,
      serviceAreas,
      categories,
      facebook,
      instagram,
      twitter,
      tiktok,
    } = body

    if (!advertiserId || !sessionToken || !businessId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify session
    const advertiser = await prisma.advertiserAccount.findFirst({
      where: {
        id: advertiserId,
        sessionToken,
        sessionExpiresAt: { gt: new Date() },
      },
    })

    if (!advertiser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Verify business belongs to advertiser
    const existingBusiness = await prisma.businessProfile.findFirst({
      where: {
        id: businessId,
        advertiserId,
        status: { not: 'DELETED' },
      },
    })

    if (!existingBusiness) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found or access denied' },
        { status: 404 }
      )
    }

    // Build update data (only update provided fields)
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = sanitizeInput(name)
    if (description !== undefined) updateData.description = description ? sanitizeInput(description) : null
    if (logo !== undefined) updateData.logo = logo || null
    if (coverImage !== undefined) updateData.coverImage = coverImage || null
    if (introVideo !== undefined) updateData.introVideo = introVideo || null
    if (gallery !== undefined) updateData.gallery = gallery ? JSON.stringify(gallery) : null
    if (phone !== undefined) updateData.phone = phone || null
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp || null
    if (email !== undefined) updateData.email = email || null
    if (website !== undefined) updateData.website = website || null
    if (province !== undefined) updateData.province = province || null
    if (city !== undefined) updateData.city = city || null
    if (serviceAreas !== undefined) updateData.serviceAreas = serviceAreas ? JSON.stringify(serviceAreas) : null
    if (categories !== undefined) updateData.categories = categories ? JSON.stringify(categories) : null
    if (facebook !== undefined) updateData.facebook = facebook || null
    if (instagram !== undefined) updateData.instagram = instagram || null
    if (twitter !== undefined) updateData.twitter = twitter || null
    if (tiktok !== undefined) updateData.tiktok = tiktok || null

    const business = await prisma.businessProfile.update({
      where: { id: businessId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        business,
        message: 'Business profile updated successfully!',
      },
    })
  } catch (error) {
    console.error('[Business Profile PUT] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update business profile' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/advertiser/business
 * Soft delete a business profile
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const advertiserId = searchParams.get('advertiserId')
    const sessionToken = searchParams.get('sessionToken')
    const businessId = searchParams.get('businessId')

    if (!advertiserId || !sessionToken || !businessId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Verify session
    const advertiser = await prisma.advertiserAccount.findFirst({
      where: {
        id: advertiserId,
        sessionToken,
        sessionExpiresAt: { gt: new Date() },
      },
    })

    if (!advertiser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Verify business belongs to advertiser
    const existingBusiness = await prisma.businessProfile.findFirst({
      where: {
        id: businessId,
        advertiserId,
        status: { not: 'DELETED' },
      },
    })

    if (!existingBusiness) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found or access denied' },
        { status: 404 }
      )
    }

    // Check if there are active ads for this business
    const activeAds = await prisma.videoAd.count({
      where: {
        businessId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    })

    if (activeAds > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete business profile with ${activeAds} active ad(s). Wait for ads to expire or cancel them first.` },
        { status: 400 }
      )
    }

    // Soft delete
    await prisma.businessProfile.update({
      where: { id: businessId },
      data: { status: 'DELETED' },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Business profile deleted successfully',
      },
    })
  } catch (error) {
    console.error('[Business Profile DELETE] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete business profile' },
      { status: 500 }
    )
  }
}
