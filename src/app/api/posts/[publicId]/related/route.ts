import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/posts/[publicId]/related - Get related posts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params

    // Find the current post
    const post = await prisma.post.findUnique({
      where: { publicId },
      select: {
        id: true,
        categoryId: true,
        organization: true,
        province: true,
      },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Build OR conditions for related posts
    const orConditions: any[] = [
      { categoryId: post.categoryId },
    ]

    if (post.organization) {
      orConditions.push({ organization: { contains: post.organization } })
    }

    if (post.province) {
      orConditions.push({ province: post.province })
    }

    // Find related posts
    const relatedPosts = await prisma.post.findMany({
      where: {
        AND: [
          { status: 'PUBLISHED' },
          { id: { not: post.id } },
          { OR: orConditions },
        ],
      },
      select: {
        publicId: true,
        title: true,
        content: true,
        province: true,
        organization: true,
        viewCount: true,
        upvotes: true,
        downvotes: true,
        createdAt: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { viewCount: 'desc' },
      ],
      take: 5,
    })

    return NextResponse.json({
      success: true,
      data: relatedPosts,
    })
  } catch (error) {
    console.error('Error fetching related posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch related posts' },
      { status: 500 }
    )
  }
}
