'use client'

import { useState, useEffect } from 'react'
import { Gavel, Clock, Trophy, X, Loader2, Phone } from 'lucide-react'

interface AuctionInfo {
  status: string
  isActive: boolean
  endsAt: string | null
  timeRemaining: number
  currentBid: number | null
  bidCount: number
  isExclusive: boolean
  exclusiveBuyerName: string | null
  soldAt: string | null
  canBuyPublic: boolean
}

interface AuctionBadgeProps {
  postId: string
  auction: AuctionInfo
  className?: string
}

// Format time remaining
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Ended'

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

// Format currency
function formatRands(cents: number): string {
  return `R${(cents / 100).toFixed(0)}`
}

export function AuctionBadge({ postId, auction, className = '' }: AuctionBadgeProps) {
  const [timeRemaining, setTimeRemaining] = useState(auction.timeRemaining)
  const [showBidModal, setShowBidModal] = useState(false)
  const [bidAmount, setBidAmount] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Countdown timer
  useEffect(() => {
    if (!auction.isActive) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1000
        if (newTime <= 0) {
          clearInterval(interval)
          return 0
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [auction.isActive])

  // Calculate minimum bid
  const minimumBid = auction.currentBid ? auction.currentBid + 500 : 5000 // +R5 or R50 minimum

  const handleBid = async () => {
    setError(null)
    setSuccess(null)

    const amount = parseInt(bidAmount) * 100 // Convert to cents

    if (!amount || amount < minimumBid) {
      setError(`Minimum bid is ${formatRands(minimumBid)}`)
      return
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auction/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          amount,
          phoneNumber,
          displayName: displayName || undefined,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to place bid')
      }

      setSuccess(data.data.message)
      setBidAmount('')

      // Update time remaining if extended
      if (data.data.auctionEndsAt) {
        const newEndTime = new Date(data.data.auctionEndsAt).getTime()
        setTimeRemaining(newEndTime - Date.now())
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place bid'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Show "Sold to Media" badge if exclusively purchased
  if (auction.isExclusive && auction.exclusiveBuyerName) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-lg ${className}`}>
        <Trophy className="h-4 w-4 text-blue-400" />
        <span className="text-blue-300 text-sm font-medium">
          Purchased by {auction.exclusiveBuyerName}
        </span>
      </div>
    )
  }

  // Show "Available for Purchase" badge if auction ended with no bids
  if (auction.canBuyPublic) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-green-600/20 border border-green-500/30 rounded-lg ${className}`}>
        <span className="text-green-300 text-sm font-medium">
          Available for purchase
        </span>
      </div>
    )
  }

  // Show active auction badge
  if (auction.isActive && timeRemaining > 0) {
    return (
      <>
        <button
          onClick={() => setShowBidModal(true)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600/20 border border-amber-500/30 rounded-lg hover:bg-amber-600/30 transition-colors ${className}`}
        >
          <Gavel className="h-4 w-4 text-amber-400" />
          <span className="text-amber-300 text-sm font-medium">
            {auction.currentBid ? formatRands(auction.currentBid) : 'No bids'}
          </span>
          <span className="text-amber-400/70 text-xs">|</span>
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-amber-300 text-sm tabular-nums">
            {formatTimeRemaining(timeRemaining)}
          </span>
        </button>

        {/* Bid Modal */}
        {showBidModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-ink-800 rounded-xl max-w-md w-full p-6 border border-ink-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-amber-400" />
                  Place Bid for Exclusive Rights
                </h3>
                <button
                  onClick={() => setShowBidModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Auction Info */}
              <div className="bg-ink-900 rounded-lg p-4 mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Current Bid</span>
                  <span className="text-white font-semibold">
                    {auction.currentBid ? formatRands(auction.currentBid) : 'No bids yet'}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Minimum Bid</span>
                  <span className="text-amber-400 font-semibold">{formatRands(minimumBid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Time Remaining</span>
                  <span className="text-amber-400 font-semibold tabular-nums">
                    {formatTimeRemaining(timeRemaining)}
                  </span>
                </div>
              </div>

              {/* Bid Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Your Bid (Rands)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`${minimumBid / 100} or more`}
                      min={minimumBid / 100}
                      step="5"
                      className="w-full pl-10 pr-4 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Phone Number (for payment & notifications)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="082 123 4567"
                      maxLength={12}
                      className="w-full pl-10 pr-4 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Display Name (optional - shown if you win)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g., News24, eNCA, IOL"
                    maxLength={50}
                    className="w-full px-4 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm">
                    {success}
                  </div>
                )}

                <button
                  onClick={handleBid}
                  disabled={loading}
                  className="w-full py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Placing bid...
                    </>
                  ) : (
                    <>
                      <Gavel className="h-5 w-5" />
                      Place Bid
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Winner gets exclusive rights. Content will be removed from public view.
                  You&apos;ll be notified via SMS if outbid or if you win.
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Auction ended, waiting for payment from winner
  if (auction.status === 'ACTIVE' && auction.bidCount > 0 && timeRemaining <= 0) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-lg ${className}`}>
        <Clock className="h-4 w-4 text-purple-400" />
        <span className="text-purple-300 text-sm font-medium">
          Sale pending
        </span>
      </div>
    )
  }

  // Default - auction ended
  return null
}
