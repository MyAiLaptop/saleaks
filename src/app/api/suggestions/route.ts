import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizeInput } from '@/lib/sanitize'
import { nanoid } from 'nanoid'

// Suggestion categories (same as live billboard + some extras)
const SUGGESTION_CATEGORIES = [
  'BREAKING', 'TRAFFIC', 'CRIME', 'PROTEST', 'LOADSHEDDING', 'WEATHER', 'COMMUNITY', 'OTHER',
  'FIGHTING', 'PARANORMAL', 'DRAMA', 'FUNNY', 'MUSIC', 'ANIMALS', 'STUNTS',
  'CULTURE_BLACK', 'CULTURE_WHITE', 'CULTURE_INDIAN', 'CULTURE_COLOURED',
  'CULTURE_ZULU', 'CULTURE_XHOSA', 'CULTURE_AFRIKAANS', 'CULTURE_OTHER',
  'INVESTIGATION', 'CORRUPTION', 'POLITICS',
] as const

// Generate anonymous suggester name
function generateSuggesterName(): string {
  const prefixes = ['Curious', 'Citizen', 'Investigator', 'Seeker', 'Tipster', 'Scout', 'Finder', 'Hunter']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = nanoid(4).toLowerCase()
  return `${prefix}-${suffix}`
}

// GET - List suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country') || 'sa'
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'OPEN'
    const sort = searchParams.get('sort') || 'popular' // popular, latest
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    // Build where clause
    const whereClause: Record<string, unknown> = {
      country,
    }

    if (category) {
      whereClause.category = category
    }

    if (status !== 'all') {
      whereClause.status = status
    }

    // Build order by
    const orderBy = sort === 'latest'
      ? { createdAt: 'desc' as const }
      : { upvotes: 'desc' as const }

    // Fetch suggestions
    const [suggestions, total] = await Promise.all([
      prisma.suggestion.findMany({
        where: whereClause,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.suggestion.count({ where: whereClause }),
    ])

    // Get category counts
    const categoryCounts = await prisma.suggestion.groupBy({
      by: ['category'],
      where: { country, status: 'OPEN' },
      _count: { category: true },
    })

    const categoryCountMap = categoryCounts.reduce(
      (acc, { category, _count }) => ({ ...acc, [category]: _count.category }),
      {} as Record<string, number>
    )

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          categoryCounts: categoryCountMap,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}

// POST - Create new suggestion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, category, province, city, sessionToken, displayName, country = 'sa' } = body

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategory = SUGGESTION_CATEGORIES.includes(category) ? category : 'OTHER'

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title).slice(0, 200)
    const sanitizedDescription = sanitizeInput(description).slice(0, 2000)
    const sanitizedProvince = province ? sanitizeInput(province).slice(0, 100) : null
    const sanitizedCity = city ? sanitizeInput(city).slice(0, 100) : null

    // Generate or use session token
    const creatorToken = sessionToken || nanoid(16)
    const creatorName = displayName ? sanitizeInput(displayName).slice(0, 50) : generateSuggesterName()

    // Create suggestion
    const suggestion = await prisma.suggestion.create({
      data: {
        publicId: nanoid(10),
        title: sanitizedTitle,
        description: sanitizedDescription,
        category: validCategory,
        country,
        province: sanitizedProvince,
        city: sanitizedCity,
        creatorName,
        creatorToken,
      },
    })

    return NextResponse.json({
      success: true,
      data: suggestion,
    })
  } catch (error) {
    console.error('Error creating suggestion:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create suggestion' },
      { status: 500 }
    )
  }
}
