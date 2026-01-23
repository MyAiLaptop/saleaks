'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Shield,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Clock,
  Loader2,
  RefreshCw,
  ChevronDown,
  MessageCircle,
  Image as ImageIcon,
  Video,
  Lock,
} from 'lucide-react'

interface Media {
  id: string
  filename: string
  mimeType: string
  path: string
  watermarkedPath?: string
  moderationStatus: string
  moderationScore?: number
  moderationFlags?: string
}

interface Report {
  id: string
  reason: string
  description?: string
  createdAt: string
  status: string
}

interface ModerationPost {
  id: string
  publicId: string
  content: string
  category: string
  province?: string
  city?: string
  displayName: string
  moderationStatus: string
  moderationScore?: number
  moderationFlags?: string
  reportCount: number
  createdAt: string
  media: Media[]
  reports: Report[]
  _count: {
    reports: number
    comments: number
  }
}

const R2_PUBLIC_URL = 'https://media.saleaks.co.za'

function getMediaUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return path
  return `${R2_PUBLIC_URL}/${path}`
}

export default function ModerationPage() {
  const [posts, setPosts] = useState<ModerationPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adminKey, setAdminKey] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [statusFilter, setStatusFilter] = useState('FLAGGED')
  const [stats, setStats] = useState<{ statusCounts: Record<string, number>; pendingReports: number }>({
    statusCounts: {},
    pendingReports: 0,
  })
  const [processingPosts, setProcessingPosts] = useState<Set<string>>(new Set())
  const [expandedPost, setExpandedPost] = useState<string | null>(null)

  // Fetch moderation queue
  const fetchPosts = useCallback(async () => {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/moderation?status=${statusFilter}`, {
        headers: {
          'x-admin-key': adminKey,
        },
      })
      const data = await res.json()

      if (data.success) {
        setPosts(data.data.posts)
        setStats(data.data.stats)
        setError('')
      } else {
        setError(data.error || 'Failed to fetch posts')
        if (res.status === 401) {
          setIsAuthenticated(false)
        }
      }
    } catch {
      setError('Failed to fetch moderation queue')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, adminKey, statusFilter])

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts()
    }
  }, [isAuthenticated, fetchPosts])

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminKey.trim()) return

    // Test the key by making a request
    try {
      const res = await fetch('/api/admin/moderation?status=FLAGGED', {
        headers: {
          'x-admin-key': adminKey,
        },
      })

      if (res.ok) {
        setIsAuthenticated(true)
        localStorage.setItem('adminKey', adminKey)
      } else {
        setError('Invalid admin key')
      }
    } catch {
      setError('Failed to authenticate')
    }
  }

  // Check for saved admin key
  useEffect(() => {
    const savedKey = localStorage.getItem('adminKey')
    if (savedKey) {
      setAdminKey(savedKey)
      setIsAuthenticated(true)
    }
  }, [])

  // Take moderation action
  const handleAction = async (postId: string, action: 'APPROVE' | 'REJECT' | 'REMOVE') => {
    if (processingPosts.has(postId)) return

    setProcessingPosts(prev => new Set(prev).add(postId))
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({ postId, action }),
      })

      const data = await res.json()

      if (data.success) {
        // Remove from list
        setPosts(prev => prev.filter(p => p.publicId !== postId))
        // Update stats
        fetchPosts()
      } else {
        setError(data.error || 'Failed to take action')
      }
    } catch {
      setError('Failed to take moderation action')
    } finally {
      setProcessingPosts(prev => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    }
  }

  // Format time ago
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

  // Parse moderation flags
  const parseFlags = (flags: string | null | undefined): string[] => {
    if (!flags) return []
    try {
      return JSON.parse(flags)
    } catch {
      return []
    }
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center p-4">
        <div className="bg-ink-800 rounded-2xl p-8 max-w-md w-full border border-white/10">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">Admin Moderation</h1>
          <p className="text-gray-400 text-center mb-6">Enter your admin key to access the moderation panel</p>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter admin key"
              className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-500 mb-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
              Access Moderation Panel
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary-500" />
              Content Moderation
            </h1>
            <p className="text-gray-400 mt-1">Review flagged content and take action</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchPosts}
              disabled={loading}
              className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('adminKey')
                setIsAuthenticated(false)
                setAdminKey('')
              }}
              className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-ink-800 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-yellow-400 mb-1">
              <Flag className="h-4 w-4" />
              <span className="text-sm font-medium">Flagged</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.statusCounts.FLAGGED || 0}</p>
          </div>
          <div className="bg-ink-800 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.statusCounts.PENDING || 0}</p>
          </div>
          <div className="bg-ink-800 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Approved</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.statusCounts.APPROVED || 0}</p>
          </div>
          <div className="bg-ink-800 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-red-400 mb-1">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.statusCounts.REJECTED || 0}</p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 mb-6">
          {['FLAGGED', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 text-red-300 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Posts */}
        {loading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-ink-800 rounded-xl border border-white/10">
            <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No posts with {statusFilter.toLowerCase()} status</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const flags = parseFlags(post.moderationFlags)
              const isProcessing = processingPosts.has(post.publicId)
              const isExpanded = expandedPost === post.publicId

              return (
                <div
                  key={post.id}
                  className="bg-ink-800 rounded-xl border border-white/10 overflow-hidden"
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          post.moderationStatus === 'FLAGGED'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : post.moderationStatus === 'REJECTED'
                            ? 'bg-red-500/20 text-red-400'
                            : post.moderationStatus === 'APPROVED'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {post.moderationStatus}
                        </span>
                        <span className="text-xs text-gray-400">{post.category}</span>
                        {post.moderationScore && (
                          <span className="text-xs text-gray-500">
                            Score: {(post.moderationScore * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(post.createdAt)}
                      </div>
                    </div>

                    {/* Flags */}
                    {flags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {flags.map((flag) => (
                          <span
                            key={flag}
                            className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Reporter & Reports */}
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                      <span>By: {post.displayName}</span>
                      <span className="flex items-center gap-1">
                        <Flag className="h-3 w-3" />
                        {post.reportCount} reports
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {post._count.comments} comments
                      </span>
                    </div>

                    {/* Content */}
                    <p className="text-gray-200 whitespace-pre-wrap mb-4 line-clamp-3">
                      {post.content}
                    </p>

                    {/* Media Preview */}
                    {post.media.length > 0 && (
                      <div className="flex gap-2 mb-4 overflow-x-auto">
                        {post.media.map((media) => (
                          <div key={media.id} className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-black">
                            {media.mimeType.startsWith('image/') ? (
                              <img
                                src={getMediaUrl(media.watermarkedPath || media.path)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="h-8 w-8 text-gray-500" />
                              </div>
                            )}
                            {media.moderationStatus === 'FLAGGED' && (
                              <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-red-400" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expand/Collapse Reports */}
                    {post.reports.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedPost(isExpanded ? null : post.publicId)}
                        className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 mb-4"
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        {isExpanded ? 'Hide' : 'Show'} {post.reports.length} report{post.reports.length !== 1 ? 's' : ''}
                      </button>
                    )}

                    {/* Reports List */}
                    {isExpanded && post.reports.length > 0 && (
                      <div className="bg-black/20 rounded-lg p-3 mb-4 space-y-2">
                        {post.reports.map((report) => (
                          <div key={report.id} className="flex items-start gap-2 text-sm">
                            <Flag className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="text-red-400 font-medium">{report.reason}</span>
                              {report.description && (
                                <p className="text-gray-400">{report.description}</p>
                              )}
                              <span className="text-gray-500 text-xs">{formatTimeAgo(report.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => handleAction(post.publicId, 'APPROVE')}
                        disabled={isProcessing}
                        className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(post.publicId, 'REJECT')}
                        disabled={isProcessing}
                        className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject
                      </button>
                      <a
                        href={`/live/${post.publicId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-4 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
