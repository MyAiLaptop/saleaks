'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  Flame,
  Zap,
  ArrowRight,
  X,
  SlidersHorizontal,
} from 'lucide-react'
import { useCountry } from '@/lib/country-context'

interface Category {
  name: string
  slug: string
  count: number
}

interface ProvinceFilter {
  name: string
  count: number
}

interface Media {
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string
}

interface Post {
  publicId: string
  title: string
  content: string
  excerpt: string
  category: { name: string; slug: string }
  province: string | null
  city: string | null
  organization: string | null
  viewCount: number
  upvotes: number
  downvotes: number
  featured: boolean
  createdAt: string
  hasEvidence: boolean
  messageCount: number
  displayName?: string
  media?: Media[]
}

export default function CountryBrowsePage() {
  const { country, config } = useCountry()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [provinces, setProvinces] = useState<ProvinceFilter[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters from URL
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [categorySlug, setCategorySlug] = useState(searchParams.get('category') || '')
  const [province, setProvince] = useState(searchParams.get('province') || '')
  const [organization, setOrganization] = useState(searchParams.get('organization') || '')
  const [hasEvidence, setHasEvidence] = useState(searchParams.get('hasEvidence') === 'true')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest')
  const [showFilters, setShowFilters] = useState(false)

  // Update URL with filters
  const updateURL = useCallback((newParams: Record<string, string | boolean>) => {
    const params = new URLSearchParams()
    const allParams = {
      q: search,
      category: categorySlug,
      province,
      organization,
      hasEvidence,
      sortBy,
      ...newParams,
    }

    Object.entries(allParams).forEach(([key, value]) => {
      if (value && value !== 'newest' && value !== true) {
        params.set(key, String(value))
      }
    })

    const queryString = params.toString()
    router.push(queryString ? `/${country}/browse?${queryString}` : `/${country}/browse`, { scroll: false })
  }, [search, categorySlug, province, organization, hasEvidence, sortBy, router, country])

  // Fetch posts using search API
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', page.toString())
    params.set('limit', '12')
    params.set('country', country)
    if (search) params.set('q', search)
    if (categorySlug) params.set('category', categorySlug)
    if (province) params.set('province', province)
    if (organization) params.set('organization', organization)
    if (hasEvidence) params.set('hasEvidence', 'true')
    if (sortBy) params.set('sortBy', sortBy)

    fetch(`/api/search?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPosts(data.data.posts)
          setTotal(data.data.pagination.total)
          setTotalPages(data.data.pagination.totalPages)
          setCategories(data.data.filters.categories)
          setProvinces(data.data.filters.provinces)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, search, categorySlug, province, organization, hasEvidence, sortBy, country])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    updateURL({ q: search })
  }

  const clearFilters = () => {
    setSearch('')
    setCategorySlug('')
    setProvince('')
    setOrganization('')
    setHasEvidence(false)
    setSortBy('newest')
    setPage(1)
    router.push(`/${country}/browse`, { scroll: false })
  }

  const activeFilterCount = [categorySlug, province, organization, hasEvidence].filter(Boolean).length

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${Math.floor(views / 1000)}K`
    return views.toString()
  }

  const getBadge = (post: Post) => {
    if (post.featured) return { label: 'Exclusive', className: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black' }
    if (post.viewCount > 1000) return { label: 'Trending', className: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' }
    if (post.upvotes > 10) return { label: 'Hot', className: 'bg-gradient-to-r from-red-500 to-orange-500 text-white' }
    const createdDate = new Date(post.createdAt)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    if (createdDate > dayAgo) return { label: 'New', className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' }
    return null
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "linear-gradient(to right, rgba(16, 22, 34, 0.95) 20%, rgba(16, 22, 34, 0.4) 60%, rgba(16, 22, 34, 0.7)), url('https://media.saleaks.co.za/global_back_ground.png?v=2')",
          }}
        />
        <div className="relative h-full flex flex-col justify-center px-6 md:px-12 max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white/80 text-xs font-bold uppercase tracking-widest">Live Marketplace</span>
          </div>
          <h1 className="text-white text-3xl md:text-5xl font-extrabold leading-tight mb-4">
            Your Footage,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary-400">Their Front Page.</span>
          </h1>
          <p className="text-gray-300 text-base md:text-lg mb-6 max-w-xl">
            Browse authentic videos and photos from {config.name}. Real content from real people.
          </p>
          <div className="flex gap-3">
            <Link
              href={`/${country}/live`}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-all"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${country}/how-it-works`}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-bold text-sm border border-white/20 transition-all"
            >
              How it Works
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-8 py-6">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search viral footage, news events, or creators..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
            />
          </div>
        </form>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          <button
            type="button"
            onClick={() => { setCategorySlug(''); setPage(1) }}
            className={`flex-shrink-0 h-10 px-5 rounded-full text-sm font-bold transition-all ${
              !categorySlug
                ? 'bg-primary-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            All Stories
          </button>
          {categories.slice(0, 8).map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => { setCategorySlug(cat.slug); setPage(1) }}
              className={`flex-shrink-0 h-10 px-5 rounded-full text-sm font-medium transition-all ${
                categorySlug === cat.slug
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
              }`}
            >
              {cat.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle filters"
            aria-label="Toggle filters"
            className={`flex-shrink-0 h-10 px-4 rounded-full transition-all ${
              activeFilterCount > 0
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Province</label>
                <select
                  value={province}
                  onChange={(e) => { setProvince(e.target.value); setPage(1) }}
                  title="Filter by province"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white"
                >
                  <option value="">All Provinces</option>
                  {provinces.map((prov) => (
                    <option key={prov.name} value={prov.name}>{prov.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1) }}
                  title="Sort results"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="mostViewed">Most Viewed</option>
                  <option value="mostCredible">Most Credible</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasEvidence}
                    onChange={(e) => { setHasEvidence(e.target.checked); setPage(1) }}
                    className="h-5 w-5 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-300">Only with media</span>
                </label>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm text-gray-400 hover:text-white flex items-center gap-1"
              >
                <X className="h-4 w-4" /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary-400" />
            Latest Hot Leads
          </h2>
          <div className="flex items-center gap-4 text-sm font-bold text-gray-500">
            <span className="text-primary-400 border-b-2 border-primary-400 pb-1 cursor-pointer">Live Feed</span>
            <span className="hover:text-white transition-colors cursor-pointer">Closed Deals</span>
          </div>
        </div>

        {/* Video Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">No content found matching your criteria.</p>
            <Link
              href={`/${country}/live`}
              className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium"
            >
              <Play className="h-5 w-5" /> Be the first to upload content
            </Link>
          </div>
        ) : (
          <div className="masonry-grid">
            {posts.map((post) => {
              const badge = getBadge(post)
              const thumbnail = post.media && post.media.length > 0
                ? (post.media[0].thumbnailUrl || post.media[0].url)
                : null
              const isVideo = post.media && post.media.length > 0 && post.media[0].type === 'video'

              return (
                <Link
                  key={post.publicId}
                  href={`/${country}/live/${post.publicId}`}
                  className="group cursor-pointer block"
                >
                  <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-ink-800">
                    {/* Thumbnail */}
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={post.title || post.content.slice(0, 50)}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-ink-700 to-ink-800 flex items-center justify-center">
                        <Play className="h-12 w-12 text-gray-600" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 video-card-gradient" />

                    {/* Badge */}
                    {badge && (
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${badge.className}`}>
                          {badge.label}
                        </span>
                        {isVideo && (
                          <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/20">
                            HD
                          </span>
                        )}
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                          <Play className="h-6 w-6 text-white fill-white" />
                        </div>
                      </div>
                    )}

                    {/* Bottom Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <p className="text-sm font-bold line-clamp-2 leading-tight mb-3">
                        {post.title || post.content.slice(0, 100)}
                      </p>

                      <div className="flex items-center justify-between">
                        {/* Author */}
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600" />
                          <span className="text-xs font-medium text-gray-300">
                            {post.displayName || 'Anonymous'}
                          </span>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span className="text-xs font-bold">{formatViews(post.viewCount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8 pb-8">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center px-5 py-2.5 border border-white/20 rounded-full text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Previous
            </button>
            <span className="text-gray-400 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center px-5 py-2.5 border border-white/20 rounded-full text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
              <ChevronRight className="h-5 w-5 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
