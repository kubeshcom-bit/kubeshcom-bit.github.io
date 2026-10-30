// Версию меняйте при каждом обновлении игры (вместе с GAME_VERSION в index.html)
var V = "2.4.0", C = "farm-" + V;
var SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(C).then(function (c) { return Promise.all(SHELL.map(function (u) { return fetch(new Request(u, { cache: "reload" })).then(function (res) { if (res.ok) return c.put(u, res); }).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== C && k !== "rufarm-meta"; }).map(function (k) { return caches.delete(k); }));
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

// ---- Напоминания 5 раз в день (работает, когда браузер разрешает фоновую синхронизацию, и при серверном push) ----
function rmRun() {
  return caches.open("rufarm-meta").then(function (c) {
    return c.match("rm.json").then(function (r) { return r && r.json(); }).then(function (cfg) {
      if (!cfg || !cfg.on) return;
      var n = new Date(), day = n.getFullYear() + "-" + (n.getMonth() + 1) + "-" + n.getDate();
      return c.match("rm-state.json").then(function (r) { return r ? r.json() : { d: "", s: [] }; }).then(function (st) {
        if (st.d !== day) st = { d: day, s: [0, 0, 0, 0, 0] };
        var pick = -1;
        cfg.slots.forEach(function (sl, i) {
          var diff = n - new Date(n.getFullYear(), n.getMonth(), n.getDate(), sl.h, sl.m).getTime();
          if (!st.s[i] && diff >= 0 && diff <= 90 * 60 * 1000) pick = i;
        });
        if (pick < 0 || n.getHours() < 8 || n.getHours() >= 22) return; // тихие часы: ночью не беспокоим
        return self.clients.matchAll({ type: "window" }).then(function (cs) {
          if (cs.some(function (w) { return w.visibilityState === "visible"; })) return;
          for (var j = 0; j <= pick; j++) st.s[j] = 1;
          var t = cfg.texts[pick];
          return c.put("rm-state.json", new Response(JSON.stringify(st))).then(function () {
            return self.registration.showNotification(t[0], { body: t[1], icon: "icon-192.png", tag: "rm" + pick });
          });
        });
      });
    });
  });
}
self.addEventListener("periodicsync", function (e) { if (e.tag === "rufarm-remind") e.waitUntil(rmRun()); });
self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) {}
  e.waitUntil(self.registration.showNotification(d.title || "Rufarm", { body: d.body || "", icon: "icon-192.png", tag: d.tag || "push" }));
});
