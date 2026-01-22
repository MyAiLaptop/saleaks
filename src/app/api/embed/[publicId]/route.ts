import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/embed/[publicId] - Get embed data for a leak
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params

    const post = await prisma.post.findUnique({
      where: { publicId },
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
        files: {
          select: { id: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Return embed-friendly data
    return NextResponse.json({
      success: true,
      data: {
        publicId: post.publicId,
        title: post.title,
        excerpt: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
        category: post.category.name,
        province: post.province,
        organization: post.organization,
        credibility: post.upvotes - post.downvotes,
        hasEvidence: post.files.length > 0,
        messageCount: post._count.messages,
        viewCount: post.viewCount,
        createdAt: post.createdAt,
      },
    })
  } catch (error) {
    console.error('Error fetching embed data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch embed data' },
      { status: 500 }
    )
  }
}
