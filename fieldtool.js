(function () {
  "use strict";
  var R = 3396190, KEY = "jezero-fieldtool-log-v1";

  var PLACES = {
    landing: { name: "Landing site (Octavia E. Butler Landing)", short: "Landing site", lat: 18.44, lon: 77.45 },
    rim: { name: "Warped, faulted layered rock on the crater rim", short: "Rim rock", lat: 18.46, lon: 77.26 },
    neretva: { name: "Neretva Vallis channel segment", short: "Neretva Vallis", lat: 18.61, lon: 76.94 },
    midway: { name: "Midway ellipse centre", short: "Midway ellipse", lat: 18.3, lon: 77.0 }
  };

  var GOALS = {
    river: {
      label: "Read the ancient river history", target: "neretva",
      why: "Neretva Vallis is the ancient river channel that fed Jezero (USGS). Studying it helps scientists understand how water reached the crater lake.",
      tasks: ["Photograph and describe the channel walls and any layering.", "Record where the channel narrows or widens.", "Note boulders and loose sand that could slow travel.", "Log the position of every observation."]
    },
    rim: {
      label: "Study how the crater wall deformed", target: "rim",
      why: "USGS notes warping and faulting of layered rock on the crater rim. These structures record how the crater wall changed over time.",
      tasks: ["Photograph fault surfaces and bent layers.", "Record the slope and ground condition on approach.", "Note which layers can be reached safely.", "Log the position of every observation."]
    },
    midway: {
      label: "Compare a site outside the crater", target: "midway",
      why: "The Midway ellipse was a candidate Mars 2020 landing area outside the crater (USGS). Comparing it with the crater floor shows how different the terrain is.",
      tasks: ["Describe the terrain and surface texture.", "Note rocks or features that differ from the crater floor.", "Record the ground condition for travel.", "Log the position of every observation."]
    }
  };

  var CSS = "#field-tool{background:#17171a;border:1px solid #e8672a;border-radius:12px;padding:14px;margin:14px 0}" +
    "#field-tool h3{margin:0 0 4px;font-size:1.1rem}" +
    "#field-tool h4{margin:18px 0 6px;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:#e8672a}" +
    "#field-tool .ft-sub{color:#9a948c;font-size:.85rem;line-height:1.5;margin:0 0 8px}" +
    "#field-tool .ft-l{display:block;font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;color:#e8672a;margin:12px 0 4px}" +
    "#field-tool select,#field-tool input{width:100%;box-sizing:border-box;background:#0b0b0c;color:#f1ebe3;border:1px solid #2a2a2f;border-radius:8px;padding:10px;font-size:.95rem;min-height:44px}" +
    "#field-tool .ft-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
    "#field-tool .ft-card{background:#0b0b0c;border:1px solid #2a2a2f;border-radius:10px;padding:12px;margin-top:12px;font-size:.9rem;line-height:1.55;color:#9a948c}" +
    "#field-tool .ft-card b{color:#f1ebe3}" +
    "#field-tool .ft-card ul{margin:.4em 0 0;padding-left:1.2em}" +
    "#field-tool .ft-big{font-size:1.5rem;color:#e8672a;font-weight:700}" +
    "#field-tool .ft-ok{color:#5fa883}#field-tool .ft-no{color:#e8672a}" +
    "#field-tool svg{width:100%;height:auto;display:block;background:#0b0b0c;border:1px solid #2a2a2f;border-radius:10px;margin-top:12px}" +
    "#field-tool .ft-btn{display:inline-block;background:transparent;color:#f1ebe3;border:1px solid #e8672a;border-radius:8px;padding:10px 14px;font-size:.88rem;min-height:44px;cursor:pointer;text-decoration:none;box-sizing:border-box;margin:8px 8px 0 0}" +
    "#field-tool .ft-btn:hover{background:#e8672a;color:#000}" +
    "#field-tool .ft-log{list-style:none;padding:0;margin:10px 0 0;display:grid;gap:8px}" +
    "#field-tool .ft-log li{background:#0b0b0c;border:1px solid #2a2a2f;border-radius:8px;padding:10px;font-size:.88rem;line-height:1.5;color:#f1ebe3;display:flex;gap:10px;justify-content:space-between}" +
    "#field-tool .ft-log small{display:block;color:#9a948c}" +
    "#field-tool .ft-x{flex:0 0 auto;background:transparent;border:1px solid #2a2a2f;color:#9a948c;border-radius:6px;min-width:40px;min-height:40px;cursor:pointer}";

  function opts(obj, labelKey) {
    return Object.keys(obj).map(function (k) { return '<option value="' + k + '">' + obj[k][labelKey] + "</option>"; }).join("");
  }

  function dist(a, b) {
    var r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lon - a.lon) * r;
    var h = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) * Math.sin(dn / 2);
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) / 1000;
  }
  function bearing(a, b) {
    var r = Math.PI / 180, dn = (b.lon - a.lon) * r;
    var y = Math.sin(dn) * Math.cos(b.lat * r);
    var x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos(dn);
    return (Math.atan2(y, x) / r + 360) % 360;
  }
  var DIRS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];

  function init() {
    var host = document.getElementById("field-tool");
    if (!host) return;
    if (!document.getElementById("ft-style")) {
      var st = document.createElement("style"); st.id = "ft-style"; st.textContent = CSS; document.head.appendChild(st);
    }

    host.innerHTML =
      "<h3>Mission Planning Tool</h3>" +
      '<p class="ft-sub">Pick a science goal and a start point. The tool calculates the distance, checks it against your planned EVA, and gives a briefing. A hypothetical planning aid, not operational software.</p>' +
      '<label class="ft-l" for="ft-goal">1. Science goal</label><select id="ft-goal">' + opts(GOALS, "label") + "</select>" +
      '<label class="ft-l" for="ft-start">2. Start point</label><select id="ft-start">' + opts(PLACES, "name") + "</select>" +
      '<div class="ft-row"><div><label class="ft-l" for="ft-hours">EVA length (hours)</label><input id="ft-hours" type="number" min="0.5" step="0.5" value="6"></div>' +
      '<div><label class="ft-l" for="ft-speed">Walking speed (km/h)</label><input id="ft-speed" type="number" min="0.1" step="0.1" value="1"></div></div>' +
      '<p class="ft-sub"><span class="badge badge-sim">SIMULATION</span> EVA length and walking speed are your own assumptions. They are not NASA figures.</p>' +
      '<div id="ft-brief" class="ft-card"></div>' +
      '<div id="ft-result" class="ft-card"></div>' +
      '<svg id="ft-plot" viewBox="0 0 340 210" role="img" aria-label="Plot of the start point and the target"></svg>' +
      '<a class="ft-btn" href="#map">Open the Mars map</a>' +
      "<h4>Mission log</h4>" +
      '<p class="ft-sub">Notes are tagged with your current target and saved on this device only.</p>' +
      '<input id="ft-note" type="text" maxlength="200" placeholder="Type an observation">' +
      '<button type="button" class="ft-btn" id="ft-add">Add to log</button>' +
      '<button type="button" class="ft-btn" id="ft-copy">Copy log</button>' +
      '<button type="button" class="ft-btn" id="ft-clear">Clear log</button>' +
      '<p class="ft-sub" id="ft-status"></p>' +
      '<ul class="ft-log" id="ft-list"></ul>' +
      '<p class="ft-sub"><span class="badge badge-real">REAL DATA</span> Coordinates: USGS, as used in Section 6. <span class="badge badge-calc">CALCULATION</span> Distance: great-circle on a sphere of radius 3,396.19 km (our maths). Straight-line only, not a validated route.</p>';

    var $ = function (id) { return document.getElementById(id); };
    var goalSel = $("ft-goal"), startSel = $("ft-start");

    function fmt(n) { return n < 10 ? n.toFixed(2) : n.toFixed(1); }

    function plot(s, t) {
      var W = 340, H = 210, P = 40, keys = Object.keys(PLACES), k = Math.cos(18.45 * Math.PI / 180);
      var pts = {}, minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
      keys.forEach(function (key) {
        var p = PLACES[key], x = p.lon * k, y = -p.lat;
        pts[key] = { x: x, y: y };
        minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y);
      });
      var sc = Math.min((W - 2 * P) / (maxx - minx), (H - 2 * P) / (maxy - miny));
      function X(key) { return P + (pts[key].x - minx) * sc; }
      function Y(key) { return P + (pts[key].y - miny) * sc; }
      var g = "";
      if (s !== t) g += '<line x1="' + X(s) + '" y1="' + Y(s) + '" x2="' + X(t) + '" y2="' + Y(t) + '" stroke="#e8672a" stroke-width="2" stroke-dasharray="6 4"/>';
      keys.forEach(function (key) {
        var isS = key === s, isT = key === t, x = X(key), y = Y(key);
        var col = isT ? "#e8672a" : (isS ? "#f1ebe3" : "#9a948c");
        g += '<circle cx="' + x + '" cy="' + y + '" r="' + (isT || isS ? 6 : 4) + '" fill="' + (isT ? "#e8672a" : "#0b0b0c") + '" stroke="' + col + '" stroke-width="2"/>';
        g += '<text x="' + (x < W / 2 ? x + 10 : x - 10) + '" y="' + (y + 4) + '" fill="' + col + '" font-size="11" text-anchor="' + (x < W / 2 ? "start" : "end") + '">' + PLACES[key].short + (isS ? " (start)" : "") + (isT ? " (target)" : "") + "</text>";
      });
      g += '<text x="8" y="16" fill="#9a948c" font-size="10">N is up, east is right. Not to a fixed scale.</text>';
      $("ft-plot").innerHTML = g;
    }

    function render() {
      var goal = GOALS[goalSel.value], tKey = goal.target, sKey = startSel.value;
      var s = PLACES[sKey], t = PLACES[tKey];
      var hours = parseFloat($("ft-hours").value), speed = parseFloat($("ft-speed").value);

      $("ft-brief").innerHTML = "<b>Briefing: " + goal.label + "</b><br>Target: " + t.name + "<br>" + goal.why +
        "<ul>" + goal.tasks.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" +
        '<p style="margin:.6em 0 0"><span class="badge badge-sim">PROPOSED CONCEPT</span> These tasks are our own educational suggestions, not NASA procedures. NASA has described boulders, cliffs and wind-blown sand traps at Jezero, so travel conditions need care.</p>';

      var out;
      if (sKey === tKey) {
        out = "<b>Start and target are the same place.</b> Choose a different start point.";
      } else if (!(hours > 0) || !(speed > 0)) {
        out = "<b>Enter a positive EVA length and walking speed.</b>";
      } else {
        var d = dist(s, t), b = bearing(s, t), trip = 2 * d / speed, left = hours - trip;
        out = '<span class="ft-big">' + fmt(d) + " km</span> straight-line, heading " + DIRS[Math.round(b / 45) % 8] + " (" + Math.round(b) + "&deg;)<br>" +
          "Round trip at " + speed + " km/h: about <b>" + fmt(trip) + " h</b> of travel.<br>";
        out += left >= 0
          ? '<b class="ft-ok">Fits:</b> about ' + fmt(left) + " h would remain on site in a " + hours + " h EVA."
          : '<b class="ft-no">Does not fit:</b> the travel alone is longer than your ' + hours + " h EVA. A real plan would need a closer target or a different approach (a proposed concept, not an official plan).";
        out += '<br><span class="badge badge-calc">CALCULATION</span> Straight-line is the shortest possible distance. Real paths around slopes and boulders would be longer.';
      }
      $("ft-result").innerHTML = out;
      plot(sKey, tKey);
    }

    ["change", "input"].forEach(function (ev) {
      goalSel.addEventListener(ev, render); startSel.addEventListener(ev, render);
      $("ft-hours").addEventListener(ev, render); $("ft-speed").addEventListener(ev, render);
    });

    var log = [];
    try { log = JSON.parse(localStorage.getItem(KEY) || "[]") || []; } catch (e) { log = []; }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(log)); } catch (e) {} }
    function say(m) { $("ft-status").textContent = m; }

    function drawLog() {
      var ul = $("ft-list"); ul.innerHTML = "";
      log.forEach(function (e, i) {
        var li = document.createElement("li"), box = document.createElement("div"), sm = document.createElement("small");
        sm.textContent = e.t + " (device clock) | " + e.place;
        box.appendChild(sm); box.appendChild(document.createTextNode(e.text));
        var x = document.createElement("button"); x.type = "button"; x.className = "ft-x"; x.textContent = "\u00D7"; x.setAttribute("aria-label", "Delete entry");
        x.addEventListener("click", function () { log.splice(i, 1); save(); drawLog(); });
        li.appendChild(box); li.appendChild(x); ul.appendChild(li);
      });
    }

    $("ft-add").addEventListener("click", function () {
      var v = $("ft-note").value.trim();
      if (!v) { say("Type a note first."); return; }
      log.push({ t: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), place: PLACES[GOALS[goalSel.value].target].short, text: v });
      $("ft-note").value = ""; save(); drawLog(); say("Added.");
    });
    $("ft-clear").addEventListener("click", function () { log = []; save(); drawLog(); say("Log cleared."); });
    $("ft-copy").addEventListener("click", function () {
      if (!log.length) { say("The log is empty."); return; }
      var txt = log.map(function (e) { return e.t + " | " + e.place + " | " + e.text; }).join("\n");
      function fallback() {
        var ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); say("Copied."); } catch (e) { say("Copy not available."); }
        ta.remove();
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { say("Copied."); }, fallback);
      else fallback();
    });

    drawLog(); render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
