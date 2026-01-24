'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  Gavel,
  Clock,
  TrendingUp,
  Trophy,
  AlertCircle,
  Search,
  Filter,
  Play,
  Image as ImageIcon,
  ChevronRight,
  Bell,
  BellOff,
  LogOut,
  RefreshCw,
  Eye,
  X,
  Check,
  Phone,
  User,
  Building2,
  Bookmark,
  BookmarkPlus,
  CreditCard,
  Download,
  ExternalLink,
  Wallet,
} from 'lucide-react'
import { useCountry } from '@/lib/country-context'
import { Flag } from '@/components/Flag'

// Types
interface Auction {
  id: string
  publicId: string
  content: string
  category: string
  province: string | null
  city: string | null
  submitterName: string
  currentBid: number
  minimumBid: number
  bidCount: number
  highestBidder: string | null
  auctionEndsAt: string
  timeRemaining: number
  viewCount: number
  createdAt: string
  thumbnail: string | null
  mediaType: 'video' | 'image'
  hasMedia: boolean
}

interface MyBid {
  postId: string
  internalId: string
  content: string
  category: string
  province: string | null
  city: string | null
  thumbnail: string | null
  mediaType: 'video' | 'image'
  currentBid: number
  myHighestBid: number
  isWinning: boolean
  bidCount: number
  auctionStatus: string
  auctionEndsAt: string
  timeRemaining: number
  buyerStatus: 'winning' | 'outbid' | 'won' | 'lost'
  lastBidAt: string
}

interface BuyerAccount {
  id: string
  phoneNumber: string
  organizationName: string | null
  email: string | null
  notifyOnNewContent: boolean
  notifyOnOutbid: boolean
  totalPurchases: number
  totalSpent: number
  auctionsWon: number
  creditBalance: number
}

interface WonContent {
  id: string
  postId: string
  title: string
  category: string
  province: string | null
  wonAt: string
  amountPaid: number
  downloadToken: string
  downloadsUsed: number
  maxDownloads: number
  expiresAt: string
  media: {
    id: string
    filename: string
    mimeType: string
    size: number
    isVideo: boolean
    thumbnail: string | null
    downloadUrl: string
  }[]
}

interface BuyerDashboardProps {
  initialAccount: BuyerAccount
  onLogout: () => void
}

// Tab types
type TabType = 'browse' | 'mybids' | 'content' | 'credits' | 'settings'

// Credit packages
const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter', credits: 10000, price: 10000, bonus: 0, description: 'R100 credits' },
  { id: 'basic', name: 'Basic', credits: 25000, price: 22500, bonus: 2500, description: '10% bonus' },
  { id: 'pro', name: 'Pro', credits: 50000, price: 42500, bonus: 7500, description: '15% bonus', popular: true },
  { id: 'enterprise', name: 'Enterprise', credits: 100000, price: 80000, bonus: 20000, description: '20% bonus' },
]

// R2 URL helper
const R2_PUBLIC_URL = 'https://media.saleaks.co.za'

function getMediaUrl(path: string | null): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return path
  return `${R2_PUBLIC_URL}/${path}`
}

// Format time remaining
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Ended'

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

// Format currency
function formatCurrency(cents: number): string {
  return `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function BuyerDashboard({ initialAccount, onLogout }: BuyerDashboardProps) {
  const { country, config } = useCountry()
  const [account, setAccount] = useState<BuyerAccount>(initialAccount)
  const [activeTab, setActiveTab] = useState<TabType>('browse')

  // Auction browse state
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loadingAuctions, setLoadingAuctions] = useState(true)
  const [auctionFilter, setAuctionFilter] = useState('')
  const [sortBy, setSortBy] = useState('ending_soon')

  // My bids state
  const [myBids, setMyBids] = useState<MyBid[]>([])
  const [loadingBids, setLoadingBids] = useState(false)
  const [bidStats, setBidStats] = useState({ activeBids: 0, winning: 0, outbid: 0, won: 0 })

  // Bidding modal state
  const [selectedAuction, setSelectedAuction] = useState<Auction | MyBid | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [bidding, setBidding] = useState(false)
  const [bidError, setBidError] = useState('')
  const [bidSuccess, setBidSuccess] = useState('')

  // My content state (won auctions for download)
  const [myContent, setMyContent] = useState<WonContent[]>([])
  const [loadingContent, setLoadingContent] = useState(false)

  // Credits modal state
  const [showCreditsModal, setShowCreditsModal] = useState(false)
  const [buyingCredits, setBuyingCredits] = useState(false)
  const [creditsError, setCreditsError] = useState('')
  const [creditsSuccess, setCreditsSuccess] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'demo' | 'payfast'>('demo')

  // PayFast form ref
  const payFastFormRef = useRef<HTMLFormElement>(null)
  const [payFastData, setPayFastData] = useState<Record<string, string> | null>(null)
  const [payFastUrl, setPayFastUrl] = useState('')

  // URL search params for payment status
  const searchParams = useSearchParams()

  // Check for payment status from URL (after PayFast redirect)
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    if (paymentStatus === 'success') {
      setCreditsSuccess('Payment successful! Your credits have been added.')
      setActiveTab('credits')
      // Refresh account to get updated balance
      refreshAccount()
      // Clear the URL params
      window.history.replaceState({}, '', window.location.pathname)
    } else if (paymentStatus === 'cancelled') {
      setCreditsError('Payment was cancelled. No credits were added.')
      setActiveTab('credits')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [searchParams])

  // Submit PayFast form when data is set
  useEffect(() => {
    if (payFastData && payFastFormRef.current) {
      payFastFormRef.current.submit()
    }
  }, [payFastData])

  // Fetch active auctions
  const fetchAuctions = useCallback(async () => {
    setLoadingAuctions(true)
    try {
      const params = new URLSearchParams({ sortBy })
      if (auctionFilter) params.set('category', auctionFilter)

      const res = await fetch(`/api/auction/active?${params}`)
      const data = await res.json()

      if (data.success) {
        setAuctions(data.data.auctions)
      }
    } catch (error) {
      console.error('Failed to fetch auctions:', error)
    } finally {
      setLoadingAuctions(false)
    }
  }, [sortBy, auctionFilter])

  // Fetch my bids
  const fetchMyBids = useCallback(async () => {
    setLoadingBids(true)
    try {
      const res = await fetch('/api/buyer/bids')
      const data = await res.json()

      if (data.success) {
        setMyBids(data.data.auctions)
        setBidStats(data.data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch bids:', error)
    } finally {
      setLoadingBids(false)
    }
  }, [])

  // Fetch my content (won auctions)
  const fetchMyContent = useCallback(async () => {
    setLoadingContent(true)
    try {
      const res = await fetch('/api/buyer/content')
      const data = await res.json()

      if (data.success) {
        setMyContent(data.data.content)
      }
    } catch (error) {
      console.error('Failed to fetch content:', error)
    } finally {
      setLoadingContent(false)
    }
  }, [])

  // Refresh account (for credit balance updates)
  const refreshAccount = useCallback(async () => {
    try {
      const res = await fetch('/api/buyer/account')
      const data = await res.json()
      if (data.success) {
        setAccount(data.data)
      }
    } catch (error) {
      console.error('Failed to refresh account:', error)
    }
  }, [])

  // Buy credits
  const handleBuyCredits = async (packageId: string) => {
    setBuyingCredits(true)
    setCreditsError('')
    setCreditsSuccess('')

    try {
      const res = await fetch('/api/buyer/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, paymentMethod }),
      })

      const data = await res.json()

      if (data.success) {
        if (data.data.demoMode) {
          // Demo mode - credits added immediately
          setCreditsSuccess(data.data.message)
          await refreshAccount()
        } else if (data.data.paymentMethod === 'payfast') {
          // PayFast - redirect to payment page
          setPayFastUrl(data.data.paymentUrl)
          setPayFastData(data.data.paymentData)
          // Form will auto-submit via useEffect
        }
      } else {
        setCreditsError(data.error || 'Failed to purchase credits')
      }
    } catch (error) {
      setCreditsError('Network error. Please try again.')
    } finally {
      setBuyingCredits(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchAuctions()
    fetchMyBids()
    fetchMyContent()
  }, [fetchAuctions, fetchMyBids, fetchMyContent])

  // Auto-refresh auctions every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'browse') {
        fetchAuctions()
      } else if (activeTab === 'mybids') {
        fetchMyBids()
      } else if (activeTab === 'content') {
        fetchMyContent()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [activeTab, fetchAuctions, fetchMyBids])

  // Place bid
  const handlePlaceBid = async () => {
    if (!selectedAuction) return

    const amount = parseInt(bidAmount) * 100 // Convert to cents
    const minBid = 'minimumBid' in selectedAuction
      ? selectedAuction.minimumBid
      : selectedAuction.currentBid + 500

    if (!amount || amount < minBid) {
      setBidError(`Minimum bid is ${formatCurrency(minBid)}`)
      return
    }

    setBidding(true)
    setBidError('')
    setBidSuccess('')

    try {
      const postId = 'internalId' in selectedAuction ? selectedAuction.internalId : selectedAuction.id

      const res = await fetch('/api/auction/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          amount,
          phoneNumber: account.phoneNumber,
          displayName: account.organizationName || undefined,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setBidSuccess(data.data.message)
        // Refresh data
        fetchAuctions()
        fetchMyBids()
        // Close modal after delay
        setTimeout(() => {
          setSelectedAuction(null)
          setBidAmount('')
          setBidSuccess('')
        }, 2000)
      } else {
        setBidError(data.error || 'Failed to place bid')
      }
    } catch (error) {
      setBidError('Network error. Please try again.')
    } finally {
      setBidding(false)
    }
  }

  // Toggle notifications
  const toggleNotification = async (field: 'notifyOnNewContent' | 'notifyOnOutbid') => {
    try {
      const res = await fetch('/api/buyer/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !account[field] }),
      })

      if (res.ok) {
        setAccount({ ...account, [field]: !account[field] })
      }
    } catch (error) {
      console.error('Failed to update notifications:', error)
    }
  }

  return (
    <div className="min-h-screen bg-ink-900">
      {/* Header */}
      <header className="border-b border-ink-800 sticky top-0 bg-ink-900/95 backdrop-blur z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href={`/${country}`} className="text-xl font-bold text-white flex items-center gap-2">
              <Flag countryCode={config.code} size="md" />
              Leak<span className="text-primary-400">point</span>
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full ml-2">Buyer</span>
            </Link>

            <div className="flex items-center gap-4">
              {/* Credits balance */}
              <button
                type="button"
                onClick={() => setShowCreditsModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-full transition-colors"
              >
                <Wallet className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-yellow-400 font-medium">{formatCurrency(account.creditBalance)}</span>
                <span className="text-xs text-yellow-400/70">+</span>
              </button>

              {/* Stats badges */}
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 rounded-full">
                  <Trophy className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">{bidStats.won} Won</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 rounded-full">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-blue-400 font-medium">{bidStats.winning} Winning</span>
                </div>
                {bidStats.outbid > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/20 rounded-full">
                    <AlertCircle className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-orange-400 font-medium">{bidStats.outbid} Outbid</span>
                  </div>
                )}
              </div>

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-1.5 bg-ink-700 hover:bg-ink-600 rounded-lg text-gray-400 hover:text-white transition-colors text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 -mb-px overflow-x-auto">
            {[
              { id: 'browse', label: 'Auctions', icon: Gavel },
              { id: 'mybids', label: 'My Bids', icon: TrendingUp, badge: bidStats.activeBids },
              { id: 'content', label: 'My Content', icon: Download, badge: myContent.length },
              { id: 'credits', label: 'Credits', icon: Wallet },
              { id: 'settings', label: 'Settings', icon: Bell },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-ink-800 text-white border-b-2 border-primary-500'
                    : 'text-gray-400 hover:text-white hover:bg-ink-800/50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    tab.id === 'mybids' && bidStats.outbid > 0
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-primary-500/20 text-primary-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Browse Auctions Tab */}
        {activeTab === 'browse' && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="ending_soon">Ending Soon</option>
                  <option value="newest">Newest First</option>
                  <option value="highest_bid">Highest Bid</option>
                  <option value="most_bids">Most Bids</option>
                </select>
              </div>

              <select
                value={auctionFilter}
                onChange={(e) => setAuctionFilter(e.target.value)}
                className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="BREAKING">Breaking News</option>
                <option value="CRIME">Crime</option>
                <option value="PROTEST">Protest</option>
                <option value="TRAFFIC">Traffic</option>
                <option value="COMMUNITY">Community</option>
              </select>

              <button
                onClick={fetchAuctions}
                className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-ink-700 border border-ink-700 rounded-lg text-gray-400 hover:text-white transition-colors text-sm"
              >
                <RefreshCw className={`h-4 w-4 ${loadingAuctions ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Auctions Grid */}
            {loadingAuctions ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
              </div>
            ) : auctions.length === 0 ? (
              <div className="text-center py-20">
                <Gavel className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Active Auctions</h3>
                <p className="text-gray-400">Check back soon for new content to bid on.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {auctions.map((auction) => (
                  <AuctionCard
                    key={auction.id}
                    auction={auction}
                    onBid={() => {
                      setSelectedAuction(auction)
                      setBidAmount(Math.ceil(auction.minimumBid / 100).toString())
                      setBidError('')
                      setBidSuccess('')
                    }}
                    country={country}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Bids Tab */}
        {activeTab === 'mybids' && (
          <div>
            {loadingBids ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
              </div>
            ) : myBids.filter(b => b.auctionStatus === 'ACTIVE').length === 0 ? (
              <div className="text-center py-20">
                <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Active Bids</h3>
                <p className="text-gray-400 mb-4">You haven't placed any bids yet.</p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  Browse Auctions
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myBids
                  .filter(b => b.auctionStatus === 'ACTIVE')
                  .map((bid) => (
                    <MyBidCard
                      key={bid.postId}
                      bid={bid}
                      onBid={() => {
                        setSelectedAuction(bid)
                        setBidAmount(Math.ceil((bid.currentBid + 500) / 100).toString())
                        setBidError('')
                        setBidSuccess('')
                      }}
                      country={country}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* My Content Tab - Downloads */}
        {activeTab === 'content' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2">My Content</h2>
              <p className="text-gray-400">Download your won auction content - clean originals without watermarks.</p>
            </div>

            {loadingContent ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
              </div>
            ) : myContent.length === 0 ? (
              <div className="text-center py-20">
                <Download className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Content Yet</h3>
                <p className="text-gray-400 mb-4">Win auctions to get exclusive content access.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('browse')}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  Browse Auctions
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myContent.map((content) => (
                  <div key={content.id} className="bg-ink-800 rounded-xl border border-green-500/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="h-5 w-5 text-green-400" />
                      <span className="text-green-400 font-medium">Exclusive Content</span>
                    </div>

                    <p className="text-gray-300 text-sm mb-3">{content.title}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <span>Won: {new Date(content.wonAt).toLocaleDateString()}</span>
                      <span>Paid: {formatCurrency(content.amountPaid)}</span>
                    </div>

                    {/* Media files for download */}
                    <div className="space-y-2">
                      {content.media.map((media) => (
                        <a
                          key={media.id}
                          href={media.downloadUrl}
                          className="flex items-center justify-between p-3 bg-ink-700 hover:bg-ink-600 rounded-lg transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            {media.isVideo ? (
                              <Play className="h-5 w-5 text-blue-400" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-green-400" />
                            )}
                            <div>
                              <div className="text-white text-sm font-medium">{media.filename}</div>
                              <div className="text-xs text-gray-500">
                                {media.isVideo ? 'Video' : 'Image'} • {(media.size / 1024 / 1024).toFixed(1)} MB
                              </div>
                            </div>
                          </div>
                          <Download className="h-5 w-5 text-gray-400 group-hover:text-green-400 transition-colors" />
                        </a>
                      ))}
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      Downloads: {content.downloadsUsed} / {content.maxDownloads} •
                      Expires: {new Date(content.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Credits Tab */}
        {activeTab === 'credits' && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-yellow-500/20 rounded-xl mb-4">
                <Wallet className="h-8 w-8 text-yellow-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{formatCurrency(account.creditBalance)}</div>
                  <div className="text-sm text-yellow-400">Current Balance</div>
                </div>
              </div>
              <p className="text-gray-400">Buy credits to bid on auctions. Credits are deducted when you win.</p>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6 p-4 bg-ink-800 rounded-xl border border-ink-700">
              <h4 className="text-white font-medium mb-3">Payment Method</h4>
              <div className="flex gap-3">
                <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-colors ${
                  paymentMethod === 'payfast' ? 'border-primary-500 bg-primary-500/10' : 'border-ink-600 hover:border-ink-500'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="payfast"
                    checked={paymentMethod === 'payfast'}
                    onChange={() => setPaymentMethod('payfast')}
                    className="h-4 w-4 text-primary-500"
                  />
                  <div>
                    <div className="text-white font-medium">PayFast</div>
                    <div className="text-xs text-gray-400">Credit/Debit Card, EFT, SnapScan</div>
                  </div>
                </label>
                <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-colors ${
                  paymentMethod === 'demo' ? 'border-green-500 bg-green-500/10' : 'border-ink-600 hover:border-ink-500'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="demo"
                    checked={paymentMethod === 'demo'}
                    onChange={() => setPaymentMethod('demo')}
                    className="h-4 w-4 text-green-500"
                  />
                  <div>
                    <div className="text-white font-medium">Demo Mode</div>
                    <div className="text-xs text-gray-400">Free credits for testing</div>
                  </div>
                </label>
              </div>
              {paymentMethod === 'demo' && (
                <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-xs text-green-400">Demo mode: Credits added instantly without payment (for testing only)</p>
                </div>
              )}
            </div>

            {/* Credit Packages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CREDIT_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`bg-ink-800 rounded-xl p-6 border-2 transition-colors ${
                    (pkg as any).popular ? 'border-primary-500' : 'border-ink-700 hover:border-ink-600'
                  }`}
                >
                  {(pkg as any).popular && (
                    <div className="text-xs text-primary-400 font-medium mb-2">MOST POPULAR</div>
                  )}
                  <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-white">{formatCurrency(pkg.price)}</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="text-green-400 font-medium">
                      Get {formatCurrency(pkg.credits + pkg.bonus)} in credits
                    </div>
                    {pkg.bonus > 0 && (
                      <div className="text-sm text-yellow-400">
                        +{formatCurrency(pkg.bonus)} bonus!
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBuyCredits(pkg.id)}
                    disabled={buyingCredits}
                    className={`w-full mt-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      (pkg as any).popular
                        ? 'bg-primary-500 hover:bg-primary-600 text-white'
                        : 'bg-ink-700 hover:bg-ink-600 text-white'
                    }`}
                  >
                    {buyingCredits ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        {paymentMethod === 'payfast' ? 'Pay with PayFast' : 'Add Credits (Demo)'}
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Success Message */}
            {creditsSuccess && (
              <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm text-center">
                {creditsSuccess}
              </div>
            )}

            {/* Error Message */}
            {creditsError && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm text-center">
                {creditsError}
              </div>
            )}

            {/* Hidden PayFast Form */}
            {payFastData && (
              <form
                ref={payFastFormRef}
                action={payFastUrl}
                method="POST"
                className="hidden"
              >
                {Object.entries(payFastData).map(([key, value]) => (
                  <input key={key} type="hidden" name={key} value={value} />
                ))}
              </form>
            )}

            <div className="mt-6 p-4 bg-ink-800/50 rounded-xl border border-ink-700">
              <h4 className="text-white font-medium mb-2">How Credits Work</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• You need credits to place bids on auctions</li>
                <li>• Credits are only deducted when you WIN an auction</li>
                <li>• If you're outbid, your credits stay in your account</li>
                <li>• Won content is available for immediate download - no watermarks</li>
              </ul>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Account Info */}
            <div className="bg-ink-800 rounded-xl p-6 border border-ink-700">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-400" />
                Account Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-ink-700">
                  <span className="text-gray-400">Phone Number</span>
                  <span className="text-white">{account.phoneNumber}</span>
                </div>
                {account.organizationName && (
                  <div className="flex items-center justify-between py-2 border-b border-ink-700">
                    <span className="text-gray-400">Organization</span>
                    <span className="text-white">{account.organizationName}</span>
                  </div>
                )}
                {account.email && (
                  <div className="flex items-center justify-between py-2 border-b border-ink-700">
                    <span className="text-gray-400">Email</span>
                    <span className="text-white">{account.email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-400">Total Spent</span>
                  <span className="text-white font-medium">{formatCurrency(account.totalSpent)}</span>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-ink-800 rounded-xl p-6 border border-ink-700">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-green-400" />
                Notification Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {account.notifyOnNewContent ? (
                      <Bell className="h-5 w-5 text-green-400" />
                    ) : (
                      <BellOff className="h-5 w-5 text-gray-500" />
                    )}
                    <div>
                      <div className="text-white font-medium">New Auctions</div>
                      <div className="text-sm text-gray-400">Get SMS when new content is available</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleNotification('notifyOnNewContent')}
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
                    onClick={() => toggleNotification('notifyOnOutbid')}
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
          </div>
        )}
      </main>

      {/* Bidding Modal */}
      {selectedAuction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-ink-800 rounded-2xl p-6 max-w-md w-full relative">
            <button
              onClick={() => {
                setSelectedAuction(null)
                setBidAmount('')
                setBidError('')
                setBidSuccess('')
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                <Gavel className="h-6 w-6 text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Place Bid</h3>
                <p className="text-sm text-gray-400">
                  Current: {formatCurrency('currentBid' in selectedAuction ? selectedAuction.currentBid : 0)}
                </p>
              </div>
            </div>

            {/* Content preview */}
            <div className="bg-ink-700 rounded-lg p-3 mb-4">
              <p className="text-gray-300 text-sm line-clamp-2">{selectedAuction.content}</p>
            </div>

            {/* Bid input */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Your Bid (Rands)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  min={Math.ceil(('minimumBid' in selectedAuction ? selectedAuction.minimumBid : selectedAuction.currentBid + 500) / 100)}
                  className="w-full pl-8 pr-4 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white text-lg font-medium focus:border-primary-500 focus:outline-none"
                  placeholder="Enter amount"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimum bid: {formatCurrency('minimumBid' in selectedAuction ? selectedAuction.minimumBid : selectedAuction.currentBid + 500)}
              </p>
            </div>

            {/* Bidding as */}
            <div className="bg-ink-700/50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-400">Bidding as:</span>
                <span className="text-white font-medium">
                  {account.organizationName || account.phoneNumber}
                </span>
              </div>
            </div>

            {bidError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {bidError}
              </div>
            )}

            {bidSuccess && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm flex items-center gap-2">
                <Check className="h-5 w-5" />
                {bidSuccess}
              </div>
            )}

            {!bidSuccess && (
              <button
                onClick={handlePlaceBid}
                disabled={bidding || !bidAmount}
                className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-ink-600 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {bidding ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Placing Bid...
                  </>
                ) : (
                  <>
                    <Gavel className="h-5 w-5" />
                    Place Bid - {bidAmount ? formatCurrency(parseInt(bidAmount) * 100) : 'R0'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Auction Card Component
function AuctionCard({
  auction,
  onBid,
  country,
}: {
  auction: Auction
  onBid: () => void
  country: string
}) {
  const [timeLeft, setTimeLeft] = useState(auction.timeRemaining)

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const isUrgent = timeLeft < 5 * 60 * 1000 // Less than 5 minutes

  return (
    <div className="bg-ink-800 rounded-xl border border-ink-700 overflow-hidden hover:border-ink-600 transition-colors">
      {/* Thumbnail */}
      <Link href={`/${country}/live/${auction.publicId}`}>
        <div className="relative aspect-video bg-ink-700">
          {auction.thumbnail ? (
            <img
              src={getMediaUrl(auction.thumbnail)}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {auction.mediaType === 'video' ? (
                <Play className="h-12 w-12 text-gray-600" />
              ) : (
                <ImageIcon className="h-12 w-12 text-gray-600" />
              )}
            </div>
          )}

          {/* Timer overlay */}
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
            isUrgent ? 'bg-red-500 text-white' : 'bg-black/70 text-white'
          }`}>
            <Clock className="h-3 w-3" />
            {formatTimeRemaining(timeLeft)}
          </div>

          {/* Category badge */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded-lg text-xs text-white">
            {auction.category}
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <p className="text-gray-300 text-sm line-clamp-2 mb-3">{auction.content}</p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-gray-500">Current Bid</div>
            <div className="text-lg font-bold text-white">{formatCurrency(auction.currentBid)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">{auction.bidCount} bids</div>
            {auction.highestBidder && (
              <div className="text-xs text-gray-400">{auction.highestBidder}</div>
            )}
          </div>
        </div>

        <button
          onClick={onBid}
          disabled={timeLeft === 0}
          className="w-full py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-ink-600 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Gavel className="h-4 w-4" />
          {timeLeft === 0 ? 'Auction Ended' : `Bid ${formatCurrency(auction.minimumBid)}+`}
        </button>
      </div>
    </div>
  )
}

// My Bid Card Component
function MyBidCard({
  bid,
  onBid,
  country,
}: {
  bid: MyBid
  onBid: () => void
  country: string
}) {
  const [timeLeft, setTimeLeft] = useState(bid.timeRemaining)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`bg-ink-800 rounded-xl border p-4 flex gap-4 ${
      bid.isWinning ? 'border-green-500/50' : 'border-orange-500/50'
    }`}>
      {/* Thumbnail */}
      <Link href={`/${country}/live/${bid.postId}`} className="flex-shrink-0">
        <div className="w-24 h-24 bg-ink-700 rounded-lg overflow-hidden">
          {bid.thumbnail ? (
            <img src={getMediaUrl(bid.thumbnail)} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {bid.mediaType === 'video' ? (
                <Play className="h-8 w-8 text-gray-600" />
              ) : (
                <ImageIcon className="h-8 w-8 text-gray-600" />
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-gray-300 text-sm line-clamp-2">{bid.content}</p>
          <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
            bid.isWinning
              ? 'bg-green-500/20 text-green-400'
              : 'bg-orange-500/20 text-orange-400'
          }`}>
            {bid.isWinning ? 'Winning' : 'Outbid'}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-2 text-sm">
          <div>
            <span className="text-gray-500">Your bid: </span>
            <span className="text-white font-medium">{formatCurrency(bid.myHighestBid)}</span>
          </div>
          <div>
            <span className="text-gray-500">Current: </span>
            <span className="text-white font-medium">{formatCurrency(bid.currentBid)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            {formatTimeRemaining(timeLeft)}
          </div>

          {!bid.isWinning && timeLeft > 0 && (
            <button
              onClick={onBid}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
            >
              <Gavel className="h-4 w-4" />
              Increase Bid
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Won Auction Card
function WonAuctionCard({ bid, country }: { bid: MyBid; country: string }) {
  return (
    <div className="bg-ink-800 rounded-xl border border-green-500/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-5 w-5 text-green-400" />
        <span className="text-green-400 font-medium">Auction Won!</span>
      </div>

      <Link href={`/${country}/live/${bid.postId}`}>
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-ink-700 rounded-lg overflow-hidden flex-shrink-0">
            {bid.thumbnail ? (
              <img src={getMediaUrl(bid.thumbnail)} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {bid.mediaType === 'video' ? (
                  <Play className="h-8 w-8 text-gray-600" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-600" />
                )}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-gray-300 text-sm line-clamp-2">{bid.content}</p>
            <div className="mt-2">
              <span className="text-gray-500 text-sm">Winning bid: </span>
              <span className="text-white font-bold">{formatCurrency(bid.myHighestBid)}</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/${country}/live/${bid.postId}`}
          className="flex-1 py-2 bg-ink-700 hover:bg-ink-600 text-white text-sm font-medium rounded-lg transition-colors text-center"
        >
          View Content
        </Link>
        <button className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors">
          Download
        </button>
      </div>
    </div>
  )
}
