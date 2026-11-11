/* StudyCISSP service worker: instant repeat visits and offline reading.
   - The page shell and every script/style it references are cached when the worker installs.
   - Pages: network first, falling back to the cached copy when offline.
   - Scripts, styles, icons: served from cache, refreshed in the background.
   - Never cached: the database proxy (/sb/), APIs, Netlify internals, PDFs, and anything not GET. */
const VERSION = "__BUILD__";
const CACHE = "studycissp-" + VERSION;

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    const res = await fetch("/", { cache: "no-store" });
    const html = await res.clone().text();
    await c.put("/", res);
    const urls = [...html.matchAll(/(?:src|href)="((?:assets\/)[^"]+)"/g)].map(m => "/" + m[1]);
    urls.push("/manifest.webmanifest", "/assets/icons/icon-192.png");
    await Promise.all([...new Set(urls)].map(u => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("studycissp-") && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

const skip = (u) => u.origin !== location.origin || /^\/(sb|api|\.netlify)\//.test(u.pathname) || /\.pdf$/i.test(u.pathname) || u.pathname === "/sw.js";

self.addEventListener("fetch", (e) => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== "GET" || skip(u)) return;
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try { const res = await fetch(req); const c = await caches.open(CACHE); c.put("/", res.clone()); return res; }
      catch (err) { return (await caches.match("/")) || Response.error(); }
    })());
    return;
  }
  e.respondWith((async () => {
    const c = await caches.open(CACHE), hit = await c.match(req);
    const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || Response.error();
  })());
});
