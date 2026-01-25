'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Video, Square, Play, Pause, RotateCcw, Check, X, Camera, SwitchCamera, Mic, MicOff } from 'lucide-react'

interface VideoRecorderProps {
  onRecordingComplete: (file: File) => void
  onCancel: () => void
  maxDuration?: number // in seconds
}

export function VideoRecorder({ onRecordingComplete, onCancel, maxDuration = 300 }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [isMuted, setIsMuted] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isCameraReady, setIsCameraReady] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Handle video ready event - camera preview is now visible
  const handleVideoCanPlay = useCallback(() => {
    setIsCameraReady(true)
    setIsInitializing(false)
  }, [])

  // Initialize camera
  const initCamera = useCallback(async () => {
    setIsInitializing(true)
    setIsCameraReady(false)
    setError(null)

    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: !isMuted,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      setHasPermission(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true // Mute preview to avoid feedback
        // Try to play immediately - onCanPlay will fire when ready
        try {
          await videoRef.current.play()
        } catch (playErr) {
          console.error('Video play error:', playErr)
          // Even if play fails, the onCanPlay event should still fire
        }
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
  }, [facingMode, isMuted])

  // Initialize on mount
  useEffect(() => {
    initCamera()

    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reinitialize when facing mode or mute changes
  useEffect(() => {
    if (!isRecording && hasPermission) {
      initCamera()
    }
  }, [facingMode, isMuted]) // eslint-disable-line react-hooks/exhaustive-deps

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current) return

    chunksRef.current = []
    setRecordedBlob(null)
    setRecordedUrl(null)
    setDuration(0)

    const options: MediaRecorderOptions = {
      mimeType: 'video/webm;codecs=vp9,opus',
    }

    // Fallback MIME types
    if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
      options.mimeType = 'video/webm;codecs=vp8,opus'
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
      options.mimeType = 'video/webm'
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
      options.mimeType = 'video/mp4'
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, options)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: options.mimeType })
        setRecordedBlob(blob)
        const url = URL.createObjectURL(blob)
        setRecordedUrl(url)

        // Stop camera preview
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setIsPaused(false)

      // Re-attach stream to video element to fix mobile preview
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current
        videoRef.current.play().catch(() => {})
      }

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration - 1) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      console.error('Recording error:', err)
      setError('Failed to start recording. Your browser may not support video recording.')
    }
  }, [maxDuration])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  // Keyboard shortcut to stop recording (Space or Enter on desktop)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isRecording && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault()
        stopRecording()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isRecording, stopRecording])

  // Detect if on desktop for showing keyboard hint
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768

  // Pause/Resume recording
  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return

    if (isPaused) {
      mediaRecorderRef.current.resume()
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration - 1) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } else {
      mediaRecorderRef.current.pause()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    setIsPaused(!isPaused)
  }, [isPaused, maxDuration, stopRecording])

  // Switch camera
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  // Retake video
  const retake = useCallback(() => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    setRecordedBlob(null)
    setRecordedUrl(null)
    setDuration(0)
    setIsCameraReady(false)
    initCamera()
  }, [recordedUrl, initCamera])

  // Confirm and use recording
  const confirmRecording = useCallback(() => {
    if (recordedBlob) {
      const filename = `recording-${Date.now()}.webm`
      const file = new File([recordedBlob], filename, { type: recordedBlob.type })
      onRecordingComplete(file)
    }
  }, [recordedBlob, onRecordingComplete])

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
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

  // Loading state - show while getting permission OR waiting for camera preview
  if (isInitializing || (!isCameraReady && !recordedUrl && !error)) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">
            {hasPermission === null ? 'Requesting camera access...' : 'Starting camera preview...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-0 md:p-8">
      {/* Desktop: YouTube-style frame / Mobile: Fullscreen */}
      <div className="w-full h-full md:max-w-4xl md:h-auto md:max-h-[90vh] bg-black md:rounded-2xl md:overflow-visible overflow-hidden flex flex-col shadow-2xl">
        {/* Video Preview / Playback */}
        <div className="flex-1 relative min-h-0 md:flex-none md:aspect-video">
          {recordedUrl ? (
            // Playback recorded video
            <video
              src={recordedUrl}
              className="w-full h-full object-contain bg-black"
              controls
              autoPlay
              loop
            />
          ) : (
            // Live camera preview
            <video
              ref={videoRef}
              className="w-full h-full object-cover md:object-contain"
              playsInline
              autoPlay
              muted
              onCanPlay={handleVideoCanPlay}
              onLoadedMetadata={handleVideoCanPlay}
              // @ts-ignore - webkit attribute for iOS
              webkit-playsinline="true"
              x-webkit-airplay="deny"
            />
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full">
                <span className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-white font-medium">{formatDuration(duration)}</span>
                <span className="text-gray-400">/ {formatDuration(maxDuration)}</span>
              </div>
              {/* Desktop keyboard hint */}
              {isDesktop && (
                <div className="bg-black/70 px-3 py-1.5 rounded-full text-xs text-gray-300">
                  Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded mx-1">SPACE</kbd> to stop
                </div>
              )}
            </div>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 w-10 h-10 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Camera controls (only when not recording and no recorded video) */}
          {!isRecording && !recordedUrl && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
              <button
                type="button"
                onClick={switchCamera}
                className="w-10 h-10 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors"
                title="Switch camera"
              >
                <SwitchCamera className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors ${isMuted ? 'bg-red-500/70 hover:bg-red-500/90' : 'bg-black/70 hover:bg-black/90'}`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            </div>
          )}
        </div>

        {/* Controls - always visible */}
        <div className="flex-shrink-0 bg-ink-900 p-4 md:p-6 safe-area-bottom md:rounded-b-2xl">
          {recordedUrl ? (
            // Post-recording controls
            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={retake}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 bg-ink-700 rounded-full flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <span className="text-xs">Retake</span>
              </button>
              <button
                type="button"
                onClick={confirmRecording}
                disabled={!recordedBlob}
                className="flex flex-col items-center gap-1 text-white disabled:opacity-50"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                  <Check className="h-7 w-7 md:h-8 md:w-8" />
                </div>
                <span className="text-xs">Use Video</span>
              </button>
            </div>
          ) : (
            // Recording controls
            <div className="flex items-center justify-center gap-6">
              {isRecording ? (
                <>
                  <button
                    type="button"
                    onClick={togglePause}
                    className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
                    title={isPaused ? 'Resume recording' : 'Pause recording'}
                  >
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-ink-700 rounded-full flex items-center justify-center">
                      {isPaused ? <Play className="h-5 w-5 md:h-6 md:w-6" /> : <Pause className="h-5 w-5 md:h-6 md:w-6" />}
                    </div>
                    <span className="text-xs">{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex flex-col items-center gap-1 text-white"
                    title="Stop recording"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/50 ring-4 ring-red-400/30">
                      <Square className="h-8 w-8 md:h-10 md:w-10 fill-current" />
                    </div>
                    <span className="text-sm font-medium">STOP</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex flex-col items-center gap-1 text-white"
                  title="Start recording"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-red-500 rounded-full hover:bg-red-600 transition-colors" />
                  </div>
                  <span className="text-sm mt-1">Tap to record</span>
                </button>
              )}
            </div>
          )}

          {/* Duration hint */}
          {!isRecording && !recordedUrl && (
            <p className="text-center text-gray-500 text-xs mt-3 md:mt-4">
              Maximum recording: {formatDuration(maxDuration)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
