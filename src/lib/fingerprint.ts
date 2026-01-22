import { NextRequest } from 'next/server'
import crypto from 'crypto'

/**
 * Generate a privacy-respecting fingerprint for rate limiting and vote tracking.
 * Uses a hash of non-identifying request characteristics to create a session-like identifier.
 * Does NOT store or log IP addresses to protect user privacy.
 */
export function getFingerprint(request: NextRequest): string {
  // Collect non-identifying characteristics
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const acceptLanguage = request.headers.get('accept-language') || 'unknown'
  const acceptEncoding = request.headers.get('accept-encoding') || 'unknown'

  // Create a hash of these characteristics
  // This provides some uniqueness without storing PII
  const data = `${userAgent}|${acceptLanguage}|${acceptEncoding}`

  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
    .substring(0, 32)
}
