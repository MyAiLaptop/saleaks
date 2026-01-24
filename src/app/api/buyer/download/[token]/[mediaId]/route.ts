import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSignedDownloadUrl } from '@/lib/r2-storage'

/**
 * GET /api/buyer/download/[token]/[mediaId]
 *
 * Download clean original media file (no watermarks, no effects)
 * Requires valid download token from won auction
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; mediaId: string }> }
) {
  try {
    const { token, mediaId } = await params

    // Find won auction by download token
    const wonAuction = await prisma.wonAuction.findUnique({
      where: { downloadToken: token },
      include: {
        post: {
          include: {
            media: {
              where: { id: mediaId },
            },
          },
        },
      },
    })

    if (!wonAuction) {
      return NextResponse.json(
        { success: false, error: 'Invalid download token' },
        { status: 404 }
      )
    }

    // Check if download access is still valid
    if (wonAuction.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Download access has been revoked' },
        { status: 403 }
      )
    }

    if (wonAuction.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Download access has expired' },
        { status: 403 }
      )
    }

    if (wonAuction.downloadsUsed >= wonAuction.maxDownloads) {
      return NextResponse.json(
        { success: false, error: 'Download limit reached' },
        { status: 403 }
      )
    }

    // Get the media file
    const media = wonAuction.post.media[0]
    if (!media) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      )
    }

    // Use the ORIGINAL path (not watermarked) for clean download
    const downloadPath = media.path
    if (!downloadPath) {
      return NextResponse.json(
        { success: false, error: 'Original media file not available' },
        { status: 404 }
      )
    }

    // Increment download counter
    await prisma.wonAuction.update({
      where: { id: wonAuction.id },
      data: { downloadsUsed: { increment: 1 } },
    })

    // Generate signed URL for R2 download (1 hour expiry)
    const signedUrl = await getSignedDownloadUrl(downloadPath, 3600)

    if (!signedUrl) {
      // Fallback: return the path directly if R2 signing fails
      // This might be a local file
      if (downloadPath.startsWith('/')) {
        return NextResponse.redirect(new URL(downloadPath, request.url))
      }

      return NextResponse.json(
        { success: false, error: 'Failed to generate download URL' },
        { status: 500 }
      )
    }

    console.log(`[Download] Clean download for won auction ${wonAuction.id}: ${media.originalName || media.filename}`)

    // Redirect to signed download URL
    return NextResponse.redirect(signedUrl)
  } catch (error) {
    console.error('[Download] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process download' },
      { status: 500 }
    )
  }
}
