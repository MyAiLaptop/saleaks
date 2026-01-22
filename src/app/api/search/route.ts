import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/search - Search posts with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const province = searchParams.get('province') || ''
    const organization = searchParams.get('organization') || ''
    const hasEvidence = searchParams.get('hasEvidence') === 'true'
    const sortBy = searchParams.get('sortBy') || 'newest'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)

    // Build where clause
    const where: Record<string, unknown> = {
      status: 'PUBLISHED',
    }

    // Text search across title, content, and organization
    if (query) {
      where.OR = [
        { title: { contains: query } },
        { content: { contains: query } },
        { organization: { contains: query } },
      ]
    }

    // Category filter
    if (category) {
      where.category = { slug: category }
    }

    // Province filter
    if (province) {
      where.province = province
    }

    // Organization filter
    if (organization) {
      where.organization = { contains: organization }
    }

    // Has evidence filter
    if (hasEvidence) {
      where.files = { some: {} }
    }

    // Determine sort order
    let orderBy: Record<string, string>[] = []
    switch (sortBy) {
      case 'oldest':
        orderBy = [{ createdAt: 'asc' }]
        break
      case 'mostViewed':
        orderBy = [{ viewCount: 'desc' }]
        break
      case 'mostCredible':
        orderBy = [{ upvotes: 'desc' }, { downvotes: 'asc' }]
        break
      case 'newest':
      default:
        orderBy = [{ createdAt: 'desc' }]
    }

    // Get total count for pagination
    const total = await prisma.post.count({ where })

    // Get posts
    const posts = await prisma.post.findMany({
      where,
      select: {
        publicId: true,
        title: true,
        content: true,
        province: true,
        city: true,
        organization: true,
        viewCount: true,
        upvotes: true,
        downvotes: true,
        featured: true,
        createdAt: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            files: true,
            messages: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    })

    // Get filter options (categories, provinces with counts)
    const categories = await prisma.category.findMany({
      select: {
        name: true,
        slug: true,
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    const provinces = await prisma.post.groupBy({
      by: ['province'],
      where: {
        status: 'PUBLISHED',
        province: { not: null },
      },
      _count: { province: true },
      orderBy: { province: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        posts: posts.map((post) => ({
          ...post,
          excerpt: post.content.substring(0, 200),
          hasEvidence: post._count.files > 0,
          messageCount: post._count.messages,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          categories: categories.map((c) => ({
            name: c.name,
            slug: c.slug,
            count: c._count.posts,
          })),
          provinces: provinces
            .filter((p) => p.province)
            .map((p) => ({
              name: p.province!,
              count: p._count.province,
            })),
        },
      },
    })
  } catch (error) {
    console.error('Error searching posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search posts' },
      { status: 500 }
    )
  }
}
