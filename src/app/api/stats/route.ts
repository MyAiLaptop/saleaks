import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/stats - Get platform statistics
export async function GET() {
  try {
    const [
      totalLeaks,
      totalMessages,
      totalViews,
      leaksWithEvidence,
      categoryStats,
      provinceStats,
      recentLeaksCount,
    ] = await Promise.all([
      // Total published leaks
      prisma.post.count({ where: { status: 'PUBLISHED' } }),

      // Total messages exchanged
      prisma.message.count(),

      // Total views across all posts
      prisma.post.aggregate({
        where: { status: 'PUBLISHED' },
        _sum: { viewCount: true },
      }),

      // Leaks with evidence files
      prisma.post.count({
        where: {
          status: 'PUBLISHED',
          files: { some: {} },
        },
      }),

      // Leaks per category
      prisma.category.findMany({
        select: {
          name: true,
          slug: true,
          _count: { select: { posts: true } },
        },
        orderBy: { posts: { _count: 'desc' } },
      }),

      // Leaks per province
      prisma.post.groupBy({
        by: ['province'],
        where: { status: 'PUBLISHED', province: { not: null } },
        _count: { province: true },
        orderBy: { _count: { province: 'desc' } },
        take: 10,
      }),

      // Leaks in the last 30 days
      prisma.post.count({
        where: {
          status: 'PUBLISHED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalLeaks,
        totalMessages,
        totalViews: totalViews._sum.viewCount || 0,
        leaksWithEvidence,
        recentLeaksCount,
        categoryStats: categoryStats.map(c => ({
          name: c.name,
          slug: c.slug,
          count: c._count.posts,
        })),
        provinceStats: provinceStats.map(p => ({
          province: p.province,
          count: p._count.province,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
