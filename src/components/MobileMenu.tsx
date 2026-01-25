'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, FileText, Bell, Radio, ShoppingCart } from 'lucide-react'

export function MobileMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="md:hidden p-2 rounded-lg text-gray-300 hover:bg-white/10"
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-x-0 top-16 md:hidden bg-black/95 backdrop-blur-md border-b border-white/10 z-[99]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/live"
                className="flex items-center space-x-2 text-red-400 hover:text-red-300 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <Radio className="h-5 w-5 animate-pulse" />
                <span>Live Billboard</span>
              </Link>
              <Link
                href="/browse"
                className="flex items-center space-x-2 text-gray-300 hover:text-primary-400"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Browse Content</span>
              </Link>
              <Link
                href="/how-it-works"
                className="flex items-center space-x-2 text-gray-300 hover:text-primary-400"
                onClick={() => setIsMenuOpen(false)}
              >
                <FileText className="h-5 w-5" />
                <span>How It Works</span>
              </Link>
              <Link
                href="/subscribe"
                className="flex items-center space-x-2 text-gray-300 hover:text-primary-400"
                onClick={() => setIsMenuOpen(false)}
              >
                <Bell className="h-5 w-5" />
                <span>Get Alerts</span>
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
