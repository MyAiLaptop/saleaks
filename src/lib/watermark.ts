import sharp from 'sharp'
import path from 'path'
import { existsSync } from 'fs'
import { writeFile, mkdir } from 'fs/promises'

// Watermark configuration
const WATERMARK_TEXT = 'SALEAKS.CO.ZA'
const WATERMARK_OPACITY = 0.6
const WATERMARK_COLOR = 'rgba(255, 255, 255, 0.9)'

/**
 * Creates an SVG watermark overlay for images
 */
function createWatermarkSvg(width: number, height: number, text: string = WATERMARK_TEXT): Buffer {
  // Calculate font size based on image dimensions (roughly 5% of the smaller dimension for better visibility)
  const fontSize = Math.max(24, Math.min(width, height) * 0.05)
  const padding = fontSize * 0.8
  const cornerFontSize = Math.max(32, Math.min(width, height) * 0.06)

  // Create diagonal repeated pattern watermark with larger, more visible text
  const svgText = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="watermarkPattern" x="0" y="0" width="${fontSize * 10}" height="${fontSize * 5}" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <text x="0" y="${fontSize}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${WATERMARK_COLOR}" opacity="${WATERMARK_OPACITY}">
            ${text}
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#watermarkPattern)" />
      <!-- Large corner watermark for clear visibility -->
      <text x="${width - padding}" y="${height - padding}" font-family="Arial, sans-serif" font-size="${cornerFontSize}" font-weight="bold" fill="white" text-anchor="end" opacity="0.85" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
        ${text}
      </text>
      <!-- Secondary watermark in top-left corner -->
      <text x="${padding}" y="${cornerFontSize + padding}" font-family="Arial, sans-serif" font-size="${cornerFontSize * 0.7}" font-weight="bold" fill="white" opacity="0.7" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
        ${text}
      </text>
    </svg>
  `

  return Buffer.from(svgText)
}

/**
 * Creates a centered watermark for thumbnails/smaller images
 */
function createCenteredWatermarkSvg(width: number, height: number, text: string = WATERMARK_TEXT): Buffer {
  const fontSize = Math.max(20, Math.min(width, height) * 0.12)

  const svgText = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Shadow layer for contrast -->
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="black" text-anchor="middle" dominant-baseline="middle" opacity="0.5" transform="translate(3, 3)">
        ${text}
      </text>
      <!-- Main text -->
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.8">
        ${text}
      </text>
    </svg>
  `

  return Buffer.from(svgText)
}

/**
 * Apply watermark to an image buffer
 */
export async function applyImageWatermark(
  imageBuffer: Buffer,
  mimeType: string,
  options?: {
    style?: 'tiled' | 'centered' | 'corner'
    text?: string
  }
): Promise<Buffer> {
  try {
    const style = options?.style || 'tiled'
    const text = options?.text || WATERMARK_TEXT

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 800
    const height = metadata.height || 600

    // Create appropriate watermark SVG
    let watermarkSvg: Buffer
    if (style === 'centered' || (width < 400 || height < 400)) {
      watermarkSvg = createCenteredWatermarkSvg(width, height, text)
    } else {
      watermarkSvg = createWatermarkSvg(width, height, text)
    }

    // Apply watermark
    let processor = sharp(imageBuffer)
      .composite([{
        input: watermarkSvg,
        top: 0,
        left: 0,
      }])

    // Output based on type
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
        // GIF - convert first frame to PNG with watermark
        processor = processor.png()
        break
      default:
        processor = processor.jpeg({ quality: 85 })
    }

    return await processor.toBuffer()
  } catch (error) {
    console.error('Error applying watermark:', error)
    // Return original if watermarking fails
    return imageBuffer
  }
}

/**
 * Create a watermarked version of an image and save it
 * Returns the path to the watermarked version
 */
export async function createWatermarkedImage(
  originalPath: string,
  mimeType: string
): Promise<string> {
  try {
    const fullPath = path.join(process.cwd(), 'public', originalPath)

    if (!existsSync(fullPath)) {
      throw new Error('Original file not found')
    }

    // Create watermarked directory structure
    const dir = path.dirname(fullPath)
    const watermarkedDir = path.join(dir, 'watermarked')
    const filename = path.basename(fullPath)
    const watermarkedPath = path.join(watermarkedDir, filename)

    // Ensure directory exists
    if (!existsSync(watermarkedDir)) {
      await mkdir(watermarkedDir, { recursive: true })
    }

    // Read original, apply watermark, save
    const originalBuffer = await sharp(fullPath).toBuffer()
    const watermarkedBuffer = await applyImageWatermark(originalBuffer, mimeType)

    await writeFile(watermarkedPath, watermarkedBuffer)

    // Return relative path for web
    const relativePath = originalPath.replace(/\/([^/]+)$/, '/watermarked/$1')
    return relativePath
  } catch (error) {
    console.error('Error creating watermarked image:', error)
    throw error
  }
}

/**
 * Generate video watermark command for ffmpeg
 * This returns the ffmpeg command arguments for watermarking
 */
export function getVideoWatermarkArgs(
  inputPath: string,
  outputPath: string,
  options?: {
    text?: string
    position?: 'topright' | 'bottomright' | 'center' | 'tiled'
  }
): string[] {
  const text = options?.text || WATERMARK_TEXT
  const position = options?.position || 'bottomright'

  // FFmpeg drawtext filter for watermark - using larger font sizes for visibility
  let positionFilter: string
  switch (position) {
    case 'topright':
      positionFilter = 'x=w-tw-30:y=30'
      break
    case 'center':
      positionFilter = 'x=(w-tw)/2:y=(h-th)/2'
      break
    case 'tiled':
      // For tiled, we use multiple drawtext filters with larger fonts
      return [
        '-i', inputPath,
        '-vf', `drawtext=text='${text}':fontcolor=white@0.7:fontsize=36:x=30:y=30:shadowcolor=black@0.5:shadowx=2:shadowy=2,drawtext=text='${text}':fontcolor=white@0.85:fontsize=48:x=w-tw-30:y=h-th-30:shadowcolor=black@0.6:shadowx=3:shadowy=3,drawtext=text='${text}':fontcolor=white@0.35:fontsize=64:x=(w-tw)/2:y=(h-th)/2`,
        '-codec:a', 'copy',
        '-y',
        outputPath
      ]
    case 'bottomright':
    default:
      positionFilter = 'x=w-tw-30:y=h-th-30'
  }

  return [
    '-i', inputPath,
    '-vf', `drawtext=text='${text}':fontcolor=white@0.85:fontsize=48:${positionFilter}:shadowcolor=black@0.6:shadowx=3:shadowy=3`,
    '-codec:a', 'copy',
    '-y',
    outputPath
  ]
}

/**
 * Apply watermark to video using ffmpeg (requires ffmpeg to be installed)
 * Returns the relative web path to the watermarked video
 */
export async function applyVideoWatermark(
  inputPath: string,
  outputPath: string,
  text: string = WATERMARK_TEXT
): Promise<void> {
  const { spawn } = await import('child_process')

  return new Promise((resolve, reject) => {
    // FFmpeg command with multiple large, visible watermarks
    // - Large watermark bottom-right (main, very visible)
    // - Medium watermark top-left
    // - Semi-transparent watermark in center
    const args = [
      '-i', inputPath,
      '-vf', [
        // Large bottom-right watermark (main)
        `drawtext=text='${text}':fontcolor=white@0.85:fontsize=48:x=w-tw-30:y=h-th-30:shadowcolor=black@0.6:shadowx=3:shadowy=3`,
        // Medium top-left watermark
        `drawtext=text='${text}':fontcolor=white@0.7:fontsize=36:x=30:y=40:shadowcolor=black@0.5:shadowx=2:shadowy=2`,
        // Semi-transparent center watermark (diagonal)
        `drawtext=text='${text}':fontcolor=white@0.35:fontsize=72:x=(w-tw)/2:y=(h-th)/2:shadowcolor=black@0.2:shadowx=2:shadowy=2`
      ].join(','),
      '-codec:a', 'copy',
      '-y',
      outputPath
    ]

    const ffmpeg = spawn('ffmpeg', args)

    let stderr = ''

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`))
      }
    })

    ffmpeg.on('error', (err) => {
      // FFmpeg not installed or not in PATH
      reject(new Error(`FFmpeg error: ${err.message}. Make sure ffmpeg is installed.`))
    })
  })
}

/**
 * Check if ffmpeg is available on the system
 */
export async function isFFmpegAvailable(): Promise<boolean> {
  const { spawn } = await import('child_process')

  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version'])

    ffmpeg.on('close', (code) => {
      resolve(code === 0)
    })

    ffmpeg.on('error', () => {
      resolve(false)
    })
  })
}

/**
 * Check if a file is an image based on MIME type
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

/**
 * Check if a file is a video based on MIME type
 */
export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}
