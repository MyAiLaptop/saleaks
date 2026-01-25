'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { X, Volume2, VolumeX, Play, Pause, Heart, ThumbsUp, Flame, Laugh, Angry, Download, ShieldAlert } from 'lucide-react'
import { DynamicWatermark } from './DynamicWatermark'
import { GhostShield } from './GhostShield'
import { useContentProtection, contentProtectionStyles } from '@/hooks/useContentProtection'

interface EmojiReaction {
  id: string
  emoji: string
  left: number
  createdAt: number
}

interface FullscreenVideoPlayerProps {
  src: string
  watermarkedSrc?: string // For downloads
  poster?: string
  postId: string
  onClose: () => void
  userId?: string // For forensic watermarking
  enableProtection?: boolean // Enable content protection features
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
  watermarkedSrc,
  poster,
  postId,
  onClose,
  userId,
  enableProtection = true,
}: FullscreenVideoPlayerProps) {
  // Use watermarked version for downloads, clean version for viewing
  const downloadSrc = watermarkedSrc || src
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [emojiReactions, setEmojiReactions] = useState<EmojiReaction[]>([])
  const [showControls, setShowControls] = useState(true)
  const [showProtectionWarning, setShowProtectionWarning] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Content protection hook
  const { isBlurred, suspiciousCount, protectionStyles } = useContentProtection({
    preventRightClick: enableProtection,
    preventKeyboardShortcuts: enableProtection,
    blurOnHidden: enableProtection,
    onSuspiciousActivity: (activity) => {
      console.log('[ContentProtection] Activity detected:', activity.type)
      setShowProtectionWarning(true)
      setTimeout(() => setShowProtectionWarning(false), 3000)
    },
  })

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
      // Download watermarked version (free download)
      const response = await fetch(downloadSrc)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `spillnova-video-${postId}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback: open in new tab
      window.open(downloadSrc, '_blank')
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onClick={handleContainerClick}
      style={enableProtection ? { ...protectionStyles, ...contentProtectionStyles } : undefined}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        style={enableProtection ? contentProtectionStyles : undefined}
        playsInline
        loop
        muted={isMuted}
        onClick={(e) => {
          e.stopPropagation()
          togglePlay()
        }}
      />

      {/* GhostShield - Compression Destroyer Layer */}
      {enableProtection && (
        <GhostShield
          enabled={true}
          preset="stealth"
          opacity={1}
        />
      )}

      {/* Dynamic Forensic Watermark */}
      {enableProtection && (
        <DynamicWatermark
          contentId={postId}
          userId={userId}
          visible={true}
          opacity={0.35}
          fontSize="sm"
          showSecondary={true}
          showTertiary={false}
        />
      )}

      {/* Protection Warning Banner */}
      {showProtectionWarning && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-pulse">
          <div className="flex items-center gap-2 px-4 py-2 bg-red-600/90 text-white rounded-full text-sm font-medium shadow-lg">
            <ShieldAlert className="h-4 w-4" />
            <span>This content is protected and traceable</span>
          </div>
        </div>
      )}

      {/* Blur overlay when content should be hidden */}
      {isBlurred && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
          <div className="text-center text-white p-6">
            <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <p className="text-lg font-semibold">Content Protected</p>
            <p className="text-sm text-gray-400 mt-2">Return to this tab to continue viewing</p>
          </div>
        </div>
      )}

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
