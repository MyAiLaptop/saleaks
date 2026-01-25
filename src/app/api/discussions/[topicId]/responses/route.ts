import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'
import { sanitizeInput } from '@/lib/sanitize'

// Generate anonymous reporter-style name
function generateReporterName(): string {
  const adjectives = ['Civic', 'Local', 'Voice', 'Citizen', 'Public', 'Community', 'Active', 'Concerned']
  const nouns = ['Reporter', 'Witness', 'Observer', 'Advocate', 'Member', 'Voice', 'Speaker', 'Contributor']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const suffix = nanoid(4)
  return `${adj}${noun}-${suffix}`
}

// GET - List responses for a topic
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const parentId = searchParams.get('parentId') // For loading nested replies

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

    const where: { topicId: string; status: string; parentId: string | null } = {
      topicId: topic.id,
      status: 'ACTIVE',
      parentId: parentId || null, // null for top-level responses
    }

    const [responses, total] = await Promise.all([
      prisma.topicResponse.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          media: true,
          _count: {
            select: { replies: true },
          },
        },
      }),
      prisma.topicResponse.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        responses,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching responses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch responses' },
      { status: 500 }
    )
  }
}

// POST - Create new video response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params
    const body = await request.json()
    const { title, description, parentId, sessionToken, displayName } = body

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Session token required' },
        { status: 400 }
      )
    }

    const topic = await prisma.topic.findFirst({
      where: {
        OR: [
          { id: topicId },
          { publicId: topicId },
        ],
        status: 'ACTIVE',
      },
    })

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found or closed' },
        { status: 404 }
      )
    }

    // If parentId provided, verify it exists and belongs to this topic
    if (parentId) {
      const parentResponse = await prisma.topicResponse.findFirst({
        where: {
          OR: [
            { id: parentId },
            { publicId: parentId },
          ],
          topicId: topic.id,
        },
      })

      if (!parentResponse) {
        return NextResponse.json(
          { success: false, error: 'Parent response not found' },
          { status: 404 }
        )
      }
    }

    // Generate or use provided display name
    let finalDisplayName = displayName
    if (!finalDisplayName) {
      const existingResponse = await prisma.topicResponse.findFirst({
        where: { creatorToken: sessionToken },
        select: { creatorName: true },
      })

      if (!existingResponse) {
        // Also check topics
        const existingTopic = await prisma.topic.findFirst({
          where: { creatorToken: sessionToken },
          select: { creatorName: true },
        })
        finalDisplayName = existingTopic?.creatorName || generateReporterName()
      } else {
        finalDisplayName = existingResponse.creatorName
      }
    }

    // Create response (video will be uploaded separately)
    const response = await prisma.topicResponse.create({
      data: {
        publicId: nanoid(12),
        topicId: topic.id,
        parentId: parentId || null,
        title: title ? sanitizeInput(title) : null,
        description: description ? sanitizeInput(description) : null,
        creatorName: finalDisplayName,
        creatorToken: sessionToken,
      },
    })

    // Update topic response count
    await prisma.topic.update({
      where: { id: topic.id },
      data: { responseCount: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      data: {
        response,
        displayName: finalDisplayName,
      },
    })
  } catch (error) {
    console.error('Error creating response:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create response' },
      { status: 500 }
    )
  }
}
