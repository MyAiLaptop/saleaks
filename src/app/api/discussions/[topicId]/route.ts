import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Get topic details with responses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params

    const topic = await prisma.topic.findFirst({
      where: {
        OR: [
          { id: topicId },
          { publicId: topicId },
        ],
      },
      include: {
        introVideo: true,
        responses: {
          where: { status: 'ACTIVE', parentId: null }, // Only top-level responses
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            media: true,
            _count: {
              select: { replies: true },
            },
          },
        },
        _count: {
          select: { responses: true },
        },
      },
    })

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      )
    }

    // Increment view count (fire and forget)
    prisma.topic.update({
      where: { id: topic.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      data: { topic },
    })
  } catch (error) {
    console.error('Error fetching topic:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch topic' },
      { status: 500 }
    )
  }
}

// PATCH - Update topic (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params
    const body = await request.json()
    const { sessionToken, status } = body

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Session token required' },
        { status: 401 }
      )
    }

    const topic = await prisma.topic.findFirst({
      where: {
        OR: [
          { id: topicId },
          { publicId: topicId },
        ],
      },
    })

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (topic.creatorToken !== sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to modify this topic' },
        { status: 403 }
      )
    }

    // Only allow closing the topic
    if (status && status === 'CLOSED') {
      await prisma.topic.update({
        where: { id: topic.id },
        data: { status: 'CLOSED' },
      })
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Topic updated' },
    })
  } catch (error) {
    console.error('Error updating topic:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update topic' },
      { status: 500 }
    )
  }
}
