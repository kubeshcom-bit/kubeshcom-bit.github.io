// Версию меняйте при каждом обновлении игры (вместе с GAME_VERSION в index.html)
var V = "1.0.5", C = "farm-" + V;
var SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(C).then(function (c) { return Promise.all(SHELL.map(function (u) { return fetch(new Request(u, { cache: "reload" })).then(function (res) { if (res.ok) return c.put(u, res); }); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== C; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// сначала кэш (мгновенный старт даже на слабой связи), обновление подтягивается в фоне
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (u.origin !== location.origin) return;
  e.respondWith(caches.open(C).then(function (c) {
    return c.match(r, { ignoreSearch: true }).then(function (m) {
      var net = fetch(r).then(function (res) {
        if (res && res.ok) c.put(r, res.clone());
        return res;
      }).catch(function () { return null; });
      e.waitUntil(net);
      return m || net.then(function (res) { return res || caches.match("index.html"); });
    });
  }));
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window" }).then(function (cs) { return cs.length ? cs[0].focus() : clients.openWindow("./"); }));
});
