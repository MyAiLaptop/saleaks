'use client'

import { useState, useEffect } from 'react'
import { SubmitterLogin } from '@/components/SubmitterLogin'
import { SubmitterDashboard } from '@/components/SubmitterDashboard'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useCountry } from '@/lib/country-context'

export default function CountryAccountPage() {
  const { country, config } = useCountry()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checking, setChecking] = useState(true)

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/submitter/account')
        const data = await res.json()

        if (data.success) {
          setIsLoggedIn(true)
        }
      } catch {
        // Not logged in
      } finally {
        setChecking(false)
      }
    }

    checkAuth()
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-900">
      {/* Header */}
      <header className="border-b border-ink-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${country}`} className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-xl">{config.flag}</span>
            Leak<span className="text-primary-400">point</span>
          </Link>
          <Link href={`/${country}/live`} className="text-gray-400 hover:text-white transition-colors">
            Back to Live
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {isLoggedIn ? (
          <SubmitterDashboard onLogout={() => setIsLoggedIn(false)} />
        ) : (
          <div className="py-8">
            <SubmitterLogin
              onLoginSuccess={() => setIsLoggedIn(true)}
            />

            {/* Info Section */}
            <div className="mt-8 max-w-md mx-auto">
              <div className="bg-ink-800/50 rounded-xl p-6 border border-ink-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  How it works
                </h3>
                <ul className="space-y-3 text-gray-400 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500/20 text-primary-400 rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span>Submit content with your phone number to enable revenue sharing</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500/20 text-primary-400 rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <span>When someone buys your content, you earn 50% of the sale</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500/20 text-primary-400 rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <span>Sign in with your phone number to view and withdraw your earnings</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
