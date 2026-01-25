'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Globe, ArrowRight, Radio, Camera, BadgeCheck, Play, X } from 'lucide-react'
import { countries, getEnabledCountries, DEFAULT_COUNTRY } from '@/lib/countries'
import { Flag } from '@/components/Flag'

export default function GlobalLandingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isReady, setIsReady] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
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
      style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png?v=2')" }}
    >
      <div className="bg-black/70 min-h-screen">
        {/* Header */}
        <header className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowVideo(true)}
                className="relative group cursor-pointer"
                aria-label="Watch SpillNova video"
              >
                <Image
                  src="/icons/spillnova_floating.png"
                  alt="SpillNova"
                  width={350}
                  height={350}
                  className="drop-shadow-2xl transition-transform group-hover:scale-105"
                  priority
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 group-hover:bg-white/30 transition-all group-hover:scale-110">
                    <Play className="h-12 w-12 text-white fill-white" />
                  </div>
                </div>
                {/* Watch video text */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                  Watch Video
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Video Modal */}
        {showVideo && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setShowVideo(false)}
          >
            <div
              className="relative w-full max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowVideo(false)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                aria-label="Close video"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="aspect-video">
                <video
                  src="https://media.saleaks.co.za/SpillNova.mp4"
                  controls
                  autoPlay
                  className="w-full h-full rounded-lg shadow-2xl"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Hero */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full mb-6">
              <BadgeCheck className="h-4 w-4 text-green-400" />
              <span className="text-green-400 font-medium text-sm">100% Authentic Content - No AI Fakes</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Real Content Marketplace.<br />
              <span className="text-accent-gold">Sell. Buy. Verified.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              The marketplace for authentic videos and photos. Real-time camera capture only,
              buyers get verified media. No uploads allowed - prevents AI-generated fakes.
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
                    type="button"
                    onClick={() => handleCountrySelect(code)}
                    className="flex items-center gap-4 p-4 bg-ink-800 hover:bg-ink-700 rounded-xl border border-ink-600 hover:border-primary-500 transition-all group"
                  >
                    <Flag countryCode={config.code} size="lg" />
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
                          <Flag countryCode={config.code} size="sm" />
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
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <BadgeCheck className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">100% Authentic</h3>
                <p className="text-gray-400 text-sm">
                  Real-time camera capture only. No uploads allowed - guaranteed authentic content.
                </p>
              </div>

              <div className="bg-ink-900/60 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Camera className="h-6 w-6 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Browse Content</h3>
                <p className="text-gray-400 text-sm">
                  Find authentic videos and photos for your projects or publication.
                </p>
              </div>

              <div className="bg-ink-900/60 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Radio className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Live Feed</h3>
                <p className="text-gray-400 text-sm">
                  Real-time content from citizen creators capturing what&apos;s happening now.
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
                <Flag countryCode={countries[DEFAULT_COUNTRY].code} size="md" />
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
                  src="/icons/spillnova_floating.png"
                  alt="SpillNova"
                  width={48}
                  height={48}
                  className="drop-shadow-lg"
                />
                <span className="text-gray-400 text-sm">
                  SpillNova - Real Content Marketplace
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms
                </Link>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
