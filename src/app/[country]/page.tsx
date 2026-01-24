'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Lock,
  Eye,
  FileText,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Radio,
  Zap,
  Shield,
  Bell,
  Clock,
  Users,
  Star,
  CheckCircle,
  Camera,
  MapPin,
  DollarSign,
  BadgeCheck,
  ShoppingCart,
  Upload
} from 'lucide-react'
import { useCountry } from '@/lib/country-context'
import { Flag } from '@/components/Flag'

interface Stats {
  totalLeaks: number
  totalMessages: number
  totalViews: number
  leaksWithEvidence: number
  recentLeaksCount: number
  categoryStats: { name: string; slug: string; count: number }[]
  provinceStats: { province: string; count: number }[]
}

interface LivePost {
  publicId: string
  content: string
  category: string
  province: string | null
  city: string | null
  displayName: string
  isHappeningNow: boolean
  createdAt: string
}

export default function CountryHomePage() {
  const { country, config } = useCountry()
  const [stats, setStats] = useState<Stats | null>(null)
  const [livePosts, setLivePosts] = useState<LivePost[]>([])
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Mark as ready after hydration
    setIsReady(true)

    // Fetch stats
    fetch(`/api/stats?country=${country}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data)
        }
      })
      .catch(() => {})

    // Fetch latest live posts
    fetch(`/api/live?limit=3&happeningNow=true&country=${country}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLivePosts(data.data.posts.slice(0, 3))
        }
      })
      .catch(() => {})
  }, [country])

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  // Show loading state until hydrated
  if (!isReady) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // Global background for all countries
  const backgroundUrl = 'https://media.saleaks.co.za/global_back_ground.png?v=2'

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('${backgroundUrl}')` }}
    >
      {/* Dark overlay for readability */}
      <div className="bg-black/60 min-h-screen">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* SpillNova Brand Icon */}
            <div className="mb-6">
              <Image
                src="/icons/spillnova_floating.png"
                alt="SpillNova"
                width={140}
                height={140}
                className="mx-auto drop-shadow-2xl"
                priority
              />
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Flag countryCode={config.code} size="xl" />
              <span className="text-gray-400">{config.name}</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full mb-6">
              <BadgeCheck className="h-4 w-4 text-green-400" />
              <span className="text-green-400 font-medium text-sm">100% Authentic - Camera Captured Only</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Real Content Marketplace.<br />
              <span className="text-accent-gold">Sell. Buy. Verified.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-4 max-w-2xl mx-auto">
              {config.name}&apos;s marketplace for authentic videos and photos. Creators upload real content,
              buyers get verified media. Earn 50% when your content sells.
            </p>
            <p className="text-sm text-gray-400 mb-8 flex items-center justify-center gap-2">
              <BadgeCheck className="h-4 w-4 text-primary-400" />
              No AI-generated fakes - camera-only capture ensures authenticity
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${country}/upload`}
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors shadow-lg shadow-green-500/25"
              >
                <Upload className="h-5 w-5 mr-2" />
                Sell Your Content
              </Link>
              <Link
                href={`/${country}/browse`}
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/30"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Browse Content
              </Link>
              <Link
                href={`/${country}/live`}
                className="inline-flex items-center justify-center px-8 py-4 bg-red-500/80 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors border border-red-400/30"
              >
                <Radio className="h-5 w-5 mr-2 animate-pulse" />
                Live Feed
              </Link>
            </div>
          </div>
        </section>

      {/* Get Paid Section */}
      <section className="py-12 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-2xl p-6 md:p-8 border border-green-500/30 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                    Earn Money for Your Content
                  </h2>
                  <p className="text-gray-300">
                    Upload authentic videos and photos. Earn 50% every time someone purchases your content.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center px-4">
                  <div className="text-2xl font-bold text-green-400">50%</div>
                  <div className="text-xs text-gray-400">Revenue Share</div>
                </div>
                <Link
                  href={`/${country}/upload`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg"
                >
                  <Camera className="h-5 w-5" />
                  Start Earning
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Content Preview */}
      <section className="py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 rounded-2xl shadow-2xl overflow-hidden border border-red-500/30">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Live Content Feed</h2>
                  </div>
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full">
                    REAL-TIME
                  </span>
                </div>
                <Link
                  href={`/${country}/live`}
                  className="text-primary-400 hover:text-primary-300 font-medium text-sm flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="text-gray-400 mb-6">
                Fresh content from creators across {config.name}. Camera-captured, 100% authentic.
              </p>

              {livePosts.length > 0 ? (
                <div className="space-y-4">
                  {livePosts.map((post) => (
                    <Link
                      key={post.publicId}
                      href={`/${country}/live/${post.publicId}`}
                      className="block bg-ink-800/50 hover:bg-ink-700/50 rounded-xl p-4 transition-colors border border-ink-700 hover:border-ink-600"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {post.isHappeningNow && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                                <Radio className="h-3 w-3 animate-pulse" />
                                LIVE
                              </span>
                            )}
                            <span className="text-xs text-gray-500">{post.displayName}</span>
                            {(post.province || post.city) && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {[post.city, post.province].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>
                          <p className="text-white text-sm line-clamp-2">{post.content}</p>
                        </div>
                        <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(post.createdAt)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Radio className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No live posts at the moment</p>
                  <Link
                    href={`/${country}/upload`}
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    <Camera className="h-4 w-4" />
                    Upload Content
                  </Link>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-ink-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-400">
                  Fresh content uploaded regularly from creators across {config.name}
                </p>
                <Link
                  href={`/${country}/live`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 transition-all font-medium text-sm shadow-lg"
                >
                  <Radio className="h-4 w-4" />
                  Go to Live Feed
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Early Access Banner */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 p-[2px]">
            <div className="relative bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
                    <Zap className="h-7 w-7 md:h-8 md:w-8 text-ink-900" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 flex-wrap">
                      Premium Early Access
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30">
                        10 MIN HEAD START
                      </span>
                    </h2>
                    <p className="text-gray-400 mt-1">
                      Get new content <span className="text-amber-400 font-semibold">10 minutes before</span> the public.
                      Perfect for media buyers and content curators.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/${country}/pricing`}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-ink-900 font-semibold rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg hover:shadow-amber-500/25"
                >
                  <Star className="h-5 w-5" />
                  View Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Dashboard */}
      {stats && stats.totalLeaks > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/10">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Marketplace Activity
                </h2>
                <p className="text-gray-300">
                  Authentic content from creators across {config.name}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center p-4 rounded-xl bg-primary-500/20 border border-primary-500/30">
                  <div className="flex justify-center mb-2">
                    <FileText className="h-8 w-8 text-primary-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {stats.totalLeaks}
                  </div>
                  <div className="text-sm text-gray-300">Total Listings</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-green-500/20 border border-green-500/30">
                  <div className="flex justify-center mb-2">
                    <BarChart3 className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {stats.leaksWithEvidence}
                  </div>
                  <div className="text-sm text-gray-300">With Media</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-500/20 border border-blue-500/30">
                  <div className="flex justify-center mb-2">
                    <Eye className="h-8 w-8 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {stats.totalViews.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-300">Total Views</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-amber-500/20 border border-amber-500/30">
                  <div className="flex justify-center mb-2">
                    <TrendingUp className="h-8 w-8 text-amber-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {stats.recentLeaksCount}
                  </div>
                  <div className="text-sm text-gray-300">Last 30 Days</div>
                </div>
              </div>

              {/* Top Categories */}
              {stats.categoryStats.length > 0 && (
                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4 text-center">
                    Top Categories
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {stats.categoryStats.filter(c => c.count > 0).slice(0, 6).map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/${country}/browse?category=${cat.slug}`}
                        className="inline-flex items-center px-4 py-2 bg-white/10 text-gray-200 rounded-full hover:bg-primary-500/30 hover:text-white transition-colors border border-white/10"
                      >
                        {cat.name}
                        <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                          {cat.count}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Why Use SpillNova */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why SpillNova?
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              The marketplace for authentic content. Real videos, real photos, real earnings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Earn Money</h3>
              <p className="text-gray-300 text-sm">
                Get 50% of every sale. Withdraw anytime once you reach R10 minimum.
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Reach Buyers</h3>
              <p className="text-gray-300 text-sm">
                Your content is seen by media buyers, publishers, and content creators looking for authentic footage.
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/30 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BadgeCheck className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">100% Authentic</h3>
              <p className="text-gray-300 text-sm">
                Camera-only capture means no AI fakes. Your content is verified real and trusted.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Sellers */}
            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-sm rounded-2xl p-8 border border-green-500/40 relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                EARN 50%
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">For Sellers</h3>
                  <span className="text-xs text-green-400 font-medium">CONTENT CREATORS</span>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Upload your authentic videos and photos. Set your price or let buyers bid.
                Earn 50% of every sale with instant notifications.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Earn 50% of every sale
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Auction or fixed price options
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Instant publication
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Withdraw from R10
                </li>
              </ul>
              <Link
                href={`/${country}/upload`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-colors font-semibold shadow-lg shadow-green-500/25"
              >
                <Upload className="h-5 w-5" />
                Start Selling
              </Link>
            </div>

            {/* For Buyers */}
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">For Buyers</h3>
                  <span className="text-xs text-blue-400 font-medium">MEDIA & PUBLISHERS</span>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Find authentic videos and photos for your projects. Browse by category,
                bid on exclusive content, or purchase directly.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-blue-400" />
                  Verified authentic content
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-blue-400" />
                  Exclusive licensing available
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-blue-400" />
                  High-quality downloads
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-blue-400" />
                  Secure payment options
                </li>
              </ul>
              <Link
                href={`/${country}/browse`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
              >
                <Eye className="h-4 w-4" />
                Browse Content
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Authenticity & Security Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Authentic Content. Protected Distribution.
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Camera-only capture ensures 100% real content. No AI fakes, no filters, no manipulation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-6">
                <BadgeCheck className="h-6 w-6 text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Verified Authentic
              </h3>
              <p className="text-gray-300">
                All content is captured directly from device cameras. No AI-generated
                images or manipulated media allowed.
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Content Protection
              </h3>
              <p className="text-gray-300">
                Your content is protected with watermarks until purchased.
                Buyers get clean, high-quality downloads.
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-6">
                <Lock className="h-6 w-6 text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Metadata Stripping
              </h3>
              <p className="text-gray-300">
                All uploaded files have their metadata (EXIF data, location, device info)
                automatically removed for privacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-green-500/30">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-300">
                Upload content, set your price, and get paid when it sells.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  step: '1',
                  title: 'Capture',
                  description: 'Take photos or record video directly from your device camera.',
                  icon: Camera,
                },
                {
                  step: '2',
                  title: 'Upload',
                  description: 'Add your content with a title, description, and category.',
                  icon: Upload,
                },
                {
                  step: '3',
                  title: 'List',
                  description: 'Your content goes live for buyers to discover and purchase.',
                  icon: Eye,
                },
                {
                  step: '4',
                  title: 'Earn',
                  description: 'Get 50% of every sale. Withdraw from R10.',
                  icon: DollarSign,
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
                    <item.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href={`/${country}/upload`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/25 text-lg"
              >
                <Upload className="h-5 w-5" />
                Start Selling Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* For Buyers Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-ink-900 to-ink-800 rounded-2xl p-8 md:p-12 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5"></div>
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-6 w-6 text-primary-400" />
                  <span className="text-primary-400 font-medium">For Media Buyers</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Get Verified Access
                </h2>
                <p className="text-gray-300 mb-6 max-w-xl">
                  Create a buyer account to access exclusive content, bid on auctions,
                  and get early access to new uploads.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href={`/${country}/buyer`}
                    className="inline-flex items-center px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                  >
                    Create Buyer Account
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                  <Link
                    href={`/${country}/pricing`}
                    className="inline-flex items-center px-5 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium border border-white/20"
                  >
                    View Premium Plans
                  </Link>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <Zap className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold">10 min</div>
                    <div className="text-xs text-gray-400">Early Access</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <MessageSquare className="h-8 w-8 text-primary-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold">Direct</div>
                    <div className="text-xs text-gray-400">Contact</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <Bell className="h-8 w-8 text-red-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold">Instant</div>
                    <div className="text-xs text-gray-400">Alerts</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <Shield className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold">Verified</div>
                    <div className="text-xs text-gray-400">Content</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get Alerts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-500/30 rounded-xl flex items-center justify-center border border-primary-400/30">
                  <Bell className="h-7 w-7 text-primary-400" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">
                    Stay Informed
                  </h2>
                  <p className="text-gray-300">
                    Get email or SMS alerts when new content is uploaded in your categories of interest.
                  </p>
                </div>
              </div>
              <Link
                href={`/${country}/subscribe`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500/80 text-white rounded-xl hover:bg-primary-500 transition-colors font-medium border border-primary-400/30"
              >
                <Bell className="h-5 w-5" />
                Subscribe to Alerts
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-green-500/30">
            <Image
              src="/icons/spillnova_floating.png"
              alt="SpillNova"
              width={180}
              height={180}
              className="mx-auto mb-6 drop-shadow-2xl"
            />
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Your Content. Your Earnings.
            </h2>
            <p className="text-xl text-gray-300 mb-4">
              Join {config.name}&apos;s marketplace for authentic content.
              Upload your videos and photos, and earn when buyers purchase.
            </p>
            <div className="flex items-center justify-center gap-4 mb-8 text-sm">
              <span className="flex items-center gap-1 text-green-400">
                <DollarSign className="h-4 w-4" />
                50% Revenue Share
              </span>
              <span className="text-gray-500">|</span>
              <span className="flex items-center gap-1 text-primary-400">
                <BadgeCheck className="h-4 w-4" />
                100% Authentic
              </span>
              <span className="text-gray-500">|</span>
              <span className="flex items-center gap-1 text-blue-400">
                <Zap className="h-4 w-4" />
                Instant Publish
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${country}/upload`}
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors text-lg shadow-lg shadow-green-500/25"
              >
                <Upload className="h-6 w-6 mr-2" />
                Start Selling
              </Link>
              <Link
                href={`/${country}/browse`}
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors text-lg border border-white/30"
              >
                <ShoppingCart className="h-6 w-6 mr-2" />
                Browse Content
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  )
}
