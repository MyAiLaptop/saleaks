'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Heart,
  Share2,
  MessageCircle,
  MapPin,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  Phone,
  User,
  Tag,
  AlertCircle,
  CheckCircle,
  Car,
  Home,
  Smartphone,
  Sofa,
  Shirt,
  Briefcase,
  Wrench,
  PawPrint,
  Dumbbell,
  Baby,
  Flower,
  Package,
} from 'lucide-react'
import { Flag } from '@/components/Flag'
import { useCountry } from '@/lib/country-context'

interface ListingDetail {
  id: string
  publicId: string
  title: string
  description: string
  price: number
  currency: string
  category: string
  condition: string
  province: string | null
  city: string | null
  sellerName: string | null
  sellerPhoneMasked: string | null
  hasPhone: boolean
  status: string
  viewCount: number
  favoriteCount: number
  messageCount: number
  isFavorited: boolean
  createdAt: string
  images: Array<{ id: string; url: string; order: number }>
}

interface Message {
  id: string
  senderName: string | null
  isSeller: boolean
  content: string
  createdAt: string
}

// Categories config
const CATEGORIES = [
  { id: 'vehicles', label: 'Vehicles', icon: Car },
  { id: 'property', label: 'Property', icon: Home },
  { id: 'electronics', label: 'Electronics', icon: Smartphone },
  { id: 'furniture', label: 'Furniture', icon: Sofa },
  { id: 'clothing', label: 'Clothing', icon: Shirt },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'pets', label: 'Pets', icon: PawPrint },
  { id: 'sports', label: 'Sports', icon: Dumbbell },
  { id: 'kids', label: 'Kids & Baby', icon: Baby },
  { id: 'garden', label: 'Garden', icon: Flower },
  { id: 'other', label: 'Other', icon: Package },
]

const CONDITIONS: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  ZAR: 'R',
  NGN: '₦',
  KES: 'KSh',
  GHS: 'GH₵',
  USD: '$',
  GBP: '£',
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { country, config } = useCountry()
  const listingId = params.listingId as string

  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Favorites
  const [favoriting, setFavoriting] = useState(false)

  // Messages
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  // Device ID
  const [deviceId, setDeviceId] = useState<string | null>(null)

  // Initialize device ID
  useEffect(() => {
    let id = localStorage.getItem('marketplace_device_id')
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 15)
      localStorage.setItem('marketplace_device_id', id)
    }
    setDeviceId(id)
  }, [])

  // Fetch listing
  const fetchListing = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (deviceId) params.set('deviceId', deviceId)

      const res = await fetch(`/api/marketplace/${listingId}?${params}`)
      const data = await res.json()

      if (data.success) {
        setListing(data.data)
      } else {
        setError(data.error || 'Listing not found')
      }
    } catch {
      setError('Failed to load listing')
    } finally {
      setLoading(false)
    }
  }, [listingId, deviceId])

  useEffect(() => {
    if (deviceId !== null) {
      fetchListing()
    }
  }, [fetchListing, deviceId])

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!deviceId || !listing) return

    setLoadingMessages(true)
    try {
      const params = new URLSearchParams()
      params.set('deviceId', deviceId)

      const res = await fetch(`/api/marketplace/${listing.publicId}/message?${params}`)
      const data = await res.json()

      if (data.success) {
        setMessages(data.data.messages)
      }
    } catch {
      // Ignore
    } finally {
      setLoadingMessages(false)
    }
  }, [listing, deviceId])

  useEffect(() => {
    if (showMessages && listing) {
      fetchMessages()
    }
  }, [showMessages, listing, fetchMessages])

  // Handle favorite toggle
  const handleFavorite = async () => {
    if (!listing || !deviceId || favoriting) return

    setFavoriting(true)
    try {
      const res = await fetch(`/api/marketplace/${listing.publicId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      })
      const data = await res.json()

      if (data.success) {
        setListing(prev => prev ? {
          ...prev,
          isFavorited: data.data.isFavorited,
          favoriteCount: prev.favoriteCount + (data.data.isFavorited ? 1 : -1),
        } : null)
      }
    } catch {
      // Ignore
    } finally {
      setFavoriting(false)
    }
  }

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listing || !deviceId || !newMessage.trim() || sendingMessage) return

    setSendingMessage(true)
    try {
      const res = await fetch(`/api/marketplace/${listing.publicId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          senderDeviceId: deviceId,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setNewMessage('')
        fetchMessages()
      }
    } catch {
      // Ignore
    } finally {
      setSendingMessage(false)
    }
  }

  // Handle share
  const handleShare = async () => {
    if (!listing) return

    const url = window.location.href
    const text = `${listing.title} - ${CURRENCY_SYMBOLS[listing.currency] || 'R'}${listing.price.toLocaleString()}`

    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, text, url })
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
  }

  // Image navigation
  const nextImage = () => {
    if (listing && listing.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.images.length)
    }
  }

  const prevImage = () => {
    if (listing && listing.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length)
    }
  }

  // Format helpers
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getCategoryConfig = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white p-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-xl">{error || 'Listing not found'}</p>
        <Link
          href={`/${country}/marketplace`}
          className="px-4 py-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
        >
          Back to Marketplace
        </Link>
      </div>
    )
  }

  const catConfig = getCategoryConfig(listing.category)
  const CatIcon = catConfig.icon
  const currencySymbol = CURRENCY_SYMBOLS[listing.currency] || 'R'

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFavorite}
              disabled={favoriting}
              className={`p-2 rounded-lg transition-colors ${
                listing.isFavorited
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={listing.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`h-5 w-5 ${listing.isFavorited ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Image Gallery */}
        <div className="relative aspect-square md:aspect-video bg-gray-900">
          {listing.images.length > 0 ? (
            <>
              <Image
                src={listing.images[currentImageIndex].url}
                alt={listing.title}
                fill
                className="object-contain"
              />
              {listing.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {listing.images.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <CatIcon className="h-24 w-24 text-gray-600" />
            </div>
          )}

          {/* Status badge */}
          {listing.status === 'sold' && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <span className="px-6 py-3 bg-red-500 text-white text-2xl font-bold rounded-lg transform -rotate-12">
                SOLD
              </span>
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {listing.images.length > 1 && (
          <div className="flex gap-2 p-2 overflow-x-auto bg-black/50">
            {listing.images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setCurrentImageIndex(idx)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  idx === currentImageIndex ? 'border-green-500' : 'border-transparent'
                }`}
              >
                <Image
                  src={img.url}
                  alt={`${listing.title} ${idx + 1}`}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Price */}
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl font-bold text-white">
              {currencySymbol}{listing.price.toLocaleString()}
            </h2>
            <span className="text-gray-400 text-sm">
              {CONDITIONS[listing.condition] || listing.condition}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-white">
            {listing.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg">
              <CatIcon className="h-4 w-4" />
              {catConfig.label}
            </span>
            {(listing.city || listing.province) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {[listing.city, listing.province].filter(Boolean).join(', ')}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTimeAgo(listing.createdAt)}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {listing.viewCount} views
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {listing.favoriteCount} favorites
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {listing.messageCount} messages
            </span>
          </div>

          {/* Description */}
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-white font-medium mb-2">Description</h3>
            <p className="text-gray-300 whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>

          {/* Seller info */}
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-white font-medium mb-3">Seller</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <User className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">
                  {listing.sellerName || 'Anonymous Seller'}
                </p>
                {listing.sellerPhoneMasked && (
                  <p className="text-gray-400 text-sm flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {listing.sellerPhoneMasked}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact seller button */}
          {listing.status === 'active' && (
            <button
              type="button"
              onClick={() => setShowMessages(true)}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 font-medium shadow-lg"
            >
              <MessageCircle className="h-5 w-5" />
              Contact Seller
            </button>
          )}

          {/* Messages panel */}
          {showMessages && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-end md:items-center justify-center">
              <div className="w-full md:max-w-lg bg-gray-900 rounded-t-2xl md:rounded-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-white font-medium">Messages</h3>
                  <button
                    type="button"
                    onClick={() => setShowMessages(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Messages list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">
                      No messages yet. Start the conversation!
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isSeller ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            msg.isSeller
                              ? 'bg-white/10 text-white'
                              : 'bg-green-500 text-white'
                          }`}
                        >
                          {msg.isSeller && (
                            <p className="text-xs text-gray-400 mb-1">
                              {listing.sellerName || 'Seller'}
                            </p>
                          )}
                          <p>{msg.content}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {formatTimeAgo(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 rounded-xl bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
