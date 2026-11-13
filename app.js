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
      for (var n = 0; n < items.length;
