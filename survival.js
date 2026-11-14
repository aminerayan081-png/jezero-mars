/* JEZERO - survival.js : Section 8, Mars Survival Centre (educational SIMULATION).
   Needs survival-data.js loaded first. Builds everything inside <section id="survival">.
   Nothing here is real astronaut training or NASA equipment data. */
(function () {
  "use strict";
  var D = window.JZS;
  if (!D) { return; }
  var host = document.getElementById("survival");
  if (!host) {
    var mn = document.querySelector("main");
    if (!mn) { return; }
    host = document.createElement("section");
    host.id = "survival";
    host.className = "panel";
    var so = document.getElementById("sources");
    mn.insertBefore(host, so && so.parentNode === mn ? so : null);
  }

  var TABS = [["sys", "Life support"], ["thr", "Threats"], ["hab", "Habitat"], ["emg", "Emergencies"], ["cha", "Challenge"]];
  var NAMES = { air: "Air", water: "Water", food: "Food", hp: "Health", sci: "Science", bud: "Power this sol", nb: "Power next sol" };
  var SWC = { air: { n: "Air and pressure fans", c: 3, t: "ON: air -6. OFF: air -26." },
              water: { n: "Water recycler", c: 2, t: "ON: water -6. OFF: water -16." },
              heat: { n: "Heating", c: 3, t: "ON: no harm. OFF: health -18." },
              sci: { n: "Science and comms", c: 2, t: "ON: +10 science points." } };
  var MAXSOL = 6, BASE_BUD = 9;
  var st = { tab: "sys", sys: 0, thr: 0, mod: 0, dust: false, m: 1, sc: 0, pr: null, C: null };
  var timers = [];

  function $(id) { return document.getElementById("sv-" + id); }
  function link(k) { var s = D.src[k]; return '<a href="' + s.u + '" target="_blank" rel="noopener">' + s.t + "</a>"; }
  function clamp(v) { return Math.max(0, Math.min(100, v)); }
  function chips(list, key, sel) {
    var h = '<div class="sv-chips">';
    list.forEach(function (n, i) { h += '<button type="button" class="sv-chip' + (i === sel ? " on" : "") + '" data-' + key + '="' + i + '">' + n + "</button>"; });
    return h + "</div>";
  }
  function meter(name, v) {
    var c = v > 50 ? "g" : v > 25 ? "a" : "r";
    return '<div class="sv-m"><span>' + name + '</span><div class="sv-bar"><i class="' + c + '" style="width:' + v + '%"></i></div><b>' + Math.round(v) + "</b></div>";
  }
  function meters(o) { return '<div class="sv-ms">' + meter("Air", o.air) + meter("Water", o.water) + meter("Food", o.food) + meter("Health", o.hp) + "</div>"; }
  function fxText(fx) {
    var t = [];
    Object.keys(fx).forEach(function (k) { t.push(NAMES[k] + " " + (fx[k] > 0 ? "+" : "") + fx[k]); });
    return t.length ? t.join(", ") : "No resources lost";
  }
  function badge(r) { return '<span class="sv-r sv-' + r + '">' + (r === "good" ? "GOOD CHOICE" : r === "ok" ? "OKAY CHOICE" : "POOR CHOICE") + "</span>"; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* ---------- screen shell ---------- */
  var th = "";
  TABS.forEach(function (t) { th += '<button type="button" class="sv-tab" data-tab="' + t[0] + '">' + t[1] + "</button>"; });
  host.innerHTML =
    "<h2>8. Mars Survival Centre</h2>" +
    '<p class="sv-intro"><span class="badge badge-real">REAL DATA</span> facts about Mars, with a source. <span class="badge badge-sim">SIMULATION</span> scenarios and numbers we made up to teach ideas. This is not astronaut training and not NASA equipment data.</p>' +
    '<div class="sv-tabs" role="tablist">' + th + "</div>" +
    '<div id="sv-body" class="sv-card"></div>' +
    '<details class="sv-assume"><summary>Assumptions in this section</summary><ul>' +
    "<li>Mars facts (temperature, pressure, radiation, dust, water) are from NASA and published studies, rounded, with sources on each panel.</li>" +
    "<li>The failure race shows a teaching ranking of which problem becomes dangerous first. The speeds are not real timings.</li>" +
    "<li>Habitat modules are a hypothetical layout. The shielding slider uses a made-up rule where each metre of soil halves the dose. Real shielding is more complicated.</li>" +
    "<li>Emergency choices and their effects are invented. Real procedures are far more detailed.</li>" +
    "<li>In the challenge each sol (a Mars day) gives " + BASE_BUD + " power units. Air and fans cost 3, heating 3, water recycling 2, science and comms 2.</li></ul></details>";

  /* ---------- TAB 1: life support ---------- */
  function vSys() {
    var s = D.sys[st.sys], h = chips(D.sys.map(function (x) { return x.n; }), "sys", st.sys);
    h += "<h3>" + s.n + "</h3><p>" + s.how + '</p><p class="sv-fact"><span class="badge badge-real">REAL DATA</span> ' + s.real + " Source: " + link(s.s) + ".</p>";
    h += '<p class="sv-note"><b>If it fails:</b> ' + s.fail + "</p><h3>Failure race</h3>" +
      '<p class="sv-small">Switch everything off and watch which bar empties first. Speeds are a teaching ranking, not real timings.</p><div class="sv-race">';
    D.sys.forEach(function (x, i) {
      h += '<div class="sv-row' + (i === st.sys ? " sel" : "") + '"><span>' + x.n + '</span><div class="sv-bar"><i id="sv-r' + i + '" class="g" style="width:100%"></i></div></div>';
    });
    return h + '</div><div class="sv-btns"><button type="button" class="sv-btn sv-main" data-a="race">Switch everything off</button><button type="button" class="sv-btn" data-a="reset">Restore all systems</button></div><p id="sv-racemsg" class="sv-small" aria-live="polite"></p>';
  }
  function startRace() {
    clearTimers();
    D.sys.forEach(function (x, i) {
      var el = $("r" + i);
      el.style.transition = "none"; el.style.width = "100%"; el.className = "g";
      void el.offsetWidth;
      el.style.transition = "width " + (x.rank * 4) + "s linear"; el.style.width = "0%";
      timers.push(setTimeout(function () { el.className = "r"; $("racemsg").textContent = x.n + " has run out. " + x.fail; }, x.rank * 4000));
    });
    $("racemsg").textContent = "All systems are off...";
  }
  function resetRace() {
    clearTimers();
    D.sys.forEach(function (x, i) { var el = $("r" + i); el.style.transition = "none"; el.style.width = "100%"; el.className = "g"; });
    $("racemsg").textContent = "All systems restored.";
  }

  /* ---------- TAB 2: threats ---------- */
  function vThr() {
    var t = D.threats[st.thr], h = chips(D.threats.map(function (x) { return x.n; }), "thr", st.thr);
    h += "<h3>" + t.n + '</h3><p class="sv-fact"><span class="badge badge-real">REAL DATA</span> ' + t.fact + " Source: " + link(t.s) + ".</p>";
    t.stats.forEach(function (s) {
      h += '<div class="sv-cmp"><b>' + s.l + "</b>";
      if (s.pct !== undefined) {
        h += '<div class="sv-row"><span>Mars</span><div class="sv-bar"><i class="a" style="width:' + Math.max(s.pct, 1.5) + '%"></i></div><em>' + s.m + '</em></div>' +
             '<div class="sv-row"><span>Earth</span><div class="sv-bar"><i class="g" style="width:100%"></i></div><em>' + s.e + "</em></div>";
      } else {
        h += '<div class="sv-two"><div><small>Mars</small>' + s.m + "</div><div><small>Earth</small>" + s.e + "</div></div>";
      }
      h += "</div>";
    });
    return h + "<p><b>What it means for people:</b> " + t.means + '</p><p class="sv-note"><span class="badge badge-sim">HYPOTHETICAL</span> Ideas people discuss: ' + t.ideas + "</p>";
  }

  /* ---------- TAB 3: habitat ---------- */
  function vHab() {
    var h = '<p>Tap a module to learn what it does. Move the slider to add soil on top. Press the button to start a dust storm. <span class="badge badge-sim">HYPOTHETICAL LAYOUT</span></p>' +
      '<div id="sv-box" class="sv-box"><div class="sv-tiles">';
    D.mods.forEach(function (m, i) {
      var amber = st.dust && i === 0;
      h += '<button type="button" class="sv-tile' + (i === st.mod ? " on" : "") + '" data-mod="' + i + '"><i class="sv-led' + (amber ? " warn" : "") + '"></i><b>' + m.n + "</b><small>" + (amber ? "Low solar output" : "Normal") + "</small></button>";
    });
    h += '</div></div><label for="sv-sh">Soil shielding on top: <output id="sv-mo">1</output> m</label>' +
      '<input type="range" id="sv-sh" min="0" max="3" step="0.5" value="' + st.m + '">' +
      '<div class="sv-row"><span>Dose inside</span><div class="sv-bar"><i id="sv-dosebar" class="a"></i></div><em id="sv-dose"></em></div>' +
      '<p class="sv-small">Unshielded surface dose: about 0.67 mSv per day (real, measured by Curiosity). Our teaching rule: each metre of soil halves it.</p>' +
      '<div class="sv-btns"><button type="button" class="sv-btn' + (st.dust ? " sv-main" : "") + '" data-a="dust">Dust storm: ' + (st.dust ? "ON (tap to end)" : "OFF (tap to start)") + "</button></div>";
    var m = D.mods[st.mod];
    h += "<h3>" + m.n + "</h3><p>" + m.t + "</p><p>" + m.w + '</p><p class="sv-note"><b>What can go wrong:</b> ' + m.risk + "</p>";
    if (st.dust) { h += '<p class="sv-note sv-warnbox"><b>Dust storm:</b> solar panels make much less power. The batteries must keep air, heating and water running. Science and comms should wait.</p>'; }
    return h;
  }
  function updHab() {
    var d = 0.67 * Math.pow(0.5, st.m);
    $("mo").textContent = st.m;
    $("sh").value = st.m;
    $("box").style.borderWidth = (3 + st.m * 7) + "px";
    $("dose").textContent = d.toFixed(2) + " mSv/day";
    $("dosebar").style.width = (d / 0.67 * 100) + "%";
  }

  /* ---------- TAB 4: emergency practice ---------- */
  function vEmg() {
    var sc = D.scen[st.sc], p = st.pr || (st.pr = { air: 100, water: 100, food: 100, hp: 100, res: null });
    var h = chips(D.scen.map(function (x) { return x.n; }), "sc", st.sc) + "<h3>" + sc.n + "</h3><p>" + sc.t + "</p>" + meters(p);
    if (!p.res) {
      h += "<p><b>What do you do?</b></p>";
      sc.opts.forEach(function (o, i) { h += '<button type="button" class="sv-opt" data-po="' + i + '">' + o.l + "</button>"; });
    } else {
      h += '<div class="sv-result">' + badge(p.res.r) + "<p><b>You chose:</b> " + p.res.l + "</p><p><b>Effects:</b> " + fxText(p.res.fx) + "</p><p><b>Why:</b> " + p.res.why +
        '</p><button type="button" class="sv-btn sv-main" data-a="retry">Try a different choice</button></div>';
    }
    return h + '<p class="sv-small">SIMULATION: the effects are made up for teaching.</p>';
  }

  /* ---------- TAB 5: challenge ---------- */
  function newC() {
    return { sol: 1, air: 100, water: 100, food: 100, hp: 100, sci: 0, bud: BASE_BUD, carry: 0, ph: "intro", ev: null, res: null, last: "",
             sw: { air: 1, water: 1, heat: 1, sci: 0, ration: 0 }, log: [], over: "" };
  }
  function nextEvent() {
    var C = st.C, e, n = 0;
    do { e = D.scen[Math.floor(Math.random() * D.scen.length)]; n++; } while (e.id === C.last && n < 8);
    C.last = e.id; C.ev = e; C.res = null;
    C.bud = Math.max(3, BASE_BUD + C.carry); C.carry = 0;
    C.ph = "event";
  }
  function dead() {
    var C = st.C;
    var k = C.air <= 0 ? "Air ran out" : C.water <= 0 ? "Water ran out" : C.food <= 0 ? "Food ran out" : C.hp <= 0 ? "The crew's health failed" : "";
    if (k) { C.over = k; C.ph = "rep"; }
    return !!k;
  }
  function chooseEv(i) {
    var C = st.C, o = C.ev.opts[i], fx = o.fx;
    ["air", "water", "food", "hp"].forEach(function (k) { if (fx[k]) { C[k] = clamp(C[k] + fx[k]); } });
    if (fx.sci) { C.sci = Math.max(0, C.sci + fx.sci); }
    if (fx.bud) { C.bud = Math.max(3, C.bud + fx.bud); }
    if (fx.nb) { C.carry += fx.nb; }
    C.res = o;
    C.log.push({ sol: C.sol, ev: C.ev.n, choice: o.l, r: o.r, off: [], sci: 0, ration: 0 });
    dead();
  }
  function used() {
    var s = st.C.sw, u = 0;
    ["air", "water", "heat", "sci"].forEach(function (k) { if (s[k]) { u += SWC[k].c; } });
    return u;
  }
  function endSol() {
    var C = st.C, s = C.sw, entry = C.log[C.log.length - 1];
    C.air = clamp(C.air - (s.air ? 6 : 26));
    C.water = clamp(C.water - (s.water ? 6 : 16));
    C.food = clamp(C.food - (s.ration ? 5 : 10));
    if (!s.heat) { C.hp = clamp(C.hp - 18); }
    if (s.ration) { C.hp = clamp(C.hp - 6); }
    if (s.sci) { C.sci += 10; }
    ["air", "water", "heat"].forEach(function (k) { if (!s[k]) { entry.off.push(SWC[k].n); } });
    entry.sci = s.sci; entry.ration = s.ration;
    if (dead()) { return; }
    if (C.sol >= MAXSOL) { C.ph = "rep"; return; }
    C.sol++;
    nextEvent();
  }

  function vCha() {
    var C = st.C || (st.C = newC()), h = "";
    if (C.ph === "intro") {
      return "<h3>Mars Survival Challenge</h3><p>You are in charge of a small hypothetical habitat for " + MAXSOL + " sols (Mars days). Each sol an emergency happens. First you respond to it. Then you choose which systems to run with limited power.</p>" +
        "<p>Air, water, food and health must all stay above zero. Dust storms cut your power. You cannot run everything, so decide what matters most.</p>" +
        '<button type="button" class="sv-btn sv-main" data-a="cstart">Start challenge</button>';
    }
    if (C.ph === "rep") { return report(); }
    h += '<div class="sv-head"><b>Sol ' + C.sol + " of " + MAXSOL + '</b><button type="button" class="sv-btn" data-a="crestart">Restart</button></div>' + meters(C) +
      '<p class="sv-small">Science points: ' + C.sci + "</p>";
    if (C.ph === "event") {
      h += '<div class="sv-event"><h3>' + C.ev.n + "</h3><p>" + C.ev.t + "</p>";
      if (!C.res) {
        C.ev.opts.forEach(function (o, i) { h += '<button type="button" class="sv-opt" data-co="' + i + '">' + o.l + "</button>"; });
      } else {
        h += badge(C.res.r) + "<p><b>You chose:</b> " + C.res.l + "</p><p><b>Effects:</b> " + fxText(C.res.fx) + "</p><p><b>Why:</b> " + C.res.why + "</p>" +
          '<button type="button" class="sv-btn sv-main" data-a="cplan">Plan power for this sol</button>';
      }
      return h + "</div>";
    }
    var u = used(), over = u > C.bud;
    h += "<h3>Plan your power</h3><p>Power available this sol: <b>" + C.bud + "</b>. Planned use: <b>" + u + "</b></p>" +
      '<div class="sv-bar big"><i class="' + (over ? "r" : "a") + '" style="width:' + Math.min(100, u / C.bud * 100) + '%"></i></div>';
    ["air", "water", "heat", "sci"].forEach(function (k) {
      h += '<button type="button" class="sv-sw' + (C.sw[k] ? " on" : "") + '" data-sw="' + k + '"><b>' + SWC[k].n + "</b> <span>" + (C.sw[k] ? "ON" : "OFF") + " (power " + SWC[k].c + ")</span><small>" + SWC[k].t + "</small></button>";
    });
    h += '<button type="button" class="sv-sw' + (C.sw.ration ? " on" : "") + '" data-sw="ration"><b>Half food rations</b> <span>' + (C.sw.ration ? "ON" : "OFF") + " (no power)</span><small>ON: food -5 and health -6. OFF: food -10.</small></button>";
    h += over ? '<p class="sv-note sv-warnbox">You are over budget. Switch something off.</p>' : "";
    return h + '<button type="button" class="sv-btn sv-main" data-a="cend"' + (over ? " disabled" : "") + ">End sol " + C.sol + "</button>";
  }

  function report() {
    var C = st.C, g = 0, o = 0, p = 0, noHeat = 0, noAir = 0, noWater = 0, sciSols = 0, rows = "";
    C.log.forEach(function (e) {
      if (e.r === "good") { g++; } else if (e.r === "ok") { o++; } else { p++; }
      if (e.off.indexOf(SWC.heat.n) > -1) { noHeat++; }
      if (e.off.indexOf(SWC.air.n) > -1) { noAir++; }
      if (e.off.indexOf(SWC.water.n) > -1) { noWater++; }
      if (e.sci) { sciSols++; }
      rows += "<tr><th>Sol " + e.sol + "</th><td>" + e.ev + ": " + e.choice + " (" + e.r + ")" + (e.off.length ? "<br>Off: " + e.off.join(", ") : "") + "</td></tr>";
    });
    var alive = !C.over, score = alive ? C.sci + Math.round((C.air + C.water + C.food + C.hp) / 4) : C.sci;
    var tips = [];
    if (C.over) { tips.push(C.over + ". Protect air, heat and water first, because they fail fastest."); }
    if (p) { tips.push("You made " + p + " poor emergency choice(s). Look for options that protect people before equipment."); }
    if (noHeat) { tips.push("Heating was off on " + noHeat + " sol(s), which hurt health."); }
    if (noAir) { tips.push("Air and fans were off on " + noAir + " sol(s), which drained air quickly."); }
    if (noWater) { tips.push("The water recycler was off on " + noWater + " sol(s), which wasted water."); }
    if (!sciSols) { tips.push("You never ran science, so you earned no science points. Safety first is right, but look for safe moments."); }
    if (!tips.length) { tips.push("Strong run: you protected the essentials and still found time for science."); }
    return '<h3>Survival assessment</h3><p class="sv-out ' + (alive ? "sv-good" : "sv-poor") + '"><b>' + (alive ? "CREW SURVIVED (simulated)" : "CREW DID NOT SURVIVE (simulated)") + "</b><br>" +
      (alive ? "All " + MAXSOL + " sols completed." : C.over + " on sol " + C.sol + ".") + "</p>" + meters(C) +
      "<p>Score: <b>" + score + "</b> (science " + C.sci + (alive ? " plus remaining resources" : "") + "). Choices: " + g + " good, " + o + " okay, " + p + " poor.</p>" +
      '<table class="sv-table">' + rows + "</table><h3>What to learn</h3><ul>" + tips.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>" +
      '<p class="sv-note">Priority rule: things that fail fastest (pressure, air, heat) come first, then water and food, and science last.</p>' +
      '<button type="button" class="sv-btn sv-main" data-a="crestart">Play again</button>';
  }

  /* ---------- wiring ---------- */
  var V = { sys: vSys, thr: vThr, hab: vHab, emg: vEmg, cha: vCha };
  function render() {
    clearTimers();
    $("body").innerHTML = V[st.tab]();
    var tabs = host.querySelectorAll(".sv-tab");
    for (var i = 0; i < tabs.length; i++) { tabs[i].className = "sv-tab" + (tabs[i].getAttribute("data-tab") === st.tab ? " on" : ""); }
    if (st.tab === "hab") { updHab(); }
  }

  host.addEventListener("input", function (e) {
    if (e.target.id === "sv-sh") { st.m = Number(e.target.value); updHab(); }
  });
  host.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null;
    if (!b || !host.contains(b) || b.disabled) { return; }
    var d = b.dataset, a = d.a;
    if (d.tab) { st.tab = d.tab; render(); return; }
    if (d.sys !== undefined) { st.sys = Number(d.sys); render(); return; }
    if (d.thr !== undefined) { st.thr = Number(d.thr); render(); return; }
    if (d.mod !== undefined) { st.mod = Number(d.mod); render(); return; }
    if (d.sc !== undefined) { st.sc = Number(d.sc); st.pr = null; render(); return; }
    if (d.po !== undefined) {
      var o = D.scen[st.sc].opts[Number(d.po)], p = st.pr;
      ["air", "water", "food", "hp"].forEach(function (k) { if (o.fx[k]) { p[k] = clamp(p[k] + o.fx[k]); } });
      p.res = o; render(); return;
    }
    if (d.co !== undefined) { chooseEv(Number(d.co)); render(); return; }
    if (d.sw) { st.C.sw[d.sw] = st.C.sw[d.sw] ? 0 : 1; render(); return; }
    if (a === "race") { startRace(); }
    else if (a === "reset") { resetRace(); }
    else if (a === "dust") { st.dust = !st.dust; render(); }
    else if (a === "retry") { st.pr = null; render(); }
    else if (a === "cstart") { st.C = newC(); nextEvent(); render(); }
    else if (a === "cplan") { st.C.ph = "plan"; render(); }
    else if (a === "cend") { endSol(); render(); }
    else if (a === "crestart") { st.C = newC(); render(); }
  });

  render();
})();
