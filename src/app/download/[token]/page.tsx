'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Download, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface PurchaseStatus {
  id: string
  status: string
  amount: number
  currency: string
  downloadsUsed: number
  maxDownloads: number
  expiresAt: string
  isExpired: boolean
  downloadsRemaining: number
  canDownload: boolean
}

export default function DownloadPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = params.token as string
  const success = searchParams.get('success') === 'true'

  const [purchase, setPurchase] = useState<PurchaseStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    async function fetchPurchase() {
      try {
        const res = await fetch(`/api/media/purchase?token=${token}`)
        const data = await res.json()

        if (data.success) {
          setPurchase(data.data)
        } else {
          setError(data.error || 'Failed to load purchase')
        }
      } catch (err) {
        setError('Failed to load purchase status')
      } finally {
        setLoading(false)
      }
    }

    fetchPurchase()
  }, [token])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/media/download?token=${token}`)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Download failed')
      }

      // Get filename from Content-Disposition header
      const disposition = res.headers.get('Content-Disposition')
      const filenameMatch = disposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : 'download'

      // Create blob and download
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Refresh purchase status
      const statusRes = await fetch(`/api/media/purchase?token=${token}`)
      const statusData = await statusRes.json()
      if (statusData.success) {
        setPurchase(statusData.data)
      }
    } catch (err: any) {
      setError(err.message || 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading purchase details...</p>
        </div>
      </div>
    )
  }

  if (error && !purchase) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center p-4">
        <div className="bg-ink-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Download Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center p-4">
      <div className="bg-ink-800 rounded-2xl p-8 max-w-md w-full">
        {/* Success banner */}
        {success && purchase?.status === 'COMPLETED' && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
            <p className="text-green-300 text-sm">Payment successful! Your media is ready for download.</p>
          </div>
        )}

        {/* Status icon */}
        <div className="text-center mb-6">
          {purchase?.status === 'COMPLETED' ? (
            <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="h-10 w-10 text-primary-400" />
            </div>
          ) : purchase?.status === 'PENDING' ? (
            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-10 w-10 text-yellow-400" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-10 w-10 text-red-400" />
            </div>
          )}

          <h1 className="text-2xl font-bold text-white mb-2">
            {purchase?.status === 'COMPLETED'
              ? 'Download Your Media'
              : purchase?.status === 'PENDING'
              ? 'Payment Pending'
              : 'Payment Issue'}
          </h1>
        </div>

        {/* Purchase details */}
        {purchase && (
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Amount Paid</span>
              <span className="text-white font-medium">
                R{(purchase.amount / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Downloads Used</span>
              <span className="text-white font-medium">
                {purchase.downloadsUsed} / {purchase.maxDownloads}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Expires</span>
              <span className="text-white font-medium">
                {new Date(purchase.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Download button */}
        {purchase?.canDownload ? (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Download Watermark-Free Media
              </>
            )}
          </button>
        ) : purchase?.status === 'PENDING' ? (
          <div className="text-center">
            <p className="text-gray-400 mb-4">
              Your payment is being processed. This page will update automatically.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-ink-700 text-white rounded-lg hover:bg-ink-600 transition-colors"
            >
              Refresh Status
            </button>
          </div>
        ) : purchase?.isExpired ? (
          <p className="text-center text-red-400">
            This download link has expired. Please contact support if you need assistance.
          </p>
        ) : purchase?.downloadsRemaining === 0 ? (
          <p className="text-center text-yellow-400">
            You have reached your download limit. Contact support if you need additional downloads.
          </p>
        ) : null}

        {/* Back link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            Return to SA Leaks
          </Link>
        </div>
      </div>
    </div>
  )
}
