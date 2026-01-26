'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  Radio,
  Search,
  Building2,
  Store,
  MessageSquare,
  Lightbulb,
  FileText,
  Bell,
  ShoppingBag,
  User,
  Globe,
  Plus,
} from 'lucide-react'
import { countries, DEFAULT_COUNTRY, CountryConfig } from '@/lib/countries'
import { Flag } from '@/components/Flag'

interface MobileNavProps {
  isMenuOpen: boolean
  onMenuToggle: () => void
}

export function MobileNav({ isMenuOpen, onMenuToggle }: MobileNavProps) {
  const pathname = usePathname()

  // Extract country from URL path
  const pathCountry = pathname?.split('/')[1] || DEFAULT_COUNTRY
  const country = countries[pathCountry] ? pathCountry : DEFAULT_COUNTRY
  const config: CountryConfig = countries[country] || countries[DEFAULT_COUNTRY]

  const navItems = [
    { href: `/${country}/live`, icon: Radio, label: 'Live Billboard', color: 'text-red-400' },
    { href: `/${country}/browse`, icon: Search, label: 'Browse', color: 'text-gray-300' },
    { href: `/${country}/marketplace`, icon: Store, label: 'Marketplace', color: 'text-emerald-400' },
    { href: `/${country}/directory`, icon: Building2, label: 'Directory', color: 'text-green-400' },
    { href: `/${country}/discussions`, icon: MessageSquare, label: 'Discussions', color: 'text-amber-400' },
    { href: `/${country}/suggestions`, icon: Lightbulb, label: 'Suggestions', color: 'text-yellow-400' },
    { href: `/${country}/how-it-works`, icon: FileText, label: 'How It Works', color: 'text-gray-300' },
    { href: `/${country}/subscribe`, icon: Bell, label: 'Alerts', color: 'text-gray-300' },
    { href: `/${country}/buyer`, icon: ShoppingBag, label: 'Buyer Portal', color: 'text-blue-400' },
    { href: `/${country}/account`, icon: User, label: 'My Account', color: 'text-gray-300' },
  ]

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-ink-900/95 backdrop-blur-md border-b border-white/10">
        {/* Logo */}
        <Link href={`/${country}`} className="flex items-center gap-2">
          <Image
            src="/icons/globecon.png"
            alt="SpillNova"
            width={32}
            height={32}
            priority
          />
          <span className="text-lg font-bold text-white">
            Spill<span className="text-primary-400">Nova</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Report Button */}
          <Link
            href={`/${country}/live`}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            <span>Report</span>
          </Link>

          {/* Menu Toggle */}
          <button
            type="button"
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-gray-300 hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-ink-900/98 backdrop-blur-sm pt-16">
          <nav className="flex flex-col p-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMenuToggle}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-white/10 ' + item.color
                      : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${item.color}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}

            {/* Divider */}
            <div className="h-px bg-white/10 my-4" />

            {/* Change Region */}
            <Link
              href="/?change=true"
              onClick={onMenuToggle}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-500 hover:bg-white/5"
            >
              <Globe className="h-5 w-5" />
              <span className="font-medium">Change Region</span>
              <Flag countryCode={config.code} size="sm" />
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
