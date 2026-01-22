// SA Leaks Service Worker
const CACHE_NAME = 'saleaks-v2'
const OFFLINE_URL = '/offline'

// Assets to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/live',
  '/browse',
  '/submit',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - network-first for HTML, cache-first for static assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip API requests (always fetch fresh)
  if (event.request.url.includes('/api/')) return

  // For HTML pages (navigation requests) - ALWAYS use network-first
  // This ensures fresh content and proper hydration
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh response for offline use
          if (response.ok) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          // Only use cache if network fails (offline)
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match(OFFLINE_URL)
          })
        })
    )
    return
  }

  // For static assets (JS, CSS, images) - cache-first with background update
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response and update cache in background
        event.waitUntil(
          fetch(event.request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response)
              })
            }
          }).catch(() => {})
        )
        return cachedResponse
      }

      return fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.ok && response.type === 'basic') {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          return new Response('Offline', { status: 503 })
        })
    })
  )
})

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()

  const options = {
    body: data.body || 'New update on SA Leaks',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/live',
      dateOfArrival: Date.now(),
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-action.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-action.png',
      },
    ],
    tag: data.tag || 'saleaks-notification',
    renotify: true,
  }

  // Add category-specific styling
  if (data.category === 'BREAKING') {
    options.requireInteraction = true
    options.urgency = 'high'
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'SA Leaks', options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') return

  const url = event.notification.data?.url || '/live'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Open a new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Background sync for offline posts
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPendingPosts())
  }
})

async function syncPendingPosts() {
  // Get pending posts from IndexedDB and submit them
  // This would be implemented with IndexedDB integration
  console.log('Syncing pending posts...')
}
