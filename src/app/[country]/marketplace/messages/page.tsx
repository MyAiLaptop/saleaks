'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  MessageCircle,
  Loader2,
  Clock,
  Package,
} from 'lucide-react'
import { useCountry } from '@/lib/country-context'

interface MessageThread {
  threadId: string
  listingId: string
  listingPublicId: string
  listingTitle: string
  listingImage: string | null
  otherPartyName: string | null
  isSeller: boolean
  lastMessage: {
    content: string
    createdAt: string
    isSeller: boolean
  }
  unreadCount: number
}

export default function MessagesPage() {
  const { country } = useCountry()

  const [threads, setThreads] = useState<MessageThread[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [totalUnread, setTotalUnread] = useState(0)

  // Initialize device ID
  useEffect(() => {
    let id = localStorage.getItem('marketplace_device_id')
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 15)
      localStorage.setItem('marketplace_device_id', id)
    }
    setDeviceId(id)
  }, [])

  // Fetch message threads
  const fetchThreads = useCallback(async () => {
    if (!deviceId) return

    try {
      const params = new URLSearchParams()
      params.set('deviceId', deviceId)

      const res = await fetch(`/api/marketplace/messages?${params}`)
      const data = await res.json()

      if (data.success) {
        setThreads(data.data.threads)
        setTotalUnread(data.data.totalUnread)
      } else {
        setError(data.error || 'Failed to load messages')
      }
    } catch {
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [deviceId])

  useEffect(() => {
    if (deviceId) {
      fetchThreads()
    }
  }, [deviceId, fetchThreads])

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

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href={`/${country}/marketplace`}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-400" />
              Messages
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {totalUnread}
                </span>
              )}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl">
            <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No messages yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Messages from buyers and sellers will appear here
            </p>
            <Link
              href={`/${country}/marketplace`}
              className="inline-block mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <Link
                key={thread.threadId}
                href={`/${country}/marketplace/${thread.listingPublicId}`}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  thread.unreadCount > 0
                    ? 'bg-green-500/10 hover:bg-green-500/20'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {/* Listing image */}
                <div className="w-14 h-14 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                  {thread.listingImage ? (
                    <Image
                      src={thread.listingImage}
                      alt={thread.listingTitle}
                      width={56}
                      height={56}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-white font-medium text-sm truncate">
                      {thread.listingTitle}
                    </p>
                    {thread.unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full flex-shrink-0">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {thread.isSeller ? 'Buyer' : 'Seller'}: {thread.otherPartyName || 'Anonymous'}
                  </p>
                  <p className="text-gray-300 text-sm truncate mt-1">
                    {thread.lastMessage.isSeller ? '' : 'You: '}
                    {thread.lastMessage.content}
                  </p>
                </div>

                {/* Time */}
                <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(thread.lastMessage.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
