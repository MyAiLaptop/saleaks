import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFingerprint } from '@/lib/fingerprint'
import { checkViewMilestone } from '@/lib/creator-notifications'

/**
 * POST /api/live/[publicId]/view
 * Track view engagement for personalization
 *
 * Body:
 * - watchDuration: number (seconds watched)
 * - completed: boolean (watched >80%)
 * - skipped: boolean (scrolled past quickly)
 * - voted: boolean (user voted)
 * - shared: boolean (user shared)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params
    const body = await request.json()
    const { watchDuration = 0, completed = false, skipped = false, voted = false, shared = false } = body

    const sessionToken = getFingerprint(request)

    // Find the post
    const post = await prisma.liveBillboard.findUnique({
      where: { publicId },
      select: { id: true, category: true, viewCount: true, submitterAccountId: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Upsert view history
    const viewHistory = await prisma.viewHistory.upsert({
      where: {
        postId_sessionToken: {
          postId: post.id,
          sessionToken,
        },
      },
      update: {
        watchDuration: Math.max(watchDuration, 0),
        completed: completed || undefined,
        skipped: skipped || undefined,
        voted: voted || undefined,
        shared: shared || undefined,
      },
      create: {
        postId: post.id,
        sessionToken,
        watchDuration: Math.max(watchDuration, 0),
        completed,
        skipped,
        voted,
        shared,
        category: post.category,
      },
    })

    // Update user preferences based on engagement
    await updateUserPreferences(sessionToken, post.category, {
      watchDuration,
      completed,
      skipped,
      voted,
      shared,
    })

    // Increment view count on post if this is a new view
    if (viewHistory.createdAt.getTime() === viewHistory.updatedAt.getTime()) {
      const updatedPost = await prisma.liveBillboard.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      })

      // Check for view milestones and notify creator
      if (post.submitterAccountId) {
        checkViewMilestone(
          post.id,
          publicId,
          post.submitterAccountId,
          updatedPost.viewCount
        ).catch(err => console.error('[View Milestone] Error:', err))
      }
    }

    return NextResponse.json({
      success: true,
      data: { tracked: true },
    })
  } catch (error) {
    console.error('Error tracking view:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track view' },
      { status: 500 }
    )
  }
}

/**
 * Update user preferences based on engagement signals
 */
async function updateUserPreferences(
  sessionToken: string,
  category: string,
  engagement: {
    watchDuration: number
    completed: boolean
    skipped: boolean
    voted: boolean
    shared: boolean
  }
) {
  try {
    // Get or create user preferences
    let prefs = await prisma.userPreference.findUnique({
      where: { sessionToken },
    })

    if (!prefs) {
      prefs = await prisma.userPreference.create({
        data: { sessionToken },
      })
    }

    // Parse category scores
    const categoryScores: Record<string, number> = JSON.parse(prefs.categoryScores || '{}')

    // Calculate engagement score for this interaction
    // Positive signals increase category score, negative signals decrease it
    let engagementDelta = 0

    if (engagement.skipped) {
      engagementDelta = -0.1 // Slight penalty for skipping
    } else if (engagement.completed) {
      engagementDelta = 0.2 // Bonus for watching full video
    } else if (engagement.watchDuration > 10) {
      engagementDelta = 0.1 // Small bonus for watching >10 seconds
    }

    if (engagement.voted) {
      engagementDelta += 0.15 // Bonus for voting
    }

    if (engagement.shared) {
      engagementDelta += 0.25 // Big bonus for sharing
    }

    // Update category score
    const currentScore = categoryScores[category] || 1.0
    const newScore = Math.max(0.1, Math.min(3.0, currentScore + engagementDelta))
    categoryScores[category] = newScore

    // Update preferences
    await prisma.userPreference.update({
      where: { sessionToken },
      data: {
        categoryScores: JSON.stringify(categoryScores),
        totalViews: { increment: 1 },
        totalSkips: engagement.skipped ? { increment: 1 } : undefined,
      },
    })
  } catch (error) {
    console.error('Error updating user preferences:', error)
    // Don't throw - preference update is not critical
  }
}

/**
 * GET /api/live/[publicId]/view
 * Check if user has viewed this post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params
    const sessionToken = getFingerprint(request)

    const post = await prisma.liveBillboard.findUnique({
      where: { publicId },
      select: { id: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    const viewHistory = await prisma.viewHistory.findUnique({
      where: {
        postId_sessionToken: {
          postId: post.id,
          sessionToken,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        viewed: !!viewHistory,
        watchDuration: viewHistory?.watchDuration || 0,
        completed: viewHistory?.completed || false,
        skipped: viewHistory?.skipped || false,
      },
    })
  } catch (error) {
    console.error('Error checking view:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check view' },
      { status: 500 }
    )
  }
}
