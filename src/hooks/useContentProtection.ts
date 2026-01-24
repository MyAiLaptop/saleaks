'use client'

import { useEffect, useCallback, useState, useRef } from 'react'

interface ContentProtectionOptions {
  onSuspiciousActivity?: (activity: SuspiciousActivity) => void
  onVisibilityChange?: (isVisible: boolean) => void
  preventRightClick?: boolean
  preventKeyboardShortcuts?: boolean
  blurOnHidden?: boolean
  trackViewTime?: boolean
  detectScreenCapture?: boolean
  detectPerformanceAnomaly?: boolean
}

interface SuspiciousActivity {
  type: 'keyboard_shortcut' | 'right_click' | 'dev_tools' | 'tab_hidden' | 'window_blur' | 'print_screen' | 'screen_capture' | 'performance_anomaly' | 'pip_detected'
  timestamp: number
  details?: string
}

interface ProtectionState {
  isVisible: boolean
  isBlurred: boolean
  suspiciousCount: number
  viewStartTime: number
  totalViewTime: number
}

/**
 * Content Protection Hook - VIDEO SHIELD IMPLEMENTATION
 *
 * Multi-layer protection system matching Video Shield capabilities:
 *
 * Layer 1: Visibility & Focus Monitoring (Page Visibility API)
 * Layer 2: Right-click context menu blocking
 * Layer 3: Keyboard shortcut detection (PrintScreen, Ctrl+S, etc.)
 * Layer 4: DevTools detection (window size check)
 * Layer 5: Screen Capture API interception (getDisplayMedia)
 * Layer 6: Performance Anomaly Detection (frame timing analysis)
 * Layer 7: Picture-in-Picture detection
 *
 * Note: This cannot PREVENT screen recording, but it:
 * - Deters casual users with warnings
 * - Logs all suspicious activity for forensics
 * - Blurs content when tab is hidden (prevents background recording)
 * - Detects performance anomalies caused by screen recorders
 * - Intercepts browser screen sharing API
 *
 * Research sources:
 * - https://github.com/screen-share/is-screen-captured (proposed API)
 * - https://ninjacapture.com/can-a-site-detect-screen-capture
 * - https://www.vdocipher.com/blog/forensic-watermarking/
 */
export function useContentProtection(options: ContentProtectionOptions = {}) {
  const {
    onSuspiciousActivity,
    onVisibilityChange,
    preventRightClick = true,
    preventKeyboardShortcuts = true,
    blurOnHidden = true,
    trackViewTime = true,
    detectScreenCapture = true,
    detectPerformanceAnomaly = true,
  } = options

  const [state, setState] = useState<ProtectionState>({
    isVisible: true,
    isBlurred: false,
    suspiciousCount: 0,
    viewStartTime: Date.now(),
    totalViewTime: 0,
  })

  const viewTimeRef = useRef<number>(0)
  const hiddenTimeRef = useRef<number | null>(null)
  const frameTimesRef = useRef<number[]>([])
  const lastFrameTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)

  // Log suspicious activity
  const logSuspicious = useCallback(
    (type: SuspiciousActivity['type'], details?: string) => {
      const activity: SuspiciousActivity = {
        type,
        timestamp: Date.now(),
        details,
      }

      setState((prev) => ({
        ...prev,
        suspiciousCount: prev.suspiciousCount + 1,
      }))

      onSuspiciousActivity?.(activity)

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[ContentProtection] Suspicious activity:', activity)
      }
    },
    [onSuspiciousActivity]
  )

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible'

      if (!isVisible) {
        // Tab hidden - log and optionally blur
        logSuspicious('tab_hidden', 'User switched tabs or minimized window')
        hiddenTimeRef.current = Date.now()

        if (blurOnHidden) {
          setState((prev) => ({ ...prev, isVisible: false, isBlurred: true }))
        }
      } else {
        // Tab visible again
        if (hiddenTimeRef.current && trackViewTime) {
          const hiddenDuration = Date.now() - hiddenTimeRef.current
          // If hidden for more than 30 seconds, that's suspicious
          if (hiddenDuration > 30000) {
            logSuspicious('tab_hidden', `Tab hidden for ${Math.round(hiddenDuration / 1000)}s`)
          }
        }
        hiddenTimeRef.current = null

        setState((prev) => ({ ...prev, isVisible: true, isBlurred: false }))
      }

      onVisibilityChange?.(isVisible)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [blurOnHidden, logSuspicious, onVisibilityChange, trackViewTime])

  // Handle window blur (user clicked outside browser)
  useEffect(() => {
    const handleWindowBlur = () => {
      logSuspicious('window_blur', 'Window lost focus - possible screen recording app opened')
    }

    window.addEventListener('blur', handleWindowBlur)
    return () => window.removeEventListener('blur', handleWindowBlur)
  }, [logSuspicious])

  // Prevent right-click
  useEffect(() => {
    if (!preventRightClick) return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      logSuspicious('right_click', 'Right-click blocked')
      return false
    }

    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [preventRightClick, logSuspicious])

  // Detect suspicious keyboard shortcuts
  useEffect(() => {
    if (!preventKeyboardShortcuts) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen') {
        logSuspicious('print_screen', 'PrintScreen key detected')
        // Can't actually prevent the screenshot, but we log it
      }

      // Ctrl/Cmd + P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        logSuspicious('keyboard_shortcut', 'Print shortcut blocked (Ctrl+P)')
      }

      // Ctrl/Cmd + S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        logSuspicious('keyboard_shortcut', 'Save shortcut blocked (Ctrl+S)')
      }

      // Ctrl/Cmd + Shift + S (Screenshot on some systems)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
        e.preventDefault()
        logSuspicious('keyboard_shortcut', 'Screenshot shortcut detected (Ctrl+Shift+S)')
      }

      // Win + Shift + S (Windows Snipping Tool)
      // Note: This is hard to detect as it's system-level

      // F12 or Ctrl+Shift+I (DevTools)
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'i') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I')
      ) {
        logSuspicious('dev_tools', 'DevTools shortcut detected')
        // Don't prevent - let developers debug, just log it
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [preventKeyboardShortcuts, logSuspicious])

  // Detect DevTools opening (via window size check)
  // Note: The timing-based approach is unreliable and can cause TypeScript issues
  useEffect(() => {
    let devToolsOpen = false

    const detectDevTools = () => {
      // Check if window outer dimensions are significantly larger than inner
      // This indicates DevTools is docked to the side or bottom
      const widthThreshold = window.outerWidth - window.innerWidth > 160
      const heightThreshold = window.outerHeight - window.innerHeight > 160

      if ((widthThreshold || heightThreshold) && !devToolsOpen) {
        devToolsOpen = true
        logSuspicious('dev_tools', 'DevTools detected via window size')
      } else if (!widthThreshold && !heightThreshold && devToolsOpen) {
        devToolsOpen = false
      }
    }

    // Check periodically (every 2 seconds)
    const interval = setInterval(detectDevTools, 2000)
    return () => clearInterval(interval)
  }, [logSuspicious])

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER: SCREEN CAPTURE API DETECTION
  // Intercept getDisplayMedia to detect when screen sharing is initiated
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!detectScreenCapture) return

    // Store original function
    const originalGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia

    if (originalGetDisplayMedia) {
      // Override getDisplayMedia to detect screen sharing
      navigator.mediaDevices.getDisplayMedia = async function (...args) {
        logSuspicious('screen_capture', 'Screen sharing/capture initiated via browser API')
        // Still allow it to work, but we've logged it
        return originalGetDisplayMedia.apply(navigator.mediaDevices, args)
      }
    }

    // Detect Picture-in-Picture (potential capture vector)
    const handlePiP = () => {
      if (document.pictureInPictureElement) {
        logSuspicious('pip_detected', 'Picture-in-Picture detected - potential capture vector')
      }
    }

    document.addEventListener('enterpictureinpicture', handlePiP)

    return () => {
      // Restore original function
      if (originalGetDisplayMedia && navigator.mediaDevices) {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia
      }
      document.removeEventListener('enterpictureinpicture', handlePiP)
    }
  }, [detectScreenCapture, logSuspicious])

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER: PERFORMANCE ANOMALY DETECTION
  // Screen recorders cause measurable frame time spikes
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!detectPerformanceAnomaly) return

    let anomalyCount = 0
    const ANOMALY_THRESHOLD = 5 // Number of consecutive anomalies to trigger
    const FRAME_TIME_THRESHOLD = 50 // ms - normal is ~16ms for 60fps
    const VARIANCE_THRESHOLD = 100

    lastFrameTimeRef.current = Date.now()

    const measureFrameTime = () => {
      const now = Date.now()
      const frameTime = now - lastFrameTimeRef.current
      lastFrameTimeRef.current = now

      // Store last 60 frame times
      frameTimesRef.current.push(frameTime)
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift()
      }

      // Need at least 30 samples
      if (frameTimesRef.current.length >= 30) {
        // Calculate average frame time
        const avg = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length

        // Calculate variance
        const variance = frameTimesRef.current.reduce(
          (acc, val) => acc + Math.pow(val - avg, 2),
          0
        ) / frameTimesRef.current.length

        // High average + high variance = likely screen recording
        // Screen recorders cause irregular frame drops
        if (avg > FRAME_TIME_THRESHOLD && variance > VARIANCE_THRESHOLD) {
          anomalyCount++
          if (anomalyCount >= ANOMALY_THRESHOLD) {
            logSuspicious(
              'performance_anomaly',
              `Abnormal frame timing detected (avg: ${avg.toFixed(1)}ms, variance: ${variance.toFixed(1)}) - possible screen recording`
            )
            // Reset counter after logging
            anomalyCount = 0
          }
        } else {
          // Decay anomaly count when performance is normal
          anomalyCount = Math.max(0, anomalyCount - 1)
        }
      }

      animationFrameRef.current = requestAnimationFrame(measureFrameTime)
    }

    animationFrameRef.current = requestAnimationFrame(measureFrameTime)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [detectPerformanceAnomaly, logSuspicious])

  // Track total view time
  useEffect(() => {
    if (!trackViewTime) return

    const interval = setInterval(() => {
      if (state.isVisible) {
        viewTimeRef.current += 1
        setState((prev) => ({
          ...prev,
          totalViewTime: viewTimeRef.current,
        }))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [state.isVisible, trackViewTime])

  // CSS to apply blur when content should be hidden
  const protectionStyles: React.CSSProperties = state.isBlurred
    ? {
        filter: 'blur(20px)',
        transition: 'filter 0.3s ease',
      }
    : {
        filter: 'none',
        transition: 'filter 0.3s ease',
      }

  return {
    isVisible: state.isVisible,
    isBlurred: state.isBlurred,
    suspiciousCount: state.suspiciousCount,
    totalViewTime: state.totalViewTime,
    protectionStyles,
  }
}

/**
 * CSS class names for additional protection
 * Apply these to protected content containers
 */
export const contentProtectionClasses = [
  // Disable text selection
  'select-none',
  // Disable pointer events on children (use sparingly)
  // 'pointer-events-none',
  // Disable dragging
  // Add via style: 'user-drag: none; -webkit-user-drag: none;'
].join(' ')

/**
 * Inline styles for additional protection
 */
export const contentProtectionStyles: React.CSSProperties = {
  // Disable text selection
  userSelect: 'none',
  WebkitUserSelect: 'none',
  // Disable image dragging
  // @ts-expect-error - vendor prefix
  WebkitUserDrag: 'none',
  // Disable touch callout (iOS)
  WebkitTouchCallout: 'none',
}
