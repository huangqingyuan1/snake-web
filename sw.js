const PARTS = Array.from({length: 7}, (_, i) => `index.wasm.${i}`);
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (!u.pathname.endsWith('/index.wasm')) return;
  e.respondWith((async () => {
    const bodies = [];
    for (const p of PARTS) {
      const r = await fetch(p);
      if (!r.ok) return new Response('missing ' + p, {status: 404});
      bodies.push(r.body);
    }
    const stream = new ReadableStream({
      async start(c) {
        for (const b of bodies) {
          const rd = b.getReader();
          for (;;) { const {done, value} = await rd.read(); if (done) break; c.enqueue(value); }
        }
        c.close();
      }
    });
    return new Response(stream, {headers: {'Content-Type': 'application/wasm'}});
  })());
});
