import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

/**
 * GET /api/buyer/content
 *
 * Get buyer's won auctions and purchased content
 * These are available for immediate clean download
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const buyerId = cookieStore.get('buyer_id')?.value

    if (!buyerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get all won auctions with content details
    const wonAuctions = await prisma.wonAuction.findMany({
      where: {
        buyerId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { wonAt: 'desc' },
      include: {
        post: {
          select: {
            id: true,
            publicId: true,
            content: true,
            category: true,
            province: true,
            city: true,
            createdAt: true,
            media: {
              select: {
                id: true,
                filename: true,
                originalName: true,
                mimeType: true,
                size: true,
                path: true,           // Original clean path
                watermarkedPath: true, // Watermarked version (not used for download)
                thumbnailPath: true,
              },
            },
          },
        },
      },
    })

    const content = wonAuctions.map((won) => ({
      id: won.id,
      postId: won.post.publicId,
      title: won.post.content.substring(0, 100) + (won.post.content.length > 100 ? '...' : ''),
      category: won.post.category,
      province: won.post.province,
      city: won.post.city,
      wonAt: won.wonAt,
      amountPaid: won.winningBid,
      downloadToken: won.downloadToken,
      downloadsUsed: won.downloadsUsed,
      maxDownloads: won.maxDownloads,
      expiresAt: won.expiresAt,
      media: won.post.media.map((m) => ({
        id: m.id,
        filename: m.originalName || m.filename,
        mimeType: m.mimeType,
        size: m.size,
        isVideo: m.mimeType?.startsWith('video/'),
        thumbnail: m.thumbnailPath || m.watermarkedPath,
        // Download URL - clean original without watermark
        downloadUrl: `/api/buyer/download/${won.downloadToken}/${m.id}`,
      })),
      contentCreatedAt: won.post.createdAt,
    }))

    return NextResponse.json({
      success: true,
      data: {
        content,
        total: content.length,
      },
    })
  } catch (error) {
    console.error('[Buyer Content] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}
