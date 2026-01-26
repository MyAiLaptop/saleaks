'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Volume2, VolumeX, Play, Pause, Share2, Check, Download, Loader2 } from 'lucide-react'

interface AutoPlayVideoProps {
  src: string
  watermarkedSrc?: string
  className?: string
  poster?: string
  postId?: string
  country?: string
}

export function AutoPlayVideo({ src, watermarkedSrc, className = '', poster, postId, country = 'sa' }: AutoPlayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlayButton, setShowPlayButton] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showShareCopied, setShowShareCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Auto-hide controls
  useEffect(() => {
    if (isDragging || !isPlaying) return

    const hideControls = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (!isDragging && isPlaying) {
          setShowControls(false)
        }
      }, 3000)
    }

    if (showControls) {
      hideControls()
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControls, isDragging, isPlaying])

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

  // Intersection observer for auto-play when visible
  useEffect(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            video.play().then(() => {
              setIsPlaying(true)
              setShowPlayButton(false)
            }).catch(() => {
              setShowPlayButton(true)
            })
          } else {
            video.pause()
            setIsPlaying(false)
          }
        })
      },
      {
        threshold: [0, 0.5, 1],
        rootMargin: '100px 0px',
      }
    )

    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [src])

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(!isMuted)
    }
  }

  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => {
          setIsPlaying(true)
          setShowPlayButton(false)
        }).catch(console.error)
      } else {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
  }, [])

  // Seek to specific time
  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, duration))
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [duration])

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

  // Global mouse/touch handlers for dragging
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

  const handleContainerClick = () => {
    setShowControls(true)
  }

  // Share video link
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!postId) return

    const shareUrl = `https://spillnova.com/${country}/live/${postId}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this video on SpillNova',
          text: 'Watch this video on SpillNova - Real content from real people',
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setShowShareCopied(true)
        setTimeout(() => setShowShareCopied(false), 2000)
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setShowShareCopied(true)
        setTimeout(() => setShowShareCopied(false), 2000)
      } catch {
        // Silent fail
      }
    }
  }

  // Download video
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDownloading) return

    setIsDownloading(true)
    const downloadUrl = watermarkedSrc || src

    try {
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `spillnova-video-${postId || Date.now()}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download failed:', error)
      window.open(downloadUrl, '_blank')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onClick={handleContainerClick}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        playsInline
        muted={isMuted}
        loop
        preload="auto"
        poster={poster}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Gradient overlay for controls visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Share copied notification */}
      {showShareCopied && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-600/90 text-white rounded-full text-xs font-medium shadow-lg">
            <Check className="h-3 w-3" />
            <span>Link copied!</span>
          </div>
        </div>
      )}

      {/* Center play/pause button when paused */}
      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10"
          title="Play"
        >
          <div className="p-4 bg-black/40 rounded-full backdrop-blur-sm">
            <Play className="h-10 w-10 text-white fill-white" />
          </div>
        </button>
      )}

      {/* Bottom controls - Progress bar and time */}
      <div className={`absolute bottom-0 left-0 right-0 z-10 transition-opacity duration-200 ${
        showControls || isDragging || !isPlaying ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Progress bar */}
        <div className="px-3 pb-1">
          <div
            ref={progressBarRef}
            className="relative h-8 flex items-center cursor-pointer group"
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
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>
          </div>
        </div>

        {/* Time and controls row */}
        <div className="flex items-center justify-between px-3 pb-3">
          {/* Left side - Play/Pause and time */}
          <div className="flex items-center gap-2">
            {/* Play/Pause button */}
            <button
              type="button"
              onClick={togglePlay}
              className="p-1 text-white hover:bg-white/10 rounded transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 fill-white" />
              )}
            </button>

            {/* Time display */}
            <div className="text-white text-xs font-medium">
              <span>{formatTime(currentTime)}</span>
              <span className="text-white/60 mx-1">/</span>
              <span className="text-white/60">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right side - Download, Share, Mute */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="p-1.5 text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
              title="Download"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </button>
            {postId && (
              <button
                type="button"
                onClick={handleShare}
                className="p-1.5 text-white hover:bg-white/10 rounded transition-colors"
                title="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 text-white hover:bg-white/10 rounded transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
