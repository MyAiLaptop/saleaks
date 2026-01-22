'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Send, Check, AlertTriangle, Loader2, CheckCircle2, Lightbulb, Search, HelpCircle } from 'lucide-react'

const MESSAGE_TYPES = [
  { value: 'FACT', label: 'Fact', description: 'Verified information I know to be true', icon: CheckCircle2, color: 'blue' },
  { value: 'OPINION', label: 'Opinion', description: 'My analysis or interpretation', icon: Lightbulb, color: 'purple' },
  { value: 'LEAD', label: 'Lead', description: 'New tip or information to investigate', icon: Search, color: 'orange' },
  { value: 'QUESTION', label: 'Question', description: 'Asking for clarification', icon: HelpCircle, color: 'gray' },
] as const

export default function ContactPage() {
  const params = useParams<{ publicId: string }>()
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<string>('QUESTION')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postPublicId: params.publicId,
          content: message,
          messageType,
          isFromWhistleblower: false, // This is from a journalist
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to send message')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Message Sent
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your message has been posted publicly. The whistleblower will see it and
            can respond using their secret token. Your identity remains anonymous.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/leak/${params.publicId}`}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Back to Leak
            </Link>
            <button
              onClick={() => {
                setSuccess(false)
                setMessage('')
                setMessageType('QUESTION')
              }}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Send Another Message
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href={`/leak/${params.publicId}`}
        className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-500 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Leak
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Contact Whistleblower
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Send an anonymous message
            </p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700 dark:text-amber-300">
              <p className="font-medium mb-1">For Journalists & Investigators</p>
              <p>
                This message will be publicly visible but your identity remains anonymous.
                Do not include any information that could identify you unless you intend
                to reveal yourself.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Message Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              What type of message is this?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {MESSAGE_TYPES.map((type) => {
                const Icon = type.icon
                const isSelected = messageType === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setMessageType(type.value)}
                    className={`flex items-start p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? type.color === 'blue' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' :
                          type.color === 'purple' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' :
                          type.color === 'orange' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                          'border-gray-500 bg-gray-50 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-2 flex-shrink-0 mt-0.5 ${
                      isSelected
                        ? type.color === 'blue' ? 'text-blue-600' :
                          type.color === 'purple' ? 'text-purple-600' :
                          type.color === 'orange' ? 'text-orange-600' :
                          'text-gray-600'
                        : 'text-gray-400'
                    }`} />
                    <div>
                      <span className={`font-medium ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {type.label}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {type.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={8}
              maxLength={10000}
              placeholder="Introduce yourself (if desired) and explain why you're interested in this case. Ask any questions you have or request additional information..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {message.length}/10000 characters
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full flex items-center justify-center px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Send Message
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
