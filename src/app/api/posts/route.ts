import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generatePublicId, generateContactToken, encryptEmail } from '@/lib/crypto'
import { sanitizeInput, sanitizeContent, sanitizeLocation } from '@/lib/sanitize'
import type { PostFilters, ApiResponse, PaginatedResponse, PostWithRelations } from '@/types'

// GET /api/posts - List posts with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const country = searchParams.get('country') || 'sa' // Filter by country
    const filters: PostFilters = {
      categorySlug: searchParams.get('category') || undefined,
      province: searchParams.get('province') || undefined,
      search: searchParams.get('search') || undefined,
      featured: searchParams.get('featured') === 'true',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
    }

    const where: any = {
      status: 'PUBLISHED',
      country, // Filter by country - SA sees SA posts, NG sees NG posts
    }

    if (filters.categorySlug) {
      where.category = { slug: filters.categorySlug }
    }

    if (filters.province) {
      where.province = filters.province
    }

    if (filters.featured) {
      where.featured = true
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { content: { contains: filters.search } },
        { organization: { contains: filters.search } },
      ]
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: {
          publicId: true,
          title: true,
          content: true,
          province: true,
          city: true,
          organization: true,
          status: true,
          featured: true,
          viewCount: true,
          upvotes: true,
          downvotes: true,
          createdAt: true,
          updatedAt: true,
          category: true,
          files: true,
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: ((filters.page || 1) - 1) * (filters.limit || 20),
        take: filters.limit || 20,
      }),
      prisma.post.count({ where }),
    ])

    const response: PaginatedResponse<PostWithRelations> = {
      items: posts as unknown as PostWithRelations[],
      total,
      page: filters.page || 1,
      limit: filters.limit || 20,
      totalPages: Math.ceil(total / (filters.limit || 20)),
    }

    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create a new anonymous post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.content || !body.categoryId) {
      return NextResponse.json(
        { success: false, error: 'Title, content, and category are required' },
        { status: 400 }
      )
    }

    // Get country from request body (default to 'sa')
    const country = body.country || 'sa'

    // Sanitize all inputs
    const sanitizedData = {
      title: sanitizeInput(body.title).substring(0, 500),
      content: sanitizeContent(body.content).substring(0, 50000),
      categoryId: body.categoryId,
      country, // Store the country code
      province: body.province ? sanitizeLocation(body.province) : null,
      city: body.city ? sanitizeLocation(body.city) : null,
      organization: body.organization ? sanitizeInput(body.organization).substring(0, 200) : null,
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: sanitizedData.categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Generate IDs
    const publicId = generatePublicId()
    const contactToken = body.enableContact ? generateContactToken() : null

    // Handle revenue sharing
    const revenueShareEnabled = body.revenueShareEnabled === true
    const revenueShareContact = revenueShareEnabled && body.revenueShareContact
      ? encryptEmail(body.revenueShareContact.trim())
      : null

    // Create post - NO IP or user data stored
    const post = await prisma.post.create({
      data: {
        publicId,
        title: sanitizedData.title,
        content: sanitizedData.content,
        categoryId: sanitizedData.categoryId,
        country: sanitizedData.country, // Store country for filtering
        province: sanitizedData.province,
        city: sanitizedData.city,
        organization: sanitizedData.organization,
        contactToken,
        revenueShareEnabled,
        revenueShareContact,
        revenueSharePercent: 50,
        revenueShareStatus: revenueShareEnabled ? 'PENDING' : 'NONE',
      },
      include: {
        category: true,
      },
    })

    // Return the post with contact token (only shown once!)
    const response: ApiResponse<{ post: typeof post; contactToken: string | null }> = {
      success: true,
      data: {
        post,
        // IMPORTANT: This is the only time the contact token is shown
        // The whistleblower must save it to receive messages
        contactToken,
      },
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
