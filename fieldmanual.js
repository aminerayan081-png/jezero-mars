(function () {
  "use strict";
  function init() {
    var root = document.getElementById("manual");
    if (!root) return;
    var KEY = "jezero-manual-v1", saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { saved = {}; }
    function persist() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {} }

    var boxes = root.querySelectorAll("input[type=checkbox][data-id]");
    var tabs = root.querySelectorAll(".fm-tab");
    var panels = root.querySelectorAll(".fm-panel");
    var barFill = root.querySelector(".fm-bar span");
    var overall = root.querySelector(".fm-overall");

    function update() {
      var total = boxes.length, done = 0, i;
      for (i = 0; i < boxes.length; i++) if (boxes[i].checked) done++;
      if (overall) overall.textContent = done + " of " + total + " items checked";
      if (barFill) barFill.style.width = (total ? Math.round(done / total * 100) : 0) + "%";
      for (i = 0; i < panels.length; i++) {
        var pb = panels[i].querySelectorAll("input[type=checkbox][data-id]"), pd = 0;
        for (var j = 0; j < pb.length; j++) if (pb[j].checked) pd++;
        var c = root.querySelector('.fm-tab[data-ch="' + panels[i].getAttribute("data-ch") + '"] small');
        if (c) c.textContent = pd + "/" + pb.length;
      }
    }

    for (var b = 0; b < boxes.length; b++) {
      (function (box) {
        box.checked = !!saved[box.getAttribute("data-id")];
        box.addEventListener("change", function () {
          saved[box.getAttribute("data-id")] = box.checked ? 1 : 0;
          persist(); update();
        });
      })(boxes[b]);
    }

    var reset = root.querySelector(".fm-reset");
    if (reset) reset.addEventListener("click", function () {
      for (var r = 0; r < boxes.length; r++) boxes[r].checked = false;
      saved = {}; persist(); update();
    });

    function show(ch) {
      for (var t = 0; t < tabs.length; t++) {
        var on = tabs[t].getAttribute("data-ch") === ch;
        tabs[t].setAttribute("aria-selected", on ? "true" : "false");
      }
      for (var p = 0; p < panels.length; p++) {
        panels[p].hidden = panels[p].getAttribute("data-ch") !== ch;
      }
    }
    for (var k = 0; k < tabs.length; k++) {
      tabs[k].addEventListener("click", function () { show(this.getAttribute("data-ch")); });
    }
    show("1");

    var scns = root.querySelectorAll(".fm-scn");
    for (var s = 0; s < scns.length; s++) {
      (function (box) {
        var steps = box.querySelectorAll(".fm-steps li"), shown = 1;
        var ctl = document.createElement("div"); ctl.className = "fm-ctl";
        var next = document.createElement("button"); next.type = "button"; next.className = "fm-btn";
        var again = document.createElement("button"); again.type = "button"; again.className = "fm-btn"; again.textContent = "Restart";
        ctl.appendChild(next); ctl.appendChild(again); box.appendChild(ctl);
        function draw() {
          for (var q = 0; q < steps.length; q++) steps[q].classList.toggle("fm-hide", q >= shown);
          var end = shown >= steps.length;
          next.disabled = end;
          next.textContent = end ? "All steps shown" : "Next step (" + shown + "/" + steps.length + ")";
        }
        next.addEventListener("click", function () { if (shown < steps.length) { shown++; draw(); } });
        again.addEventListener("click", function () { shown = 1; draw(); });
        draw();
      })(scns[s]);
    }
    update();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
