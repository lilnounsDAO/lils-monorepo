const CACHE_PREFIX = 'lil-nouns-pwa-';
const CACHE_NAME = CACHE_PREFIX + '__LIL_NOUNS_CACHE_REVISION__';
const OFFLINE_URL = new URL('/offline.html', self.location.origin).href;

// First segments owned by React Router. Backend, asset and redirect routes pass through.
const APP_ROUTES = new Set([
  'explore', 'profile', 'profiles', 'digest', 'vote', 'candidates',
  'rounds', 'topics', 'learn', 'vrgda', 'traits', 'brand', 'contracts',
  'draft', 'new', 'update', 'success',
]);

async function precacheOfflinePage() {
  const response = await fetch(OFFLINE_URL, {
    cache: 'reload',
    credentials: 'omit',
    redirect: 'error',
  });
  if (
    response.status !== 200 ||
    !response.headers.get('content-type')?.includes('text/html') ||
    !/name\s*=\s*["']?lil-nouns-offline\b/.test(await response.clone().text())
  ) {
    throw new Error('Lil Nouns offline page is missing from this release.');
  }
  const cache = await caches.open(CACHE_NAME);
  await cache.put(OFFLINE_URL, response);
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheOfflinePage());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    // A replacement worker waits for open clients to close before activation.
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function navigate(request) {
  try {
    return await fetch(request);
  } catch {
    const fallback = await caches.match(OFFLINE_URL, { cacheName: CACHE_NAME }).catch(() => undefined);
    return new Response(fallback?.body ?? 'Connection unavailable. Reconnect to load Lil Nouns.', {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': fallback ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8',
      },
    });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.mode !== 'navigate' || request.destination !== 'document') return;

  const url = new URL(request.url);
  const route = url.pathname.split('/', 2)[1].toLowerCase();
  if (url.origin === self.location.origin && (url.pathname === '/' || APP_ROUTES.has(route))) {
    event.respondWith(navigate(request));
  }
});
