'use client'

import { useState } from 'react'
import { ShoppingCart, X, Loader2 } from 'lucide-react'

interface PurchaseButtonProps {
  mediaId: string
  mediaType: 'file' | 'live'
  price?: number // Price in cents, null = default pricing
  className?: string
}

export function PurchaseButton({ mediaId, mediaType, price, className = '' }: PurchaseButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Default prices in Rands
  const defaultImagePrice = 50
  const defaultVideoPrice = 150
  const displayPrice = price ? price / 100 : null

  const handlePurchase = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/media/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mediaType, mediaId })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Purchase failed')
      }

      // If PayFast is configured, redirect to payment
      if (data.data.paymentUrl && data.data.paymentData) {
        // Create and submit a form to PayFast
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = data.data.paymentUrl

        for (const [key, value] of Object.entries(data.data.paymentData)) {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = value as string
          form.appendChild(input)
        }

        document.body.appendChild(form)
        form.submit()
      } else if (data.data.demoMode) {
        // Demo mode - show download link directly
        alert(`Demo mode: Your download token is ${data.data.downloadToken}\n\nIn production, you would be redirected to PayFast to complete payment.`)
        setIsOpen(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate purchase')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors ${className}`}
      >
        <ShoppingCart className="h-4 w-4" />
        <span>
          {displayPrice ? `Buy R${displayPrice.toFixed(0)}` : 'Buy without watermark'}
        </span>
      </button>

      {/* Purchase Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-ink-800 rounded-2xl p-6 max-w-md w-full relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-semibold text-white mb-2">
              Purchase Watermark-Free Media
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Get the original high-quality file without any watermarks for professional use.
            </p>

            {/* Pricing Info */}
            <div className="bg-ink-700 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Price</span>
                <span className="text-2xl font-bold text-white">
                  R{displayPrice || `${defaultImagePrice} - ${defaultVideoPrice}`}
                </span>
              </div>
              {!displayPrice && (
                <p className="text-xs text-gray-500 mt-1">
                  Images: R{defaultImagePrice} | Videos: R{defaultVideoPrice}
                </p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6 text-sm">
              <li className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                No watermarks
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                Original quality
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                3 downloads included
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                50% goes to the submitter
              </li>
            </ul>

            {/* Email Input */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Email address (for download link)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Purchase Button */}
            <button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  Proceed to Payment
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Secure payment via PayFast. You'll receive a download link via email.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
