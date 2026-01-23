'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Radio,
  MapPin,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Eye,
  Image as ImageIcon,
  Video,
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
  TrendingUp,
  Flame,
  RefreshCw,
  X,
  Camera,
  Plus,
  ChevronDown,
  Filter,
  Archive,
  CheckCircle,
  DollarSign,
  Lock,
  VideoIcon,
  Flag,
} from 'lucide-react'
import { VideoRecorder } from '@/components/VideoRecorder'
import { AutoPlayVideo } from '@/components/AutoPlayVideo'
import { FullscreenVideoPlayer } from '@/components/FullscreenVideoPlayer'
import { FullscreenImageGallery } from '@/components/FullscreenImageGallery'

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
  sessionToken: string
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

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State',
  'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
]

const POLL_INTERVAL = 5000 // 5 seconds

export default function LiveBillboardPage() {
  const [posts, setPosts] = useState<LivePost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [lastFetch, setLastFetch] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(true)
  const [newPostsCount, setNewPostsCount] = useState(0)

  // Filters
  const [category, setCategory] = useState<string | null>(null)
  const [province, setProvince] = useState<string | null>(null)
  const [sort, setSort] = useState<'latest' | 'trending' | 'hot'>('latest')
  const [happeningNow, setHappeningNow] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [archiveCount, setArchiveCount] = useState(0)

  // Create post
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPost, setNewPost] = useState({ content: '', category: 'OTHER', province: '', city: '' })
  const [creating, setCreating] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showVideoRecorder, setShowVideoRecorder] = useState(false)
  const [showCameraPermissionDialog, setShowCameraPermissionDialog] = useState(false)
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false)

  // Revenue sharing
  const [revenueShareEnabled, setRevenueShareEnabled] = useState(false)
  const [revenueShareContact, setRevenueShareContact] = useState('')

  // Stats
  const [happeningNowCount, setHappeningNowCount] = useState(0)
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})

  // Voting state
  const [votingPosts, setVotingPosts] = useState<Set<string>>(new Set())
  const [userVotes, setUserVotes] = useState<Record<string, number | null>>({})
  const [endingPosts, setEndingPosts] = useState<Set<string>>(new Set())

  // Inline comments state (Facebook-style)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [postComments, setPostComments] = useState<Record<string, { id?: string; displayName: string; content: string; createdAt: string }[]>>({})
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set())
  const [newComments, setNewComments] = useState<Record<string, string>>({})
  const [postingComment, setPostingComment] = useState<Set<string>>(new Set())

  // Report content state
  const [reportModal, setReportModal] = useState<{ postId: string | null; isOpen: boolean }>({ postId: null, isOpen: false })
  const [reportReason, setReportReason] = useState<string>('')
  const [reportDescription, setReportDescription] = useState<string>('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)

  // Fullscreen video state
  const [fullscreenVideo, setFullscreenVideo] = useState<{
    isOpen: boolean
    src: string
    watermarkedSrc: string // For downloads
    poster?: string
    postId: string
  } | null>(null)

  // Fullscreen image gallery state
  const [imageGallery, setImageGallery] = useState<{
    isOpen: boolean
    images: { id: string; src: string; watermarkedSrc?: string; alt: string }[]
    initialIndex: number
  } | null>(null)

  // Fetch posts
  const fetchPosts = useCallback(async (isRefresh = false, isPoll = false) => {
    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (province) params.set('province', province)
      params.set('sort', sort)
      if (happeningNow) params.set('happeningNow', 'true')
      if (showArchive) params.set('archive', 'true')
      if (isPoll && lastFetch && !showArchive) params.set('since', lastFetch)
      if (!isPoll) params.set('page', isRefresh ? '1' : String(page))

      const res = await fetch(`/api/live?${params}`)
      const data = await res.json()

      if (data.success) {
        if (isPoll) {
          // Polling should ONLY add new posts to the notification count, never replace existing posts
          if (data.data.posts.length > 0 && !showArchive) {
            setNewPostsCount(prev => prev + data.data.posts.length)
          }
          // Don't modify posts array during polling - just update metadata
        } else if (isRefresh || page === 1) {
          setPosts(data.data.posts)
          setNewPostsCount(0)
        } else {
          setPosts(prev => [...prev, ...data.data.posts])
        }

        setHasMore(page < data.data.pagination.totalPages)
        setLastFetch(data.data.serverTime)
        setHappeningNowCount(data.data.filters.happeningNowCount)
        setCategoryCounts(data.data.filters.categoryCounts)
        setArchiveCount(data.data.filters.archiveCount || 0)
        setError('')
      }
    } catch {
      if (!isPoll) setError('Failed to load posts')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [category, province, sort, happeningNow, showArchive, page, lastFetch])

  // Initial load
  useEffect(() => {
    setLoading(true)
    setPage(1)
    fetchPosts(true)
  }, [category, province, sort, happeningNow, showArchive])

  // Polling for new posts
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      fetchPosts(false, true)
    }, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [isLive, fetchPosts])

  // Load new posts
  const loadNewPosts = () => {
    setLoading(true)
    setPage(1)
    fetchPosts(true)
  }

  // Load more
  const loadMore = () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setPage(prev => prev + 1)
    fetchPosts()
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/')
      const isValidSize = file.size <= 50 * 1024 * 1024 // 50MB
      return isValidType && isValidSize
    })
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 4)) // Max 4 files
  }

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Handle video recording complete
  const handleVideoRecordingComplete = (file: File) => {
    setSelectedFiles(prev => [...prev, file].slice(0, 4))
    setShowVideoRecorder(false)
  }

  // Request camera permission before showing recorder
  const requestCameraPermission = async () => {
    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraPermissionDenied(true)
      setShowCameraPermissionDialog(true)
      return
    }

    try {
      // Directly try to access camera - this triggers the browser's permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      // Permission granted - stop the test stream and show recorder
      stream.getTracks().forEach(track => track.stop())
      setShowVideoRecorder(true)
    } catch (err) {
      console.error('Camera permission error:', err)
      // Permission denied or error - show help dialog
      setCameraPermissionDenied(true)
      setShowCameraPermissionDialog(true)
    }
  }

  // Create post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPost.content.trim() || creating) return

    setCreating(true)
    try {
      // First create the post
      const res = await fetch('/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPost,
          sessionToken,
          displayName,
          revenueShareEnabled,
          revenueShareContact: revenueShareEnabled ? revenueShareContact : undefined,
        }),
      })
      const data = await res.json()

      if (data.success) {
        const newSessionToken = data.data.sessionToken
        setSessionToken(newSessionToken)
        setDisplayName(data.data.displayName)

        // Upload media if any files selected
        if (selectedFiles.length > 0) {
          setUploadingMedia(true)
          try {
            const formData = new FormData()
            formData.append('sessionToken', newSessionToken)
            selectedFiles.forEach(file => formData.append('files', file))

            const mediaRes = await fetch(`/api/live/${data.data.post.publicId}/media`, {
              method: 'POST',
              body: formData,
            })

            if (!mediaRes.ok) {
              console.error('Media upload HTTP error:', mediaRes.status)
              setError(`Media upload failed (HTTP ${mediaRes.status}). Your post was created but without media. Please try uploading again.`)
            } else {
              const mediaData = await mediaRes.json()

              if (mediaData.success) {
                // Update the post with media
                data.data.post.media = mediaData.data.media
              } else {
                console.error('Media upload failed:', mediaData.error)
                setError(`Media upload failed: ${mediaData.error || 'Unknown error'}. Your post was created but without media.`)
              }
            }
          } catch (mediaError) {
            console.error('Media upload error:', mediaError)
            setError('Media upload timed out or failed. Your post was created but without media. For videos, try a shorter/smaller file.')
          } finally {
            setUploadingMedia(false)
          }
        }

        setPosts(prev => [data.data.post, ...prev])
        setNewPost({ content: '', category: 'OTHER', province: '', city: '' })
        setSelectedFiles([])
        setRevenueShareEnabled(false)
        setRevenueShareContact('')
        setShowCreateForm(false)
      } else {
        setError(data.error || 'Failed to create post')
      }
    } catch {
      setError('Failed to create post')
    } finally {
      setCreating(false)
      setUploadingMedia(false)
    }
  }

  // Vote on post
  const handleVote = async (publicId: string, value: 1 | -1) => {
    if (votingPosts.has(publicId)) return

    setVotingPosts(prev => new Set(prev).add(publicId))
    try {
      const res = await fetch(`/api/live/${publicId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      const data = await res.json()

      if (data.success) {
        setUserVotes(prev => ({ ...prev, [publicId]: data.data.userVote }))
        setPosts(prev =>
          prev.map(p =>
            p.publicId === publicId
              ? { ...p, upvotes: data.data.upvotes, downvotes: data.data.downvotes }
              : p
          )
        )
      }
    } catch {
      // Ignore errors
    } finally {
      setVotingPosts(prev => {
        const next = new Set(prev)
        next.delete(publicId)
        return next
      })
    }
  }

  // Mark post as ended
  const handleMarkAsEnded = async (publicId: string) => {
    if (!sessionToken || endingPosts.has(publicId)) return

    setEndingPosts(prev => new Set(prev).add(publicId))
    try {
      const res = await fetch(`/api/live/${publicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, isHappeningNow: false }),
      })
      const data = await res.json()

      if (data.success) {
        setPosts(prev =>
          prev.map(p =>
            p.publicId === publicId
              ? { ...p, isHappeningNow: false }
              : p
          )
        )
        setHappeningNowCount(prev => Math.max(0, prev - 1))
      }
    } catch {
      // Ignore errors
    } finally {
      setEndingPosts(prev => {
        const next = new Set(prev)
        next.delete(publicId)
        return next
      })
    }
  }

  // Toggle inline comments (Facebook-style)
  const toggleComments = async (publicId: string) => {
    if (expandedComments.has(publicId)) {
      // Collapse comments
      setExpandedComments(prev => {
        const next = new Set(prev)
        next.delete(publicId)
        return next
      })
    } else {
      // Expand and fetch comments if not already loaded
      setExpandedComments(prev => new Set(prev).add(publicId))

      if (!postComments[publicId]) {
        setLoadingComments(prev => new Set(prev).add(publicId))
        try {
          const res = await fetch(`/api/live/${publicId}`)
          const data = await res.json()
          if (data.success && data.data.comments) {
            setPostComments(prev => ({ ...prev, [publicId]: data.data.comments }))
          }
        } catch {
          // Ignore errors
        } finally {
          setLoadingComments(prev => {
            const next = new Set(prev)
            next.delete(publicId)
            return next
          })
        }
      }
    }
  }

  // Post inline comment
  const handlePostComment = async (publicId: string) => {
    const content = newComments[publicId]?.trim()
    if (!content || postingComment.has(publicId)) return

    setPostingComment(prev => new Set(prev).add(publicId))
    try {
      const res = await fetch(`/api/live/${publicId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()

      if (data.success) {
        // Add comment to the list
        setPostComments(prev => ({
          ...prev,
          [publicId]: [...(prev[publicId] || []), data.data.comment]
        }))
        // Clear input
        setNewComments(prev => ({ ...prev, [publicId]: '' }))
        // Update comment count
        setPosts(prev =>
          prev.map(p =>
            p.publicId === publicId
              ? { ...p, commentCount: (p.commentCount || 0) + 1 }
              : p
          )
        )
      }
    } catch {
      // Ignore errors
    } finally {
      setPostingComment(prev => {
        const next = new Set(prev)
        next.delete(publicId)
        return next
      })
    }
  }

  // Open fullscreen video with comments
  const openFullscreenVideo = async (src: string, postId: string, poster?: string, watermarkedSrc?: string) => {
    // Load comments if not already loaded
    if (!postComments[postId]) {
      try {
        const res = await fetch(`/api/live/${postId}`)
        const data = await res.json()
        if (data.success && data.data.comments) {
          setPostComments(prev => ({ ...prev, [postId]: data.data.comments }))
        }
      } catch {
        // Ignore errors, will show empty comments
      }
    }
    setFullscreenVideo({ isOpen: true, src, postId, poster, watermarkedSrc: watermarkedSrc || src })
  }

  // Submit report
  const handleSubmitReport = async () => {
    if (!reportModal.postId || !reportReason || submittingReport) return

    setSubmittingReport(true)
    try {
      // Generate a simple fingerprint for duplicate report prevention
      const fingerprint = btoa(navigator.userAgent + screen.width + screen.height).slice(0, 32)

      const res = await fetch(`/api/live/${reportModal.postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription || undefined,
          fingerprint,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setReportSuccess(true)
        setTimeout(() => {
          setReportModal({ postId: null, isOpen: false })
          setReportReason('')
          setReportDescription('')
          setReportSuccess(false)
        }, 2000)
      } else {
        setError(data.error || 'Failed to submit report')
      }
    } catch {
      setError('Failed to submit report')
    } finally {
      setSubmittingReport(false)
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

  // Get category config
  const getCategoryConfig = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1]
  }

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png')" }}
    >
      <div className="bg-black/60 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <Radio className="h-7 w-7 text-red-500 animate-pulse" />
                Live Billboard
              </h1>
              <p className="text-gray-300 mt-1">
                Real-time news from citizens across South Africa
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isLive && (
                <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/30">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  LIVE
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsLive(!isLive)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isLive
                    ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                    : 'bg-primary-500 text-white'
                }`}
              >
                {isLive ? 'Pause' : 'Go Live'}
              </button>
            </div>
          </div>

          {/* New Posts Alert */}
          {newPostsCount > 0 && (
            <button
              type="button"
              onClick={loadNewPosts}
              className="w-full mb-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {newPostsCount} new {newPostsCount === 1 ? 'post' : 'posts'} - Click to load
            </button>
          )}

          {/* Create Post Button */}
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full mb-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 font-medium shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Report Something Happening Now
          </button>

          {/* Create Post Form */}
          {showCreateForm && (
            <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-6 border border-white/10">
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="What's happening? Report it live..."
                    rows={3}
                    maxLength={1000}
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-400 text-right mt-1">{newPost.content.length}/1000</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                    <select
                      value={newPost.category}
                      onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/30 text-white text-sm"
                      title="Select category"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Province</label>
                    <select
                      value={newPost.province}
                      onChange={(e) => setNewPost({ ...newPost, province: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/30 text-white text-sm"
                      title="Select province"
                    >
                      <option value="">Select Province</option>
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
                    value={newPost.city}
                    onChange={(e) => setNewPost({ ...newPost, city: e.target.value })}
                    placeholder="e.g., Sandton, Durban CBD"
                    className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400 text-sm"
                  />
                </div>

                {/* Media Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Photos & Videos (Optional)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    title="Select photos or videos to upload"
                  />

                  {/* Record Video Button */}
                  {selectedFiles.length < 4 && (
                    <button
                      type="button"
                      onClick={requestCameraPermission}
                      className="w-full mb-3 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 font-medium"
                    >
                      <Video className="h-5 w-5" />
                      Record Video
                    </button>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="w-20 h-20 rounded-lg bg-white/10 overflow-hidden flex items-center justify-center">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : file.type.startsWith('video/') ? (
                            <video
                              src={URL.createObjectURL(file)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <Video className="h-6 w-6 text-gray-400 mx-auto" />
                              <span className="text-xs text-gray-400 truncate block px-1">{file.name.slice(0, 8)}...</span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove file"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {file.type.startsWith('video/') && (
                          <div className="absolute bottom-1 left-1 bg-black/70 rounded px-1 py-0.5">
                            <Video className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    {selectedFiles.length < 4 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors"
                      >
                        <Camera className="h-6 w-6 mb-1" />
                        <span className="text-xs">Upload</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Max 4 files, 50MB each. Record video or upload photos/videos.
                  </p>
                </div>

                {/* Revenue Sharing Option */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white text-sm mb-2">
                        Revenue Sharing (Optional)
                      </h4>
                      <div className="space-y-2">
                        <label className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                          !revenueShareEnabled
                            ? 'bg-black/30 ring-1 ring-primary-500'
                            : 'hover:bg-black/20'
                        }`}>
                          <input
                            type="radio"
                            name="liveRevenueShare"
                            checked={!revenueShareEnabled}
                            onChange={() => setRevenueShareEnabled(false)}
                            className="h-3.5 w-3.5 text-primary-500"
                          />
                          <Lock className="h-3.5 w-3.5 text-primary-500" />
                          <span className="text-sm text-gray-300">Stay anonymous (SA Leaks keeps revenue)</span>
                        </label>
                        <label className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                          revenueShareEnabled
                            ? 'bg-black/30 ring-1 ring-amber-500'
                            : 'hover:bg-black/20'
                        }`}>
                          <input
                            type="radio"
                            name="liveRevenueShare"
                            checked={revenueShareEnabled}
                            onChange={() => setRevenueShareEnabled(true)}
                            className="h-3.5 w-3.5 text-amber-500"
                          />
                          <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-sm text-gray-300">Share revenue 50/50</span>
                        </label>
                        {revenueShareEnabled && (
                          <input
                            type="text"
                            value={revenueShareContact}
                            onChange={(e) => setRevenueShareContact(e.target.value)}
                            placeholder="Contact email or phone"
                            required={revenueShareEnabled}
                            className="w-full mt-2 px-3 py-2 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Progress Indicator */}
                {uploadingMedia && (
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-blue-400 animate-spin flex-shrink-0" />
                    <div>
                      <p className="text-blue-200 font-medium">
                        {selectedFiles.some(f => f.type.startsWith('video/'))
                          ? 'Uploading and processing video...'
                          : 'Uploading media...'}
                      </p>
                      <p className="text-blue-400 text-sm">
                        {selectedFiles.some(f => f.type.startsWith('video/'))
                          ? 'Videos are being watermarked. This may take a minute for larger files.'
                          : 'Please wait, this should only take a moment.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {displayName ? `Posting as ${displayName}` : 'You\'ll get an anonymous reporter name'}
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
                      disabled={!newPost.content.trim() || creating || uploadingMedia}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {creating || uploadingMedia ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {uploadingMedia
                            ? selectedFiles.some(f => f.type.startsWith('video/'))
                              ? 'Uploading video (please wait)...'
                              : 'Uploading media...'
                            : 'Posting...'}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Post Live
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
              {/* Sort buttons */}
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
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
                <button
                  type="button"
                  onClick={() => setSort('trending')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    sort === 'trending' ? 'bg-white/20 shadow text-white' : 'text-gray-400'
                  }`}
                >
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  Trending
                </button>
                <button
                  type="button"
                  onClick={() => setSort('hot')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    sort === 'hot' ? 'bg-white/20 shadow text-white' : 'text-gray-400'
                  }`}
                >
                  <Flame className="h-4 w-4 inline mr-1" />
                  Hot
                </button>
              </div>

              {/* Happening Now Toggle */}
              <button
                type="button"
                onClick={() => {
                  setHappeningNow(!happeningNow)
                  if (!happeningNow) setShowArchive(false)
                }}
                disabled={showArchive}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  happeningNow
                    ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500'
                    : 'bg-white/10 text-gray-400'
                } ${showArchive ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Radio className={`h-4 w-4 ${happeningNow ? 'animate-pulse' : ''}`} />
                Happening Now ({happeningNowCount})
              </button>

              {/* Archive Toggle */}
              <button
                type="button"
                onClick={() => {
                  setShowArchive(!showArchive)
                  if (!showArchive) setHappeningNow(false)
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  showArchive
                    ? 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-500'
                    : 'bg-white/10 text-gray-400'
                }`}
              >
                <Archive className="h-4 w-4" />
                Archive ({archiveCount})
              </button>

              {/* More Filters Toggle */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-gray-400 flex items-center gap-1 ml-auto"
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCategory(null)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        !category
                          ? 'bg-primary-500 text-white'
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
                              ? 'bg-primary-500 text-white'
                              : `${cat.color} hover:opacity-80`
                          }`}
                        >
                          <cat.icon className="h-3 w-3" />
                          {cat.label} ({count})
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Province */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Province</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setProvince(null)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        !province
                          ? 'bg-primary-500 text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      All SA
                    </button>
                    {PROVINCES.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProvince(province === p ? null : p)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          province === p
                            ? 'bg-primary-500 text-white'
                            : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Filters */}
                {(category || province) && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Active:</span>
                    {category && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-500/20 text-primary-300 rounded-full text-xs">
                        {getCategoryConfig(category).label}
                        <button type="button" onClick={() => setCategory(null)} title="Remove category filter">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {province && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-500/20 text-primary-300 rounded-full text-xs">
                        {province}
                        <button type="button" onClick={() => setProvince(null)} title="Remove province filter">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
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

          {/* Archive Banner */}
          {showArchive && (
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
              <Archive className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-200">Viewing Archive</p>
                <p className="text-sm text-amber-400">These are posts older than 7 days</p>
              </div>
              <button
                type="button"
                onClick={() => setShowArchive(false)}
                className="ml-auto px-3 py-1 bg-amber-500/20 text-amber-200 rounded-lg text-sm hover:bg-amber-500/30 transition-colors"
              >
                Back to Live Feed
              </button>
            </div>
          )}

          {/* Posts Feed */}
          {loading && posts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10">
              {showArchive ? (
                <>
                  <Archive className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No archived posts</p>
                  <p className="text-sm text-gray-500 mt-1">Posts older than 7 days will appear here</p>
                </>
              ) : (
                <>
                  <Radio className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No posts yet</p>
                  <p className="text-sm text-gray-500 mt-1">Be the first to report something!</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const catConfig = getCategoryConfig(post.category)
                const CatIcon = catConfig.icon
                const score = post.upvotes - post.downvotes
                const userVote = userVotes[post.publicId]
                const isVoting = votingPosts.has(post.publicId)
                const isOwner = sessionToken && post.sessionToken === sessionToken
                const isEnding = endingPosts.has(post.publicId)

                return (
                  <article
                    key={post.id}
                    className={`bg-black/40 backdrop-blur-sm shadow-lg overflow-hidden border-white/10 hover:border-white/20 transition-all ${
                      post.media && post.media.length > 0
                        ? '-mx-4 sm:mx-0 sm:rounded-xl border-y sm:border' // Full width on mobile, rounded on desktop
                        : 'rounded-xl border'
                    }`}
                  >
                    {/* Media - Full width edge-to-edge like Facebook */}
                    {post.media && post.media.length > 0 && (
                      <div className={`${post.media.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}`}>
                        {post.media.map((media) => (
                          <div
                            key={media.id}
                            className={`relative bg-black ${
                              post.media.length === 1
                                ? 'aspect-[4/5] sm:aspect-[16/9]' // Taller on mobile, wider on desktop
                                : 'aspect-square'
                            }`}
                          >
                            {media.mimeType.startsWith('image/') ? (
                              <div
                                className="w-full h-full cursor-pointer"
                                onClick={() => {
                                  // Get all images from this post for the gallery
                                  const postImages = post.media
                                    .filter(m => m.mimeType.startsWith('image/'))
                                    .map(m => ({
                                      id: m.id,
                                      src: getMediaUrl(m.path), // Display clean/unwatermarked
                                      watermarkedSrc: getMediaUrl(m.watermarkedPath) || getMediaUrl(m.path), // For downloads
                                      alt: m.originalName,
                                    }))
                                  const clickedIndex = postImages.findIndex(img => img.id === media.id)
                                  setImageGallery({
                                    isOpen: true,
                                    images: postImages,
                                    initialIndex: clickedIndex >= 0 ? clickedIndex : 0,
                                  })
                                }}
                              >
                                <img
                                  src={getMediaUrl(media.path)}
                                  alt={media.originalName}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                                {/* Tap to expand indicator for multiple images */}
                                {post.media.filter(m => m.mimeType.startsWith('image/')).length > 1 && (
                                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 rounded text-white text-xs">
                                    {post.media.filter(m => m.mimeType.startsWith('image/')).length} photos
                                  </div>
                                )}
                              </div>
                            ) : media.mimeType.startsWith('video/') ? (
                              <div
                                className="w-full h-full cursor-pointer"
                                onClick={() => openFullscreenVideo(
                                  getMediaUrl(media.path), // Display clean/unwatermarked
                                  post.publicId,
                                  undefined,
                                  getMediaUrl(media.watermarkedPath) || getMediaUrl(media.path) // For downloads
                                )}
                              >
                                <AutoPlayVideo
                                  src={getMediaUrl(media.path)}
                                  className="w-full h-full pointer-events-none"
                                />
                                {/* Tap to expand indicator */}
                                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 rounded text-white text-xs flex items-center gap-1">
                                  <VideoIcon className="h-3 w-3" />
                                  Tap to expand
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${catConfig.color}`}>
                            <CatIcon className="h-3 w-3" />
                            {catConfig.label}
                          </span>
                          {post.isHappeningNow ? (
                            <>
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium border border-red-500/30">
                                <Radio className="h-3 w-3 animate-pulse" />
                                LIVE
                              </span>
                              {isOwner && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkAsEnded(post.publicId)}
                                  disabled={isEnding}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 text-gray-400 hover:bg-white/20 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
                                  title="Mark this event as ended"
                                >
                                  {isEnding ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                  Mark Ended
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 text-gray-400 rounded-full text-xs font-medium">
                              <CheckCircle className="h-3 w-3" />
                              Ended
                            </span>
                          )}
                          {(post.province || post.city) && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                              <MapPin className="h-3 w-3" />
                              {[post.city, post.province].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(post.createdAt)}
                        </span>
                      </div>

                      {/* Reporter */}
                      <p className="text-xs text-gray-400 mb-2">
                        Reported by <span className="font-medium text-gray-300">{post.displayName}</span>
                      </p>

                      {/* Content */}
                      <p className="text-gray-200 whitespace-pre-wrap mb-3">
                        {post.content}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex items-center gap-4">
                          {/* Voting */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleVote(post.publicId, 1)}
                              disabled={isVoting}
                              className={`p-1.5 rounded-lg transition-colors ${
                                userVote === 1
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'hover:bg-white/10 text-gray-400'
                              } disabled:opacity-50`}
                              title="Upvote"
                            >
                              <ThumbsUp className={`h-4 w-4 ${userVote === 1 ? 'fill-current' : ''}`} />
                            </button>
                            <span className={`text-sm font-medium min-w-[2ch] text-center ${
                              score > 0 ? 'text-green-400' :
                              score < 0 ? 'text-red-400' :
                              'text-gray-400'
                            }`}>
                              {score > 0 ? '+' : ''}{score}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleVote(post.publicId, -1)}
                              disabled={isVoting}
                              className={`p-1.5 rounded-lg transition-colors ${
                                userVote === -1
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'hover:bg-white/10 text-gray-400'
                              } disabled:opacity-50`}
                              title="Downvote"
                            >
                              <ThumbsDown className={`h-4 w-4 ${userVote === -1 ? 'fill-current' : ''}`} />
                            </button>
                          </div>

                          {/* Comments toggle */}
                          <button
                            type="button"
                            onClick={() => toggleComments(post.publicId)}
                            className={`flex items-center gap-1 transition-colors ${
                              expandedComments.has(post.publicId)
                                ? 'text-primary-400'
                                : 'text-gray-400 hover:text-primary-400'
                            }`}
                          >
                            <MessageCircle className={`h-4 w-4 ${expandedComments.has(post.publicId) ? 'fill-current' : ''}`} />
                            <span className="text-sm">{post.commentCount}</span>
                          </button>

                          {/* Views */}
                          <span className="flex items-center gap-1 text-gray-400 text-sm">
                            <Eye className="h-4 w-4" />
                            {post.viewCount}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Report button */}
                          <button
                            type="button"
                            onClick={() => setReportModal({ postId: post.publicId, isOpen: true })}
                            className="text-sm text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
                            title="Report this post"
                          >
                            <Flag className="h-4 w-4" />
                          </button>

                          {/* Share button */}
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/live/${post.publicId}`)
                            }}
                            className="text-sm text-gray-400 hover:text-primary-400 transition-colors"
                            title="Copy link"
                          >
                            Share
                          </button>
                        </div>
                      </div>

                      {/* Inline Comments Section (Facebook-style) */}
                      {expandedComments.has(post.publicId) && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          {/* Comment input */}
                          <div className="flex gap-2 mb-4">
                            <input
                              type="text"
                              value={newComments[post.publicId] || ''}
                              onChange={(e) => setNewComments(prev => ({ ...prev, [post.publicId]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handlePostComment(post.publicId)
                                }
                              }}
                              placeholder="Write a comment..."
                              className="flex-1 px-3 py-2 bg-white/10 rounded-full text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <button
                              type="button"
                              onClick={() => handlePostComment(post.publicId)}
                              disabled={!newComments[post.publicId]?.trim() || postingComment.has(post.publicId)}
                              className="px-4 py-2 bg-primary-500 text-white rounded-full text-sm hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {postingComment.has(post.publicId) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </button>
                          </div>

                          {/* Comments list */}
                          {loadingComments.has(post.publicId) ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                            </div>
                          ) : postComments[post.publicId]?.length ? (
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {postComments[post.publicId].map((comment, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs text-gray-400">{comment.displayName.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div className="flex-1 bg-white/5 rounded-xl px-3 py-2">
                                    <p className="text-xs font-medium text-gray-300">{comment.displayName}</p>
                                    <p className="text-sm text-gray-200">{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-gray-500 text-sm py-4">No comments yet. Be the first!</p>
                          )}
                        </div>
                      )}
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

      {/* Camera Permission Dialog */}
      {showCameraPermissionDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-ink-800 rounded-2xl p-6 max-w-md w-full">
            <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="h-8 w-8 text-primary-400" />
            </div>

            {cameraPermissionDenied ? (
              <>
                <h3 className="text-xl font-semibold text-white text-center mb-2">Camera Access Denied</h3>
                <p className="text-gray-400 text-center mb-4">
                  To record video, you need to allow camera access in your browser settings.
                </p>
                <div className="bg-ink-700 rounded-lg p-4 mb-6 text-sm">
                  <p className="text-white font-medium mb-2">How to enable:</p>
                  <ul className="text-gray-400 space-y-1">
                    <li>• <strong>iPhone Safari:</strong> Tap aA in address bar → Website Settings → Camera → Allow</li>
                    <li>• <strong>Android Chrome:</strong> Tap lock icon → Permissions → Camera → Allow</li>
                    <li>• <strong>Desktop:</strong> Click the camera icon in the address bar</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCameraPermissionDialog(false)}
                    className="flex-1 py-3 bg-ink-700 text-white rounded-lg hover:bg-ink-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCameraPermissionDialog(false)
                      setCameraPermissionDenied(false)
                      requestCameraPermission()
                    }}
                    className="flex-1 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-white text-center mb-2">Allow Camera Access</h3>
                <p className="text-gray-400 text-center mb-6">
                  SA Leaks needs access to your camera and microphone to record video. Please tap &quot;Allow&quot; when prompted.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCameraPermissionDialog(false)}
                    className="flex-1 py-3 bg-ink-700 text-white rounded-lg hover:bg-ink-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Video Recorder Modal */}
      {showVideoRecorder && (
        <VideoRecorder
          onRecordingComplete={handleVideoRecordingComplete}
          onCancel={() => setShowVideoRecorder(false)}
          maxDuration={300}
        />
      )}

      {/* Report Modal */}
      {reportModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-ink-800 rounded-2xl p-6 max-w-md w-full border border-white/10">
            {reportSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Report Submitted</h3>
                <p className="text-gray-400">Thank you for helping keep our community safe.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Flag className="h-5 w-5 text-red-400" />
                    Report Content
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setReportModal({ postId: null, isOpen: false })
                      setReportReason('')
                      setReportDescription('')
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-gray-400 text-sm mb-4">
                  Help us understand what&apos;s wrong with this post. Your report is anonymous.
                </p>

                <div className="space-y-3 mb-6">
                  {[
                    { id: 'NSFW', label: 'Sexual or adult content', icon: '🔞' },
                    { id: 'VIOLENCE', label: 'Violence or graphic content', icon: '⚠️' },
                    { id: 'SPAM', label: 'Spam or promotional', icon: '📢' },
                    { id: 'FAKE', label: 'Fake news or AI-generated', icon: '🤖' },
                    { id: 'HARASSMENT', label: 'Harassment or bullying', icon: '😠' },
                    { id: 'OTHER', label: 'Other violation', icon: '❓' },
                  ].map((reason) => (
                    <label
                      key={reason.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        reportReason === reason.id
                          ? 'bg-red-500/20 ring-2 ring-red-500'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason.id}
                        checked={reportReason === reason.id}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="hidden"
                      />
                      <span className="text-lg">{reason.icon}</span>
                      <span className="text-gray-200">{reason.label}</span>
                    </label>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Provide more context about this report..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-500 text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setReportModal({ postId: null, isOpen: false })
                      setReportReason('')
                      setReportDescription('')
                    }}
                    className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitReport}
                    disabled={!reportReason || submittingReport}
                    className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {submittingReport ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Flag className="h-4 w-4" />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Video Player */}
      {fullscreenVideo?.isOpen && (
        <FullscreenVideoPlayer
          src={fullscreenVideo.src}
          watermarkedSrc={fullscreenVideo.watermarkedSrc}
          poster={fullscreenVideo.poster}
          postId={fullscreenVideo.postId}
          comments={postComments[fullscreenVideo.postId] || []}
          onClose={() => setFullscreenVideo(null)}
          onAddComment={async (content) => {
            // Reuse existing comment posting logic
            const publicId = fullscreenVideo.postId
            try {
              const res = await fetch(`/api/live/${publicId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content,
                  sessionToken,
                }),
              })
              const data = await res.json()
              if (data.success) {
                // Add new comment to local state
                setPostComments(prev => ({
                  ...prev,
                  [publicId]: [...(prev[publicId] || []), data.data.comment],
                }))
              }
            } catch {
              console.error('Failed to post comment')
            }
          }}
        />
      )}

      {/* Fullscreen Image Gallery */}
      {imageGallery?.isOpen && (
        <FullscreenImageGallery
          images={imageGallery.images}
          initialIndex={imageGallery.initialIndex}
          onClose={() => setImageGallery(null)}
        />
      )}
    </div>
  )
}
