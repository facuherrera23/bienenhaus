const CACHE = 'bienenhaus-v5';
const API_CACHE = 'bienenhaus-api-v1';
const IMAGE_CACHE = 'bienenhaus-imgs-v1';
const FONT_CACHE = 'bienenhaus-fonts-v1';

const PRECACHE = [
  '/css/styles.min.css?v=__VERSION__',
  '/css/detalle.min.css?v=__VERSION__',
  '/css/comparador.min.css?v=__VERSION__',
  '/css/alquiler.min.css?v=__VERSION__',
  '/css/admin.min.css?v=__VERSION__',
  '/js/api.min.js?v=__VERSION__',
  '/js/main.min.js?v=__VERSION__',
  '/js/properties.min.js?v=__VERSION__',
  '/js/agents.min.js?v=__VERSION__',
  '/js/detalle.min.js?v=__VERSION__',
  '/js/comparador.min.js?v=__VERSION__',
  '/js/venta-ui.min.js?v=__VERSION__',
  '/js/rentals.min.js?v=__VERSION__',
  '/js/rentals-ui.min.js?v=__VERSION__',
  '/js/mapa.min.js?v=__VERSION__',
  '/js/offline.min.js?v=__VERSION__',
  '/js/sw-register.min.js?v=__VERSION__',
  '/manifest.json?v=__VERSION__',
  '/offline.html?v=__VERSION__',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(
        PRECACHE.map((url) =>
          cache.add(url).catch(() => {
            console.warn('[SW] fallo precache:', url);
          })
        )
      )
    )
  );
});

self.addEventListener('activate', (e) => {
  const keep = [CACHE, API_CACHE, IMAGE_CACHE, FONT_CACHE];
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // No interceptar requests cross-origin (CSP bloquea fetch() del SW en terceros)
  if (url.origin !== self.location.origin && !url.hostname.includes('cloudinary') && !url.hostname.includes('fonts.googleapis') && !url.hostname.includes('fonts.gstatic')) {
    return;
  }

  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com') || url.pathname.match(/\.(woff2?|ttf|otf|eot)(\?|$)/i)) {
    e.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          }).catch(() => new Response('', { status: 200 }));
        })
      )
    );
    return;
  }

  if (url.pathname.match(/\.(webp|png|jpg|jpeg|gif|avif|svg|ico)(\?|$)/i)) {
    if (url.hostname !== self.location.hostname && !url.hostname.includes('cloudinary')) {
      return;
    }
    e.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          }).catch(() => cached || new Response('', { status: 200 }));
          return cached || fetchPromise;
        })
      ).catch(() => fetch(request).catch(() => new Response('', { status: 200 })))
    );
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      caches.open(API_CACHE).then((cache) =>
        fetch(request).then((res) => {
          if (res.ok && res.type === 'basic') {
            cache.put(request, res.clone());
          }
          return res;
        }).catch(() =>
          cache.match(request).then((cached) => cached || new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } }))
        )
      ).catch(() => new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).then((res) => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      }).catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/offline.html') || caches.match('/'))
      )
    );
    return;
  }

  e.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((res) => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      }).catch(() => cached || new Response('', { status: 200 }));
      return cached || fetchPromise;
    }).catch(() => fetch(request).catch(() => new Response('', { status: 200 })))
  );
});

self.addEventListener('push', (e) => {
  let data = { title: 'Bienenhaus', body: '', icon: '/images/logo-bienenhaus.png' };
  try { data = e.data?.json() ?? data; } catch {}
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    badge: '/images/logo-bienenhaus.png',
    data: data.url ? { url: data.url } : {},
  });
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  clients.openWindow(url);
});
