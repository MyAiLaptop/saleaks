import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { processUserReport } from '@/lib/content-moderation'

// Valid report reasons
const REPORT_REASONS = [
  'NSFW',       // Sexual/adult content
  'VIOLENCE',   // Violent or graphic content
  'SPAM',       // Spam or promotional content
  'FAKE',       // Fake news or AI-generated
  'HARASSMENT', // Harassment or bullying
  'OTHER',      // Other violation
] as const

// POST /api/live/[publicId]/report - Report a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params
    const body = await request.json()
    const { reason, description, fingerprint } = body

    // Validate reason
    if (!reason || !REPORT_REASONS.includes(reason)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report reason' },
        { status: 400 }
      )
    }

    // Validate fingerprint (for preventing duplicate reports)
    if (!fingerprint || fingerprint.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      )
    }

    // Find the post
    const post = await prisma.liveBillboard.findUnique({
      where: { publicId },
      select: {
        id: true,
        reportCount: true,
        moderationStatus: true,
        status: true,
      },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if already reported by this user
    const existingReport = await prisma.contentReport.findUnique({
      where: {
        postId_fingerprint: {
          postId: post.id,
          fingerprint,
        },
      },
    })

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'You have already reported this post' },
        { status: 400 }
      )
    }

    // Create the report
    await prisma.contentReport.create({
      data: {
        postId: post.id,
        reason,
        description: description?.substring(0, 500) || null,
        fingerprint,
      },
    })

    // Process the report and determine if action is needed
    const { newStatus, shouldHide } = processUserReport(
      post.reportCount,
      post.moderationStatus as 'PENDING' | 'APPROVED' | 'FLAGGED' | 'REJECTED'
    )

    // Update the post with new report count and potentially new status
    await prisma.liveBillboard.update({
      where: { id: post.id },
      data: {
        reportCount: { increment: 1 },
        moderationStatus: newStatus,
        // If too many reports, hide the post
        status: shouldHide ? 'REMOVED' : post.status,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Report submitted successfully. Thank you for helping keep our community safe.',
      },
    })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit report' },
      { status: 500 }
    )
  }
}
