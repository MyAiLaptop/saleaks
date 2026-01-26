import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

// Secure admin auth check with timing-safe comparison
// To generate a hashed key, run: echo -n "your-secret-key" | sha256sum
// Then set ADMIN_API_KEY_HASH in .env to the hash value
function isAdmin(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-admin-key')
  if (!adminKey) return false

  // Get the expected hash from environment
  const expectedHash = process.env.ADMIN_API_KEY_HASH

  // Fallback to plain comparison if hash not set (for backwards compatibility)
  // IMPORTANT: Set ADMIN_API_KEY_HASH in production!
  if (!expectedHash) {
    const plainKey = process.env.ADMIN_API_KEY
    if (!plainKey) return false
    // Use timing-safe comparison even for plain key
    try {
      return crypto.timingSafeEqual(
        Buffer.from(adminKey),
        Buffer.from(plainKey)
      )
    } catch {
      return false
    }
  }

  // Hash the provided key and compare with timing-safe method
  const providedHash = crypto
    .createHash('sha256')
    .update(adminKey)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(providedHash),
      Buffer.from(expectedHash)
    )
  } catch {
    return false
  }
}

// GET /api/admin/moderation - Get posts pending moderation
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'FLAGGED' // FLAGGED, PENDING, REJECTED
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    // Get flagged posts
    const posts = await prisma.liveBillboard.findMany({
      where: {
        moderationStatus: status,
      },
      orderBy: [
        { reportCount: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        media: {
          orderBy: { order: 'asc' },
        },
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { reports: true, comments: true },
        },
      },
    })

    // Get counts by status
    const statusCounts = await prisma.liveBillboard.groupBy({
      by: ['moderationStatus'],
      _count: { moderationStatus: true },
    })

    // Get total pending reports
    const pendingReports = await prisma.contentReport.count({
      where: { status: 'PENDING' },
    })

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: posts.length,
        },
        stats: {
          statusCounts: statusCounts.reduce(
            (acc, { moderationStatus, _count }) => ({ ...acc, [moderationStatus]: _count.moderationStatus }),
            {} as Record<string, number>
          ),
          pendingReports,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching moderation queue:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch moderation queue' },
      { status: 500 }
    )
  }
}

// POST /api/admin/moderation - Take moderation action
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { postId, action, reason } = body

    // Valid actions: APPROVE, REJECT, FLAG, REMOVE
    const validActions = ['APPROVE', 'REJECT', 'FLAG', 'REMOVE']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Find the post
    const post = await prisma.liveBillboard.findUnique({
      where: { publicId: postId },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Determine new status
    let newModerationStatus: string
    let newStatus: string = post.status

    switch (action) {
      case 'APPROVE':
        newModerationStatus = 'APPROVED'
        break
      case 'REJECT':
        newModerationStatus = 'REJECTED'
        newStatus = 'REMOVED' // Also hide the post
        break
      case 'FLAG':
        newModerationStatus = 'FLAGGED'
        break
      case 'REMOVE':
        newModerationStatus = 'REJECTED'
        newStatus = 'REMOVED'
        break
      default:
        newModerationStatus = post.moderationStatus
    }

    // Update the post
    const updatedPost = await prisma.liveBillboard.update({
      where: { id: post.id },
      data: {
        moderationStatus: newModerationStatus,
        status: newStatus,
        moderatedAt: new Date(),
      },
    })

    // Mark all reports for this post as reviewed
    await prisma.contentReport.updateMany({
      where: { postId: post.id, status: 'PENDING' },
      data: {
        status: action === 'APPROVE' ? 'DISMISSED' : 'ACTIONED',
        reviewedAt: new Date(),
      },
    })

    // Log the admin action
    await prisma.adminLog.create({
      data: {
        action: `MODERATION_${action}`,
        targetId: post.id,
        reason: reason || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        post: updatedPost,
        message: `Post ${action.toLowerCase()}ed successfully`,
      },
    })
  } catch (error) {
    console.error('Error taking moderation action:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to take moderation action' },
      { status: 500 }
    )
  }
}
