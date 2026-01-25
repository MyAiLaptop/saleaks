'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { X, Volume2, VolumeX, Play, Pause, Heart, ThumbsUp, Flame, Laugh, Angry, Share2, ShieldAlert, Check } from 'lucide-react'
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
  watermarkedSrc?: string
  poster?: string
  postId: string
  onClose: () => void
  userId?: string
  enableProtection?: boolean
  country?: string
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
  country = 'sa',
}: FullscreenVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [emojiReactions, setEmojiReactions] = useState<EmojiReaction[]>([])
  const [showControls, setShowControls] = useState(true)
  const [showProtectionWarning, setShowProtectionWarning] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showShareCopied, setShowShareCopied] = useState(false)
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

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Clean up old emoji reactions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setEmojiReactions(prev => prev.filter(e => now - e.createdAt < 3000))
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // Auto-hide controls after 3 seconds (but not while dragging)
  useEffect(() => {
    if (isDragging) return

    const hideControls = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (!isDragging) {
          setShowControls(false)
        }
      }, 3000)
    }

    hideControls()
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControls, isDragging])

  // Video time update
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(video.currentTime)
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handleDurationChange = () => {
      setDuration(video.duration)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('durationchange', handleDurationChange)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('durationchange', handleDurationChange)
    }
  }, [isDragging])

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
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault()
        togglePlay()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        seekRelative(-10)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        seekRelative(10)
      } else if (e.key === 'm') {
        e.preventDefault()
        toggleMute()
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

  // Seek to specific time
  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, duration))
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [duration])

  // Seek relative to current time
  const seekRelative = useCallback((delta: number) => {
    if (videoRef.current) {
      seekTo(videoRef.current.currentTime + delta)
    }
  }, [seekTo])

  // Handle progress bar click/drag
  const handleProgressBarInteraction = useCallback((clientX: number) => {
    if (!progressBarRef.current || duration === 0) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const newTime = percent * duration
    seekTo(newTime)
  }, [duration, seekTo])

  const handleProgressBarMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(true)
    handleProgressBarInteraction(e.clientX)
  }

  const handleProgressBarTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    setIsDragging(true)
    handleProgressBarInteraction(e.touches[0].clientX)
  }

  // Global mouse/touch move and up handlers for dragging
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      handleProgressBarInteraction(e.clientX)
    }

    const handleTouchMove = (e: TouchEvent) => {
      handleProgressBarInteraction(e.touches[0].clientX)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, handleProgressBarInteraction])

  const handleEmojiClick = (emoji: string) => {
    const reaction: EmojiReaction = {
      id: `emoji-${Date.now()}-${Math.random()}`,
      emoji,
      left: 70 + Math.random() * 25,
      createdAt: Date.now(),
    }
    setEmojiReactions(prev => [...prev, reaction])
  }

  // Share video link (links to spillnova.com)
  const handleShare = async () => {
    const shareUrl = `https://spillnova.com/${country}/post/${postId}`

    try {
      if (navigator.share) {
        // Native share on mobile
        await navigator.share({
          title: 'Check out this video on SpillNova',
          text: 'Watch this video on SpillNova - Real content from real people',
          url: shareUrl,
        })
      } else {
        // Copy to clipboard on desktop
        await navigator.clipboard.writeText(shareUrl)
        setShowShareCopied(true)
        setTimeout(() => setShowShareCopied(false), 2000)
      }
    } catch (error) {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        setShowShareCopied(true)
        setTimeout(() => setShowShareCopied(false), 2000)
      } catch {
        console.error('Failed to share:', error)
      }
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

      {/* Share copied notification */}
      {showShareCopied && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-600/90 text-white rounded-full text-sm font-medium shadow-lg">
            <Check className="h-4 w-4" />
            <span>Link copied to clipboard!</span>
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
        {/* Share button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleShare()
          }}
          className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          title="Share video"
        >
          <Share2 className="h-6 w-6" />
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

      {/* Bottom controls - Progress bar and time */}
      <div className={`absolute bottom-0 left-0 right-0 z-10 transition-all ${
        showControls || isDragging ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Progress bar container */}
        <div className="px-4 pb-2">
          {/* Clickable/draggable progress bar */}
          <div
            ref={progressBarRef}
            className="relative h-10 flex items-center cursor-pointer group"
            onMouseDown={handleProgressBarMouseDown}
            onTouchStart={handleProgressBarTouchStart}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Track background */}
            <div className="absolute left-0 right-0 h-1 bg-white/30 rounded-full group-hover:h-1.5 transition-all">
              {/* Played portion */}
              <div
                className="absolute left-0 top-0 h-full bg-primary-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
              {/* Drag handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 8px)` }}
              />
            </div>
          </div>
        </div>

        {/* Time display and play button */}
        <div className="flex items-center justify-between px-4 pb-6 safe-area-bottom">
          {/* Play/Pause button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 fill-white" />
            )}
          </button>

          {/* Time display */}
          <div className="text-white text-sm font-medium">
            <span>{formatTime(currentTime)}</span>
            <span className="text-white/60 mx-1">/</span>
            <span className="text-white/60">{formatTime(duration)}</span>
          </div>
        </div>
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
