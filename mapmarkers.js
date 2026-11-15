(function () {
  "use strict";

  /* Same places and coordinates as route.js (USGS SIM 3464), rounded to 0.01 degrees. */
  var PLACES = [
    { name: "Octavia E. Butler Landing", lat: 18.44, lon: 77.45, zone: "floor" },
    { name: "Warped, faulted layered rock on the crater rim", lat: 18.46, lon: 77.26, zone: "rim" },
    { name: "Neretva Vallis channel segment (outside the crater)", lat: 18.61, lon: 76.94, zone: "outside" },
    { name: "Midway ellipse centre (candidate site outside the crater)", lat: 18.3, lon: 77.0, zone: "outside" }
  ];
  var ZONES = {
    floor: { label: "Crater floor", fill: "#e8672a" },
    rim: { label: "Crater wall or rim", fill: "#f1ebe3" },
    outside: { label: "Outside the crater", fill: "#9a948c" }
  };
  window.JEZERO_PLACES = PLACES;

  var CSS = "#mm-panel{background:#17171a;border:1px solid #2a2a2f;border-radius:10px;padding:12px 14px;margin:10px 0;font-size:.88rem;line-height:1.55;color:#9a948c}" +
    "#mm-panel label{display:flex;gap:10px;align-items:center;color:#f1ebe3;font-weight:600;min-height:44px;cursor:pointer}" +
    "#mm-panel input[type=checkbox]{width:22px;height:22px;accent-color:#e8672a}" +
    "#mm-panel button{background:transparent;color:#f1ebe3;border:1px solid #e8672a;border-radius:8px;padding:9px 14px;min-height:44px;font-size:.86rem;cursor:pointer;margin:4px 0}" +
    "#mm-panel button:hover{background:#e8672a;color:#000}" +
    "#mm-panel ul{list-style:none;padding:0;margin:8px 0;display:grid;gap:4px}" +
    "#mm-panel .mm-dot{display:inline-block;width:12px;height:12px;border-radius:50%;border:2px solid #e8672a;margin-right:8px;vertical-align:-1px}";

  function popupHtml(p) {
    return "<b>" + p.name + "</b><br>" +
      p.lat.toFixed(2) + "\u00B0 N, " + p.lon.toFixed(2) + "\u00B0 E<br>" +
      "Zone: " + ZONES[p.zone].label + "<br>" +
      "<small>Source: USGS Map 3464 (Sun and Stack, 2020). Coordinates rounded to 0.01\u00B0, so the dot is only roughly on the feature.</small>";
  }

  function build(map) {
    var mapEl = document.getElementById("jezero-map");
    if (!mapEl || document.getElementById("mm-panel")) return;

    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);

    var group = L.layerGroup();
    PLACES.forEach(function (p) {
      L.circleMarker([p.lat, p.lon], {
        radius: 8, color: "#e8672a", weight: 3,
        fillColor: ZONES[p.zone].fill, fillOpacity: 1,
        bubblingMouseEvents: false
      }).bindPopup(popupHtml(p)).addTo(group);
    });
    group.addTo(map);

    var panel = document.createElement("div");
    panel.id = "mm-panel";
    panel.innerHTML =
      '<label><input type="checkbox" id="mm-toggle" checked> Show USGS places on the map</label>' +
      "<ul>" +
      '<li><span class="mm-dot" style="background:#e8672a"></span>Crater floor</li>' +
      '<li><span class="mm-dot" style="background:#f1ebe3"></span>Crater wall or rim</li>' +
      '<li><span class="mm-dot" style="background:#9a948c"></span>Outside the crater</li>' +
      "</ul>" +
      '<button type="button" id="mm-fit">Zoom to the places</button>' +
      '<div><span class="badge badge-real">REAL DATA</span> Coordinates: USGS Map 3464, as used in Section 6. Tap a dot for details. These are the same four places the Route Planner and the Section 9 tools use.</div>';
    mapEl.parentNode.insertBefore(panel, mapEl.nextSibling);

    document.getElementById("mm-toggle").addEventListener("change", function () {
      if (this.checked) group.addTo(map); else map.removeLayer(group);
    });
    document.getElementById("mm-fit").addEventListener("click", function () {
      if (!map.hasLayer(group)) { group.addTo(map); document.getElementById("mm-toggle").checked = true; }
      map.fitBounds(L.latLngBounds(PLACES.map(function (p) { return [p.lat, p.lon]; })), { padding: [30, 30], maxZoom: 9 });
    });
  }

  /* map.js creates window.jezeroMap. Wait for it, for up to 10 seconds. */
  function wait(tries) {
    if (window.jezeroMap && typeof L !== "undefined") { build(window.jezeroMap); return; }
    if (tries < 50) setTimeout(function () { wait(tries + 1); }, 200);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { wait(0); });
  else wait(0);
})();
