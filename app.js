/* =========================================================
   JEZERO - app.js
   Foundation: menu behaviour only.

   What this file does:
   1. Finds the menu links and the sections they point to.
   2. Keeps section titles clear of the sticky top bar.
   3. Highlights the menu link of the section you are reading.
   4. Slides the menu sideways so the highlighted link stays visible.
   5. Gives future features (map, layers, route planner,
      EVA simulation) a safe place to plug in.

   There is no scientific data and no map code in this file.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Settings (safe to change) ---------- */

  var SETTINGS = {
    /* The highlight needs a small CSS rule. style.css does not have
       one yet, so this file adds it. If you later add a
       ".menu a.active" rule to style.css, set this to false. */
    injectActiveStyle: true,

    spaceBelowBar: 12,   /* gap (px) between top bar and a section title */
    readingLineGap: 24,  /* a section counts as "current" once its top passes this line */
    clickLockMs: 500,    /* after a tap, ignore scroll-based highlighting this long */
    settleMs: 150        /* scrolling counts as finished after this much quiet time */
  };

  /* ---------- Shared object for future features ---------- */

  var App = {
    sectionIds: [],         /* filled in by the menu code */
    currentSectionId: null  /* id of the highlighted section, or null */
  };
  window.JEZERO = App;

  var registry = [];
  var started = false;

  function runModule(entry) {
    /* One broken feature must never break the menu. */
    try {
      entry.init(App);
    } catch (error) {
      console.error("JEZERO: module '" + entry.name + "' failed.", error);
    }
  }

  /* Future files (map.js, layers.js, route.js, eva.js ...) can do:
       JEZERO.register("map", function (app) { ... });
     They only need to be loaded after app.js. */
  App.register = function (name, init) {
    if (typeof init !== "function") {
      console.warn("JEZERO: register('" + name + "') needs a function.");
      return;
    }
    var entry = { name: name, init: init };
    registry.push(entry);
    if (started) {
      runModule(entry);
    }
  };

  /* ---------- Optional debug box (for testing on a phone) ----------
     Only appears when the address ends with ?debug=1 */

  function createDebugBox() {
    if (!/[?&]debug=1(&|$)/.test(window.location.search)) {
      return null;
    }
    var box = document.createElement("div");
    box.style.cssText =
      "position:fixed;left:8px;bottom:8px;z-index:3000;padding:6px 10px;" +
      "background:#000;color:#5fbf7a;font:12px/1.4 monospace;" +
      "border:1px solid #5fbf7a;border-radius:6px;max-width:90vw;";
    document.body.appendChild(box);
    return box;
  }

  /* ---------- Highlight style ---------- */

  function addActiveStyle() {
    if (!SETTINGS.injectActiveStyle || document.getElementById("jezero-active-style")) {
      return;
    }
    var style = document.createElement("style");
    style.id = "jezero-active-style";
    style.textContent =
      ".menu a.active {" +
      " border-color: var(--orange, #e8672a);" +
      " background: rgba(232, 103, 42, 0.16);" +
      " color: var(--orange-soft, #f08a56); }";
    document.head.appendChild(style);
  }

  /* ---------- The menu ---------- */

  function setupNavigation() {
    var header = document.querySelector(".top-bar");
    var menu = document.querySelector(".menu");

    if (!header || !menu) {
      console.warn("JEZERO: '.top-bar' or '.menu' not found. Menu script skipped.");
      return;
    }

    addActiveStyle();

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* --- Pair every menu link with its section --- */

    var menuLinks = menu.querySelectorAll("a[href^='#']");
    var items = [];

    for (var i = 0; i < menuLinks.length; i++) {
      var link = menuLinks[i];
      var id = link.getAttribute("href").slice(1);
      var section = id ? document.getElementById(id) : null;

      if (section) {
        items.push({ link: link, section: section });
      } else {
        console.warn("JEZERO: menu link '" + link.getAttribute("href") +
          "' has no section with that id.");
      }
    }

    if (items.length === 0) {
      console.warn("JEZERO: no working menu links found.");
      return;
    }

    /* Sort by position on the page, in case the menu order differs. */
    items.sort(function (a, b) {
      if (a.section === b.section) {
        return 0;
      }
      return a.section.compareDocumentPosition(b.section) &
        Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });

    for (var s = 0; s < items.length; s++) {
      App.sectionIds.push(items[s].section.id);
    }

    var debugBox = createDebugBox();

    function updateDebug() {
      if (debugBox) {
        debugBox.textContent =
          "menu links: " + menuLinks.length +
          " | linked sections: " + items.length +
          " | active: " + (App.currentSectionId || "none");
      }
    }

    /* --- Keep section titles below the sticky bar --- */

    function updateScrollOffsets() {
      var space = header.offsetHeight + SETTINGS.spaceBelowBar;
            for (var n = 0; n < items.length; n++) {
        items[n].section.style.scrollMarginTop = space + "px";
      }
    }

    /* --- Slide the menu so the highlighted link stays visible --- */

    function scrollMenuTo(link) {
      var menuBox = menu.getBoundingClientRect();
      var linkBox = link.getBoundingClientRect();
      var delta = linkBox.left - menuBox.left -
        (menu.clientWidth - link.offsetWidth) / 2;
      if (typeof menu.scrollTo === "function") {
        menu.scrollTo({
          left: menu.scrollLeft + delta,
          behavior: reduceMotion ? "auto" : "smooth"
        });
      } else {
        menu.scrollLeft += delta;
      }
    }

    /* --- Highlight the current section --- */

    var clickLockUntil = 0;
    var settleTimer = null;
    var ticking = false;

    function setActive(id) {
      if (App.currentSectionId === id) {
        updateDebug();
        return;
      }
      App.currentSectionId = id;
      for (var k = 0; k < items.length; k++) {
        var isActive = items[k].section.id === id;
        items[k].link.classList.toggle("active", isActive);
        if (isActive) {
          items[k].link.setAttribute("aria-current", "true");
          scrollMenuTo(items[k].link);
        } else {
          items[k].link.removeAttribute("aria-current");
        }
      }
      updateDebug();
    }

    function updateCurrent() {
      var line = header.offsetHeight + SETTINGS.readingLineGap;
      var currentId = null;

      for (var m = 0; m < items.length; m++) {
        if (items[m].section.getBoundingClientRect().top <= line) {
          currentId = items[m].section.id;
        }
      }

      /* At the very bottom of the page, the last section counts. */
      var atBottom = window.innerHeight + window.pageYOffset >=
        document.documentElement.scrollHeight - 4;
      if (atBottom) {
        currentId = items[items.length - 1].section.id;
      }

      setActive(currentId);
    }

    function onScroll() {
      if (Date.now() >= clickLockUntil && !ticking) {
        ticking = true;
        window.requestAnimationFrame(function () {
          ticking = false;
          updateCurrent();
        });
      }
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(updateCurrent, SETTINGS.settleMs);
    }

    /* --- Tapping a menu link --- */

    for (var c = 0; c < items.length; c++) {
      (function (item) {
        item.link.addEventListener("click", function () {
          clickLockUntil = Date.now() + SETTINGS.clickLockMs;
          setActive(item.section.id);
        });
      })(items[c]);
    }

    /* --- Start --- */

    updateScrollOffsets();
    updateCurrent();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      updateScrollOffsets();
      updateCurrent();
    });
    window.addEventListener("load", function () {
      updateScrollOffsets();
      updateCurrent();
    });
  }

  /* ---------- Start everything ---------- */

  function start() {
    setupNavigation();
    started = true;
    for (var r = 0; r < registry.length; r++) {
      runModule(registry[r]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
