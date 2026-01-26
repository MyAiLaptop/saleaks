import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { deleteFromR2 } from '@/lib/r2-storage'

// Auto-cleanup sold listings after 3 days
// This endpoint can be called by a cron job (e.g., Vercel Cron, external service)
// POST /api/marketplace/cleanup

const CLEANUP_AFTER_DAYS = 3
const CLEANUP_SECRET = process.env.CLEANUP_SECRET || 'marketplace-cleanup-secret'

export async function POST(request: NextRequest) {
  try {
    // Verify cleanup secret (to prevent unauthorized calls)
    const authHeader = request.headers.get('authorization')
    const providedSecret = authHeader?.replace('Bearer ', '')

    if (providedSecret !== CLEANUP_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Calculate cutoff date (3 days ago)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_AFTER_DAYS)

    // Find sold listings older than 3 days
    const listingsToDelete = await prisma.marketplaceListing.findMany({
      where: {
        status: 'sold',
        soldAt: {
          lte: cutoffDate,
        },
      },
      include: {
        images: true,
      },
    })

    if (listingsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No listings to clean up',
        deletedCount: 0,
      })
    }

    // Delete images from R2 and listings from database
    const results = {
      deletedListings: 0,
      deletedImages: 0,
      errors: [] as string[],
    }

    for (const listing of listingsToDelete) {
      try {
        // Delete images from R2
        for (const image of listing.images) {
          try {
            await deleteFromR2(image.key)
            results.deletedImages++
          } catch (r2Error) {
            // Log but continue - image might already be deleted
            console.warn(`[Marketplace Cleanup] Failed to delete R2 image ${image.key}:`, r2Error)
          }
        }

        // Hard delete the listing (cascades to images, messages, favorites in DB)
        await prisma.marketplaceListing.delete({
          where: { id: listing.id },
        })

        results.deletedListings++
        console.log(`[Marketplace Cleanup] Deleted listing ${listing.publicId} (sold ${listing.soldAt})`)
      } catch (listingError) {
        const errorMsg = `Failed to delete listing ${listing.publicId}: ${listingError}`
        console.error(`[Marketplace Cleanup] ${errorMsg}`)
        results.errors.push(errorMsg)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${results.deletedListings} sold listings`,
      deletedListings: results.deletedListings,
      deletedImages: results.deletedImages,
      errors: results.errors.length > 0 ? results.errors : undefined,
    })
  } catch (error) {
    console.error('[Marketplace Cleanup] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}

// GET endpoint - runs cleanup when called from Vercel Cron
export async function GET(request: NextRequest) {
  // Check if this is a Vercel Cron call or has valid secret
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const authHeader = request.headers.get('authorization')
  const providedSecret = authHeader?.replace('Bearer ', '')
  const isAuthorized = isVercelCron || providedSecret === CLEANUP_SECRET

  if (!isAuthorized) {
    // Just return status info for unauthorized requests
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_AFTER_DAYS)

    try {
      const pendingCount = await prisma.marketplaceListing.count({
        where: {
          status: 'sold',
          soldAt: { lte: cutoffDate },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Marketplace cleanup endpoint',
        cleanupAfterDays: CLEANUP_AFTER_DAYS,
        pendingCleanup: pendingCount,
      })
    } catch {
      return NextResponse.json({
        success: true,
        message: 'Marketplace cleanup endpoint',
        cleanupAfterDays: CLEANUP_AFTER_DAYS,
      })
    }
  }

  // Run cleanup for authorized requests (cron or with secret)
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_AFTER_DAYS)

    const listingsToDelete = await prisma.marketplaceListing.findMany({
      where: {
        status: 'sold',
        soldAt: { lte: cutoffDate },
      },
      include: { images: true },
    })

    if (listingsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No listings to clean up',
        deletedCount: 0,
      })
    }

    const results = { deletedListings: 0, deletedImages: 0, errors: [] as string[] }

    for (const listing of listingsToDelete) {
      try {
        // Delete images from R2
        for (const image of listing.images) {
          try {
            await deleteFromR2(image.key)
            results.deletedImages++
          } catch (r2Error) {
            console.warn(`[Marketplace Cleanup] Failed to delete R2 image ${image.key}:`, r2Error)
          }
        }

        // Hard delete the listing
        await prisma.marketplaceListing.delete({ where: { id: listing.id } })
        results.deletedListings++
        console.log(`[Marketplace Cleanup] Deleted listing ${listing.publicId} (sold ${listing.soldAt})`)
      } catch (listingError) {
        results.errors.push(`Failed to delete ${listing.publicId}: ${listingError}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${results.deletedListings} sold listings`,
      deletedListings: results.deletedListings,
      deletedImages: results.deletedImages,
      errors: results.errors.length > 0 ? results.errors : undefined,
    })
  } catch (error) {
    console.error('[Marketplace Cleanup] Error:', error)
    return NextResponse.json({ success: false, error: 'Cleanup failed' }, { status: 500 })
  }
}
