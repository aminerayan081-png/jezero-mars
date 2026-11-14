(function () {
  "use strict";
  var KMDEG = 3396.19 * Math.PI / 180, LAT0 = 18.44, LON0 = 77.45, K = Math.cos(LAT0 * Math.PI / 180);
  function P(name, lat, lon, info) { return { name: name, x: (lon - LON0) * KMDEG * K, y: (lat - LAT0) * KMDEG, info: info }; }
  var HOME = P("Habitat (landing site)", 18.44, 77.45, "");
  var SITES = [
    P("Crater rim rock", 18.46, 77.26, "USGS notes warping and faulting of layered rock on the crater rim. Photograph the bent layers and record the ground condition."),
    P("Neretva Vallis", 18.61, 76.94, "The ancient river channel that fed Jezero (USGS). Describe the channel walls and any layering."),
    P("Midway ellipse", 18.3, 77.0, "A candidate Mars 2020 landing area outside the crater (USGS). Compare its terrain with the crater floor.")
  ];
  var SPEED = 4, STEP = 0.5, B = { x0: -34, x1: 4, y0: -12, y1: 14 };

  var CSS = "#astro-drive{background:#17171a;border:1px solid #e8672a;border-radius:12px;padding:14px;margin:14px 0}" +
    "#astro-drive h3{margin:0 0 4px;font-size:1.1rem}" +
    "#astro-drive .ad-sub{color:#9a948c;font-size:.85rem;line-height:1.5;margin:6px 0}" +
    "#astro-drive canvas{width:100%;height:auto;display:block;background:#0b0b0c;border:1px solid #2a2a2f;border-radius:10px;margin-top:10px}" +
    "#astro-drive select{background:#0b0b0c;color:#f1ebe3;border:1px solid #2a2a2f;border-radius:8px;padding:8px;min-height:42px}" +
    "#astro-drive .ad-card{background:#0b0b0c;border:1px solid #2a2a2f;border-radius:10px;padding:12px;margin-top:10px;font-size:.9rem;line-height:1.55;color:#9a948c}" +
    "#astro-drive .ad-card b{color:#f1ebe3}" +
    "#astro-drive .ad-bars{display:grid;gap:6px;margin-top:10px;font-size:.8rem;color:#9a948c}" +
    "#astro-drive .ad-bar{height:8px;background:#0b0b0c;border:1px solid #2a2a2f;border-radius:99px;overflow:hidden}" +
    "#astro-drive .ad-bar span{display:block;height:100%;background:#e8672a}" +
    "#astro-drive .ad-pad{display:grid;grid-template-columns:repeat(3,64px);grid-template-rows:repeat(3,56px);gap:8px;justify-content:center;margin:14px 0 6px}" +
    "#astro-drive .ad-pad button{touch-action:manipulation;user-select:none;-webkit-user-select:none;background:#0b0b0c;color:#e8672a;border:1px solid #e8672a;border-radius:10px;font-size:1.4rem;cursor:pointer}" +
    "#astro-drive .ad-pad button:active{background:#e8672a;color:#000}" +
    "#astro-drive .ad-btn{background:transparent;color:#f1ebe3;border:1px solid #e8672a;border-radius:8px;padding:10px 14px;font-size:.88rem;min-height:44px;cursor:pointer;margin:6px 8px 0 0}" +
    "#astro-drive .ad-btn:disabled{opacity:.4;cursor:default}" +
    "#astro-drive .ad-warn{color:#e8672a;font-weight:700}#astro-drive .ad-ok{color:#5fa883;font-weight:700}";

  function init() {
    var host = document.getElementById("astro-drive");
    if (!host) return;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    host.innerHTML =
      "<h3>Drive the Astronaut</h3>" +
      '<p class="ad-sub"><span class="badge badge-sim">SIMULATION</span> Move the astronaut from the habitat to the real USGS locations and back before the oxygen runs out. Terrain and rocks in the first-person view are decorative. Oxygen, battery, EVA length and walking speed (4 km/h) are invented teaching values, not NASA figures.</p>' +
      '<label class="ad-sub" for="ad-eva">EVA length: </label><select id="ad-eva"><option value="8">8 hours</option><option value="12" selected>12 hours</option><option value="16">16 hours</option></select>' +
      '<canvas id="ad-map" width="340" height="230" aria-label="Top-down map of the EVA area"></canvas>' +
      '<canvas id="ad-view" width="340" height="140" aria-label="First-person view"></canvas>' +
      '<div class="ad-bars"><div>Oxygen <b id="ad-o2t"></b><div class="ad-bar"><span id="ad-o2"></span></div></div>' +
      '<div>Battery <b id="ad-bt"></b><div class="ad-bar"><span id="ad-b"></span></div></div></div>' +
      '<div class="ad-card" id="ad-stat"></div>' +
      '<div class="ad-pad"><span></span><button type="button" data-d="n" aria-label="Move north">&#9650;</button><span></span>' +
      '<button type="button" data-d="w" aria-label="Move west">&#9664;</button><span></span><button type="button" data-d="e" aria-label="Move east">&#9654;</button>' +
      '<span></span><button type="button" data-d="s" aria-label="Move south">&#9660;</button><span></span></div>' +
      '<p class="ad-sub" style="text-align:center">Tap or hold an arrow. Each step is 0.5 km (N is up).</p>' +
      '<div style="text-align:center"><button type="button" class="ad-btn" id="ad-col">Collect sample</button><button type="button" class="ad-btn" id="ad-end">End EVA</button><button type="button" class="ad-btn" id="ad-reset">Restart</button></div>' +
      '<div class="ad-card" id="ad-info"></div>' +
      '<p class="ad-sub"><span class="badge badge-real">REAL DATA</span> Locations: USGS coordinates (as in Section 6). <span class="badge badge-calc">CALCULATION</span> Positions are converted to km with the Mars radius of 3,396.19 km. Straight-line only, not a validated route.</p>';

    var $ = function (i) { return document.getElementById(i); };
    var map = $("ad-map").getContext("2d"), view = $("ad-view").getContext("2d");
    var s;
    function fresh() { s = { x: 0, y: 0, t: 0, h: 0, got: {}, over: false, msg: "", trail: [[0, 0]] }; }
    fresh();
    function eva() { return parseFloat($("ad-eva").value); }
    function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
    function nearSite() { for (var i = 0; i < SITES.length; i++) if (dist(s, SITES[i]) <= 0.75) return i; return -1; }

    function drawMap() {
      var W = 340, H = 230, sc = 6.9;
      function X(x) { return 15 + (x - B.x0) * sc; } function Y(y) { return H - 15 - (y - B.y0) * sc; }
      map.clearRect(0, 0, W, H);
      map.strokeStyle = "#1d1d21"; map.lineWidth = 1; map.fillStyle = "#9a948c"; map.font = "9px sans-serif";
      for (var gx = -30; gx <= 0; gx += 10) { map.beginPath(); map.moveTo(X(gx), 0); map.lineTo(X(gx), H); map.stroke(); }
      for (var gy = -10; gy <= 10; gy += 10) { map.beginPath(); map.moveTo(0, Y(gy)); map.lineTo(W, Y(gy)); map.stroke(); }
      map.fillText("10 km grid", 6, 12);
      map.strokeStyle = "#e8672a"; map.lineWidth = 2; map.beginPath();
      s.trail.forEach(function (p, i) { if (i) map.lineTo(X(p[0]), Y(p[1])); else map.moveTo(X(p[0]), Y(p[1])); });
      map.stroke();
      var all = [HOME].concat(SITES);
      all.forEach(function (p, i) {
        var done = i > 0 && s.got[i - 1];
        map.beginPath(); map.arc(X(p.x), Y(p.y), 6, 0, 7);
        map.fillStyle = done ? "#5fa883" : "#0b0b0c"; map.fill();
        map.strokeStyle = i === 0 ? "#f1ebe3" : "#e8672a"; map.lineWidth = 2; map.stroke();
        map.fillStyle = "#f1ebe3"; map.font = "10px sans-serif";
        var left = X(p.x) > W / 2; map.textAlign = left ? "right" : "left";
        map.fillText(p.name, X(p.x) + (left ? -10 : 10), Y(p.y) + 4);
      });
      map.textAlign = "left";
      var ax = X(s.x), ay = Y(s.y), a = s.h * Math.PI / 180;
      map.fillStyle = "#e8672a"; map.beginPath(); map.arc(ax, ay, 5, 0, 7); map.fill();
      map.strokeStyle = "#f1ebe3"; map.lineWidth = 2; map.beginPath(); map.moveTo(ax, ay); map.lineTo(ax + Math.sin(a) * 14, ay - Math.cos(a) * 14); map.stroke();
    }

    function rnd(n) { var v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); }
    function drawView() {
      var W = 340, H = 140, hz = 58, g = view.createLinearGradient(0, 0, 0, hz);
      g.addColorStop(0, "#2b1d1a"); g.addColorStop(1, "#c98a62");
      view.fillStyle = g; view.fillRect(0, 0, W, hz);
      var g2 = view.createLinearGradient(0, hz, 0, H); g2.addColorStop(0, "#6b3f2d"); g2.addColorStop(1, "#3a2218");
      view.fillStyle = g2; view.fillRect(0, hz, W, H - hz);
      var cx = Math.floor(s.x * 2), cy = Math.floor(s.y * 2), i;
      for (i = 0; i < 14; i++) {
        var d = rnd(cx * 31 + cy * 17 + i * 3.7 + 1), px = rnd(cx * 13 + cy * 7 + i * 5.1 + 2) * W;
        var y = hz + 6 + d * (H - hz - 14), sz = 3 + d * 16;
        view.fillStyle = "rgba(40,22,16," + (0.5 + d * 0.4) + ")";
        view.beginPath(); view.ellipse(px, y, sz, sz * 0.55, 0, 0, 7); view.fill();
      }
      [HOME].concat(SITES).forEach(function (p, idx) {
        var dx = p.x - s.x, dy = p.y - s.y, dd = Math.sqrt(dx * dx + dy * dy);
        if (dd < 0.05) return;
        var bear = Math.atan2(dx, dy) * 180 / Math.PI, diff = ((bear - s.h + 540) % 360) - 180;
        if (Math.abs(diff) > 45) return;
        var sx = W / 2 + diff / 45 * (W / 2), h = Math.max(10, 80 / (1 + dd * 0.35)), by = hz + 4 + 40 / (1 + dd * 0.35);
        view.fillStyle = idx === 0 ? "#f1ebe3" : "#e8672a";
        view.fillRect(sx - 3, by - h, 6, h);
        view.font = "10px sans-serif"; view.textAlign = "center";
        view.fillText(p.name + " " + dd.toFixed(1) + " km", sx, by - h - 4);
      });
      view.textAlign = "left"; view.fillStyle = "#f1ebe3"; view.font = "10px sans-serif";
      var names = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
      view.fillText("Facing " + names[Math.round(s.h / 45) % 8], 6, 14);
    }

    function render() {
      var E = eva(), o2 = Math.max(0, 100 * (1 - s.t / E)), bt = Math.max(0, 100 * (1 - s.t / (E * 1.25)));
      $("ad-o2").style.width = o2 + "%"; $("ad-b").style.width = bt + "%";
      $("ad-o2t").textContent = Math.round(o2) + "%"; $("ad-bt").textContent = Math.round(bt) + "%";
      var dh = dist(s, HOME), back = dh / SPEED, left = E - s.t, n = nearSite();
      if (!s.over && o2 <= 0) { s.over = true; s.msg = dh <= 0.5 ? "" : "<span class='ad-warn'>Mission failed:</span> oxygen ran out " + dh.toFixed(1) + " km from the habitat. This is why turnaround points are planned before leaving."; }
      var t = "Time used: <b>" + s.t.toFixed(2) + " h</b> of " + E + " h &middot; Distance to habitat: <b>" + dh.toFixed(1) + " km</b> (about " + back.toFixed(1) + " h walk)<br>Samples: <b>" + Object.keys(s.got).length + "/3</b><br>";
      if (s.over) t += s.msg || "EVA ended.";
      else if (left < back) t += "<span class='ad-warn'>You can no longer walk back in time at this pace.</span>";
      else if (left < back * 1.15) t += "<span class='ad-warn'>TURN BACK NOW: your margin is almost gone.</span>";
      else t += "<span class='ad-ok'>Return margin OK.</span>";
      $("ad-stat").innerHTML = t;
      $("ad-info").innerHTML = n >= 0 ? "<b>" + SITES[n].name + "</b><br>" + SITES[n].info + "<br><span class='badge badge-sim'>PROPOSED CONCEPT</span> Tasks like this are our own educational suggestions, not NASA procedures." :
        "Walk to a marked site (within 0.75 km) to read its science briefing and collect a sample.";
      $("ad-col").disabled = s.over || n < 0 || !!s.got[n];
      $("ad-end").disabled = s.over;
      drawMap(); drawView();
    }

    function move(d) {
      if (s.over) return;
      var dx = 0, dy = 0, h = 0;
      if (d === "n") { dy = STEP; h = 0; } if (d === "e") { dx = STEP; h = 90; }
      if (d === "s") { dy = -STEP; h = 180; } if (d === "w") { dx = -STEP; h = 270; }
      var nx = Math.min(B.x1, Math.max(B.x0, s.x + dx)), ny = Math.min(B.y1, Math.max(B.y0, s.y + dy));
      s.h = h;
      if (nx !== s.x || ny !== s.y) { s.x = nx; s.y = ny; s.t += STEP / SPEED; s.trail.push([s.x, s.y]); }
      render();
    }

    var timer = null;
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    Array.prototype.forEach.call(host.querySelectorAll(".ad-pad button"), function (b) {
      var d = b.getAttribute("data-d");
      b.addEventListener("pointerdown", function (e) { e.preventDefault(); stop(); move(d); timer = setInterval(function () { move(d); }, 160); });
      ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { b.addEventListener(ev, stop); });
    });

    $("ad-col").addEventListener("click", function () { var n = nearSite(); if (n >= 0) { s.got[n] = 1; render(); } });
    $("ad-end").addEventListener("click", function () {
      var dh = dist(s, HOME), E = eva();
      s.over = true;
      s.msg = dh <= 0.5
        ? "<span class='ad-ok'>Safe return.</span> You collected " + Object.keys(s.got).length + " of 3 samples in " + s.t.toFixed(1) + " h, with about " + Math.max(0, Math.round(100 * (1 - s.t / E))) + "% oxygen left."
        : "<span class='ad-warn'>You ended the EVA " + dh.toFixed(1) + " km from the habitat.</span> Walk back to within 0.5 km first.";
      if (dh > 0.5) { s.over = false; $("ad-info").innerHTML = s.msg; render(); $("ad-info").innerHTML = s.msg; return; }
      render();
    });
    $("ad-reset").addEventListener("click", function () { stop(); fresh(); render(); });
    $("ad-eva").addEventListener("change", render);
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
