'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search,
  MapPin,
  Phone,
  Mail,
  Globe,
  ChevronDown,
  Building2,
  Filter,
  X,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import { getPublicUrl } from '@/lib/r2-storage'

interface Business {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
  logo: string | null
  coverImage: string | null
  city: string | null
  province: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  serviceAreas: string[]
  totalViews: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

// Common business categories
const CATEGORY_OPTIONS = [
  'Plumber',
  'Electrician',
  'Carpenter',
  'Painter',
  'Garden Services',
  'Cleaning Services',
  'Security',
  'IT Services',
  'Auto Mechanic',
  'Towing Services',
  'Locksmith',
  'HVAC / Air Conditioning',
  'Roofing',
  'Pest Control',
  'Moving Services',
  'Catering',
  'Photography',
  'Legal Services',
  'Accounting',
  'Real Estate',
  'Other',
]

// South African provinces
const PROVINCE_OPTIONS = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
]

export default function BusinessDirectoryPage() {
  const params = useParams()
  const country = (params.country as string) || 'sa'
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProvince, setSelectedProvince] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchBusinesses = useCallback(
    async (page = 1, append = false) => {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      try {
        const params = new URLSearchParams()
        params.set('country', country)
        params.set('page', page.toString())
        params.set('limit', '20')

        if (searchQuery) params.set('q', searchQuery)
        if (selectedCategory) params.set('category', selectedCategory)
        if (selectedProvince) params.set('province', selectedProvince)
        if (cityFilter) params.set('city', cityFilter)

        const res = await fetch(`/api/business/search?${params.toString()}`)
        const data = await res.json()

        if (data.success) {
          if (append) {
            setBusinesses((prev) => [...prev, ...data.data.businesses])
          } else {
            setBusinesses(data.data.businesses)
          }
          setPagination(data.data.pagination)
        }
      } catch (error) {
        console.error('Failed to fetch businesses:', error)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [country, searchQuery, selectedCategory, selectedProvince, cityFilter]
  )

  // Initial fetch and when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBusinesses(1, false)
    }, 300) // Debounce search

    return () => clearTimeout(timer)
  }, [fetchBusinesses])

  const handleLoadMore = () => {
    if (pagination && pagination.hasMore) {
      fetchBusinesses(pagination.page + 1, true)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedProvince('')
    setCityFilter('')
  }

  const hasActiveFilters =
    searchQuery || selectedCategory || selectedProvince || cityFilter

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary-400" />
                Business Directory
              </h1>
              <p className="text-sm text-gray-400">
                Find local businesses and services
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="sticky top-[73px] z-30 bg-gray-900/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search businesses (e.g., plumber, electrician...)"
                className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border transition-colors flex items-center gap-2 ${
                showFilters || hasActiveFilters
                  ? 'bg-primary-600/20 border-primary-500 text-primary-400'
                  : 'bg-black/40 border-white/20 text-gray-400 hover:text-white'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-primary-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-black/40 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white">
                  Filter Results
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Category */}
                <div>
                  <label htmlFor="category-filter" className="block text-sm text-gray-400 mb-2">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      id="category-filter"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="">All Categories</option>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Province */}
                <div>
                  <label htmlFor="province-filter" className="block text-sm text-gray-400 mb-2">
                    Province
                  </label>
                  <div className="relative">
                    <select
                      id="province-filter"
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="">All Provinces</option>
                      {PROVINCE_OPTIONS.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    City/Town
                  </label>
                  <input
                    type="text"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    placeholder="Enter city or town"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Results Count */}
        {pagination && (
          <p className="text-sm text-gray-400 mb-4">
            {pagination.total === 0
              ? 'No businesses found'
              : `Found ${pagination.total} business${pagination.total !== 1 ? 'es' : ''}`}
            {hasActiveFilters && ' matching your search'}
          </p>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : businesses.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No businesses found
            </h2>
            <p className="text-gray-400 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'Be the first to register your business!'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* Business Grid */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  country={country}
                />
              ))}
            </div>

            {/* Load More */}
            {pagination && pagination.hasMore && (
              <div className="text-center mt-8">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>Load More</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* CTA for Business Owners */}
      <div className="bg-gradient-to-r from-primary-600/20 to-purple-600/20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            Own a Business?
          </h2>
          <p className="text-gray-400 mb-4">
            Get listed for free and reach customers in your area
          </p>
          <Link
            href={`/${country}/advertise`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors"
          >
            <Building2 className="w-5 h-5" />
            Register Your Business
          </Link>
        </div>
      </div>
    </div>
  )
}

// Business Card Component
function BusinessCard({
  business,
  country,
}: {
  business: Business
  country: string
}) {
  const logoUrl = business.logo
    ? business.logo.startsWith('http')
      ? business.logo
      : getPublicUrl(business.logo)
    : null

  return (
    <Link
      href={`/${country}/business/${business.slug}`}
      className="block bg-gray-900 border border-white/10 rounded-xl overflow-hidden hover:border-primary-500/50 transition-colors group"
    >
      {/* Logo/Header */}
      <div className="p-4 flex items-start gap-4">
        {/* Logo */}
        <div className="w-16 h-16 rounded-xl bg-gray-800 flex-shrink-0 overflow-hidden">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={business.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-gray-600" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors truncate">
            {business.name}
          </h3>
          {business.category && (
            <p className="text-sm text-primary-400 truncate">
              {business.category}
            </p>
          )}
          {(business.city || business.province) && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {[business.city, business.province].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {business.description && (
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-400 line-clamp-2">
            {business.description}
          </p>
        </div>
      )}

      {/* Service Areas */}
      {business.serviceAreas && business.serviceAreas.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-500">
            Serves: {business.serviceAreas.slice(0, 3).join(', ')}
            {business.serviceAreas.length > 3 &&
              ` +${business.serviceAreas.length - 3} more`}
          </p>
        </div>
      )}

      {/* Footer - Contact Options */}
      <div className="px-4 py-3 bg-black/30 border-t border-white/5 flex items-center gap-3">
        {business.phone && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
            {business.phone}
          </span>
        )}
        {business.email && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" />
          </span>
        )}
        {business.website && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </Link>
  )
}
