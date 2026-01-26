import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'
import { sanitizeInput } from '@/lib/sanitize'

/**
 * GET /api/advertiser/profile
 * Get advertiser's business profiles
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const advertiserId = searchParams.get('advertiserId')

    if (!advertiserId) {
      return NextResponse.json(
        { success: false, error: 'Advertiser ID required' },
        { status: 400 }
      )
    }

    const profiles = await prisma.businessProfile.findMany({
      where: {
        advertiserId,
        status: 'ACTIVE',
      },
      include: {
        _count: {
          select: { videoAds: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: { profiles },
    })
  } catch (error) {
    console.error('[Advertiser Profile] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get profiles' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/advertiser/profile
 * Create a new business profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      advertiserId,
      name,
      description,
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

    // Validate required fields
    if (!advertiserId) {
      return NextResponse.json(
        { success: false, error: 'Advertiser ID required' },
        { status: 400 }
      )
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Business name is required (min 2 characters)' },
        { status: 400 }
      )
    }

    // Verify advertiser exists
    const advertiser = await prisma.advertiserAccount.findUnique({
      where: { id: advertiserId },
    })

    if (!advertiser) {
      return NextResponse.json(
        { success: false, error: 'Advertiser not found' },
        { status: 404 }
      )
    }

    // Generate URL-friendly slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const publicId = `${baseSlug}-${nanoid(6)}`

    // Create profile
    const profile = await prisma.businessProfile.create({
      data: {
        publicId,
        advertiserId,
        name: sanitizeInput(name),
        description: description ? sanitizeInput(description) : null,
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
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        profile,
        message: 'Business profile created successfully!',
      },
    })
  } catch (error) {
    console.error('[Advertiser Profile] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create profile' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/advertiser/profile
 * Update a business profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      profileId,
      advertiserId,
      name,
      description,
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

    if (!profileId || !advertiserId) {
      return NextResponse.json(
        { success: false, error: 'Profile ID and Advertiser ID required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const profile = await prisma.businessProfile.findFirst({
      where: {
        id: profileId,
        advertiserId,
      },
    })

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found or access denied' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = sanitizeInput(name)
    if (description !== undefined) updateData.description = description ? sanitizeInput(description) : null
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

    const updatedProfile = await prisma.businessProfile.update({
      where: { id: profileId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        profile: updatedProfile,
        message: 'Profile updated successfully!',
      },
    })
  } catch (error) {
    console.error('[Advertiser Profile] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
