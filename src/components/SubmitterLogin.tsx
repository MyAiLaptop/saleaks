'use client'

import { useState } from 'react'
import { Phone, Loader2, ArrowRight, KeyRound } from 'lucide-react'

interface SubmitterLoginProps {
  onLoginSuccess: (accountData: AccountData) => void
}

interface AccountData {
  accountId: string
  phoneNumber: string
  carrier: string | null
  balance: number
  totalEarned: number
  verified: boolean
  isNewAccount: boolean
}

export function SubmitterLogin({ onLoginSuccess }: SubmitterLoginProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Format phone number for display
  const formatDisplayPhone = (phone: string) => {
    if (phone.length <= 3) return phone
    if (phone.length <= 6) return `${phone.slice(0, 3)} ${phone.slice(3)}`
    return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    // Basic validation
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid SA phone number')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/submitter/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      setMessage(data.data.message)
      setStep('otp')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/submitter/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: otpCode }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Invalid code')
      }

      // Success - call the callback
      onLoginSuccess(data.data)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify code'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError(null)
    setOtpCode('')
    setLoading(true)

    try {
      const res = await fetch('/api/submitter/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to resend OTP')
      }

      setMessage('New code sent!')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-ink-800 rounded-xl p-6 border border-ink-700">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-full mb-4">
            {step === 'phone' ? (
              <Phone className="h-8 w-8 text-primary-400" />
            ) : (
              <KeyRound className="h-8 w-8 text-primary-400" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white">
            {step === 'phone' ? 'Sign In to Your Account' : 'Enter Verification Code'}
          </h2>
          <p className="text-gray-400 mt-2">
            {step === 'phone'
              ? 'Enter your phone number to access your earnings'
              : `We sent a code to ${formatDisplayPhone(phoneNumber)}`}
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  +27
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="82 123 4567"
                  maxLength={10}
                  className="w-full pl-14 pr-4 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Vodacom, MTN, Telkom, or Cell C
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || phoneNumber.length < 9}
              className="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending code...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                6-Digit Code
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:border-primary-500 font-mono"
                autoFocus
              />
            </div>

            {message && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Sign In'
              )}
            </button>

            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep('phone')
                  setOtpCode('')
                  setError(null)
                  setMessage(null)
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Change number
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-primary-400 hover:text-primary-300 transition-colors disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        <p className="text-xs text-gray-500 text-center mt-6">
          By signing in, you agree to our{' '}
          <a href="/terms" className="text-primary-400 hover:underline">Terms & Conditions</a>
        </p>
      </div>
    </div>
  )
}
