import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { nanoid } from 'nanoid'
import { sanitizeFilename } from './sanitize'
import { applyImageWatermark, isImage } from './watermark'
import { uploadToR2, isR2Configured, deleteFromR2 } from './r2-storage'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

// Allowed MIME types
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
])

// Max file size (50MB default)
const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || '50') || 50) * 1024 * 1024

export interface UploadedFile {
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
  watermarkedPath?: string
  // R2 storage fields
  r2OriginalKey?: string
  r2WatermarkedKey?: string
  storageType: 'local' | 'r2'
}

export async function saveUploadedFile(
  file: File,
  postId: string
): Promise<UploadedFile> {
  // Validate file type
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(`File type not allowed: ${file.type}`)
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB`)
  }

  // Generate safe filename
  const ext = path.extname(file.name) || ''
  const safeOriginalName = sanitizeFilename(file.name)
  const filename = `${nanoid(16)}${ext}`

  // Get file buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Strip metadata from images
  let finalBuffer: Buffer = buffer
  let watermarkedBuffer: Buffer | null = null

  if (file.type.startsWith('image/')) {
    finalBuffer = await stripImageMetadata(buffer, file.type)
    watermarkedBuffer = await applyImageWatermark(finalBuffer, file.type)
  }

  // Use R2 if configured, otherwise local storage
  if (isR2Configured()) {
    return saveToR2(filename, safeOriginalName, file.type, finalBuffer, watermarkedBuffer, postId)
  } else {
    return saveToLocal(filename, safeOriginalName, file.type, finalBuffer, watermarkedBuffer, postId)
  }
}

// Save files to Cloudflare R2
async function saveToR2(
  filename: string,
  originalName: string,
  mimeType: string,
  originalBuffer: Buffer,
  watermarkedBuffer: Buffer | null,
  postId: string
): Promise<UploadedFile> {
  // Upload original to R2
  const originalResult = await uploadToR2(originalBuffer, filename, {
    postType: 'leak',
    postId,
    folder: 'originals',
    mimeType,
  })

  // Upload watermarked version if available
  let watermarkedResult = null
  if (watermarkedBuffer) {
    watermarkedResult = await uploadToR2(watermarkedBuffer, filename, {
      postType: 'leak',
      postId,
      folder: 'watermarked',
      mimeType,
    })
  }

  return {
    filename,
    originalName,
    mimeType,
    size: originalBuffer.length,
    path: originalResult.key, // R2 key for original
    watermarkedPath: watermarkedResult?.url, // Public URL for watermarked
    r2OriginalKey: originalResult.key,
    r2WatermarkedKey: watermarkedResult?.key,
    storageType: 'r2',
  }
}

// Save files to local storage (fallback)
async function saveToLocal(
  filename: string,
  originalName: string,
  mimeType: string,
  originalBuffer: Buffer,
  watermarkedBuffer: Buffer | null,
  postId: string
): Promise<UploadedFile> {
  // Create upload directory for this post
  const postUploadDir = path.join(UPLOAD_DIR, postId)
  if (!existsSync(postUploadDir)) {
    await mkdir(postUploadDir, { recursive: true })
  }

  const filePath = path.join(postUploadDir, filename)

  // Write original file
  await writeFile(filePath, originalBuffer)

  // Write watermarked version
  let watermarkedPath: string | undefined
  if (watermarkedBuffer) {
    const watermarkedDir = path.join(postUploadDir, 'watermarked')
    if (!existsSync(watermarkedDir)) {
      await mkdir(watermarkedDir, { recursive: true })
    }
    const watermarkedFilePath = path.join(watermarkedDir, filename)
    await writeFile(watermarkedFilePath, watermarkedBuffer)
    watermarkedPath = `/uploads/${postId}/watermarked/${filename}`
  }

  return {
    filename,
    originalName,
    mimeType,
    size: originalBuffer.length,
    path: `/uploads/${postId}/${filename}`,
    watermarkedPath,
    storageType: 'local',
  }
}

// Strip EXIF and other metadata from images
async function stripImageMetadata(buffer: Buffer, mimeType: string): Promise<Buffer> {
  try {
    const sharp = (await import('sharp')).default

    let processor = sharp(buffer).rotate()

    switch (mimeType) {
      case 'image/jpeg':
        processor = processor.jpeg({ quality: 85 })
        break
      case 'image/png':
        processor = processor.png()
        break
      case 'image/webp':
        processor = processor.webp({ quality: 85 })
        break
      case 'image/gif':
        return buffer
      default:
        processor = processor.jpeg({ quality: 85 })
    }

    return await processor.toBuffer()
  } catch (error) {
    console.error('Error stripping metadata:', error)
    return buffer
  }
}

// Delete all files for a post
export async function deletePostFiles(postId: string): Promise<void> {
  // Delete local files
  const postUploadDir = path.join(UPLOAD_DIR, postId)
  if (existsSync(postUploadDir)) {
    const { rm } = await import('fs/promises')
    await rm(postUploadDir, { recursive: true, force: true })
  }
}

// Delete a specific file (handles both local and R2)
export async function deleteFile(filePath: string, storageType: 'local' | 'r2' = 'local'): Promise<void> {
  if (storageType === 'r2') {
    await deleteFromR2(filePath).catch(() => {})
  } else {
    const fullPath = path.join(process.cwd(), 'public', filePath)
    if (existsSync(fullPath)) {
      await unlink(fullPath)
    }
  }
}
