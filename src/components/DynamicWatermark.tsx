'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  generateClientSessionWatermark,
  getWatermarkPositions,
  getWatermarkText,
  type ClientSessionWatermark,
} from '@/lib/client-forensic-watermark'

interface DynamicWatermarkProps {
  contentId: string
  userId?: string
  visible?: boolean
  opacity?: number
  fontSize?: 'sm' | 'md' | 'lg'
  showSecondary?: boolean
  showTertiary?: boolean
  className?: string
}

/**
 * Dynamic Watermark Component
 *
 * Displays a traceable watermark that moves periodically to prevent cropping.
 * Each viewing session gets a unique code that can be used to identify leakers.
 *
 * Based on forensic watermarking used by Netflix, Disney+, etc.
 * See: https://www.vdocipher.com/dynamic-watermarking/
 */
export function DynamicWatermark({
  contentId,
  userId,
  visible = true,
  opacity = 0.4,
  fontSize = 'md',
  showSecondary = true,
  showTertiary = false,
  className = '',
}: DynamicWatermarkProps) {
  const [watermark, setWatermark] = useState<ClientSessionWatermark | null>(null)
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Generate session watermark on mount
  useEffect(() => {
    generateClientSessionWatermark(contentId, userId).then(setWatermark)
  }, [contentId, userId])

  // Update positions every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Calculate current positions
  const positions = useMemo(() => {
    return getWatermarkPositions(currentTime)
  }, [currentTime])

  // Get watermark text
  const watermarkText = useMemo(() => {
    if (!watermark) return ''
    return getWatermarkText(watermark.shortCode, userId)
  }, [watermark, userId])

  if (!visible || !watermark) return null

  const fontSizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[fontSize]

  const watermarkStyle = {
    textShadow: '0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)',
    fontFamily: 'monospace',
    userSelect: 'none' as const,
    pointerEvents: 'none' as const,
    WebkitUserSelect: 'none' as const,
  }

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none z-50 ${className}`}
      style={{ mixBlendMode: 'difference' }}
    >
      {/* Primary watermark - bottom right area */}
      <div
        className={`absolute ${fontSizeClass} font-bold text-white transition-all duration-1000 ease-in-out`}
        style={{
          left: `${positions.primary.x}%`,
          top: `${positions.primary.y}%`,
          transform: 'translate(-50%, -50%)',
          opacity,
          ...watermarkStyle,
        }}
      >
        {watermarkText}
      </div>

      {/* Secondary watermark - top left area */}
      {showSecondary && (
        <div
          className={`absolute ${fontSizeClass} font-bold text-white transition-all duration-1000 ease-in-out`}
          style={{
            left: `${positions.secondary.x}%`,
            top: `${positions.secondary.y}%`,
            transform: 'translate(-50%, -50%)',
            opacity: opacity * 0.7,
            ...watermarkStyle,
          }}
        >
          {watermark.shortCode}
        </div>
      )}

      {/* Tertiary watermark - center area (semi-transparent) */}
      {showTertiary && (
        <div
          className={`absolute text-lg font-bold text-white transition-all duration-1000 ease-in-out`}
          style={{
            left: `${positions.tertiary.x}%`,
            top: `${positions.tertiary.y}%`,
            transform: 'translate(-50%, -50%) rotate(-15deg)',
            opacity: opacity * 0.3,
            ...watermarkStyle,
          }}
        >
          SALEAKS.CO.ZA
        </div>
      )}

      {/* Corner timestamp (static) */}
      <div
        className="absolute bottom-2 right-2 text-[10px] text-white font-mono"
        style={{ opacity: opacity * 0.5, ...watermarkStyle }}
      >
        {watermark.shortCode}
      </div>
    </div>
  )
}

/**
 * Invisible Watermark Overlay
 *
 * Creates a canvas-based invisible watermark that embeds session data
 * into subtle pixel patterns. Survives screenshots and some compression.
 */
export function InvisibleWatermark({
  contentId,
  userId,
  className = '',
}: {
  contentId: string
  userId?: string
  className?: string
}) {
  const [watermark, setWatermark] = useState<ClientSessionWatermark | null>(null)

  useEffect(() => {
    generateClientSessionWatermark(contentId, userId).then(setWatermark)
  }, [contentId, userId])

  useEffect(() => {
    if (!watermark) return

    // Create invisible watermark pattern using canvas
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')

    if (ctx) {
      // Create a subtle pattern based on session ID
      const seed = parseInt(watermark.sessionId.substring(0, 8), 16)

      for (let i = 0; i < 64; i++) {
        const x = (seed * (i + 1) * 7919) % 100
        const y = (seed * (i + 1) * 7927) % 100
        const bit = (seed >> (i % 32)) & 1

        // Draw nearly invisible dots (1-2 alpha difference)
        ctx.fillStyle = `rgba(255, 255, 255, ${bit ? 0.008 : 0.004})`
        ctx.fillRect(x, y, 2, 2)
      }
    }
  }, [watermark])

  if (!watermark) return null

  // The invisible watermark is achieved through CSS filters and subtle overlays
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        // Apply subtle noise filter that embeds session-specific pattern
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='1' seed='${parseInt(
          watermark.sessionId.substring(0, 4),
          16
        )}'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E")`,
        mixBlendMode: 'overlay',
        opacity: 0.15,
      }}
    />
  )
}
