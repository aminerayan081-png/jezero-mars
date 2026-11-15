(function () {
  "use strict";
  var BASE = "https://trek.nasa.gov/tiles/Mars/EQ/";
  var PATH = "/1.0.0/default/default028mm/{z}/{y}/{x}.";
  var DEFS = [
    { key: "mola", label: "Elevation: MGS MOLA colour shaded relief", folder: "Mars_MGS_MOLA_ClrShade_merge_global_463m", ext: "jpg", native: 7,
      credit: "Tiles: NASA Solar System Treks. Data: Mars Global Surveyor MOLA (NASA/GSFC)." },
    { key: "themis", label: "Infrared: Mars Odyssey THEMIS, daytime", folder: "Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v12_clon0_ly", ext: "png", native: 8,
      credit: "Tiles: NASA Solar System Treks. Data: Mars Odyssey THEMIS (NASA / ASU)." }
  ];
  var CSS = "#ml-panel{background:#17171a;border:1px solid #2a2a2f;border-radius:10px;padding:12px 14px;margin:10px 0;font-size:.88rem;line-height:1.55;color:#9a948c}" +
    "#ml-panel h4{margin:0 0 4px;color:#e8672a;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase}" +
    "#ml-panel label.ml-row{display:flex;gap:10px;align-items:center;color:#f1ebe3;font-weight:600;min-height:44px;cursor:pointer}" +
    "#ml-panel input[type=checkbox]{width:22px;height:22px;accent-color:#e8672a;flex:0 0 22px}" +
    "#ml-panel input[type=range]{width:100%;accent-color:#e8672a;min-height:36px}" +
    "#ml-panel .ml-st{display:block;font-weight:400;color:#9a948c;font-size:.8rem}";

  function build(map) {
    var mapEl = document.getElementById("jezero-map");
    if (!mapEl || document.getElementById("ml-panel")) return;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);

    var opacity = 0.55;
    var panel = document.createElement("div");
    panel.id = "ml-panel";
    var html = "<h4>Layer blending</h4>";
    DEFS.forEach(function (d) {
      html += '<label class="ml-row"><input type="checkbox" id="ml-cb-' + d.key + '"><span>' + d.label +
        '<span class="ml-st" id="ml-st-' + d.key + '">Off</span></span></label>';
    });
    html += '<label for="ml-op" style="color:#f1ebe3;font-weight:600">Overlay strength: <span id="ml-opv">55</span>%</label>' +
      '<input type="range" id="ml-op" min="0" max="100" value="55">' +
      '<div><span class="badge badge-real">REAL DATA</span> These are NASA mission layers drawn over the base image you choose with the layers button. ' +
      "MOLA elevation is about 463 m per pixel, so it shows the broad shape of the land and is too coarse to show walking slopes or rocks. " +
      "We give no colour scale, so do not read heights from it. Nothing here rates any area as safe.</div>";
    panel.innerHTML = html;
    mapEl.parentNode.insertBefore(panel, mapEl.nextSibling);

    DEFS.forEach(function (d) {
      var ok = 0, bad = 0;
      var layer = L.tileLayer(BASE + d.folder + PATH + d.ext, {
        tileSize: 256, noWrap: true, minZoom: 0, maxZoom: 10, maxNativeZoom: d.native,
        opacity: opacity, zIndex: 5, attribution: d.credit
      });
      function say() {
        var el = document.getElementById("ml-st-" + d.key);
        if (!el) return;
        if (bad > 0 && ok === 0) el.textContent = "These tiles did not load. Untick this layer.";
        else el.textContent = "On. Tiles loaded: " + ok + (bad ? ", failed: " + bad : "");
      }
      layer.on("tileload", function () { ok++; say(); });
      layer.on("tileerror", function () { bad++; say(); });
      d.layer = layer;
      document.getElementById("ml-cb-" + d.key).addEventListener("change", function () {
        var el = document.getElementById("ml-st-" + d.key);
        if (this.checked) { ok = 0; bad = 0; layer.addTo(map); say(); }
        else { map.removeLayer(layer); el.textContent = "Off"; }
      });
    });

    document.getElementById("ml-op").addEventListener("input", function () {
      opacity = this.value / 100;
      document.getElementById("ml-opv").textContent = this.value;
      DEFS.forEach(function (d) { d.layer.setOpacity(opacity); });
    });
  }

  function wait(tries) {
    if (window.jezeroMap && typeof L !== "undefined") { build(window.jezeroMap); return; }
    if (tries < 50) setTimeout(function () { wait(tries + 1); }, 200);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { wait(0); });
  else wait(0);
})();
