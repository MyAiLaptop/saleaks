import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/stats - Get platform statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const country = searchParams.get('country') || 'sa' // Filter by country

    const [
      totalLeaks,
      totalMessages,
      totalViews,
      leaksWithEvidence,
      categoryStats,
      provinceStats,
      recentLeaksCount,
    ] = await Promise.all([
      // Total published leaks for this country
      prisma.post.count({ where: { status: 'PUBLISHED', country } }),

      // Total messages exchanged (for posts in this country)
      prisma.message.count({
        where: { post: { country } }
      }),

      // Total views across all posts in this country
      prisma.post.aggregate({
        where: { status: 'PUBLISHED', country },
        _sum: { viewCount: true },
      }),

      // Leaks with evidence files in this country
      prisma.post.count({
        where: {
          status: 'PUBLISHED',
          country,
          files: { some: {} },
        },
      }),

      // Leaks per category for this country
      prisma.category.findMany({
        select: {
          name: true,
          slug: true,
          _count: {
            select: {
              posts: { where: { status: 'PUBLISHED', country } }
            }
          },
        },
        orderBy: { posts: { _count: 'desc' } },
      }),

      // Leaks per province for this country
      prisma.post.groupBy({
        by: ['province'],
        where: { status: 'PUBLISHED', country, province: { not: null } },
        _count: { province: true },
        orderBy: { _count: { province: 'desc' } },
        take: 10,
      }),

      // Leaks in the last 30 days for this country
      prisma.post.count({
        where: {
          status: 'PUBLISHED',
          country,
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
