import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'
import { uploadToR2Raw, isR2Configured } from '@/lib/r2-storage'
import path from 'path'
import fs from 'fs/promises'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// POST - Upload video for response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string; responseId: string }> }
) {
  try {
    const { topicId, responseId } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const sessionToken = formData.get('sessionToken') as string | null

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Session token required' },
        { status: 401 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Verify response exists and user owns it
    const response = await prisma.topicResponse.findFirst({
      where: {
        OR: [
          { id: responseId },
          { publicId: responseId },
        ],
      },
      include: { topic: true, media: true },
    })

    if (!response) {
      return NextResponse.json(
        { success: false, error: 'Response not found' },
        { status: 404 }
      )
    }

    // Verify the topic matches
    if (response.topic.publicId !== topicId && response.topic.id !== topicId) {
      return NextResponse.json(
        { success: false, error: 'Response does not belong to this topic' },
        { status: 400 }
      )
    }

    // Verify ownership
    if (response.creatorToken !== sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to upload to this response' },
        { status: 403 }
      )
    }

    // Check if already has media
    if (response.media) {
      return NextResponse.json(
        { success: false, error: 'Response already has a video' },
        { status: 400 }
      )
    }

    // Validate file type (video only)
    const mimeType = file.type
    if (!mimeType.startsWith('video/')) {
      return NextResponse.json(
        { success: false, error: 'Only video files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 50MB)' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = path.extname(file.name) || '.webm'
    const filename = `discussion-${nanoid(12)}${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    let mediaPath = ''
    let storageType = 'local'
    let r2OriginalKey: string | null = null

    // Try R2 upload first
    if (isR2Configured()) {
      try {
        const r2Key = `discussions/${response.topicId}/${filename}`
        await uploadToR2Raw(r2Key, buffer, mimeType)
        r2OriginalKey = r2Key
        mediaPath = r2Key
        storageType = 'r2'
      } catch (r2Error) {
        console.error('R2 upload failed, falling back to local:', r2Error)
      }
    }

    // Fallback to local storage
    if (storageType === 'local') {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'discussions')
      await fs.mkdir(uploadsDir, { recursive: true })
      const localPath = path.join(uploadsDir, filename)
      await fs.writeFile(localPath, buffer)
      mediaPath = `/uploads/discussions/${filename}`
    }

    // Create media record
    const media = await prisma.topicResponseMedia.create({
      data: {
        responseId: response.id,
        filename,
        mimeType,
        size: file.size,
        path: mediaPath,
        r2OriginalKey,
        storageType,
      },
    })

    return NextResponse.json({
      success: true,
      data: { media },
    })
  } catch (error) {
    console.error('Error uploading media:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}
