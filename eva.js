/* =========================================================
   JEZERO - eva.js
   Section 7: Human EVA Mission Simulator (educational SIMULATION).
   Builds the whole section inside <section id="eva">.
   Part 1: ASSUMPTIONS. Part 2: SIMULATION. Part 3: SCREENS.
   Nothing here is NASA equipment data or real life-support maths.
   ========================================================= */
(function () {
  "use strict";

  var host = document.getElementById("eva");
  if (!host) {
    var main = document.querySelector("main");
    if (!main) { return; }
    host = document.createElement("section");
    host.id = "eva";
    host.className = "panel";
    var sv = document.getElementById("survival");
    main.insertBefore(host, sv && sv.parentNode === main ? sv : null);
  }

  /* ---------- PART 1: ASSUMPTIONS (all invented for teaching) ---------- */
  var WALK_KMH = 2.0;   /* assumed walking speed */
  var TH_H = 10;        /* assumed hours of heat reserve */
  var FAST = 1.4;       /* emergency return is 1.4 times faster */
  var EVENT_P = 0.14;   /* chance of an event at each 10-minute check */
  var CREW_BONUS = 0.3; /* each extra crew member speeds up work by 30% */

  var SITES = {
    delta: { name: "Delta remnant", km: 1.5, risk: 1.0, d: "Layered river-delta rock" },
    floor: { name: "Crater-floor rock field", km: 0.8, risk: 1.2, d: "Close, but boulder-strewn" },
    rim: { name: "Crater-wall mound", km: 2.5, risk: 1.5, d: "Far, steep and loose ground" }
  };
  var WORK = {
    careful: { name: "Cautious", use: 0.85, time: 1.15, risk: 0.8, d: "Slower work, less use per minute, fewer events" },
    standard: { name: "Standard", use: 1, time: 1, risk: 1, d: "Balanced" },
    bold: { name: "Ambitious", use: 1.2, time: 0.9, risk: 1.3, d: "Faster work, more use per minute, more events" }
  };
  /* inten = how hard the activity works the suit (1 = normal) */
  var ACT = {
    walk: { label: "Walk to site", inten: 1.3, need: "base" },
    sample: { label: "Collect sample", min: 20, inten: 1.6, need: "site" },
    photo: { label: "Photograph formation", min: 10, inten: 0.8, need: "site" },
    rock: { label: "Examine rock", min: 15, inten: 1.0, need: "site" },
    rest: { label: "Rest and check suit", min: 10, inten: 0.5, need: "any" },
    ret: { label: "Return to base", inten: 1.2, need: "site" },
    fast: { label: "Emergency return (fast)", inten: 2.2, need: "site" }
  };
  var ORDER = ["walk", "sample", "photo", "rock", "rest", "ret", "fast"];

  var cfg = { dur: 6, crew: 2, o2: 12, bat: 6, work: "standard", site: "delta", speed: 5 };
  var S = null;

  /* ---------- PART 2: SIMULATION ---------- */
  function $(id) { return document.getElementById("ev-" + id); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function clock(m) { return Math.floor(m / 60) + ":" + pad(Math.round(m % 60)); }

  function walkMin() { return Math.round(SITES[cfg.site].km / WALK_KMH * 60 * WORK[cfg.work].time); }
  function crewF() { return 1 + CREW_BONUS * (cfg.crew - 1); }
  function actMin(k) {
    if (k === "walk" || k === "ret") { return walkMin(); }
    if (k === "fast") { return Math.max(1, Math.round(walkMin() / FAST)); }
    return Math.max(1, Math.round(ACT[k].min * WORK[cfg.work].time / crewF()));
  }
  function cost(min, inten) {
    var w = WORK[cfg.work].use;
    return {
      o2: min * inten * w * cfg.crew * 100 / (cfg.o2 * 60),
      bat: min * inten * w * 100 / (cfg.bat * 60)
    };
  }

  function newSim() {
    S = {
      o2: 100, bat: 100, th: 100, hp: 100, el: 0, loc: "base", pos: 0,
      act: null, ev: null, paused: false, over: false, timer: null, reason: "",
      counts: { walk: 0, sample: 0, photo: 0, rock: 0, rest: 0, ret: 0, fast: 0 },
      emerg: [], log: [], f25: false, f10: false, cool: 0, lastEv: "",
      used: { o2: 0, bat: 0, th: 0, hp: 0 }
    };
  }
  function dec(k, v) {
    var b = S[k];
    S[k] = Math.max(0, b - v);
    S.used[k] += b - S[k];
  }
  function hurt(v) { dec("hp", v); }
  function drain(m, i) {
    var w = WORK[cfg.work].use;
    dec("o2", m * i * w * cfg.crew * 100 / (cfg.o2 * 60));
    dec("bat", m * i * w * 100 / (cfg.bat * 60));
    dec("th", m * 100 / (TH_H * 60));
    S.el += m;
  }
  function burn(m, i) { drain(m, i); }
  function L(text, cls) {
    S.log.unshift({ t: S.el, text: text, cls: cls || "" });
    if (S.log.length > 60) { S.log.pop(); }
  }

  function stop() { if (S.timer) { clearInterval(S.timer); S.timer = null; } }
  function run() { stop(); S.timer = setInterval(tick, 1000 / cfg.speed); }

  function startAct(key, total, p0, p1) {
    S.act = { key: key, total: total, done: 0, inten: ACT[key].inten, p0: p0, p1: p1 };
    L("Started: " + ACT[key].label + " (about " + total + " min)");
    run();
  }
  function begin(key) {
    if (S.over || S.act || S.ev || S.paused) { return; }
    var p0 = S.pos, p1 = S.pos;
    if (key === "walk") { p0 = 0; p1 = 100; }
    if (key === "ret" || key === "fast") { p0 = 100; p1 = 0; }
    startAct(key, actMin(key), p0, p1);
    render();
  }

  function tick() {
    var a = S.act;
    if (!a) { stop(); return; }
    drain(1, a.inten);
    a.done++;
    S.pos = a.p0 + (a.p1 - a.p0) * a.done / a.total;
    S.cool--;
    render();
    if (checkEnd()) { return; }
    if (a.done >= a.total) { finish(); return; }
    if (S.o2 <= 10 && !S.f10) { S.f10 = true; S.f25 = true; lowO2(10); return; }
    if (S.o2 <= 25 && !S.f25) { S.f25 = true; lowO2(25); return; }
    var p = EVENT_P * SITES[cfg.site].risk * WORK[cfg.work].risk;
    if (a.done % 10 === 0 && a.key !== "rest" && S.cool <= 0 && Math.random() < p) { rollEvent(); }
  }

  function finish() {
    var a = S.act;
    S.act = null;
    S.counts[a.key]++;
    if (a.key === "walk") { S.loc = "site"; S.pos = 100; L("Arrived at the " + SITES[cfg.site].name + ".", "good"); }
    else if (a.key === "ret" || a.key === "fast") { S.loc = "base"; S.pos = 0; L("Back at the base.", "good"); render(); end(""); return; }
    else if (a.key === "sample") { L("Sample collected and stored.", "good"); }
    else if (a.key === "photo") { L("Photographs taken.", "good"); }
    else if (a.key === "rock") { L("Rock examined and noted.", "good"); }
    else if (a.key === "rest") { S.th = Math.min(100, S.th + 3); S.used.th = Math.max(0, S.used.th - 3); L("Rested and checked the suit. Heat reserve +3%.", "good"); }
    stop();
    render();
  }

  function checkEnd() {
    var r = S.o2 <= 0 ? "o2" : S.bat <= 0 ? "bat" : S.th <= 0 ? "th" : S.hp <= 0 ? "hp" : "";
    if (r) { S.reason = r; L("CRITICAL: " + reasonText(r), "bad"); end(r); return true; }
    return false;
  }
  function reasonText(r) {
    return { o2: "oxygen reserve ran out", bat: "suit battery ran out", th: "heat reserve ran out", hp: "suit integrity failed" }[r];
  }
  function end() {
    S.over = true;
    S.act = null;
    S.ev = null;
    stop();
    render();
    showScreen("rep");
    buildReport();
  }

  /* ----- events and decisions ----- */
  var EVENTS = [
    function () {
      return { id: "dust", title: "Dust storm approaching", text: "Wind is rising and dust is hiding the horizon.", opts: [
        { l: "Shelter in place (30 min)", d: "Safe. Costs time and heat reserve.", f: function () { burn(30, 0.5); return "Waited out the storm. No damage."; } },
        { l: "Push on through", d: "Saves time. Dust can harm the suit.", f: function () { hurt(10); dec("bat", 4); dec("th", 6); return "Pushed through. Suit integrity -10%, battery -4%, heat -6%."; } },
        { l: "Slow and careful (+15 min)", d: "A middle way.", f: function () { burn(15, 1); hurt(2); return "Moved slowly through the dust. Suit integrity -2%."; } }
      ] };
    },
    function () {
      return { id: "obstacle", title: "Unexpected terrain obstacle", text: "A field of loose boulders blocks the path.", opts: [
        { l: "Detour around it (+20 min)", d: "Safe but slow.", f: function () { burn(20, 1.2); return "Took the long way round. No damage."; } },
        { l: "Climb over it", d: "Fast, but rough on the suit.", f: function () { burn(5, 1.8); hurt(10); return "Climbed over. Suit integrity -10%."; } },
        { l: "Scout a route first (10 min)", d: "60% chance of an easy gap. If not, you detour.", f: function () {
          burn(8, 0.8);
          if (Math.random() < 0.6) { return "Scouting found an easy gap. Small cost only."; }
          burn(20, 1.2);
          return "No gap found. Scouting cost time, then a detour was needed.";
        } }
      ] };
    },
    function () {
      return { id: "equip", title: "Equipment warning", text: "The suit reports a fault in a battery cell.", opts: [
        { l: "Run a diagnostic (10 min)", d: "Fixes the fault. Costs time.", f: function () { burn(10, 0.7); return "Fault found and cleared. No lasting loss."; } },
        { l: "Switch to backup power", d: "Instant. Costs 8% battery.", f: function () { dec("bat", 8); return "Backup power on. Battery -8%."; } },
        { l: "Ignore it", d: "50% chance it was nothing. 50% it is costly.", f: function () {
          if (Math.random() < 0.5) { return "It was a false alarm. Lucky."; }
          dec("bat", 20); hurt(5);
          return "The fault was real. Battery -20%, suit integrity -5%.";
        } }
      ] };
    },
    function () {
      return { id: "vis", title: "Reduced visibility", text: "Dust haze makes the ground hard to read.", opts: [
        { l: "Slow down (+10 min)", d: "Safe but slow.", f: function () { burn(10, 1); return "Slowed down and stayed safe."; } },
        { l: "Use waypoint markers", d: "Costs a little battery and time.", f: function () { burn(3, 1); dec("bat", 3); return "Followed waypoint markers. Battery -3%."; } },
        { l: "Keep your pace", d: "35% chance of a fall that damages the suit.", f: function () {
          if (Math.random() < 0.35) { hurt(12); return "You stumbled. Suit integrity -12%."; }
          return "Nothing went wrong this time.";
        } }
      ] };
    }
  ];

  function rollEvent() {
    var e, tries = 0;
    do { e = EVENTS[Math.floor(Math.random() * EVENTS.length)](); tries++; } while (e.id === S.lastEv && tries < 6);
    S.lastEv = e.id;
    openEvent(e);
  }

  function lowO2(level) {
    var a = S.act;
    var back = a.key === "ret" || a.key === "fast";
    var mins = Math.round(S.o2 / 100 * cfg.o2 / cfg.crew * 60);
    var opts = [];
    if (back) {
      opts.push({ l: "Keep returning", d: "You are already heading home.", f: function () { return "Kept returning to base."; } });
    } else {
      opts.push({ l: "Turn back now (fast return)", d: "Drops the current task and heads home quickly.", f: function () {
        var m = a.key === "walk" ? a.done : walkMin();
        S.act = null;
        startAct("fast", Math.max(1, Math.round(m / FAST)), S.pos, 0);
        return "Abandoned the task and started a fast return.";
      } });
      opts.push({ l: "Slow your breathing (15 min)", d: "Uses less oxygen per minute, but time still passes.", f: function () { burn(15, 0.5); return "Rested to save oxygen."; } });
      opts.push({ l: "Ignore it and keep working", d: "Risky. Oxygen keeps falling.", f: function () { return "Kept working with low oxygen."; } });
    }
    openEvent({ id: "o2", title: "Low oxygen warning (" + level + "%)", text: "About " + mins + " minutes of oxygen left at normal use.", opts: opts });
  }

  function openEvent(e) {
    stop();
    S.ev = e;
    L("EVENT: " + e.title, "warn");
    render();
  }
  function resolve(i) {
    var e = S.ev;
    if (!e || !e.opts[i]) { return; }
    var o = e.opts[i];
    S.ev = null;
    S.cool = 20;
    var res = o.f();
    S.emerg.push({ title: e.title, choice: o.l });
    L("You chose: " + o.l + ". " + res);
    render();
    if (checkEnd()) { return; }
    if (S.act && !S.paused) { run(); }
  }

  function togglePause() {
    if (!S || S.over) { return; }
    S.paused = !S.paused;
    if (S.paused) { stop(); L("Simulation paused."); }
    else { L("Simulation resumed."); if (S.act && !S.ev) { run(); } }
    render();
  }

  /* ---------- PART 3: SCREENS ---------- */
  host.innerHTML =
    '<h2>7. Human EVA Mission Simulator</h2>' +
    '<p class="ev-intro"><span class="badge badge-sim">SIMULATION</span> Plan and run a made-up Mars walk. Your choices change oxygen, battery, heat and suit damage. This is an educational game with invented numbers, not NASA equipment or real life-support software.</p>' +

    '<div id="ev-cfg" class="ev-card">' +
      '<h3>Mission setup</h3>' +
      '<div class="ev-form">' +
        '<label for="ev-i-dur">Planned duration</label><select id="ev-i-dur"><option value="3">3 hours</option><option value="4">4 hours</option><option value="6" selected>6 hours</option><option value="8">8 hours</option></select>' +
        '<label for="ev-i-crew">Crew size</label><select id="ev-i-crew"><option value="1">1 astronaut</option><option value="2" selected>2 astronauts</option><option value="3">3 astronauts</option><option value="4">4 astronauts</option></select>' +
        '<label for="ev-i-o2">Oxygen reserve: <output id="ev-o-o2">12</output> person-hours</label><input type="range" id="ev-i-o2" min="8" max="24" step="2" value="12">' +
        '<label for="ev-i-bat">Suit battery: <output id="ev-o-bat">6</output> hours at normal use</label><input type="range" id="ev-i-bat" min="4" max="10" step="1" value="6">' +
        '<label for="ev-i-work">Exploration style</label><select id="ev-i-work"></select>' +
        '<label for="ev-i-site">Destination</label><select id="ev-i-site"></select>' +
        '<label for="ev-i-speed">Simulation speed</label><select id="ev-i-speed"><option value="5">Normal (5 min per second)</option><option value="15">Fast (15 min per second)</option><option value="30">Very fast (30 min per second)</option></select>' +
      '</div>' +
      '<p id="ev-prev" class="ev-prev" aria-live="polite"></p>' +
      '<button type="button" id="ev-start" class="ev-btn ev-main">Start mission</button>' +
    '</div>' +

    '<div id="ev-run" class="ev-card" hidden>' +
      '<div class="ev-top">' +
        '<div class="ev-stat"><span id="ev-led" class="ev-led"></span><b id="ev-status">NOMINAL</b></div>' +
        '<div class="ev-clock"><span id="ev-time">T+0:00</span><small id="ev-plan"></small></div>' +
      '</div>' +
      '<div class="ev-tools">' +
        '<button type="button" id="ev-pause" class="ev-btn">Pause</button>' +
        '<button type="button" id="ev-speed" class="ev-btn">Speed: 5x</button>' +
        '<button type="button" id="ev-restart" class="ev-btn">Restart</button>' +
      '</div>' +
      '<div class="ev-gauges">' +
        gaugeHtml("o2", "Oxygen") + gaugeHtml("bat", "Battery") + gaugeHtml("th", "Heat reserve") + gaugeHtml("hp", "Suit integrity") +
      '</div>' +
      '<div class="ev-track"><span>Base</span><div class="ev-rail"><i id="ev-dot"></i></div><span id="ev-sitename">Site</span></div>' +
      '<div class="ev-work"><span id="ev-actname">Waiting for your order</span><div class="ev-bar"><i id="ev-actbar"></i></div></div>' +
      '<div id="ev-event" class="ev-event" hidden></div>' +
      '<h3>Choose an activity</h3>' +
      '<div class="ev-acts" id="ev-acts"></div>' +
      '<h3>Mission log</h3>' +
      '<ol id="ev-log" class="ev-log"></ol>' +
    '</div>' +

    '<div id="ev-rep" class="ev-card" hidden></div>' +

    '<details class="ev-assume"><summary>Assumptions and how the numbers work</summary><div id="ev-assume"></div></details>';

  function gaugeHtml(id, name) {
    return '<div class="ev-g"><div class="ev-gauge" id="ev-g-' + id + '"><div class="ev-gin"><b id="ev-v-' + id + '">100%</b></div></div>' +
      '<span class="ev-gname">' + name + '</span><small id="ev-s-' + id + '"></small></div>';
  }

  function fillSelect(id, obj, textFn, sel) {
    var el = $(id), h = "";
    Object.keys(obj).forEach(function (k) {
      h += '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + textFn(obj[k]) + "</option>";
    });
    el.innerHTML = h;
  }
  fillSelect("i-work", WORK, function (w) { return w.name + " - " + w.d; }, cfg.work);
  fillSelect("i-site", SITES, function (s) { return s.name + " (" + s.km + " km, assumed) - " + s.d; }, cfg.site);

  var actHtml = "";
  ORDER.forEach(function (k) {
    actHtml += '<button type="button" class="ev-act" id="ev-a-' + k + '" data-act="' + k + '"><b>' + ACT[k].label + '</b><small id="ev-e-' + k + '"></small></button>';
  });
  $("acts").innerHTML = actHtml;

  $("assume").innerHTML =
    '<p>Everything here is <b>invented for teaching</b>. None of it is real NASA data or a real spacesuit model.</p><ul>' +
    "<li>Walking speed is assumed to be " + WALK_KMH + " km/h. Destination distances are assumed, not measured.</li>" +
    "<li>Oxygen is one shared reserve measured in person-hours. At normal use, oxygen used per minute = crew size divided by the reserve.</li>" +
    "<li>Battery lasts the chosen number of hours at normal use. Each suit has its own battery, so crew size does not change it.</li>" +
    "<li>Heat reserve lasts " + TH_H + " hours and falls with time only. Resting restores 3%.</li>" +
    "<li>Every activity has an effort number. Use per minute = effort x exploration style. For example, collecting a sample is 1.6 and resting is 0.5.</li>" +
    "<li>Each extra crew member speeds up sampling, photos and rock work by " + Math.round(CREW_BONUS * 100) + "%, but uses more oxygen.</li>" +
    "<li>Every 10 minutes of work there is about a " + Math.round(EVENT_P * 100) + "% chance of an event. Harder destinations and the Ambitious style raise it.</li>" +
    "<li>Time only passes while an activity is running, so you can think about decisions as long as you like.</li></ul>";

  function showScreen(n) {
    ["cfg", "run", "rep"].forEach(function (k) { $(k).hidden = k !== n; });
    if (n !== "run" && host.scrollIntoView) { host.scrollIntoView({ block: "start" }); }
  }

  function readCfg() {
    cfg.dur = Number($("i-dur").value);
    cfg.crew = Number($("i-crew").value);
    cfg.o2 = Number($("i-o2").value);
    cfg.bat = Number($("i-bat").value);
    cfg.work = $("i-work").value;
    cfg.site = $("i-site").value;
    cfg.speed = Number($("i-speed").value);
    $("o-o2").textContent = cfg.o2;
    $("o-bat").textContent = cfg.bat;
    $("prev").textContent = "Crew of " + cfg.crew + " with " + cfg.o2 + " person-hours of oxygen gives about " +
      (cfg.o2 / cfg.crew).toFixed(1) + " hours at normal use. The walk to the " + SITES[cfg.site].name +
      " takes about " + walkMin() + " minutes each way.";
  }
  host.addEventListener("input", function (e) { if (e.target.id && e.target.id.indexOf("ev-i-") === 0) { readCfg(); } });
  host.addEventListener("change", function (e) { if (e.target.id && e.target.id.indexOf("ev-i-") === 0) { readCfg(); } });
  readCfg();

  function startMission() {
    readCfg();
    newSim();
    $("sitename").textContent = SITES[cfg.site].name;
    L("Mission start. Suited up at the base. Goal: reach the " + SITES[cfg.site].name + ", work, and come back safely.");
    showScreen("run");
    render();
  }

  function render() {
    if (!S) { return; }
    var tight = Math.min(S.o2, S.bat, S.th, S.hp);
    var st = "NOMINAL", cls = "ok";
    if (S.over) { st = "MISSION ENDED"; cls = "pause"; }
    else if (S.paused) { st = "PAUSED"; cls = "pause"; }
    else if (S.ev) { st = "DECISION NEEDED"; cls = "event"; }
    else if (tight <= 10) { st = "CRITICAL"; cls = "crit"; }
    else if (tight <= 25) { st = "CAUTION"; cls = "warn"; }
    $("status").textContent = st;
    $("led").className = "ev-led ev-" + cls;

    $("time").textContent = "T+" + clock(S.el);
    var over = S.el > cfg.dur * 60;
    $("plan").textContent = over ? " OVERTIME (plan " + cfg.dur + ":00)" : " of " + cfg.dur + ":00 planned";
    $("time").className = over ? "ev-over" : "";

    gauge("o2", S.o2, "about " + (S.o2 / 100 * cfg.o2 / cfg.crew).toFixed(1) + " h left");
    gauge("bat", S.bat, "about " + (S.bat 
