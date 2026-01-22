import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { encryptMessage, decryptMessage } from '@/lib/crypto'
import { sanitizeInput } from '@/lib/sanitize'

// GET /api/posts/[publicId]/private-messages - Get private messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params
    const accessToken = request.headers.get('x-journalist-token')
    const contactToken = request.headers.get('x-contact-token')

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

    let journalistId: string | null = null
    let isWhistleblower = false

    // Authenticate as journalist
    if (accessToken) {
      const journalist = await prisma.journalist.findUnique({
        where: { accessToken },
      })
      if (!journalist || journalist.status !== 'VERIFIED') {
        return NextResponse.json(
          { success: false, error: 'Invalid or unverified journalist token' },
          { status: 403 }
        )
      }
      journalistId = journalist.id
    }
    // Or authenticate as whistleblower
    else if (contactToken && post.contactToken === contactToken) {
      isWhistleblower = true
    } else {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch messages
    const messages = await prisma.privateMessage.findMany({
      where: {
        postId: post.id,
        OR: [
          { journalistId },
          { isFromWhistleblower: true },
        ],
      },
      include: {
        journalist: {
          select: { outlet: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Decrypt messages
    const decryptedMessages = messages.map((msg) => {
      const decryptKey = isWhistleblower ? post.contactToken! : accessToken!
      const decryptedContent = decryptMessage(msg.encryptedContent, decryptKey)

      return {
        id: msg.id,
        content: decryptedContent || '[Unable to decrypt]',
        isFromWhistleblower: msg.isFromWhistleblower,
        journalist: msg.journalist,
        read: msg.read,
        createdAt: msg.createdAt,
      }
    })

    // Mark messages as read
    if (isWhistleblower) {
      await prisma.privateMessage.updateMany({
        where: {
          postId: post.id,
          isFromWhistleblower: false,
          read: false,
        },
        data: { read: true, readAt: new Date() },
      })
    } else if (journalistId) {
      await prisma.privateMessage.updateMany({
        where: {
          postId: post.id,
          isFromWhistleblower: true,
          read: false,
        },
        data: { read: true, readAt: new Date() },
      })
    }

    return NextResponse.json({
      success: true,
      data: decryptedMessages,
    })
  } catch (error) {
    console.error('Error fetching private messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/posts/[publicId]/private-messages - Send a private message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params
    const body = await request.json()
    const { content, accessToken, contactToken } = body

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
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

    let journalistId: string | null = null
    let isFromWhistleblower = false
    let encryptKey: string

    // Authenticate and set encryption key
    if (accessToken) {
      const journalist = await prisma.journalist.findUnique({
        where: { accessToken },
      })
      if (!journalist || journalist.status !== 'VERIFIED') {
        return NextResponse.json(
          { success: false, error: 'Invalid or unverified journalist token' },
          { status: 403 }
        )
      }

      // Check premium subscription
      const subscription = await prisma.premiumSubscription.findUnique({
        where: { journalistId: journalist.id },
      })
      if (!subscription || subscription.status !== 'ACTIVE') {
        return NextResponse.json(
          { success: false, error: 'Premium subscription required for private messaging' },
          { status: 403 }
        )
      }

      journalistId = journalist.id
      encryptKey = accessToken
    } else if (contactToken && post.contactToken === contactToken) {
      isFromWhistleblower = true
      encryptKey = contactToken
    } else {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Encrypt and save message
    const encryptedContent = encryptMessage(sanitizeInput(content), encryptKey)

    const message = await prisma.privateMessage.create({
      data: {
        postId: post.id,
        journalistId,
        isFromWhistleblower,
        encryptedContent,
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
    console.error('Error sending private message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
