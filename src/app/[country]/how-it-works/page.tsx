'use client'

import {
  Shield,
  Lock,
  Eye,
  FileText,
  MessageSquare,
  Upload,
  AlertTriangle,
  Globe,
  CheckCircle,
  Camera,
  DollarSign,
  Clock,
  Gavel,
  Users,
  Phone,
  Download,
  Radio,
  Building2,
} from 'lucide-react'
import Link from 'next/link'
import { useCountry } from '@/lib/country-context'

export default function CountryHowItWorksPage() {
  const { country, config } = useCountry()

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png')" }}
    >
      <div className="bg-black/60 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How SpillNova Works
            </h1>
            <p className="text-lg text-gray-300">
              Citizen journalism and anonymous reporting in {config.name}
            </p>
          </div>

          {/* Two Paths */}
          <section className="mb-16">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-red-900/40 to-orange-900/40 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <Radio className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Live Billboard</h3>
                    <p className="text-sm text-red-300">Citizen Journalism</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Capture breaking news, protests, accidents, or community events. Get paid when newsrooms buy your content.
                </p>
                <Link
                  href={`/${country}/live`}
                  className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Go Live
                </Link>
              </div>

              <div className="bg-gradient-to-br from-primary-900/40 to-blue-900/40 backdrop-blur-sm rounded-xl p-6 border border-primary-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Anonymous Leaks</h3>
                    <p className="text-sm text-primary-300">Whistleblowing</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Report corruption, fraud, or misconduct anonymously. Full privacy protection with no tracking.
                </p>
                <Link
                  href={`/${country}/submit`}
                  className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Leak
                </Link>
              </div>
            </div>
          </section>

          {/* Live Billboard Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Radio className="h-6 w-6 mr-2 text-red-400" />
              How Live Billboard Works
            </h2>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10 space-y-6">
              {/* Steps */}
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { icon: Camera, title: 'Capture', desc: 'Record video or photo directly from your camera' },
                  { icon: Phone, title: 'Add Phone', desc: 'Enter your number to earn 50% of sales' },
                  { icon: Gavel, title: '1-Hour Auction', desc: 'Newsrooms bid for exclusive rights' },
                  { icon: DollarSign, title: 'Get Paid', desc: 'Earn from auction or public sales' },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <item.icon className="h-6 w-6 text-red-400" />
                    </div>
                    <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-6">
                <h4 className="font-semibold text-white mb-4">The Auction System</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white font-medium">1-Hour Exclusive Window</span>
                      <p className="text-gray-400">When you post, newsrooms have 1 hour to bid for exclusive rights to your content.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Gavel className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white font-medium">If Sold in Auction</span>
                      <p className="text-gray-400">The winning bidder gets exclusive rights. Content is removed from public view. You earn 50% of the sale.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white font-medium">If Not Sold</span>
                      <p className="text-gray-400">Content goes to public marketplace. Anyone can buy watermark-free copies for R1 (photos) or R3 (videos). You earn 50% of each sale.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h4 className="font-semibold text-white mb-4">Earning Money</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="h-4 w-4 text-green-400" />
                      <span className="font-medium text-green-400">With Phone Number</span>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• You earn 50% of every sale</li>
                      <li>• Withdraw once you reach R10</li>
                      <li>• Download your own content free</li>
                    </ul>
                  </div>
                  <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-400">Anonymous (No Phone)</span>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Content still goes live</li>
                      <li>• Platform keeps 100% of sales</li>
                      <li>• Maximum privacy protection</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* For Buyers Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-blue-400" />
              For Newsrooms & Media Buyers
            </h2>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {[
                  { icon: Radio, title: 'Browse Live', desc: 'See breaking content as it happens' },
                  { icon: Gavel, title: 'Bid for Exclusive', desc: 'Win exclusive rights in 1-hour auctions' },
                  { icon: Download, title: 'Buy Direct', desc: 'Purchase individual files after auction' },
                ].map((item, i) => (
                  <div key={i} className="text-center bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <item.icon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div>
                  <h4 className="font-semibold text-white mb-1">Create a Buyer Account</h4>
                  <p className="text-sm text-gray-400">Get SMS alerts when new content goes live. Track purchases and manage bids.</p>
                </div>
                <Link
                  href={`/${country}/buyer`}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm whitespace-nowrap transition-colors"
                >
                  Buyer Portal
                </Link>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Shield className="h-6 w-6 mr-2 text-primary-400" />
              Privacy & Security (For Anonymous Leaks)
            </h2>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-6 space-y-6 border border-white/10">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-500/30">
                  <Lock className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">
                    No IP Address Logging
                  </h3>
                  <p className="text-gray-300 text-sm">
                    We do not record your IP address at any point. Our servers are configured
                    to discard this information immediately, making it impossible to trace
                    submissions back to you.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-500/30">
                  <Eye className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">
                    Zero Tracking
                  </h3>
                  <p className="text-gray-300 text-sm">
                    No cookies, no analytics, no third-party scripts. We don&apos;t use Google
                    Analytics, Facebook Pixel, or any other tracking tools. Your browsing
                    behavior is completely private.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-500/30">
                  <FileText className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">
                    Automatic Metadata Removal
                  </h3>
                  <p className="text-gray-300 text-sm">
                    All uploaded files (photos, documents, videos) have their metadata
                    automatically stripped. This removes EXIF data, GPS coordinates, device
                    information, and any other identifying details embedded in the files.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-500/30">
                  <MessageSquare className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">
                    Anonymous Public Messaging
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Journalists can send you messages through the platform, and you can reply
                    using your secret token. All conversations are public for transparency,
                    but both parties remain completely anonymous.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Steps Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-primary-400" />
              Submitting an Anonymous Leak
            </h2>

            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: 'Choose a Category',
                  description:
                    'Select the type of misconduct you want to report (government corruption, corporate fraud, police misconduct, etc.). This helps organize reports and makes them easier to find.',
                },
                {
                  step: 2,
                  title: 'Write Your Report',
                  description:
                    'Describe what happened in as much detail as possible. Include names, dates, locations, and any other relevant information. The more specific you are, the more credible and actionable your report becomes.',
                },
                {
                  step: 3,
                  title: 'Attach Evidence (Optional)',
                  description:
                    'Upload documents, photos, videos, or audio recordings that support your claims. All metadata is automatically removed to protect your identity. You can upload up to 10 files (50MB each).',
                },
                {
                  step: 4,
                  title: 'Enable Secure Messaging (Recommended)',
                  description:
                    'If you want journalists to be able to contact you for follow-up questions, enable secure messaging. You\'ll receive a secret token - save it! It\'s the only way to check your messages.',
                },
                {
                  step: 5,
                  title: 'Submit & Save Your Token',
                  description:
                    'Your report is published immediately. If you enabled messaging, SAVE YOUR SECRET TOKEN - it\'s shown only once. Without it, you cannot receive or respond to messages.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-start space-x-4 bg-black/40 backdrop-blur-sm rounded-lg p-6 border border-white/10"
                >
                  <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recommendations Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2 text-amber-400" />
              Additional Safety Recommendations
            </h2>

            <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-6">
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-amber-200">Use a VPN or public WiFi</span>
                    <p className="text-sm text-amber-300 mt-1">
                      For extra privacy, consider using a VPN service or accessing from public WiFi
                      or mobile data. This adds an additional layer of protection to your connection.
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-amber-200">
                      Don&apos;t use work devices or networks
                    </span>
                    <p className="text-sm text-amber-300 mt-1">
                      Your employer may monitor your internet activity. Use a personal device
                      and a private internet connection (or public WiFi/mobile data).
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-amber-200">
                      Be careful with specific details
                    </span>
                    <p className="text-sm text-amber-300 mt-1">
                      While details make reports more credible, be aware that very specific
                      information might narrow down who could have known it. Balance detail with
                      protecting your identity.
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-amber-200">
                      Store your token securely
                    </span>
                    <p className="text-sm text-amber-300 mt-1">
                      Write down your secret token and keep it somewhere safe, not on your
                      work computer or phone. Consider using a password manager.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Legal Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Globe className="h-6 w-6 mr-2 text-primary-400" />
              Legal Protection in {config.name}
            </h2>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/10">
              {country === 'sa' ? (
                <>
                  <p className="text-gray-300 mb-4">
                    South Africa&apos;s <strong className="text-white">Protected Disclosures Act (PDA)</strong> provides legal
                    protection to employees who report unlawful or irregular conduct by their
                    employers or fellow employees. Key points:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm">
                    <li>
                      You are protected from occupational detriment (dismissal, demotion, harassment)
                      for making a protected disclosure
                    </li>
                    <li>
                      Disclosures can be made to a legal advisor, employer, government minister, or
                      any person/body if certain conditions are met
                    </li>
                    <li>The disclosure must be made in good faith and you must reasonably believe the information is true</li>
                    <li>
                      You cannot be required to disclose your identity if you make an anonymous report
                    </li>
                  </ul>
                </>
              ) : (
                <p className="text-gray-300">
                  Whistleblower protection laws vary by country. We recommend consulting with a legal
                  professional in your jurisdiction to understand your rights and protections before
                  making any disclosure.
                </p>
              )}
              <p className="text-gray-400 text-xs mt-4">
                Note: This is general information, not legal advice. If you are concerned about
                legal risks, consult with a lawyer.
              </p>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-gray-400 mb-6">Ready to get started?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${country}/live`}
                className="inline-flex items-center justify-center px-8 py-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors text-lg"
              >
                <Camera className="h-5 w-5 mr-2" />
                Capture & Earn
              </Link>
              <Link
                href={`/${country}/submit`}
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors text-lg"
              >
                <Shield className="h-5 w-5 mr-2" />
                Submit Anonymous Leak
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
