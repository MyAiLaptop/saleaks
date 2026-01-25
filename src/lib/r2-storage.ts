import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Cloudflare R2 configuration (S3-compatible API)
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ''
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'saleaks-media'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '' // Custom domain or R2.dev URL

// Initialize S3 client for R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

// Check if R2 is configured
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY)
}

// Storage paths structure:
// /originals/{postType}/{postId}/{filename} - Original files (for purchases)
// /watermarked/{postType}/{postId}/{filename} - Watermarked files (for public display)
// /thumbnails/{postType}/{postId}/{filename} - Video thumbnails

export type PostType = 'leak' | 'live'

interface UploadResult {
  key: string
  url: string
  size: number
}

/**
 * Upload a file to R2 storage
 */
export async function uploadToR2(
  buffer: Buffer,
  filename: string,
  options: {
    postType: PostType
    postId: string
    folder: 'originals' | 'watermarked' | 'thumbnails'
    mimeType: string
  }
): Promise<UploadResult> {
  const { postType, postId, folder, mimeType } = options
  const key = `${folder}/${postType}/${postId}/${filename}`

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    // Cache watermarked files longer, originals shorter (for purchases)
    CacheControl: folder === 'watermarked' ? 'public, max-age=31536000' : 'private, max-age=3600',
  })

  await r2Client.send(command)

  // Return public URL for watermarked content, or key for private content
  const url = folder === 'watermarked' && R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL}/${key}`
    : key

  return {
    key,
    url,
    size: buffer.length,
  }
}

/**
 * Simple upload to R2 with a custom key path (for discussions, etc.)
 */
export async function uploadToR2Raw(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ key: string; url: string }> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000',
  })

  await r2Client.send(command)

  const url = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : key

  return { key, url }
}

/**
 * Get a signed URL for private content (original files for purchases)
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  return getSignedUrl(r2Client, command, { expiresIn })
}

/**
 * Delete a file from R2 storage
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  await r2Client.send(command)
}

/**
 * Delete all files for a post (originals, watermarked, thumbnails)
 */
export async function deletePostFiles(
  postType: PostType,
  postId: string,
  filenames: string[]
): Promise<void> {
  const folders = ['originals', 'watermarked', 'thumbnails'] as const

  const deletePromises = filenames.flatMap(filename =>
    folders.map(folder =>
      deleteFromR2(`${folder}/${postType}/${postId}/${filename}`).catch(() => {
        // Ignore errors for files that don't exist
      })
    )
  )

  await Promise.all(deletePromises)
}

/**
 * Get the public URL for a watermarked file
 */
export function getPublicUrl(key: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`
  }
  // Fallback: would need to use signed URLs if no public domain configured
  return key
}

/**
 * Download a file from R2 (for processing, e.g., social media publishing)
 */
export async function downloadFromR2(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  const response = await r2Client.send(command)

  if (!response.Body) {
    throw new Error('No body in response')
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }

  return Buffer.concat(chunks)
}
