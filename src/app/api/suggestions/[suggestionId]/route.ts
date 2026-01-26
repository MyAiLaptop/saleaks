import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Get single suggestion
export async function GET(
  request: NextRequest,
  { params }: { params: { suggestionId: string } }
) {
  try {
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

    // Increment view count
    await prisma.suggestion.update({
      where: { id: suggestion.id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      data: suggestion,
    })
  } catch (error) {
    console.error('Error fetching suggestion:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suggestion' },
      { status: 500 }
    )
  }
}

// PATCH - Update suggestion status (for creators/admins)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { suggestionId: string } }
) {
  try {
    const body = await request.json()
    const { status, resultPostId, sessionToken } = body

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

    // Only the creator can update (verify by session token)
    if (suggestion.creatorToken !== sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to update this suggestion' },
        { status: 403 }
      )
    }

    // Validate status
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Update suggestion
    const updated = await prisma.suggestion.update({
      where: { id: suggestion.id },
      data: {
        ...(status && { status }),
        ...(resultPostId && { resultPostId }),
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Error updating suggestion:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update suggestion' },
      { status: 500 }
    )
  }
}
