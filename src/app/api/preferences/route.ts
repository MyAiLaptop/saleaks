import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFingerprint } from '@/lib/fingerprint'

/**
 * GET /api/preferences
 * Get user preferences for feed personalization
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = getFingerprint(request)

    let prefs = await prisma.userPreference.findUnique({
      where: { sessionToken },
    })

    if (!prefs) {
      // Return default preferences
      return NextResponse.json({
        success: true,
        data: {
          hideWatched: true,
          categoryScores: {},
          preferredProvince: null,
          totalViews: 0,
          totalSkips: 0,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        hideWatched: prefs.hideWatched,
        categoryScores: JSON.parse(prefs.categoryScores || '{}'),
        preferredProvince: prefs.preferredProvince,
        totalViews: prefs.totalViews,
        totalSkips: prefs.totalSkips,
      },
    })
  } catch (error) {
    console.error('Error getting preferences:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get preferences' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/preferences
 * Update user preferences
 *
 * Body:
 * - hideWatched?: boolean
 * - preferredProvince?: string | null
 */
export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = getFingerprint(request)
    const body = await request.json()
    const { hideWatched, preferredProvince } = body

    // Build update data
    const updateData: {
      hideWatched?: boolean
      preferredProvince?: string | null
    } = {}

    if (typeof hideWatched === 'boolean') {
      updateData.hideWatched = hideWatched
    }

    if (preferredProvince !== undefined) {
      updateData.preferredProvince = preferredProvince
    }

    // Upsert preferences
    const prefs = await prisma.userPreference.upsert({
      where: { sessionToken },
      update: updateData,
      create: {
        sessionToken,
        ...updateData,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        hideWatched: prefs.hideWatched,
        categoryScores: JSON.parse(prefs.categoryScores || '{}'),
        preferredProvince: prefs.preferredProvince,
        totalViews: prefs.totalViews,
        totalSkips: prefs.totalSkips,
      },
    })
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/preferences/history
 * Clear user's view history (fresh start)
 */
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = getFingerprint(request)

    // Delete all view history for this session
    const result = await prisma.viewHistory.deleteMany({
      where: { sessionToken },
    })

    // Reset preferences stats
    await prisma.userPreference.update({
      where: { sessionToken },
      data: {
        totalViews: 0,
        totalSkips: 0,
        categoryScores: '{}',
      },
    }).catch(() => {
      // User may not have preferences yet
    })

    return NextResponse.json({
      success: true,
      data: {
        cleared: result.count,
        message: `Cleared ${result.count} viewed videos from history`,
      },
    })
  } catch (error) {
    console.error('Error clearing history:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear history' },
      { status: 500 }
    )
  }
}
