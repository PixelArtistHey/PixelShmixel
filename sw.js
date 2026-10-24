/* Пиксельня: работа без интернета.
   Сеть в приоритете, поэтому новая версия приложения приходит сразу, как только она выложена.
   Если сети нет, открывается последняя сохранённая копия. Рисунки лежат в памяти браузера и от этого файла не зависят. */
const CACHE = 'pixelnya-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.add(new Request('./', { cache: 'reload' }))).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(r, { cache: 'no-cache' });
      if (res && res.ok && res.type === 'basic' && !res.redirected) {
        const c = await caches.open(CACHE);
        c.put(r.mode === 'navigate' ? new Request('./') : r, res.clone());
      }
      return res;
    } catch (err) {
      const c = await caches.open(CACHE);
      return (await c.match(r, { ignoreSearch: true })) ||
             (r.mode === 'navigate' ? await c.match('./') : null) ||
             Response.error();
    }
  })());
});
