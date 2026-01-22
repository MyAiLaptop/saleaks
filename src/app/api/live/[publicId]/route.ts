import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/live/[publicId] - Get a single live billboard post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params

    const post = await prisma.liveBillboard.findUnique({
      where: { publicId },
      include: {
        media: {
          orderBy: { order: 'asc' },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
        _count: {
          select: { comments: true },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.liveBillboard.update({
      where: { publicId },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        commentCount: post._count.comments,
      },
    })
  } catch (error) {
    console.error('Error fetching live billboard post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// PATCH /api/live/[publicId] - Update post (mark as ended, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params
    const body = await request.json()
    const { sessionToken, isHappeningNow, status } = body

    // Find post
    const post = await prisma.liveBillboard.findUnique({
      where: { publicId },
      select: { sessionToken: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (post.sessionToken !== sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update allowed fields
    const updateData: { isHappeningNow?: boolean; status?: string } = {}
    if (typeof isHappeningNow === 'boolean') {
      updateData.isHappeningNow = isHappeningNow
    }
    if (status === 'ENDED') {
      updateData.status = 'ENDED'
      updateData.isHappeningNow = false
    }

    const updatedPost = await prisma.liveBillboard.update({
      where: { publicId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: updatedPost,
    })
  } catch (error) {
    console.error('Error updating live billboard post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update post' },
      { status: 500 }
    )
  }
}
