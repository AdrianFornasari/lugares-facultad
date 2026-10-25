/*
 * Lugares Facultad - GitHub Pages
 * Los identificadores de version y la lista de recursos se generan al compilar
 * mediante scripts/stamp-sw.mjs. No editar dist/sw.js manualmente.
 */
const CACHE_PREFIX = 'fcm-pages-lugares-facultad-';
const CACHE = CACHE_PREFIX + '__BUILD_ID__';
const PRECACHE = __PRECACHE__;
const OLD_CACHE = 'fcm-react-v029-readability-20261019';
const ROOT = new URL('./', self.registration.scope).href;
const SCOPE_URL = new URL(self.registration.scope);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const requests = PRECACHE.map((path) => new Request(
      new URL(path, ROOT).href,
      { cache: 'reload' }
    ));
    // La instalacion es atomica: si falta un plano u otro recurso, sigue
    // funcionando la version anterior hasta que pueda instalarse la nueva.
    await cache.addAll(requests);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => (name.startsWith(CACHE_PREFIX) || name === OLD_CACHE) && name !== CACHE)
      .map((name) => caches.delete(name)));
    // No borrar caches de /autonomo ni las de otras aplicaciones del usuario.
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== SCOPE_URL.origin || !url.pathname.startsWith(SCOPE_URL.pathname)) return;

  if (request.mode === 'navigate') {
    // HTML: primero red, para no seguir sirviendo un index.html viejo.
    // Sin conexion: recuperar el index.html guardado.
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok) {
          await cache.put(ROOT, response.clone()).catch(() => {});
        }
        return response;
      } catch {
        return (await cache.match(ROOT)) || Response.error();
      }
    })());
    return;
  }

  // Recursos estaticos: buscar en la cache versionada y, si no estan,
  // descargarlos. El nuevo build reemplaza la cache entera.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const stored = await cache.match(request);
    if (stored) return stored;
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  })());
});
