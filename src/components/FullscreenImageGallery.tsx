'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ShieldAlert } from 'lucide-react'
import { DynamicWatermark } from './DynamicWatermark'
import { GhostShield } from './GhostShield'
import { useContentProtection, contentProtectionStyles } from '@/hooks/useContentProtection'

interface GalleryImage {
  id: string
  src: string
  watermarkedSrc?: string // For downloads
  alt: string
}

interface FullscreenImageGalleryProps {
  images: GalleryImage[]
  initialIndex: number
  onClose: () => void
  contentId?: string // For forensic watermarking
  userId?: string // For forensic watermarking
  enableProtection?: boolean // Enable content protection features
}

export function FullscreenImageGallery({
  images,
  initialIndex,
  onClose,
  contentId,
  userId,
  enableProtection = true,
}: FullscreenImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchDelta, setTouchDelta] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const [verticalDelta, setVerticalDelta] = useState(0)
  const [showProtectionWarning, setShowProtectionWarning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Content protection hook
  const { isBlurred, protectionStyles } = useContentProtection({
    preventRightClick: enableProtection,
    preventKeyboardShortcuts: enableProtection,
    blurOnHidden: enableProtection,
    onSuspiciousActivity: (activity) => {
      console.log('[ContentProtection] Activity detected:', activity.type)
      setShowProtectionWarning(true)
      setTimeout(() => setShowProtectionWarning(false), 3000)
    },
  })

  const currentImage = images[currentIndex]
  const hasNext = currentIndex < images.length - 1
  const hasPrev = currentIndex > 0

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        setCurrentIndex(prev => prev - 1)
      } else if (e.key === 'ArrowRight' && hasNext) {
        setCurrentIndex(prev => prev + 1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, hasNext, hasPrev])

  // Prevent body scroll when gallery is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const goToNext = useCallback(() => {
    if (hasNext) {
      setCurrentIndex(prev => prev + 1)
      setTouchDelta(0)
    } else {
      // On last image, close and continue scrolling
      onClose()
    }
  }, [hasNext, onClose])

  const goToPrev = useCallback(() => {
    if (hasPrev) {
      setCurrentIndex(prev => prev - 1)
      setTouchDelta(0)
    }
  }, [hasPrev])

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isZoomed) return

    const deltaX = e.touches[0].clientX - touchStart.x
    const deltaY = e.touches[0].clientY - touchStart.y

    // Determine if this is a horizontal or vertical swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe - navigate between images
      setTouchDelta(deltaX)
      setVerticalDelta(0)
    } else {
      // Vertical swipe - close gallery
      setVerticalDelta(deltaY)
      setTouchDelta(0)
    }
  }

  const handleTouchEnd = () => {
    if (!touchStart || isZoomed) {
      setTouchStart(null)
      return
    }

    const threshold = 80

    // Handle horizontal swipe
    if (Math.abs(touchDelta) > threshold) {
      if (touchDelta > 0) {
        goToPrev()
      } else {
        goToNext()
      }
    }

    // Handle vertical swipe down to close
    if (verticalDelta > threshold) {
      setIsClosing(true)
      setTimeout(onClose, 200)
    }

    setTouchDelta(0)
    setVerticalDelta(0)
    setTouchStart(null)
  }

  const toggleZoom = () => {
    setIsZoomed(!isZoomed)
  }

  const handleDownload = async () => {
    // Download watermarked version (free download)
    const downloadSrc = currentImage.watermarkedSrc || currentImage.src
    try {
      const response = await fetch(downloadSrc)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = currentImage.alt || `spillnova-image-${currentIndex + 1}.jpg`
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

  // Calculate transform based on swipe
  const getTransform = () => {
    if (isClosing) {
      return 'translateY(100%)'
    }
    if (verticalDelta > 0) {
      return `translateY(${verticalDelta}px)`
    }
    return `translateX(${touchDelta}px)`
  }

  const getOpacity = () => {
    if (verticalDelta > 0) {
      return Math.max(0.3, 1 - verticalDelta / 300)
    }
    return 1
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      style={{
        opacity: getOpacity(),
        ...(enableProtection ? { ...protectionStyles, ...contentProtectionStyles } : {}),
      }}
    >
      {/* GhostShield - Compression Destroyer Layer */}
      {enableProtection && (
        <GhostShield
          enabled={true}
          preset="stealth"
          opacity={1}
        />
      )}

      {/* Dynamic Forensic Watermark */}
      {enableProtection && contentId && (
        <DynamicWatermark
          contentId={contentId}
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

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <button
          type="button"
          onClick={onClose}
          className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          title="Close"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Image counter */}
        <div className="px-3 py-1 bg-black/50 rounded-full text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            title="Download image"
          >
            <Download className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={toggleZoom}
            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            title={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            {isZoomed ? <ZoomOut className="h-6 w-6" /> : <ZoomIn className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Main image area */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-200"
          style={{
            transform: getTransform(),
            transitionDuration: touchStart ? '0ms' : '200ms',
          }}
        >
          <img
            src={currentImage.src}
            alt={currentImage.alt}
            className={`max-w-full max-h-full object-contain transition-transform duration-200 ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            style={enableProtection ? contentProtectionStyles : undefined}
            onClick={toggleZoom}
            draggable={false}
          />
        </div>
      </div>

      {/* Navigation arrows (desktop) */}
      {hasPrev && (
        <button
          type="button"
          onClick={goToPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors hidden sm:block"
          title="Previous image"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors hidden sm:block"
          title="Next image"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Thumbnail strip at bottom */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex justify-center gap-2 overflow-x-auto py-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={image.src}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Swipe hint */}
          <p className="text-center text-white/60 text-xs mt-2 sm:hidden">
            Swipe left/right to navigate • Swipe down to close
          </p>
        </div>
      )}

      {/* Single image swipe hint */}
      {images.length === 1 && (
        <div className="absolute bottom-4 left-0 right-0">
          <p className="text-center text-white/60 text-xs sm:hidden">
            Swipe down to close • Tap to zoom
          </p>
        </div>
      )}
    </div>
  )
}
