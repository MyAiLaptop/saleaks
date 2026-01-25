'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCountry } from '@/lib/country-context'
import {
  MessageSquare,
  Eye,
  Clock,
  Filter,
  Plus,
  Video,
  ChevronRight,
  TrendingUp,
  Landmark,
  AlertTriangle,
  Users,
  Heart,
  GraduationCap,
  Leaf,
  Building2,
  Shield,
} from 'lucide-react'
import { DISCUSSION_CATEGORIES } from '@/lib/categories'

// Emoji reaction config
const EMOJI_CONFIG = {
  LIKE: '👍',
  DISLIKE: '👎',
  LAUGH: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😡',
} as const

interface Topic {
  id: string
  publicId: string
  title: string
  description: string
  category: string
  province: string | null
  city: string | null
  creatorName: string
  responseCount: number
  reactions: string
  viewCount: number
  createdAt: string
  introVideo: {
    thumbnailPath: string | null
    duration: number | null
  } | null
  _count: {
    responses: number
  }
}

// Category icon mapping
const categoryIcons: Record<string, typeof Landmark> = {
  POLITICS: Landmark,
  CORRUPTION: AlertTriangle,
  COMMUNITY: Users,
  HEALTH: Heart,
  EDUCATION: GraduationCap,
  ENVIRONMENT: Leaf,
  ECONOMY: TrendingUp,
  INFRASTRUCTURE: Building2,
  SAFETY: Shield,
  OTHER: MessageSquare,
}

export default function DiscussionsPage() {
  const { country, config } = useCountry()
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [category, setCategory] = useState<string | null>(null)
  const [sort, setSort] = useState<'latest' | 'trending' | 'responses'>('latest')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch topics
  useEffect(() => {
    const fetchTopics = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          country,
          page: page.toString(),
          limit: '20',
          sort,
        })
        if (category) params.set('category', category)

        const res = await fetch(`/api/discussions?${params}`)
        const data = await res.json()
        if (data.success) {
          if (page === 1) {
            setTopics(data.data.topics)
          } else {
            setTopics(prev => [...prev, ...data.data.topics])
          }
          setTotalPages(data.data.totalPages)
        }
      } catch (error) {
        console.error('Error fetching topics:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTopics()
  }, [country, page, category, sort])

  // Reset when filters change
  useEffect(() => {
    setPage(1)
    setTopics([])
  }, [category, sort])

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

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      POLITICS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      CORRUPTION: 'bg-red-500/20 text-red-400 border-red-500/30',
      COMMUNITY: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      HEALTH: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      EDUCATION: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      ENVIRONMENT: 'bg-green-500/20 text-green-400 border-green-500/30',
      ECONOMY: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      INFRASTRUCTURE: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      SAFETY: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      OTHER: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    }
    return colors[cat] || colors.OTHER
  }

  return (
    <div className="min-h-screen bg-ink-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full mb-4">
              <MessageSquare className="h-4 w-4 text-amber-400" />
              <span className="text-amber-400 font-medium text-sm">Video Discussions</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Real Issues. Real Conversations.
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
              Start a discussion about issues that matter. Respond with video -
              camera-captured only to ensure authentic voices, not AI bots.
            </p>
            <Link
              href={`/${country}/discussions/create`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Start a Discussion
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-white/10 bg-ink-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Sort:</span>
              <div className="flex gap-1 bg-ink-700 rounded-lg p-1">
                {[
                  { value: 'latest', label: 'Latest' },
                  { value: 'trending', label: 'Trending' },
                  { value: 'responses', label: 'Most Responses' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSort(opt.value as typeof sort)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      sort === opt.value
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-ink-700 rounded-lg text-gray-300 hover:text-white transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm">Filter by Category</span>
            </button>
          </div>

          {/* Category Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategory(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    !category
                      ? 'bg-primary-500 text-white'
                      : 'bg-ink-700 text-gray-400 hover:text-white'
                  }`}
                >
                  All Topics
                </button>
                {DISCUSSION_CATEGORIES.map(cat => {
                  const Icon = categoryIcons[cat.slug] || MessageSquare
                  return (
                    <button
                      key={cat.slug}
                      onClick={() => setCategory(cat.slug)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        category === cat.slug
                          ? 'bg-primary-500 text-white'
                          : 'bg-ink-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Topics List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading && topics.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No discussions yet</h3>
              <p className="text-gray-400 mb-6">Be the first to start a discussion in {config.name}!</p>
              <Link
                href={`/${country}/discussions/create`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                Start a Discussion
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {topics.map(topic => {
                const Icon = categoryIcons[topic.category] || MessageSquare
                return (
                  <Link
                    key={topic.id}
                    href={`/${country}/discussions/${topic.publicId}`}
                    className="block bg-ink-800 hover:bg-ink-700 rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className="flex gap-4">
                      {/* Video Indicator */}
                      <div className="flex-shrink-0">
                        {topic.introVideo ? (
                          <div className="w-16 h-16 rounded-lg bg-ink-700 flex items-center justify-center relative overflow-hidden">
                            <Video className="h-6 w-6 text-primary-400" />
                            {topic.introVideo.duration && (
                              <span className="absolute bottom-1 right-1 text-[10px] bg-black/70 px-1 rounded">
                                {Math.floor(topic.introVideo.duration / 60)}:{(topic.introVideo.duration % 60).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-ink-700 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors line-clamp-1">
                              {topic.title}
                            </h3>
                            <p className="text-gray-400 text-sm line-clamp-2 mt-1">
                              {topic.description}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-gray-400 flex-shrink-0 mt-1" />
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getCategoryColor(topic.category)}`}>
                            <Icon className="h-3 w-3" />
                            {DISCUSSION_CATEGORIES.find(c => c.slug === topic.category)?.name || 'Other'}
                          </span>
                          <span className="text-gray-500 flex items-center gap-1">
                            <Video className="h-3.5 w-3.5" />
                            {topic.responseCount} responses
                          </span>
                          {(() => {
                            const reactions = JSON.parse(topic.reactions || '{}')
                            const total = Object.values(reactions).reduce((sum: number, count) => sum + (count as number), 0)
                            const topEmoji = Object.entries(reactions).sort((a, b) => (b[1] as number) - (a[1] as number))[0]
                            return total > 0 ? (
                              <span className="text-gray-500 flex items-center gap-1">
                                <span>{EMOJI_CONFIG[topEmoji[0] as keyof typeof EMOJI_CONFIG] || '👍'}</span>
                                {total}
                              </span>
                            ) : null
                          })()}
                          <span className="text-gray-500 flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {topic.viewCount}
                          </span>
                          <span className="text-gray-500 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTimeAgo(topic.createdAt)}
                          </span>
                        </div>

                        {/* Creator */}
                        <div className="mt-2 text-xs text-gray-500">
                          Started by {topic.creatorName}
                          {topic.province && ` from ${topic.province}`}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}

              {/* Load More */}
              {page < totalPages && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-ink-700 text-white rounded-lg hover:bg-ink-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
