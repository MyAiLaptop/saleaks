'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
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
  Video,
  Heart,
  History,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { countries, DEFAULT_COUNTRY, CountryConfig } from '@/lib/countries'
import { Flag } from '@/components/Flag'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()

  // Extract country from URL path
  const pathCountry = pathname?.split('/')[1] || DEFAULT_COUNTRY
  const country = countries[pathCountry] ? pathCountry : DEFAULT_COUNTRY
  const config: CountryConfig = countries[country] || countries[DEFAULT_COUNTRY]

  const isActive = (path: string) => {
    return pathname?.startsWith(path)
  }

  const navItems = [
    {
      href: `/${country}/live`,
      icon: Radio,
      label: 'Live Billboard',
      color: 'text-red-400',
      activeColor: 'bg-red-500/20 text-red-400',
      pulse: true,
    },
    {
      href: `/${country}/browse`,
      icon: Search,
      label: 'Browse',
      color: 'text-gray-400',
      activeColor: 'bg-primary-500/20 text-primary-400',
    },
    {
      href: `/${country}/marketplace`,
      icon: Store,
      label: 'Marketplace',
      color: 'text-emerald-400',
      activeColor: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      href: `/${country}/directory`,
      icon: Building2,
      label: 'Directory',
      color: 'text-green-400',
      activeColor: 'bg-green-500/20 text-green-400',
    },
    {
      href: `/${country}/discussions`,
      icon: MessageSquare,
      label: 'Discussions',
      color: 'text-amber-400',
      activeColor: 'bg-amber-500/20 text-amber-400',
    },
  ]

  const secondaryItems = [
    {
      href: `/${country}/suggestions`,
      icon: Lightbulb,
      label: 'Suggestions',
      color: 'text-yellow-400',
      activeColor: 'bg-yellow-500/20 text-yellow-400',
    },
    {
      href: `/${country}/how-it-works`,
      icon: FileText,
      label: 'How It Works',
      color: 'text-gray-400',
      activeColor: 'bg-gray-500/20 text-gray-300',
    },
    {
      href: `/${country}/subscribe`,
      icon: Bell,
      label: 'Alerts',
      color: 'text-gray-400',
      activeColor: 'bg-gray-500/20 text-gray-300',
    },
  ]

  const userItems = [
    {
      href: `/${country}/buyer`,
      icon: ShoppingBag,
      label: 'Buyer Portal',
      color: 'text-blue-400',
      activeColor: 'bg-blue-500/20 text-blue-400',
    },
    {
      href: `/${country}/account`,
      icon: User,
      label: 'My Account',
      color: 'text-gray-400',
      activeColor: 'bg-gray-500/20 text-gray-300',
    },
  ]

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-white/10 bg-ink-900 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 ${isCollapsed ? 'justify-center' : ''}`}>
        <Link href={`/${country}`} className="flex items-center gap-2">
          <Image
            src="/icons/globecon.png"
            alt="SpillNova"
            width={40}
            height={40}
            priority
          />
          {!isCollapsed && (
            <>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-none">
                  Spill<span className="text-primary-400">Nova</span>
                </span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Creator Hub
                </span>
              </div>
              <Flag countryCode={config.code} size="sm" />
            </>
          )}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col gap-1 px-3 flex-grow">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-full transition-all ${
                active
                  ? item.activeColor
                  : `text-gray-400 hover:bg-white/5 hover:${item.color}`
              } ${isCollapsed ? 'justify-center px-3' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`h-5 w-5 ${item.pulse && active ? 'animate-pulse' : ''}`} />
              {!isCollapsed && (
                <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}

        {/* Divider */}
        <div className="h-px bg-white/10 my-4" />

        {/* Secondary Section */}
        {!isCollapsed && (
          <p className="px-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">
            Resources
          </p>
        )}
        {secondaryItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-full transition-all ${
                active
                  ? item.activeColor
                  : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
              } ${isCollapsed ? 'justify-center px-3' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4" />
              {!isCollapsed && (
                <span className={`text-sm ${active ? 'font-medium' : ''}`}>{item.label}</span>
              )}
            </Link>
          )
        })}

        {/* Divider */}
        <div className="h-px bg-white/10 my-4" />

        {/* User Section */}
        {!isCollapsed && (
          <p className="px-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">
            Your Account
          </p>
        )}
        {userItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-full transition-all ${
                active
                  ? item.activeColor
                  : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
              } ${isCollapsed ? 'justify-center px-3' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4" />
              {!isCollapsed && (
                <span className={`text-sm ${active ? 'font-medium' : ''}`}>{item.label}</span>
              )}
            </Link>
          )
        })}

        {/* Change Region */}
        <Link
          href="/?change=true"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-gray-600 hover:bg-white/5 hover:text-gray-400 transition-all ${
            isCollapsed ? 'justify-center px-3' : ''
          }`}
          title={isCollapsed ? `Change Region (${config.name})` : undefined}
        >
          <Globe className="h-4 w-4" />
          {!isCollapsed && <span className="text-sm">{config.name}</span>}
        </Link>
      </nav>

      {/* Bottom Action */}
      <div className="p-4 mt-auto">
        <Link
          href={`/${country}/live`}
          className={`w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 hover:from-red-600 hover:to-orange-600 shadow-lg shadow-red-500/20 transition-all ${
            isCollapsed ? 'px-3' : ''
          }`}
        >
          <Plus className="h-5 w-5" />
          {!isCollapsed && <span>Report Now</span>}
        </Link>

        {/* Collapse Toggle */}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="w-full mt-3 py-2 rounded-full text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-all flex items-center justify-center"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    </aside>
  )
}
