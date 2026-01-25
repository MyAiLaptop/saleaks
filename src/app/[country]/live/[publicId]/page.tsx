'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Radio,
  MapPin,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Eye,
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

export default function CountryLivePostPage() {
  const { country } = useCountry()
  const params = useParams<{ publicId: string }>()
  const [post, setPost] = useState<LivePost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')


  const [userVote, setUserVote] = useState<number | null>(null)
  const [voting, setVoting] = useState(false)
  const [voteCount, setVoteCount] = useState({ upvotes: 0, downvotes: 0 })

  const [copied, setCopied] = useState(false)

  // Fetch post
  useEffect(() => {
    if (!params.publicId) return

    fetch(`/api/live/${params.publicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPost(data.data)
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

        </div>
      </div>
    </div>
  )
}
