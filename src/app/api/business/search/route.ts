import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/business/search
 * Search for businesses by location and category
 * Free service for all registered businesses on SpillNova
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const city = searchParams.get('city') || ''
    const province = searchParams.get('province') || ''
    const country = searchParams.get('country') || 'sa'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build the where clause
    const where: Record<string, unknown> = {
      country,
      status: 'ACTIVE',
    }

    // Text search on name and description
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { categories: { contains: query, mode: 'insensitive' } },
      ]
    }

    // Category filter
    if (category) {
      where.categories = { contains: category, mode: 'insensitive' }
    }

    // Location filters - check both direct location and service areas
    if (city || province) {
      const locationConditions: Record<string, unknown>[] = []

      if (city) {
        // Check if city matches business city or is in service areas
        locationConditions.push({ city: { contains: city, mode: 'insensitive' } })
        locationConditions.push({ serviceAreas: { contains: city, mode: 'insensitive' } })
      }

      if (province) {
        locationConditions.push({ province: { contains: province, mode: 'insensitive' } })
        // Also check if province is mentioned in service areas
        locationConditions.push({ serviceAreas: { contains: province, mode: 'insensitive' } })
      }

      // Combine with existing OR conditions if any
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: locationConditions },
        ]
        delete where.OR
      } else {
        where.OR = locationConditions
      }
    }

    // Get total count for pagination
    const total = await prisma.businessProfile.count({ where })

    // Get businesses
    const businesses = await prisma.businessProfile.findMany({
      where,
      select: {
        id: true,
        publicId: true,
        name: true,
        description: true,
        categories: true,
        logo: true,
        coverImage: true,
        city: true,
        province: true,
        country: true,
        phone: true,
        email: true,
        website: true,
        serviceAreas: true,
        totalViews: true,
        createdAt: true,
      },
      orderBy: [
        { totalViews: 'desc' },
        { name: 'asc' },
      ],
      skip,
      take: limit,
    })

    // Parse service areas and categories JSON for each business
    const businessesWithParsedData = businesses.map((business) => {
      let parsedCategories: string[] = []
      if (business.categories) {
        try {
          parsedCategories = JSON.parse(business.categories)
        } catch {
          // If it's not valid JSON, treat it as a single category
          parsedCategories = [business.categories]
        }
      }

      let parsedServiceAreas: string[] = []
      if (business.serviceAreas) {
        try {
          parsedServiceAreas = JSON.parse(business.serviceAreas)
        } catch {
          parsedServiceAreas = []
        }
      }

      return {
        ...business,
        slug: business.publicId,
        category: parsedCategories[0] || null, // Primary category for display
        categories: parsedCategories,
        serviceAreas: parsedServiceAreas,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        businesses: businessesWithParsedData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + businesses.length < total,
        },
      },
    })
  } catch (error) {
    console.error('[Business Search] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search businesses' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/business/search
 * Get list of unique categories, cities, or provinces for filtering
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, country = 'sa' } = body

    if (action === 'categories') {
      // Get all businesses and extract unique categories
      const businesses = await prisma.businessProfile.findMany({
        where: {
          country,
          status: 'ACTIVE',
          categories: { not: null },
        },
        select: {
          categories: true,
        },
      })

      const allCategories = new Set<string>()
      businesses.forEach((b) => {
        if (b.categories) {
          try {
            const cats = JSON.parse(b.categories)
            if (Array.isArray(cats)) {
              cats.forEach((cat: string) => allCategories.add(cat))
            }
          } catch {
            allCategories.add(b.categories)
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: { categories: Array.from(allCategories).sort() },
      })
    }

    if (action === 'cities') {
      // Get unique cities
      const cities = await prisma.businessProfile.findMany({
        where: {
          country,
          status: 'ACTIVE',
          city: { not: null },
        },
        select: {
          city: true,
        },
        distinct: ['city'],
        orderBy: {
          city: 'asc',
        },
      })

      const uniqueCities = cities
        .map((c) => c.city)
        .filter((c): c is string => c !== null)

      return NextResponse.json({
        success: true,
        data: { cities: uniqueCities },
      })
    }

    if (action === 'provinces') {
      // Get unique provinces
      const provinces = await prisma.businessProfile.findMany({
        where: {
          country,
          status: 'ACTIVE',
          province: { not: null },
        },
        select: {
          province: true,
        },
        distinct: ['province'],
        orderBy: {
          province: 'asc',
        },
      })

      const uniqueProvinces = provinces
        .map((p) => p.province)
        .filter((p): p is string => p !== null)

      return NextResponse.json({
        success: true,
        data: { provinces: uniqueProvinces },
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Business Search Categories] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get categories' },
      { status: 500 }
    )
  }
}
