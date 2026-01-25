'use client'

import { useState } from 'react'
import { ShoppingCart, X, Loader2, CreditCard, Smartphone, Check, Globe } from 'lucide-react'

type PaymentMethod = 'payfast' | 'carrier' | 'flutterwave'

interface PurchaseButtonProps {
  mediaId: string
  mediaType: 'file' | 'live'
  price?: number // Price in cents, null = default pricing
  className?: string
}

export function PurchaseButton({ mediaId, mediaType, price, className = '' }: PurchaseButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('flutterwave') // Default to Flutterwave for Africa
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [carrierMessage, setCarrierMessage] = useState<string | null>(null)

  // Default prices in Rands
  const defaultImagePrice = 1
  const defaultVideoPrice = 3
  const displayPrice = price ? price / 100 : null

  const handlePurchase = async () => {
    setError(null)
    setCarrierMessage(null)

    if (paymentMethod === 'flutterwave') {
      // Flutterwave payment - requires email
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address')
        return
      }

      setLoading(true)

      try {
        const res = await fetch('/api/payments/flutterwave/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            phoneNumber: phoneNumber || undefined,
            mediaType,
            mediaId,
            countryCode: 'ZA', // Default to South Africa
          })
        })

        const data = await res.json()

        if (!data.success) {
          throw new Error(data.error || 'Purchase failed')
        }

        // Check if this is an owner download (free)
        if (data.data.isOwnerDownload) {
          window.location.href = `/download/${data.data.downloadToken}?success=true`
          return
        }

        // Redirect to Flutterwave payment page
        if (data.data.paymentUrl) {
          window.location.href = data.data.paymentUrl
        } else {
          throw new Error('Payment URL not received')
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initiate purchase'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    } else if (paymentMethod === 'payfast') {
      // PayFast payment - requires email
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address')
        return
      }

      setLoading(true)

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
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initiate purchase'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    } else {
      // Carrier billing - requires phone number
      if (!phoneNumber || phoneNumber.length < 10) {
        setError('Please enter a valid SA phone number')
        return
      }

      setLoading(true)

      try {
        const res = await fetch('/api/media/carrier-purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber, mediaType, mediaId })
        })

        const data = await res.json()

        if (!data.success) {
          throw new Error(data.error || 'Purchase failed')
        }

        if (data.data.demoMode) {
          // Demo mode
          setCarrierMessage(data.data.message)
        } else if (data.data.confirmationRequired) {
          // Show message about SMS confirmation
          setCarrierMessage(data.data.message)
        } else {
          // Payment completed immediately (rare)
          window.location.href = `/download/${data.data.downloadToken}`
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initiate purchase'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
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

            {/* Payment Method Selection */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Payment method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('flutterwave')}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    paymentMethod === 'flutterwave'
                      ? 'border-primary-500 bg-primary-500/20'
                      : 'border-ink-600 bg-ink-700 hover:border-ink-500'
                  }`}
                >
                  <Globe className="h-5 w-5 text-primary-400" />
                  <div className="text-left flex-1">
                    <div className="text-white text-sm font-medium">Card/Mobile</div>
                    <div className="text-gray-500 text-xs">Flutterwave</div>
                  </div>
                  {paymentMethod === 'flutterwave' && (
                    <Check className="h-4 w-4 text-primary-400" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('carrier')}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    paymentMethod === 'carrier'
                      ? 'border-primary-500 bg-primary-500/20'
                      : 'border-ink-600 bg-ink-700 hover:border-ink-500'
                  }`}
                >
                  <Smartphone className="h-5 w-5 text-primary-400" />
                  <div className="text-left flex-1">
                    <div className="text-white text-sm font-medium">Airtime</div>
                    <div className="text-gray-500 text-xs">Phone bill</div>
                  </div>
                  {paymentMethod === 'carrier' && (
                    <Check className="h-4 w-4 text-primary-400" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('payfast')}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    paymentMethod === 'payfast'
                      ? 'border-primary-500 bg-primary-500/20'
                      : 'border-ink-600 bg-ink-700 hover:border-ink-500'
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-primary-400" />
                  <div className="text-left flex-1">
                    <div className="text-white text-sm font-medium">Card/EFT</div>
                    <div className="text-gray-500 text-xs">PayFast</div>
                  </div>
                  {paymentMethod === 'payfast' && (
                    <Check className="h-4 w-4 text-primary-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Conditional Input based on payment method */}
            {paymentMethod === 'carrier' ? (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Phone number (Vodacom, MTN, Telkom, Cell C)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="0821234567"
                  maxLength={12}
                  className="w-full px-4 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Amount will be charged to your airtime or added to your bill
                </p>
              </div>
            ) : (
              <div className="mb-4 space-y-3">
                <div>
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
                {paymentMethod === 'flutterwave' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Phone number (optional - for mobile money)
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="0821234567"
                      maxLength={12}
                      className="w-full px-4 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            {carrierMessage && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Check your phone!</p>
                    <p className="mt-1">{carrierMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase Button */}
            {!carrierMessage && (
              <button
                type="button"
                onClick={handlePurchase}
                disabled={loading}
                className="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : paymentMethod === 'carrier' ? (
                  <>
                    <Smartphone className="h-5 w-5" />
                    Pay with Airtime/Bill
                  </>
                ) : paymentMethod === 'flutterwave' ? (
                  <>
                    <Globe className="h-5 w-5" />
                    Pay with Flutterwave
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    Proceed to PayFast
                  </>
                )}
              </button>
            )}

            {carrierMessage && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-ink-700 text-white rounded-lg font-semibold hover:bg-ink-600 transition-colors"
              >
                Close
              </button>
            )}

            <p className="text-xs text-gray-500 text-center mt-4">
              {paymentMethod === 'carrier'
                ? 'Payment via your mobile carrier. Confirm via SMS to complete purchase.'
                : paymentMethod === 'flutterwave'
                ? 'Secure payment via Flutterwave. Card, bank transfer, or mobile money accepted.'
                : 'Secure payment via PayFast. You\'ll receive a download link via email.'
              }
            </p>
          </div>
        </div>
      )}
    </>
  )
}
