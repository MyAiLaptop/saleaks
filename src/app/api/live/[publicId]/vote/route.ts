import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFingerprint } from '@/lib/fingerprint'
import { notifyReaction } from '@/lib/creator-notifications'

// Calculate trending score
function calculateTrendingScore(upvotes: number, downvotes: number, createdAt: Date): number {
  const ageInHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
  const voteScore = upvotes - downvotes
  const recencyBoost = Math.max(0, 100 - ageInHours * 2)
  return voteScore + recencyBoost
}

// GET /api/live/[publicId]/vote - Get user's vote
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params
    const fingerprint = getFingerprint(request)

    const post = await prisma.liveBillboard.findUnique({
      where: { publicId },
      select: { id: true, upvotes: true, downvotes: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    const existingVote = await prisma.liveBillboardVote.findUnique({
      where: {
        postId_fingerprint: {
          postId: post.id,
          fingerprint,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        userVote: existingVote?.value || null,
        upvotes: post.upvotes,
        downvotes: post.downvotes,
      },
    })
  } catch (error) {
    console.error('Error getting vote:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get vote' },
      { status: 500 }
    )
  }
}

// POST /api/live/[publicId]/vote - Vote on a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params
    const body = await request.json()
    const { value } = body

    if (value !== 1 && value !== -1) {
      return NextResponse.json(
        { success: false, error: 'Invalid vote value' },
        { status: 400 }
      )
    }

    const fingerprint = getFingerprint(request)

    const post = await prisma.liveBillboard.findUnique({
      where: { publicId },
      select: { id: true, upvotes: true, downvotes: true, createdAt: true, submitterAccountId: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check for existing vote
    const existingVote = await prisma.liveBillboardVote.findUnique({
      where: {
        postId_fingerprint: {
          postId: post.id,
          fingerprint,
        },
      },
    })

    let newUpvotes = post.upvotes
    let newDownvotes = post.downvotes
    let userVote: number | null = value

    if (existingVote) {
      if (existingVote.value === value) {
        // Remove vote (toggle off)
        await prisma.liveBillboardVote.delete({
          where: { id: existingVote.id },
        })
        if (value === 1) newUpvotes--
        else newDownvotes--
        userVote = null
      } else {
        // Change vote
        await prisma.liveBillboardVote.update({
          where: { id: existingVote.id },
          data: { value },
        })
        if (value === 1) {
          newUpvotes++
          newDownvotes--
        } else {
          newUpvotes--
          newDownvotes++
        }
      }
    } else {
      // New vote
      await prisma.liveBillboardVote.create({
        data: {
          postId: post.id,
          fingerprint,
          value,
        },
      })
      if (value === 1) newUpvotes++
      else newDownvotes++
    }

    // Update post vote counts and trending score
    const newTrendingScore = calculateTrendingScore(newUpvotes, newDownvotes, post.createdAt)
    await prisma.liveBillboard.update({
      where: { publicId },
      data: {
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        trendingScore: newTrendingScore,
      },
    })

    // Notify creator of upvotes at milestones
    if (post.submitterAccountId && newUpvotes > post.upvotes) {
      notifyReaction(
        post.id,
        publicId,
        post.submitterAccountId,
        '👍',
        newUpvotes
      ).catch(err => console.error('[Vote Notification] Error:', err))
    }

    return NextResponse.json({
      success: true,
      data: {
        userVote,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
      },
    })
  } catch (error) {
    console.error('Error voting:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to vote' },
      { status: 500 }
    )
  }
}
