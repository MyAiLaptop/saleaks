import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'
import { sanitizeInput } from '@/lib/sanitize'
import { DISCUSSION_CATEGORIES } from '@/lib/categories'

// Generate anonymous reporter-style name
function generateReporterName(): string {
  const adjectives = ['Civic', 'Local', 'Voice', 'Citizen', 'Public', 'Community', 'Active', 'Concerned']
  const nouns = ['Reporter', 'Witness', 'Observer', 'Advocate', 'Member', 'Voice', 'Speaker', 'Contributor']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const suffix = nanoid(4)
  return `${adj}${noun}-${suffix}`
}

// GET - List topics with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const category = searchParams.get('category')
    const province = searchParams.get('province')
    const country = searchParams.get('country') || 'sa'
    const sort = searchParams.get('sort') || 'latest' // latest, trending, responses
    const search = searchParams.get('search')

    // Build where clause
    const where: {
      status: string
      country: string
      category?: string
      province?: string
      OR?: Array<{ title: { contains: string; mode: 'insensitive' } } | { description: { contains: string; mode: 'insensitive' } }>
    } = {
      status: 'ACTIVE',
      country,
    }

    if (category && DISCUSSION_CATEGORIES.some(c => c.slug === category)) {
      where.category = category
    }

    if (province) {
      where.province = province
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Build orderBy
    let orderBy: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>
    switch (sort) {
      case 'trending':
        orderBy = [
          { upvotes: 'desc' },
          { responseCount: 'desc' },
          { createdAt: 'desc' },
        ]
        break
      case 'responses':
        orderBy = { responseCount: 'desc' }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }

    // Fetch topics
    const [topics, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          introVideo: {
            select: {
              thumbnailPath: true,
              duration: true,
              r2WatermarkedKey: true,
              storageType: true,
            },
          },
          _count: {
            select: {
              responses: true,
            },
          },
        },
      }),
      prisma.topic.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        topics,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching topics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch topics' },
      { status: 500 }
    )
  }
}

// POST - Create new topic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, category, province, city, country, sessionToken, displayName } = body

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { success: false, error: 'Title, description, and category are required' },
        { status: 400 }
      )
    }

    // Validate category
    if (!DISCUSSION_CATEGORIES.some(c => c.slug === category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Validate title length
    if (title.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Title too long (max 200 characters)' },
        { status: 400 }
      )
    }

    // Validate description length
    if (description.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Description too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // Generate or use provided session token
    const finalSessionToken = sessionToken || nanoid(16)
    let finalDisplayName = displayName

    // If no display name, check if this session has posted before or generate new one
    if (!finalDisplayName) {
      const existingTopic = await prisma.topic.findFirst({
        where: { creatorToken: finalSessionToken },
        select: { creatorName: true },
      })
      finalDisplayName = existingTopic?.creatorName || generateReporterName()
    }

    // Create topic
    const topic = await prisma.topic.create({
      data: {
        publicId: nanoid(12),
        title: sanitizeInput(title),
        description: sanitizeInput(description),
        category,
        province: province || null,
        city: city || null,
        country: country || 'sa',
        creatorName: finalDisplayName,
        creatorToken: finalSessionToken,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        topic,
        sessionToken: finalSessionToken,
        displayName: finalDisplayName,
      },
    })
  } catch (error) {
    console.error('Error creating topic:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create topic' },
      { status: 500 }
    )
  }
}
