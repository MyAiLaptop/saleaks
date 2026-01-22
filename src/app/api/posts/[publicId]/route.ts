import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/posts/[publicId] - Get a single post by public ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params

    const post = await prisma.post.findUnique({
      where: { publicId },
      include: {
        category: true,
        files: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            isFromWhistleblower: true,
            messageType: true,
            createdAt: true,
          },
        },
        _count: { select: { messages: true } },
      },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Don't show hidden/removed posts to public
    if (post.status !== 'PUBLISHED') {
      return NextResponse.json(
        { success: false, error: 'Post not available' },
        { status: 404 }
      )
    }

    // Increment view count (fire and forget)
    prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {}) // Ignore errors

    // Remove sensitive fields before returning
    const { contactToken, id, ...safePost } = post

    return NextResponse.json({
      success: true,
      data: safePost,
    })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}
