/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'workplex-v2';
const OFFLINE_URL = '/offline.html';

// Critical assets to cache immediately (small, essential)
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Non-critical assets to cache in background (larger files)
const ASSETS_TO_CACHE = [
  '/src/main.tsx',
  '/src/index.css',
];

// ============================================================
// Install Event - Cache critical assets immediately
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching critical assets');
      // Cache critical assets first (fast load)
      return cache.addAll(CRITICAL_ASSETS).then(() => {
        // Cache non-critical in background (don't block install)
        cache.addAll(ASSETS_TO_CACHE).catch(() => { });
      });
    }).catch(err => console.error('[SW] Cache install failed:', err))
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// ============================================================
// Activate Event - Clean old caches
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    ).catch(err => console.error('[SW] Cache cleanup failed:', err))
  );
  // Take control immediately
  self.clients.claim();
});

// ============================================================
// Fetch Event - Optimized caching strategy
// ============================================================
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  // Network-first strategy for API calls (always fresh data)
  if (event.request.url.includes('/api/') ||
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('firestore.googleapis.com')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Cache-first strategy for static assets (instant load)
  if (event.request.url.includes('/assets/') ||
    event.request.url.includes('/static/') ||
    event.request.url.includes('.css') ||
    event.request.url.includes('.js')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Stale-while-revalidate for HTML pages (fast + eventually fresh)
  event.respondWith(staleWhileRevalidate(event.request));
});

// ============================================================
// Caching Strategies
// ============================================================

// Cache First - Fastest for static assets
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Cache hit:', request.url);
      return cached;
    }

    // Not in cache, fetch from network
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache-first failed:', error);
    return caches.match('/');
  }
}

// Network First - Always fresh for dynamic content
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, using cache');
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale While Revalidate - Fast + eventually fresh
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Fetch from network in background
  const fetchPromise = fetch(request).then((response) => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  // Return cached version immediately, or wait for network
  return cached || fetchPromise || caches.match('/');
}

// ============================================================
// Push Notification Handler
// ============================================================
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'You have a new notification from WorkPlex',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.data?.url || '/home',
      type: data.data?.type || 'general',
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    tag: data.data?.type || 'workplex-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title || 'WorkPlex', options));
});

// ============================================================
// Notification Click Handler
// ============================================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/home';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen)) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

// ============================================================
// Background Sync for Offline Actions
// ============================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

async function syncPendingActions() {
  // Sync offline actions when connection is restored
  console.log('[SW] Syncing pending actions');
}

console.log('[SW] Service Worker loaded - optimized for performance');
