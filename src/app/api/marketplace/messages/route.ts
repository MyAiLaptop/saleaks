import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import CryptoJS from 'crypto-js'

// Encryption key - in production, use environment variable
const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY || 'marketplace-message-key-change-in-prod'

// Decrypt message content
function decryptMessage(encrypted: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch {
    return '[Message could not be decrypted]'
  }
}

// GET - Get all message threads for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userPhone = searchParams.get('userPhone')
    const deviceId = searchParams.get('deviceId')

    if (!userPhone && !deviceId) {
      return NextResponse.json(
        { success: false, error: 'User identification is required' },
        { status: 400 }
      )
    }

    // Get all listings where user is the seller
    const sellerListings = await prisma.marketplaceListing.findMany({
      where: {
        OR: [
          userPhone ? { sellerPhone: userPhone } : {},
          deviceId ? { deviceId } : {},
        ].filter(c => Object.keys(c).length > 0),
      },
      select: { id: true, title: true, publicId: true },
    })

    const sellerListingIds = sellerListings.map(l => l.id)

    // Get all unique threads where user is a participant
    // Either as seller (owns the listing) or as buyer (sent messages)
    const senderIdentifier = userPhone || deviceId || ''
    const buyerThreadPrefix = CryptoJS.MD5(senderIdentifier).toString().slice(0, 8)

    // Get threads where user is buyer
    const buyerMessages = await prisma.marketplaceMessage.findMany({
      where: {
        OR: [
          userPhone ? { senderPhone: userPhone } : {},
          deviceId ? { senderDeviceId: deviceId } : {},
        ].filter(c => Object.keys(c).length > 0),
      },
      include: {
        listing: {
          select: {
            id: true,
            publicId: true,
            title: true,
            sellerName: true,
            images: {
              take: 1,
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get threads where user is seller
    const sellerMessages = sellerListingIds.length > 0
      ? await prisma.marketplaceMessage.findMany({
          where: {
            listingId: { in: sellerListingIds },
          },
          include: {
            listing: {
              select: {
                id: true,
                publicId: true,
                title: true,
                sellerName: true,
                images: {
                  take: 1,
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      : []

    // Group messages by thread
    const threadMap = new Map<string, {
      threadId: string
      listingId: string
      listingPublicId: string
      listingTitle: string
      listingImage: string | null
      otherPartyName: string | null
      isSeller: boolean
      lastMessage: {
        content: string
        createdAt: Date
        isSeller: boolean
      }
      unreadCount: number
    }>()

    // Process buyer messages
    for (const msg of buyerMessages) {
      const existing = threadMap.get(msg.threadId)
      if (!existing || msg.createdAt > existing.lastMessage.createdAt) {
        const unreadCount = buyerMessages.filter(
          m => m.threadId === msg.threadId && !m.isRead && m.isSeller
        ).length

        threadMap.set(msg.threadId, {
          threadId: msg.threadId,
          listingId: msg.listing.id,
          listingPublicId: msg.listing.publicId,
          listingTitle: msg.listing.title,
          listingImage: msg.listing.images[0]?.url || null,
          otherPartyName: msg.listing.sellerName || 'Seller',
          isSeller: false,
          lastMessage: {
            content: decryptMessage(msg.content).slice(0, 100),
            createdAt: msg.createdAt,
            isSeller: msg.isSeller,
          },
          unreadCount,
        })
      }
    }

    // Process seller messages
    for (const msg of sellerMessages) {
      const existing = threadMap.get(msg.threadId)
      if (!existing || msg.createdAt > existing.lastMessage.createdAt) {
        const unreadCount = sellerMessages.filter(
          m => m.threadId === msg.threadId && !m.isRead && !m.isSeller
        ).length

        threadMap.set(msg.threadId, {
          threadId: msg.threadId,
          listingId: msg.listing.id,
          listingPublicId: msg.listing.publicId,
          listingTitle: msg.listing.title,
          listingImage: msg.listing.images[0]?.url || null,
          otherPartyName: msg.senderName || 'Buyer',
          isSeller: true,
          lastMessage: {
            content: decryptMessage(msg.content).slice(0, 100),
            createdAt: msg.createdAt,
            isSeller: msg.isSeller,
          },
          unreadCount,
        })
      }
    }

    // Convert to array and sort by last message date
    const threads = Array.from(threadMap.values())
      .sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime())

    // Count total unread
    const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0)

    return NextResponse.json({
      success: true,
      data: {
        threads,
        totalUnread,
      },
    })
  } catch (error) {
    console.error('[Marketplace] Error fetching message threads:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
