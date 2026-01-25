import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFingerprint } from '@/lib/fingerprint'

// Valid emoji types
const VALID_EMOJIS = ['LIKE', 'DISLIKE', 'LAUGH', 'WOW', 'SAD', 'ANGRY'] as const
type EmojiType = (typeof VALID_EMOJIS)[number]

// GET - Get user's current reaction and all reaction counts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params
    const fingerprint = getFingerprint(request)

    const topic = await prisma.topic.findFirst({
      where: {
        OR: [
          { id: topicId },
          { publicId: topicId },
        ],
      },
    })

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      )
    }

    const reaction = await prisma.topicReaction.findUnique({
      where: {
        topicId_fingerprint: {
          topicId: topic.id,
          fingerprint,
        },
      },
    })

    // Parse reactions JSON
    let reactions: Record<string, number> = {}
    try {
      reactions = JSON.parse(topic.reactions || '{}')
    } catch {
      reactions = {}
    }

    return NextResponse.json({
      success: true,
      data: {
        userReaction: reaction?.emoji || null,
        reactions,
      },
    })
  } catch (error) {
    console.error('Error getting reaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get reaction' },
      { status: 500 }
    )
  }
}

// POST - React to topic with emoji
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params
    const body = await request.json()
    const { emoji } = body
    const fingerprint = getFingerprint(request)

    // Validate emoji type
    if (!VALID_EMOJIS.includes(emoji)) {
      return NextResponse.json(
        { success: false, error: 'Invalid emoji type. Use: LIKE, DISLIKE, LAUGH, WOW, SAD, ANGRY' },
        { status: 400 }
      )
    }

    const topic = await prisma.topic.findFirst({
      where: {
        OR: [
          { id: topicId },
          { publicId: topicId },
        ],
      },
    })

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      )
    }

    // Parse current reactions
    let reactions: Record<string, number> = {}
    try {
      reactions = JSON.parse(topic.reactions || '{}')
    } catch {
      reactions = {}
    }

    // Check existing reaction
    const existingReaction = await prisma.topicReaction.findUnique({
      where: {
        topicId_fingerprint: {
          topicId: topic.id,
          fingerprint,
        },
      },
    })

    let newUserReaction: string | null = emoji

    if (existingReaction) {
      // Decrement old emoji count
      const oldEmoji = existingReaction.emoji
      if (reactions[oldEmoji]) {
        reactions[oldEmoji]--
        if (reactions[oldEmoji] <= 0) delete reactions[oldEmoji]
      }

      if (existingReaction.emoji === emoji) {
        // Same emoji - toggle off (remove reaction)
        await prisma.topicReaction.delete({
          where: { id: existingReaction.id },
        })
        newUserReaction = null
      } else {
        // Different emoji - update it
        await prisma.topicReaction.update({
          where: { id: existingReaction.id },
          data: { emoji },
        })
        // Increment new emoji count
        reactions[emoji] = (reactions[emoji] || 0) + 1
      }
    } else {
      // New reaction
      await prisma.topicReaction.create({
        data: {
          topicId: topic.id,
          fingerprint,
          emoji,
        },
      })
      // Increment emoji count
      reactions[emoji] = (reactions[emoji] || 0) + 1
    }

    // Update topic reactions JSON
    await prisma.topic.update({
      where: { id: topic.id },
      data: {
        reactions: JSON.stringify(reactions),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        userReaction: newUserReaction,
        reactions,
      },
    })
  } catch (error) {
    console.error('Error reacting:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to react' },
      { status: 500 }
    )
  }
}
