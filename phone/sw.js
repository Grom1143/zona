// «Служебный работник» МикроТест Петри: сайт работает и без интернета.
// Есть интернет – всегда берётся свежая версия с GitHub (правки видны сразу), и она же откладывается про запас;
// нет интернета – отдаётся сохранённая. Шрифты Google не сохраняются: без сети подставятся системные
const CACHE = "microtest-petri-v1";
const CORE = ["./", "index.html", "style.css", "analysis.js", "app.js", "vendor/xlsx.full.min.js",
  "logo.png", "favicon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "manifest.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;   // чужие адреса (шрифты) – как обычно
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
});
