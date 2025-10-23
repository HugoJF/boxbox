const CACHE_NAME = "boxbox-pwa-v1"
const PRECACHE_URLS = ["/", "/items"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const request = event.request

  if (request.method !== "GET") {
    return
  }

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request)
        .then((response) => {
          const shouldCache =
            response.status === 200 && response.type === "basic" && request.headers.get("accept")?.includes("text/html")

          if (shouldCache) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache).catch(() => {})
            })
          }

          return response
        })
        .catch(async () => {
          if (request.mode === "navigate") {
            const cachedHome = await caches.match("/")
            if (cachedHome) {
              return cachedHome
            }
          }
          return Response.error()
        })
    }),
  )
})
