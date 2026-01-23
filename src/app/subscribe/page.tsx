'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Bell, Mail, Check, AlertTriangle, ArrowLeft, Loader2, Shield, CheckCircle, Smartphone } from 'lucide-react'
import { SA_PROVINCES } from '@/lib/sanitize'

interface Category {
  id: string
  name: string
  slug: string
}

export default function SubscribePage() {
  const searchParams = useSearchParams()
  const verifyToken = searchParams.get('token')
  const action = searchParams.get('action')

  const [categories, setCategories] = useState<Category[]>([])
  const [email, setEmail] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [province, setProvince] = useState('')
  const [frequency, setFrequency] = useState('DAILY')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)
  const [unsubscribed, setUnsubscribed] = useState(false)

  // Fetch categories
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data)
      })
      .catch(console.error)
  }, [])

  // Handle verification or unsubscribe from URL
  useEffect(() => {
    if (verifyToken) {
      const url = action === 'unsubscribe'
        ? `/api/subscribe?token=${verifyToken}&action=unsubscribe`
        : `/api/subscribe?token=${verifyToken}`

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (action === 'unsubscribe') {
              setUnsubscribed(true)
            } else {
              setVerified(true)
            }
            setMessage(data.data.message)
          } else {
            setError(data.error || 'Verification failed')
          }
        })
        .catch(() => setError('Failed to verify'))
    }
  }, [verifyToken, action])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setSubmitting(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, categoryId, province, frequency }),
      })
      const data = await res.json()

      if (data.success) {
        setMessage(data.data.message)
        if (!data.data.alreadyVerified) {
          setEmail('')
        }
      } else {
        setError(data.error || 'Subscription failed')
      }
    } catch {
      setError('Failed to subscribe')
    } finally {
      setSubmitting(false)
    }
  }

  // Show verification/unsubscribe result
  if (verifyToken && (verified || unsubscribed || error)) {
    return (
      <div
        className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png')" }}
      >
        <div className="bg-black/60 min-h-screen flex items-center justify-center">
          <div className="max-w-md mx-auto px-4 py-16 text-center">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 ${
              error ? 'bg-red-500/20 border border-red-500/30' : 'bg-green-500/20 border border-green-500/30'
            }`}>
              {error ? (
                <AlertTriangle className="h-8 w-8 text-red-400" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-400" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              {error ? 'Verification Failed' : unsubscribed ? 'Unsubscribed' : 'Email Verified!'}
            </h1>
            <p className="text-gray-300 mb-6">
              {error || message}
            </p>
            <Link
              href="/"
              className="inline-flex items-center text-primary-400 hover:text-primary-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png')" }}
    >
      <div className="bg-black/60 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Link
            href="/"
            className="inline-flex items-center text-gray-300 hover:text-primary-400 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/10">
            <div className="bg-primary-500/30 px-6 py-8 text-white text-center border-b border-white/10">
              <Bell className="h-12 w-12 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Stay Informed</h1>
              <p className="text-gray-300">
                Get anonymous alerts when new leaks are published
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Privacy notice */}
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-300">
                    <p className="font-medium mb-1">Your Privacy is Protected</p>
                    <p className="text-green-400">
                      Your email is encrypted and never shared. You can unsubscribe at any time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category (Optional)
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  title="Filter alerts by category"
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Only receive alerts for leaks in this category
                </p>
              </div>

              {/* Province Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Province (Optional)
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  title="Filter alerts by province"
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white"
                >
                  <option value="">All Provinces</option>
                  {SA_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Only receive alerts for leaks in this province
                </p>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notification Frequency
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'INSTANT', label: 'Instant', desc: 'As they happen' },
                    { value: 'DAILY', label: 'Daily', desc: 'Once per day' },
                    { value: 'WEEKLY', label: 'Weekly', desc: 'Once per week' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFrequency(option.value)}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        frequency === option.value
                          ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                          : 'border-white/20 text-gray-300 hover:border-white/30'
                      }`}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {option.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              {message && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-green-300 text-sm flex items-start gap-2">
                  <Check className="h-5 w-5 flex-shrink-0" />
                  {message}
                </div>
              )}
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !email}
                className="w-full flex items-center justify-center px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    <Bell className="h-5 w-5 mr-2" />
                    Subscribe to Alerts
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-400">
                By subscribing, you agree to receive email notifications about new leaks.
                You can unsubscribe at any time using the link in each email.
              </p>
            </form>

            {/* Push Notifications Section */}
            <div className="border-t border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center border border-primary-500/30">
                    <Smartphone className="h-5 w-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">
                      Push Notifications
                    </h3>
                    <p className="text-sm text-gray-400">
                      Get instant alerts on your device
                    </p>
                  </div>
                </div>
                <Link
                  href="/notifications"
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
                >
                  Configure
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
