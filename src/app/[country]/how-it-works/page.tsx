'use client'

import {
  Shield,
  Lock,
  Eye,
  FileText,
  MessageSquare,
  Upload,
  Camera,
  CheckCircle,
  DollarSign,
  Clock,
  Gavel,
  Users,
  Phone,
  Download,
  Radio,
  Building2,
  ShoppingCart,
  BadgeCheck,
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
              The marketplace for authentic content in {config.name}
            </p>
          </div>

          {/* Two Paths */}
          <section className="mb-16">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Upload className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Sell Content</h3>
                    <p className="text-sm text-green-300">For Creators</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Upload your authentic videos and photos. Earn 50% every time someone purchases your content.
                </p>
                <Link
                  href={`/${country}/upload`}
                  className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Start Selling
                </Link>
              </div>

              <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Buy Content</h3>
                    <p className="text-sm text-blue-300">For Buyers</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Browse and purchase authentic videos and photos. Get high-quality, watermark-free downloads.
                </p>
                <Link
                  href={`/${country}/browse`}
                  className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Browse Content
                </Link>
              </div>
            </div>
          </section>

          {/* Live Content Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Radio className="h-6 w-6 mr-2 text-red-400" />
              Live Content Feed
            </h2>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10 space-y-6">
              {/* Steps */}
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { icon: Camera, title: 'Capture', desc: 'Record video or photo directly from your camera' },
                  { icon: Phone, title: 'Add Details', desc: 'Enter contact info to earn 50% of sales' },
                  { icon: Gavel, title: '1-Hour Auction', desc: 'Buyers bid for exclusive rights' },
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
                      <p className="text-gray-400">When you post, buyers have 1 hour to bid for exclusive rights to your content.</p>
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
                      <span className="font-medium text-green-400">With Contact Info</span>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>You earn 50% of every sale</li>
                      <li>Withdraw once you reach R10</li>
                      <li>Download your own content free</li>
                    </ul>
                  </div>
                  <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-400">Anonymous (No Contact)</span>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>Content still goes live</li>
                      <li>Platform keeps 100% of sales</li>
                      <li>Maximum privacy protection</li>
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
              For Media Buyers
            </h2>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {[
                  { icon: Radio, title: 'Browse Content', desc: 'See fresh content as it is uploaded' },
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

          {/* Authenticity Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <BadgeCheck className="h-6 w-6 mr-2 text-primary-400" />
              100% Authentic Content
            </h2>

            <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-6 space-y-6 border border-white/10">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-500/30">
                  <Camera className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">
                    Camera-Only Capture
                  </h3>
                  <p className="text-gray-300 text-sm">
                    All content must be captured directly from a device camera. No AI-generated
                    images, no screenshots, no manipulated media. This ensures buyers get
                    authentic, real content.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-500/30">
                  <Shield className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">
                    Content Protection
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Your content is protected with watermarks until purchased. Buyers receive
                    clean, high-quality downloads. We use advanced protection to prevent
                    unauthorized distribution.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-500/30">
                  <Lock className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">
                    Automatic Metadata Removal
                  </h3>
                  <p className="text-gray-300 text-sm">
                    All uploaded files have their metadata automatically stripped. This removes
                    EXIF data, GPS coordinates, device information, and any other identifying
                    details embedded in the files.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-500/30">
                  <MessageSquare className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">
                    Secure Messaging
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Buyers can contact sellers through our secure messaging system. All
                    communications are encrypted. Use your secret token to check and respond
                    to messages.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Selling Steps Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-green-400" />
              Uploading Content to Sell
            </h2>

            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: 'Capture Content',
                  description:
                    'Take photos or record videos directly from your device camera. We only accept authentic, camera-captured content - no AI-generated or manipulated media.',
                },
                {
                  step: 2,
                  title: 'Upload & Describe',
                  description:
                    'Add your content with a clear title, detailed description, and select the appropriate category. Include location details if relevant. The more context you provide, the more attractive it will be to buyers.',
                },
                {
                  step: 3,
                  title: 'Set Your Preferences',
                  description:
                    'Choose whether to enable messaging from buyers. Opt into revenue sharing to earn 50% of every sale by providing your contact details.',
                },
                {
                  step: 4,
                  title: 'Go Live',
                  description:
                    'Your content is published immediately with watermark protection. It enters a 1-hour auction period where buyers can bid for exclusive rights.',
                },
                {
                  step: 5,
                  title: 'Get Paid',
                  description:
                    'Earn 50% of auction sales or regular purchases. Withdraw your earnings once you reach the R10 minimum. Payments are processed within 24-48 hours.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-start space-x-4 bg-black/40 backdrop-blur-sm rounded-lg p-6 border border-white/10"
                >
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
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

          {/* Tips Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <CheckCircle className="h-6 w-6 mr-2 text-amber-400" />
              Tips for Success
            </h2>

            <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-6">
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-amber-200">Quality matters</span>
                    <p className="text-sm text-amber-300 mt-1">
                      Clear, well-lit content sells better. Steady shots and good framing
                      make your content more attractive to buyers.
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-amber-200">
                      Add detailed descriptions
                    </span>
                    <p className="text-sm text-amber-300 mt-1">
                      Include context about what is shown, when and where it was captured,
                      and why it is valuable. Buyers need to understand what they are purchasing.
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-amber-200">
                      Choose the right category
                    </span>
                    <p className="text-sm text-amber-300 mt-1">
                      Proper categorization helps buyers find your content. Select the most
                      relevant category for maximum visibility.
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-amber-200">
                      Enable messaging
                    </span>
                    <p className="text-sm text-amber-300 mt-1">
                      Allow buyers to contact you for questions or additional details.
                      This can lead to more sales and higher prices.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-gray-400 mb-6">Ready to get started?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${country}/upload`}
                className="inline-flex items-center justify-center px-8 py-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors text-lg"
              >
                <Upload className="h-5 w-5 mr-2" />
                Sell Your Content
              </Link>
              <Link
                href={`/${country}/browse`}
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors text-lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Browse Content
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
