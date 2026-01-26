import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizeInput } from '@/lib/sanitize'
import { encryptEmail } from '@/lib/crypto'
import { nanoid } from 'nanoid'
import { moderateTextContent } from '@/lib/content-moderation'
import { isValidSAPhoneNumber, formatPhoneNumber, detectCarrier } from '@/lib/carrier-billing'

// Billboard categories
const BILLBOARD_CATEGORIES = [
  // News categories
  'BREAKING',
  'TRAFFIC',
  'CRIME',
  'PROTEST',
  'LOADSHEDDING',
  'WEATHER',
  'COMMUNITY',
  'OTHER',
  // Viral/Entertainment categories
  'FIGHTING',
  'PARANORMAL',
  'DRAMA',
  'FUNNY',
  'MUSIC',
  'ANIMALS',
  'STUNTS',
  // Culture categories
  'CULTURE_BLACK',
  'CULTURE_WHITE',
  'CULTURE_INDIAN',
  'CULTURE_COLOURED',
  'CULTURE_ZULU',
  'CULTURE_XHOSA',
  'CULTURE_AFRIKAANS',
  'CULTURE_OTHER',
] as const

// Feed sections - maps to multiple categories
const FEED_SECTIONS = {
  news: ['BREAKING', 'CRIME', 'PROTEST'],           // Main news: serious/newsworthy content
  local: ['TRAFFIC', 'LOADSHEDDING', 'WEATHER'],    // Local updates: utility info
  social: ['COMMUNITY', 'OTHER'],                    // Social: community/casual content
  viral: ['FIGHTING', 'PARANORMAL', 'DRAMA', 'FUNNY', 'MUSIC', 'ANIMALS', 'STUNTS'], // Entertainment/viral
  culture: ['CULTURE_BLACK', 'CULTURE_WHITE', 'CULTURE_INDIAN', 'CULTURE_COLOURED', 'CULTURE_ZULU', 'CULTURE_XHOSA', 'CULTURE_AFRIKAANS', 'CULTURE_OTHER'], // Culture content
} as const

// Generate anonymous reporter name
function generateReporterName(): string {
  const prefixes = ['Reporter', 'Witness', 'Citizen', 'Observer', 'Local', 'OnScene', 'EyeWitness', 'Insider']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = nanoid(4).toLowerCase()
  return `${prefix}-${suffix}`
}

// Calculate trending score (upvotes - downvotes + recency boost)
function calculateTrendingScore(upvotes: number, downvotes: number, createdAt: Date): number {
  const ageInHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
  const voteScore = upvotes - downvotes
  // Decay factor: posts lose trending power over time
  const recencyBoost = Math.max(0, 100 - ageInHours * 2) // Full boost for first hour, decays over ~50 hours
  return voteScore + recencyBoost
}

// Time constants
const HAPPENING_NOW_EXPIRY_HOURS = 4
const ACTIVE_FEED_DAYS = 7

// Auto-expire old "Happening Now" posts (runs on each request for simplicity)
async function autoExpireHappeningNow() {
  const expiryTime = new Date(Date.now() - HAPPENING_NOW_EXPIRY_HOURS * 60 * 60 * 1000)
  await prisma.liveBillboard.updateMany({
    where: {
      isHappeningNow: true,
      createdAt: { lt: expiryTime },
    },
    data: { isHappeningNow: false },
  })
}

// Auto-end expired auctions (move to public sale if no bids)
async function autoEndExpiredAuctions() {
  const now = new Date()

  // Find all active auctions that have expired and have no bids
  await prisma.liveBillboard.updateMany({
    where: {
      auctionStatus: 'ACTIVE',
      auctionEndsAt: { lt: now },
      bidCount: 0,
    },
    data: {
      auctionStatus: 'ENDED',
      isExclusive: false,
    },
  })
}

// Send push notifications to subscribed users
async function sendPushNotifications(payload: {
  title: string
  body: string
  url?: string
  category?: string
  province?: string
}) {
  // Only send if API key is configured
  const apiKey = process.env.NOTIFICATION_API_KEY
  if (!apiKey) return

  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('Failed to send push notifications:', error)
  }
}

// GET /api/live - Get live billboard posts
export async function GET(request: NextRequest) {
  try {
    // Auto-expire old "Happening Now" posts and ended auctions
    await autoExpireHappeningNow()
    await autoEndExpiredAuctions()

    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country') || 'sa' // Default to South Africa
    const category = searchParams.get('category')
    const section = searchParams.get('section') // news, local, social
    const province = searchParams.get('province')
    const sort = searchParams.get('sort') || 'latest' // latest, trending, hot
    const happeningNow = searchParams.get('happeningNow') === 'true'
    const archive = searchParams.get('archive') === 'true' // Show archived posts
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const since = searchParams.get('since') // For polling new posts

    // Calculate date boundaries
    const sevenDaysAgo = new Date(Date.now() - ACTIVE_FEED_DAYS * 24 * 60 * 60 * 1000)

    // Build where clause
    const whereClause: {
      status: string
      country?: string
      category?: string | { in: string[] }
      province?: string
      isHappeningNow?: boolean
      createdAt?: { gt?: Date; lt?: Date; gte?: Date }
      moderationStatus?: { notIn: string[] }
    } = {
      status: 'LIVE',
      country, // Filter by country
      // Only show posts that are APPROVED or PENDING (not FLAGGED or REJECTED)
      moderationStatus: { notIn: ['REJECTED', 'FLAGGED'] },
    }

    // Filter by time window
    if (archive) {
      // Archive: posts older than 7 days
      whereClause.createdAt = { lt: sevenDaysAgo }
    } else if (since) {
      // Polling: new posts since last fetch
      whereClause.createdAt = { gt: new Date(since) }
    } else {
      // Main feed: posts from last 7 days only
      whereClause.createdAt = { gte: sevenDaysAgo }
    }

    // Filter by section (multiple categories) or single category
    if (section && section in FEED_SECTIONS) {
      whereClause.category = { in: FEED_SECTIONS[section as keyof typeof FEED_SECTIONS] as unknown as string[] }
    } else if (category && BILLBOARD_CATEGORIES.includes(category as typeof BILLBOARD_CATEGORIES[number])) {
      whereClause.category = category
    }
    if (province) {
      whereClause.province = province
    }
    if (happeningNow) {
      whereClause.isHappeningNow = true
    }

    // Build order by
    let orderBy: { createdAt?: 'desc'; trendingScore?: 'desc'; upvotes?: 'desc' } = { createdAt: 'desc' }
    if (sort === 'trending') {
      orderBy = { trendingScore: 'desc' }
    } else if (sort === 'hot') {
      orderBy = { upvotes: 'desc' }
    }

    const posts = await prisma.liveBillboard.findMany({
      where: whereClause,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        media: {
          where: {
            // Only show media that's not rejected or flagged
            moderationStatus: { notIn: ['REJECTED', 'FLAGGED'] },
          },
          orderBy: { order: 'asc' },
          take: 4, // Limit media per post
        },
        _count: {
          select: { comments: true },
        },
      },
    })

    // Get total count for pagination
    const totalCount = await prisma.liveBillboard.count({ where: whereClause })

    // Get category counts for filters (only active posts from last 7 days, filtered by country)
    const categoryCounts = await prisma.liveBillboard.groupBy({
      by: ['category'],
      where: { status: 'LIVE', country, createdAt: { gte: sevenDaysAgo }, moderationStatus: { notIn: ['REJECTED', 'FLAGGED'] } },
      _count: { category: true },
    })

    // Calculate section counts from category counts
    const categoryCountMap = categoryCounts.reduce(
      (acc, { category, _count }) => ({ ...acc, [category]: _count.category }),
      {} as Record<string, number>
    )
    const sectionCounts = {
      news: (categoryCountMap['BREAKING'] || 0) + (categoryCountMap['CRIME'] || 0) + (categoryCountMap['PROTEST'] || 0),
      local: (categoryCountMap['TRAFFIC'] || 0) + (categoryCountMap['LOADSHEDDING'] || 0) + (categoryCountMap['WEATHER'] || 0),
      social: (categoryCountMap['COMMUNITY'] || 0) + (categoryCountMap['OTHER'] || 0),
      viral: (categoryCountMap['FIGHTING'] || 0) + (categoryCountMap['PARANORMAL'] || 0) + (categoryCountMap['DRAMA'] || 0) + (categoryCountMap['FUNNY'] || 0) + (categoryCountMap['MUSIC'] || 0) + (categoryCountMap['ANIMALS'] || 0) + (categoryCountMap['STUNTS'] || 0),
      culture: (categoryCountMap['CULTURE_BLACK'] || 0) + (categoryCountMap['CULTURE_WHITE'] || 0) + (categoryCountMap['CULTURE_INDIAN'] || 0) + (categoryCountMap['CULTURE_COLOURED'] || 0) + (categoryCountMap['CULTURE_ZULU'] || 0) + (categoryCountMap['CULTURE_XHOSA'] || 0) + (categoryCountMap['CULTURE_AFRIKAANS'] || 0) + (categoryCountMap['CULTURE_OTHER'] || 0),
    }

    // Get "Happening Now" count (filtered by country)
    const happeningNowCount = await prisma.liveBillboard.count({
      where: { status: 'LIVE', country, isHappeningNow: true, createdAt: { gte: sevenDaysAgo }, moderationStatus: { notIn: ['REJECTED', 'FLAGGED'] } },
    })

    // Get archive count (filtered by country)
    const archiveCount = await prisma.liveBillboard.count({
      where: { status: 'LIVE', country, createdAt: { lt: sevenDaysAgo }, moderationStatus: { notIn: ['REJECTED', 'FLAGGED'] } },
    })

    return NextResponse.json({
      success: true,
      data: {
        posts: posts.map((post) => {
          const now = Date.now()
          const auctionEndsAt = post.auctionEndsAt?.getTime() || 0
          const timeRemaining = Math.max(0, auctionEndsAt - now)
          const isAuctionActive = post.auctionStatus === 'ACTIVE' && timeRemaining > 0

          return {
            ...post,
            commentCount: post._count.comments,
            // Auction info
            auction: {
              status: post.auctionStatus,
              isActive: isAuctionActive,
              endsAt: post.auctionEndsAt,
              timeRemaining,
              currentBid: post.currentBid,
              bidCount: post.bidCount,
              isExclusive: post.isExclusive,
              exclusiveBuyerName: post.exclusiveBuyerName,
              soldAt: post.soldAt,
              // Can buy publicly only after auction ends with no winner
              canBuyPublic: post.auctionStatus === 'ENDED' && !post.isExclusive,
            },
          }
        }),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        filters: {
          categoryCounts: categoryCountMap,
          sectionCounts,
          happeningNowCount,
          archiveCount,
        },
        serverTime: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching live billboard:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST /api/live - Create a new live billboard post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, category, province, city, sessionToken, displayName, isHappeningNow, revenueShareEnabled, revenueShareContact, submitterPhone, country } = body
    const finalCountry = country || 'sa' // Default to South Africa

    // Validation
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Content too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // Generate or use existing session token and display name
    const finalSessionToken = sessionToken || nanoid(16)
    let finalDisplayName = displayName

    if (!finalDisplayName) {
      // Check if this session has posted before
      const existingPost = await prisma.liveBillboard.findFirst({
        where: { sessionToken: finalSessionToken },
        select: { displayName: true },
      })
      finalDisplayName = existingPost?.displayName || generateReporterName()
    }

    // Moderate text content before creating post
    const sanitizedContent = sanitizeInput(content)
    const textModeration = moderateTextContent(sanitizedContent)
    console.log('[Post Creation] Text moderation result:', textModeration)

    // Reject posts with clearly offensive content
    if (textModeration.status === 'REJECTED') {
      return NextResponse.json(
        { success: false, error: 'Content violates community guidelines' },
        { status: 400 }
      )
    }

    // Create post
    const finalCategory = BILLBOARD_CATEGORIES.includes(category as typeof BILLBOARD_CATEGORIES[number])
      ? category
      : 'OTHER'

    // Handle revenue sharing via phone-based account
    let submitterAccountId: string | null = null
    let finalRevenueShareEnabled = revenueShareEnabled === true

    // If submitter provides a phone number, create/link to their account
    if (submitterPhone && isValidSAPhoneNumber(submitterPhone)) {
      const normalizedPhone = formatPhoneNumber(submitterPhone)
      const carrier = detectCarrier(submitterPhone)

      // Find or create submitter account
      let account = await prisma.submitterAccount.findUnique({
        where: { phoneNumber: normalizedPhone },
      })

      if (!account) {
        // Create new unverified account (they can verify later to withdraw)
        account = await prisma.submitterAccount.create({
          data: {
            phoneNumber: normalizedPhone,
            carrier,
            verified: false, // Will need OTP verification to withdraw
          },
        })
      }

      submitterAccountId = account.id
      finalRevenueShareEnabled = true // Enable revenue share since they provided phone
    }

    // Fallback to encrypted contact if no phone but contact provided
    const finalRevenueShareContact = finalRevenueShareEnabled && revenueShareContact && !submitterAccountId
      ? encryptEmail(revenueShareContact.trim())
      : null

    // Auction ends 1 hour from now
    const auctionEndsAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store normalized phone for direct lookup (ownership verification)
    const normalizedSubmitterPhone = submitterPhone && isValidSAPhoneNumber(submitterPhone)
      ? formatPhoneNumber(submitterPhone)
      : null

    const post = await prisma.liveBillboard.create({
      data: {
        publicId: nanoid(10),
        content: sanitizedContent,
        category: finalCategory,
        country: finalCountry, // Store the country
        province: province || null,
        city: city || null,
        displayName: finalDisplayName,
        sessionToken: finalSessionToken,
        isHappeningNow: isHappeningNow !== false,
        trendingScore: 100, // Start with full recency boost
        revenueShareEnabled: finalRevenueShareEnabled,
        revenueShareContact: finalRevenueShareContact,
        submitterPhone: normalizedSubmitterPhone, // Store phone directly for ownership verification
        submitterAccountId: submitterAccountId, // Link to phone-based account
        revenueSharePercent: 50,
        revenueShareStatus: finalRevenueShareEnabled ? 'PENDING' : 'NONE',
        // Auction - all content starts with 1-hour exclusive auction
        auctionEndsAt,
        auctionStatus: 'ACTIVE',
        // Content moderation fields
        moderationStatus: textModeration.status,
        moderationScore: textModeration.score,
        moderationFlags: textModeration.flags.length > 0 ? JSON.stringify(textModeration.flags) : null,
        moderatedAt: new Date(),
      },
      include: {
        media: true,
      },
    })

    // Send push notifications for breaking news or live events (async, don't await)
    if (finalCategory === 'BREAKING' || isHappeningNow !== false) {
      sendPushNotifications({
        title: finalCategory === 'BREAKING' ? 'Breaking News' : 'Live Event',
        body: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        url: `/live/${post.publicId}`,
        category: finalCategory,
        province: province || undefined,
      }).catch((err) => console.error('Failed to send push notifications:', err))
    }

    return NextResponse.json({
      success: true,
      data: {
        post,
        sessionToken: finalSessionToken,
        displayName: finalDisplayName,
      },
    })
  } catch (error) {
    console.error('Error creating live billboard post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
