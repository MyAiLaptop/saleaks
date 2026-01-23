'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Building2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  FileText,
  X,
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const truncateContent = (content: string, maxLength = 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + '...'
  }

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/background.png')" }}
    >
      <div className="bg-black/60 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Browse Leaks
            </h1>
            <p className="text-gray-300">
              {total} reports of corruption and misconduct in {config.name}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-black/40 backdrop-blur-sm rounded-lg shadow p-4 mb-6 border border-white/10">
        <form onSubmit={handleSearch} className="flex gap-2 md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leaks by title, content, or organization..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              activeFilterCount > 0
                ? 'border-primary-500 bg-primary-500/30 text-primary-300'
                : 'border-white/20 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Filter className="h-5 w-5 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary-500 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </form>

        {/* Active Filters Tags */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {categorySlug && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200">
                {categories.find(c => c.slug === categorySlug)?.name || categorySlug}
                <button type="button" onClick={() => { setCategorySlug(''); setPage(1) }} className="ml-2 hover:text-primary-600" title="Remove category filter">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {province && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                {province}
                <button type="button" onClick={() => { setProvince(''); setPage(1) }} className="ml-2 hover:text-blue-600" title="Remove province filter">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {organization && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200">
                Org: {organization}
                <button type="button" onClick={() => { setOrganization(''); setPage(1) }} className="ml-2 hover:text-amber-600" title="Remove organization filter">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {hasEvidence && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                With Evidence
                <button type="button" onClick={() => { setHasEvidence(false); setPage(1) }} className="ml-2 hover:text-green-600" title="Remove evidence filter">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Clear all
            </button>
          </div>
        )}

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 mt-4 border-t border-white/10">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Category
              </label>
              <select
                value={categorySlug}
                onChange={(e) => {
                  setCategorySlug(e.target.value)
                  setPage(1)
                }}
                title="Filter by category"
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/30 text-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name} ({cat.count})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Province
              </label>
              <select
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value)
                  setPage(1)
                }}
                title="Filter by province"
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/30 text-white"
              >
                <option value="">All Provinces</option>
                {provinces.length > 0 ? (
                  provinces.map((prov) => (
                    <option key={prov.name} value={prov.name}>
                      {prov.name} ({prov.count})
                    </option>
                  ))
                ) : (
                  (config.provinces || []).map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Organization
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                onBlur={() => setPage(1)}
                placeholder="Search by organization..."
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setPage(1)
                }}
                title="Sort results"
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/30 text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="mostViewed">Most Viewed</option>
                <option value="mostCredible">Most Credible</option>
              </select>
            </div>
            <div className="flex items-center gap-4 md:col-span-2 lg:col-span-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEvidence}
                  onChange={(e) => {
                    setHasEvidence(e.target.checked)
                    setPage(1)
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-300 flex items-center">
                  <FileText className="h-4 w-4 mr-1 text-green-400" />
                  Only show leaks with evidence
                </span>
              </label>
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
          </div>

          {/* Posts List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-300 text-lg">
                No leaks found matching your criteria.
              </p>
              <Link
                href={`/${country}/submit`}
                className="inline-block mt-4 text-primary-400 hover:text-primary-300"
              >
                Be the first to submit one
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  key={post.publicId}
                  href={`/leak/${post.publicId}`}
                  className="block bg-black/40 backdrop-blur-sm rounded-lg shadow hover:bg-black/50 transition-all border border-white/10"
                >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                        {post.category.name}
                      </span>
                      {post.featured && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                          Featured
                        </span>
                      )}
                      {post.hasEvidence && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          <FileText className="h-3 w-3 mr-1" />
                          Evidence
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">
                      {post.title}
                    </h2>
                    <p className="text-gray-300 text-sm mb-4">
                      {post.excerpt || truncateContent(post.content)}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(post.createdAt)}
                      </span>
                      {(post.province || post.city) && (
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {[post.city, post.province].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {post.organization && (
                        <span className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1" />
                          {post.organization}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {post.viewCount} views
                      </span>
                      {(post.upvotes > 0 || post.downvotes > 0) && (
                        <span className={`flex items-center ${
                          post.upvotes - post.downvotes > 0 ? 'text-green-400' :
                          post.upvotes - post.downvotes < 0 ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {post.upvotes - post.downvotes >= 0 ? (
                            <ThumbsUp className="h-4 w-4 mr-1" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 mr-1" />
                          )}
                          {post.upvotes - post.downvotes > 0 ? '+' : ''}{post.upvotes - post.downvotes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center px-4 py-2 border border-white/20 rounded-lg text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Previous
              </button>
              <span className="text-gray-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center px-4 py-2 border border-white/20 rounded-lg text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-5 w-5 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
