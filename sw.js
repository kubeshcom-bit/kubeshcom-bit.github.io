// Версию меняйте при каждом обновлении игры (вместе с GAME_VERSION в index.html)
var V = "1.0.3", C = "farm-" + V;
var SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(C).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== C; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// сначала сеть (чтобы приходили обновления), без интернета — из кэша
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(function (res) {
    var cp = res.clone();
    caches.open(C).then(function (c) { c.put(r, cp); });
    return res;
  }).catch(function () {
    return caches.match(r).then(function (m) { return m || caches.match("index.html"); });
  }));
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window" }).then(function (cs) { return cs.length ? cs[0].focus() : clients.openWindow("./"); }));
});
