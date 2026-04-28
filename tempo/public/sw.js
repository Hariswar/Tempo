const CACHE_NAME = 'tempo-static-v1'
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/tempo-icon.svg',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const requestUrl = new URL(request.url)
  if (requestUrl.origin !== self.location.origin) return
  const cacheableDestinations = new Set(['document', 'script', 'style', 'image', 'font'])
  if (!cacheableDestinations.has(request.destination)) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        const cloned = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned))
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
  )
})
