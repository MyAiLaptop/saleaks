import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { saveUploadedFile } from '@/lib/files'
import type { ApiResponse } from '@/types'

// POST /api/posts/[publicId]/files - Upload files to a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params

    // Find the post
    const post = await prisma.post.findUnique({
      where: { publicId },
      select: { id: true, status: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.status !== 'PUBLISHED') {
      return NextResponse.json(
        { success: false, error: 'Cannot upload to this post' },
        { status: 403 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files.length) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    // Limit number of files per upload
    if (files.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Maximum 10 files per upload' },
        { status: 400 }
      )
    }

    const uploadedFiles = []

    for (const file of files) {
      try {
        // Save file and strip metadata
        const uploaded = await saveUploadedFile(file, post.id)

        // Save to database
        const dbFile = await prisma.file.create({
          data: {
            postId: post.id,
            filename: uploaded.filename,
            originalName: uploaded.originalName,
            mimeType: uploaded.mimeType,
            size: uploaded.size,
            path: uploaded.path,
            metadataStripped: true,
          },
        })

        uploadedFiles.push(dbFile)
      } catch (fileError: any) {
        console.error('Error uploading file:', fileError)
        // Continue with other files, but note the error
        uploadedFiles.push({
          error: fileError.message || 'Failed to upload file',
          originalName: file.name,
        })
      }
    }

    const response: ApiResponse<typeof uploadedFiles> = {
      success: true,
      data: uploadedFiles,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error uploading files:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}
