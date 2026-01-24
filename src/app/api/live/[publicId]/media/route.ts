import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { nanoid } from 'nanoid'
import { applyImageWatermark, applyVideoWatermark, isImage, isVideo, isFFmpegAvailable } from '@/lib/watermark'
import { uploadToR2, isR2Configured } from '@/lib/r2-storage'
import { moderateImageContent, moderateVideoContent, type ModerationResult } from '@/lib/content-moderation'

// Allow up to 5 minutes for video processing (watermarking + upload)
export const maxDuration = 300

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB for videos
const MAX_FILES = 10 // Allow media bundles (mixed videos and images)
// Base MIME types (without codec info)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']

// Helper to check if file type is allowed (handles codec suffixes like video/webm;codecs=vp9)
function isAllowedType(mimeType: string): boolean {
  // Get base type without codec info (e.g., "video/webm;codecs=vp9" -> "video/webm")
  const baseType = mimeType.split(';')[0].toLowerCase()
  return ALLOWED_IMAGE_TYPES.includes(baseType) || ALLOWED_VIDEO_TYPES.includes(baseType)
}

// Get clean base MIME type for storage
function getBaseMimeType(mimeType: string): string {
  return mimeType.split(';')[0].toLowerCase()
}

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

      console.log(`[Media Upload] Processing file ${i + 1}/${files.length}: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`)

      // Validate file type (handles codec suffixes like video/webm;codecs=vp9)
      if (!isAllowedType(file.type)) {
        console.log(`[Media Upload] Skipping file - invalid type: ${file.type}`)
        continue
      }

      // Get clean base MIME type for storage and processing
      const baseMimeType = getBaseMimeType(file.type)
      console.log(`[Media Upload] Base MIME type: ${baseMimeType}`)

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        console.log(`[Media Upload] Skipping file - too large: ${file.size} bytes`)
        continue
      }

      // Generate unique filename
      const ext = file.name.split('.').pop() || 'bin'
      const filename = `${nanoid(12)}.${ext}`

      // Get file buffer
      console.log(`[Media Upload] Reading file into buffer...`)
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      console.log(`[Media Upload] Buffer ready: ${buffer.length} bytes`)

      // Run content moderation on the media
      console.log(`[Media Upload] Running content moderation...`)
      let moderationResult: ModerationResult
      try {
        if (isImage(baseMimeType)) {
          moderationResult = await moderateImageContent(buffer, baseMimeType)
        } else if (isVideo(baseMimeType)) {
          moderationResult = await moderateVideoContent(buffer, baseMimeType)
        } else {
          moderationResult = { status: 'PENDING', score: 0, flags: [], requiresReview: false }
        }
        console.log(`[Media Upload] Moderation result:`, moderationResult)
      } catch (modError) {
        console.error('[Media Upload] Moderation error:', modError)
        // On moderation error, allow upload but mark for review
        moderationResult = { status: 'PENDING', score: 0, flags: [], requiresReview: true }
      }

      // If content is auto-rejected, skip this file
      if (moderationResult.status === 'REJECTED') {
        console.log(`[Media Upload] File rejected by moderation: ${file.name}`)
        continue
      }

      let mediaPath: string
      let watermarkedPath: string | null = null
      let r2OriginalKey: string | null = null
      let r2WatermarkedKey: string | null = null
      let storageType: 'local' | 'r2' = 'local'

      if (useR2) {
        // Upload to Cloudflare R2
        storageType = 'r2'
        console.log(`[Media Upload] Using R2 storage`)

        // Upload original
        console.log(`[Media Upload] Uploading original to R2...`)
        const uploadStartTime = Date.now()
        const originalResult = await uploadToR2(buffer, filename, {
          postType: 'live',
          postId: post.id,
          folder: 'originals',
          mimeType: baseMimeType, // Use clean MIME type without codec info
        })
        console.log(`[Media Upload] Original uploaded to R2 in ${Date.now() - uploadStartTime}ms: ${originalResult.key}`)
        r2OriginalKey = originalResult.key
        mediaPath = originalResult.key

        // Also create a public URL for the original (used as fallback if watermarking fails)
        const r2PublicUrl = process.env.R2_PUBLIC_URL
        const originalPublicUrl = r2PublicUrl ? `${r2PublicUrl}/${originalResult.key}` : originalResult.key

        // Create and upload watermarked version
        if (isImage(file.type)) {
          try {
            const watermarkedBuffer = await applyImageWatermark(buffer, file.type)
            const wmResult = await uploadToR2(watermarkedBuffer, filename, {
              postType: 'live',
              postId: post.id,
              folder: 'watermarked',
              mimeType: baseMimeType, // Use clean MIME type without codec info
            })
            r2WatermarkedKey = wmResult.key
            watermarkedPath = wmResult.url
          } catch (err) {
            console.error('Error creating image watermark for R2:', err)
            // Fallback: use original file URL if watermarking fails
            watermarkedPath = originalPublicUrl
          }
        } else if (isVideo(file.type)) {
          // For videos, we need to process locally then upload
          console.log(`[Media Upload] Processing video...`)
          const ffmpegAvailable = await isFFmpegAvailable()
          console.log(`[Media Upload] FFmpeg available: ${ffmpegAvailable}`)
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
              console.log(`[Media Upload] Writing to temp file: ${tempOriginal}`)
              await writeFile(tempOriginal, buffer)

              console.log(`[Media Upload] Starting video watermark (this may take a while)...`)
              const wmStartTime = Date.now()
              await applyVideoWatermark(tempOriginal, tempWatermarked)
              console.log(`[Media Upload] Video watermark completed in ${Date.now() - wmStartTime}ms`)

              const { readFile, unlink } = await import('fs/promises')
              const watermarkedBuffer = await readFile(tempWatermarked)
              console.log(`[Media Upload] Watermarked video size: ${watermarkedBuffer.length} bytes`)

              console.log(`[Media Upload] Uploading watermarked video to R2...`)
              const wmUploadStartTime = Date.now()
              const wmResult = await uploadToR2(watermarkedBuffer, filename, {
                postType: 'live',
                postId: post.id,
                folder: 'watermarked',
                mimeType: baseMimeType, // Use clean MIME type without codec info
              })
              console.log(`[Media Upload] Watermarked video uploaded in ${Date.now() - wmUploadStartTime}ms: ${wmResult.key}`)
              r2WatermarkedKey = wmResult.key
              watermarkedPath = wmResult.url

              // Clean up temp files
              await unlink(tempOriginal).catch(() => {})
              await unlink(tempWatermarked).catch(() => {})
              console.log(`[Media Upload] Temp files cleaned up`)
            } catch (err) {
              console.error('[Media Upload] Error creating video watermark for R2:', err)
              // Fallback: use original file URL if watermarking fails
              watermarkedPath = originalPublicUrl
              console.log(`[Media Upload] Using original video URL as fallback: ${originalPublicUrl}`)
            }
          } else {
            // FFmpeg not available - use original file URL
            console.log('[Media Upload] FFmpeg not available, using original video without watermark')
            watermarkedPath = originalPublicUrl
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
      // For R2 storage, ensure watermarkedPath is always set (for display)
      // path stores the original URL/key for purchases
      const media = await prisma.liveBillboardMedia.create({
        data: {
          postId: post.id,
          filename,
          originalName: file.name.substring(0, 255),
          mimeType: baseMimeType, // Use clean MIME type without codec info
          size: file.size,
          path: mediaPath,
          watermarkedPath: watermarkedPath || mediaPath, // Ensure watermarkedPath is always set
          r2OriginalKey,
          r2WatermarkedKey,
          storageType,
          order: post._count.media + i,
          // Content moderation fields
          moderationStatus: moderationResult.status,
          moderationScore: moderationResult.score,
          moderationFlags: moderationResult.flags.length > 0 ? JSON.stringify(moderationResult.flags) : null,
          moderatedAt: new Date(),
        },
      })

      // Schedule video for social media publishing (2 days later)
      if (isVideo(baseMimeType) && r2OriginalKey) {
        try {
          await prisma.scheduledPublish.create({
            data: {
              liveMediaId: media.id,
              title: `SpillNova: ${post.category} - ${post.content.substring(0, 50)}...`,
              description: `${post.content}\n\nOriginal footage from SpillNova - South Africa's citizen journalism platform.\n\n#SpillNova #SouthAfrica #${post.category}`,
              r2Key: r2OriginalKey,
              mimeType: baseMimeType, // Use clean MIME type without codec info
              scheduledFor: new Date(Date.now() + SOCIAL_PUBLISH_DELAY_MS),
            },
          })
        } catch (err) {
          console.error('Error scheduling social publish:', err)
        }
      }

      console.log(`[Media Upload] Media saved to database: ${media.id}`)
      console.log(`[Media Upload] - Path: ${media.path}`)
      console.log(`[Media Upload] - Watermarked: ${media.watermarkedPath}`)
      console.log(`[Media Upload] - Storage: ${media.storageType}`)
      uploadedMedia.push(media)
    }

    console.log(`[Media Upload] Complete! ${uploadedMedia.length} files uploaded successfully`)
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
