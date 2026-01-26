'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Clock,
  Eye,
  Heart,
  Plus,
  Trash2,
  CheckCircle,
  Tag,
  AlertCircle,
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
  ShoppingBag,
} from 'lucide-react'
import { useCountry } from '@/lib/country-context'

interface Listing {
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
  favoriteCount: number
  messageCount: number
  createdAt: string
  images: Array<{ id: string; url: string }>
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

const CURRENCY_SYMBOLS: Record<string, string> = {
  ZAR: 'R',
  NGN: '₦',
  KES: 'KSh',
  GHS: 'GH₵',
  USD: '$',
  GBP: '£',
}

export default function MyListingsPage() {
  const { country } = useCountry()

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'sold'>('all')

  // Actions state
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Initialize device ID
  useEffect(() => {
    let id = localStorage.getItem('marketplace_device_id')
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 15)
      localStorage.setItem('marketplace_device_id', id)
    }
    setDeviceId(id)
  }, [])

  // Fetch my listings
  const fetchListings = useCallback(async () => {
    if (!deviceId) return

    try {
      const params = new URLSearchParams()
      params.set('deviceId', deviceId)
      params.set('status', statusFilter)

      const res = await fetch(`/api/marketplace?${params}`)
      const data = await res.json()

      if (data.success) {
        setListings(data.data.listings)
      } else {
        setError(data.error || 'Failed to load listings')
      }
    } catch {
      setError('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }, [deviceId, statusFilter])

  useEffect(() => {
    if (deviceId) {
      setLoading(true)
      fetchListings()
    }
  }, [deviceId, statusFilter, fetchListings])

  // Mark as sold
  const markAsSold = async (listing: Listing) => {
    if (!deviceId || actionLoading) return

    setActionLoading(listing.id)
    try {
      const res = await fetch(`/api/marketplace/${listing.publicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'sold',
          deviceId,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setListings(prev =>
          prev.map(l => l.id === listing.id ? { ...l, status: 'sold' } : l)
        )
      }
    } catch {
      // Ignore
    } finally {
      setActionLoading(null)
    }
  }

  // Reactivate listing
  const reactivateListing = async (listing: Listing) => {
    if (!deviceId || actionLoading) return

    setActionLoading(listing.id)
    try {
      const res = await fetch(`/api/marketplace/${listing.publicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'active',
          deviceId,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setListings(prev =>
          prev.map(l => l.id === listing.id ? { ...l, status: 'active' } : l)
        )
      }
    } catch {
      // Ignore
    } finally {
      setActionLoading(null)
    }
  }

  // Delete listing
  const deleteListing = async (listing: Listing) => {
    if (!deviceId || actionLoading) return

    setActionLoading(listing.id)
    try {
      const res = await fetch(`/api/marketplace/${listing.publicId}?deviceId=${deviceId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        setListings(prev => prev.filter(l => l.id !== listing.id))
      }
    } catch {
      // Ignore
    } finally {
      setActionLoading(null)
      setShowDeleteConfirm(null)
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

  const filteredListings = listings.filter(l => {
    if (statusFilter === 'all') return true
    return l.status === statusFilter
  })

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/${country}/marketplace`}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Link>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-green-400" />
              My Listings
            </h1>
          </div>
          <Link
            href={`/${country}/marketplace/create`}
            className="p-2 bg-green-500 rounded-lg text-white hover:bg-green-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Status filter */}
        <div className="flex gap-2 mb-6">
          {(['all', 'active', 'sold'] as const).map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {status === 'all' ? 'All' : status === 'active' ? 'Active' : 'Sold'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl">
            <ShoppingBag className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">
              {statusFilter === 'all'
                ? 'No listings yet'
                : statusFilter === 'active'
                ? 'No active listings'
                : 'No sold listings'}
            </p>
            <Link
              href={`/${country}/marketplace/create`}
              className="inline-block mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Create Listing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map((listing) => {
              const catConfig = getCategoryConfig(listing.category)
              const CatIcon = catConfig.icon
              const currencySymbol = CURRENCY_SYMBOLS[listing.currency] || 'R'

              return (
                <div
                  key={listing.id}
                  className="bg-white/5 rounded-xl overflow-hidden"
                >
                  <div className="flex">
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
                        {listing.status === 'sold' && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                              SOLD
                            </span>
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
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {listing.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {listing.favoriteCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(listing.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            listing.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {listing.status === 'active' ? 'Active' : 'Sold'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Actions */}
                  <div className="flex border-t border-white/10">
                    {listing.status === 'active' ? (
                      <button
                        type="button"
                        onClick={() => markAsSold(listing)}
                        disabled={actionLoading === listing.id}
                        className="flex-1 py-3 flex items-center justify-center gap-2 text-green-400 hover:bg-green-500/20 transition-colors text-sm"
                      >
                        {actionLoading === listing.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Mark as Sold
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => reactivateListing(listing)}
                        disabled={actionLoading === listing.id}
                        className="flex-1 py-3 flex items-center justify-center gap-2 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm"
                      >
                        {actionLoading === listing.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Tag className="h-4 w-4" />
                            Reactivate
                          </>
                        )}
                      </button>
                    )}
                    <div className="w-px bg-white/10" />
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(listing.id)}
                      className="px-6 py-3 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Delete confirmation */}
                  {showDeleteConfirm === listing.id && (
                    <div className="p-4 bg-red-500/10 border-t border-red-500/30">
                      <p className="text-red-300 text-sm mb-3">
                        Are you sure you want to delete this listing?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(null)}
                          className="flex-1 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteListing(listing)}
                          disabled={actionLoading === listing.id}
                          className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm flex items-center justify-center gap-2"
                        >
                          {actionLoading === listing.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Delete'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
