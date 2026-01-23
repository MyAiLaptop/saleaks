'use client'

import { useRef, useEffect, useState } from 'react'
import { Volume2, VolumeX, Play } from 'lucide-react'

interface AutoPlayVideoProps {
  src: string
  className?: string
  poster?: string
}

export function AutoPlayVideo({ src, className = '', poster }: AutoPlayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlayButton, setShowPlayButton] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    // Create intersection observer for auto-play
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Video is at least 50% visible - play it
            video.play().then(() => {
              setIsPlaying(true)
              setShowPlayButton(false)
            }).catch(() => {
              // Autoplay blocked - show play button
              setShowPlayButton(true)
            })
          } else {
            // Video is not visible enough - pause it
            video.pause()
            setIsPlaying(false)
          }
        })
      },
      {
        threshold: [0, 0.5, 1], // Trigger at 0%, 50%, and 100% visibility
        rootMargin: '100px 0px', // Start loading 100px before visible
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

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true)
        setShowPlayButton(false)
      }).catch(console.error)
    }
  }

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
        setIsPlaying(true)
      } else {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
        muted={isMuted}
        loop
        preload="auto"
        poster={poster}
        onClick={handleVideoClick}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Mute/Unmute button */}
      <button
        type="button"
        onClick={toggleMute}
        className="absolute bottom-3 left-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      {/* Play button overlay (shown when autoplay blocked) */}
      {showPlayButton && !isPlaying && (
        <button
          type="button"
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30"
        >
          <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
            <Play className="h-12 w-12 text-white fill-white" />
          </div>
        </button>
      )}

      {/* Playing indicator */}
      {!isPlaying && !showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="p-3 bg-black/40 rounded-full">
            <Play className="h-8 w-8 text-white/70" />
          </div>
        </div>
      )}
    </div>
  )
}
