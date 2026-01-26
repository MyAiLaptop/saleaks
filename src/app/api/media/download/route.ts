import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// GET /api/media/download?token=xxx - Download purchased media
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Download token required' },
        { status: 400 }
      )
    }

    // Find purchase
    const purchase = await prisma.mediaPurchase.findUnique({
      where: { downloadToken: token },
    })

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Invalid download token' },
        { status: 404 }
      )
    }

    // Check purchase status
    if (purchase.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed' },
        { status: 403 }
      )
    }

    // Check expiration
    if (new Date() > purchase.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Download link has expired' },
        { status: 410 }
      )
    }

    // Check download limit
    if (purchase.downloadsUsed >= purchase.maxDownloads) {
      return NextResponse.json(
        { success: false, error: 'Download limit reached' },
        { status: 403 }
      )
    }

    // Get file details based on purchase type
    let filePath: string | null = null
    let filename: string = 'download'
    let mimeType: string = 'application/octet-stream'

    if (purchase.fileId) {
      const file = await prisma.file.findUnique({
        where: { id: purchase.fileId },
        select: { path: true, originalName: true, mimeType: true }
      })
      if (file) {
        filePath = file.path
        filename = file.originalName
        mimeType = file.mimeType
      }
    } else if (purchase.liveMediaId) {
      const media = await prisma.liveBillboardMedia.findUnique({
        where: { id: purchase.liveMediaId },
        select: { path: true, originalName: true, mimeType: true }
      })
      if (media) {
        filePath = media.path
        filename = media.originalName
        mimeType = media.mimeType
      }
    }

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'Media file not found' },
        { status: 404 }
      )
    }

    // Security: Validate file path to prevent path traversal attacks
    // Even though path comes from DB, validate as defense in depth
    const publicDir = path.join(process.cwd(), 'public')
    const fullPath = path.resolve(publicDir, filePath)

    // Ensure the resolved path is within the public directory
    if (!fullPath.startsWith(publicDir + path.sep) && fullPath !== publicDir) {
      console.error('[Download] Path traversal attempt detected:', filePath)
      return NextResponse.json(
        { success: false, error: 'Invalid file path' },
        { status: 403 }
      )
    }

    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { success: false, error: 'File not found on server' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await readFile(fullPath)

    // Increment download count
    await prisma.mediaPurchase.update({
      where: { id: purchase.id },
      data: { downloadsUsed: purchase.downloadsUsed + 1 }
    })

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { success: false, error: 'Download failed' },
      { status: 500 }
    )
  }
}
