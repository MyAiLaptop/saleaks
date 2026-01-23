import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// MIME types for common file extensions
const mimeTypes: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
}

// Try multiple possible locations for the public folder
// This handles both development and Docker standalone mode
function findPublicFile(filePath: string): string | null {
  const possiblePaths = [
    // Development / normal mode
    path.join(process.cwd(), 'public', filePath),
    // Docker standalone - absolute path
    path.join('/app', 'public', filePath),
    // Docker standalone - relative to server
    path.join('/app/public', filePath),
  ]

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      return p
    }
  }
  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params
  const filePath = pathSegments.join('/')

  // Security: prevent directory traversal
  if (filePath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  // Find the file
  const fullPath = findPublicFile(filePath)

  if (!fullPath) {
    console.error(`Static file not found: ${filePath}`)
    console.error(`CWD: ${process.cwd()}`)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  try {
    const fileBuffer = await readFile(fullPath)
    const ext = path.extname(fullPath).toLowerCase()
    const contentType = mimeTypes[ext] || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error(`Error reading file: ${fullPath}`, error)
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
  }
}
