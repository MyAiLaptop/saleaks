'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * GhostShield - Compression Destroyer System
 *
 * Exploits how video codecs (H.264/H.265) compress video to make screen recordings
 * look terrible while remaining nearly invisible to the human eye.
 *
 * Techniques:
 * 1. Quantum Noise - Random per-pixel noise that compresses poorly
 * 2. DCT Disruptor - 8x8 block patterns that fight the DCT transform
 * 3. Motion Vector Chaos - Rapid micro-movements that break inter-frame prediction
 * 4. Chroma Flicker - Subtle color shifts in YUV space
 * 5. Subliminal Warning - Brief "RECORDING BLOCKED" flashes below perception threshold
 *
 * The key insight: Human eyes average motion over ~50ms (persistence of vision),
 * but video codecs must encode every frame. We exploit this gap.
 */

interface GhostShieldProps {
  enabled?: boolean
  preset?: 'stealth' | 'balanced' | 'aggressive' | 'nuclear'
  opacity?: number // Overall overlay opacity (0-1)
  className?: string
}

interface PresetConfig {
  quantumNoise: { enabled: boolean; intensity: number; updateRate: number }
  dctDisruptor: { enabled: boolean; intensity: number; updateRate: number }
  motionChaos: { enabled: boolean; intensity: number; updateRate: number }
  chromaFlicker: { enabled: boolean; intensity: number; updateRate: number }
  subliminalWarning: { enabled: boolean; frequency: number; duration: number }
}

const PRESETS: Record<string, PresetConfig> = {
  stealth: {
    // Nearly invisible to human eye, but still degrades recordings
    quantumNoise: { enabled: true, intensity: 0.015, updateRate: 33 },
    dctDisruptor: { enabled: true, intensity: 0.02, updateRate: 50 },
    motionChaos: { enabled: false, intensity: 0, updateRate: 0 },
    chromaFlicker: { enabled: true, intensity: 0.01, updateRate: 67 },
    subliminalWarning: { enabled: true, frequency: 8000, duration: 16 }, // 1 frame at 60fps
  },
  balanced: {
    // Good balance of invisibility and disruption
    quantumNoise: { enabled: true, intensity: 0.025, updateRate: 25 },
    dctDisruptor: { enabled: true, intensity: 0.035, updateRate: 33 },
    motionChaos: { enabled: true, intensity: 0.02, updateRate: 50 },
    chromaFlicker: { enabled: true, intensity: 0.02, updateRate: 50 },
    subliminalWarning: { enabled: true, frequency: 5000, duration: 33 }, // 2 frames
  },
  aggressive: {
    // More visible but very effective against recording
    quantumNoise: { enabled: true, intensity: 0.04, updateRate: 16 },
    dctDisruptor: { enabled: true, intensity: 0.05, updateRate: 25 },
    motionChaos: { enabled: true, intensity: 0.035, updateRate: 33 },
    chromaFlicker: { enabled: true, intensity: 0.03, updateRate: 33 },
    subliminalWarning: { enabled: true, frequency: 3000, duration: 50 },
  },
  nuclear: {
    // Maximum disruption - will be slightly visible but destroys recordings
    quantumNoise: { enabled: true, intensity: 0.06, updateRate: 8 },
    dctDisruptor: { enabled: true, intensity: 0.08, updateRate: 16 },
    motionChaos: { enabled: true, intensity: 0.05, updateRate: 16 },
    chromaFlicker: { enabled: true, intensity: 0.05, updateRate: 25 },
    subliminalWarning: { enabled: true, frequency: 2000, duration: 67 },
  },
}

export function GhostShield({
  enabled = true,
  preset = 'stealth',
  opacity = 1,
  className = '',
}: GhostShieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const intervalsRef = useRef<NodeJS.Timeout[]>([])
  const configRef = useRef<PresetConfig>(PRESETS[preset])

  // Update config when preset changes
  useEffect(() => {
    configRef.current = PRESETS[preset] || PRESETS.stealth
  }, [preset])

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 1: QUANTUM NOISE
  // Random per-pixel changes that compress very poorly in H.264/H.265
  // ═══════════════════════════════════════════════════════════════════════════
  const drawQuantumNoise = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number
  ) => {
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      // Random noise with varying alpha for temporal variation
      const noise = (Math.random() - 0.5) * 255 * intensity
      data[i] = 128 + noise     // R
      data[i + 1] = 128 + noise // G
      data[i + 2] = 128 + noise // B
      data[i + 3] = Math.random() * 255 * intensity // Alpha varies per pixel
    }

    ctx.putImageData(imageData, 0, 0)
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 2: DCT DISRUPTOR
  // Creates patterns that interfere with 8x8 DCT blocks used in video compression
  // H.264 processes video in 8x8 (or 16x16) macroblocks - we exploit this
  // ═══════════════════════════════════════════════════════════════════════════
  const drawDCTDisruptor = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number
  ) => {
    const blockSize = 8 // Match H.264 DCT block size
    const time = Date.now() * 0.001

    ctx.clearRect(0, 0, width, height)

    for (let x = 0; x < width; x += blockSize) {
      for (let y = 0; y < height; y += blockSize) {
        // Create phase-shifted patterns within each 8x8 block
        // This creates high-frequency content that DCT can't efficiently compress
        const phase = Math.sin(x * 0.1 + time) * Math.cos(y * 0.1 + time * 1.3)
        const blockIntensity = (phase + 1) * 0.5 * intensity

        // Checkerboard within block (worst case for DCT)
        const isOdd = ((x / blockSize) + (y / blockSize)) % 2 === 0
        const alpha = isOdd ? blockIntensity * 255 : blockIntensity * 128

        ctx.fillStyle = `rgba(128, 128, 128, ${alpha / 255})`
        ctx.fillRect(x, y, blockSize, blockSize)

        // Add diagonal pattern within block (high frequency content)
        if (Math.random() < 0.3) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.5})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + blockSize, y + blockSize)
          ctx.stroke()
        }
      }
    }
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 3: MOTION VECTOR CHAOS
  // Rapid micro-movements that break inter-frame prediction (P-frames, B-frames)
  // Video codecs try to predict motion between frames - we make it unpredictable
  // ═══════════════════════════════════════════════════════════════════════════
  const drawMotionChaos = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number
  ) => {
    const gridSize = 32 // Larger blocks for motion vectors
    const time = Date.now()

    ctx.clearRect(0, 0, width, height)

    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        // Random offset per block that changes every frame
        // This creates "impossible" motion for the codec to predict
        const offsetX = (Math.random() - 0.5) * gridSize * intensity
        const offsetY = (Math.random() - 0.5) * gridSize * intensity

        // Draw a gradient that shifts position
        const gradient = ctx.createLinearGradient(
          x + offsetX, y + offsetY,
          x + gridSize + offsetX, y + gridSize + offsetY
        )
        gradient.addColorStop(0, `rgba(100, 100, 100, ${intensity * 0.3})`)
        gradient.addColorStop(0.5, `rgba(150, 150, 150, ${intensity * 0.2})`)
        gradient.addColorStop(1, `rgba(100, 100, 100, ${intensity * 0.3})`)

        ctx.fillStyle = gradient
        ctx.fillRect(x, y, gridSize, gridSize)
      }
    }
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 4: CHROMA FLICKER
  // Subtle color shifts that exploit YUV color space compression
  // Video codecs compress chroma (color) more than luma (brightness)
  // We create patterns that are hard to compress in YUV space
  // ═══════════════════════════════════════════════════════════════════════════
  const drawChromaFlicker = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number
  ) => {
    const time = Date.now() * 0.01

    ctx.clearRect(0, 0, width, height)

    // Create shifting color overlay
    // Alternating between complementary colors creates chroma artifacts in recording
    const hue1 = (time * 10) % 360
    const hue2 = (hue1 + 180) % 360 // Complementary color

    // Horizontal bands of shifting hue
    const bandHeight = 4
    for (let y = 0; y < height; y += bandHeight * 2) {
      const currentHue = y % (bandHeight * 4) < bandHeight * 2 ? hue1 : hue2
      ctx.fillStyle = `hsla(${currentHue}, 100%, 50%, ${intensity * 0.15})`
      ctx.fillRect(0, y, width, bandHeight)
    }

    // Add some random color spots
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const size = Math.random() * 50 + 10
      const hue = Math.random() * 360

      ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${intensity * 0.1})`
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 5: SUBLIMINAL WARNING
  // Brief flashes of "RECORDING BLOCKED" text (below 50ms perception threshold)
  // Human eye can't see it, but it appears in recordings as random flash frames
  // ═══════════════════════════════════════════════════════════════════════════
  const drawSubliminalWarning = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.clearRect(0, 0, width, height)

    // Semi-transparent red background
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
    ctx.fillRect(0, 0, width, height)

    // Warning text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = `bold ${Math.min(width, height) * 0.08}px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Main warning
    ctx.fillText('RECORDING BLOCKED', width / 2, height / 2 - 30)

    // Secondary text
    ctx.font = `${Math.min(width, height) * 0.04}px Arial, sans-serif`
    ctx.fillText('This content is protected and traceable', width / 2, height / 2 + 30)

    // Diagonal warning stripes
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)'
    ctx.lineWidth = 20
    for (let i = -height; i < width + height; i += 60) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + height, height)
      ctx.stroke()
    }
  }, [])

  // Main animation loop
  useEffect(() => {
    if (!enabled) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // Set canvas size to match container
    const updateSize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }
    updateSize()

    // Create offscreen canvases for each layer
    const createLayer = () => {
      const offscreen = document.createElement('canvas')
      offscreen.width = canvas.width
      offscreen.height = canvas.height
      return offscreen
    }

    const noiseCanvas = createLayer()
    const dctCanvas = createLayer()
    const motionCanvas = createLayer()
    const chromaCanvas = createLayer()
    const warningCanvas = createLayer()

    const noiseCtx = noiseCanvas.getContext('2d')!
    const dctCtx = dctCanvas.getContext('2d')!
    const motionCtx = motionCanvas.getContext('2d')!
    const chromaCtx = chromaCanvas.getContext('2d')!
    const warningCtx = warningCanvas.getContext('2d')!

    let showSubliminal = false

    // Composite all layers
    const composite = () => {
      const config = configRef.current
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Layer 1: Quantum Noise
      if (config.quantumNoise.enabled) {
        ctx.globalAlpha = config.quantumNoise.intensity
        ctx.drawImage(noiseCanvas, 0, 0)
      }

      // Layer 2: DCT Disruptor
      if (config.dctDisruptor.enabled) {
        ctx.globalAlpha = config.dctDisruptor.intensity
        ctx.drawImage(dctCanvas, 0, 0)
      }

      // Layer 3: Motion Chaos
      if (config.motionChaos.enabled) {
        ctx.globalAlpha = config.motionChaos.intensity
        ctx.drawImage(motionCanvas, 0, 0)
      }

      // Layer 4: Chroma Flicker
      if (config.chromaFlicker.enabled) {
        ctx.globalAlpha = config.chromaFlicker.intensity
        ctx.drawImage(chromaCanvas, 0, 0)
      }

      // Layer 5: Subliminal Warning (conditional)
      if (showSubliminal) {
        ctx.globalAlpha = 0.8
        ctx.drawImage(warningCanvas, 0, 0)
      }

      ctx.globalAlpha = 1
      animationFrameRef.current = requestAnimationFrame(composite)
    }

    // Start layer update intervals
    const intervals: NodeJS.Timeout[] = []

    // Quantum Noise updates
    const config = configRef.current
    if (config.quantumNoise.enabled && config.quantumNoise.updateRate > 0) {
      intervals.push(setInterval(() => {
        drawQuantumNoise(noiseCtx, canvas.width, canvas.height, config.quantumNoise.intensity)
      }, config.quantumNoise.updateRate))
    }

    // DCT Disruptor updates
    if (config.dctDisruptor.enabled && config.dctDisruptor.updateRate > 0) {
      intervals.push(setInterval(() => {
        drawDCTDisruptor(dctCtx, canvas.width, canvas.height, config.dctDisruptor.intensity)
      }, config.dctDisruptor.updateRate))
    }

    // Motion Chaos updates
    if (config.motionChaos.enabled && config.motionChaos.updateRate > 0) {
      intervals.push(setInterval(() => {
        drawMotionChaos(motionCtx, canvas.width, canvas.height, config.motionChaos.intensity)
      }, config.motionChaos.updateRate))
    }

    // Chroma Flicker updates
    if (config.chromaFlicker.enabled && config.chromaFlicker.updateRate > 0) {
      intervals.push(setInterval(() => {
        drawChromaFlicker(chromaCtx, canvas.width, canvas.height, config.chromaFlicker.intensity)
      }, config.chromaFlicker.updateRate))
    }

    // Subliminal Warning (brief flashes)
    if (config.subliminalWarning.enabled) {
      // Pre-draw warning
      drawSubliminalWarning(warningCtx, canvas.width, canvas.height)

      intervals.push(setInterval(() => {
        showSubliminal = true
        setTimeout(() => {
          showSubliminal = false
        }, config.subliminalWarning.duration)
      }, config.subliminalWarning.frequency))
    }

    intervalsRef.current = intervals

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      updateSize()
      noiseCanvas.width = canvas.width
      noiseCanvas.height = canvas.height
      dctCanvas.width = canvas.width
      dctCanvas.height = canvas.height
      motionCanvas.width = canvas.width
      motionCanvas.height = canvas.height
      chromaCanvas.width = canvas.width
      chromaCanvas.height = canvas.height
      warningCanvas.width = canvas.width
      warningCanvas.height = canvas.height
      drawSubliminalWarning(warningCtx, canvas.width, canvas.height)
    })

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement)
    }

    // Start compositing
    animationFrameRef.current = requestAnimationFrame(composite)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      intervals.forEach(clearInterval)
      resizeObserver.disconnect()
    }
  }, [enabled, preset, drawQuantumNoise, drawDCTDisruptor, drawMotionChaos, drawChromaFlicker, drawSubliminalWarning])

  if (!enabled) return null

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-30 ${className}`}
      style={{
        opacity,
        mixBlendMode: 'overlay',
      }}
      aria-hidden="true"
    />
  )
}

/**
 * Utility: Get recommended preset based on content sensitivity
 */
export function getRecommendedPreset(sensitivity: 'low' | 'medium' | 'high' | 'critical'): GhostShieldProps['preset'] {
  switch (sensitivity) {
    case 'low': return 'stealth'
    case 'medium': return 'balanced'
    case 'high': return 'aggressive'
    case 'critical': return 'nuclear'
    default: return 'stealth'
  }
}
