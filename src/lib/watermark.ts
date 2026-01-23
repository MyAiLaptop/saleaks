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
  // Calculate font size based on image dimensions - LARGE watermarks (15% of smaller dimension)
  const fontSize = Math.max(48, Math.min(width, height) * 0.15)
  const padding = fontSize * 0.5
  const cornerFontSize = Math.max(64, Math.min(width, height) * 0.18)

  // Create diagonal repeated pattern watermark with LARGE, very visible text
  const svgText = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="watermarkPattern" x="0" y="0" width="${fontSize * 8}" height="${fontSize * 4}" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <text x="0" y="${fontSize}" font-family="Arial Black, Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="${WATERMARK_COLOR}" opacity="${WATERMARK_OPACITY}">
            ${text}
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#watermarkPattern)" />
      <!-- LARGE corner watermark for clear visibility -->
      <text x="${width - padding}" y="${height - padding}" font-family="Arial Black, Arial, sans-serif" font-size="${cornerFontSize}" font-weight="900" fill="white" text-anchor="end" opacity="0.9" style="text-shadow: 4px 4px 8px rgba(0,0,0,0.9);">
        ${text}
      </text>
      <!-- Secondary watermark in top-left corner -->
      <text x="${padding}" y="${cornerFontSize + padding}" font-family="Arial Black, Arial, sans-serif" font-size="${cornerFontSize * 0.8}" font-weight="900" fill="white" opacity="0.8" style="text-shadow: 4px 4px 8px rgba(0,0,0,0.9);">
        ${text}
      </text>
      <!-- Center watermark -->
      <text x="${width / 2}" y="${height / 2}" font-family="Arial Black, Arial, sans-serif" font-size="${cornerFontSize * 1.5}" font-weight="900" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.5" style="text-shadow: 4px 4px 8px rgba(0,0,0,0.8);">
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
  // LARGE centered watermark - 35% of smaller dimension
  const fontSize = Math.max(40, Math.min(width, height) * 0.35)

  const svgText = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Shadow layer for contrast -->
      <text x="50%" y="50%" font-family="Arial Black, Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="black" text-anchor="middle" dominant-baseline="middle" opacity="0.6" transform="translate(4, 4)">
        ${text}
      </text>
      <!-- Main text -->
      <text x="50%" y="50%" font-family="Arial Black, Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.9">
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

  // FFmpeg drawtext filter for watermark - using LARGE font sizes (10x bigger)
  let positionFilter: string
  switch (position) {
    case 'topright':
      positionFilter = 'x=w-tw-50:y=50'
      break
    case 'center':
      positionFilter = 'x=(w-tw)/2:y=(h-th)/2'
      break
    case 'tiled':
      // For tiled, we use multiple drawtext filters with LARGE fonts
      return [
        '-i', inputPath,
        '-vf', `drawtext=text='${text}':fontcolor=white@0.8:fontsize=h/10:x=50:y=50:shadowcolor=black@0.7:shadowx=4:shadowy=4,drawtext=text='${text}':fontcolor=white@0.9:fontsize=h/8:x=w-tw-50:y=h-th-50:shadowcolor=black@0.8:shadowx=5:shadowy=5,drawtext=text='${text}':fontcolor=white@0.5:fontsize=h/5:x=(w-tw)/2:y=(h-th)/2`,
        '-codec:a', 'copy',
        '-y',
        outputPath
      ]
    case 'bottomright':
    default:
      positionFilter = 'x=w-tw-50:y=h-th-50'
  }

  return [
    '-i', inputPath,
    '-vf', `drawtext=text='${text}':fontcolor=white@0.9:fontsize=h/8:${positionFilter}:shadowcolor=black@0.8:shadowx=5:shadowy=5`,
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
    // FFmpeg command with LARGE, very visible watermarks
    // - Very large watermark bottom-right (main)
    // - Large watermark top-left
    // - Semi-transparent HUGE watermark in center
    const args = [
      '-i', inputPath,
      '-vf', [
        // VERY LARGE bottom-right watermark (main) - 10x bigger
        `drawtext=text='${text}':fontcolor=white@0.9:fontsize=h/8:x=w-tw-50:y=h-th-50:shadowcolor=black@0.8:shadowx=5:shadowy=5`,
        // LARGE top-left watermark
        `drawtext=text='${text}':fontcolor=white@0.8:fontsize=h/10:x=50:y=80:shadowcolor=black@0.7:shadowx=4:shadowy=4`,
        // Semi-transparent HUGE center watermark
        `drawtext=text='${text}':fontcolor=white@0.5:fontsize=h/5:x=(w-tw)/2:y=(h-th)/2:shadowcolor=black@0.3:shadowx=4:shadowy=4`
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
