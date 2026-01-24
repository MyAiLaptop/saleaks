'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  MessageSquare,
  Lock,
  Send,
  Loader2,
  User,
  Shield,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Search,
  HelpCircle,
} from 'lucide-react'
import { useCountry } from '@/lib/country-context'

const MESSAGE_TYPES = [
  { value: 'FACT', label: 'Fact', description: 'Verified information I know to be true', icon: CheckCircle2, color: 'blue' },
  { value: 'OPINION', label: 'Opinion', description: 'My analysis or interpretation', icon: Lightbulb, color: 'purple' },
  { value: 'LEAD', label: 'Lead', description: 'New tip or information to investigate', icon: Search, color: 'orange' },
  { value: 'QUESTION', label: 'Question', description: 'Asking for clarification', icon: HelpCircle, color: 'gray' },
] as const

interface Message {
  id: string
  isFromWhistleblower: boolean
  messageType?: string
  content: string
  read: boolean
  createdAt: string
}

export default function CountryMessagesPage() {
  const { country } = useCountry()
  const searchParams = useSearchParams()
  const [postId, setPostId] = useState('')
  const [token, setToken] = useState('')

  // Pre-fill leak ID from URL if provided
  useEffect(() => {
    const leakId = searchParams.get('leakId')
    if (leakId) {
      setPostId(leakId)
    }
  }, [searchParams])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  // Reply state
  const [replyContent, setReplyContent] = useState('')
  const [replyType, setReplyType] = useState<string>('OPINION')
  const [sending, setSending] = useState(false)

  const handleFetchMessages = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({ postId, token })
      const res = await fetch(`/api/messages?${params}`)
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch messages')
      }

      setMessages(data.data)
      setAuthenticated(true)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid post ID or token'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postPublicId: postId,
          contactToken: token,
          content: replyContent,
          messageType: replyType,
          isFromWhistleblower: true,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to send message')
      }

      // Add to messages list
      setMessages((prev) => [
        ...prev,
        {
          id: data.data.id,
          isFromWhistleblower: true,
          messageType: replyType,
          content: replyContent,
          read: true,
          createdAt: data.data.createdAt,
        },
      ])
      setReplyContent('')
      setReplyType('OPINION')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reply'
      setError(errorMessage)
    } finally {
      setSending(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!authenticated) {
    return (
      <div
        className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png?v=2')" }}
      >
        <div className="bg-black/60 min-h-screen">
          <div className="max-w-xl mx-auto px-4 py-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-500/20 border border-primary-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-primary-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Check Your Messages
              </h1>
              <p className="text-gray-300">
                Enter your leak ID and secret token to view encrypted messages from journalists.
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/10">
              <form onSubmit={handleFetchMessages} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Leak ID
                  </label>
                  <input
                    type="text"
                    value={postId}
                    onChange={(e) => setPostId(e.target.value)}
                    required
                    placeholder="Enter your leak's public ID"
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Found in the URL of your leak (e.g., spillnova.com/leak/<strong className="text-gray-300">abc123xyz</strong>)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Secret Token
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    placeholder="Enter your secret token"
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    The 32-character token you received when submitting your leak
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Decrypting...
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5 mr-2" />
                      Access Messages
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400 mb-2">
                Don&apos;t have a leak yet?
              </p>
              <Link
                href={`/${country}/submit`}
                className="inline-flex items-center text-primary-400 hover:text-primary-300"
              >
                Submit a leak anonymously
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png?v=2')" }}
    >
      <div className="bg-black/60 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-6 w-6 text-primary-500" />
              <h1 className="text-2xl font-bold text-white">
                Your Messages
              </h1>
            </div>
            <Link
              href={`/leak/${postId}`}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              View Your Leak
            </Link>
          </div>

          {/* Messages List */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden mb-6 border border-white/10">
            {messages.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">
                  No messages yet. Journalists will be able to contact you through this leak.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 ${
                      msg.isFromWhistleblower
                        ? 'bg-primary-500/10'
                        : 'bg-transparent'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.isFromWhistleblower
                            ? 'bg-primary-500/20 border border-primary-500/30'
                            : 'bg-white/10 border border-white/20'
                        }`}
                      >
                        {msg.isFromWhistleblower ? (
                          <Shield className="h-4 w-4 text-primary-400" />
                        ) : (
                          <User className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">
                            {msg.isFromWhistleblower ? 'You' : 'Journalist/Investigator'}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-300 whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reply Form */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">
              Send a Reply
            </h2>
            <form onSubmit={handleSendReply}>
              {/* Message Type Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type of reply
                </label>
                <div className="flex flex-wrap gap-2">
                  {MESSAGE_TYPES.map((type) => {
                    const Icon = type.icon
                    const isSelected = replyType === type.value
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setReplyType(type.value)}
                        className={`flex items-center px-3 py-1.5 rounded-full text-sm transition-all ${
                          isSelected
                            ? type.color === 'blue' ? 'bg-blue-500/20 text-blue-300 ring-2 ring-blue-500' :
                              type.color === 'purple' ? 'bg-purple-500/20 text-purple-300 ring-2 ring-purple-500' :
                              type.color === 'orange' ? 'bg-orange-500/20 text-orange-300 ring-2 ring-orange-500' :
                              'bg-white/10 text-gray-300 ring-2 ring-gray-500'
                            : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-1.5" />
                        {type.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={4}
                maxLength={10000}
                placeholder="Type your reply..."
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
              />
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm mb-4">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={sending || !replyContent.trim()}
                className="flex items-center px-6 py-2 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Logout */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setAuthenticated(false)
                setMessages([])
                setPostId('')
                setToken('')
              }}
              className="text-sm text-gray-400 hover:text-gray-300"
            >
              Check a different leak
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
