/* Aluisia · service worker: guarda só os arquivos do site (nunca dados do painel) */
var VERSAO = 'aluisia-v3';
var ARQUIVOS = ['./', 'index.html', 'assets/style.css?v=3', 'assets/app.js?v=3', 'logo.svg', 'logotipo.svg',
  'img/aluisia-avatar.webp', 'img/aluisia-retrato.webp', 'img/aluisia-16x9.webp', 'img/icon-192.png', 'manifest.webmanifest'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSAO).then(function (c) { return c.addAll(ARQUIVOS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSAO; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  // páginas: rede primeiro (sempre a versão mais nova); o resto: cache primeiro
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(function (r) {
      var copia = r.clone(); caches.open(VERSAO).then(function (c) { c.put(e.request, copia); }); return r;
    }).catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match('index.html'); }); }));
    return;
  }
  e.respondWith(caches.match(e.request).then(function (r) {
    return r || fetch(e.request).then(function (resp) {
      if (resp.ok) { var copia = resp.clone(); caches.open(VERSAO).then(function (c) { c.put(e.request, copia); }); }
      return resp;
    });
  }));
});
