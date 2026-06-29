// ── Space Trader Service Worker ───────────────────────────────────────────
// VERSION is injected by scripts/inject-sw-version.cjs at build time
// Manual bump: change CACHE_NAME below AND in scripts/inject-sw-version.cjs
const CACHE_NAME = "space-trader-v0.23.0";

// Static assets — JS/CSS hashes injected by build script
const ASSETS = [
  "/space-trader/",
  "/space-trader/index.html",
  "/space-trader/manifest.webmanifest",
  "/space-trader/icon-192.png",
  "/space-trader/icon-512.png",
  "/space-trader/apple-touch-icon.png",
  // __HASHED_ASSETS__ — replaced by inject-sw-version.cjs
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Network-first: try network, fall back to cache (good for updates)
self.addEventListener("fetch", event => {
  // Only handle same-origin + /space-trader/ requests
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith("/space-trader/")) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful GET responses
        if (event.request.method === "GET" && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
