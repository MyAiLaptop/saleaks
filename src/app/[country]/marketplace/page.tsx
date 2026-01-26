'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ShoppingBag,
  Plus,
  Loader2,
  MapPin,
  Filter,
  ChevronDown,
  X,
  Search,
  Eye,
  Heart,
  Clock,
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
  ArrowUpDown,
} from 'lucide-react'
import { Flag } from '@/components/Flag'
import { useCountry } from '@/lib/country-context'

interface Listing {
  id: string
  publicId: string
  title: string
  description: string
  price: number
  currency: string
  category: string
  condition: string
  province: string | null
  city: string | null
  status: string
  viewCount: number
  favoriteCount: number
  createdAt: string
  images: Array<{ id: string; url: string }>
}

// Marketplace categories
const CATEGORIES = [
  { id: 'vehicles', label: 'Vehicles', icon: Car, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
  { id: 'property', label: 'Property', icon: Home, color: 'text-green-500 bg-green-100 dark:bg-green-900/30' },
  { id: 'electronics', label: 'Electronics', icon: Smartphone, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
  { id: 'furniture', label: 'Furniture', icon: Sofa, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30' },
  { id: 'clothing', label: 'Clothing', icon: Shirt, color: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30' },
  { id: 'jobs', label: 'Jobs', icon: Briefcase, color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30' },
  { id: 'services', label: 'Services', icon: Wrench, color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
  { id: 'pets', label: 'Pets', icon: PawPrint, color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
  { id: 'sports', label: 'Sports', icon: Dumbbell, color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30' },
  { id: 'kids', label: 'Kids & Baby', icon: Baby, color: 'text-rose-500 bg-rose-100 dark:bg-rose-900/30' },
  { id: 'garden', label: 'Garden', icon: Flower, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30' },
  { id: 'other', label: 'Other', icon: Package, color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' },
]

const CONDITIONS = [
  { id: 'new', label: 'New' },
  { id: 'like_new', label: 'Like New' },
  { id: 'good', label: 'Good' },
  { id: 'fair', label: 'Fair' },
  { id: 'poor', label: 'Poor' },
]

// Currency config
const CURRENCY_SYMBOLS: Record<string, string> = {
  ZAR: 'R',
  NGN: '₦',
  KES: 'KSh',
  GHS: 'GH₵',
  USD: '$',
  GBP: '£',
}

export default function MarketplacePage() {
  const { country, config } = useCountry()
  const PROVINCES = config.provinces || []

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Filters
  const [category, setCategory] = useState<string | null>(null)
  const [province, setProvince] = useState<string | null>(null)
  const [condition, setCondition] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sort, setSort] = useState<'latest' | 'price_low' | 'price_high' | 'popular'>('latest')
  const [showFilters, setShowFilters] = useState(false)

  // Currency
  const [currencySymbol, setCurrencySymbol] = useState('R')

  // Stats
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})

  // Device ID for favorites
  const [deviceId, setDeviceId] = useState<string | null>(null)

  // Generate device ID on mount
  useEffect(() => {
    let id = localStorage.getItem('marketplace_device_id')
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 15)
      localStorage.setItem('marketplace_device_id', id)
    }
    setDeviceId(id)
  }, [])

  const fetchListings = useCallback(async (isRefresh = false) => {
    try {
      const params = new URLSearchParams()
      params.set('country', country)
      if (category) params.set('category', category)
      if (province) params.set('province', province)
      if (condition) params.set('condition', condition)
      if (searchQuery) params.set('q', searchQuery)
      params.set('sort', sort)
      params.set('page', isRefresh ? '1' : String(page))

      const res = await fetch(`/api/marketplace?${params}`)
      const data = await res.json()

      if (data.success) {
        if (isRefresh || page === 1) {
          setListings(data.data.listings)
        } else {
          setListings(prev => [...prev, ...data.data.listings])
        }
        setHasMore(data.data.pagination.hasMore)
        setCategoryCounts(data.data.filters.categoryCounts || {})
        setCurrencySymbol(CURRENCY_SYMBOLS[data.data.currency?.code] || 'R')
        setError('')
      }
    } catch {
      setError('Failed to load listings')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [country, category, province, condition, searchQuery, sort, page])

  // Initial load and filter changes
  useEffect(() => {
    setLoading(true)
    setPage(1)
    fetchListings(true)
  }, [country, category, province, condition, sort])

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      setPage(1)
      fetchListings(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load more
  useEffect(() => {
    if (page > 1) {
      fetchListings()
    }
  }, [page, fetchListings])

  const loadMore = () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setPage(prev => prev + 1)
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

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  const getCategoryConfig = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1]
  }

  const getConditionLabel = (conditionId: string) => {
    return CONDITIONS.find(c => c.id === conditionId)?.label || conditionId
  }

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png?v=2')" }}
    >
      <div className="bg-black/60 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <ShoppingBag className="h-7 w-7 text-green-500" />
                Marketplace
                <Flag countryCode={config.code} size="md" />
              </h1>
              <p className="text-gray-300 mt-1">
                Buy and sell locally
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/${country}/marketplace/favorites`}
                className="p-2 bg-white/10 rounded-lg text-gray-300 hover:bg-white/20 transition-colors"
                title="Favorites"
              >
                <Heart className="h-5 w-5" />
              </Link>
              <Link
                href={`/${country}/marketplace/my-listings`}
                className="p-2 bg-white/10 rounded-lg text-gray-300 hover:bg-white/20 transition-colors"
                title="My Listings"
              >
                <ShoppingBag className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Create Listing Button */}
          <Link
            href={`/${country}/marketplace/create`}
            className="w-full mb-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 font-medium shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Sell Something
          </Link>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search marketplace..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Category Pills - Horizontal Scroll */}
          <div className="mb-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2">
              <button
                type="button"
                onClick={() => setCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  !category
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                All
              </button>
              {CATEGORIES.map(cat => {
                const CatIcon = cat.icon
                const count = categoryCounts[cat.id] || 0
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(category === cat.id ? null : cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                      category === cat.id
                        ? 'bg-green-500 text-white'
                        : `${cat.color} hover:opacity-80`
                    }`}
                  >
                    <CatIcon className="h-4 w-4" />
                    {cat.label}
                    {count > 0 && <span className="text-xs opacity-70">({count})</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-6 border border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort */}
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <ArrowUpDown className="h-4 w-4 text-gray-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="bg-transparent text-white text-sm outline-none cursor-pointer"
                  title="Sort by"
                >
                  <option value="latest" className="bg-gray-800">Latest</option>
                  <option value="price_low" className="bg-gray-800">Price: Low to High</option>
                  <option value="price_high" className="bg-gray-800">Price: High to Low</option>
                  <option value="popular" className="bg-gray-800">Most Popular</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-white/10 text-gray-300 flex items-center gap-2 hover:bg-white/20"
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Active filters */}
              {(category || province || condition) && (
                <div className="flex items-center gap-2 ml-auto">
                  {category && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                      {getCategoryConfig(category).label}
                      <button type="button" onClick={() => setCategory(null)} title="Remove filter">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {province && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                      {province}
                      <button type="button" onClick={() => setProvince(null)} title="Remove filter">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {condition && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                      {getConditionLabel(condition)}
                      <button type="button" onClick={() => setCondition(null)} title="Remove filter">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Province/Region</label>
                  <select
                    value={province || ''}
                    onChange={(e) => setProvince(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/30 text-white text-sm"
                    title="Filter by province"
                  >
                    <option value="">All Regions</option>
                    {PROVINCES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Condition</label>
                  <select
                    value={condition || ''}
                    onChange={(e) => setCondition(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/30 text-white text-sm"
                    title="Filter by condition"
                  >
                    <option value="">Any Condition</option>
                    {CONDITIONS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory(null)
                      setProvince(null)
                      setCondition(null)
                      setSearchQuery('')
                    }}
                    className="px-4 py-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors text-sm"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 text-red-300">
              {error}
            </div>
          )}

          {/* Listings Grid */}
          {loading && listings.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10">
              <ShoppingBag className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No listings found</p>
              <p className="text-sm text-gray-500 mt-1">Be the first to list something!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map((listing) => {
                const catConfig = getCategoryConfig(listing.category)
                const CatIcon = catConfig.icon

                return (
                  <Link
                    key={listing.id}
                    href={`/${country}/marketplace/${listing.publicId}`}
                    className="bg-black/40 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-green-500/50 transition-all group"
                  >
                    {/* Image */}
                    <div className="aspect-square relative bg-gray-800">
                      {listing.images?.[0] ? (
                        <Image
                          src={listing.images[0].url}
                          alt={listing.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CatIcon className="h-12 w-12 text-gray-600" />
                        </div>
                      )}
                      {/* Price badge */}
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/80 rounded-lg text-white font-bold text-sm">
                        {currencySymbol}{formatPrice(listing.price)}
                      </div>
                      {/* Condition badge */}
                      <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded-full text-white text-xs">
                        {getConditionLabel(listing.condition)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <h3 className="text-white font-medium text-sm line-clamp-2 mb-1">
                        {listing.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${catConfig.color}`}>
                          <CatIcon className="h-3 w-3" />
                          {catConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {listing.city || listing.province || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(listing.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {listing.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {listing.favoriteCount}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Load More */}
          {hasMore && listings.length > 0 && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full mt-6 py-3 bg-white/10 text-gray-300 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Load More
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
