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

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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
        // Ensure video plays with a small delay for DOM to settle
        setTimeout(async () => {
          try {
            if (videoRef.current) {
              await videoRef.current.play()
            }
          } catch (playErr) {
            console.error('Video play error:', playErr)
          }
        }, 100)
      }
    } catch (err) {
      console.error('Camera access error:', err)
      setHasPermission(false)
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
    } finally {
      setIsInitializing(false)
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

  // Loading state
  if (isInitializing) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Initializing camera...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Video Preview / Playback */}
      <div className="flex-1 relative">
        {recordedUrl ? (
          // Playback recorded video
          <video
            src={recordedUrl}
            className="w-full h-full object-contain"
            controls
            autoPlay
            loop
          />
        ) : (
          // Live camera preview
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

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
            <span className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
            <span className="text-white font-medium">{formatDuration(duration)}</span>
            <span className="text-gray-400">/ {formatDuration(maxDuration)}</span>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Camera controls (only when not recording and no recorded video) */}
        {!isRecording && !recordedUrl && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
            <button
              onClick={switchCamera}
              className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              title="Switch camera"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>
            <button
              onClick={toggleMute}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors ${isMuted ? 'bg-red-500/50 hover:bg-red-500/70' : 'bg-black/50 hover:bg-black/70'}`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-ink-900 p-6 safe-area-bottom">
        {recordedUrl ? (
          // Post-recording controls
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
              onClick={confirmRecording}
              disabled={!recordedBlob}
              className="flex flex-col items-center gap-1 text-white disabled:opacity-50"
            >
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Check className="h-8 w-8" />
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
                  onClick={togglePause}
                  className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
                >
                  <div className="w-14 h-14 bg-ink-700 rounded-full flex items-center justify-center">
                    {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                  </div>
                  <span className="text-xs">{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  onClick={stopRecording}
                  className="flex flex-col items-center gap-1 text-white"
                >
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                    <Square className="h-8 w-8 fill-current" />
                  </div>
                  <span className="text-xs">Stop</span>
                </button>
              </>
            ) : (
              <button
                onClick={startRecording}
                className="flex flex-col items-center gap-1 text-white"
              >
                <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
                  <div className="w-14 h-14 bg-red-500 rounded-full hover:bg-red-600 transition-colors" />
                </div>
                <span className="text-sm mt-1">Tap to record</span>
              </button>
            )}
          </div>
        )}

        {/* Duration hint */}
        {!isRecording && !recordedUrl && (
          <p className="text-center text-gray-500 text-xs mt-4">
            Maximum recording: {formatDuration(maxDuration)}
          </p>
        )}
      </div>
    </div>
  )
}
