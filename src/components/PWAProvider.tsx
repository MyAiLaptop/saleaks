'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Download, Bell } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAProvider() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running as standalone PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(ios)

    // Register service worker - DISABLED FOR DEBUGGING
    // Uncomment below to re-enable
    /*
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
    */
    // Unregister any existing service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister()
        })
      })
    }

    // Listen for install prompt (Chrome, Edge, etc.)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)

      // Check if user has dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        // Show banner after a short delay
        setTimeout(() => setShowInstallBanner(true), 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Check for notification permission after install
    if (standalone && 'Notification' in window && Notification.permission === 'default') {
      const notifDismissed = localStorage.getItem('notification-prompt-dismissed')
      if (!notifDismissed) {
        setTimeout(() => setShowNotificationPrompt(true), 5000)
      }
    }

    // For iOS - show custom install instructions
    if (ios && !standalone) {
      const iosDismissed = localStorage.getItem('ios-install-dismissed')
      if (!iosDismissed) {
        setTimeout(() => setShowInstallBanner(true), 3000)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === 'accepted') {
      setShowInstallBanner(false)
      setInstallPrompt(null)
    }
  }

  const handleDismissInstall = () => {
    setShowInstallBanner(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) return

    const permission = await Notification.requestPermission()

    if (permission === 'granted') {
      // Subscribe to push notifications
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready

        try {
          // For demo purposes - in production, you'd use your VAPID key
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
            ),
          })

          // Send subscription to server
          await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription),
          })
        } catch (error) {
          console.error('Push subscription failed:', error)
        }
      }
    }

    setShowNotificationPrompt(false)
  }

  const handleDismissNotification = () => {
    setShowNotificationPrompt(false)
    localStorage.setItem('notification-prompt-dismissed', 'true')
  }

  // Don't render anything if already installed
  if (isStandalone && !showNotificationPrompt) return null

  return (
    <>
      {/* Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg animate-slide-up">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="flex-shrink-0">
              <Image
                src="/icons/globecon.png"
                alt="SA Leaks"
                width={56}
                height={56}
                className="rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">Add SA Leaks to your home screen</p>
              <p className="text-sm text-primary-100">
                {isIOS
                  ? 'Tap the share button and select "Add to Home Screen"'
                  : 'Get instant access to breaking news and alerts'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isIOS && installPrompt && (
                <button
                  onClick={handleInstall}
                  className="px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Install
                </button>
              )}
              <button
                onClick={handleDismissInstall}
                className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Permission Prompt */}
      {showNotificationPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Image
                src="/icons/globecon.png"
                alt="SA Leaks"
                width={56}
                height={56}
                className="rounded-lg"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Stay Updated
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Get notified about breaking news and important updates from SA Leaks
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleEnableNotifications}
                  className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                >
                  Enable Notifications
                </button>
                <button
                  onClick={handleDismissNotification}
                  className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>
            <button
              onClick={handleDismissNotification}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): BufferSource | null {
  if (!base64String) return null

  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}
