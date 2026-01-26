import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/ads/[adId]/click
 * Track ad click and return business profile URL
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const { adId } = await params

    if (!adId) {
      return NextResponse.json(
        { success: false, error: 'Ad ID required' },
        { status: 400 }
      )
    }

    // Find the ad and update click count
    const ad = await prisma.videoAd.findUnique({
      where: { id: adId },
      include: {
        business: {
          select: {
            publicId: true,
            name: true,
          },
        },
      },
    })

    if (!ad) {
      return NextResponse.json(
        { success: false, error: 'Ad not found' },
        { status: 404 }
      )
    }

    // Check if ad is still active
    if (ad.status !== 'ACTIVE' || ad.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Ad is no longer active' },
        { status: 410 }
      )
    }

    // Increment click count (fire and forget for performance)
    prisma.videoAd.update({
      where: { id: adId },
      data: { clicks: { increment: 1 } },
    }).catch(err => console.error('[Ad Click] Failed to update click count:', err))

    return NextResponse.json({
      success: true,
      data: {
        businessUrl: `/za/business/${ad.business.publicId}`,
        businessName: ad.business.name,
      },
    })
  } catch (error) {
    console.error('[Ad Click] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track click' },
      { status: 500 }
    )
  }
}
