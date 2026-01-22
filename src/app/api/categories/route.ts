import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { ApiResponse, Category } from '@/types'

// GET /api/categories - List all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { posts: { where: { status: 'PUBLISHED' } } },
        },
      },
    })

    const response: ApiResponse<typeof categories> = {
      success: true,
      data: categories,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
