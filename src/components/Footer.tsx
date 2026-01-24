import Link from 'next/link'
import Image from 'next/image'
import { Lock, Eye } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-ink-900 text-ink-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <Image
                src="/icons/globecon.png"
                alt="SpillNova"
                width={80}
                height={80}
                className="rounded-xl"
              />
            </div>
            <p className="text-sm text-ink-400 mb-4">
              A global platform to anonymously expose corruption, fraud, and misconduct.
              Your identity is protected - we do not log IP addresses or require any personal information.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1 text-xs text-ink-500">
                <Lock className="h-4 w-4" />
                <span>No IP Logging</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-ink-500">
                <Eye className="h-4 w-4" />
                <span>No Tracking</span>
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
                  Live Billboard
                </Link>
              </li>
              <li>
                <Link href="/browse" className="text-sm hover:text-primary-400 transition-colors">
                  Browse Leaks
                </Link>
              </li>
              <li>
                <Link href="/submit" className="text-sm hover:text-primary-400 transition-colors">
                  Submit a Leak
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
                <Link href="/journalists" className="text-sm hover:text-primary-400 transition-colors">
                  For Journalists
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm hover:text-primary-400 transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Security */}
          <div>
            <h3 className="text-sm font-semibold text-ink-50 uppercase tracking-wider mb-4">
              Your Safety
            </h3>
            <ul className="space-y-2 text-sm text-ink-400">
              <li>No account required</li>
              <li>Files are stripped of metadata</li>
              <li>Anonymous messaging system</li>
              <li>
                <Link href="/canary" className="text-primary-400 hover:text-primary-300">
                  Warrant Canary
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-ink-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-ink-500">
              Protected under the Protected Disclosures Act (PDA) of South Africa
            </p>
            <p className="text-xs text-ink-500 mt-2 md:mt-0">
              Speak up. Stay safe. Make a difference.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
