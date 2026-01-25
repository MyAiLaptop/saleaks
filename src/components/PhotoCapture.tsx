'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, RotateCcw, Check, X, SwitchCamera, Aperture } from 'lucide-react'

interface PhotoCaptureProps {
  onPhotoCapture: (file: File) => void
  onCancel: () => void
}

export function PhotoCapture({ onPhotoCapture, onCancel }: PhotoCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Initialize camera
  const initCamera = useCallback(async () => {
    setIsInitializing(true)
    setError(null)

    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      setHasPermission(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Try to play immediately
        try {
          await videoRef.current.play()
          // Play succeeded - camera is ready
          setIsInitializing(false)
        } catch (playErr) {
          console.error('Video play error:', playErr)
          // Fallback: mark as ready after short delay
          setTimeout(() => {
            setIsInitializing(false)
          }, 300)
        }
      } else {
        // videoRef not ready yet, retry after a short delay
        setTimeout(() => {
          if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current
            videoRef.current.play().then(() => {
              setIsInitializing(false)
            }).catch(() => {
              setIsInitializing(false)
            })
          }
        }, 100)
      }
    } catch (err) {
      console.error('Camera access error:', err)
      setHasPermission(false)
      setIsInitializing(false)
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera access in your browser settings.')
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera and try again.')
        } else if (err.name === 'NotReadableError') {
          setError('Camera is in use by another application.')
        } else {
          setError(`Camera error: ${err.message}`)
        }
      } else {
        setError('Failed to access camera. Please try again.')
      }
    }
  }, [facingMode])

  // Initialize on mount
  useEffect(() => {
    initCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reinitialize when facing mode changes
  useEffect(() => {
    if (!capturedImage && hasPermission) {
      initCamera()
    }
  }, [facingMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) {
      setIsCapturing(false)
      return
    }

    // Set canvas size to video size
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Add timestamp watermark for authenticity
    const now = new Date()
    const timestamp = now.toLocaleString('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    context.font = '14px monospace'
    context.fillStyle = 'rgba(255, 255, 255, 0.7)'
    context.strokeStyle = 'rgba(0, 0, 0, 0.5)'
    context.lineWidth = 2
    const text = `Captured: ${timestamp}`
    const textWidth = context.measureText(text).width
    context.strokeText(text, canvas.width - textWidth - 10, canvas.height - 10)
    context.fillText(text, canvas.width - textWidth - 10, canvas.height - 10)

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob)
          const url = URL.createObjectURL(blob)
          setCapturedImage(url)

          // Stop camera preview
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
          }
        }
        setIsCapturing(false)
      },
      'image/jpeg',
      0.9
    )
  }, [])

  // Switch camera
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }, [])

  // Retake photo
  const retake = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
    }
    setCapturedImage(null)
    setCapturedBlob(null)
    initCamera()
  }, [capturedImage, initCamera])

  // Confirm and use photo
  const confirmPhoto = useCallback(() => {
    if (capturedBlob) {
      const filename = `photo-${Date.now()}.jpg`
      const file = new File([capturedBlob], filename, { type: 'image/jpeg' })
      onPhotoCapture(file)
    }
  }, [capturedBlob, onPhotoCapture])

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
        <div className="bg-ink-800 rounded-2xl p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Camera Error</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={initCamera}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-ink-700 text-white rounded-lg hover:bg-ink-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Photo Preview / Camera */}
      <div className="flex-1 relative">
        {capturedImage ? (
          // Show captured photo
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-contain"
          />
        ) : (
          // Live camera preview - always rendered so ref is available
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            autoPlay
            muted
            // @ts-ignore - webkit attribute for iOS
            webkit-playsinline="true"
            x-webkit-airplay="deny"
          />
        )}

        {/* Loading overlay - shown on top of video while initializing */}
        {isInitializing && !capturedImage && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white">
                {hasPermission === null ? 'Requesting camera access...' : 'Starting camera preview...'}
              </p>
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Camera controls (only when not captured and not initializing) */}
        {!capturedImage && !isInitializing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <button
              onClick={switchCamera}
              className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              title="Switch camera"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Capture flash effect */}
        {isCapturing && (
          <div className="absolute inset-0 bg-white animate-pulse" />
        )}
      </div>

      {/* Controls */}
      <div className="bg-ink-900 p-6 safe-area-bottom">
        {capturedImage ? (
          // Post-capture controls
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={retake}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
            >
              <div className="w-14 h-14 bg-ink-700 rounded-full flex items-center justify-center">
                <RotateCcw className="h-6 w-6" />
              </div>
              <span className="text-xs">Retake</span>
            </button>
            <button
              type="button"
              onClick={confirmPhoto}
              disabled={!capturedBlob}
              className="flex flex-col items-center gap-1 text-white disabled:opacity-50"
            >
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Check className="h-8 w-8" />
              </div>
              <span className="text-xs">Use Photo</span>
            </button>
          </div>
        ) : (
          // Capture controls
          <div className="flex items-center justify-center">
            <button
              onClick={capturePhoto}
              disabled={isCapturing || isInitializing}
              className="flex flex-col items-center gap-1 text-white disabled:opacity-50"
            >
              <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
                <div className="w-14 h-14 bg-white rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center">
                  <Aperture className="h-8 w-8 text-black" />
                </div>
              </div>
              <span className="text-sm mt-1">Tap to capture</span>
            </button>
          </div>
        )}

        {/* Authenticity notice */}
        {!capturedImage && (
          <p className="text-center text-gray-500 text-xs mt-4">
            Photos are timestamped for authenticity
          </p>
        )}
      </div>
    </div>
  )
}
