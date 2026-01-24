import Link from 'next/link'
import Image from 'next/image'
import { Shield, CheckCircle } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-ink-900 text-ink-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <Image
                src="/icons/spillnova_floating.png"
                alt="SpillNova"
                width={160}
                height={160}
                className="drop-shadow-2xl"
              />
            </div>
            <p className="text-sm text-ink-400 mb-4">
              The global marketplace for authentic video and photo content.
              Buy and sell real footage from real people, verified and protected.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1 text-xs text-ink-500">
                <CheckCircle className="h-4 w-4" />
                <span>Verified Real</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-ink-500">
                <Shield className="h-4 w-4" />
                <span>Content Protected</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-ink-50 uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/live" className="text-sm text-accent-red hover:text-red-300 transition-colors font-medium">
                  Live Feed
                </Link>
              </li>
              <li>
                <Link href="/browse" className="text-sm hover:text-primary-400 transition-colors">
                  Browse Content
                </Link>
              </li>
              <li>
                <Link href="/upload" className="text-sm hover:text-primary-400 transition-colors">
                  Sell Your Content
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-sm hover:text-primary-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/subscribe" className="text-sm hover:text-primary-400 transition-colors">
                  Get Alerts
                </Link>
              </li>
              <li>
                <Link href="/buyer" className="text-sm hover:text-primary-400 transition-colors">
                  For Buyers
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm hover:text-primary-400 transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-sm font-semibold text-ink-50 uppercase tracking-wider mb-4">
              Why SpillNova
            </h3>
            <ul className="space-y-2 text-sm text-ink-400">
              <li>100% real, verified content</li>
              <li>No AI-generated fakes</li>
              <li>Direct creator payments</li>
              <li>Global coverage</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-ink-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-ink-500">
              &copy; {new Date().getFullYear()} SpillNova. All rights reserved.
            </p>
            <p className="text-xs text-ink-500 mt-2 md:mt-0">
              Real content. Real value. Real simple.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
