import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'
import { uploadToR2Raw, isR2Configured } from '@/lib/r2-storage'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export const maxDuration = 300 // 5 minutes for video uploads

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_GALLERY_ITEMS = 20

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

function isAllowedType(mimeType: string): 'image' | 'video' | false {
  const baseType = mimeType.split(';')[0].toLowerCase()
  if (ALLOWED_IMAGE_TYPES.includes(baseType)) return 'image'
  if (ALLOWED_VIDEO_TYPES.includes(baseType)) return 'video'
  return false
}

function getBaseMimeType(mimeType: string): string {
  return mimeType.split(';')[0].toLowerCase()
}

/**
 * POST /api/advertiser/business/media
 * Upload media for a business profile (logo, cover, intro video, gallery)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const advertiserId = formData.get('advertiserId') as string
    const sessionToken = formData.get('sessionToken') as string
    const businessId = formData.get('businessId') as string | null
    const mediaType = formData.get('mediaType') as string // 'logo', 'cover', 'introVideo', 'gallery'
    const file = formData.get('file') as File

    if (!advertiserId || !sessionToken || !mediaType || !file) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate media type
    if (!['logo', 'cover', 'introVideo', 'gallery'].includes(mediaType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid media type' },
        { status: 400 }
      )
    }

    // Verify session
    const advertiser = await prisma.advertiserAccount.findFirst({
      where: {
        id: advertiserId,
        sessionToken,
        sessionExpiresAt: { gt: new Date() },
      },
    })

    if (!advertiser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Validate file type
    const fileMediaType = isAllowedType(file.type)
    if (!fileMediaType) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP, MP4, WebM' },
        { status: 400 }
      )
    }

    // Validate media type constraints
    if (mediaType === 'logo' || mediaType === 'cover') {
      if (fileMediaType !== 'image') {
        return NextResponse.json(
          { success: false, error: `${mediaType} must be an image` },
          { status: 400 }
        )
      }
    }

    if (mediaType === 'introVideo') {
      if (fileMediaType !== 'video') {
        return NextResponse.json(
          { success: false, error: 'Intro video must be a video file' },
          { status: 400 }
        )
      }
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 100MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'bin'
    const filename = `${nanoid(12)}.${ext}`
    const baseMimeType = getBaseMimeType(file.type)

    // Get file buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let mediaPath: string

    if (isR2Configured()) {
      // Upload to R2 with custom path for business media
      const key = `business/${mediaType}/${businessId || advertiserId}/${filename}`
      const result = await uploadToR2Raw(key, buffer, baseMimeType)
      mediaPath = result.key
    } else {
      // Local storage fallback
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'business', mediaType)
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }
      const filepath = path.join(uploadDir, filename)
      await writeFile(filepath, buffer)
      mediaPath = `/uploads/business/${mediaType}/${filename}`
    }

    return NextResponse.json({
      success: true,
      data: {
        path: mediaPath,
        type: fileMediaType,
        filename: file.name,
        size: file.size,
      },
    })
  } catch (error) {
    console.error('[Business Media Upload] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}
