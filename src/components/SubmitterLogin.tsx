'use client'

import { useState } from 'react'
import { Phone, Loader2, ArrowRight, Lock, Eye, EyeOff, Mail, UserPlus } from 'lucide-react'

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

type AuthMode = 'login' | 'register' | 'forgot-password'

export function SubmitterLogin({ onLoginSuccess }: SubmitterLoginProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Format phone number for display
  const formatDisplayPhone = (phone: string) => {
    if (phone.length <= 3) return phone
    if (phone.length <= 6) return `${phone.slice(0, 3)} ${phone.slice(3)}`
    return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!phoneNumber || phoneNumber.length < 9) {
      setError('Please enter a valid phone number')
      return
    }

    if (!password) {
      setError('Please enter your password')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password }),
      })

      const data = await res.json()

      if (!data.success) {
        if (data.needsPasswordSetup) {
          setMode('forgot-password')
          setMessage('Please set a password for your account')
        }
        throw new Error(data.error || 'Failed to sign in')
      }

      onLoginSuccess(data.data)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!phoneNumber || phoneNumber.length < 9) {
      setError('Please enter a valid phone number')
      return
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password, email: email || undefined }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create account')
      }

      onLoginSuccess(data.data)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!phoneNumber && !email) {
      setError('Please enter your phone number or email')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber || undefined,
          email: email || undefined
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to send reset link')
      }

      setMessage(data.data.message)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset link'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setMessage(null)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-ink-800 rounded-xl p-6 border border-ink-700">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-full mb-4">
            {mode === 'register' ? (
              <UserPlus className="h-8 w-8 text-primary-400" />
            ) : mode === 'forgot-password' ? (
              <Mail className="h-8 w-8 text-primary-400" />
            ) : (
              <Phone className="h-8 w-8 text-primary-400" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white">
            {mode === 'register'
              ? 'Create Your Account'
              : mode === 'forgot-password'
              ? 'Reset Password'
              : 'Sign In to Your Account'}
          </h2>
          <p className="text-gray-400 mt-2">
            {mode === 'register'
              ? 'Enter your details to start earning'
              : mode === 'forgot-password'
              ? 'We\'ll send a reset link to your email'
              : 'Enter your phone number and password'}
          </p>
        </div>

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
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
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || phoneNumber.length < 9 || !password}
              className="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setMode('forgot-password')
                  resetForm()
                }}
                className="text-primary-400 hover:text-primary-300 transition-colors"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register')
                  resetForm()
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Create account
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister}>
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
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Email <span className="text-gray-600">(for password reset)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com (optional)"
                  className="w-full pl-12 pr-4 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full pl-12 pr-12 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must contain at least one letter and one number
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full pl-12 pr-4 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || phoneNumber.length < 9 || password.length < 8 || password !== confirmPassword}
              className="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  resetForm()
                }}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot-password' && (
          <form onSubmit={handleForgotPassword}>
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
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <div className="flex-1 h-px bg-ink-600"></div>
                <span>or</span>
                <div className="flex-1 h-px bg-ink-600"></div>
              </div>
              <label className="block text-sm text-gray-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-12 pr-4 py-3 bg-ink-700 border border-ink-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>
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
              disabled={loading || (!phoneNumber && !email)}
              className="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  resetForm()
                }}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Back to sign in
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
