import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdminPassword } from '@/lib/crypto'
import { deletePostFiles } from '@/lib/files'
import type { ApiResponse } from '@/types'

// Helper to verify admin auth
function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return false
  }
  const password = authHeader.slice(7)
  return verifyAdminPassword(password)
}

// PATCH /api/admin/posts/[postId] - Update post status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = await params
    const body = await request.json()
    const { status, featured, reason } = body

    // Find post by public ID
    const post = await prisma.post.findUnique({
      where: { publicId: postId },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}

    if (status && ['PUBLISHED', 'HIDDEN', 'REMOVED'].includes(status)) {
      updateData.status = status
    }

    if (typeof featured === 'boolean') {
      updateData.featured = featured
    }

    const updatedPost = await prisma.post.update({
      where: { id: post.id },
      data: updateData,
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        action: status ? `SET_STATUS_${status}` : featured ? 'FEATURE_POST' : 'UNFEATURE_POST',
        targetId: post.id,
        reason: reason || null,
      },
    })

    return NextResponse.json({ success: true, data: updatedPost })
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/posts/[postId] - Permanently delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = await params

    // Find post by public ID
    const post = await prisma.post.findUnique({
      where: { publicId: postId },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Delete files
    await deletePostFiles(post.id)

    // Log before deletion
    await prisma.adminLog.create({
      data: {
        action: 'DELETE_POST',
        targetId: post.id,
        reason: 'Permanent deletion',
      },
    })

    // Delete post (cascades to files and messages)
    await prisma.post.delete({
      where: { id: post.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
