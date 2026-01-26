import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizeInput } from '@/lib/sanitize'
import { nanoid } from 'nanoid'

// Marketplace categories
const MARKETPLACE_CATEGORIES = [
  'vehicles',
  'property',
  'electronics',
  'furniture',
  'clothing',
  'jobs',
  'services',
  'pets',
  'sports',
  'kids',
  'garden',
  'other',
] as const

// Item conditions
const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'] as const

// Currency configuration by country
const CURRENCY_CONFIG: Record<string, { code: string; symbol: string }> = {
  sa: { code: 'ZAR', symbol: 'R' },
  ng: { code: 'NGN', symbol: '₦' },
  ke: { code: 'KES', symbol: 'KSh' },
  gh: { code: 'GHS', symbol: 'GH₵' },
  us: { code: 'USD', symbol: '$' },
  uk: { code: 'GBP', symbol: '£' },
}

// GET - List/search marketplace listings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country') || 'sa'
    const category = searchParams.get('category')
    const province = searchParams.get('province')
    const city = searchParams.get('city')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const condition = searchParams.get('condition')
    const search = searchParams.get('q') || searchParams.get('search')
    const status = searchParams.get('status') || 'active'
    const sort = searchParams.get('sort') || 'latest' // latest, price_low, price_high, popular
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const sellerPhone = searchParams.get('sellerPhone') // For my-listings
    const deviceId = searchParams.get('deviceId') // For my-listings without account

    // Build where clause
    const whereClause: Record<string, unknown> = {
      country,
    }

    if (status !== 'all') {
      whereClause.status = status
    }

    if (category) {
      whereClause.category = category
    }

    if (province) {
      whereClause.province = { contains: province, mode: 'insensitive' }
    }

    if (city) {
      whereClause.city = { contains: city, mode: 'insensitive' }
    }

    if (condition && CONDITIONS.includes(condition as typeof CONDITIONS[number])) {
      whereClause.condition = condition
    }

    if (minPrice || maxPrice) {
      whereClause.price = {}
      if (minPrice) {
        (whereClause.price as Record<string, number>).gte = parseFloat(minPrice)
      }
      if (maxPrice) {
        (whereClause.price as Record<string, number>).lte = parseFloat(maxPrice)
      }
    }

    // Text search
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filter by seller (for my-listings)
    if (sellerPhone) {
      whereClause.sellerPhone = sellerPhone
    } else if (deviceId) {
      whereClause.deviceId = deviceId
    }

    // Build order by
    let orderBy: Record<string, string>[] = [{ createdAt: 'desc' }]
    switch (sort) {
      case 'price_low':
        orderBy = [{ price: 'asc' }]
        break
      case 'price_high':
        orderBy = [{ price: 'desc' }]
        break
      case 'popular':
        orderBy = [{ viewCount: 'desc' }, { createdAt: 'desc' }]
        break
      default:
        orderBy = [{ createdAt: 'desc' }]
    }

    // Fetch listings with images
    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where: whereClause,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 1, // Just first image for listing cards
          },
        },
      }),
      prisma.marketplaceListing.count({ where: whereClause }),
    ])

    // Get category counts for filters
    const categoryCounts = await prisma.marketplaceListing.groupBy({
      by: ['category'],
      where: { country, status: 'active' },
      _count: { category: true },
    })

    const categoryCountMap = categoryCounts.reduce(
      (acc, { category, _count }) => ({ ...acc, [category]: _count.category }),
      {} as Record<string, number>
    )

    // Get currency for this country
    const currency = CURRENCY_CONFIG[country] || CURRENCY_CONFIG.sa

    return NextResponse.json({
      success: true,
      data: {
        listings: listings.map(listing => ({
          ...listing,
          // Hide seller phone from public listing
          sellerPhone: undefined,
          hasPhone: !!listing.sellerPhone,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
        filters: {
          categoryCounts: categoryCountMap,
          categories: MARKETPLACE_CATEGORIES,
          conditions: CONDITIONS,
        },
        currency,
      },
    })
  } catch (error) {
    console.error('[Marketplace] Error fetching listings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    )
  }
}

// POST - Create new listing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      price,
      category,
      condition,
      province,
      city,
      sellerPhone,
      sellerName,
      sellerType = 'individual',
      deviceId,
      country = 'sa',
      images = [], // Array of { url, key }
    } = body

    // Validate required fields
    if (!title || !description || price === undefined || !category) {
      return NextResponse.json(
        { success: false, error: 'Title, description, price, and category are required' },
        { status: 400 }
      )
    }

    // Validate category
    if (!MARKETPLACE_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Validate condition
    const validCondition = CONDITIONS.includes(condition) ? condition : 'good'

    // Validate price
    const numericPrice = parseFloat(price)
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json(
        { success: false, error: 'Price must be a positive number' },
        { status: 400 }
      )
    }

    // Must have either phone or deviceId for identification
    if (!sellerPhone && !deviceId) {
      return NextResponse.json(
        { success: false, error: 'Seller phone or device ID is required' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title).slice(0, 200)
    const sanitizedDescription = sanitizeInput(description).slice(0, 5000)
    const sanitizedProvince = province ? sanitizeInput(province).slice(0, 100) : null
    const sanitizedCity = city ? sanitizeInput(city).slice(0, 100) : null
    const sanitizedSellerName = sellerName ? sanitizeInput(sellerName).slice(0, 100) : null

    // Get currency for country
    const currency = CURRENCY_CONFIG[country]?.code || 'ZAR'

    // Create listing with images
    const listing = await prisma.marketplaceListing.create({
      data: {
        publicId: nanoid(10),
        title: sanitizedTitle,
        description: sanitizedDescription,
        price: numericPrice,
        currency,
        category,
        condition: validCondition,
        country,
        province: sanitizedProvince,
        city: sanitizedCity,
        sellerType,
        sellerPhone: sellerPhone || '',
        sellerName: sanitizedSellerName,
        deviceId,
        // Set expiry to 30 days from now
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        // Create images
        images: {
          create: images.map((img: { url: string; key: string }, index: number) => ({
            url: img.url,
            key: img.key,
            order: index,
          })),
        },
      },
      include: {
        images: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...listing,
        sellerPhone: undefined, // Don't expose phone in response
      },
    })
  } catch (error) {
    console.error('[Marketplace] Error creating listing:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    )
  }
}
