/* 落葉松季自駕 — 離線快取 */
const CACHE = 'banff-2026-c3d4e5f6a7';
const SHELL = ['./', './index.html', './manifest.webmanifest',
               './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function cacheable(url) {
  return url.origin === self.location.origin
      || url.hostname.endsWith('gstatic.com')
      || url.hostname.endsWith('googleapis.com');
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 頁面導覽：優先拿最新版（連線時一定是新的），逾時或離線才用快取
  if (req.mode === 'navigate') {
    e.respondWith(
      new Promise(resolve => {
        let settled = false;
        const done = r => { if (!settled) { settled = true; resolve(r); } };
        const timer = setTimeout(() => {
          caches.match('./index.html').then(hit => { if (hit) done(hit); });
        }, 3500);
        fetch(req).then(res => {
          clearTimeout(timer);
          caches.open(CACHE).then(c => c.put('./index.html', res.clone()));
          done(res);
        }).catch(() => {
          clearTimeout(timer);
          caches.match('./index.html').then(hit => done(hit || Response.error()));
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (cacheable(url) && (res.ok || res.type === 'opaque')) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
