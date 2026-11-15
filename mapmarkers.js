(function () {
  "use strict";

  var ZONES = {
    floor: { label: "Crater floor", fill: "#e8672a" },
    rim: { label: "Crater wall or rim", fill: "#f1ebe3" },
    outside: { label: "Outside the crater", fill: "#9a948c" }
  };

  var CSS = "#mm-panel{background:#17171a;border:1px solid #2a2a2f;border-radius:10px;padding:12px 14px;margin:10px 0;font-size:.88rem;line-height:1.55;color:#9a948c}" +
    "#mm-panel label{display:flex;gap:10px;align-items:center;color:#f1ebe3;font-weight:600;min-height:44px;cursor:pointer}" +
    "#mm-panel input[type=checkbox]{width:22px;height:22px;accent-color:#e8672a}" +
    "#mm-panel button{background:transparent;color:#f1ebe3;border:1px solid #e8672a;border-radius:8px;padding:9px 14px;min-height:44px;font-size:.86rem;cursor:pointer;margin:4px 0}" +
    "#mm-panel button:hover{background:#e8672a;color:#000}" +
    "#mm-panel ul{list-style:none;padding:0;margin:8px 0;display:grid;gap:4px}" +
    "#mm-panel .mm-dot{display:inline-block;width:12px;height:12px;border-radius:50%;border:2px solid #e8672a;margin-right:8px;vertical-align:-1px}";

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function popupHtml(p) {
      var ZONE_HAZARD = {
    floor: "NASA lists rocks, boulder fields, cliffs and dune fields among the hazards of this area.",
    rim: "On NASA's climb of the rim, part of a 15 to 20 degree hill was far less firm than expected and the wheels had very little grip.",
    outside: "Our sources say little about the ground here. Any route into the crater would have to cross the rim."
  };

  function popupHtml(p) {
    return "<b>" + esc(p.name) + "</b><br>" +
      p.lat.toFixed(2) + "\u00B0 N, " + p.lon.toFixed(2) + "\u00B0 E<br>" +
      "Zone: " + ZONES[p.zone].label + "<br>" +
      "<small>" + esc(p.note) + "<br><b>Hazard note (from Section 4, not a safety rating):</b> " + esc(ZONE_HAZARD[p.zone] || "") +
      "<br>Source: " + esc(p.source.label) +
      ". Coordinates are rounded to 0.01\u00B0, so the dot is only roughly on the feature.</small>";
  }
  }

  function build(map, places) {
    var mapEl = document.getElementById("jezero-map");
    if (!mapEl || document.getElementById("mm-panel")) return;

    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);

    var group = L.layerGroup();
    places.forEach(function (p) {
      var z = ZONES[p.zone] || ZONES.outside;
      L.circleMarker([p.lat, p.lon], {
        radius: 8, color: "#e8672a", weight: 3,
        fillColor: z.fill, fillOpacity: 1,
        bubblingMouseEvents: false
      }).bindPopup(popupHtml(p), { maxWidth: 260 }).addTo(group);
    });
    group.addTo(map);

    var panel = document.createElement("div");
    panel.id = "mm-panel";
    panel.innerHTML =
      '<label><input type="checkbox" id="mm-toggle" checked> Show the ' + places.length + " Route Planner places</label>" +
      "<ul>" +
      '<li><span class="mm-dot" style="background:#e8672a"></span>Crater floor</li>' +
      '<li><span class="mm-dot" style="background:#f1ebe3"></span>Crater wall or rim</li>' +
      '<li><span class="mm-dot" style="background:#9a948c"></span>Outside the crater</li>' +
      "</ul>" +
      '<button type="button" id="mm-fit">Zoom to the places</button>' +
      '<div><span class="badge badge-real">REAL DATA</span> Tap a dot for its note and source. These are the same places as the Route Planner in Section 6: seven come from USGS Map 3464 and the landing site is cited to NASA. Choose two places in Section 6 to draw a route between them on this map.</div>';
    mapEl.parentNode.insertBefore(panel, mapEl.nextSibling);

    document.getElementById("mm-toggle").addEventListener("change", function () {
      if (this.checked) group.addTo(map); else map.removeLayer(group);
    });
    document.getElementById("mm-fit").addEventListener("click", function () {
      if (!map.hasLayer(group)) { group.addTo(map); document.getElementById("mm-toggle").checked = true; }
      map.fitBounds(L.latLngBounds(places.map(function (p) { return [p.lat, p.lon]; })), { padding: [30, 30], maxZoom: 9 });
    });
  }

  /* Wait for the map (map.js) and the places list (route.js), up to 10 seconds. */
  function wait(tries) {
    var places = window.JezeroRoute && window.JezeroRoute.places;
    if (window.jezeroMap && typeof L !== "undefined" && places && places.length) { build(window.jezeroMap, places); return; }
    if (tries < 50) setTimeout(function () { wait(tries + 1); }, 200);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { wait(0); });
  else wait(0);
})();
