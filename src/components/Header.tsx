'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, FileText, Search, Bell, Radio, User, Globe, ShoppingBag, MessageSquare, Lightbulb, Building2 } from 'lucide-react'
import { countries, DEFAULT_COUNTRY, CountryConfig } from '@/lib/countries'
import { Flag } from '@/components/Flag'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Extract country from URL path (e.g., /ng/browse -> ng)
  const pathCountry = pathname?.split('/')[1] || DEFAULT_COUNTRY
  const country = countries[pathCountry] ? pathCountry : DEFAULT_COUNTRY
  const config: CountryConfig = countries[country] || countries[DEFAULT_COUNTRY]

  // Ensure component is mounted before rendering to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] shadow-lg border-b border-white/10 isolate ${
        isMenuOpen ? 'bg-black' : 'bg-black/95 backdrop-blur-md'
      }`}
      suppressHydrationWarning
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${country}`} className="flex items-center gap-2">
            <Image
              src="/icons/globecon.png"
              alt="SpillNova"
              width={40}
              height={40}
              priority
            />
            <span className="text-xl font-bold text-white">
              Spill<span className="text-primary-400">Nova</span>
            </span>
            <Flag countryCode={config.code} size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href={`/${country}/live`}
              className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition-colors font-medium"
            >
              <Radio className="h-4 w-4 animate-pulse" />
              <span>Live</span>
            </Link>
            <Link
              href={`/${country}/browse`}
              className="flex items-center space-x-1 text-gray-300 hover:text-primary-400 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Browse</span>
            </Link>
            <Link
              href={`/${country}/directory`}
              className="flex items-center space-x-1 text-green-400 hover:text-green-300 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              <span>Directory</span>
            </Link>
            <Link
              href={`/${country}/discussions`}
              className="flex items-center space-x-1 text-amber-400 hover:text-amber-300 transition-colors font-medium"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Discussions</span>
            </Link>
            <Link
              href={`/${country}/suggestions`}
              className="flex items-center space-x-1 text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
              <span>Suggestions</span>
            </Link>
            <Link
              href={`/${country}/how-it-works`}
              className="flex items-center space-x-1 text-gray-300 hover:text-primary-400 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>How It Works</span>
            </Link>
            <Link
              href={`/${country}/subscribe`}
              className="flex items-center space-x-1 text-gray-300 hover:text-primary-400 transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span>Alerts</span>
            </Link>
            <Link
              href={`/${country}/buyer`}
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Buyer</span>
            </Link>
            <Link
              href={`/${country}/account`}
              className="flex items-center space-x-1 text-gray-300 hover:text-primary-400 transition-colors"
            >
              <User className="h-4 w-4" />
              <span>Account</span>
            </Link>
            <Link
              href="/?change=true"
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-300 transition-colors"
              title="Change Region"
            >
              <Globe className="h-4 w-4" />
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mounted && isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 bg-black">
            <nav className="flex flex-col space-y-4">
              <Link
                href={`/${country}/live`}
                className="flex items-center space-x-2 text-red-400 hover:text-red-300 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <Radio className="h-5 w-5 animate-pulse" />
                <span>Live Billboard</span>
              </Link>
              <Link
                href={`/${country}/browse`}
                className="flex items-center space-x-2 text-gray-300 hover:text-primary-400"
                onClick={() => setIsMenuOpen(false)}
              >
                <Search className="h-5 w-5" />
                <span>Browse Content</span>
              </Link>
              <Link
                href={`/${country}/directory`}
                className="flex items-center space-x-2 text-green-400 hover:text-green-300"
                onClick={() => setIsMenuOpen(false)}
              >
                <Building2 className="h-5 w-5" />
                <span>Business Directory</span>
              </Link>
              <Link
                href={`/${country}/discussions`}
                className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <MessageSquare className="h-5 w-5" />
                <span>Discussions</span>
              </Link>
              <Link
                href={`/${country}/suggestions`}
                className="flex items-center space-x-2 text-yellow-400 hover:text-yellow-300"
                onClick={() => setIsMenuOpen(false)}
              >
                <Lightbulb className="h-5 w-5" />
                <span>Suggestions</span>
              </Link>
              <Link
                href={`/${country}/how-it-works`}
                className="flex items-center space-x-2 text-gray-300 hover:text-primary-400"
                onClick={() => setIsMenuOpen(false)}
              >
                <FileText className="h-5 w-5" />
                <span>How It Works</span>
              </Link>
              <Link
                href={`/${country}/subscribe`}
                className="flex items-center space-x-2 text-gray-300 hover:text-primary-400"
                onClick={() => setIsMenuOpen(false)}
              >
                <Bell className="h-5 w-5" />
                <span>Get Alerts</span>
              </Link>
              <Link
                href={`/${country}/buyer`}
                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingBag className="h-5 w-5" />
                <span>Buyer Portal</span>
              </Link>
              <Link
                href={`/${country}/account`}
                className="flex items-center space-x-2 text-gray-300 hover:text-primary-400"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="h-5 w-5" />
                <span>My Account</span>
              </Link>
              <Link
                href="/?change=true"
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-300 pt-4 border-t border-white/10"
                onClick={() => setIsMenuOpen(false)}
              >
                <Globe className="h-5 w-5" />
                <span>Change Region ({config.name})</span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
