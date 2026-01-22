import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizeInput } from '@/lib/sanitize'
import { nanoid } from 'nanoid'

// Generate anonymous commenter name
function generateCommenterName(): string {
  const prefixes = ['User', 'Anon', 'Citizen', 'Local', 'Observer', 'Concerned']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = nanoid(4).toLowerCase()
  return `${prefix}-${suffix}`
}

// GET /api/live/[publicId]/comments - Get comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')

    const post = await prisma.liveBillboard.findUnique({
      where: { publicId },
      select: { id: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    const whereClause: { postId: string; createdAt?: { gt: Date } } = {
      postId: post.id,
    }

    if (since) {
      whereClause.createdAt = { gt: new Date(since) }
    }

    const comments = await prisma.liveBillboardComment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

    return NextResponse.json({
      success: true,
      data: {
        comments,
        serverTime: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/live/[publicId]/comments - Add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params
    const body = await request.json()
    const { content, sessionToken, displayName, parentId } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Comment too long (max 500 characters)' },
        { status: 400 }
      )
    }

    const post = await prisma.liveBillboard.findUnique({
      where: { publicId },
      select: { id: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Generate or use existing session token and display name
    const finalSessionToken = sessionToken || nanoid(16)
    let finalDisplayName = displayName

    if (!finalDisplayName) {
      const existingComment = await prisma.liveBillboardComment.findFirst({
        where: { sessionToken: finalSessionToken },
        select: { displayName: true },
      })
      finalDisplayName = existingComment?.displayName || generateCommenterName()
    }

    // Create comment
    const comment = await prisma.liveBillboardComment.create({
      data: {
        postId: post.id,
        displayName: finalDisplayName,
        sessionToken: finalSessionToken,
        content: sanitizeInput(content),
        parentId: parentId || null,
      },
    })

    // Update comment count
    await prisma.liveBillboard.update({
      where: { publicId },
      data: { commentCount: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      data: {
        comment,
        sessionToken: finalSessionToken,
        displayName: finalDisplayName,
      },
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
