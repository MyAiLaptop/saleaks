/**
 * Client-side Forensic Watermarking System
 *
 * Generates unique, traceable watermarks for each viewing session.
 * Works in the browser without server dependencies.
 */

// Session watermark data
export interface ClientSessionWatermark {
  sessionId: string           // Unique session identifier
  timestamp: number           // When the session started
  shortCode: string           // Short human-readable code (for visible watermarks)
  userId?: string             // Optional user identifier
}

/**
 * Generate a browser fingerprint for session tracking
 * Privacy-respecting: doesn't store PII, just creates a unique hash
 */
export async function generateBrowserFingerprint(): Promise<string> {
  const components: string[] = []

  // Screen properties
  components.push(`${screen.width}x${screen.height}`)
  components.push(`${screen.colorDepth}`)

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone)

  // Language
  components.push(navigator.language)

  // Canvas fingerprint (unique per GPU/driver)
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      canvas.width = 200
      canvas.height = 50
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = '#069'
      ctx.fillText('Fingerprint', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('Fingerprint', 4, 17)
      components.push(canvas.toDataURL().slice(-50))
    }
  } catch {
    components.push('canvas-error')
  }

  // WebGL renderer (unique per GPU)
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
      }
    }
  } catch {
    components.push('webgl-error')
  }

  // Hash all components
  const data = components.join('|')
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32)
}

/**
 * Generate a unique session watermark for content viewing
 */
export async function generateClientSessionWatermark(
  contentId: string,
  userId?: string
): Promise<ClientSessionWatermark> {
  const timestamp = Date.now()
  const fingerprint = await generateBrowserFingerprint()

  // Create unique session ID
  const sessionData = `${contentId}:${fingerprint}:${timestamp}:${Math.random()}`
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(sessionData)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const sessionId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16)

  // Create short code for visible watermarks (8 chars)
  const shortCode = sessionId.substring(0, 8).toUpperCase()

  return {
    sessionId,
    timestamp,
    shortCode,
    userId,
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
 * Format user identifier for display (privacy-preserving)
 */
export function formatUserIdForWatermark(userId?: string): string {
  if (!userId) return 'ANON'

  // If it looks like a phone number, show last 4 digits
  const digits = userId.replace(/\D/g, '')
  if (digits.length >= 4) {
    return `****${digits.slice(-4)}`
  }

  // Otherwise, show first 4 chars + asterisks
  if (userId.length > 4) {
    return userId.substring(0, 4) + '****'
  }

  return userId
}

/**
 * Get watermark display text
 */
export function getWatermarkText(
  shortCode: string,
  userId?: string,
  includeTimestamp = true
): string {
  const userDisplay = formatUserIdForWatermark(userId)
  const parts = [shortCode, userDisplay]

  if (includeTimestamp) {
    const now = new Date()
    const time = now.toTimeString().slice(0, 5) // HH:MM
    parts.push(time)
  }

  return parts.join(' • ')
}
