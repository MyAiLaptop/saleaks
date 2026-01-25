'use client'

import { useState, useEffect } from 'react'
import {
  Bell,
  BellOff,
  AlertTriangle,
  Radio,
  MapPin,
  Check,
  Loader2,
  Smartphone,
  Shield,
} from 'lucide-react'

const CATEGORIES = [
  { id: 'BREAKING', label: 'Breaking News', description: 'Major breaking stories and urgent alerts' },
  { id: 'CRIME', label: 'Crime', description: 'Crime reports and safety alerts' },
  { id: 'TRAFFIC', label: 'Traffic', description: 'Traffic incidents and road closures' },
  { id: 'PROTEST', label: 'Protests', description: 'Protest and public gathering updates' },
  { id: 'LOADSHEDDING', label: 'Load Shedding', description: 'Power outage updates' },
  { id: 'WEATHER', label: 'Weather', description: 'Severe weather warnings' },
]

const PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
]

export default function NotificationsPage() {
  const [notificationsSupported, setNotificationsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Preferences
  const [breakingNews, setBreakingNews] = useState(true)
  const [liveEvents, setLiveEvents] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [province, setProvince] = useState<string>('')

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator
    setNotificationsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)

      // Check if already subscribed
      checkSubscription()
    } else {
      setLoading(false)
    }
  }, [])

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('Error checking subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnableNotifications = async () => {
    setSaving(true)
    try {
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult === 'granted') {
        const registration = await navigator.serviceWorker.ready

        // Subscribe to push
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey ? urlBase64ToUint8Array(vapidKey) : undefined,
        })

        // Send subscription to server
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
              auth: arrayBufferToBase64(subscription.getKey('auth')),
            },
            preferences: {
              breakingNews,
              liveEvents,
              categories: selectedCategories.length > 0 ? selectedCategories : null,
              province: province || null,
            },
          }),
        })

        setIsSubscribed(true)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDisableNotifications = async () => {
    setSaving(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe()

        // Tell server
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }

      setIsSubscribed(false)
    } catch (error) {
      console.error('Error disabling notifications:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!isSubscribed) return

    setSaving(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
              auth: arrayBufferToBase64(subscription.getKey('auth')),
            },
            preferences: {
              breakingNews,
              liveEvents,
              categories: selectedCategories.length > 0 ? selectedCategories : null,
              province: province || null,
            },
          }),
        })

        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    )
  }

  if (loading) {
    return (
      <div
        className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png?v=2')" }}
      >
        <div className="bg-black/60 min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png?v=2')" }}
    >
      <div className="bg-black/60 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <Bell className="h-12 w-12 text-primary-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              Notification Settings
            </h1>
            <p className="text-gray-300">
              Get alerted about breaking news and live events in South Africa
            </p>
          </div>

          {!notificationsSupported ? (
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-6 text-center">
              <Smartphone className="h-10 w-10 text-amber-400 mx-auto mb-3" />
              <h2 className="font-semibold text-amber-200 mb-2">
                Notifications Not Supported
              </h2>
              <p className="text-amber-300 text-sm">
                Your browser or device doesn&apos;t support push notifications.
                Try using a modern browser like Chrome, Firefox, or Edge.
              </p>
            </div>
          ) : permission === 'denied' ? (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
              <BellOff className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <h2 className="font-semibold text-red-200 mb-2">
                Notifications Blocked
              </h2>
              <p className="text-red-300 text-sm mb-4">
                You&apos;ve blocked notifications from SpillNova.
                To enable them, update your browser settings.
              </p>
              <p className="text-xs text-red-400">
                Look for the lock icon in your browser&apos;s address bar
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isSubscribed ? (
                      <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
                        <Bell className="h-6 w-6 text-green-400" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center">
                        <BellOff className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h2 className="font-semibold text-white">
                        Push Notifications
                      </h2>
                      <p className="text-sm text-gray-400">
                        {isSubscribed ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={isSubscribed ? handleDisableNotifications : handleEnableNotifications}
                    disabled={saving}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      isSubscribed
                        ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    } disabled:opacity-50`}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isSubscribed ? (
                      'Disable'
                    ) : (
                      'Enable'
                    )}
                  </button>
                </div>
              </div>

              {/* Preferences (only show when subscribed) */}
              {isSubscribed && (
                <>
                  {/* Notification Types */}
                  <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/10">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      What to Notify
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={breakingNews}
                          onChange={(e) => setBreakingNews(e.target.checked)}
                          className="w-5 h-5 rounded border-white/20 bg-black/30 text-primary-500 focus:ring-primary-500"
                        />
                        <div>
                          <span className="font-medium text-white">
                            Breaking News
                          </span>
                          <p className="text-sm text-gray-400">
                            Urgent alerts and major breaking stories
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={liveEvents}
                          onChange={(e) => setLiveEvents(e.target.checked)}
                          className="w-5 h-5 rounded border-white/20 bg-black/30 text-primary-500 focus:ring-primary-500"
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            Live Events
                          </span>
                          <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                          <p className="text-sm text-gray-400">
                            Real-time updates from citizen journalists
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/10">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary-500" />
                      Categories
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Select which categories you want to receive notifications for.
                      Leave all unchecked to receive all categories.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          className={`p-3 rounded-lg text-left transition-colors ${
                            selectedCategories.includes(cat.id)
                              ? 'bg-primary-500/20 border-2 border-primary-500'
                              : 'bg-white/5 border-2 border-transparent hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white text-sm">
                              {cat.label}
                            </span>
                            {selectedCategories.includes(cat.id) && (
                              <Check className="h-4 w-4 text-primary-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Province Filter */}
                  <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/10">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary-500" />
                      Location Filter
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Only receive notifications for events in a specific province.
                      Leave empty for all of South Africa.
                    </p>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      title="Select province filter"
                      className="w-full px-4 py-2 rounded-lg border border-white/20 bg-black/30 text-white"
                    >
                      <option value="">All South Africa</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Save Button */}
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    disabled={saving}
                    className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : saved ? (
                      <>
                        <Check className="h-5 w-5" />
                        Saved!
                      </>
                    ) : (
                      'Save Preferences'
                    )}
                  </button>
                </>
              )}

              {/* Privacy Note */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Your notification preferences are stored anonymously.
                  We never collect personal information or track your identity.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper functions
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

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}
