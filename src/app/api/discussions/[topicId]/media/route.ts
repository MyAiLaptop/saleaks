import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'
import { uploadToR2Raw, isR2Configured } from '@/lib/r2-storage'
import path from 'path'
import fs from 'fs/promises'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB for intro videos

// POST - Upload intro video for topic
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params
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

    // Verify topic exists and user owns it
    const topic = await prisma.topic.findFirst({
      where: {
        OR: [
          { id: topicId },
          { publicId: topicId },
        ],
      },
      include: { introVideo: true },
    })

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (topic.creatorToken !== sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to upload to this topic' },
        { status: 403 }
      )
    }

    // Check if already has media - delete old one if exists
    if (topic.introVideo) {
      await prisma.topicMedia.delete({
        where: { id: topic.introVideo.id },
      })
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
        { success: false, error: 'File too large (max 100MB)' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = path.extname(file.name) || '.webm'
    const filename = `topic-${nanoid(12)}${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    let mediaPath = ''
    let storageType = 'local'
    let r2OriginalKey: string | null = null

    // Try R2 upload first
    if (isR2Configured()) {
      try {
        const r2Key = `discussions/topics/${topic.id}/${filename}`
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
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'discussions', 'topics')
      await fs.mkdir(uploadsDir, { recursive: true })
      const localPath = path.join(uploadsDir, filename)
      await fs.writeFile(localPath, buffer)
      mediaPath = `/uploads/discussions/topics/${filename}`
    }

    // Create media record
    const media = await prisma.topicMedia.create({
      data: {
        topicId: topic.id,
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
    console.error('Error uploading topic media:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}
