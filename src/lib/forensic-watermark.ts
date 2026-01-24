/**
 * Forensic Watermarking System
 *
 * This library creates unique, traceable watermarks for each viewing session.
 * If content is leaked, we can trace it back to the specific viewer.
 *
 * Based on industry standards used by Netflix, Disney+, and major studios.
 * See: https://www.vdocipher.com/blog/forensic-watermarking/
 */

import crypto from 'crypto'

// Session watermark data
export interface SessionWatermark {
  sessionId: string           // Unique session identifier
  timestamp: number           // When the session started
  fingerprint: string         // Browser/device fingerprint hash
  userId?: string             // Optional user identifier (last 4 of phone, etc.)
  contentId: string           // The content being viewed
  encoded: string             // Base64 encoded watermark data
  shortCode: string           // Short human-readable code (for visible watermarks)
}

/**
 * Generate a unique session watermark for content viewing
 */
export function generateSessionWatermark(
  contentId: string,
  fingerprint: string,
  userId?: string
): SessionWatermark {
  const timestamp = Date.now()

  // Create unique session ID
  const sessionData = `${contentId}:${fingerprint}:${timestamp}:${Math.random()}`
  const sessionId = crypto
    .createHash('sha256')
    .update(sessionData)
    .digest('hex')
    .substring(0, 16)

  // Create short code for visible watermarks (8 chars)
  const shortCode = sessionId.substring(0, 8).toUpperCase()

  // Encode all data for invisible watermark
  const watermarkData = {
    s: sessionId,
    t: timestamp,
    f: fingerprint.substring(0, 8),
    c: contentId,
    u: userId || 'anon',
  }
  const encoded = Buffer.from(JSON.stringify(watermarkData)).toString('base64')

  return {
    sessionId,
    timestamp,
    fingerprint,
    userId,
    contentId,
    encoded,
    shortCode,
  }
}

/**
 * Decode a forensic watermark to identify the leaker
 */
export function decodeWatermark(encoded: string): {
  sessionId: string
  timestamp: number
  fingerprint: string
  contentId: string
  userId: string
} | null {
  try {
    const data = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'))
    return {
      sessionId: data.s,
      timestamp: data.t,
      fingerprint: data.f,
      contentId: data.c,
      userId: data.u,
    }
  } catch {
    return null
  }
}

/**
 * Generate positions for dynamic watermark that move periodically
 * This makes it harder to crop out the watermark
 */
export function getWatermarkPositions(timestamp: number): {
  primary: { x: number; y: number }
  secondary: { x: number; y: number }
  tertiary: { x: number; y: number }
} {
  // Change position every 5 seconds
  const period = Math.floor(timestamp / 5000)

  // Use sine/cosine for smooth movement
  const angle = (period * 0.7) % (2 * Math.PI)

  return {
    // Primary: moves around bottom-right quadrant
    primary: {
      x: 55 + Math.sin(angle) * 20,
      y: 55 + Math.cos(angle) * 20,
    },
    // Secondary: moves around top-left quadrant
    secondary: {
      x: 15 + Math.cos(angle) * 10,
      y: 15 + Math.sin(angle) * 10,
    },
    // Tertiary: moves around center
    tertiary: {
      x: 50 + Math.sin(angle + 1) * 15,
      y: 50 + Math.cos(angle + 1) * 15,
    },
  }
}

/**
 * Generate invisible watermark pattern for canvas overlay
 * Uses subtle pixel modifications that survive compression and re-encoding
 */
export function generateInvisibleWatermarkPattern(
  sessionId: string,
  width: number,
  height: number
): { positions: Array<{ x: number; y: number; bit: number }> } {
  // Use session ID to seed pseudo-random positions
  const seed = parseInt(sessionId.substring(0, 8), 16)
  const positions: Array<{ x: number; y: number; bit: number }> = []

  // Embed 64 bits of data across the image
  for (let i = 0; i < 64; i++) {
    const bitValue = (seed >> (i % 32)) & 1

    // Pseudo-random position based on session and bit index
    const x = ((seed * (i + 1) * 7919) % width)
    const y = ((seed * (i + 1) * 7927) % height)

    positions.push({ x, y, bit: bitValue })
  }

  return { positions }
}

/**
 * Store session watermark in database for later lookup
 */
export async function storeSessionWatermark(
  prisma: {
    viewSession: {
      create: (args: { data: Record<string, unknown> }) => Promise<unknown>
    }
  },
  watermark: SessionWatermark,
  mediaId: string
): Promise<void> {
  await prisma.viewSession.create({
    data: {
      sessionId: watermark.sessionId,
      mediaId,
      fingerprint: watermark.fingerprint,
      userId: watermark.userId || null,
      watermarkCode: watermark.shortCode,
      createdAt: new Date(watermark.timestamp),
    },
  })
}

/**
 * Look up a session by watermark code (for identifying leakers)
 */
export async function lookupWatermarkSession(
  prisma: {
    viewSession: {
      findFirst: (args: { where: { watermarkCode: string } }) => Promise<{
        sessionId: string
        fingerprint: string
        userId: string | null
        createdAt: Date
      } | null>
    }
  },
  watermarkCode: string
): Promise<{
  sessionId: string
  fingerprint: string
  userId: string | null
  viewedAt: Date
} | null> {
  const session = await prisma.viewSession.findFirst({
    where: { watermarkCode: watermarkCode.toUpperCase() },
  })

  if (!session) return null

  return {
    sessionId: session.sessionId,
    fingerprint: session.fingerprint,
    userId: session.userId,
    viewedAt: session.createdAt,
  }
}
