/* Rufarm · мост между игрой и Android (работает только внутри приложения, на сайте ничего не делает) */
(function () {
  var C = window.Capacitor;
  if (!C || !(C.isNativePlatform && C.isNativePlatform())) return;

  /* ---------- НАСТРОЙКИ РЕКЛАМЫ ----------
     Сейчас включены ТЕСТОВЫЕ объявления Google. Когда AdMob одобрит приложение:
     1) вставьте свои ID вместо пустых строк real,
     2) поставьте TEST = false. */
  var TEST = true;
  var IDS = {
    banner: { test: "ca-app-pub-3940256099942544/6300978111", real: "" },
    reward: { test: "ca-app-pub-3940256099942544/5224354917", real: "" }
  };
  function adId(k) { return TEST || !IDS[k].real ? IDS[k].test : IDS[k].real; }

  function P(name) {
    try { return (C.Plugins && C.Plugins[name]) || C.registerPlugin(name); } catch (e) { return null; }
  }
  var AdMob = P("AdMob"), LN = P("LocalNotifications"), App = P("App");

  /* ---------- Выход по кнопке «Выйти» ---------- */
  window.FARM_EXIT = function () { try { App.exitApp(); } catch (e) {} };

  /* ---------- Запас под системные панели (если WebView не отдаёт env()) ---------- */
  try {
    var st = document.createElement("style");
    st.textContent =
      ":root{padding-top:max(env(safe-area-inset-top,0px),var(--safe-area-inset-top,0px))!important}" +
      "nav{padding-bottom:max(env(safe-area-inset-bottom,0px),var(--safe-area-inset-bottom,0px))!important}";
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}

  /* ---------- AdMob ---------- */
  var initP = null;
  function init() {
    if (initP) return initP;
    initP = (async function () {
      try {
        if (!AdMob) return false;
        try { /* окно согласия (для стран ЕС) */
          var ci = await AdMob.requestConsentInfo();
          if (ci && ci.isConsentFormAvailable && ci.status === "REQUIRED") await AdMob.showConsentForm();
        } catch (e) {}
        await AdMob.initialize({ initializeForTesting: TEST });
        return true;
      } catch (e) { return false; }
    })();
    return initP;
  }

  function navH() { var n = document.querySelector("nav"); return n ? n.offsetHeight : 60; }

  window.FARM_AD = window.FARM_AD || {};

  /* нижний баннер: нативный, над нижним меню */
  FARM_AD.banner = function (slot) {
    try {
      slot.textContent = ""; slot.style.border = "none"; slot.style.background = "transparent";
      var lab = document.querySelector("#adb .adl"); if (lab) lab.style.display = "none";
    } catch (e) {}
    init().then(function (ok) {
      if (!ok) return;
      AdMob.showBanner({ adId: adId("banner"), adSize: "BANNER", position: "BOTTOM_CENTER", margin: navH() + 8, isTesting: TEST }).catch(function () {});
    });
  };

  /* в окне выхода отдельного места под рекламу нет (полноэкранная реклама при выходе запрещена правилами) */
  FARM_AD.exitSlot = function (slot) {
    try {
      var box = slot.parentNode.querySelector(".exl");
      slot.style.display = "none"; if (box) box.style.display = "none";
      slot.parentNode.querySelector(".exb").style.marginTop = "6px";
    } catch (e) {}
  };

  /* видео за награду */
  FARM_AD.show = function (onOk, onFail) {
    var finished = false, rewarded = false, subs = [], timer = null;
    function done() {
      if (finished) return; finished = true; clearTimeout(timer);
      subs.forEach(function (s) { try { s.remove(); } catch (e) {} });
      if (rewarded) { try { onOk(); } catch (e) {} } else if (onFail) { try { onFail(); } catch (e) {} }
    }
    init().then(async function (ok) {
      if (!ok) return done();
      try {
        function on(ev, fn) { return AdMob.addListener(ev, fn).then(function (h) { subs.push(h); }); }
        await on("onRewardedVideoAdReward", function () { rewarded = true; });
        await on("onRewardedVideoAdDismissed", function () { setTimeout(done, 300); });
        await on("onRewardedVideoAdFailedToLoad", function () { done(); });
        await on("onRewardedVideoAdFailedToShow", function () { done(); });
        timer = setTimeout(done, 45000); /* страховка, если реклама не загрузилась */
        await AdMob.prepareRewardVideoAd({ adId: adId("reward"), isTesting: TEST });
        var r = await AdMob.showRewardVideoAd();
        if (r) rewarded = true;
      } catch (e) { done(); }
    });
  };

  /* ---------- Напоминания 5 раз в день (настоящие, работают при закрытой игре) ---------- */
  function scheduleReminders() {
    var R = window.FARM_REMIND;
    if (!R || !LN) return;
    LN.requestPermissions().then(function (p) {
      if (!p || p.display !== "granted") return;
      var ids = R.slots.map(function (s, i) { return { id: 101 + i }; });
      return Promise.resolve(LN.createChannel && LN.createChannel({ id: "rufarm", name: "Rufarm", description: "Reminders", importance: 3 })).catch(function () {})
        .then(function () { return LN.cancel({ notifications: ids }); }).catch(function () {})
        .then(function () {
          return LN.schedule({
            notifications: R.slots.map(function (s, i) {
              var t = R.text(i);
              return { id: 101 + i, title: t[0], body: t[1], channelId: "rufarm", schedule: { on: { hour: s.h, minute: s.m }, allowWhileIdle: true } };
            })
          });
        });
    }).catch(function () {});
  }
  /* просим разрешение не сразу, а через 15 секунд игры */
  setTimeout(function () {
    var tries = 0, iv = setInterval(function () {
      if (window.FARM_REMIND || ++tries > 20) { clearInterval(iv); scheduleReminders(); }
    }, 500);
  }, 15000);
})();
