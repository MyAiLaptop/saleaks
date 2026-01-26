'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Heart,
  Loader2,
  MapPin,
  Clock,
  Eye,
  Trash2,
  Car,
  Home,
  Smartphone,
  Sofa,
  Shirt,
  Briefcase,
  Wrench,
  PawPrint,
  Dumbbell,
  Baby,
  Flower,
  Package,
} from 'lucide-react'
import { useCountry } from '@/lib/country-context'

interface FavoriteListing {
  favoriteId: string
  favoritedAt: string
  listing: {
    id: string
    publicId: string
    title: string
    price: number
    currency: string
    category: string
    condition: string
    province: string | null
    city: string | null
    status: string
    viewCount: number
    createdAt: string
    images: Array<{ id: string; url: string }>
  }
}

const CATEGORIES = [
  { id: 'vehicles', label: 'Vehicles', icon: Car },
  { id: 'property', label: 'Property', icon: Home },
  { id: 'electronics', label: 'Electronics', icon: Smartphone },
  { id: 'furniture', label: 'Furniture', icon: Sofa },
  { id: 'clothing', label: 'Clothing', icon: Shirt },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'pets', label: 'Pets', icon: PawPrint },
  { id: 'sports', label: 'Sports', icon: Dumbbell },
  { id: 'kids', label: 'Kids & Baby', icon: Baby },
  { id: 'garden', label: 'Garden', icon: Flower },
  { id: 'other', label: 'Other', icon: Package },
]

const CONDITIONS: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  ZAR: 'R',
  NGN: '₦',
  KES: 'KSh',
  GHS: 'GH₵',
  USD: '$',
  GBP: '£',
}

export default function FavoritesPage() {
  const { country } = useCountry()

  const [favorites, setFavorites] = useState<FavoriteListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  // Initialize device ID
  useEffect(() => {
    let id = localStorage.getItem('marketplace_device_id')
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 15)
      localStorage.setItem('marketplace_device_id', id)
    }
    setDeviceId(id)
  }, [])

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!deviceId) return

    try {
      const params = new URLSearchParams()
      params.set('deviceId', deviceId)

      const res = await fetch(`/api/marketplace/favorites?${params}`)
      const data = await res.json()

      if (data.success) {
        setFavorites(data.data.favorites)
      } else {
        setError(data.error || 'Failed to load favorites')
      }
    } catch {
      setError('Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }, [deviceId])

  useEffect(() => {
    if (deviceId) {
      fetchFavorites()
    }
  }, [deviceId, fetchFavorites])

  // Remove favorite
  const removeFavorite = async (listing: FavoriteListing) => {
    if (!deviceId || removing) return

    setRemoving(listing.favoriteId)
    try {
      const res = await fetch(`/api/marketplace/${listing.listing.publicId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      })
      const data = await res.json()

      if (data.success) {
        setFavorites(prev => prev.filter(f => f.favoriteId !== listing.favoriteId))
      }
    } catch {
      // Ignore
    } finally {
      setRemoving(null)
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getCategoryConfig = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1]
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href={`/${country}/marketplace`}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Link>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-400" />
            Favorites
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl">
            <Heart className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No favorites yet</p>
            <p className="text-sm text-gray-500 mt-1">Tap the heart on listings to save them</p>
            <Link
              href={`/${country}/marketplace`}
              className="inline-block mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((fav) => {
              const listing = fav.listing
              const catConfig = getCategoryConfig(listing.category)
              const CatIcon = catConfig.icon
              const currencySymbol = CURRENCY_SYMBOLS[listing.currency] || 'R'

              return (
                <div
                  key={fav.favoriteId}
                  className="bg-white/5 rounded-xl overflow-hidden flex"
                >
                  <Link
                    href={`/${country}/marketplace/${listing.publicId}`}
                    className="flex-1 flex"
                  >
                    {/* Image */}
                    <div className="w-32 h-32 relative bg-gray-800 flex-shrink-0">
                      {listing.images?.[0] ? (
                        <Image
                          src={listing.images[0].url}
                          alt={listing.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CatIcon className="h-8 w-8 text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3 min-w-0">
                      <h3 className="text-white font-medium text-sm line-clamp-1">
                        {listing.title}
                      </h3>
                      <p className="text-green-400 font-bold mt-1">
                        {currencySymbol}{listing.price.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {listing.city || listing.province || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(listing.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {CONDITIONS[listing.condition] || listing.condition}
                      </p>
                    </div>
                  </Link>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeFavorite(fav)}
                    disabled={removing === fav.favoriteId}
                    className="px-4 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Remove from favorites"
                  >
                    {removing === fav.favoriteId ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
