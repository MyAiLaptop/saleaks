import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizeInput } from '@/lib/sanitize'
import { nanoid } from 'nanoid'
import CryptoJS from 'crypto-js'

// Encryption key - in production, use environment variable
const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY || 'marketplace-message-key-change-in-prod'

// Encrypt message content
function encryptMessage(content: string): string {
  return CryptoJS.AES.encrypt(content, ENCRYPTION_KEY).toString()
}

// Decrypt message content
function decryptMessage(encrypted: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch {
    return '[Message could not be decrypted]'
  }
}

// POST - Send message to seller
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params
    const body = await request.json()
    const { content, senderPhone, senderDeviceId, senderName } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
        { status: 400 }
      )
    }

    if (!senderPhone && !senderDeviceId) {
      return NextResponse.json(
        { success: false, error: 'Sender identification is required' },
        { status: 400 }
      )
    }

    // Find the listing
    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        OR: [
          { id: listingId },
          { publicId: listingId },
        ],
        status: 'active',
      },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Determine if sender is the seller
    const isSeller =
      (senderPhone && listing.sellerPhone === senderPhone) ||
      (senderDeviceId && listing.deviceId === senderDeviceId)

    // Generate or find thread ID (unique per buyer-seller pair)
    // Thread ID is based on listing + sender identity
    const senderIdentifier = senderPhone || senderDeviceId || ''
    const threadId = `${listing.id}-${CryptoJS.MD5(senderIdentifier).toString().slice(0, 8)}`

    // Sanitize and encrypt content
    const sanitizedContent = sanitizeInput(content).slice(0, 2000)
    const encryptedContent = encryptMessage(sanitizedContent)

    // Create message
    const message = await prisma.marketplaceMessage.create({
      data: {
        listingId: listing.id,
        threadId,
        senderPhone,
        senderDeviceId,
        senderName: senderName ? sanitizeInput(senderName).slice(0, 50) : null,
        isSeller,
        content: encryptedContent,
      },
    })

    // Update listing message count
    await prisma.marketplaceListing.update({
      where: { id: listing.id },
      data: { messageCount: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        threadId: message.threadId,
        createdAt: message.createdAt,
        isSeller: message.isSeller,
      },
      message: 'Message sent successfully',
    })
  } catch (error) {
    console.error('[Marketplace] Error sending message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

// GET - Get messages for a listing (for seller or specific thread)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params
    const { searchParams } = new URL(request.url)
    const userPhone = searchParams.get('userPhone')
    const deviceId = searchParams.get('deviceId')
    const threadId = searchParams.get('threadId')

    if (!userPhone && !deviceId) {
      return NextResponse.json(
        { success: false, error: 'User identification is required' },
        { status: 400 }
      )
    }

    // Find the listing
    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        OR: [
          { id: listingId },
          { publicId: listingId },
        ],
      },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Check if user is the seller
    const isSeller =
      (userPhone && listing.sellerPhone === userPhone) ||
      (deviceId && listing.deviceId === deviceId)

    let messages
    if (isSeller) {
      // Seller can see all messages or filter by thread
      const where: Record<string, unknown> = { listingId: listing.id }
      if (threadId) {
        where.threadId = threadId
      }

      messages = await prisma.marketplaceMessage.findMany({
        where,
        orderBy: { createdAt: 'asc' },
      })
    } else {
      // Buyer can only see their own thread
      const senderIdentifier = userPhone || deviceId || ''
      const buyerThreadId = `${listing.id}-${CryptoJS.MD5(senderIdentifier).toString().slice(0, 8)}`

      messages = await prisma.marketplaceMessage.findMany({
        where: {
          listingId: listing.id,
          threadId: buyerThreadId,
        },
        orderBy: { createdAt: 'asc' },
      })
    }

    // Decrypt messages and format response
    const decryptedMessages = messages.map(msg => ({
      id: msg.id,
      threadId: msg.threadId,
      senderName: msg.senderName,
      isSeller: msg.isSeller,
      content: decryptMessage(msg.content),
      isRead: msg.isRead,
      createdAt: msg.createdAt,
    }))

    // Mark messages as read
    if (messages.length > 0) {
      const unreadIds = messages
        .filter(m => !m.isRead && m.isSeller !== isSeller)
        .map(m => m.id)

      if (unreadIds.length > 0) {
        await prisma.marketplaceMessage.updateMany({
          where: { id: { in: unreadIds } },
          data: { isRead: true },
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        messages: decryptedMessages,
        isSeller,
        listingTitle: listing.title,
      },
    })
  } catch (error) {
    console.error('[Marketplace] Error fetching messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
