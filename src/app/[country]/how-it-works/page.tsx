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
} from 'lucide-react'
import Link from 'next/link'
import { useCountry } from '@/lib/country-context'

export default function CountryHowItWorksPage() {
  const { country, config } = useCountry()

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/background.png')" }}
    >
      <div className="bg-black/60 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How Leakpoint Works
            </h1>
            <p className="text-lg text-gray-300">
              A guide to safely and anonymously reporting corruption in {config.name}
            </p>
          </div>

          {/* Security Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Shield className="h-6 w-6 mr-2 text-primary-400" />
              Your Security & Anonymity
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
            <h2 className="text-2xl font-bold text-white mb-6">
              Submitting a Leak: Step by Step
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
          <div className="text-center">
            <Link
              href={`/${country}/submit`}
              className="inline-flex items-center px-8 py-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors text-lg"
            >
              <Upload className="h-5 w-5 mr-2" />
              Submit Your Leak
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
