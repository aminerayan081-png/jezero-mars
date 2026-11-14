(function () {
  if (!/[?&]selftest=1/.test(location.search)) return;
  var errs = [];
  window.addEventListener("error", function (e) {
    errs.push((e.message || "error") + " (" + String(e.filename || "").split("/").pop() + ":" + e.lineno + ")");
  });
  window.addEventListener("load", function () { setTimeout(run, 1500); });

  function run() {
    var out = [];
    function ok(m) { out.push("PASS  " + m); }
    function bad(m) { out.push("FAIL  " + m); }

    // sections and order
    var ids = ["overview","map","geology","hazards","rover","planner","eva","survival","manual","sources"];
    var last = -1, good = true;
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) { bad("missing section #" + id); good = false; return; }
      var top = el.getBoundingClientRect().top + window.pageYOffset;
      if (top < last) { bad("#" + id + " is out of order"); good = false; }
      last = top;
    });
    if (good) ok("all 10 sections present and in order");

    // menu links
    var links = document.querySelectorAll(".menu a[href^='#']");
    var broken = [];
    for (var i = 0; i < links.length; i++) {
      if (!document.getElementById(links[i].getAttribute("href").slice(1))) broken.push(links[i].getAttribute("href"));
    }
    if (links.length !== 10) bad("menu has " + links.length + " links (expected 10)");
    else if (broken.length) bad("menu links with no target: " + broken.join(", "));
    else ok("10 menu links, all point to real sections");

    // duplicate ids
    var seen = {}, dups = [];
    document.querySelectorAll("[id]").forEach(function (n) {
      if (seen[n.id]) dups.push(n.id); seen[n.id] = 1;
    });
    if (dups.length) bad("duplicate ids: " + dups.join(", ")); else ok("no duplicate ids");

    // field manual
    var man = document.getElementById("manual");
    if (man) {
      var tabs = man.querySelectorAll(".fm-tab").length;
      var boxes = man.querySelectorAll("input[type=checkbox][data-id]").length;
      var panels = man.querySelectorAll(".fm-panel").length;
      if (tabs === 5 && panels === 5 && boxes > 0) ok("field manual: 5 chapters, " + boxes + " checklist items");
      else bad("field manual: " + tabs + " tabs, " + panels + " panels, " + boxes + " checkboxes");
      var shown = man.querySelectorAll(".fm-panel:not([hidden])").length;
      if (shown === 1) ok("field manual shows exactly one chapter"); else bad("field manual shows " + shown + " chapters at once");
    }

    // old section numbering
    var txt = document.body.innerText || "";
    if (/Section 9\b/.test(txt) && /Sources/.test(txt)) {
      var m = txt.match(/[^.\n]*Section 9\b[^.\n]*/g) || [];
      bad("text still mentions 'Section 9': " + m.slice(0, 3).join(" | "));
    } else ok("no leftover 'Section 9' references");

    // map
    var tiles = document.querySelectorAll("#jezero-map .leaflet-tile-loaded").length;
    if (!window.L) bad("Leaflet not loaded");
    else if (!tiles) bad("map has no loaded tiles");
    else ok("map loaded (" + tiles + " tiles)");

    // images
    var badImgs = [];
    document.querySelectorAll("img").forEach(function (im) {
      if (im.complete && im.naturalWidth === 0) badImgs.push(im.src.slice(0, 70));
    });
    if (badImgs.length) bad("broken images: " + badImgs.join(" | ")); else ok("no broken images (" + document.images.length + " checked)");

    // placeholders
    var coming = document.querySelectorAll(".coming");
    if (coming.length) bad(coming.length + " 'coming soon' placeholder(s) left"); else ok("no 'coming soon' placeholders");

    // mobile overflow
    var w = window.innerWidth;
    if (document.documentElement.scrollWidth > w + 1) {
      var wide = [];
      document.querySelectorAll("body *").forEach(function (n) {
        var r = n.getBoundingClientRect();
        if (r.right > w + 2 && r.width > 0 && wide.length < 5) {
          wide.push(n.tagName.toLowerCase() + (n.className ? "." + String(n.className).split(" ")[0] : ""));
        }
      });
      bad("page scrolls sideways at width " + w + ". Examples: " + wide.join(", "));
    } else ok("no sideways scrolling at width " + w);

    // external links
    var ext = document.querySelectorAll("a[href^='http']");
    ok(ext.length + " external links (tap each one manually)");

    // JS errors
    if (errs.length) bad("JS errors: " + errs.join(" | ")); else ok("no JS errors recorded");

    var box = document.createElement("div");
    box.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99999;max-height:70vh;overflow:auto;background:#000;color:#fff;font:12px/1.5 monospace;padding:10px;border-bottom:2px solid #e8672a;white-space:pre-wrap";
    box.textContent = out.join("\n\n") + "\n\n[tap here to close]";
    box.onclick = function () { box.remove(); };
    document.body.appendChild(box);
  }
})();
