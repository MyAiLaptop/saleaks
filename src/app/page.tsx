'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Globe, ArrowRight, Shield, Radio, AlertTriangle } from 'lucide-react'
import { countries, getEnabledCountries, DEFAULT_COUNTRY } from '@/lib/countries'

export default function GlobalLandingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isReady, setIsReady] = useState(false)
  const enabledCountries = getEnabledCountries()

  // Check if user is explicitly changing region
  const isChangingRegion = searchParams.get('change') === 'true'

  useEffect(() => {
    setIsReady(true)

    // If user explicitly wants to change region, clear preference and don't redirect
    if (isChangingRegion) {
      localStorage.removeItem('preferred_country')
      return
    }

    // Check if user has a saved country preference
    const savedCountry = localStorage.getItem('preferred_country')
    if (savedCountry && countries[savedCountry]?.enabled) {
      // Redirect to their preferred country
      router.push(`/${savedCountry}`)
      return
    }

    // If only one country is enabled, redirect directly
    const enabledCodes = Object.keys(enabledCountries)
    if (enabledCodes.length === 1) {
      router.push(`/${enabledCodes[0]}`)
    }
  }, [router, enabledCountries, isChangingRegion])

  const handleCountrySelect = (countryCode: string) => {
    // Save preference
    localStorage.setItem('preferred_country', countryCode)
    // Redirect to country
    router.push(`/${countryCode}`)
  }

  // Show loading while checking preferences
  if (!isReady) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // If only one country enabled, show loading (redirect happening)
  if (Object.keys(enabledCountries).length === 1) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/background.png')" }}
    >
      <div className="bg-black/70 min-h-screen">
        {/* Header */}
        <header className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <Image
                src="/icons/icon-512x512.png"
                alt="Leakpoint"
                width={64}
                height={64}
                className="rounded-xl"
                priority
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Hero */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Expose Corruption.<br />
              <span className="text-accent-gold">Stay Anonymous.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              A secure platform for whistleblowers and citizen journalists to report
              corruption, fraud, and breaking news — without revealing your identity.
            </p>

            {/* Country Selector */}
            <div className="bg-ink-900/80 backdrop-blur-md rounded-2xl p-8 border border-white/10 mb-12">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Globe className="h-6 w-6 text-primary-400" />
                <h2 className="text-2xl font-bold text-white">Select Your Region</h2>
              </div>
              <p className="text-gray-400 mb-8">
                Choose your country to access localized content, payment methods, and categories.
              </p>

              {/* Country Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {Object.entries(enabledCountries).map(([code, config]) => (
                  <button
                    key={code}
                    onClick={() => handleCountrySelect(code)}
                    className="flex items-center gap-4 p-4 bg-ink-800 hover:bg-ink-700 rounded-xl border border-ink-600 hover:border-primary-500 transition-all group"
                  >
                    <span className="text-4xl">{config.flag}</span>
                    <div className="text-left flex-1">
                      <div className="text-white font-semibold group-hover:text-primary-400 transition-colors">
                        {config.name}
                      </div>
                      <div className="text-gray-500 text-sm">
                        {config.currencySymbol} {config.currency}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-600 group-hover:text-primary-400 transition-colors" />
                  </button>
                ))}
              </div>

              {/* Coming Soon Countries */}
              {Object.keys(countries).length > Object.keys(enabledCountries).length && (
                <div className="mt-8 pt-8 border-t border-ink-700">
                  <p className="text-gray-500 text-sm mb-4">Coming soon to more regions:</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {Object.entries(countries)
                      .filter(([, config]) => !config.enabled)
                      .slice(0, 6)
                      .map(([code, config]) => (
                        <div
                          key={code}
                          className="flex items-center gap-2 px-3 py-2 bg-ink-800/50 rounded-lg text-gray-500 text-sm"
                        >
                          <span>{config.flag}</span>
                          <span>{config.name}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-ink-900/60 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Radio className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Live Billboard</h3>
                <p className="text-gray-400 text-sm">
                  Report breaking news in real-time. Traffic, protests, crime, and more.
                </p>
              </div>

              <div className="bg-ink-900/60 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <AlertTriangle className="h-6 w-6 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Anonymous Leaks</h3>
                <p className="text-gray-400 text-sm">
                  Submit corruption reports with full anonymity protection.
                </p>
              </div>

              <div className="bg-ink-900/60 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Shield className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Privacy First</h3>
                <p className="text-gray-400 text-sm">
                  No IP logging, no tracking, metadata stripping on all uploads.
                </p>
              </div>
            </div>

            {/* Quick Access for Default Country */}
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-4">Or go directly to:</p>
              <Link
                href={`/${DEFAULT_COUNTRY}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
              >
                <span className="text-xl">{countries[DEFAULT_COUNTRY].flag}</span>
                {countries[DEFAULT_COUNTRY].name}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/icons/icon-512x512.png"
                  alt="Leakpoint"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-gray-400 text-sm">
                  Leakpoint - Anonymous Whistleblowing Platform
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms
                </Link>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy
                </Link>
                <Link href="/canary" className="hover:text-white transition-colors">
                  Canary
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
