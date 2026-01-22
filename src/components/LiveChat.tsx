'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageCircle,
  Send,
  Users,
  RefreshCw,
  AlertCircle,
  Shield,
  BadgeCheck,
  Loader2,
  Radio
} from 'lucide-react'

interface ChatMessage {
  id: string
  displayName: string
  content: string
  messageType: 'CHAT' | 'WHISTLEBLOWER' | 'JOURNALIST' | 'SYSTEM'
  reactions: number
  createdAt: string
}

interface LiveChatProps {
  publicId: string
  contactToken?: string | null
  journalistToken?: string | null
}

const POLL_INTERVAL = 3000 // Poll every 3 seconds

export function LiveChat({ publicId, contactToken, journalistToken }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [activeParticipants, setActiveParticipants] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLive, setIsLive] = useState(true)
  const [lastFetch, setLastFetch] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [autoScroll])

  // Handle scroll to detect if user scrolled up
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      setAutoScroll(isAtBottom)
    }
  }

  // Fetch messages
  const fetchMessages = useCallback(async (since?: string) => {
    try {
      const url = since
        ? `/api/posts/${publicId}/live-chat?since=${encodeURIComponent(since)}`
        : `/api/posts/${publicId}/live-chat`

      const res = await fetch(url)
      const data = await res.json()

      if (data.success) {
        if (since && data.data.messages.length > 0) {
          // Append new messages
          setMessages(prev => [...prev, ...data.data.messages])
        } else if (!since) {
          // Initial load
          setMessages(data.data.messages)
        }
        setActiveParticipants(data.data.activeParticipants)
        setTotalCount(data.data.totalCount)
        setLastFetch(data.data.serverTime)
        setError('')
      }
    } catch {
      setError('Failed to load chat')
    } finally {
      setLoading(false)
    }
  }, [publicId])

  // Initial load
  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Polling for new messages
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      if (lastFetch) {
        fetchMessages(lastFetch)
      }
    }, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [isLive, lastFetch, fetchMessages])

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    setError('')

    try {
      const res = await fetch(`/api/posts/${publicId}/live-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          sessionToken,
          displayName,
          contactToken,
          journalistToken,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setMessages(prev => [...prev, data.data.message])
        setSessionToken(data.data.sessionToken)
        setDisplayName(data.data.displayName)
        setNewMessage('')
        setAutoScroll(true)
      } else {
        setError(data.error || 'Failed to send message')
      }
    } catch {
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Get message style based on type
  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'WHISTLEBLOWER':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500',
          name: 'text-amber-700 dark:text-amber-400 font-semibold',
          icon: <Shield className="h-4 w-4 text-amber-500" />,
        }
      case 'JOURNALIST':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500',
          name: 'text-blue-700 dark:text-blue-400 font-semibold',
          icon: <BadgeCheck className="h-4 w-4 text-blue-500" />,
        }
      case 'SYSTEM':
        return {
          bg: 'bg-gray-100 dark:bg-gray-700',
          name: 'text-gray-500 dark:text-gray-400 italic',
          icon: null,
        }
      default:
        return {
          bg: 'bg-white dark:bg-gray-800',
          name: 'text-gray-700 dark:text-gray-300',
          icon: null,
        }
    }
  }

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span className="font-semibold">Live Discussion</span>
            {isLive && (
              <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                <Radio className="h-3 w-3 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{activeParticipants} active</span>
            </div>
            <button
              type="button"
              onClick={() => setIsLive(!isLive)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                isLive
                  ? 'bg-white/20 hover:bg-white/30'
                  : 'bg-gray-500/50 hover:bg-gray-500/70'
              }`}
              title={isLive ? 'Pause live updates' : 'Resume live updates'}
            >
              {isLive ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <MessageCircle className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Be the first to start the discussion!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const style = getMessageStyle(msg.messageType)
            return (
              <div
                key={msg.id}
                className={`rounded-lg p-3 ${style.bg} transition-all hover:shadow-sm`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {style.icon}
                  <span className={`text-sm ${style.name}`}>{msg.displayName}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && messages.length > 0 && (
        <div className="flex justify-center -mt-8 relative z-10">
          <button
            type="button"
            onClick={() => {
              setAutoScroll(true)
              scrollToBottom()
            }}
            className="bg-primary-500 text-white text-xs px-3 py-1 rounded-full shadow-lg hover:bg-primary-600 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            New messages
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              contactToken
                ? 'Chat as Whistleblower...'
                : journalistToken
                ? 'Chat as Verified Journalist...'
                : 'Join the discussion...'
            }
            maxLength={500}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {displayName ? `Chatting as ${displayName}` : 'Anonymous chat - no login required'}
          </span>
          <span>{newMessage.length}/500</span>
        </div>
      </form>

      {/* Stats footer */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
        <span>{totalCount} total messages</span>
        <span className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Anonymous &amp; secure
        </span>
      </div>
    </div>
  )
}
