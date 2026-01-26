'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, ChevronRight, Building2 } from 'lucide-react'

interface VideoAd {
  id: string
  hookQuestion: string
  icon: string | null
  business: {
    id: string
    publicId: string
    name: string
    logo: string | null
    phone: string | null
    whatsapp: string | null
  }
}

interface AdPricing {
  '1_DAY': number
  '3_DAYS': number
  '7_DAYS': number
  '30_DAYS': number
}

interface VideoAdBannerProps {
  postId: string
  country: string
}

const R2_PUBLIC_URL = 'https://media.saleaks.co.za'

function getMediaUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return path
  return `${R2_PUBLIC_URL}/${path}`
}

export function VideoAdBanner({ postId, country }: VideoAdBannerProps) {
  const [ad, setAd] = useState<VideoAd | null>(null)
  const [hasAd, setHasAd] = useState<boolean | null>(null)
  const [pricing, setPricing] = useState<AdPricing | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const response = await fetch(`/api/ads?postId=${postId}`)
        const data = await response.json()

        if (data.success) {
          setAd(data.data.ad)
          setHasAd(data.data.hasAd)
          setPricing(data.data.pricing)
        }
      } catch (error) {
        console.error('Failed to fetch ad:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAd()
  }, [postId])

  // Track ad click
  const handleAdClick = async () => {
    if (!ad) return

    try {
      await fetch(`/api/ads/${ad.id}/click`, { method: 'POST' })
    } catch {
      // Silent fail - click tracking is not critical
    }
  }

  if (loading) {
    return null // Don't show anything while loading
  }

  // Show active ad
  if (hasAd && ad) {
    return (
      <Link
        href={`/${country}/business/${ad.business.publicId}`}
        onClick={handleAdClick}
        className="block mx-4 mb-4 -mt-1"
      >
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary-900/40 to-primary-800/20 border border-primary-500/30 rounded-xl hover:border-primary-500/50 transition-all group">
          {/* Business Logo */}
          {ad.business.logo ? (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
              <Image
                src={getMediaUrl(ad.business.logo)}
                alt={ad.business.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary-900/50 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-primary-400" />
            </div>
          )}

          {/* Hook Question */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">
              {ad.hookQuestion}
            </p>
            <p className="text-primary-400 text-xs">
              {ad.business.name} • Tap to learn more
            </p>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-primary-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
        </div>
      </Link>
    )
  }

  // Show "Advertise Here" link when no ad
  if (!hasAd && pricing) {
    const lowestPrice = Math.min(...Object.values(pricing)) / 100 // Convert cents to Rands

    return (
      <Link
        href={`/${country}/advertise?postId=${postId}`}
        className="block mx-4 mb-4 -mt-1"
      >
        <div className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-gray-300 text-sm">
              <span className="text-amber-400 font-medium">Advertise here</span>
              <span className="text-gray-500 mx-1">•</span>
              <span className="text-gray-400">From R{lowestPrice}</span>
            </p>
          </div>

          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 group-hover:text-gray-400 transition-all flex-shrink-0" />
        </div>
      </Link>
    )
  }

  return null
}
