'use client'

import { useState, useEffect } from 'react'
import {
  Wallet,
  TrendingUp,
  Clock,
  ArrowDownCircle,
  LogOut,
  Loader2,
  FileText,
  Eye,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface Earning {
  id: string
  amount: number
  grossAmount: number
  description: string | null
  status: string
  createdAt: string
}

interface Withdrawal {
  id: string
  amount: number
  method: string
  status: string
  createdAt: string
  processedAt: string | null
}

interface ContentItem {
  id: string
  publicId: string
  title?: string
  content?: string
  viewCount: number
  createdAt: string
}

interface AccountData {
  account: {
    id: string
    phoneNumber: string
    carrier: string | null
    verified: boolean
    createdAt: string
  }
  balance: {
    available: number
    pending: number
    totalEarned: number
    totalWithdrawn: number
  }
  earnings: Earning[]
  withdrawals: Withdrawal[]
  content: {
    posts: ContentItem[]
    livePosts: ContentItem[]
    totalPosts: number
  }
}

interface SubmitterDashboardProps {
  onLogout: () => void
}

// Format amount in Rands
const formatRands = (cents: number) => {
  return `R${(cents / 100).toFixed(2)}`
}

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { icon: React.ElementType; className: string }> = {
    AVAILABLE: { icon: CheckCircle, className: 'bg-green-500/20 text-green-400' },
    PENDING: { icon: Clock, className: 'bg-yellow-500/20 text-yellow-400' },
    WITHDRAWN: { icon: ArrowDownCircle, className: 'bg-blue-500/20 text-blue-400' },
    COMPLETED: { icon: CheckCircle, className: 'bg-green-500/20 text-green-400' },
    PROCESSING: { icon: Loader2, className: 'bg-yellow-500/20 text-yellow-400' },
    FAILED: { icon: XCircle, className: 'bg-red-500/20 text-red-400' },
  }

  const config = configs[status] || { icon: AlertCircle, className: 'bg-gray-500/20 text-gray-400' }
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.className}`}>
      <Icon className={`h-3 w-3 ${status === 'PROCESSING' ? 'animate-spin' : ''}`} />
      {status.toLowerCase()}
    </span>
  )
}

export function SubmitterDashboard({ onLogout }: SubmitterDashboardProps) {
  const [data, setData] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'earnings' | 'withdrawals' | 'content'>('earnings')
  const [withdrawing, setWithdrawing] = useState(false)

  const fetchAccountData = async () => {
    try {
      const res = await fetch('/api/submitter/account')
      const result = await res.json()

      if (!result.success) {
        if (result.requiresAuth) {
          onLogout()
          return
        }
        throw new Error(result.error || 'Failed to load account')
      }

      setData(result.data)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load account'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccountData()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/submitter/account', { method: 'DELETE' })
    } finally {
      onLogout()
    }
  }

  const handleWithdraw = async () => {
    if (!data || data.balance.available < 1000) {
      alert('Minimum withdrawal is R10.00')
      return
    }

    setWithdrawing(true)
    try {
      const res = await fetch('/api/submitter/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: data.balance.available }),
      })

      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error || 'Withdrawal failed')
      }

      alert('Withdrawal requested! You will receive payment within 24-48 hours.')
      fetchAccountData()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Withdrawal failed'
      alert(errorMessage)
    } finally {
      setWithdrawing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error || 'Failed to load account'}</p>
        <button
          onClick={fetchAccountData}
          className="text-primary-400 hover:text-primary-300"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Account</h1>
          <p className="text-gray-400">{data.account.phoneNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAccountData}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-ink-800 rounded-xl p-4 border border-ink-700">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Wallet className="h-4 w-4" />
            <span className="text-sm">Available</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatRands(data.balance.available)}</p>
        </div>

        <div className="bg-ink-800 rounded-xl p-4 border border-ink-700">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{formatRands(data.balance.pending)}</p>
        </div>

        <div className="bg-ink-800 rounded-xl p-4 border border-ink-700">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Total Earned</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatRands(data.balance.totalEarned)}</p>
        </div>

        <div className="bg-ink-800 rounded-xl p-4 border border-ink-700">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <ArrowDownCircle className="h-4 w-4" />
            <span className="text-sm">Withdrawn</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{formatRands(data.balance.totalWithdrawn)}</p>
        </div>
      </div>

      {/* Withdraw Button */}
      {data.balance.available >= 1000 && (
        <button
          onClick={handleWithdraw}
          disabled={withdrawing}
          className="w-full mb-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {withdrawing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ArrowDownCircle className="h-5 w-5" />
              Withdraw {formatRands(data.balance.available)}
            </>
          )}
        </button>
      )}

      {data.balance.available > 0 && data.balance.available < 1000 && (
        <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm text-center">
          Minimum withdrawal is R10.00. You need {formatRands(1000 - data.balance.available)} more.
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-ink-700 mb-4">
        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'earnings'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Earnings
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'withdrawals'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Withdrawals
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'content'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Your Content ({data.content.totalPosts})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-ink-800 rounded-xl border border-ink-700 overflow-hidden">
        {activeTab === 'earnings' && (
          <>
            {data.earnings.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No earnings yet</p>
                <p className="text-sm mt-2">When someone buys your content, you&apos;ll see it here</p>
              </div>
            ) : (
              <div className="divide-y divide-ink-700">
                {data.earnings.map((earning) => (
                  <div key={earning.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        {earning.description || 'Content sale'}
                      </p>
                      <p className="text-sm text-gray-400">{formatDate(earning.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">+{formatRands(earning.amount)}</p>
                      <StatusBadge status={earning.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'withdrawals' && (
          <>
            {data.withdrawals.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <ArrowDownCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No withdrawals yet</p>
                <p className="text-sm mt-2">Request a withdrawal when you have R10+ available</p>
              </div>
            ) : (
              <div className="divide-y divide-ink-700">
                {data.withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        Withdrawal via {withdrawal.method}
                      </p>
                      <p className="text-sm text-gray-400">{formatDate(withdrawal.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{formatRands(withdrawal.amount)}</p>
                      <StatusBadge status={withdrawal.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'content' && (
          <>
            {data.content.totalPosts === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No content yet</p>
                <p className="text-sm mt-2">Submit content with your phone number to track earnings</p>
              </div>
            ) : (
              <div className="divide-y divide-ink-700">
                {[...data.content.livePosts, ...data.content.posts].map((item) => (
                  <a
                    key={item.id}
                    href={item.content ? `/live/${item.publicId}` : `/post/${item.publicId}`}
                    className="p-4 flex items-center justify-between hover:bg-ink-700/50 transition-colors block"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {item.title || item.content?.substring(0, 50) || 'Untitled'}
                      </p>
                      <p className="text-sm text-gray-400">{formatDate(item.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">{item.viewCount}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Info */}
      <p className="text-xs text-gray-500 text-center mt-6">
        You earn 50% of every sale. Withdrawals are processed within 24-48 hours.
      </p>
    </div>
  )
}
