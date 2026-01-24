'use client'

import { useState, useEffect } from 'react'
import { Loader2, Phone, Building2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useCountry } from '@/lib/country-context'
import { Flag } from '@/components/Flag'
import { BuyerDashboard } from '@/components/BuyerDashboard'

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
  creditBalance: number
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

  if (checking) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    )
  }

  // Show Dashboard if logged in
  if (account) {
    return <BuyerDashboard initialAccount={account} onLogout={handleLogout} />
  }

  // Show Login Form
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

      {/* Login Form */}
      <main className="max-w-md mx-auto px-4 py-12">
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
                <p className="text-green-400 text-xs mt-2">
                  Tip: Use 000000 for testing
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
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
            <li className="flex items-center gap-2">
              <span className="text-primary-400">•</span>
              Bid on exclusive content rights
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-400">•</span>
              Get SMS alerts for new auctions
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-400">•</span>
              Track your bids and won auctions
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-400">•</span>
              Get notified when outbid
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
