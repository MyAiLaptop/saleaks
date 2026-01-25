'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useCountry } from '@/lib/country-context'
import { VideoRecorder } from '@/components/VideoRecorder'
import {
  MessageSquare,
  Eye,
  Clock,
  Video,
  ArrowLeft,
  Play,
  Reply,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'
import { DISCUSSION_CATEGORIES } from '@/lib/categories'
import { nanoid } from 'nanoid'

// Emoji reaction config
const EMOJI_CONFIG = {
  LIKE: { emoji: '👍', label: 'Like' },
  DISLIKE: { emoji: '👎', label: 'Dislike' },
  LAUGH: { emoji: '😂', label: 'Laugh' },
  WOW: { emoji: '😮', label: 'Wow' },
  SAD: { emoji: '😢', label: 'Sad' },
  ANGRY: { emoji: '😡', label: 'Angry' },
} as const

type EmojiType = keyof typeof EMOJI_CONFIG

interface TopicMedia {
  id: string
  thumbnailPath: string | null
  duration: number | null
  path: string
  r2WatermarkedKey: string | null
  storageType: string
}

interface ResponseMedia {
  id: string
  thumbnailPath: string | null
  duration: number | null
  path: string
  r2WatermarkedKey: string | null
  storageType: string
}

interface TopicResponse {
  id: string
  publicId: string
  title: string | null
  description: string | null
  creatorName: string
  reactions: string
  createdAt: string
  media: ResponseMedia | null
  _count: {
    replies: number
  }
}

interface Topic {
  id: string
  publicId: string
  title: string
  description: string
  category: string
  province: string | null
  city: string | null
  creatorName: string
  creatorToken: string
  responseCount: number
  reactions: string
  viewCount: number
  status: string
  createdAt: string
  introVideo: TopicMedia | null
  responses: TopicResponse[]
  _count: {
    responses: number
  }
}

export default function TopicDetailPage({ params }: { params: Promise<{ country: string; topicId: string }> }) {
  const { topicId } = use(params)
  const { country } = useCountry()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRecorder, setShowRecorder] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [isReacting, setIsReacting] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [uploadingResponse, setUploadingResponse] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Get or create session token
  useEffect(() => {
    let token = localStorage.getItem('discussion_session_token')
    let name = localStorage.getItem('discussion_display_name')
    if (!token) {
      token = nanoid(16)
      localStorage.setItem('discussion_session_token', token)
    }
    setSessionToken(token)
    if (name) setDisplayName(name)
  }, [])

  // Fetch topic
  useEffect(() => {
    const fetchTopic = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/discussions/${topicId}`)
        const data = await res.json()
        if (data.success) {
          setTopic(data.data.topic)
        } else {
          setError(data.error || 'Failed to load topic')
        }
      } catch (err) {
        console.error('Error fetching topic:', err)
        setError('Failed to load topic')
      } finally {
        setIsLoading(false)
      }
    }
    fetchTopic()
  }, [topicId])

  // Fetch user's reaction
  useEffect(() => {
    if (!topic) return
    fetch(`/api/discussions/${topic.publicId}/vote`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setUserReaction(data.data.userReaction)
      })
      .catch(() => {})
  }, [topic])

  const handleReact = async (emoji: EmojiType) => {
    if (!topic || isReacting) return
    setIsReacting(true)
    setShowEmojiPicker(false)
    try {
      const res = await fetch(`/api/discussions/${topic.publicId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })
      const data = await res.json()
      if (data.success) {
        setUserReaction(data.data.userReaction)
        setTopic(prev => prev ? {
          ...prev,
          reactions: JSON.stringify(data.data.reactions),
        } : null)
      }
    } catch (err) {
      console.error('Error reacting:', err)
    } finally {
      setIsReacting(false)
    }
  }

  const handleVideoRecorded = async (file: File) => {
    if (!topic || !sessionToken) return
    setShowRecorder(false)
    setUploadingResponse(true)

    try {
      // 1. Create the response
      const createRes = await fetch(`/api/discussions/${topic.publicId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          displayName,
          parentId: replyingTo,
        }),
      })
      const createData = await createRes.json()
      if (!createData.success) {
        alert('Failed to create response')
        return
      }

      const responseId = createData.data.response.publicId

      // Save display name for future use
      if (createData.data.displayName && !displayName) {
        setDisplayName(createData.data.displayName)
        localStorage.setItem('discussion_display_name', createData.data.displayName)
      }

      // 2. Upload the video
      const formData = new FormData()
      formData.append('file', file)
      formData.append('sessionToken', sessionToken)

      const uploadRes = await fetch(`/api/discussions/${topic.publicId}/responses/${responseId}/media`, {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()
      if (!uploadData.success) {
        alert('Failed to upload video')
        return
      }

      // 3. Refresh topic data
      const refreshRes = await fetch(`/api/discussions/${topicId}`)
      const refreshData = await refreshRes.json()
      if (refreshData.success) {
        setTopic(refreshData.data.topic)
      }

      setReplyingTo(null)
    } catch (err) {
      console.error('Error uploading response:', err)
      alert('Failed to upload response')
    } finally {
      setUploadingResponse(false)
    }
  }

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

  const getMediaUrl = (media: TopicMedia | ResponseMedia | null) => {
    if (!media) return null
    if (media.storageType === 'r2' && media.r2WatermarkedKey) {
      return `https://media.saleaks.co.za/${media.r2WatermarkedKey}`
    }
    return media.path
  }

  const parseReactions = (reactionsStr: string): Record<string, number> => {
    try {
      return JSON.parse(reactionsStr || '{}')
    } catch {
      return {}
    }
  }

  const getTotalReactions = (reactionsStr: string): number => {
    const reactions = parseReactions(reactionsStr)
    return Object.values(reactions).reduce((sum, count) => sum + count, 0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !topic) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Topic not found</h2>
          <p className="text-gray-400 mb-4">{error || 'This topic may have been removed'}</p>
          <Link
            href={`/${country}/discussions`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Discussions
          </Link>
        </div>
      </div>
    )
  }

  const categoryInfo = DISCUSSION_CATEGORIES.find(c => c.slug === topic.category)
  const topicReactions = parseReactions(topic.reactions)

  return (
    <div className="min-h-screen bg-ink-900">
      {/* Header */}
      <section className="bg-ink-800 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/${country}/discussions`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Discussions
          </Link>

          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm border border-amber-500/30">
              <MessageSquare className="h-3.5 w-3.5" />
              {categoryInfo?.name || 'Discussion'}
            </span>
            {topic.status === 'CLOSED' && (
              <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">
                Closed
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {topic.title}
          </h1>

          {/* Description */}
          <p className="text-gray-300 mb-4 whitespace-pre-wrap">
            {topic.description}
          </p>

          {/* Intro Video */}
          {topic.introVideo && (
            <div className="mb-4">
              <div className="relative aspect-video bg-ink-700 rounded-xl overflow-hidden max-w-lg">
                {playingVideo === 'intro' ? (
                  <video
                    src={getMediaUrl(topic.introVideo) || ''}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                  />
                ) : (
                  <button
                    onClick={() => setPlayingVideo('intro')}
                    className="w-full h-full flex items-center justify-center group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
                      <Play className="h-8 w-8 text-white fill-white ml-1" />
                    </div>
                    <span className="absolute bottom-3 left-3 text-white text-sm font-medium">
                      Intro Video
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTimeAgo(topic.createdAt)}
            </span>
            <span>by {topic.creatorName}</span>
            {topic.province && <span>from {topic.province}</span>}
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {topic.viewCount} views
            </span>
            <span className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              {topic.responseCount} responses
            </span>
          </div>

          {/* Emoji Reactions */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {/* Show existing reactions */}
            {Object.entries(topicReactions).map(([emojiKey, count]) => {
              const config = EMOJI_CONFIG[emojiKey as EmojiType]
              if (!config || count === 0) return null
              return (
                <button
                  key={emojiKey}
                  onClick={() => handleReact(emojiKey as EmojiType)}
                  disabled={isReacting}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                    userReaction === emojiKey
                      ? 'bg-primary-500/20 border border-primary-500/50'
                      : 'bg-ink-700 hover:bg-ink-600 border border-transparent'
                  }`}
                >
                  <span className="text-lg">{config.emoji}</span>
                  <span className="text-sm text-gray-300">{count}</span>
                </button>
              )
            })}

            {/* Add reaction button */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink-700 hover:bg-ink-600 transition-colors text-gray-400 hover:text-white"
              >
                <span className="text-lg">+</span>
                <span className="text-sm">React</span>
              </button>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-2 p-2 bg-ink-700 rounded-xl border border-white/10 shadow-xl z-10 flex gap-1">
                  {(Object.keys(EMOJI_CONFIG) as EmojiType[]).map(emojiKey => (
                    <button
                      key={emojiKey}
                      onClick={() => handleReact(emojiKey)}
                      disabled={isReacting}
                      className={`p-2 rounded-lg hover:bg-ink-600 transition-colors ${
                        userReaction === emojiKey ? 'bg-primary-500/20' : ''
                      }`}
                      title={EMOJI_CONFIG[emojiKey].label}
                    >
                      <span className="text-2xl">{EMOJI_CONFIG[emojiKey].emoji}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Response Section */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Add Response Button */}
          {topic.status === 'ACTIVE' && (
            <div className="mb-6">
              <button
                onClick={() => { setReplyingTo(null); setShowRecorder(true) }}
                disabled={uploadingResponse}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
              >
                {uploadingResponse ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Video className="h-5 w-5" />
                    Record Video Response
                  </>
                )}
              </button>
              <p className="text-center text-gray-500 text-sm mt-2">
                Camera-captured video only - ensures authentic responses
              </p>
            </div>
          )}

          {/* Responses */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Video className="h-5 w-5 text-primary-400" />
              Video Responses ({topic.responses.length})
            </h2>

            {topic.responses.length === 0 ? (
              <div className="text-center py-8 bg-ink-800 rounded-xl">
                <Video className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No responses yet</p>
                <p className="text-gray-500 text-sm mt-1">Be the first to respond with a video!</p>
              </div>
            ) : (
              topic.responses.map(response => {
                const responseReactions = parseReactions(response.reactions)
                return (
                  <div key={response.id} className="bg-ink-800 rounded-xl p-4 border border-white/5">
                    <div className="flex gap-4">
                      {/* Video Thumbnail */}
                      <div className="flex-shrink-0">
                        {response.media ? (
                          <div className="relative w-32 h-20 bg-ink-700 rounded-lg overflow-hidden">
                            {playingVideo === response.id ? (
                              <video
                                src={getMediaUrl(response.media) || ''}
                                className="w-full h-full object-cover"
                                controls
                                autoPlay
                              />
                            ) : (
                              <button
                                onClick={() => setPlayingVideo(response.id)}
                                className="w-full h-full flex items-center justify-center group"
                              >
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
                                  <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                                </div>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="w-32 h-20 bg-ink-700 rounded-lg flex items-center justify-center">
                            <Video className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* Response Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-white font-medium">{response.creatorName}</span>
                            <span className="text-gray-500 text-sm ml-2">{formatTimeAgo(response.createdAt)}</span>
                          </div>
                        </div>
                        {(response.title || response.description) && (
                          <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                            {response.title || response.description}
                          </p>
                        )}

                        {/* Emoji Reactions for Response */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {Object.entries(responseReactions).map(([emojiKey, count]) => {
                            const config = EMOJI_CONFIG[emojiKey as EmojiType]
                            if (!config || count === 0) return null
                            return (
                              <span
                                key={emojiKey}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-ink-700 text-xs"
                              >
                                <span>{config.emoji}</span>
                                <span className="text-gray-400">{count}</span>
                              </span>
                            )
                          })}
                          {getTotalReactions(response.reactions) === 0 && (
                            <span className="text-gray-500 text-xs">No reactions</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-2">
                          {response._count.replies > 0 && (
                            <button
                              onClick={() => {
                                const newSet = new Set(expandedReplies)
                                if (newSet.has(response.id)) {
                                  newSet.delete(response.id)
                                } else {
                                  newSet.add(response.id)
                                }
                                setExpandedReplies(newSet)
                              }}
                              className="flex items-center gap-1 text-sm text-gray-500 hover:text-white transition-colors"
                            >
                              {expandedReplies.has(response.id) ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                              {response._count.replies} replies
                            </button>
                          )}
                          {topic.status === 'ACTIVE' && (
                            <button
                              onClick={() => { setReplyingTo(response.publicId); setShowRecorder(true) }}
                              className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                            >
                              <Reply className="h-3.5 w-3.5" />
                              Reply
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* Video Recorder Modal */}
      {showRecorder && (
        <VideoRecorder
          onRecordingComplete={handleVideoRecorded}
          onCancel={() => { setShowRecorder(false); setReplyingTo(null) }}
          maxDuration={180}
        />
      )}

      {/* Full Video Modal */}
      {playingVideo && playingVideo !== 'intro' && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPlayingVideo(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPlayingVideo(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
            <video
              src={getMediaUrl(topic.responses.find(r => r.id === playingVideo)?.media || null) || ''}
              className="w-full rounded-lg"
              controls
              autoPlay
            />
          </div>
        </div>
      )}

      {/* Click outside to close emoji picker */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  )
}
