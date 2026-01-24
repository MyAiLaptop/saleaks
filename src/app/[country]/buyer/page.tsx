'use client'

import { useState, useEffect } from 'react'
import { Loader2, Phone, Building2, Mail, User, Bell, BellOff, LogOut, ShoppingBag, Trophy, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { useCountry } from '@/lib/country-context'
import { Flag } from '@/components/Flag'

interface BuyerAccount {
  id: string
  phoneNumber: string
  organizationName: string | null
  email: string | null
  contactPerson: string | null
  subscriptionTier: string
  subscriptionStatus: string
  notifyOnNewContent: boolean
  notifyOnOutbid: boolean
  totalPurchases: number
  totalSpent: number
  auctionsWon: number
  verified: boolean
}

export default function BuyerDashboardPage() {
  const { country, config } = useCountry()
  const [account, setAccount] = useState<BuyerAccount | null>(null)
  const [checking, setChecking] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devCode, setDevCode] = useState('')

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/buyer/account')
        const data = await res.json()

        if (data.success) {
          setAccount(data.data)
        } else {
          setShowLogin(true)
        }
      } catch {
        setShowLogin(true)
      } finally {
        setChecking(false)
      }
    }

    checkAuth()
  }, [])

  // Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/buyer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, organizationName, email }),
      })
      const data = await res.json()

      if (data.success) {
        setOtpSent(true)
        if (data.data.devCode) {
          setDevCode(data.data.devCode)
        }
      } else {
        setError(data.error || 'Failed to send code')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/buyer/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: otpCode, organizationName, email }),
      })
      const data = await res.json()

      if (data.success) {
        setAccount(data.data)
        setShowLogin(false)
      } else {
        setError(data.error || 'Invalid code')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Logout
  const handleLogout = async () => {
    await fetch('/api/buyer/account', { method: 'DELETE' })
    setAccount(null)
    setShowLogin(true)
    setOtpSent(false)
    setPhoneNumber('')
    setOtpCode('')
  }

  // Toggle notifications
  const toggleNotifications = async (field: 'notifyOnNewContent' | 'notifyOnOutbid') => {
    if (!account) return

    try {
      const res = await fetch('/api/buyer/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !account[field] }),
      })
      const data = await res.json()

      if (data.success) {
        setAccount({ ...account, [field]: !account[field] })
      }
    } catch {
      // Ignore errors
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-900">
      {/* Header */}
      <header className="border-b border-ink-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${country}`} className="text-xl font-bold text-white flex items-center gap-2">
            <Flag countryCode={config.code} size="md" />
            Leak<span className="text-primary-400">point</span>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full ml-2">Buyer</span>
          </Link>
          <Link href={`/${country}/live`} className="text-gray-400 hover:text-white transition-colors">
            Back to Live
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {account ? (
          // Dashboard
          <div className="space-y-6">
            {/* Account Header */}
            <div className="bg-ink-800 rounded-xl p-6 border border-ink-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {account.organizationName || 'Media Buyer'}
                    </h1>
                    <p className="text-gray-400">{account.phoneNumber}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        account.subscriptionTier === 'PRO' ? 'bg-purple-500/20 text-purple-400' :
                        account.subscriptionTier === 'BASIC' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {account.subscriptionTier}
                      </span>
                      {account.verified && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-ink-700 hover:bg-ink-600 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-ink-800 rounded-xl p-4 border border-ink-700 text-center">
                <ShoppingBag className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{account.totalPurchases}</div>
                <div className="text-xs text-gray-400">Purchases</div>
              </div>
              <div className="bg-ink-800 rounded-xl p-4 border border-ink-700 text-center">
                <CreditCard className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">R{(account.totalSpent / 100).toFixed(0)}</div>
                <div className="text-xs text-gray-400">Total Spent</div>
              </div>
              <div className="bg-ink-800 rounded-xl p-4 border border-ink-700 text-center">
                <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{account.auctionsWon}</div>
                <div className="text-xs text-gray-400">Auctions Won</div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-ink-800 rounded-xl p-6 border border-ink-700">
              <h2 className="text-lg font-semibold text-white mb-4">Notification Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {account.notifyOnNewContent ? (
                      <Bell className="h-5 w-5 text-green-400" />
                    ) : (
                      <BellOff className="h-5 w-5 text-gray-500" />
                    )}
                    <div>
                      <div className="text-white font-medium">New Content Alerts</div>
                      <div className="text-sm text-gray-400">Get SMS when new content is available for auction</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleNotifications('notifyOnNewContent')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      account.notifyOnNewContent ? 'bg-green-500' : 'bg-ink-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      account.notifyOnNewContent ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {account.notifyOnOutbid ? (
                      <Bell className="h-5 w-5 text-green-400" />
                    ) : (
                      <BellOff className="h-5 w-5 text-gray-500" />
                    )}
                    <div>
                      <div className="text-white font-medium">Outbid Alerts</div>
                      <div className="text-sm text-gray-400">Get SMS when someone outbids you</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleNotifications('notifyOnOutbid')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      account.notifyOnOutbid ? 'bg-green-500' : 'bg-ink-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      account.notifyOnOutbid ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-ink-800 rounded-xl p-6 border border-ink-700">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href={`/${country}/live`}
                  className="flex items-center gap-3 px-4 py-3 bg-ink-700 hover:bg-ink-600 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-red-400 text-lg">🔴</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">Browse Auctions</div>
                    <div className="text-xs text-gray-400">View live content</div>
                  </div>
                </Link>
                <Link
                  href={`/${country}/browse`}
                  className="flex items-center gap-3 px-4 py-3 bg-ink-700 hover:bg-ink-600 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-blue-400 text-lg">🔍</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">Browse All</div>
                    <div className="text-xs text-gray-400">Search content</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        ) : showLogin ? (
          // Login Form
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-10 w-10 text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Buyer Portal</h1>
              <p className="text-gray-400">
                Sign in to bid on exclusive content and manage your purchases
              </p>
            </div>

            <div className="bg-ink-800 rounded-xl p-6 border border-ink-700">
              {!otpSent ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="081 234 5678"
                        className="w-full pl-10 pr-4 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Organization Name (optional)
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input
                        type="text"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        placeholder="e.g., News24, eNCA"
                        className="w-full pl-10 pr-4 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email (optional)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="newsdesk@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !phoneNumber}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-ink-600 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      'Send Verification Code'
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-gray-400">
                      We sent a code to <span className="text-white">{phoneNumber}</span>
                    </p>
                    {devCode && (
                      <p className="text-yellow-400 text-sm mt-2">
                        Dev code: {devCode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full px-4 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      maxLength={6}
                      required
                    />
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-ink-600 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      'Verify & Sign In'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false)
                      setOtpCode('')
                      setError('')
                    }}
                    className="w-full py-2 text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Use a different number
                  </button>
                </form>
              )}
            </div>

            {/* Info */}
            <div className="mt-6 bg-ink-800/50 rounded-xl p-4 border border-ink-700">
              <h3 className="text-white font-medium mb-2">Why register as a buyer?</h3>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Get SMS alerts when new content goes live</li>
                <li>• Bid on exclusive content rights</li>
                <li>• Track your purchases and downloads</li>
                <li>• Get notified when you're outbid</li>
              </ul>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
