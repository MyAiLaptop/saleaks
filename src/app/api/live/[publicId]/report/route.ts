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
  'OFF_TOPIC',  // Not newsworthy / belongs in social
  'OTHER',      // Other violation
] as const

// Threshold for auto-moving to Social section
const OFF_TOPIC_THRESHOLD = 3

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
        category: true,
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

    // Check if this is an OFF_TOPIC report and count how many we have
    // Only move if not already in Social section (COMMUNITY or OTHER)
    let moveToSocial = false
    const socialCategories = ['COMMUNITY', 'OTHER']
    if (reason === 'OFF_TOPIC' && !socialCategories.includes(post.category)) {
      const offTopicCount = await prisma.contentReport.count({
        where: {
          postId: post.id,
          reason: 'OFF_TOPIC',
        },
      })
      // If we now have 3+ off-topic reports, move to COMMUNITY (Social section)
      if (offTopicCount >= OFF_TOPIC_THRESHOLD) {
        moveToSocial = true
      }
    }

    // Update the post with new report count and potentially new status/category
    await prisma.liveBillboard.update({
      where: { id: post.id },
      data: {
        reportCount: { increment: 1 },
        moderationStatus: newStatus,
        // Move to COMMUNITY if flagged as off-topic by users
        ...(moveToSocial && { category: 'COMMUNITY' }),
        // If too many reports, hide the post
        status: shouldHide ? 'REMOVED' : post.status,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: moveToSocial
          ? 'Report submitted. This post has been moved to the Social section based on community feedback.'
          : 'Report submitted successfully. Thank you for helping keep our community safe.',
        movedToSocial: moveToSocial,
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
