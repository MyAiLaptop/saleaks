import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizeInput } from '@/lib/sanitize'
import { encryptEmail } from '@/lib/crypto'
import { nanoid } from 'nanoid'
import { moderateTextContent } from '@/lib/content-moderation'

// Billboard categories
const BILLBOARD_CATEGORIES = [
  'BREAKING',
  'TRAFFIC',
  'CRIME',
  'PROTEST',
  'LOADSHEDDING',
  'WEATHER',
  'COMMUNITY',
  'OTHER',
] as const

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
    // Auto-expire old "Happening Now" posts
    await autoExpireHappeningNow()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
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
      category?: string
      province?: string
      isHappeningNow?: boolean
      createdAt?: { gt?: Date; lt?: Date; gte?: Date }
      moderationStatus?: { notIn: string[] }
    } = {
      status: 'LIVE',
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

    if (category && BILLBOARD_CATEGORIES.includes(category as typeof BILLBOARD_CATEGORIES[number])) {
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

    // Get category counts for filters (only active posts from last 7 days)
    const categoryCounts = await prisma.liveBillboard.groupBy({
      by: ['category'],
      where: { status: 'LIVE', createdAt: { gte: sevenDaysAgo } },
      _count: { category: true },
    })

    // Get "Happening Now" count
    const happeningNowCount = await prisma.liveBillboard.count({
      where: { status: 'LIVE', isHappeningNow: true, createdAt: { gte: sevenDaysAgo } },
    })

    // Get archive count
    const archiveCount = await prisma.liveBillboard.count({
      where: { status: 'LIVE', createdAt: { lt: sevenDaysAgo } },
    })

    return NextResponse.json({
      success: true,
      data: {
        posts: posts.map((post) => ({
          ...post,
          commentCount: post._count.comments,
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        filters: {
          categoryCounts: categoryCounts.reduce(
            (acc, { category, _count }) => ({ ...acc, [category]: _count.category }),
            {} as Record<string, number>
          ),
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
    const { content, category, province, city, sessionToken, displayName, isHappeningNow, revenueShareEnabled, revenueShareContact } = body

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

    // Handle revenue sharing
    const finalRevenueShareEnabled = revenueShareEnabled === true
    const finalRevenueShareContact = finalRevenueShareEnabled && revenueShareContact
      ? encryptEmail(revenueShareContact.trim())
      : null

    const post = await prisma.liveBillboard.create({
      data: {
        publicId: nanoid(10),
        content: sanitizedContent,
        category: finalCategory,
        province: province || null,
        city: city || null,
        displayName: finalDisplayName,
        sessionToken: finalSessionToken,
        isHappeningNow: isHappeningNow !== false,
        trendingScore: 100, // Start with full recency boost
        revenueShareEnabled: finalRevenueShareEnabled,
        revenueShareContact: finalRevenueShareContact,
        revenueSharePercent: 50,
        revenueShareStatus: finalRevenueShareEnabled ? 'PENDING' : 'NONE',
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
