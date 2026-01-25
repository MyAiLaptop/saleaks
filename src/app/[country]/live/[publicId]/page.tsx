'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Radio,
  MapPin,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Eye,
  Send,
  Loader2,
  AlertTriangle,
  Car,
  Shield,
  Megaphone,
  Zap,
  Cloud,
  Users,
  MoreHorizontal,
  Copy,
  Check,
  User,
  Download,
} from 'lucide-react'
import { PurchaseButton } from '@/components/PurchaseButton'
import { useCountry } from '@/lib/country-context'

interface Media {
  id: string
  filename: string
  originalName: string
  mimeType: string
  path: string
  watermarkedPath?: string | null
  price?: number | null
  forSale?: boolean
}

// Helper to convert R2 keys to proper URLs
const R2_PUBLIC_URL = 'https://media.saleaks.co.za'

function getMediaUrl(path: string | null | undefined): string {
  if (!path) return ''
  // Already a full URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  // Local path (starts with /)
  if (path.startsWith('/')) {
    return path
  }
  // R2 key - convert to full URL
  return `${R2_PUBLIC_URL}/${path}`
}

interface Comment {
  id: string
  displayName: string
  content: string
  parentId: string | null
  createdAt: string
}

interface LivePost {
  id: string
  publicId: string
  content: string
  category: string
  province: string | null
  city: string | null
  displayName: string
  upvotes: number
  downvotes: number
  viewCount: number
  commentCount: number
  isHappeningNow: boolean
  status: string
  createdAt: string
  media: Media[]
  comments: Comment[]
}

const CATEGORIES = [
  { id: 'BREAKING', label: 'Breaking News', icon: AlertTriangle, color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
  { id: 'TRAFFIC', label: 'Traffic', icon: Car, color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
  { id: 'CRIME', label: 'Crime', icon: Shield, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
  { id: 'PROTEST', label: 'Protest', icon: Megaphone, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30' },
  { id: 'LOADSHEDDING', label: 'Load Shedding', icon: Zap, color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' },
  { id: 'WEATHER', label: 'Weather', icon: Cloud, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
  { id: 'COMMUNITY', label: 'Community', icon: Users, color: 'text-green-500 bg-green-100 dark:bg-green-900/30' },
  { id: 'OTHER', label: 'Other', icon: MoreHorizontal, color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' },
]

const POLL_INTERVAL = 5000

export default function CountryLivePostPage() {
  const { country } = useCountry()
  const params = useParams<{ publicId: string }>()
  const [post, setPost] = useState<LivePost | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)

  const [userVote, setUserVote] = useState<number | null>(null)
  const [voting, setVoting] = useState(false)
  const [voteCount, setVoteCount] = useState({ upvotes: 0, downvotes: 0 })

  const [copied, setCopied] = useState(false)
  const [lastCommentFetch, setLastCommentFetch] = useState<string | null>(null)

  // Fetch post
  useEffect(() => {
    if (!params.publicId) return

    fetch(`/api/live/${params.publicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPost(data.data)
          setComments(data.data.comments || [])
          setVoteCount({ upvotes: data.data.upvotes, downvotes: data.data.downvotes })
        } else {
          setError(data.error || 'Post not found')
        }
      })
      .catch(() => setError('Failed to load post'))
      .finally(() => setLoading(false))

    // Fetch user's vote
    fetch(`/api/live/${params.publicId}/vote`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUserVote(data.data.userVote)
        }
      })
      .catch(() => {})
  }, [params.publicId])

  // Poll for new comments
  const fetchNewComments = useCallback(async () => {
    if (!params.publicId || !lastCommentFetch) return

    try {
      const res = await fetch(`/api/live/${params.publicId}/comments?since=${encodeURIComponent(lastCommentFetch)}`)
      const data = await res.json()

      if (data.success && data.data.comments.length > 0) {
        setComments(prev => [...prev, ...data.data.comments])
        setLastCommentFetch(data.data.serverTime)
      }
    } catch {
      // Ignore
    }
  }, [params.publicId, lastCommentFetch])

  useEffect(() => {
    if (comments.length > 0 && !lastCommentFetch) {
      setLastCommentFetch(new Date().toISOString())
    }

    const interval = setInterval(fetchNewComments, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchNewComments, comments.length, lastCommentFetch])

  // Handle vote
  const handleVote = async (value: 1 | -1) => {
    if (voting || !params.publicId) return
    setVoting(true)

    try {
      const res = await fetch(`/api/live/${params.publicId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      const data = await res.json()

      if (data.success) {
        setVoteCount({ upvotes: data.data.upvotes, downvotes: data.data.downvotes })
        setUserVote(data.data.userVote)
      }
    } catch {
      // Ignore
    } finally {
      setVoting(false)
    }
  }

  // Handle comment
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || sendingComment || !params.publicId) return

    setSendingComment(true)
    try {
      const res = await fetch(`/api/live/${params.publicId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          sessionToken,
          displayName,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setComments(prev => [...prev, data.data.comment])
        setSessionToken(data.data.sessionToken)
        setDisplayName(data.data.displayName)
        setNewComment('')
        setLastCommentFetch(new Date().toISOString())
      }
    } catch {
      // Ignore
    } finally {
      setSendingComment(false)
    }
  }

  // Copy link
  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return formatTime(dateStr)
  }

  // Get category config
  const getCategoryConfig = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1]
  }

  if (loading) {
    return (
      <div
        className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png?v=2')" }}
      >
        <div className="bg-black/60 min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div
        className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png?v=2')" }}
      >
        <div className="bg-black/60 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">
              {error || 'Post not found'}
            </h1>
            <Link href={`/${country}/live`} className="text-primary-400 hover:text-primary-300">
              Back to Live Billboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const catConfig = getCategoryConfig(post.category)
  const CatIcon = catConfig.icon
  const score = voteCount.upvotes - voteCount.downvotes

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png?v=2')" }}
    >
      <div className="bg-black/60 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Back link */}
          <Link
            href={`/${country}/live`}
            className="inline-flex items-center text-gray-300 hover:text-primary-400 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Live Billboard
          </Link>

          {/* Main Post */}
          <article className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden mb-6 border border-white/10">
            {/* Media - Full width at top like Facebook */}
            {post.media && post.media.length > 0 && (
              <div className="bg-black">
                {post.media.map((media) => (
                  <div
                    key={media.id}
                    className="relative"
                  >
                    {media.mimeType.startsWith('image/') ? (
                      <img
                        src={getMediaUrl(media.watermarkedPath) || getMediaUrl(media.path)}
                        alt={media.originalName}
                        className="w-full max-h-[70vh] object-contain"
                      />
                    ) : media.mimeType.startsWith('video/') ? (
                      <video
                        src={getMediaUrl(media.watermarkedPath) || getMediaUrl(media.path)}
                        controls
                        playsInline
                        className="w-full max-h-[70vh]"
                      />
                    ) : null}
                    {/* Download/Purchase options overlay */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <a
                        href={getMediaUrl(media.watermarkedPath) || getMediaUrl(media.path)}
                        download={media.originalName}
                        className="flex items-center gap-1 px-3 py-1.5 bg-black/70 text-white text-sm rounded-lg hover:bg-black/90 transition-colors backdrop-blur-sm"
                        title="Download with watermark (free)"
                      >
                        <Download className="h-4 w-4" />
                        Free Download
                      </a>
                      {media.forSale !== false && (
                        <PurchaseButton
                          mediaId={media.id}
                          mediaType="live"
                          price={media.price ?? undefined}
                          className="px-3 py-1.5 text-sm"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${catConfig.color}`}>
                    <CatIcon className="h-4 w-4" />
                    {catConfig.label}
                  </span>
                  {post.isHappeningNow && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full text-sm font-medium border border-red-500/30">
                      <Radio className="h-4 w-4 animate-pulse" />
                      HAPPENING NOW
                    </span>
                  )}
                </div>
              </div>

              {/* Location & Time */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                {(post.province || post.city) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {[post.city, post.province].filter(Boolean).join(', ')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTime(post.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.viewCount} views
                </span>
              </div>

              {/* Reporter */}
              <p className="text-sm text-gray-400 mb-4">
                Reported by <span className="font-semibold text-gray-200">{post.displayName}</span>
              </p>

              {/* Content */}
              <div className="prose prose-invert max-w-none mb-6">
                <p className="text-lg text-gray-200 whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-4">
                  {/* Voting */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleVote(1)}
                      disabled={voting}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                        userVote === 1
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-white/10 text-gray-400 hover:bg-green-500/10'
                      } disabled:opacity-50`}
                    >
                      <ThumbsUp className={`h-4 w-4 ${userVote === 1 ? 'fill-current' : ''}`} />
                      {voteCount.upvotes}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVote(-1)}
                      disabled={voting}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                        userVote === -1
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-white/10 text-gray-400 hover:bg-red-500/10'
                      } disabled:opacity-50`}
                    >
                      <ThumbsDown className={`h-4 w-4 ${userVote === -1 ? 'fill-current' : ''}`} />
                      {voteCount.downvotes}
                    </button>
                    <span className={`text-sm font-medium ${
                      score > 0 ? 'text-green-400' :
                      score < 0 ? 'text-red-400' :
                      'text-gray-500'
                    }`}>
                      {score > 0 ? '+' : ''}{score}
                    </span>
                  </div>

                  {/* Comments count */}
                  <span className="flex items-center gap-1 text-gray-400">
                    <MessageCircle className="h-4 w-4" />
                    {comments.length}
                  </span>
                </div>

                {/* Share */}
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/10 text-gray-400 rounded-lg hover:bg-white/20 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Share
                    </>
                  )}
                </button>
              </div>
            </div>
          </article>

          {/* Comments Section */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/10">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary-500" />
                Comments ({comments.length})
              </h2>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleComment} className="p-4 border-b border-white/10">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    maxLength={500}
                    className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {displayName ? `Commenting as ${displayName}` : 'Anonymous comment'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{newComment.length}/500</span>
                      <button
                        type="submit"
                        disabled={!newComment.trim() || sendingComment}
                        className="px-4 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm"
                      >
                        {sendingComment ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Post
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="divide-y divide-white/10">
              {comments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No comments yet. Be the first!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="p-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-200">
                            {comment.displayName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
