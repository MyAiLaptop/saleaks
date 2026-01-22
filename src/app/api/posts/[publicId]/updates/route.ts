import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizeInput } from '@/lib/sanitize'

// GET /api/posts/[publicId]/updates - Get all updates for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params

    const post = await prisma.post.findUnique({
      where: { publicId },
      select: { id: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    const updates = await prisma.postUpdate.findMany({
      where: { postId: post.id },
      select: {
        id: true,
        updateType: true,
        title: true,
        content: true,
        hasAttachment: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: updates,
    })
  } catch (error) {
    console.error('Error fetching post updates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch updates' },
      { status: 500 }
    )
  }
}

// POST /api/posts/[publicId]/updates - Add an update (requires contact token)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params
    const body = await request.json()
    const { contactToken, updateType, title, content } = body

    if (!contactToken) {
      return NextResponse.json(
        { success: false, error: 'Contact token is required to post updates' },
        { status: 401 }
      )
    }

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Validate update type
    const validTypes = ['UPDATE', 'CORRECTION', 'DEVELOPMENT', 'RESOLVED']
    if (updateType && !validTypes.includes(updateType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid update type' },
        { status: 400 }
      )
    }

    const post = await prisma.post.findUnique({
      where: { publicId },
      select: { id: true, contactToken: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Verify contact token matches
    if (!post.contactToken || post.contactToken !== contactToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid contact token' },
        { status: 403 }
      )
    }

    // Create the update
    const update = await prisma.postUpdate.create({
      data: {
        postId: post.id,
        updateType: updateType || 'UPDATE',
        title: sanitizeInput(title).substring(0, 200),
        content: sanitizeInput(content).substring(0, 5000),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: update.id,
        updateType: update.updateType,
        title: update.title,
        content: update.content,
        createdAt: update.createdAt,
      },
    })
  } catch (error) {
    console.error('Error creating post update:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create update' },
      { status: 500 }
    )
  }
}
