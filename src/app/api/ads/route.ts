import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizeInput } from '@/lib/sanitize'

// Ad pricing tiers (in cents ZAR) - Affordable for small businesses
const AD_PRICING = {
  '1_DAY': 1500,     // R15 for 1 day (try it out price)
  '3_DAYS': 3500,    // R35 for 3 days
  '7_DAYS': 7500,    // R75 for 7 days
  '30_DAYS': 20000,  // R200 for 30 days
}

type AdDuration = keyof typeof AD_PRICING

/**
 * GET /api/ads
 * Get ads for a specific post or all ads for an advertiser
 * Supports location-based targeting via deviceId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const advertiserId = searchParams.get('advertiserId')
    const businessId = searchParams.get('businessId')
    const deviceId = searchParams.get('deviceId') // For location-based targeting

    // Get active ad for a specific post (for display)
    if (postId) {
      const post = await prisma.liveBillboard.findUnique({
        where: { publicId: postId },
        select: { id: true },
      })

      if (!post) {
        return NextResponse.json(
          { success: false, error: 'Post not found' },
          { status: 404 }
        )
      }

      // Get user location if deviceId provided
      let userCity: string | null = null
      let userProvince: string | null = null
      if (deviceId) {
        const userProfile = await prisma.userProfile.findUnique({
          where: { deviceId },
          select: { city: true, province: true },
        })
        if (userProfile) {
          userCity = userProfile.city?.toLowerCase() || null
          userProvince = userProfile.province || null
        }
      }

      // Get all active ads for this post
      const activeAds = await prisma.videoAd.findMany({
        where: {
          postId: post.id,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
        },
        include: {
          business: {
            select: {
              id: true,
              publicId: true,
              name: true,
              logo: true,
              phone: true,
              whatsapp: true,
              city: true,
              province: true,
              serviceAreas: true,
            },
          },
        },
      })

      // Find the best matching ad based on location
      let activeAd = null
      for (const ad of activeAds) {
        const business = ad.business

        // If user has location and business has service areas, check for match
        if (userCity && business.serviceAreas) {
          const serviceAreas: string[] = JSON.parse(business.serviceAreas)
          const normalizedAreas = serviceAreas.map(a => a.toLowerCase())

          // Check if user's city matches any service area or business city
          const businessCity = business.city?.toLowerCase()
          if (
            normalizedAreas.includes(userCity) ||
            businessCity === userCity
          ) {
            activeAd = ad
            break // Prioritize location-matched ads
          }
        } else if (userProvince && business.province) {
          // Fall back to province matching
          if (business.province === userProvince) {
            activeAd = ad
            break
          }
        } else {
          // No location data - show any ad
          activeAd = ad
        }
      }

      // If no location match found but there are ads, show the first one
      // (for users without location data)
      if (!activeAd && activeAds.length > 0 && !userCity) {
        activeAd = activeAds[0]
      }

      // Increment impression count if ad exists
      if (activeAd) {
        await prisma.videoAd.update({
          where: { id: activeAd.id },
          data: { impressions: { increment: 1 } },
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          ad: activeAd,
          hasAd: !!activeAd,
          // Show "advertise here" pricing if no ad
          pricing: !activeAd ? AD_PRICING : null,
          // Debug info (can be removed in production)
          targeting: {
            userCity,
            userProvince,
            adsAvailable: activeAds.length,
          },
        },
      })
    }

    // Get all ads for an advertiser
    if (advertiserId) {
      const ads = await prisma.videoAd.findMany({
        where: {
          business: { advertiserId },
        },
        include: {
          business: {
            select: { name: true, publicId: true },
          },
          post: {
            select: {
              publicId: true,
              content: true,
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        success: true,
        data: { ads },
      })
    }

    // Get ads for a specific business profile
    if (businessId) {
      const ads = await prisma.videoAd.findMany({
        where: { businessId },
        include: {
          post: {
            select: {
              publicId: true,
              content: true,
              category: true,
              viewCount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        success: true,
        data: { ads },
      })
    }

    return NextResponse.json(
      { success: false, error: 'postId, advertiserId, or businessId required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Ads GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get ads' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ads
 * Purchase an ad slot on a video
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      postPublicId,
      businessId,
      advertiserId,
      hookQuestion,
      icon,
      duration, // '1_DAY', '3_DAYS', '7_DAYS', '30_DAYS'
    } = body

    // Validate required fields
    if (!postPublicId || !businessId || !advertiserId || !hookQuestion || !duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate duration
    if (!AD_PRICING[duration as AdDuration]) {
      return NextResponse.json(
        { success: false, error: 'Invalid duration. Use: 1_DAY, 3_DAYS, 7_DAYS, or 30_DAYS' },
        { status: 400 }
      )
    }

    // Get the post
    const post = await prisma.liveBillboard.findUnique({
      where: { publicId: postPublicId },
      select: {
        id: true,
        submitterAccountId: true,
      },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    // Check if there's already an active ad on this post
    const existingAd = await prisma.videoAd.findFirst({
      where: {
        postId: post.id,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    })

    if (existingAd) {
      return NextResponse.json(
        { success: false, error: 'This video already has an active ad. Try another video.' },
        { status: 409 }
      )
    }

    // Verify business profile belongs to advertiser
    const business = await prisma.businessProfile.findFirst({
      where: {
        id: businessId,
        advertiserId,
        status: 'ACTIVE',
      },
    })

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found or access denied' },
        { status: 404 }
      )
    }

    // Get advertiser account and check balance
    const advertiser = await prisma.advertiserAccount.findUnique({
      where: { id: advertiserId },
    })

    if (!advertiser) {
      return NextResponse.json(
        { success: false, error: 'Advertiser account not found' },
        { status: 404 }
      )
    }

    // Check if this is the advertiser's own video (self-promotion = 50% off)
    let isSelfPromotion = false
    if (post.submitterAccountId) {
      const submitter = await prisma.submitterAccount.findUnique({
        where: { id: post.submitterAccountId },
        select: { phoneNumber: true },
      })
      if (submitter && submitter.phoneNumber === advertiser.phoneNumber) {
        isSelfPromotion = true
      }
    }

    // Apply 50% discount for self-promotion
    const basePrice = AD_PRICING[duration as AdDuration]
    const price = isSelfPromotion ? Math.floor(basePrice / 2) : basePrice

    if (advertiser.creditBalance < price) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient credits. Required: R${(price / 100).toFixed(2)}, Available: R${(advertiser.creditBalance / 100).toFixed(2)}`,
          needsCredits: true,
          required: price,
          available: advertiser.creditBalance,
        },
        { status: 402 }
      )
    }

    // Calculate revenue split (50/50)
    const submitterShare = Math.floor(price / 2)
    const platformShare = price - submitterShare

    // Calculate expiry date
    const durationDays = parseInt(duration.split('_')[0])
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    // Create ad and deduct credits in a transaction
    const [ad, updatedAdvertiser] = await prisma.$transaction([
      // Create the ad
      prisma.videoAd.create({
        data: {
          postId: post.id,
          businessId,
          hookQuestion: sanitizeInput(hookQuestion),
          icon: icon || null,
          amountPaid: price,
          submitterShare,
          platformShare,
          expiresAt,
          status: 'ACTIVE',
        },
      }),
      // Deduct credits from advertiser
      prisma.advertiserAccount.update({
        where: { id: advertiserId },
        data: {
          creditBalance: { decrement: price },
          totalSpent: { increment: price },
        },
      }),
      // Record the transaction
      prisma.advertiserCreditTransaction.create({
        data: {
          advertiserId,
          type: 'AD_SPEND',
          amount: -price,
          balanceBefore: advertiser.creditBalance,
          balanceAfter: advertiser.creditBalance - price,
          referenceType: 'VIDEO_AD',
          description: `Ad on video for ${durationDays} day(s)${isSelfPromotion ? ' (self-promotion 50% off)' : ''}`,
        },
      }),
    ])

    // Credit the content creator if they have an account
    if (post.submitterAccountId) {
      await prisma.submitterAccount.update({
        where: { id: post.submitterAccountId },
        data: {
          balance: { increment: submitterShare },
          totalEarned: { increment: submitterShare },
        },
      })

      // Record earnings
      await prisma.submitterEarning.create({
        data: {
          accountId: post.submitterAccountId,
          purchaseId: ad.id, // Using ad ID as reference
          amount: submitterShare,
          grossAmount: price,
          description: `Ad revenue: "${hookQuestion.substring(0, 50)}..."`,
          status: 'AVAILABLE',
          availableAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ad,
        newBalance: updatedAdvertiser.creditBalance,
        isSelfPromotion,
        discount: isSelfPromotion ? 50 : 0,
        message: isSelfPromotion
          ? `Ad is now live with 50% self-promotion discount! Expires on ${expiresAt.toLocaleDateString()}`
          : `Ad is now live! Expires on ${expiresAt.toLocaleDateString()}`,
      },
    })
  } catch (error) {
    console.error('[Ads POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create ad' },
      { status: 500 }
    )
  }
}

// AD_PRICING is used internally - clients should call GET /api/ads?postId=xxx to get pricing
