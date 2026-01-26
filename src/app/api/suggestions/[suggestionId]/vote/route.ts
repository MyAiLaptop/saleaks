import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Check if user has voted
export async function GET(
  request: NextRequest,
  { params }: { params: { suggestionId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const fingerprint = searchParams.get('fingerprint')

    if (!fingerprint) {
      return NextResponse.json({
        success: true,
        data: { hasVoted: false },
      })
    }

    // Find the suggestion
    const suggestion = await prisma.suggestion.findFirst({
      where: {
        OR: [
          { id: params.suggestionId },
          { publicId: params.suggestionId },
        ],
      },
    })

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: 'Suggestion not found' },
        { status: 404 }
      )
    }

    // Check if user has voted
    const existingVote = await prisma.suggestionVote.findUnique({
      where: {
        suggestionId_fingerprint: {
          suggestionId: suggestion.id,
          fingerprint,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        hasVoted: !!existingVote,
        upvotes: suggestion.upvotes,
      },
    })
  } catch (error) {
    console.error('Error checking vote:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check vote' },
      { status: 500 }
    )
  }
}

// POST - Vote on suggestion (upvote only, toggle)
export async function POST(
  request: NextRequest,
  { params }: { params: { suggestionId: string } }
) {
  try {
    const body = await request.json()
    const { fingerprint } = body

    if (!fingerprint) {
      return NextResponse.json(
        { success: false, error: 'Fingerprint required' },
        { status: 400 }
      )
    }

    // Find the suggestion
    const suggestion = await prisma.suggestion.findFirst({
      where: {
        OR: [
          { id: params.suggestionId },
          { publicId: params.suggestionId },
        ],
      },
    })

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: 'Suggestion not found' },
        { status: 404 }
      )
    }

    // Check if user has already voted
    const existingVote = await prisma.suggestionVote.findUnique({
      where: {
        suggestionId_fingerprint: {
          suggestionId: suggestion.id,
          fingerprint,
        },
      },
    })

    if (existingVote) {
      // Remove vote (toggle off)
      await prisma.$transaction([
        prisma.suggestionVote.delete({
          where: { id: existingVote.id },
        }),
        prisma.suggestion.update({
          where: { id: suggestion.id },
          data: { upvotes: { decrement: 1 } },
        }),
      ])

      const updated = await prisma.suggestion.findUnique({
        where: { id: suggestion.id },
      })

      return NextResponse.json({
        success: true,
        data: {
          hasVoted: false,
          upvotes: updated?.upvotes || 0,
        },
      })
    } else {
      // Add vote
      await prisma.$transaction([
        prisma.suggestionVote.create({
          data: {
            suggestionId: suggestion.id,
            fingerprint,
          },
        }),
        prisma.suggestion.update({
          where: { id: suggestion.id },
          data: { upvotes: { increment: 1 } },
        }),
      ])

      const updated = await prisma.suggestion.findUnique({
        where: { id: suggestion.id },
      })

      return NextResponse.json({
        success: true,
        data: {
          hasVoted: true,
          upvotes: updated?.upvotes || 0,
        },
      })
    }
  } catch (error) {
    console.error('Error voting:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to vote' },
      { status: 500 }
    )
  }
}
