const CACHE = 'shai-connect-v1'
const OFFLINE_URLS = ['/feed', '/']

self.addEventListener('install', e => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS)))
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (!e.request.url.startsWith(self.location.origin)) return

  // Network-first for API/Supabase calls
  if (e.request.url.includes('/api/') || e.request.url.includes('supabase')) return

  // Network-first, fallback to cache for navigation
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match('/feed').then(r => r || caches.match('/'))
      )
    )
    return
  }

  // Stale-while-revalidate for static assets
  if (e.request.destination === 'image' || e.request.destination === 'style' || e.request.destination === 'script') {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const fetchPromise = fetch(e.request).then(res => {
            cache.put(e.request, res.clone())
            return res
          })
          return cached || fetchPromise
        })
      )
    )
  }
})
