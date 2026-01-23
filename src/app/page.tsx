'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Lock,
  Eye,
  FileText,
  MessageSquare,
  AlertTriangle,
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
  MapPin
} from 'lucide-react'

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

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [livePosts, setLivePosts] = useState<LivePost[]>([])
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Mark as ready after hydration
    setIsReady(true)

    // Fetch stats
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data)
        }
      })
      .catch(() => {})

    // Fetch latest live posts
    fetch('/api/live?limit=3&happeningNow=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLivePosts(data.data.posts.slice(0, 3))
        }
      })
      .catch(() => {})
  }, [])

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

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/background.png')" }}
    >
      {/* Dark overlay for readability */}
      <div className="bg-black/60 min-h-screen">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Expose Corruption.<br />
              <span className="text-accent-gold">Stay Anonymous.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              South Africa&apos;s secure platform for whistleblowers and citizen journalists to report
              corruption, fraud, and breaking news — without revealing your identity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/live"
                className="inline-flex items-center justify-center px-8 py-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-lg"
              >
                <Radio className="h-5 w-5 mr-2 animate-pulse" />
                Live Billboard
              </Link>
              <Link
                href="/submit"
                className="inline-flex items-center justify-center px-8 py-4 bg-accent-gold text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition-colors shadow-lg"
              >
                <AlertTriangle className="h-5 w-5 mr-2" />
                Submit a Leak
              </Link>
              <Link
                href="/browse"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/30"
              >
                Browse Leaks
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </div>
          </div>
        </section>

      {/* Live Billboard Preview */}
      <section className="py-12 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 rounded-2xl shadow-2xl overflow-hidden border border-ink-700">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Live Billboard</h2>
                  </div>
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full">
                    REAL-TIME
                  </span>
                </div>
                <Link
                  href="/live"
                  className="text-primary-400 hover:text-primary-300 font-medium text-sm flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="text-gray-400 mb-6">
                Breaking news and live updates from citizen reporters across South Africa
              </p>

              {livePosts.length > 0 ? (
                <div className="space-y-4">
                  {livePosts.map((post) => (
                    <Link
                      key={post.publicId}
                      href={`/live/${post.publicId}`}
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
                    href="/live"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                  >
                    <Camera className="h-4 w-4" />
                    Report Something Live
                  </Link>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-ink-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-400">
                  Report traffic, crime, protests, load shedding, and more in real-time
                </p>
                <Link
                  href="/live"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 transition-all font-medium text-sm shadow-lg"
                >
                  <Radio className="h-4 w-4" />
                  Go to Live Billboard
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
                      Get breaking news and leaks <span className="text-amber-400 font-semibold">10 minutes before</span> the public.
                      Perfect for journalists, researchers, and investigators.
                    </p>
                  </div>
                </div>
                <Link
                  href="/pricing"
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
                  Platform Impact
                </h2>
                <p className="text-gray-300">
                  Exposing corruption across South Africa
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
                  <div className="text-sm text-gray-300">Total Leaks</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-green-500/20 border border-green-500/30">
                  <div className="flex justify-center mb-2">
                    <BarChart3 className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {stats.leaksWithEvidence}
                  </div>
                  <div className="text-sm text-gray-300">With Evidence</div>
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
                        href={`/browse?category=${cat.slug}`}
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

      {/* Two Types of Reporting */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Two Ways to Report
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Choose the right format for your story
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Live Billboard */}
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-red-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                  <Radio className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Live Billboard</h3>
                  <span className="text-xs text-red-400 font-medium">REAL-TIME UPDATES</span>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Report breaking news as it happens. Perfect for traffic updates, protests, crime scenes,
                load shedding, weather events, and community alerts.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-red-400" />
                  Instant publication
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-red-400" />
                  Upload photos &amp; videos
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-red-400" />
                  Community voting &amp; comments
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-red-400" />
                  Mark events as &quot;Happening Now&quot;
                </li>
              </ul>
              <Link
                href="/live"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
              >
                <Radio className="h-4 w-4" />
                Go Live Now
              </Link>
            </div>

            {/* Anonymous Leaks */}
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Anonymous Leaks</h3>
                  <span className="text-xs text-primary-400 font-medium">DEEP INVESTIGATIONS</span>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Submit detailed reports on corruption, fraud, and misconduct. Upload documents and
                evidence. Communicate securely with journalists through encrypted messaging.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-primary-400" />
                  Full anonymity protection
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-primary-400" />
                  Upload documents &amp; evidence
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-primary-400" />
                  Encrypted messaging with journalists
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle className="h-4 w-4 text-primary-400" />
                  Metadata automatically stripped
                </li>
              </ul>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
              >
                <AlertTriangle className="h-4 w-4" />
                Submit a Leak
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Your Safety is Our Priority
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              We have built this platform with your protection in mind. Here&apos;s how we keep you safe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-6">
                <Lock className="h-6 w-6 text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                No IP Logging
              </h3>
              <p className="text-gray-300">
                We do not store IP addresses or any information that could identify you.
                Your location remains completely private.
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-6">
                <Eye className="h-6 w-6 text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                No Tracking
              </h3>
              <p className="text-gray-300">
                No cookies, no analytics, no third-party scripts. We don&apos;t track your
                browsing behavior or collect any data.
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Metadata Stripping
              </h3>
              <p className="text-gray-300">
                All uploaded files have their metadata (EXIF data, location, device info)
                automatically removed before storage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-300">
                Submitting a leak is simple and takes just a few minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  step: '1',
                  title: 'Choose Category',
                  description: 'Select the type of corruption or misconduct you want to report.',
                },
                {
                  step: '2',
                  title: 'Write Your Report',
                  description: 'Describe what happened, who was involved, and provide any details.',
                },
                {
                  step: '3',
                  title: 'Attach Evidence',
                  description: 'Upload documents, images, or videos to support your claims.',
                },
                {
                  step: '4',
                  title: 'Submit Anonymously',
                  description: 'Your leak is published instantly. Save your token for messages.',
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
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
          </div>
        </div>
      </section>

      {/* For Journalists Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-ink-900 to-ink-800 rounded-2xl p-8 md:p-12 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5"></div>
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-6 w-6 text-primary-400" />
                  <span className="text-primary-400 font-medium">For Journalists &amp; Investigators</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Get Verified Access
                </h2>
                <p className="text-gray-300 mb-6 max-w-xl">
                  Register as a journalist to contact whistleblowers directly through our encrypted messaging system.
                  Premium subscribers get early access to breaking news before anyone else.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/journalists"
                    className="inline-flex items-center px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                  >
                    Register as Journalist
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                  <Link
                    href="/pricing"
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
                    <div className="text-xs text-gray-400">Messaging</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <Bell className="h-8 w-8 text-red-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold">Instant</div>
                    <div className="text-xs text-gray-400">Alerts</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <Shield className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold">Verified</div>
                    <div className="text-xs text-gray-400">Badge</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Secure Messaging */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-500/30 backdrop-blur-sm rounded-2xl p-8 md:p-12 text-white border border-primary-400/30">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-8 md:mb-0 md:mr-8">
                <MessageSquare className="h-12 w-12 mb-4" />
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Secure Two-Way Communication
                </h2>
                <p className="text-gray-300 max-w-xl">
                  Journalists and investigators can send you encrypted messages through our platform.
                  Only you can read them using your secret token. Respond without ever revealing who you are.
                </p>
              </div>
              <Link
                href="/messages"
                className="inline-flex items-center px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors border border-white/30"
              >
                Check Your Messages
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
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
                    Get email or SMS alerts when new leaks are published in your area or categories of interest.
                  </p>
                </div>
              </div>
              <Link
                href="/subscribe"
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
          <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
            <Image
              src="/icons/icon-512x512.png"
              alt="SA Leaks"
              width={120}
              height={120}
              className="mx-auto mb-6 rounded-2xl"
            />
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Your voice matters. Help expose wrongdoing and hold the powerful accountable.
              Together, we can build a more transparent South Africa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/live"
                className="inline-flex items-center justify-center px-8 py-4 bg-red-500/80 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors text-lg border border-red-400/30"
              >
                <Radio className="h-6 w-6 mr-2" />
                Report Live News
              </Link>
              <Link
                href="/submit"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-500/80 text-white font-semibold rounded-lg hover:bg-primary-500 transition-colors text-lg border border-primary-400/30"
              >
                <AlertTriangle className="h-6 w-6 mr-2" />
                Submit a Leak
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  )
}
