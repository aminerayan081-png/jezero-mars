/* =========================================================
   JEZERO - map.js
   The interactive Mars map for section 2.

   - Shows real Mars orbital imagery from NASA Solar System Treks.
   - Zoom, move, and tap to read coordinates.
   - Plugs into app.js through JEZERO.register(). If app.js is
     missing, it still starts by itself.
   - Needs the Leaflet library, loaded in index.html before this file.

   No invented data: only the tile images and the USGS outline
   of the Jezero mosaic area are used.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- 1. Facts and settings ---------- */

  /* Mars radius from the USGS metadata of the mosaics used here. */
  var MARS_RADIUS_M = 3396190;

  /* Outline of the USGS "Mars 2020 TRN CTX orthorectified mosaic":
     latitude 18.211 to 18.7212 N, longitude 77.1605 to 77.6992 E. */
  var FOOTPRINT = [[18.211, 77.1605], [18.7212, 77.6992]];

  /* Start the view in the middle of that outline. */
  var START_CENTER = [(18.211 + 18.7212) / 2, (77.1605 + 77.6992) / 2];
  var START_ZOOM = 7;
  var MAP_MAX_ZOOM = 10; /* zooming past a layer's real detail only enlarges it */

  var TILE_BASE = "https://trek.nasa.gov/tiles/Mars/EQ/";
  var TILE_PATH = "/1.0.0/default/default028mm/{z}/{y}/{x}.";

  /* nativeMaxZoom values come from a third-party report, not from
     NASA documentation. */
  var LAYERS = [
    {
      key: "viking",
      title: "Viking colour mosaic (MDIM 2.1)",
      folder: "Mars_Viking_MDIM21_ClrMosaic_global_232m",
      ext: "jpg",
      nativeMaxZoom: 7,
      detail: "Viking Orbiter images, colourised. About 232 m per pixel " +
              "(256 pixels per degree, USGS). Published 2009, edition 2.1.",
      credit: "Tiles: NASA Solar System Treks. Data: NASA / USGS Astrogeology Science Center."
    },
    {
      key: "themis",
      title: "THEMIS infrared, daytime",
      folder: "Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v12_clon0_ly",
      ext: "png",
      nativeMaxZoom: 8,
      detail: "Mars Odyssey THEMIS thermal-infrared brightness, not a visible-light " +
              "photograph. Product named 100 m per pixel; the tile pyramid " +
              "may be coarser (about 160 m per pixel at its top level).",
      credit: "Tiles: NASA Solar System Treks. Data: Mars Odyssey THEMIS (NASA / ASU)."
    }
  ];

  /* ---------- 2. Small helper functions ---------- */

  /* Write text into an element, if that element exists. */
  function setText(id, text) {
    var node = document.getElementById(id);
    if (node) {
      node.textContent = text;
    }
  }

  /* Metres per screen pixel at a zoom level, north-south direction.
     The whole globe (180 degrees of latitude) is 256 * 2^zoom pixels tall. */
  function metresPerPixel(zoom) {
    return (Math.PI * MARS_RADIUS_M) / (256 * Math.pow(2, zoom));
  }

  function formatLat(lat) {
    return Math.abs(lat).toFixed(4) + "\u00B0 " + (lat >= 0 ? "N" : "S");
  }

  function formatLon(lon) {
    return Math.abs(lon).toFixed(4) + "\u00B0 " + (lon >= 0 ? "E" : "W");
  }

  function tileUrl(layer) {
    return TILE_BASE + layer.folder + TILE_PATH + layer.ext;
  }

  /* ---------- 3. Build the map ---------- */

  function startMap() {
    var container = document.getElementById("jezero-map");

    /* No map box on this page: nothing to do. */
    if (!container) {
      return;
    }

    /* Leaflet did not load (for example, no internet). */
    if (typeof L === "undefined") {
      container.className += " map-failed";
      container.textContent =
        "The map could not be loaded. Check your internet connection and reload the page.";
      return;
    }

    /* Leaflet's EPSG4326 option is simply "longitude/latitude in degrees,
       256-pixel tiles, level 0 is 2 x 1 tiles". That matches the Trek tile
       layout and does not assume anything about Earth's size. */
    var map = L.map(container, {
      crs: L.CRS.EPSG4326,
      center: START_CENTER,
      zoom: START_ZOOM,
      minZoom: 0,
      maxZoom: MAP_MAX_ZOOM,
      maxBounds: [[-90, -180], [90, 180]],
      maxBoundsViscosity: 1.0
      /* The built-in Leaflet scale bar is NOT added: it measures
         distance using Earth's radius, which is wrong for Mars. */
    });

    var counts = { ok: 0, failed: 0 };
     window.jezeroMap = map;
    var currentDef = LAYERS[0];

    function updateStatus() {
      var text = "Tiles loaded: " + counts.ok + ", failed: " + counts.failed;
      var state = "ok";
      if (counts.failed > 0 && counts.ok === 0) {
        text += " \u2014 no tiles loaded. Check your internet connection.";
        state = "bad";
      } else if (counts.failed > 0) {
        state = "bad";
      }
      var node = document.getElementById("map-status");
      if (node) {
        node.textContent = text;
        node.className = "map-small map-status-" + state;
      }
    }

    function updateSource() {
      var zoom = map.getZoom();
      setText("map-src-name", currentDef.title);
      setText("map-src-detail", currentDef.detail);

      var text = "Zoom " + zoom + ": about " + Math.round(metresPerPixel(zoom)) +
        " m per screen pixel (north-south).";
      if (zoom > currentDef.nativeMaxZoom) {
        text += " Beyond this layer's detail level (" + currentDef.nativeMaxZoom +
          "): the picture is only enlarged and shows no extra detail.";
      }
      setText("map-src-scale", text);
    }

    function makeLayer(def) {
      var layer = L.tileLayer(tileUrl(def), {
        tileSize: 256,
        noWrap: true,
        minZoom: 0,
        maxZoom: MAP_MAX_ZOOM,
        maxNativeZoom: def.nativeMaxZoom,
        attribution: def.credit
      });
      layer.on("tileload", function () { counts.ok++; updateStatus(); });
      layer.on("tileerror", function () { counts.failed++; updateStatus(); });
      return layer;
    }

    var tileLayers = {};
    var baseChoices = {};
    for (var i = 0; i < LAYERS.length; i++) {
      tileLayers[LAYERS[i].key] = makeLayer(LAYERS[i]);
      baseChoices[LAYERS[i].title] = tileLayers[LAYERS[i].key];
    }

    var footprint = L.rectangle(FOOTPRINT, {
      color: "#e8672a",
      weight: 2,
      dashArray: "6 4",
      fill: false,
      interactive: false
    });

    tileLayers[currentDef.key].addTo(map);
    footprint.addTo(map);

    L.control.layers(baseChoices, {
      "Outline of USGS 6 m mosaic area": footprint
    }, { collapsed: true }).addTo(map);

    /* ---------- 4. Keep the information panel up to date ---------- */

    map.on("zoomend", updateSource);

    map.on("baselayerchange", function (e) {
      for (var n = 0; n < LAYERS.length; n++) {
        if (tileLayers[LAYERS[n].key] === e.layer) {
          currentDef = LAYERS[n];
        }
      }
      counts.ok = 0;
      counts.failed = 0;
      updateStatus();
      updateSource();
    });

    /* ---------- 5. Tap to read coordinates ---------- */

    var marker = null;

    map.on("click", function (e) {
      var lat = e.latlng.lat;
      var lon = e.latlng.lng;
      var lon360 = ((lon % 360) + 360) % 360;

      setText("map-tap-out", formatLat(lat) + ",  " + formatLon(lon));
      setText("map-tap-note",
        "Decimal: " + lat.toFixed(4) + ", " + lon.toFixed(4) +
        "  |  Longitude 0\u2013360\u00B0E: " + lon360.toFixed(4) +
        "  |  Planetocentric latitude, east-positive longitude " +
        "(as stated in the USGS metadata for Viking MDIM 2.1).");

      if (marker) {
        marker.setLatLng(e.latlng);
      } else {
        marker = L.circleMarker(e.latlng, {
          radius: 6,
          color: "#ffffff",
          weight: 2,
          fillColor: "#e8672a",
          fillOpacity: 1
        }).addTo(map);
      }
    });

    /* ---------- 6. Start ---------- */

    updateStatus();
    updateSource();
  }

  /* ---------- 7. Hook into app.js (or start alone) ---------- */

  if (window.JEZERO && typeof window.JEZERO.register === "function") {
    window.JEZERO.register("map", startMap);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startMap);
  } else {
    startMap();
  }
})();
