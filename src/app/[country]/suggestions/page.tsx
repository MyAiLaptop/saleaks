'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Lightbulb,
  ThumbsUp,
  Clock,
  TrendingUp,
  Plus,
  Loader2,
  AlertTriangle,
  MapPin,
  Filter,
  ChevronDown,
  X,
  Send,
  CheckCircle,
  Search,
  Eye,
  // Category icons
  Shield,
  Megaphone,
  Users,
  Ghost,
  Swords,
  Drama,
  Laugh,
  Music,
  Landmark,
  MoreHorizontal,
} from 'lucide-react'
import { Flag } from '@/components/Flag'
import { useCountry } from '@/lib/country-context'

interface Suggestion {
  id: string
  publicId: string
  title: string
  description: string
  category: string
  province: string | null
  city: string | null
  creatorName: string
  upvotes: number
  viewCount: number
  status: string
  resultPostId: string | null
  createdAt: string
}

const CATEGORIES = [
  { id: 'BREAKING', label: 'Breaking News', icon: AlertTriangle, color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
  { id: 'CRIME', label: 'Crime', icon: Shield, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
  { id: 'PROTEST', label: 'Protest', icon: Megaphone, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30' },
  { id: 'COMMUNITY', label: 'Community', icon: Users, color: 'text-green-500 bg-green-100 dark:bg-green-900/30' },
  { id: 'FIGHTING', label: 'Fighting', icon: Swords, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  { id: 'PARANORMAL', label: 'Paranormal', icon: Ghost, color: 'text-violet-500 bg-violet-100 dark:bg-violet-900/30' },
  { id: 'DRAMA', label: 'Drama', icon: Drama, color: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30' },
  { id: 'FUNNY', label: 'Funny', icon: Laugh, color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' },
  { id: 'MUSIC', label: 'Music', icon: Music, color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30' },
  { id: 'INVESTIGATION', label: 'Investigation', icon: Search, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
  { id: 'CORRUPTION', label: 'Corruption', icon: AlertTriangle, color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
  { id: 'POLITICS', label: 'Politics', icon: Landmark, color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30' },
  { id: 'OTHER', label: 'Other', icon: MoreHorizontal, color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' },
]

export default function SuggestionsPage() {
  const { country, config } = useCountry()
  const PROVINCES = config.provinces || []

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Filters
  const [category, setCategory] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('OPEN')
  const [sort, setSort] = useState<'popular' | 'latest'>('popular')
  const [showFilters, setShowFilters] = useState(false)

  // Stats
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})

  // Create suggestion
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newSuggestion, setNewSuggestion] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    province: '',
    city: '',
  })
  const [creating, setCreating] = useState(false)

  // Voting
  const [votingSuggestions, setVotingSuggestions] = useState<Set<string>>(new Set())
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({})
  const [fingerprint, setFingerprint] = useState<string | null>(null)

  // Generate fingerprint on mount
  useEffect(() => {
    const fp = btoa(navigator.userAgent + screen.width + screen.height + (navigator.language || '')).slice(0, 32)
    setFingerprint(fp)
  }, [])

  const fetchSuggestions = useCallback(async (isRefresh = false) => {
    try {
      const params = new URLSearchParams()
      params.set('country', country)
      if (category) params.set('category', category)
      params.set('status', status)
      params.set('sort', sort)
      params.set('page', isRefresh ? '1' : String(page))

      const res = await fetch(`/api/suggestions?${params}`)
      const data = await res.json()

      if (data.success) {
        if (isRefresh || page === 1) {
          setSuggestions(data.data.suggestions)
        } else {
          setSuggestions(prev => [...prev, ...data.data.suggestions])
        }
        setHasMore(page < data.data.pagination.totalPages)
        setCategoryCounts(data.data.filters.categoryCounts || {})
        setError('')
      }
    } catch {
      setError('Failed to load suggestions')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [country, category, status, sort, page])

  // Initial load and filter changes
  useEffect(() => {
    setLoading(true)
    setPage(1)
    fetchSuggestions(true)
  }, [country, category, status, sort])

  // Load more
  useEffect(() => {
    if (page > 1) {
      fetchSuggestions()
    }
  }, [page, fetchSuggestions])

  // Check user votes for visible suggestions
  useEffect(() => {
    if (!fingerprint || suggestions.length === 0) return

    const checkVotes = async () => {
      for (const s of suggestions) {
        if (userVotes[s.publicId] === undefined) {
          try {
            const res = await fetch(`/api/suggestions/${s.publicId}/vote?fingerprint=${fingerprint}`)
            const data = await res.json()
            if (data.success) {
              setUserVotes(prev => ({ ...prev, [s.publicId]: data.data.hasVoted }))
            }
          } catch {
            // Ignore
          }
        }
      }
    }
    checkVotes()
  }, [suggestions, fingerprint, userVotes])

  const loadMore = () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setPage(prev => prev + 1)
  }

  const handleCreateSuggestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSuggestion.title.trim() || !newSuggestion.description.trim() || creating) return

    setCreating(true)
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSuggestion,
          country,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setSuggestions(prev => [data.data, ...prev])
        setNewSuggestion({ title: '', description: '', category: 'OTHER', province: '', city: '' })
        setShowCreateForm(false)
      } else {
        setError(data.error || 'Failed to create suggestion')
      }
    } catch {
      setError('Failed to create suggestion')
    } finally {
      setCreating(false)
    }
  }

  const handleVote = async (publicId: string) => {
    if (!fingerprint || votingSuggestions.has(publicId)) return

    setVotingSuggestions(prev => new Set(prev).add(publicId))
    try {
      const res = await fetch(`/api/suggestions/${publicId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint }),
      })
      const data = await res.json()

      if (data.success) {
        setUserVotes(prev => ({ ...prev, [publicId]: data.data.hasVoted }))
        setSuggestions(prev =>
          prev.map(s =>
            s.publicId === publicId
              ? { ...s, upvotes: data.data.upvotes }
              : s
          )
        )
      }
    } catch {
      // Ignore
    } finally {
      setVotingSuggestions(prev => {
        const next = new Set(prev)
        next.delete(publicId)
        return next
      })
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
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png?v=2')" }}
    >
      <div className="bg-black/60 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <Lightbulb className="h-7 w-7 text-yellow-500" />
                Suggestions
                <Flag countryCode={config.code} size="md" />
              </h1>
              <p className="text-gray-300 mt-1">
                Suggest topics for creators to investigate
              </p>
            </div>
          </div>

          {/* Create Suggestion Button */}
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full mb-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 font-medium shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Suggest a Topic
          </button>

          {/* Create Suggestion Form */}
          {showCreateForm && (
            <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-6 border border-white/10">
              <form onSubmit={handleCreateSuggestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={newSuggestion.title}
                    onChange={(e) => setNewSuggestion({ ...newSuggestion, title: e.target.value })}
                    placeholder="What should creators investigate?"
                    maxLength={200}
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    autoFocus
                  />
                  <div className="text-xs text-gray-400 text-right mt-1">{newSuggestion.title.length}/200</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    value={newSuggestion.description}
                    onChange={(e) => setNewSuggestion({ ...newSuggestion, description: e.target.value })}
                    placeholder="Provide details about what you want investigated..."
                    rows={4}
                    maxLength={2000}
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-400 text-right mt-1">{newSuggestion.description.length}/2000</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                    <select
                      value={newSuggestion.category}
                      onChange={(e) => setNewSuggestion({ ...newSuggestion, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/30 text-white text-sm"
                      title="Select category"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Province/Region</label>
                    <select
                      value={newSuggestion.province}
                      onChange={(e) => setNewSuggestion({ ...newSuggestion, province: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/30 text-white text-sm"
                      title="Select province"
                    >
                      <option value="">All Regions</option>
                      {PROVINCES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">City/Area (Optional)</label>
                  <input
                    type="text"
                    value={newSuggestion.city}
                    onChange={(e) => setNewSuggestion({ ...newSuggestion, city: e.target.value })}
                    placeholder="e.g., Sandton, Central Business District"
                    className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400 text-sm"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-400">
                    Your suggestion will be anonymous
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newSuggestion.title.trim() || !newSuggestion.description.trim() || creating}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-6 border border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort */}
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setSort('popular')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    sort === 'popular' ? 'bg-white/20 shadow text-white' : 'text-gray-400'
                  }`}
                >
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  Popular
                </button>
                <button
                  type="button"
                  onClick={() => setSort('latest')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    sort === 'latest' ? 'bg-white/20 shadow text-white' : 'text-gray-400'
                  }`}
                >
                  <Clock className="h-4 w-4 inline mr-1" />
                  Latest
                </button>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setStatus('OPEN')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    status === 'OPEN' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400'
                  }`}
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('IN_PROGRESS')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400'
                  }`}
                >
                  In Progress
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('COMPLETED')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'text-gray-400'
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    status === 'all' ? 'bg-white/20 text-white' : 'text-gray-400'
                  }`}
                >
                  All
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-gray-400 flex items-center gap-1 ml-auto"
              >
                <Filter className="h-4 w-4" />
                Category
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      !category
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                  >
                    All
                  </button>
                  {CATEGORIES.map(cat => {
                    const count = categoryCounts[cat.id] || 0
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(category === cat.id ? null : cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                          category === cat.id
                            ? 'bg-yellow-500 text-white'
                            : `${cat.color} hover:opacity-80`
                        }`}
                      >
                        <cat.icon className="h-3 w-3" />
                        {cat.label} ({count})
                      </button>
                    )
                  })}
                </div>

                {category && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-gray-400">Active:</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">
                      {getCategoryConfig(category).label}
                      <button type="button" onClick={() => setCategory(null)} title="Remove category filter">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 text-red-300 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Suggestions List */}
          {loading && suggestions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10">
              <Lightbulb className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No suggestions yet</p>
              <p className="text-sm text-gray-500 mt-1">Be the first to suggest a topic!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => {
                const catConfig = getCategoryConfig(suggestion.category)
                const CatIcon = catConfig.icon
                const hasVoted = userVotes[suggestion.publicId]
                const isVoting = votingSuggestions.has(suggestion.publicId)

                return (
                  <article
                    key={suggestion.id}
                    className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start gap-4">
                        {/* Vote Button */}
                        <button
                          type="button"
                          onClick={() => handleVote(suggestion.publicId)}
                          disabled={isVoting}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                            hasVoted
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-white/10 text-gray-400 hover:bg-white/20'
                          } disabled:opacity-50`}
                          title={hasVoted ? 'Remove vote' : 'Upvote this suggestion'}
                        >
                          <ThumbsUp className={`h-5 w-5 ${hasVoted ? 'fill-current' : ''}`} />
                          <span className="text-sm font-medium">{suggestion.upvotes}</span>
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${catConfig.color}`}>
                              <CatIcon className="h-3 w-3" />
                              {catConfig.label}
                            </span>
                            {suggestion.status === 'OPEN' && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                                <Lightbulb className="h-3 w-3" />
                                Open
                              </span>
                            )}
                            {suggestion.status === 'IN_PROGRESS' && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                In Progress
                              </span>
                            )}
                            {suggestion.status === 'COMPLETED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                                <CheckCircle className="h-3 w-3" />
                                Completed
                              </span>
                            )}
                            {(suggestion.province || suggestion.city) && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                <MapPin className="h-3 w-3" />
                                {[suggestion.city, suggestion.province].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-semibold text-white mb-2">
                            {suggestion.title}
                          </h3>

                          <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                            {suggestion.description}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center gap-3">
                              <span>Suggested by <span className="font-medium text-gray-300">{suggestion.creatorName}</span></span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(suggestion.createdAt)}
                              </span>
                            </div>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {suggestion.viewCount}
                            </span>
                          </div>

                          {/* Link to result if completed */}
                          {suggestion.status === 'COMPLETED' && suggestion.resultPostId && (
                            <Link
                              href={`/${country}/live/${suggestion.resultPostId}`}
                              className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                            >
                              <CheckCircle className="h-4 w-4" />
                              View Investigation Result
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}

              {/* Load More */}
              {hasMore && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full py-3 bg-white/10 text-gray-300 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
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
          )}
        </div>
      </div>
    </div>
  )
}
