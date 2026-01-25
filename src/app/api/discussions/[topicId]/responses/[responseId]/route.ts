import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Get response details with replies
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string; responseId: string }> }
) {
  try {
    const { responseId } = await params

    const response = await prisma.topicResponse.findFirst({
      where: {
        OR: [
          { id: responseId },
          { publicId: responseId },
        ],
      },
      include: {
        topic: {
          select: {
            id: true,
            publicId: true,
            title: true,
          },
        },
        media: true,
        replies: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'asc' },
          take: 20,
          include: {
            media: true,
            _count: {
              select: { replies: true },
            },
          },
        },
        parent: {
          select: {
            id: true,
            publicId: true,
            title: true,
            creatorName: true,
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    })

    if (!response) {
      return NextResponse.json(
        { success: false, error: 'Response not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { response },
    })
  } catch (error) {
    console.error('Error fetching response:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch response' },
      { status: 500 }
    )
  }
}

// DELETE - Delete response (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string; responseId: string }> }
) {
  try {
    const { responseId } = await params
    const body = await request.json()
    const { sessionToken } = body

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Session token required' },
        { status: 401 }
      )
    }

    const response = await prisma.topicResponse.findFirst({
      where: {
        OR: [
          { id: responseId },
          { publicId: responseId },
        ],
      },
    })

    if (!response) {
      return NextResponse.json(
        { success: false, error: 'Response not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (response.creatorToken !== sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this response' },
        { status: 403 }
      )
    }

    // Soft delete by setting status
    await prisma.topicResponse.update({
      where: { id: response.id },
      data: { status: 'REMOVED' },
    })

    // Update topic response count
    await prisma.topic.update({
      where: { id: response.topicId },
      data: { responseCount: { decrement: 1 } },
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Response deleted' },
    })
  } catch (error) {
    console.error('Error deleting response:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete response' },
      { status: 500 }
    )
  }
}
