'use client'

import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png?v=2')" }}
    >
      <div className="bg-black/60 absolute inset-0" />
      <div className="text-center relative z-10 px-4">
        <WifiOff className="h-16 w-16 text-gray-400 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">
          You&apos;re Offline
        </h1>
        <p className="text-gray-300 mb-6 max-w-md">
          It looks like you&apos;ve lost your internet connection.
          Some features may not be available until you&apos;re back online.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  )
}
