// =============================================
// SERVICE WORKER — Ayuntamientos de Mallorca
// =============================================

const CACHE_STATIC = "static-v1";
const CACHE_DATA   = "data-v1";

// Recursos que se cachean al instalar (el "app shell")
const APP_SHELL = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/css/bootstrap.min.css",
  "/css/quiz.css",
  "/css/media.css",
  "/js/scripts.min.js",
  "/js/media.min.js",
  "/js/voice-speech.min.js",
  "/js/google-auth.min.js",
  "/js/quiz.min.js",
  "/offline.html",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png"
];

// ── INSTALL: precachear el shell ──────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  // Activar inmediatamente sin esperar a que cierren las pestañas antiguas
  self.skipWaiting();
});

// ── ACTIVATE: limpiar caches antiguas ────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![CACHE_STATIC, CACHE_DATA].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH: estrategia por tipo de recurso ────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignorar peticiones externas (CDN, APIs externas, OpenWeatherMap...)
  if (url.origin !== location.origin) return;

  // JSON y datos → Network-first (datos frescos, fallback a caché)
  if (url.pathname.endsWith(".json")) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Navegación HTML → Cache-first con fallback a offline.html
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("/index.html").then((cached) => cached || fetch(req))
    );
    return;
  }

  // Assets (CSS, JS, imágenes) → Cache-first
  event.respondWith(cacheFirst(req));
});

// ── Estrategia Network-first ──────────────────────────────
async function networkFirst(req) {
  const cache = await caches.open(CACHE_DATA);
  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(req);
    return cached || caches.match("/offline.html");
  }
}

// ── Estrategia Cache-first ────────────────────────────────
async function cacheFirst(req) {
  const cached = await caches.match(req);
  return cached || fetch(req);
}