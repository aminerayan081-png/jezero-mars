/* =========================================================
   JEZERO - app.js
   Part 1: menu behaviour only.
   No scientific data and no map are in this file yet.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- 1. Find the parts of the page we need ---------- */

  var header = document.querySelector(".top-bar");
  var menu = document.querySelector(".menu");

  /* If the page has no menu, stop quietly instead of breaking. */
  if (!header || !menu) {
    return;
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Pair every menu link with the section it points to. */
  var items = [];
  var menuLinks = menu.querySelectorAll("a[href^='#']");

  for (var i = 0; i < menuLinks.length; i++) {
    var link = menuLinks[i];
    var section = document.getElementById(link.getAttribute("href").slice(1));
    if (section) {
      items.push({ link: link, section: section });
    }
  }

  /* ---------- 2. Keep section titles clear of the sticky top bar ---------- */

  function updateScrollOffsets() {
    var space = header.offsetHeight + 12;
    for (var n = 0; n < items.length; n++) {
      items[n].section.style.scrollMarginTop = space + "px";
    }
  }

  /* ---------- 3. Highlight the menu button for the current section ---------- */

  var activeLink = null;
  var lockUntil = 0; /* pause highlighting briefly after a tap */

  function scrollMenuToLink(link) {
    /* Slide the menu sideways so the highlighted button is in view. */
    var menuBox = menu.getBoundingClientRect();
    var linkBox = link.getBoundingClientRect();
    var target =
      menu.scrollLeft +
      (linkBox.left - menuBox.left) -
      (menu.clientWidth / 2 - linkBox.width / 2);

    menu.scrollTo({
      left: target,
      behavior: reduceMotion ? "auto" : "smooth"
    });
  }

  function setActive(link) {
    if (link === activeLink) {
      return;
    }
    for (var n = 0; n < items.length; n++) {
      items[n].link.classList.remove("active");
      items[n].link.removeAttribute("aria-current");
    }
    activeLink = link;
    if (link) {
      link.classList.add("active");
      link.setAttribute("aria-current", "true");
      scrollMenuToLink(link);
    }
  }

  function findCurrentSection() {
    if (Date.now() < lockUntil || items.length === 0) {
      return;
    }

    /* At the very bottom of the page, the last section counts. */
    var atBottom =
      window.innerHeight + window.pageYOffset >=
      document.documentElement.scrollHeight - 4;
    if (atBottom) {
      setActive(items[items.length - 1].link);
      return;
    }

    /* Otherwise: the current section is the last one whose top
       has scrolled up past a line just below the top bar. */
    var line = header.offsetHeight + 24;
    var current = null;
    for (var n = 0; n < items.length; n++) {
      if (items[n].section.getBoundingClientRect().top <= line) {
        current = items[n].link;
      }
    }
    setActive(current);
  }

  /* ---------- 4. React to scrolling, tapping and resizing ---------- */

  var waiting = false;

  window.addEventListener(
    "scroll",
    function () {
      if (!waiting) {
        waiting = true;
        window.requestAnimationFrame(function () {
          findCurrentSection();
          waiting = false;
        });
      }
    },
    { passive: true }
  );

  window.addEventListener("resize", function () {
    updateScrollOffsets();
    findCurrentSection();
  });

  /* When a menu button is tapped, highlight it straight away. */
  for (var k = 0; k < items.length; k++) {
    (function (item) {
      item.link.addEventListener("click", function () {
        lockUntil = Date.now() + 900;
        setActive(item.link);
      });
    })(items[k]);
  }

  /* ---------- 5. Start up ---------- */

  updateScrollOffsets();
  findCurrentSection();

  /* ---------- 6. Reserved space for later ----------
     The real Mars map code will be added here in a later stage,
     once we have checked the NASA and USGS data sources.
     Nothing map-related exists yet on purpose.
  ---------------------------------------------------- */
})();
