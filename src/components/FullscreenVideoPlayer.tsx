'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { X, Volume2, VolumeX, Play, Pause, Send, Heart, ThumbsUp, Flame, Laugh, Angry, Download } from 'lucide-react'

interface Comment {
  id?: string
  displayName: string
  content: string
  createdAt: string
}

interface FloatingComment {
  id: string
  displayName: string
  content: string
  top: number // Starting position (percentage from bottom)
  opacity: number
  createdAt: number
}

interface EmojiReaction {
  id: string
  emoji: string
  left: number
  createdAt: number
}

interface FullscreenVideoPlayerProps {
  src: string
  poster?: string
  postId: string
  comments: Comment[]
  onClose: () => void
  onAddComment: (content: string) => Promise<void>
}

const EMOJI_OPTIONS = [
  { emoji: '❤️', icon: Heart, color: 'text-red-500' },
  { emoji: '👍', icon: ThumbsUp, color: 'text-blue-500' },
  { emoji: '🔥', icon: Flame, color: 'text-orange-500' },
  { emoji: '😂', icon: Laugh, color: 'text-yellow-500' },
  { emoji: '😠', icon: Angry, color: 'text-red-600' },
]

export function FullscreenVideoPlayer({
  src,
  poster,
  postId,
  comments,
  onClose,
  onAddComment,
}: FullscreenVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const commentInputRef = useRef<HTMLInputElement>(null)

  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [floatingComments, setFloatingComments] = useState<FloatingComment[]>([])
  const [emojiReactions, setEmojiReactions] = useState<EmojiReaction[]>([])
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize floating comments from existing comments
  useEffect(() => {
    // Show last 5 comments as floating initially
    const recentComments = comments.slice(-5)
    const initial: FloatingComment[] = recentComments.map((c, i) => ({
      id: c.id || `comment-${i}-${Date.now()}`,
      displayName: c.displayName,
      content: c.content,
      top: 20 + (i * 12), // Stagger from bottom
      opacity: 1,
      createdAt: Date.now() - (5 - i) * 1000,
    }))
    setFloatingComments(initial)
  }, [comments])

  // Animate floating comments upward and fade out
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingComments(prev => {
        const now = Date.now()
        return prev
          .map(c => ({
            ...c,
            top: c.top + 0.5, // Move up
            opacity: Math.max(0, 1 - (now - c.createdAt) / 8000), // Fade over 8 seconds
          }))
          .filter(c => c.opacity > 0 && c.top < 90) // Remove when faded or off screen
      })
    }, 50)

    return () => clearInterval(interval)
  }, [])

  // Clean up old emoji reactions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setEmojiReactions(prev => prev.filter(e => now - e.createdAt < 3000))
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    const hideControls = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    hideControls()
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControls])

  // Play video on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        setIsPlaying(false)
      })
    }
  }, [])

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleContainerClick = () => {
    setShowControls(true)
  }

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
        setIsPlaying(true)
      } else {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
  }, [])

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onAddComment(newComment.trim())

      // Add to floating comments immediately
      const floatingComment: FloatingComment = {
        id: `temp-${Date.now()}`,
        displayName: 'You',
        content: newComment.trim(),
        top: 15,
        opacity: 1,
        createdAt: Date.now(),
      }
      setFloatingComments(prev => [...prev, floatingComment])
      setNewComment('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmojiClick = (emoji: string) => {
    // Add floating emoji reaction
    const reaction: EmojiReaction = {
      id: `emoji-${Date.now()}-${Math.random()}`,
      emoji,
      left: 70 + Math.random() * 25, // Random position on right side
      createdAt: Date.now(),
    }
    setEmojiReactions(prev => [...prev, reaction])
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `saleaks-video-${postId}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback: open in new tab
      window.open(src, '_blank')
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onClick={handleContainerClick}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        loop
        muted={isMuted}
        onClick={(e) => {
          e.stopPropagation()
          togglePlay()
        }}
      />

      {/* Gradient overlays for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

      {/* Close button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className={`absolute top-4 left-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-all z-10 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        title="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Play/Pause indicator (center) */}
      {!isPlaying && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
          className="absolute inset-0 flex items-center justify-center"
          title="Play"
        >
          <div className="p-6 bg-white/20 rounded-full backdrop-blur-sm">
            <Play className="h-16 w-16 text-white fill-white" />
          </div>
        </button>
      )}

      {/* Top right controls */}
      <div className={`absolute top-4 right-4 flex items-center gap-2 z-10 ${
        showControls ? 'opacity-100' : 'opacity-0'
      } transition-all`}>
        {/* Download button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleDownload()
          }}
          className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          title="Download video"
        >
          <Download className="h-6 w-6" />
        </button>
        {/* Volume control */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggleMute()
          }}
          className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </button>
      </div>

      {/* Floating comments overlay */}
      <div className="absolute left-4 right-24 bottom-32 top-20 overflow-hidden pointer-events-none">
        {floatingComments.map((comment) => (
          <div
            key={comment.id}
            className="absolute left-0 max-w-[70%] transition-all duration-100"
            style={{
              bottom: `${comment.top}%`,
              opacity: comment.opacity,
            }}
          >
            <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
              <span className="text-primary-400 font-semibold text-sm truncate max-w-[80px]">
                {comment.displayName}
              </span>
              <span className="text-white text-sm">{comment.content}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Floating emoji reactions */}
      <div className="absolute right-4 bottom-32 top-20 w-20 overflow-hidden pointer-events-none">
        {emojiReactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute text-4xl animate-float-up"
            style={{
              left: `${reaction.left - 70}%`,
              bottom: '0%',
              animation: 'floatUp 3s ease-out forwards',
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      {/* Emoji reaction buttons (right side) */}
      <div className="absolute right-4 bottom-44 flex flex-col gap-3 z-10">
        {EMOJI_OPTIONS.map(({ emoji, icon: Icon, color }) => (
          <button
            key={emoji}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleEmojiClick(emoji)
            }}
            className="p-3 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-all hover:scale-110 active:scale-95"
            title={`React with ${emoji}`}
          >
            <span className="text-2xl">{emoji}</span>
          </button>
        ))}
      </div>

      {/* Comment input (bottom) */}
      <form
        onSubmit={handleSubmitComment}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
      >
        <div className="flex gap-2 items-center max-w-lg mx-auto">
          <input
            ref={commentInputRef}
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            maxLength={200}
            className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="p-3 bg-primary-500 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors"
            title="Send comment"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>

      {/* CSS for floating animation */}
      <style jsx global>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-400px) scale(1.5);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: floatUp 3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
