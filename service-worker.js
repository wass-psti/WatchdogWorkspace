importScripts('./config/runtime-assets.js');

const RELEASE = self.WM_RUNTIME_RELEASE || Object.freeze({
  schema: 'wm-runtime-release-v1',
  appVersion: '1.43.2',
  strategyRevision: 'm33-explicit-update-v1',
  buildId: 'source-m33-v1',
  cacheNamespace: 'work-management-v1.43.2',
});
const CORE = Array.isArray(self.WM_RUNTIME_ASSETS) ? self.WM_RUNTIME_ASSETS : [];
const CACHE_NAMESPACE = RELEASE.cacheNamespace || 'work-management-v1.43.2';
const CACHE = `${CACHE_NAMESPACE}-shell-${RELEASE.buildId || 'unknown'}`;
const UPDATE_MESSAGE = 'WM_ACTIVATE_UPDATE';

const openCurrentCache = () => caches.open(CACHE);
const isOwnedCache = (key) => key === CACHE_NAMESPACE || key.startsWith(`${CACHE_NAMESPACE}-`);
const isEmbeddedModuleRequest = (url) => url.pathname.includes('/apps/');
const hasSensitiveRequestHeaders = (request) => request.headers.has('authorization') || request.headers.has('cookie');
const canCacheNavigation = (request, url) => !hasSensitiveRequestHeaders(request) && !url.search;
const isBundledShellAsset = (url) => url.pathname.includes('/build/');
const isMutableSharedRuntime = (url) => [
  '/assets/js/runtime/motion-orchestrator.js',
  '/assets/js/runtime/motion-design.js',
  '/assets/js/runtime/module-bootstrap.js',
  '/assets/js/runtime/fueltrack-analytics.js',
  '/assets/css/motion-design.css',
].some((suffix) => url.pathname.endsWith(suffix));
const offlineModuleResponse = () => new Response('Active cloud connection required.', { status: 503, headers: { 'Content-Type': 'text/plain' } });

async function cacheNavigation(cache, request, url, response) {
  if (response.ok && canCacheNavigation(request, url)) await cache.put(request, response.clone()).catch(() => {});
  return response;
}

async function networkNavigation(event, request, url) {
  const cache = await openCurrentCache();
  try {
    const preloaded = await event.preloadResponse;
    if (preloaded) return cacheNavigation(cache, request, url, preloaded);
    const response = await fetch(request, { cache: 'no-store' });
    return cacheNavigation(cache, request, url, response);
  } catch {
    if (isEmbeddedModuleRequest(url)) return offlineModuleResponse();
    const exact = await cache.match(request);
    if (exact) return exact;
    return (await cache.match('./index.html')) || Response.error();
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await openCurrentCache();
    await cache.addAll(CORE);
  })());
});

self.addEventListener('message', (event) => {
  const type = event.data?.type;
  if (type === UPDATE_MESSAGE) {
    event.waitUntil?.(self.skipWaiting());
    return;
  }
  if (type === 'WM_GET_RELEASE') {
    const payload = Object.freeze({ type: 'WM_SW_RELEASE', release: RELEASE, cacheName: CACHE });
    if (event.ports?.[0]) event.ports[0].postMessage(payload);
    else event.source?.postMessage?.(payload);
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => isOwnedCache(key) && key !== CACHE).map((key) => caches.delete(key)));
    try { await self.registration.navigationPreload?.enable(); } catch { /* best effort */ }
    await self.clients.claim();
    const clients = await self.clients.matchAll?.({ type: 'window', includeUncontrolled: true }) || [];
    for (const client of clients) {
      client.postMessage?.(Object.freeze({ type: 'WM_SW_ACTIVATED', release: RELEASE, cacheName: CACHE }));
    }
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const request = event.request;

  if (hasSensitiveRequestHeaders(request)) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkNavigation(event, request, url));
    return;
  }

  // Embedded business applications remain network-authoritative until their M26
  // compatibility islands are explicitly retired. Never silently serve stale app code.
  if (isEmbeddedModuleRequest(url)) {
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(offlineModuleResponse));
    return;
  }

  // Hashed Vite output is immutable by filename. Only the current build cache is
  // consulted, so an obsolete cache cannot satisfy a new build's request.
  if (isBundledShellAsset(url)) {
    event.respondWith((async () => {
      const cache = await openCurrentCache();
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone()).catch(() => {});
      return response;
    })());
    return;
  }

  if (isMutableSharedRuntime(url)) {
    event.respondWith((async () => {
      const cache = await openCurrentCache();
      try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok) await cache.put(request, response.clone()).catch(() => {});
        return response;
      } catch {
        return (await cache.match(request)) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await openCurrentCache();
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && ['script', 'style', 'image', 'font', 'manifest'].includes(request.destination)) {
        await cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch {
      return Response.error();
    }
  })());
});
