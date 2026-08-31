// Minimal service worker: exists mainly to satisfy PWA installability and
// give the app shell (icons, manifest, static JS/CSS) an offline cache.
// Deliberately does NOT cache pages or API responses — this app shows real
// financial data, and a cached dashboard could show a stale balance while
// offline, which is worse than just failing to load.
const CACHE_NAME = "menkeu-static-v1";
// Only our own rarely-changing assets. Deliberately excludes /_next/static/ —
// those chunk filenames are content-hashed and already served with correct
// immutable Cache-Control headers, so a service-worker cache-first layer on
// top adds no benefit and risks serving a stale chunk after a new deploy.
const STATIC_PATH_PREFIXES = ["/icons/", "/brand/"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isStaticAsset = STATIC_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
  if (event.request.method !== "GET" || !isStaticAsset) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    })
  );
});
