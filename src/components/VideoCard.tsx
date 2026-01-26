'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Eye, Clock, DollarSign, Flame, Zap, Award, Play } from 'lucide-react'

interface VideoCardProps {
  publicId: string
  title: string
  thumbnail?: string
  authorName?: string
  authorAvatar?: string
  viewCount?: number
  price?: number
  currency?: string
  badge?: 'exclusive' | 'trending' | 'hot' | 'new' | 'live' | 'high_bid'
  isVideo?: boolean
  aspectRatio?: 'portrait' | 'landscape' | 'square'
  country: string
  createdAt?: string
}

const badgeConfig = {
  exclusive: {
    label: 'Exclusive',
    className: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black',
  },
  trending: {
    label: 'Trending',
    className: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white',
  },
  hot: {
    label: 'Hot',
    className: 'bg-gradient-to-r from-red-500 to-orange-500 text-white',
  },
  new: {
    label: 'New',
    className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
  },
  live: {
    label: 'Live',
    className: 'bg-red-500 text-white animate-pulse',
  },
  high_bid: {
    label: 'High Bid',
    className: 'bg-gradient-to-r from-purple-500 to-violet-500 text-white',
  },
}

export function VideoCard({
  publicId,
  title,
  thumbnail,
  authorName,
  authorAvatar,
  viewCount,
  price,
  currency = 'R',
  badge,
  isVideo = true,
  aspectRatio = 'portrait',
  country,
  createdAt,
}: VideoCardProps) {
  const aspectClass = {
    portrait: 'aspect-[9/16]',
    landscape: 'aspect-video',
    square: 'aspect-square',
  }[aspectRatio]

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K`
    return views.toString()
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString()
  }

  return (
    <Link
      href={`/${country}/live/${publicId}`}
      className="group cursor-pointer block"
    >
      <div className={`relative ${aspectClass} rounded-2xl overflow-hidden bg-ink-800`}>
        {/* Thumbnail */}
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ink-700 to-ink-800 flex items-center justify-center">
            <Play className="h-12 w-12 text-gray-600" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 video-card-gradient opacity-90" />

        {/* Badge */}
        {badge && (
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${badgeConfig[badge].className}`}>
              {badgeConfig[badge].label}
            </span>
            {isVideo && (
              <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/20">
                HD
              </span>
            )}
          </div>
        )}

        {/* Play Button Overlay */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <p className="text-sm font-bold line-clamp-2 leading-tight mb-3">
            {title}
          </p>

          <div className="flex items-center justify-between">
            {/* Author */}
            <div className="flex items-center gap-2">
              {authorAvatar ? (
                <Image
                  src={authorAvatar}
                  alt={authorName || 'Author'}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600" />
              )}
              <span className="text-xs font-medium text-gray-300">
                {authorName || 'Anonymous'}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3">
              {price !== undefined && price > 0 && (
                <div className="flex items-center gap-1 text-emerald-400">
                  <DollarSign className="h-3 w-3" />
                  <span className="text-xs font-bold">{currency}{price}</span>
                </div>
              )}
              {viewCount !== undefined && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span className="text-xs font-bold">{formatViews(viewCount)}</span>
                </div>
              )}
              {createdAt && (
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">{formatTimeAgo(createdAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Masonry Grid Component
interface VideoGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
}

export function VideoGrid({ children, columns = 4 }: VideoGridProps) {
  const colClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[columns]

  return (
    <div className={`grid ${colClass} gap-4`}>
      {children}
    </div>
  )
}
