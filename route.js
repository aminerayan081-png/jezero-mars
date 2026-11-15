/* =========================================================
   JEZERO - route.js
   Section 6: Route Planner (straight-line distance on Mars).
   Part 1: DATA (edit places here). Part 2: MATHS. Part 3: PAGE.
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     PART 1: THE PLACES
     Every place needs a name, latitude, longitude (degrees,
     planetocentric, east positive), a zone, a note and a source.
     Never add a place without a source.
     zone: "floor" (crater floor), "rim" (crater wall or rim),
           "outside" (outside the crater)
     --------------------------------------------------------- */

  var USGS = {
    label: "USGS SIM 3464 pamphlet (Sun and Stack, 2020)",
    url: "https://pubs.usgs.gov/sim/3464/sim3464_pamphlet.pdf"
  };

  var RIM_NOTE =
    "USGS interprets mounds along the crater wall as collapsed pieces of the crater rim. " +
    "They contain megabreccia (huge broken blocks), and blocks across the map area range from about 10 to 100 m wide.";

  var PLACES = [
    {
      name: "Octavia E. Butler Landing (rover touchdown site)",
      lat: 18.44,
      lon: 77.45,
      zone: "floor",
      note: "NASA lists rocks, cliffs and dune fields among the hazards of the wider landing area. The touchdown spot was reported to be tilted only about 1 degree, with rocks small compared with the rover's wheels (see Section 4).",
            source: {
        label: "NASA, 5 March 2021 (names the site; coordinates as listed on Wikipedia)",
        url: "https://www.nasa.gov/press-release/nasa-s-perseverance-drives-on-mars-terrain-for-first-time/"
            }
    },
    {
      name: "Delta remnant mounds, middle of the crater floor",
      lat: 18.47,
      lon: 77.50,
      zone: "floor",
      note: "USGS mapping shows eroded remnants of the delta (fan unit 2) toward the middle of the crater floor. Dark, loose sediment is mapped on the floor next to the fan.",
      source: USGS
    },
    {
      name: "Fan unit 1 / fan unit 2 boundary, northwest crater floor",
      lat: 18.58,
      lon: 77.48,
      zone: "floor",
      note: "Delta deposits (river-laid sediment) mapped as fan units 1 and 2. USGS marks the boundary between the two units here as approximate.",
      source: USGS
    },
    {
      name: "Crater-wall mound with megabreccia (site A)",
      lat: 18.29,
      lon: 77.40,
      zone: "rim",
      note: RIM_NOTE,
      source: USGS
    },
    {
      name: "Crater-wall mound with megabreccia (site B)",
      lat: 18.15,
      lon: 77.53,
      zone: "rim",
      note: RIM_NOTE,
      source: USGS
    },
    {
      name: "Warped, faulted layered rock on the crater rim",
      lat: 18.46,
      lon: 77.26,
      zone: "rim",
      note: "USGS notes warping and faulting of layered rock exposed on the Jezero crater rim here, seen in HiRISE images.",
      source: USGS
    },
    {
      name: "Neretva Vallis channel segment (outside the crater)",
      lat: 18.61,
      lon: 76.94,
      zone: "outside",
      note: "Neretva Vallis is the ancient river channel that fed Jezero. USGS mapping shows part of the channel here filled in by a dark, smooth deposit.",
      source: USGS
    },
    {
      name: "Midway ellipse centre (candidate site outside the crater)",
      lat: 18.3,
      lon: 77.0,
      zone: "outside",
      note: "A candidate Mars 2020 landing area that USGS calls a potential future destination for the rover. USGS says high-resolution mineral data is comparatively scarce there. It gives no terrain description for this point.",
      source: USGS
    }
  ];

  /* ---------------------------------------------------------
     PART 2: THE MATHS
     --------------------------------------------------------- */

  var MARS_RADIUS_M = 3396190;     /* USGS Mars 2000 sphere */
  var EARTH_RADIUS_M = 6371008.8;  /* used only to show the difference */

  /* Shortest distance over a sphere (haversine), in metres. */
  function sphereDistanceM(lat1, lon1, lat2, lon2, radius) {
    var rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad;
    var dLon = (lon2 - lon1) * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function formatKm(metres) {
    var km = metres / 1000;
    return km < 10 ? km.toFixed(2) : km.toFixed(1);
  }

  function formatCoords(p) {
    return p.lat.toFixed(2) + "\u00B0 N, " + p.lon.toFixed(2) + "\u00B0 E";
  }

  /* Terrain notes that depend on where the two places are. */
  function terrainMessages(a, b) {
    var msgs = [];
    var anyRim = a.zone === "rim" || b.zone === "rim";
    var anyOutside = a.zone === "outside" || b.zone === "outside";
    var anyInside = a.zone !== "outside" || b.zone !== "outside";

    if (anyInside && anyOutside) {
      msgs.push("One place is inside the crater and the other is outside it, so any real route would have to cross the crater rim. NASA\u2019s rover climbed the rim over loose, sloping ground (see Section 4).");
    } else if (anyRim) {
      msgs.push("At least one place is on the crater wall or rim. On NASA\u2019s climb of the rim, part of a 15 to 20 degree hill was far less firm than expected and the wheels had very little grip (see Section 4).");
    } else if (a.zone === "floor" && b.zone === "floor") {
      msgs.push("Both places are on the crater floor. The floor is not the same everywhere, so see the notes for each place below. NASA lists rocks, boulder fields, cliffs and dune fields among the hazards of this area (see Section 4).");
    } else {
      msgs.push("Both places are outside the crater, in the surrounding region. The sources we used say little about the ground between them.");
    }

    msgs.push("Slopes: steep ground and loose material can make a vehicle slip or lean over. A straight line takes no account of hills.");
    msgs.push("Rocks and boulders: boulder fields can block the way, and some rocks are too small to see from orbit.");
    msgs.push("Dust and wind: dust devils and blown sand are common at Jezero, and sand has damaged equipment.");
    return msgs;
  }

  /* Make the data and maths available for testing. */
  window.JezeroRoute = {
    places: PLACES,
    marsRadiusM: MARS_RADIUS_M,
    distanceM: sphereDistanceM
  };

  /* ---------------------------------------------------------
     PART 3: THE PAGE
     --------------------------------------------------------- */

  var startEl = document.getElementById("rt-start");
  var endEl = document.getElementById("rt-end");
  var goEl = document.getElementById("rt-go");
  var showEl = document.getElementById("rt-show");
  var msgEl = document.getElementById("rt-msg");
  var resultEl = document.getElementById("rt-result");

  /* If the Section 6 HTML is not on the page, stop quietly. */
  if (!startEl || !endEl || !goEl || !showEl || !msgEl || !resultEl) {
    return;
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var routeLayer = null;

  function setMessage(text, isWarning) {
    msgEl.textContent = text;
    msgEl.className = isWarning ? "rt-msg rt-warn" : "rt-msg";
  }

  function addOptions(selectEl) {
    for (var i = 0; i < PLACES.length; i++) {
      var opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = PLACES[i].name;
      selectEl.appendChild(opt);
    }
  }

  addOptions(startEl);
  addOptions(endEl);
  startEl.selectedIndex = 0;
  endEl.selectedIndex = 1;

  function clearChildren(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function addTerrainList(listEl, messages) {
    clearChildren(listEl);
    for (var i = 0; i < messages.length; i++) {
      var li = document.createElement("li");
      li.textContent = messages[i];
      listEl.appendChild(li);
    }
  }

  function addPlaceList(listEl, places) {
    clearChildren(listEl);
    for (var i = 0; i < places.length; i++) {
      var p = places[i];
      var li = document.createElement("li");

      var name = document.createElement("strong");
      name.textContent = (i === 0 ? "Start: " : "Destination: ") + p.name;
      li.appendChild(name);

      var coords = document.createElement("span");
      coords.className = "rt-coords";
      coords.textContent = formatCoords(p);
      li.appendChild(coords);

      li.appendChild(document.createTextNode(p.note + " Source: "));
      var link = document.createElement("a");
      link.href = p.source.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = p.source.label;
      li.appendChild(link);
      li.appendChild(document.createTextNode("."));

      listEl.appendChild(li);
    }
  }

  /* Draw the two places and the straight line on the existing map,
     if the map is available. Returns true if something was drawn. */
  function drawOnMap(a, b) {
    var map = window.jezeroMap;
    if (!map || typeof L === "undefined" || typeof map.addLayer !== "function") {
      return false;
    }
    try {
      if (routeLayer) {
        map.removeLayer(routeLayer);
      }
      var line = L.polyline([[a.lat, a.lon], [b.lat, b.lon]], {
        color: "#e8672a", weight: 3, dashArray: "8 6"
      });
      var startMarker = L.circleMarker([a.lat, a.lon], {
        radius: 7, color: "#121314", weight: 2, fillColor: "#5fbf7a", fillOpacity: 1
      }).bindTooltip("Start", { permanent: true, direction: "top", offset: [0, -6] })
        .bindPopup(a.name + "<br>" + formatCoords(a));
      var endMarker = L.circleMarker([b.lat, b.lon], {
        radius: 7, color: "#121314", weight: 2, fillColor: "#e8672a", fillOpacity: 1
      }).bindTooltip("End", { permanent: true, direction: "top", offset: [0, -6] })
        .bindPopup(b.name + "<br>" + formatCoords(b));

      routeLayer = L.layerGroup([line, startMarker, endMarker]).addTo(map);
      map.fitBounds(line.getBounds(), { padding: [50, 50], maxZoom: 9 });
      return true;
    } catch (err) {
      return false;
    }
  }

  function calculate() {
    var a = PLACES[Number(startEl.value)];
    var b = PLACES[Number(endEl.value)];

    if (!a || !b) {
      return;
    }
    if (a === b) {
      resultEl.hidden = true;
      showEl.hidden = true;
      setMessage("Please pick two different places.", true);
      return;
    }

    var marsM = sphereDistanceM(a.lat, a.lon, b.lat, b.lon, MARS_RADIUS_M);
    var earthM = sphereDistanceM(a.lat, a.lon, b.lat, b.lon, EARTH_RADIUS_M);

    document.getElementById("rt-km").textContent = formatKm(marsM);
    document.getElementById("rt-pair").textContent = a.name + "  to  " + b.name;
    document.getElementById("rt-method").textContent =
      "Straight-line (great-circle) distance on a sphere with Mars\u2019 radius, 3,396.19 km. " +
      "Earth\u2019s radius would wrongly give " + formatKm(earthM) + " km, about " +
      (EARTH_RADIUS_M / MARS_RADIUS_M).toFixed(1) + " times too long.";

    addTerrainList(document.getElementById("rt-terrain"), terrainMessages(a, b));
    addPlaceList(document.getElementById("rt-places"), [a, b]);

    resultEl.hidden = false;

    var drawn = drawOnMap(a, b);
    showEl.hidden = !drawn;
    if (drawn) {
      setMessage("Distance calculated. The two places and the straight line are now on the map in Section 2.", false);
    } else {
      setMessage("Distance calculated. The map link is not set up yet, so nothing was drawn on the map.", false);
    }
  }

  goEl.addEventListener("click", calculate);

  showEl.addEventListener("click", function () {
    var mapSection = document.getElementById("map");
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  });
})();
