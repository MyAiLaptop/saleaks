import Link from 'next/link'

export const metadata = {
  title: 'Terms & Conditions | SA Leaks',
  description: 'Terms and conditions for using SA Leaks platform',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-ink-900">
      {/* Header */}
      <header className="border-b border-ink-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            SA<span className="text-primary-400">Leaks</span>
          </Link>
          <Link href="/live" className="text-gray-400 hover:text-white transition-colors">
            Back to Live
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Terms & Conditions</h1>
        <p className="text-gray-400 mb-8">Last updated: January 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              Welcome to SA Leaks. By using our platform, you agree to these terms and conditions.
              SA Leaks is an anonymous content sharing platform that allows users to submit and
              purchase newsworthy content including photos and videos.
            </p>
          </section>

          {/* Content Submission - Seller Terms */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Content Submission (Seller Terms)</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              By submitting content to SA Leaks, you agree to the following:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-gray-300">
              <li>
                <strong className="text-white">Transfer of Rights:</strong> You grant SA Leaks and
                all purchasers a perpetual, worldwide, non-exclusive, royalty-free license to use,
                reproduce, modify, publish, distribute, and display the content in any media.
              </li>
              <li>
                <strong className="text-white">Relinquishment of Exclusive Ownership:</strong> You
                understand and agree that by submitting content, you relinquish any claim to
                exclusive ownership. The content may be sold to multiple buyers and used by
                SA Leaks for promotional purposes.
              </li>
              <li>
                <strong className="text-white">Original Content:</strong> You confirm that you are
                the original creator of the content or have the legal right to submit it.
              </li>
              <li>
                <strong className="text-white">Revenue Share:</strong> If you opt into revenue
                sharing by providing your phone number, you will receive 50% of each sale. This
                does not grant you any additional rights over the content.
              </li>
              <li>
                <strong className="text-white">No Takedown Rights:</strong> Once content is
                submitted and approved, you cannot request its removal from the platform or
                from buyers who have purchased it.
              </li>
            </ul>
          </section>

          {/* Content Purchase - Buyer Terms */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Content Purchase (Buyer Terms)</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              By purchasing content from SA Leaks, you agree to the following:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-gray-300">
              <li>
                <strong className="text-white">Usage Rights:</strong> You receive a perpetual,
                worldwide, non-exclusive license to use the purchased content. You may publish,
                share, modify, and distribute the content as you see fit.
              </li>
              <li>
                <strong className="text-white">Non-Exclusive License:</strong> Your purchase
                grants you a non-exclusive license. The same content may be sold to other buyers.
                You do not receive exclusive rights to the content.
              </li>
              <li>
                <strong className="text-white">No Resale:</strong> You may not resell the content
                or sublicense it to third parties as a standalone product.
              </li>
              <li>
                <strong className="text-white">Attribution:</strong> Attribution to SA Leaks or
                the original submitter is appreciated but not required.
              </li>
              <li>
                <strong className="text-white">Download Limit:</strong> Each purchase includes
                3 downloads of the unwatermarked content. Additional downloads require a new
                purchase.
              </li>
            </ul>
          </section>

          {/* Auction System */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Exclusive Rights Auction</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              All new content on SA Leaks goes through a 1-hour auction period where media
              organizations can bid for exclusive rights:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-gray-300">
              <li>
                <strong className="text-white">Auction Duration:</strong> All content is available
                for exclusive bidding for 1 hour after submission. Content is visible to everyone
                during this period (with watermark).
              </li>
              <li>
                <strong className="text-white">Exclusive Rights:</strong> The winning bidder
                receives exclusive rights to the content. The content is removed from public
                view and cannot be purchased by anyone else.
              </li>
              <li>
                <strong className="text-white">Minimum Bid:</strong> The minimum starting bid is
                R50. Each subsequent bid must be at least R5 higher than the current bid.
              </li>
              <li>
                <strong className="text-white">Anti-Sniping:</strong> If a bid is placed in the
                last minute of the auction, the auction is extended by 2 minutes to allow others
                to respond.
              </li>
              <li>
                <strong className="text-white">No Bids:</strong> If no bids are received during
                the auction period, the content becomes available for regular public purchase
                (non-exclusive) at standard pricing.
              </li>
              <li>
                <strong className="text-white">Payment:</strong> Winning bidders must complete
                payment to finalize the purchase. Failure to pay may result in the content
                being released for public sale.
              </li>
            </ul>
          </section>

          {/* Content Guidelines */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Content Guidelines</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              The following content is prohibited:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li>Child exploitation material of any kind</li>
              <li>Content that violates South African law</li>
              <li>Content inciting violence or hate speech</li>
              <li>Private or intimate content shared without consent</li>
              <li>Content that infringes on intellectual property rights</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              SA Leaks reserves the right to remove any content that violates these guidelines
              and to ban users who repeatedly violate them.
            </p>
          </section>

          {/* Anonymity */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Anonymity & Privacy</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              SA Leaks is designed to protect the anonymity of content submitters:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li>We do not require registration to submit content</li>
              <li>Phone numbers provided for revenue sharing are encrypted and never shared</li>
              <li>We strip metadata from uploaded content</li>
              <li>We may be required to disclose information pursuant to valid legal process</li>
            </ul>
          </section>

          {/* Payments */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Payments & Withdrawals</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li>Prices are displayed in South African Rand (ZAR)</li>
              <li>Payments are processed via carrier billing (airtime/bill) or PayFast</li>
              <li>Revenue share payments are processed within 24-48 hours of withdrawal request</li>
              <li>Minimum withdrawal amount is R10.00</li>
              <li>All transactions are final. No refunds are provided for digital content</li>
            </ul>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Disclaimer</h2>
            <p className="text-gray-300 leading-relaxed">
              SA Leaks acts as a platform connecting content submitters with buyers. We do not
              verify the accuracy or authenticity of submitted content. Buyers are responsible
              for their own due diligence before using purchased content. SA Leaks is not liable
              for any claims, damages, or losses arising from the use of content obtained through
              the platform.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Changes to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              SA Leaks reserves the right to modify these terms at any time. Continued use of
              the platform after changes constitutes acceptance of the new terms.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              For questions about these terms, contact us through the platform or at the
              contact details provided on our website.
            </p>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-ink-800">
          <Link
            href="/"
            className="text-primary-400 hover:text-primary-300 transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}
