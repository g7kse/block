/* =========================================================================
   service-worker.js
   Caches the full app shell so the planner works entirely offline once
   it has been loaded once. No data ever passes through here — IndexedDB
   is untouched by the service worker.
   ========================================================================= */
const CACHE_NAME = "rowing-planner-v2";
const SCOPE = self.registration.scope;

const ASSETS = [
  "./",
  "index.html",
  "offline.html",
  "manifest.json",
  "css/bootstrap.min.css",
  "css/bootstrap-icons.min.css",
  "css/fonts.css",
  "css/styles.css",
  "css/fonts/oswald/oswald-latin-400-normal.woff2",
  "css/fonts/oswald/oswald-latin-500-normal.woff2",
  "css/fonts/oswald/oswald-latin-600-normal.woff2",
  "css/fonts/oswald/oswald-latin-700-normal.woff2",
  "css/fonts/inter/inter-latin-400-normal.woff2",
  "css/fonts/inter/inter-latin-500-normal.woff2",
  "css/fonts/inter/inter-latin-600-normal.woff2",
  "css/fonts/inter/inter-latin-700-normal.woff2",
  "css/fonts/jetbrains-mono/jetbrains-mono-latin-400-normal.woff2",
  "css/fonts/jetbrains-mono/jetbrains-mono-latin-500-normal.woff2",
  "css/fonts/jetbrains-mono/jetbrains-mono-latin-700-normal.woff2",
  "css/fonts/bootstrap-icons.woff2",
  "css/fonts/bootstrap-icons.woff",
  "js/bootstrap.bundle.min.js",
  "js/db.js",
  "js/constants.js",
  "js/countdown.js",
  "js/blocks.js",
  "js/sessions.js",
  "js/calendar.js",
  "js/tests.js",
  "js/app.js",
  "icons/icon-72.png",
  "icons/icon-96.png",
  "icons/icon-128.png",
  "icons/icon-144.png",
  "icons/icon-152.png",
  "icons/icon-192.png",
  "icons/icon-384.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // opportunistically cache same-origin successful responses
          if (res && res.status === 200 && req.url.startsWith(self.location.origin)) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => {
          if (req.mode === "navigate") return caches.match("offline.html");
        });
    })
  );
});
