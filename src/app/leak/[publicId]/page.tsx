'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Building2,
  Eye,
  Share2,
  FileText,
  Download,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
  Image as ImageIcon,
  File,
  Video,
  Copy,
  Check,
  Lock,
  User,
  Shield,
  CheckCircle2,
  Lightbulb,
  Search,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Printer,
  Code,
  X,
  Newspaper,
  Plus,
  Loader2,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { LiveChat } from '@/components/LiveChat'
import { PurchaseButton } from '@/components/PurchaseButton'

const MESSAGE_TYPE_CONFIG = {
  FACT: { label: 'Fact', icon: CheckCircle2, bgColor: 'bg-blue-100 dark:bg-blue-900/50', textColor: 'text-blue-700 dark:text-blue-300' },
  OPINION: { label: 'Opinion', icon: Lightbulb, bgColor: 'bg-purple-100 dark:bg-purple-900/50', textColor: 'text-purple-700 dark:text-purple-300' },
  LEAD: { label: 'Lead', icon: Search, bgColor: 'bg-orange-100 dark:bg-orange-900/50', textColor: 'text-orange-700 dark:text-orange-300' },
  QUESTION: { label: 'Question', icon: HelpCircle, bgColor: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-700 dark:text-gray-300' },
} as const

interface Category {
  id: string
  name: string
  slug: string
}

interface FileData {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
  watermarkedPath?: string | null
  price?: number | null
  forSale?: boolean
}

interface Message {
  id: string
  content: string
  isFromWhistleblower: boolean
  messageType?: string
  createdAt: string
}

interface Post {
  publicId: string
  title: string
  content: string
  category: Category
  province: string | null
  city: string | null
  organization: string | null
  viewCount: number
  upvotes: number
  downvotes: number
  featured: boolean
  createdAt: string
  files: FileData[]
  messages: Message[]
  _count?: { messages: number }
}

interface RelatedPost {
  publicId: string
  title: string
  content: string
  province: string | null
  organization: string | null
  viewCount: number
  upvotes: number
  downvotes: number
  createdAt: string
  category: { name: string; slug: string }
}

interface CoverageLink {
  id: string
  url: string
  title: string
  outlet: string | null
  publishedAt: string | null
  createdAt: string
}

interface PostUpdate {
  id: string
  updateType: string
  title: string
  content: string
  hasAttachment: boolean
  createdAt: string
}

const UPDATE_TYPE_CONFIG = {
  UPDATE: { label: 'Update', bgColor: 'bg-blue-100 dark:bg-blue-900/50', textColor: 'text-blue-700 dark:text-blue-300', borderColor: 'border-blue-500' },
  CORRECTION: { label: 'Correction', bgColor: 'bg-amber-100 dark:bg-amber-900/50', textColor: 'text-amber-700 dark:text-amber-300', borderColor: 'border-amber-500' },
  DEVELOPMENT: { label: 'New Development', bgColor: 'bg-green-100 dark:bg-green-900/50', textColor: 'text-green-700 dark:text-green-300', borderColor: 'border-green-500' },
  RESOLVED: { label: 'Resolved', bgColor: 'bg-purple-100 dark:bg-purple-900/50', textColor: 'text-purple-700 dark:text-purple-300', borderColor: 'border-purple-500' },
} as const

export default function LeakPage() {
  const params = useParams<{ publicId: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [userVote, setUserVote] = useState<number | null>(null)
  const [voteCount, setVoteCount] = useState({ upvotes: 0, downvotes: 0 })
  const [voting, setVoting] = useState(false)
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([])
  const [showEmbedModal, setShowEmbedModal] = useState(false)
  const [embedCopied, setEmbedCopied] = useState(false)
  const [coverageLinks, setCoverageLinks] = useState<CoverageLink[]>([])
  const [showCoverageForm, setShowCoverageForm] = useState(false)
  const [coverageForm, setCoverageForm] = useState({ url: '', title: '', outlet: '' })
  const [submittingCoverage, setSubmittingCoverage] = useState(false)
  const [coverageMessage, setCoverageMessage] = useState('')
  const [postUpdates, setPostUpdates] = useState<PostUpdate[]>([])
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [updateForm, setUpdateForm] = useState({ contactToken: '', updateType: 'UPDATE', title: '', content: '' })
  const [submittingUpdate, setSubmittingUpdate] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')

  useEffect(() => {
    if (!params.publicId) return
    fetch(`/api/posts/${params.publicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPost(data.data)
          setVoteCount({ upvotes: data.data.upvotes || 0, downvotes: data.data.downvotes || 0 })
        } else {
          setError(data.error || 'Post not found')
        }
      })
      .catch(() => setError('Failed to load post'))
      .finally(() => setLoading(false))

    // Fetch user's vote status
    fetch(`/api/posts/${params.publicId}/vote`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUserVote(data.data.userVote)
        }
      })
      .catch(() => {}) // Ignore errors for vote status

    // Fetch related posts
    fetch(`/api/posts/${params.publicId}/related`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRelatedPosts(data.data)
        }
      })
      .catch(() => {}) // Ignore errors for related posts

    // Fetch coverage links
    fetch(`/api/posts/${params.publicId}/coverage`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCoverageLinks(data.data)
        }
      })
      .catch(() => {}) // Ignore errors for coverage links

    // Fetch post updates
    fetch(`/api/posts/${params.publicId}/updates`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPostUpdates(data.data)
        }
      })
      .catch(() => {}) // Ignore errors for updates
  }, [params.publicId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon
    if (mimeType.startsWith('video/')) return Video
    if (mimeType === 'application/pdf') return FileText
    return File
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getEmbedCode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://saleaks.co.za'
    return `<iframe src="${baseUrl}/embed/${params.publicId}" width="400" height="300" frameborder="0" style="border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></iframe>`
  }

  const copyEmbedCode = async () => {
    await navigator.clipboard.writeText(getEmbedCode())
    setEmbedCopied(true)
    setTimeout(() => setEmbedCopied(false), 2000)
  }

  const handleSubmitCoverage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!coverageForm.url || !coverageForm.title || !params.publicId) return

    setSubmittingCoverage(true)
    setCoverageMessage('')

    try {
      const res = await fetch(`/api/posts/${params.publicId}/coverage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coverageForm),
      })
      const data = await res.json()

      if (data.success) {
        setCoverageMessage('Thanks! Your submission is pending review.')
        setCoverageForm({ url: '', title: '', outlet: '' })
        setShowCoverageForm(false)
      } else {
        setCoverageMessage(data.error || 'Failed to submit')
      }
    } catch {
      setCoverageMessage('Failed to submit')
    } finally {
      setSubmittingCoverage(false)
    }
  }

  const handleVote = async (value: 1 | -1) => {
    if (voting || !params.publicId) return
    setVoting(true)

    try {
      const res = await fetch(`/api/posts/${params.publicId}/vote`, {
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
      // Ignore errors
    } finally {
      setVoting(false)
    }
  }

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!updateForm.contactToken || !updateForm.title || !updateForm.content || !params.publicId) return

    setSubmittingUpdate(true)
    setUpdateMessage('')

    try {
      const res = await fetch(`/api/posts/${params.publicId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateForm),
      })
      const data = await res.json()

      if (data.success) {
        setUpdateMessage('Update posted successfully!')
        setPostUpdates([data.data, ...postUpdates])
        setUpdateForm({ contactToken: '', updateType: 'UPDATE', title: '', content: '' })
        setShowUpdateForm(false)
      } else {
        setUpdateMessage(data.error || 'Failed to post update')
      }
    } catch {
      setUpdateMessage('Failed to post update')
    } finally {
      setSubmittingUpdate(false)
    }
  }

  const credibilityScore = voteCount.upvotes - voteCount.downvotes
  const totalVotes = voteCount.upvotes + voteCount.downvotes

  if (loading) {
    return (
      <div
        className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png')" }}
      >
        <div className="bg-black/60 min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 bg-white/20 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-white/20 rounded w-48 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div
        className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png')" }}
      >
        <div className="bg-black/60 min-h-screen flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <AlertTriangle className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              {error || 'Post not found'}
            </h1>
            <p className="text-gray-400 mb-6">
              This leak may have been removed or may never have existed.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center text-primary-400 hover:text-primary-300"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Browse
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png')" }}
    >
      <div className="bg-black/60 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back link */}
          <Link
            href="/browse"
            className="inline-flex items-center text-gray-300 hover:text-primary-400 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Link>

          {/* Main Content */}
          <article className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/10">
            <div className="p-6 md:p-8">
              {/* Category & Featured & Evidence Badge */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-500/20 text-primary-300 border border-primary-500/30">
                  {post.category.name}
                </span>
                {post.featured && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Featured
                  </span>
                )}
                {post.files && post.files.length > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Evidence Attached
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
                {post.title}
              </h1>

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-8 pb-6 border-b border-white/10">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(post.createdAt)}
                </span>
                {(post.province || post.city) && (
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {[post.city, post.province].filter(Boolean).join(', ')}
                  </span>
                )}
                {post.organization && (
                  <span className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    {post.organization}
                  </span>
                )}
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  {post.viewCount} views
                </span>
              </div>

              {/* Content */}
              <div className="prose prose-lg prose-invert max-w-none mb-8">
                {post.content.split('\n').map((paragraph, i) => (
                  <p key={i} className="text-gray-300 mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>

          {/* Files */}
          {post.files && post.files.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Evidence Files ({post.files.length})
              </h2>
              <div className="grid gap-3">
                {post.files.map((file) => {
                  const FileIcon = getFileIcon(file.mimeType)
                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center space-x-3">
                        <FileIcon className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Free download (watermarked) */}
                        <a
                          href={file.watermarkedPath || file.path}
                          download={file.originalName}
                          className="flex items-center px-3 py-1.5 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                          title="Download with watermark"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Free
                        </a>
                        {/* Purchase without watermark */}
                        {file.forSale !== false && (
                          <PurchaseButton
                            mediaId={file.id}
                            mediaType="file"
                            price={file.price ?? undefined}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Updates Timeline */}
          {postUpdates.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary-500" />
                Updates & Developments
              </h2>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                <div className="space-y-4">
                  {postUpdates.map((update) => {
                    const typeConfig = UPDATE_TYPE_CONFIG[update.updateType as keyof typeof UPDATE_TYPE_CONFIG] || UPDATE_TYPE_CONFIG.UPDATE
                    return (
                      <div key={update.id} className="relative pl-10">
                        {/* Timeline dot */}
                        <div className={`absolute left-2 w-5 h-5 rounded-full border-2 ${typeConfig.borderColor} bg-white dark:bg-gray-800 flex items-center justify-center`}>
                          {update.updateType === 'RESOLVED' ? (
                            <CheckCircle className="h-3 w-3 text-purple-500" />
                          ) : update.updateType === 'CORRECTION' ? (
                            <AlertCircle className="h-3 w-3 text-amber-500" />
                          ) : update.updateType === 'DEVELOPMENT' ? (
                            <RefreshCw className="h-3 w-3 text-green-500" />
                          ) : (
                            <Clock className="h-3 w-3 text-blue-500" />
                          )}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.bgColor} ${typeConfig.textColor}`}>
                                {typeConfig.label}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(update.createdAt)}
                              </span>
                            </div>
                          </div>
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                            {update.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                            {update.content}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            {/* Credibility Voting */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Credibility:</span>
              <button
                type="button"
                onClick={() => handleVote(1)}
                disabled={voting}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors ${
                  userVote === 1
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600'
                } disabled:opacity-50`}
              >
                <ThumbsUp className={`h-4 w-4 mr-1 ${userVote === 1 ? 'fill-current' : ''}`} />
                {voteCount.upvotes}
              </button>
              <button
                type="button"
                onClick={() => handleVote(-1)}
                disabled={voting}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors ${
                  userVote === -1
                    ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600'
                } disabled:opacity-50`}
              >
                <ThumbsDown className={`h-4 w-4 mr-1 ${userVote === -1 ? 'fill-current' : ''}`} />
                {voteCount.downvotes}
              </button>
              {totalVotes > 0 && (
                <span className={`text-sm font-medium ml-2 ${
                  credibilityScore > 0 ? 'text-green-600 dark:text-green-400' :
                  credibilityScore < 0 ? 'text-red-600 dark:text-red-400' :
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {credibilityScore > 0 ? '+' : ''}{credibilityScore}
                </span>
              )}
            </div>

            {/* Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors print:hidden"
                title="Print this leak"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors print:hidden"
                title="Copy link"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a8cd8] transition-colors print:hidden"
                title="Share on Twitter/X"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${post.title} - ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20bd5a] transition-colors print:hidden"
                title="Share on WhatsApp"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#166fe5] transition-colors print:hidden"
                title="Share on Facebook"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <button
                type="button"
                onClick={() => setShowEmbedModal(true)}
                className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors print:hidden"
                title="Get embed code"
              >
                <Code className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Live Discussion Room */}
      <div className="mt-8">
        <LiveChat publicId={post.publicId} />
      </div>

      {/* Public Messages Section */}
      {post.messages && post.messages.length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-primary-500" />
              Public Conversation ({post.messages.length})
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Messages between journalists and the anonymous whistleblower
            </p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {post.messages.map((msg) => {
              const typeConfig = MESSAGE_TYPE_CONFIG[msg.messageType as keyof typeof MESSAGE_TYPE_CONFIG] || MESSAGE_TYPE_CONFIG.OPINION
              const TypeIcon = typeConfig.icon
              return (
                <div
                  key={msg.id}
                  className={`p-4 ${
                    msg.isFromWhistleblower
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.isFromWhistleblower
                          ? 'bg-primary-100 dark:bg-primary-800'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      {msg.isFromWhistleblower ? (
                        <Shield className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      ) : (
                        <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            msg.isFromWhistleblower
                              ? 'text-primary-700 dark:text-primary-300'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {msg.isFromWhistleblower ? 'Anonymous Whistleblower' : 'Journalist / Investigator'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.bgColor} ${typeConfig.textColor}`}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {typeConfig.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(msg.createdAt).toLocaleDateString('en-ZA', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Related Leaks */}
      {relatedPosts.length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <ExternalLink className="h-5 w-5 mr-2 text-primary-500" />
              Related Leaks
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Other reports from the same category or organization
            </p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {relatedPosts.map((related) => (
              <Link
                key={related.publicId}
                href={`/leak/${related.publicId}`}
                className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                        {related.category.name}
                      </span>
                      {(related.upvotes > 0 || related.downvotes > 0) && (
                        <span className={`text-xs ${
                          related.upvotes - related.downvotes > 0 ? 'text-green-600 dark:text-green-400' :
                          related.upvotes - related.downvotes < 0 ? 'text-red-600 dark:text-red-400' :
                          'text-gray-500'
                        }`}>
                          {related.upvotes - related.downvotes > 0 ? '+' : ''}{related.upvotes - related.downvotes}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {related.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {related.content.substring(0, 120)}...
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* News Coverage / Impact Section */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Newspaper className="h-5 w-5 mr-2 text-primary-500" />
                News Coverage
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Media coverage of this leak
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCoverageForm(!showCoverageForm)}
              className="flex items-center px-3 py-1.5 text-sm bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900 transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Link
            </button>
          </div>

          {/* Coverage submission form */}
          {showCoverageForm && (
            <form onSubmit={handleSubmitCoverage} className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Article URL *
                  </label>
                  <input
                    type="url"
                    value={coverageForm.url}
                    onChange={(e) => setCoverageForm({ ...coverageForm, url: e.target.value })}
                    required
                    placeholder="https://news.example.com/article"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    value={coverageForm.title}
                    onChange={(e) => setCoverageForm({ ...coverageForm, title: e.target.value })}
                    required
                    placeholder="Enter the article headline"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    News Outlet
                  </label>
                  <input
                    type="text"
                    value={coverageForm.outlet}
                    onChange={(e) => setCoverageForm({ ...coverageForm, outlet: e.target.value })}
                    placeholder="e.g., News24, Daily Maverick"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submittingCoverage}
                    className="flex items-center px-4 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
                  >
                    {submittingCoverage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit for Review'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCoverageForm(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {coverageMessage && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
              {coverageMessage}
            </div>
          )}
        </div>

        {/* Coverage links list */}
        {coverageLinks.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {coverageLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                      {link.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {link.outlet && (
                        <span className="font-medium">{link.outlet}</span>
                      )}
                      {link.publishedAt && (
                        <span>
                          {new Date(link.publishedAt).toLocaleDateString('en-ZA', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
            No news coverage reported yet. Know of an article about this leak? Add it above!
          </div>
        )}
      </div>

      {/* For Journalists - Send Message */}
      <div className="mt-8 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <MessageSquare className="h-8 w-8 text-primary-600 dark:text-primary-400 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-primary-800 dark:text-primary-200 mb-2">
              Want to Contact This Whistleblower?
            </h3>
            <p className="text-sm text-primary-700 dark:text-primary-300 mb-4">
              If you&apos;re a journalist or investigator interested in this case, you can send
              a message through our platform. Your identity remains anonymous, and the
              whistleblower will be able to read and respond.
            </p>
            <Link
              href={`/leak/${post.publicId}/contact`}
              className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Link>
          </div>
        </div>
      </div>

      {/* For Whistleblower - Check Messages & Post Updates */}
      <div className="mt-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <Lock className="h-8 w-8 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Are You the Whistleblower?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              If you submitted this leak, you can check for messages from journalists or post updates using your secret token.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/messages?leakId=${post.publicId}`}
                className="inline-flex items-center px-4 py-2 bg-gray-700 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-500 transition-colors"
              >
                <Lock className="h-4 w-4 mr-2" />
                Check My Messages
              </Link>
              <button
                type="button"
                onClick={() => setShowUpdateForm(!showUpdateForm)}
                className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Post an Update
              </button>
            </div>

            {/* Update Form */}
            {showUpdateForm && (
              <form onSubmit={handleSubmitUpdate} className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary-500" />
                  Add Update to This Leak
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Secret Token *
                    </label>
                    <input
                      type="password"
                      value={updateForm.contactToken}
                      onChange={(e) => setUpdateForm({ ...updateForm, contactToken: e.target.value })}
                      required
                      placeholder="Enter the token you received when submitting"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Update Type *
                    </label>
                    <select
                      value={updateForm.updateType}
                      onChange={(e) => setUpdateForm({ ...updateForm, updateType: e.target.value })}
                      title="Select update type"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="UPDATE">Update - General update</option>
                      <option value="CORRECTION">Correction - Fix previous info</option>
                      <option value="DEVELOPMENT">New Development - New info emerged</option>
                      <option value="RESOLVED">Resolved - Issue has been addressed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Update Title *
                    </label>
                    <input
                      type="text"
                      value={updateForm.title}
                      onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                      required
                      placeholder="Brief title for this update"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Update Content *
                    </label>
                    <textarea
                      value={updateForm.content}
                      onChange={(e) => setUpdateForm({ ...updateForm, content: e.target.value })}
                      required
                      rows={4}
                      placeholder="Describe the update, new information, or development..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submittingUpdate}
                      className="flex items-center px-4 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
                    >
                      {submittingUpdate ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Post Update
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUpdateForm(false)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {updateMessage && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                updateMessage.includes('success')
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
              }`}>
                {updateMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embed Modal */}
      {showEmbedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 print:hidden">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Code className="h-5 w-5 mr-2 text-primary-500" />
                Embed This Leak
              </h3>
              <button
                type="button"
                onClick={() => setShowEmbedModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Copy the code below to embed this leak on your website or news article.
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <code className="text-xs text-gray-800 dark:text-gray-200 break-all">
                {getEmbedCode()}
              </code>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={copyEmbedCode}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                {embedCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </>
                )}
              </button>
              <a
                href={`/embed/${post.publicId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview
              </a>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}
