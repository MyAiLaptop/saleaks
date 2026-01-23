import { Shield, AlertTriangle, CheckCircle } from 'lucide-react'

export default function WarrantCanaryPage() {
  // Update this date whenever you verify the canary is still valid
  const lastUpdated = '2026-01-21'
  const nextUpdate = '2026-02-21'

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png')" }}
    >
      <div className="bg-black/60 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <Shield className="h-16 w-16 text-primary-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">
              Warrant Canary
            </h1>
            <p className="text-gray-300">
              Transparency about government requests and legal pressure
            </p>
          </div>

          {/* Current Status */}
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-8 w-8 text-green-400 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-green-200 mb-2">
                  All Clear
                </h2>
                <p className="text-green-300">
                  As of <strong>{lastUpdated}</strong>, we have:
                </p>
                <ul className="mt-4 space-y-2 text-green-300">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>NOT received any National Security Letters</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>NOT received any court orders under RICA or similar laws</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>NOT received any gag orders preventing disclosure</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>NOT been required to hand over encryption keys</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>NOT been compelled to modify our software for surveillance</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>NOT had any servers seized or searched</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Update Schedule */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">
              Update Schedule
            </h2>
            <p className="text-gray-300 mb-4">
              This canary is updated monthly. If this page is not updated by the expected
              date, or if any of the statements above are removed, you should assume that
              we have received a legal request that we cannot disclose.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Last Updated:</span>
                <p className="font-semibold text-white">{lastUpdated}</p>
              </div>
              <div>
                <span className="text-gray-400">Next Update Expected:</span>
                <p className="font-semibold text-white">{nextUpdate}</p>
              </div>
            </div>
          </div>

          {/* What is a Warrant Canary */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">
              What is a Warrant Canary?
            </h2>
            <p className="text-gray-300 mb-4">
              A warrant canary is a method by which a service provider can inform users
              that they have NOT been served with a secret government subpoena. Because
              many legal processes (like National Security Letters) come with gag orders
              that prevent disclosure, we cannot tell you if we HAVE received one.
            </p>
            <p className="text-gray-300">
              However, nothing prevents us from telling you that we have NOT received one.
              If this statement ever disappears, or stops being updated, you should draw
              your own conclusions.
            </p>
          </div>

          {/* Warning */}
          <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <AlertTriangle className="h-6 w-6 text-amber-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-200 mb-2">
                  Important Notice
                </h3>
                <p className="text-sm text-amber-300">
                  While we do everything possible to protect your anonymity, no system is
                  perfect. Never include information that could identify you in your
                  submissions unless you choose to do so.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
