import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizeInput } from '@/lib/sanitize'
import { nanoid } from 'nanoid'

// Generate anonymous display name
function generateDisplayName(): string {
  const prefixes = ['Anon', 'Citizen', 'Concerned', 'Witness', 'Observer', 'Informer', 'Tipster', 'Patriot']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = nanoid(4).toLowerCase()
  return `${prefix}-${suffix}`
}

// GET /api/posts/[publicId]/live-chat - Get live chat messages (with polling)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since') // Get messages after this timestamp
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const post = await prisma.post.findUnique({
      where: { publicId },
      select: { id: true, status: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.status !== 'PUBLISHED') {
      return NextResponse.json(
        { success: false, error: 'Post not available' },
        { status: 403 }
      )
    }

    // Build query
    const whereClause: { postId: string; createdAt?: { gt: Date } } = {
      postId: post.id,
    }

    // If polling for new messages
    if (since) {
      whereClause.createdAt = { gt: new Date(since) }
    }

    const messages = await prisma.liveChat.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        displayName: true,
        content: true,
        messageType: true,
        reactions: true,
        createdAt: true,
      },
    })

    // Return in chronological order
    const sortedMessages = messages.reverse()

    // Get total count for display
    const totalCount = await prisma.liveChat.count({
      where: { postId: post.id },
    })

    // Get active participants (unique display names in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentMessages = await prisma.liveChat.findMany({
      where: {
        postId: post.id,
        createdAt: { gt: oneHourAgo },
      },
      select: { displayName: true },
      distinct: ['displayName'],
    })

    return NextResponse.json({
      success: true,
      data: {
        messages: sortedMessages,
        totalCount,
        activeParticipants: recentMessages.length,
        serverTime: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching live chat:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/posts/[publicId]/live-chat - Send a live chat message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params
    const body = await request.json()
    const { content, sessionToken, displayName, contactToken, journalistToken } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 500 characters)' },
        { status: 400 }
      )
    }

    const post = await prisma.post.findUnique({
      where: { publicId },
      select: { id: true, status: true, contactToken: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.status !== 'PUBLISHED') {
      return NextResponse.json(
        { success: false, error: 'Post not available' },
        { status: 403 }
      )
    }

    // Determine message type and validate identity
    let messageType = 'CHAT'
    let finalDisplayName = displayName

    // Check if whistleblower
    if (contactToken && post.contactToken === contactToken) {
      messageType = 'WHISTLEBLOWER'
      finalDisplayName = 'Whistleblower'
    }
    // Check if verified journalist
    else if (journalistToken) {
      const journalist = await prisma.journalist.findUnique({
        where: { accessToken: journalistToken },
        select: { status: true, outlet: true },
      })
      if (journalist?.status === 'VERIFIED') {
        messageType = 'JOURNALIST'
        finalDisplayName = `Journalist (${journalist.outlet})`
      }
    }

    // Generate session token if not provided
    const finalSessionToken = sessionToken || nanoid(16)

    // Generate display name if not provided (for regular users)
    if (!finalDisplayName) {
      // Try to find existing display name for this session
      const existingMessage = await prisma.liveChat.findFirst({
        where: {
          postId: post.id,
          sessionToken: finalSessionToken,
        },
        select: { displayName: true },
      })
      finalDisplayName = existingMessage?.displayName || generateDisplayName()
    }

    // Create message
    const message = await prisma.liveChat.create({
      data: {
        postId: post.id,
        displayName: finalDisplayName,
        sessionToken: finalSessionToken,
        content: sanitizeInput(content),
        messageType,
      },
      select: {
        id: true,
        displayName: true,
        content: true,
        messageType: true,
        reactions: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        message,
        sessionToken: finalSessionToken,
        displayName: finalDisplayName,
      },
    })
  } catch (error) {
    console.error('Error sending live chat message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
