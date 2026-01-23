/**
 * Content Moderation System for SA Leaks
 *
 * Multi-layered approach:
 * 1. Text content filtering (profanity, spam patterns)
 * 2. Image/Video NSFW detection via API
 * 3. User reporting system
 * 4. Admin review queue
 */

// Moderation status types
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'FLAGGED' | 'REJECTED'

// Content flags that can be detected
export type ContentFlag =
  | 'nsfw'      // Sexual content
  | 'nudity'    // Nudity detected
  | 'violence'  // Violent content
  | 'gore'      // Graphic violence
  | 'spam'      // Spam/promotional content
  | 'hate'      // Hate speech
  | 'fake'      // AI-generated/deepfake suspected

export interface ModerationResult {
  status: ModerationStatus
  score: number           // 0-1, higher = more likely problematic
  flags: ContentFlag[]
  requiresReview: boolean
  reason?: string
}

// Configurable thresholds
const MODERATION_CONFIG = {
  // Score thresholds (0-1)
  autoApproveThreshold: 0.2,   // Below this = auto-approve
  flagThreshold: 0.5,          // Above this = flag for review
  autoRejectThreshold: 0.85,   // Above this = auto-reject

  // Report thresholds
  reportCountToFlag: 3,        // Flag content after this many reports
  reportCountToHide: 5,        // Auto-hide after this many reports
}

// Bad words and phrases to filter (basic list - expand as needed)
const PROFANITY_PATTERNS = [
  // Explicit sexual terms
  /\b(porn|xxx|nude|naked|sex\s*video|f[*u]ck|c[*u]nt)\b/gi,
  // Spam patterns
  /\b(click\s*here|free\s*money|make\s*\$|casino|betting)\b/gi,
  // Common spam URLs
  /\b(onlyfans|pornhub|xvideos|xhamster)\b/gi,
]

// South African specific bad patterns
const SA_SPAM_PATTERNS = [
  /\b(sassa\s*grant|free\s*grant|r350|lottery\s*winner)\b/gi,
  /\b(whatsapp\s*me|dm\s*for|inbox\s*me)\s*\+?27/gi,
]

/**
 * Check text content for problematic patterns
 */
export function moderateTextContent(text: string): ModerationResult {
  const flags: ContentFlag[] = []
  let score = 0

  const normalizedText = text.toLowerCase()

  // Check profanity patterns
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(normalizedText)) {
      flags.push('nsfw')
      score = Math.max(score, 0.7)
    }
  }

  // Check spam patterns
  for (const pattern of SA_SPAM_PATTERNS) {
    if (pattern.test(normalizedText)) {
      flags.push('spam')
      score = Math.max(score, 0.6)
    }
  }

  // Check for excessive caps (spam indicator)
  const capsRatio = (text.match(/[A-Z]/g)?.length || 0) / text.length
  if (capsRatio > 0.7 && text.length > 20) {
    flags.push('spam')
    score = Math.max(score, 0.4)
  }

  // Check for excessive repeated characters (spam)
  if (/(.)\1{5,}/.test(text)) {
    flags.push('spam')
    score = Math.max(score, 0.3)
  }

  return determineStatus(score, flags)
}

/**
 * Moderate image content
 * Images are allowed by default - moderation happens via user reports
 */
export async function moderateImageContent(
  _imageBuffer: Buffer,
  _mimeType: string
): Promise<ModerationResult> {
  // No automatic image scanning - rely on user reports
  // Images are approved by default, can be flagged via reports
  return {
    status: 'APPROVED',
    score: 0,
    flags: [],
    requiresReview: false,
  }
}

/**
 * Moderate video content
 * Videos are allowed by default - moderation happens via user reports
 */
export async function moderateVideoContent(
  _videoBuffer: Buffer,
  _mimeType: string
): Promise<ModerationResult> {
  // No automatic video scanning - rely on user reports
  // Videos are approved by default, can be flagged via reports
  return {
    status: 'APPROVED',
    score: 0,
    flags: [],
    requiresReview: false,
  }
}

/**
 * Determine moderation status based on score and flags
 */
function determineStatus(score: number, flags: ContentFlag[]): ModerationResult {
  let status: ModerationStatus
  let requiresReview = false

  if (score >= MODERATION_CONFIG.autoRejectThreshold) {
    status = 'REJECTED'
  } else if (score >= MODERATION_CONFIG.flagThreshold || flags.length > 0) {
    status = 'FLAGGED'
    requiresReview = true
  } else if (score <= MODERATION_CONFIG.autoApproveThreshold) {
    status = 'APPROVED'
  } else {
    status = 'PENDING'
    requiresReview = true
  }

  return {
    status,
    score,
    flags: [...new Set(flags)], // Remove duplicates
    requiresReview,
    reason: flags.length > 0 ? `Detected: ${flags.join(', ')}` : undefined
  }
}

/**
 * Process user report and update content status
 */
export function processUserReport(
  currentReportCount: number,
  currentStatus: ModerationStatus
): { newStatus: ModerationStatus; shouldHide: boolean } {
  const newCount = currentReportCount + 1

  // Auto-hide if too many reports
  if (newCount >= MODERATION_CONFIG.reportCountToHide) {
    return { newStatus: 'FLAGGED', shouldHide: true }
  }

  // Flag for review if threshold reached
  if (newCount >= MODERATION_CONFIG.reportCountToFlag && currentStatus === 'APPROVED') {
    return { newStatus: 'FLAGGED', shouldHide: false }
  }

  return { newStatus: currentStatus, shouldHide: false }
}

/**
 * Combined moderation for a complete post
 */
export async function moderatePost(
  content: string,
  mediaFiles?: Array<{ buffer: Buffer; mimeType: string; isVideo: boolean }>
): Promise<ModerationResult> {
  const results: ModerationResult[] = []

  // 1. Moderate text content
  const textResult = moderateTextContent(content)
  results.push(textResult)

  // 2. Moderate each media file
  if (mediaFiles) {
    for (const file of mediaFiles) {
      const mediaResult = file.isVideo
        ? await moderateVideoContent(file.buffer, file.mimeType)
        : await moderateImageContent(file.buffer, file.mimeType)
      results.push(mediaResult)
    }
  }

  // 3. Combine results - use worst case
  const allFlags = new Set<ContentFlag>()
  let maxScore = 0
  let requiresReview = false

  for (const result of results) {
    maxScore = Math.max(maxScore, result.score)
    result.flags.forEach(flag => allFlags.add(flag))
    if (result.requiresReview) requiresReview = true
  }

  return determineStatus(maxScore, Array.from(allFlags))
}

// Export config for admin panel
export { MODERATION_CONFIG }
