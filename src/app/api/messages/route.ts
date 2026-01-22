import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizeContent } from '@/lib/sanitize'

// GET /api/messages?postId=xxx&token=xxx - Get messages for a post (requires token for whistleblower)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const postPublicId = searchParams.get('postId')
    const contactToken = searchParams.get('token')

    if (!postPublicId || !contactToken) {
      return NextResponse.json(
        { success: false, error: 'Post ID and contact token are required' },
        { status: 400 }
      )
    }

    // Find post and verify token
    const post = await prisma.post.findUnique({
      where: { publicId: postPublicId },
      select: { id: true, contactToken: true },
    })

    if (!post || post.contactToken !== contactToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid post or token' },
        { status: 403 }
      )
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        isFromWhistleblower: true,
        messageType: true,
        content: true,
        read: true,
        createdAt: true,
      },
    })

    // Mark messages from journalists as read
    await prisma.message.updateMany({
      where: {
        postId: post.id,
        isFromWhistleblower: false,
        read: false,
      },
      data: { read: true },
    })

    return NextResponse.json({ success: true, data: messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// Valid message types
const MESSAGE_TYPES = ['FACT', 'OPINION', 'LEAD', 'QUESTION'] as const

// POST /api/messages - Send a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postPublicId, contactToken, content, isFromWhistleblower, messageType } = body

    if (!postPublicId || !content) {
      return NextResponse.json(
        { success: false, error: 'Post ID and content are required' },
        { status: 400 }
      )
    }

    // Find post
    const post = await prisma.post.findUnique({
      where: { publicId: postPublicId },
      select: { id: true, contactToken: true },
    })

    if (!post || !post.contactToken) {
      return NextResponse.json(
        { success: false, error: 'Post not found or messaging not enabled' },
        { status: 404 }
      )
    }

    // Verify token for whistleblower messages (token proves they are the original poster)
    if (isFromWhistleblower && post.contactToken !== contactToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid contact token' },
        { status: 403 }
      )
    }

    // Sanitize and limit content
    const sanitizedContent = sanitizeContent(content).substring(0, 10000)

    if (!sanitizedContent) {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Validate message type (default to OPINION if not provided or invalid)
    const validMessageType = MESSAGE_TYPES.includes(messageType) ? messageType : 'OPINION'

    // Save message (plain text - messages are public but anonymous)
    const message = await prisma.message.create({
      data: {
        postId: post.id,
        isFromWhistleblower: !!isFromWhistleblower,
        messageType: validMessageType,
        content: sanitizedContent,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        createdAt: message.createdAt,
      },
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
