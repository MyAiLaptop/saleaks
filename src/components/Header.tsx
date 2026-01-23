'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, FileText, Search, AlertTriangle, Bell, Radio, User, Globe } from 'lucide-react'
import { useCountry } from '@/lib/country-context'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Get country from context - will use default if not in country route
  const { country, config } = useCountry()

  // Ensure component is mounted before rendering to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] bg-black/95 backdrop-blur-md shadow-lg border-b border-white/10 isolate"
      suppressHydrationWarning
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${country}`} className="flex items-center gap-2">
            <Image
              src="/icons/icon-512x512.png"
              alt="Leakpoint"
              width={56}
              height={56}
              className="rounded-lg"
              priority
            />
            <span className="text-xl">{config.flag}</span>
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
              <span>Browse Leaks</span>
            </Link>
            <Link
              href={`/${country}/submit`}
              className="flex items-center space-x-1 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Submit a Leak</span>
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
              href={`/${country}/account`}
              className="flex items-center space-x-1 text-gray-300 hover:text-primary-400 transition-colors"
            >
              <User className="h-4 w-4" />
              <span>Account</span>
            </Link>
            <Link
              href="/"
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
          <div className="md:hidden py-4 border-t border-white/10">
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
                <span>Browse Leaks</span>
              </Link>
              <Link
                href={`/${country}/submit`}
                className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 w-fit"
                onClick={() => setIsMenuOpen(false)}
              >
                <AlertTriangle className="h-5 w-5" />
                <span>Submit a Leak</span>
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
                href={`/${country}/account`}
                className="flex items-center space-x-2 text-gray-300 hover:text-primary-400"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="h-5 w-5" />
                <span>My Account</span>
              </Link>
              <Link
                href="/"
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
