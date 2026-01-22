import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

// Generate a fingerprint hash from request headers
// This is NOT personally identifiable - just prevents duplicate votes
function generateFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || ''
  const acceptLanguage = request.headers.get('accept-language') || ''
  const acceptEncoding = request.headers.get('accept-encoding') || ''

  // Create a hash that's consistent for the same browser but not trackable
  const data = `${userAgent}|${acceptLanguage}|${acceptEncoding}`
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32)
}

// POST /api/posts/[publicId]/vote - Cast a vote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params
    const body = await request.json()
    const { value } = body // 1 for upvote, -1 for downvote

    // Validate vote value
    if (value !== 1 && value !== -1) {
      return NextResponse.json(
        { success: false, error: 'Invalid vote value' },
        { status: 400 }
      )
    }

    // Find the post
    const post = await prisma.post.findUnique({
      where: { publicId },
      select: { id: true, upvotes: true, downvotes: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    const fingerprint = generateFingerprint(request)

    // Check for existing vote
    const existingVote = await prisma.vote.findUnique({
      where: {
        postId_fingerprint: {
          postId: post.id,
          fingerprint,
        },
      },
    })

    let newUpvotes = post.upvotes
    let newDownvotes = post.downvotes

    if (existingVote) {
      if (existingVote.value === value) {
        // Same vote - remove it (toggle off)
        await prisma.vote.delete({
          where: { id: existingVote.id },
        })

        if (value === 1) {
          newUpvotes--
        } else {
          newDownvotes--
        }
      } else {
        // Different vote - update it
        await prisma.vote.update({
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
      await prisma.vote.create({
        data: {
          postId: post.id,
          fingerprint,
          value,
        },
      })

      if (value === 1) {
        newUpvotes++
      } else {
        newDownvotes++
      }
    }

    // Update post vote counts
    await prisma.post.update({
      where: { id: post.id },
      data: {
        upvotes: newUpvotes,
        downvotes: newDownvotes,
      },
    })

    // Return current user's vote state
    const currentVote = await prisma.vote.findUnique({
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
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        userVote: currentVote?.value || null,
      },
    })
  } catch (error) {
    console.error('Error voting:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record vote' },
      { status: 500 }
    )
  }
}

// GET /api/posts/[publicId]/vote - Get vote status for current user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params

    const post = await prisma.post.findUnique({
      where: { publicId },
      select: { id: true, upvotes: true, downvotes: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    const fingerprint = generateFingerprint(request)

    const existingVote = await prisma.vote.findUnique({
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
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        userVote: existingVote?.value || null,
      },
    })
  } catch (error) {
    console.error('Error fetching vote status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vote status' },
      { status: 500 }
    )
  }
}
