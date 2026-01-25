'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  X,
  Shield,
  MessageSquare,
  Bell,
  Download,
  BadgeCheck,
  Lock,
  Zap,
  Building2,
} from 'lucide-react'

const plans = [
  {
    name: 'Free',
    description: 'For citizens and casual observers',
    price: 'R0',
    period: 'forever',
    features: [
      { text: 'Browse all public leaks', included: true },
      { text: 'Public messaging', included: true },
      { text: 'Email alerts', included: true },
      { text: 'Vote on credibility', included: true },
      { text: 'Private messaging', included: false },
      { text: 'Verified journalist badge', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Current Plan',
    ctaLink: '/browse',
    highlighted: false,
  },
  {
    name: 'Journalist Pro',
    description: 'For individual journalists',
    price: 'R299',
    period: '/month',
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Private encrypted messaging', included: true },
      { text: 'Verified journalist badge', included: true },
      { text: 'Early access to new leaks', included: true },
      { text: 'Download evidence files', included: true },
      { text: 'Email support', included: true },
      { text: 'API access', included: false },
    ],
    cta: 'Get Started',
    ctaLink: '/journalists',
    highlighted: true,
  },
  {
    name: 'Newsroom',
    description: 'For news organizations',
    price: 'R1,999',
    period: '/month',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Up to 10 journalist seats', included: true },
      { text: 'API access for integration', included: true },
      { text: 'Custom alert categories', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Priority support', included: true },
      { text: 'Team collaboration tools', included: true },
    ],
    cta: 'Contact Sales',
    ctaLink: 'mailto:newsroom@spillnova.com',
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png?v=2')" }}
    >
      <div className="bg-black/60 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Link
            href="/"
            className="inline-flex items-center text-gray-300 hover:text-primary-400 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Support investigative journalism while getting access to powerful tools
              for uncovering the truth.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 text-gray-300">
              <Shield className="h-5 w-5 text-green-400" />
              <span className="text-sm">End-to-End Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Lock className="h-5 w-5 text-green-400" />
              <span className="text-sm">Source Protection Guaranteed</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Zap className="h-5 w-5 text-green-400" />
              <span className="text-sm">Cancel Anytime</span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-black/40 backdrop-blur-sm rounded-2xl overflow-hidden ${
                  plan.highlighted
                    ? 'ring-2 ring-primary-500 shadow-xl'
                    : 'border border-white/10 shadow-lg'
                }`}
              >
                {plan.highlighted && (
                  <div className="bg-primary-500 text-white text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-400">
                      {plan.period}
                    </span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        )}
                        <span
                          className={
                            feature.included
                              ? 'text-gray-300'
                              : 'text-gray-500'
                          }
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.ctaLink}
                    className={`block text-center py-3 px-4 rounded-lg font-medium transition-colors ${
                      plan.highlighted
                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Feature Breakdown */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">
              Why Go Premium?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500/20 border border-primary-500/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-6 w-6 text-primary-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">
                  Private Messaging
                </h3>
                <p className="text-sm text-gray-400">
                  Communicate directly with whistleblowers through encrypted channels
                  that only you and they can read.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">
                  Verified Status
                </h3>
                <p className="text-sm text-gray-400">
                  Whistleblowers can see you&apos;re a verified journalist, building
                  trust and encouraging more open communication.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">
                  Early Access
                </h3>
                <p className="text-sm text-gray-400">
                  Get notified about new leaks before they become widely known,
                  giving you a competitive edge.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <details className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <summary className="font-medium text-white cursor-pointer">
                  How is private messaging encrypted?
                </summary>
                <p className="mt-3 text-gray-400 text-sm">
                  Messages are encrypted using AES-256 encryption with unique keys for each
                  conversation. Only you and the whistleblower can read the messages - we
                  cannot access them even if compelled by authorities.
                </p>
              </details>
              <details className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <summary className="font-medium text-white cursor-pointer">
                  How do you verify journalists?
                </summary>
                <p className="mt-3 text-gray-400 text-sm">
                  We verify journalists through their professional email addresses and
                  cross-reference with news organization records. We may also check press
                  council registrations where applicable.
                </p>
              </details>
              <details className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <summary className="font-medium text-white cursor-pointer">
                  Can I cancel my subscription anytime?
                </summary>
                <p className="mt-3 text-gray-400 text-sm">
                  Yes, you can cancel at any time. You&apos;ll retain access until the end of
                  your billing period. No questions asked, no cancellation fees.
                </p>
              </details>
              <details className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <summary className="font-medium text-white cursor-pointer">
                  What payment methods do you accept?
                </summary>
                <p className="mt-3 text-gray-400 text-sm">
                  We accept all major credit cards, debit cards, and EFT payments. For
                  Newsroom plans, we also offer invoice-based billing.
                </p>
              </details>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="text-center mt-12 py-8 border-t border-white/10">
            <p className="text-gray-400 mb-4">
              Have questions about our plans?
            </p>
            <a
              href="mailto:support@spillnova.com"
              className="inline-flex items-center text-primary-400 hover:text-primary-300 font-medium"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Contact our team
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
