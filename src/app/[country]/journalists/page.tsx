'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Newspaper,
  Shield,
  Mail,
  Building2,
  Briefcase,
  Check,
  AlertTriangle,
  Loader2,
  BadgeCheck,
  MessageSquare,
  Lock,
  Zap,
  Radio,
  Star
} from 'lucide-react'
import { useCountry } from '@/lib/country-context'

export default function CountryJournalistsPage() {
  const { country } = useCountry()
  const [email, setEmail] = useState('')
  const [outlet, setOutlet] = useState('')
  const [role, setRole] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !outlet) return

    setSubmitting(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/journalists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, outlet, role, country }),
      })
      const data = await res.json()

      if (data.success) {
        setMessage(data.data.message)
        setSubmitted(true)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch {
      setError('Failed to submit registration')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png')" }}
    >
      <div className="bg-black/60 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link
            href={`/${country}`}
            className="inline-flex items-center text-gray-300 hover:text-primary-400 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Info Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary-500/20 border border-primary-500/30 rounded-xl flex items-center justify-center">
                  <Newspaper className="h-6 w-6 text-primary-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    For Journalists
                  </h1>
                  <p className="text-gray-400">
                    Get verified access to Leakpoint
                  </p>
                </div>
              </div>

              <div className="prose dark:prose-invert mb-8">
                <p className="text-gray-400">
                  Verified journalists get access to additional features that help
                  with investigations while maintaining source protection.
                </p>
              </div>

              {/* Premium Early Access Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 p-[2px] mb-6">
                <div className="relative bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
                      <Zap className="h-6 w-6 text-ink-900" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        10-Minute Head Start
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30">
                          PREMIUM
                        </span>
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Get access to <span className="text-amber-400 font-semibold">breaking news and live updates 10 minutes before</span> the public.
                        Be first to act on critical information from the Live Billboard.
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Radio className="h-4 w-4 text-red-400" />
                        <span className="text-xs text-gray-500">Works with Live Billboard real-time posts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
                  <BadgeCheck className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-white">Verified Badge</h3>
                    <p className="text-sm text-gray-400">
                      Your messages to whistleblowers show a verified journalist badge
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
                  <MessageSquare className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-white">Priority Contact</h3>
                    <p className="text-sm text-gray-400">
                      Whistleblowers can see you&apos;re a verified journalist before responding
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <Zap className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-white flex items-center gap-2">
                      Early Access
                      <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
                        10 MIN
                      </span>
                    </h3>
                    <p className="text-sm text-gray-400">
                      See new leaks and live posts before anyone else — act fast on breaking stories
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
                  <Lock className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-white">Source Protection</h3>
                    <p className="text-sm text-gray-400">
                      All communications remain anonymous and encrypted
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing Link */}
              <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-400" />
                    <span className="text-sm text-gray-300">
                      Want premium features?
                    </span>
                  </div>
                  <Link
                    href={`/${country}/pricing`}
                    className="text-sm font-medium text-primary-400 hover:text-primary-300"
                  >
                    View Plans →
                  </Link>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/10">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    Registration Submitted!
                  </h2>
                  <p className="text-gray-400 mb-6">
                    {message}
                  </p>
                  <p className="text-sm text-gray-500">
                    Our team will review your application and contact you once verified.
                    This usually takes 1-3 business days.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-white mb-6">
                    Register as a Journalist
                  </h2>

                  {/* Privacy notice */}
                  <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-primary-300">
                        <p className="font-medium mb-1">Verification Process</p>
                        <p className="text-primary-400">
                          We verify journalists through their professional email and news outlet.
                          Your email is encrypted and never shared with sources.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Professional Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="name@newsoutlet.co.za"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Use your work email for faster verification
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        News Outlet / Organization *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type="text"
                          value={outlet}
                          onChange={(e) => setOutlet(e.target.value)}
                          required
                          placeholder="e.g., Daily Maverick, News24"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Role / Title (Optional)
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type="text"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          placeholder="e.g., Investigative Reporter, Editor"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Messages */}
                    {error && (
                      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !email || !outlet}
                      className="w-full flex items-center justify-center px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Newspaper className="h-5 w-5 mr-2" />
                          Submit for Verification
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
