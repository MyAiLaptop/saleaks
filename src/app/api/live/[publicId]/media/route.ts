import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { nanoid } from 'nanoid'
import { applyImageWatermark, applyVideoWatermark, isImage, isVideo, isFFmpegAvailable } from '@/lib/watermark'
import { uploadToR2, isR2Configured } from '@/lib/r2-storage'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB for videos
const MAX_FILES = 4
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]

// 2 days delay for social media publishing
const SOCIAL_PUBLISH_DELAY_MS = 2 * 24 * 60 * 60 * 1000

// POST /api/live/[publicId]/media - Upload media to a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params

    const post = await prisma.liveBillboard.findUnique({
      where: { publicId },
      select: {
        id: true,
        sessionToken: true,
        content: true,
        category: true,
        _count: { select: { media: true } }
      },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const sessionToken = formData.get('sessionToken') as string
    const files = formData.getAll('files') as File[]

    // Verify ownership
    if (post.sessionToken !== sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check file count
    if (post._count.media + files.length > MAX_FILES) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_FILES} files allowed per post` },
        { status: 400 }
      )
    }

    const uploadedMedia = []
    const useR2 = isR2Configured()

    // Local storage paths (fallback)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'live')
    const watermarkedDir = path.join(uploadDir, 'watermarked')

    if (!useR2) {
      await mkdir(uploadDir, { recursive: true })
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        continue
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        continue
      }

      // Generate unique filename
      const ext = file.name.split('.').pop() || 'bin'
      const filename = `${nanoid(12)}.${ext}`

      // Get file buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      let mediaPath: string
      let watermarkedPath: string | null = null
      let r2OriginalKey: string | null = null
      let r2WatermarkedKey: string | null = null
      let storageType: 'local' | 'r2' = 'local'

      if (useR2) {
        // Upload to Cloudflare R2
        storageType = 'r2'

        // Upload original
        const originalResult = await uploadToR2(buffer, filename, {
          postType: 'live',
          postId: post.id,
          folder: 'originals',
          mimeType: file.type,
        })
        r2OriginalKey = originalResult.key
        mediaPath = originalResult.key

        // Create and upload watermarked version
        if (isImage(file.type)) {
          try {
            const watermarkedBuffer = await applyImageWatermark(buffer, file.type)
            const wmResult = await uploadToR2(watermarkedBuffer, filename, {
              postType: 'live',
              postId: post.id,
              folder: 'watermarked',
              mimeType: file.type,
            })
            r2WatermarkedKey = wmResult.key
            watermarkedPath = wmResult.url
          } catch (err) {
            console.error('Error creating image watermark for R2:', err)
          }
        } else if (isVideo(file.type)) {
          // For videos, we need to process locally then upload
          const ffmpegAvailable = await isFFmpegAvailable()
          if (ffmpegAvailable) {
            try {
              // Create temp files for video processing
              const tempDir = path.join(process.cwd(), 'tmp')
              if (!existsSync(tempDir)) {
                await mkdir(tempDir, { recursive: true })
              }
              const tempOriginal = path.join(tempDir, `orig_${filename}`)
              const tempWatermarked = path.join(tempDir, `wm_${filename}`)

              // Write original to temp, watermark, upload
              await writeFile(tempOriginal, buffer)
              await applyVideoWatermark(tempOriginal, tempWatermarked)

              const { readFile, unlink } = await import('fs/promises')
              const watermarkedBuffer = await readFile(tempWatermarked)

              const wmResult = await uploadToR2(watermarkedBuffer, filename, {
                postType: 'live',
                postId: post.id,
                folder: 'watermarked',
                mimeType: file.type,
              })
              r2WatermarkedKey = wmResult.key
              watermarkedPath = wmResult.url

              // Clean up temp files
              await unlink(tempOriginal).catch(() => {})
              await unlink(tempWatermarked).catch(() => {})
            } catch (err) {
              console.error('Error creating video watermark for R2:', err)
            }
          }
        }
      } else {
        // Local storage fallback
        const filepath = path.join(uploadDir, filename)
        await writeFile(filepath, buffer)
        mediaPath = `/uploads/live/${filename}`

        if (isImage(file.type)) {
          try {
            if (!existsSync(watermarkedDir)) {
              await mkdir(watermarkedDir, { recursive: true })
            }
            const watermarkedBuffer = await applyImageWatermark(buffer, file.type)
            const watermarkedFilepath = path.join(watermarkedDir, filename)
            await writeFile(watermarkedFilepath, watermarkedBuffer)
            watermarkedPath = `/uploads/live/watermarked/${filename}`
          } catch (err) {
            console.error('Error creating image watermark:', err)
          }
        } else if (isVideo(file.type)) {
          try {
            const ffmpegAvailable = await isFFmpegAvailable()
            if (ffmpegAvailable) {
              if (!existsSync(watermarkedDir)) {
                await mkdir(watermarkedDir, { recursive: true })
              }
              const watermarkedFilepath = path.join(watermarkedDir, filename)
              await applyVideoWatermark(filepath, watermarkedFilepath)
              watermarkedPath = `/uploads/live/watermarked/${filename}`
            }
          } catch (err) {
            console.error('Error creating video watermark:', err)
          }
        }
      }

      // Save to database
      const media = await prisma.liveBillboardMedia.create({
        data: {
          postId: post.id,
          filename,
          originalName: file.name.substring(0, 255),
          mimeType: file.type,
          size: file.size,
          path: mediaPath,
          watermarkedPath,
          r2OriginalKey,
          r2WatermarkedKey,
          storageType,
          order: post._count.media + i,
        },
      })

      // Schedule video for social media publishing (2 days later)
      if (isVideo(file.type) && r2OriginalKey) {
        try {
          await prisma.scheduledPublish.create({
            data: {
              liveMediaId: media.id,
              title: `SA Leaks: ${post.category} - ${post.content.substring(0, 50)}...`,
              description: `${post.content}\n\nOriginal footage from SA Leaks - South Africa's citizen journalism platform.\n\n#SALeaks #SouthAfrica #${post.category}`,
              r2Key: r2OriginalKey,
              mimeType: file.type,
              scheduledFor: new Date(Date.now() + SOCIAL_PUBLISH_DELAY_MS),
            },
          })
        } catch (err) {
          console.error('Error scheduling social publish:', err)
        }
      }

      uploadedMedia.push(media)
    }

    return NextResponse.json({
      success: true,
      data: {
        media: uploadedMedia,
        count: uploadedMedia.length,
      },
    })
  } catch (error) {
    console.error('Error uploading media:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}
