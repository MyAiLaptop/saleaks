'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Building2,
  Plus,
  CreditCard,
  Sparkles,
  Check,
  Loader2,
  Eye,
  MousePointer,
  Calendar,
  Phone,
  Lock,
  AlertCircle,
  ChevronRight,
  Edit,
  Trash2,
  Package,
} from 'lucide-react'
import { useCountry } from '@/lib/country-context'

interface BusinessProfile {
  id: string
  publicId: string
  name: string
  description: string | null
  logo: string | null
  phone: string | null
  whatsapp: string | null
  status: string
}

interface VideoAd {
  id: string
  hookQuestion: string
  amountPaid: number
  status: string
  impressions: number
  clicks: number
  expiresAt: string
  createdAt: string
  post: {
    publicId: string
    content: string
    category: string
  }
}

interface AdvertiserData {
  id: string
  phoneNumber: string
  businessName: string | null
  creditBalance: number
  totalSpent: number
  businessProfiles: BusinessProfile[]
}

const AD_PRICING = {
  '1_DAY': { price: 1500, label: '1 Day', days: 1 },
  '3_DAYS': { price: 3500, label: '3 Days', days: 3 },
  '7_DAYS': { price: 7500, label: '7 Days', days: 7 },
  '30_DAYS': { price: 20000, label: '30 Days', days: 30 },
}

const CREDIT_PACKAGES = {
  'STARTER': { credits: 5000, price: 5000, bonus: 0, label: 'Starter' },
  'BASIC': { credits: 12000, price: 10000, bonus: 2000, label: 'Basic' },
  'STANDARD': { credits: 25000, price: 20000, bonus: 5000, label: 'Standard' },
  'PREMIUM': { credits: 65000, price: 50000, bonus: 15000, label: 'Premium' },
}

const R2_PUBLIC_URL = 'https://media.saleaks.co.za'

function getMediaUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return path
  return `${R2_PUBLIC_URL}/${path}`
}

export default function AdvertisePage() {
  const { country } = useCountry()
  const searchParams = useSearchParams()
  const postId = searchParams.get('postId')

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [advertiser, setAdvertiser] = useState<AdvertiserData | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  // UI state
  const [view, setView] = useState<'auth' | 'dashboard' | 'credits' | 'purchase'>('auth')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')

  // Ad purchase state
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<keyof typeof AD_PRICING>('7_DAYS')
  const [hookQuestion, setHookQuestion] = useState('')
  const [ads, setAds] = useState<VideoAd[]>([])

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('advertiser_session')
    const storedId = localStorage.getItem('advertiser_id')
    if (storedToken && storedId) {
      setSessionToken(storedToken)
      fetchAdvertiserData(storedId, storedToken)
    }
  }, [])

  // Fetch advertiser data
  const fetchAdvertiserData = async (id: string, token: string) => {
    try {
      const response = await fetch(`/api/advertiser/profile?advertiserId=${id}&sessionToken=${token}`)
      const data = await response.json()

      if (data.success) {
        setAdvertiser(data.data.advertiser)
        setIsLoggedIn(true)
        setView(postId ? 'purchase' : 'dashboard')

        // Fetch ads
        const adsRes = await fetch(`/api/ads?advertiserId=${id}`)
        const adsData = await adsRes.json()
        if (adsData.success) {
          setAds(adsData.data.ads || [])
        }
      } else {
        // Invalid session
        localStorage.removeItem('advertiser_session')
        localStorage.removeItem('advertiser_id')
      }
    } catch {
      // Session invalid
    }
  }

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/advertiser/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, password }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('advertiser_session', data.data.sessionToken)
        localStorage.setItem('advertiser_id', data.data.advertiser.id)
        setSessionToken(data.data.sessionToken)
        setAdvertiser(data.data.advertiser)
        setIsLoggedIn(true)
        setView(postId ? 'purchase' : 'dashboard')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/advertiser/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, password, businessName }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Account created! You can now login.')
        setAuthMode('login')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle ad purchase
  const handlePurchaseAd = async () => {
    if (!selectedBusiness || !hookQuestion || !postId) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postPublicId: postId,
          businessId: selectedBusiness,
          advertiserId: advertiser?.id,
          hookQuestion,
          duration: selectedDuration,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.data.message)
        // Update balance
        if (advertiser) {
          setAdvertiser({ ...advertiser, creditBalance: data.data.newBalance })
        }
        // Refresh ads
        fetchAdvertiserData(advertiser!.id, sessionToken!)
      } else if (data.needsCredits) {
        setError(`${data.error} Please add more credits.`)
        setView('credits')
      } else {
        setError(data.error || 'Failed to purchase ad')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle credit purchase
  const handleBuyCredits = async (packageType: keyof typeof CREDIT_PACKAGES) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/advertiser/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertiserId: advertiser?.id,
          sessionToken,
          packageType,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to payment
        window.location.href = data.data.paymentUrl
      } else {
        setError(data.error || 'Failed to initiate payment')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('advertiser_session')
    localStorage.removeItem('advertiser_id')
    setIsLoggedIn(false)
    setAdvertiser(null)
    setSessionToken(null)
    setView('auth')
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={`/${country}/live`}
            className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Advertise on SpillNova</h1>
            <p className="text-xs text-gray-400">Reach engaged local audiences</p>
          </div>
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-500/30 rounded-xl flex items-center gap-2 text-green-400 text-sm">
            <Check className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* Auth View */}
        {view === 'auth' && (
          <div className="space-y-6">
            {/* Benefits */}
            <div className="bg-gradient-to-br from-primary-900/30 to-primary-800/10 border border-primary-500/20 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-400" />
                Why Advertise With Us?
              </h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Target specific videos relevant to your business</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Non-intrusive ads that users choose to engage with</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Track impressions and clicks in real-time</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Affordable pricing starting from R15</span>
                </li>
              </ul>

              {/* Self-promotion tip */}
              <div className="mt-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 text-sm font-medium mb-1">
                  💡 Pro Tip: 50% Off Self-Promotion!
                </p>
                <p className="text-gray-400 text-sm">
                  Post your own funny or engaging videos, then advertise on them at <span className="text-amber-400 font-medium">half price</span>!
                  Great content + subtle advertising = more customers without being salesy.
                </p>
              </div>
            </div>

            {/* Auth Form */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                    authMode === 'login'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                    authMode === 'register'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  Register
                </button>
              </div>

              <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0821234567"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                      required
                    />
                  </div>
                </div>

                {authMode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Business Name
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Your business name"
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : authMode === 'login' ? (
                    'Login'
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Dashboard View */}
        {view === 'dashboard' && advertiser && (
          <div className="space-y-6">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-primary-900/40 to-primary-800/20 border border-primary-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Credit Balance</p>
                  <p className="text-3xl font-bold text-white">
                    R{(advertiser.creditBalance / 100).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => setView('credits')}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Credits
                </button>
              </div>
              <p className="text-gray-400 text-sm">
                Total spent: R{(advertiser.totalSpent / 100).toFixed(2)}
              </p>
            </div>

            {/* Business Profiles */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Business Profiles</h3>
                <Link
                  href={`/${country}/advertise/business/new`}
                  className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </Link>
              </div>

              {advertiser.businessProfiles.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">No business profiles yet</p>
                  <Link
                    href={`/${country}/advertise/business/new`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Business Profile
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {advertiser.businessProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
                    >
                      {profile.logo ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-800">
                          <Image
                            src={getMediaUrl(profile.logo)}
                            alt={profile.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{profile.name}</p>
                        <p className="text-gray-400 text-sm">/{profile.publicId}</p>
                      </div>
                      <Link
                        href={`/${country}/business/${profile.publicId}`}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Ads */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Ads</h3>

              {ads.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">No ads running yet</p>
                  <p className="text-gray-500 text-sm mb-4">
                    Browse videos and click "Advertise Here" to get started
                  </p>

                  {/* Self-promotion tip */}
                  <div className="mt-4 p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl text-left">
                    <p className="text-amber-400 text-sm font-medium mb-2">
                      💡 Smart Strategy: Create Your Own Content!
                    </p>
                    <p className="text-gray-400 text-sm mb-2">
                      Post funny or engaging videos about your industry, then advertise on your own videos at <span className="text-amber-400 font-medium">50% off</span>!
                    </p>
                    <p className="text-gray-500 text-xs">
                      Example: A plumber posts a funny "plumbing fails" video, then adds their "Need a plumber?" ad.
                      Viewers enjoy the content AND see your business - without feeling sold to.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {ads.map((ad) => (
                    <div
                      key={ad.id}
                      className="p-4 bg-white/5 rounded-xl"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-white font-medium">{ad.hookQuestion}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          ad.status === 'ACTIVE' && new Date(ad.expiresAt) > new Date()
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {ad.status === 'ACTIVE' && new Date(ad.expiresAt) > new Date() ? 'Active' : 'Expired'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {ad.impressions}
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointer className="w-3 h-3" />
                          {ad.clicks}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Expires {new Date(ad.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Credits View */}
        {view === 'credits' && advertiser && (
          <div className="space-y-6">
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>

            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Add Credits</h3>
              <p className="text-gray-400 text-sm mb-6">
                Current balance: <span className="text-white font-medium">R{(advertiser.creditBalance / 100).toFixed(2)}</span>
              </p>

              <div className="grid gap-3">
                {Object.entries(CREDIT_PACKAGES).map(([key, pkg]) => (
                  <button
                    key={key}
                    onClick={() => handleBuyCredits(key as keyof typeof CREDIT_PACKAGES)}
                    disabled={loading}
                    className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-900/50 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{pkg.label}</p>
                        <p className="text-gray-400 text-sm">
                          R{((pkg.credits + pkg.bonus) / 100).toFixed(0)} in credits
                          {pkg.bonus > 0 && (
                            <span className="text-green-400 ml-1">
                              (+R{(pkg.bonus / 100).toFixed(0)} bonus)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">R{(pkg.price / 100).toFixed(0)}</p>
                      <ChevronRight className="w-4 h-4 text-gray-500 ml-auto" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Purchase View */}
        {view === 'purchase' && advertiser && postId && (
          <div className="space-y-6">
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>

            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Purchase Ad Slot</h3>

              <div className="space-y-5">
                {/* Business Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Business Profile
                  </label>
                  {advertiser.businessProfiles.length === 0 ? (
                    <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl">
                      <p className="text-yellow-400 text-sm mb-2">
                        You need a business profile first
                      </p>
                      <Link
                        href={`/${country}/advertise/business/new?returnTo=${encodeURIComponent(`/${country}/advertise?postId=${postId}`)}`}
                        className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Create Business Profile
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {advertiser.businessProfiles.map((profile) => (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => setSelectedBusiness(profile.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                            selectedBusiness === profile.id
                              ? 'bg-primary-900/30 border-primary-500/50'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {profile.logo ? (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-800">
                              <Image
                                src={getMediaUrl(profile.logo)}
                                alt={profile.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-white font-medium">{profile.name}</p>
                          </div>
                          {selectedBusiness === profile.id && (
                            <Check className="w-5 h-5 text-primary-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hook Question */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hook Question
                  </label>
                  <input
                    type="text"
                    value={hookQuestion}
                    onChange={(e) => setHookQuestion(e.target.value)}
                    placeholder="e.g. Need a plumber? Looking for solar panels?"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    maxLength={100}
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    A short question to catch viewers' attention ({hookQuestion.length}/100)
                  </p>
                </div>

                {/* Duration Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ad Duration
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(AD_PRICING).map(([key, { price, label }]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedDuration(key as keyof typeof AD_PRICING)}
                        className={`p-3 rounded-xl border transition-all text-center ${
                          selectedDuration === key
                            ? 'bg-primary-900/30 border-primary-500/50'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <p className="text-white font-medium">{label}</p>
                        <p className="text-gray-400 text-sm">R{(price / 100).toFixed(0)}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex justify-between text-gray-300 mb-2">
                    <span>Ad Cost</span>
                    <span>R{(AD_PRICING[selectedDuration].price / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300 mb-2">
                    <span>Your Balance</span>
                    <span>R{(advertiser.creditBalance / 100).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <div className="flex justify-between text-white font-medium">
                      <span>After Purchase</span>
                      <span className={advertiser.creditBalance - AD_PRICING[selectedDuration].price < 0 ? 'text-red-400' : ''}>
                        R{((advertiser.creditBalance - AD_PRICING[selectedDuration].price) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Purchase Button */}
                {advertiser.creditBalance < AD_PRICING[selectedDuration].price ? (
                  <button
                    onClick={() => setView('credits')}
                    className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Add Credits (Insufficient Balance)
                  </button>
                ) : (
                  <button
                    onClick={handlePurchaseAd}
                    disabled={loading || !selectedBusiness || !hookQuestion}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Purchase Ad Slot
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
