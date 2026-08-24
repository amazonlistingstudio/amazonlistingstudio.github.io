(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* nav border once scrolled */
  var nav = document.getElementById("nav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* reveal on first appearance, once */
  var items = document.querySelectorAll(".rv");
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* before / after comparison — works for every .ba on the page */
  document.querySelectorAll(".ba").forEach(function (ba) {
    var after = ba.querySelector(".ba-after");
    var handle = ba.querySelector(".ba-handle");
    if (!after || !handle) return;
    var dragging = false;

    var set = function (pct) {
      var v = Math.max(0, Math.min(100, pct));
      var s = v.toFixed(1) + "%";
      after.style.setProperty("--split", s);
      handle.style.left = s;
      ba.setAttribute("aria-valuenow", Math.round(v));
    };

    var fromEvent = function (e) {
      var r = ba.getBoundingClientRect();
      if (!r.width) return;
      set(((e.clientX - r.left) / r.width) * 100);
    };

    ba.addEventListener("pointerdown", function (e) {
      dragging = true;
      ba.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    ba.addEventListener("pointermove", function (e) {
      if (dragging) fromEvent(e);
    });
    ["pointerup", "pointercancel"].forEach(function (t) {
      ba.addEventListener(t, function () { dragging = false; });
    });

    ba.addEventListener("keydown", function (e) {
      var cur = parseFloat(ba.getAttribute("aria-valuenow")) || 50;
      var step = e.shiftKey ? 10 : 3;
      if (e.key === "ArrowLeft") { set(cur - step); e.preventDefault(); }
      if (e.key === "ArrowRight") { set(cur + step); e.preventDefault(); }
      if (e.key === "Home") { set(0); e.preventDefault(); }
      if (e.key === "End") { set(100); e.preventDefault(); }
    });

    set(52);
  });

  /* A+ panels scroll inside themselves, so they get their own visible rail:
     macOS hides overlay scrollbars at rest and the affordance was being missed */
  document.querySelectorAll(".aplus-item").forEach(function (item) {
    var frame = item.querySelector(".aplus-frame");
    var thumb = item.querySelector(".aplus-rail i");
    if (!frame || !thumb) return;

    var rail = item.querySelector(".aplus-rail");

    var sync = function () {
      var travel = frame.scrollHeight - frame.clientHeight;
      /* the first run happens before the tall image has loaded, when there is
         nothing to scroll yet; the rail has to come back once there is */
      rail.style.display = travel <= 0 ? "none" : "";
      if (travel <= 0) return;
      var ratio = frame.clientHeight / frame.scrollHeight;
      var pct = frame.scrollTop / travel;
      thumb.style.height = Math.max(12, ratio * 100).toFixed(1) + "%";
      thumb.style.top = (pct * (100 - Math.max(12, ratio * 100))).toFixed(1) + "%";
      item.classList.toggle("scrolled", frame.scrollTop > 24);
    };

    frame.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    var img = frame.querySelector("img");
    if (img) img.addEventListener("load", sync);
    sync();
  });

  /* flip a whole listing between its before and after versions */
  document.querySelectorAll(".phase").forEach(function (phase) {
    var buttons = phase.querySelectorAll(".toggle button");
    var strip = phase.querySelector(".phase-strip");

    var set = function (state) {
      phase.dataset.state = state;
      buttons.forEach(function (x) {
        x.setAttribute("aria-pressed", String(x.dataset.v === state));
      });
    };

    phase.querySelector(".toggle").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (b) set(b.dataset.v);
    });

    /* the slides themselves are a second, larger hit target for the same switch */
    if (strip) {
      strip.addEventListener("click", function () {
        set(phase.dataset.state === "after" ? "before" : "after");
      });
    }

    /* show the interaction once instead of describing it: on first sight the
       listing flips to Before and back, so the control explains itself */
    if (reduce || !("IntersectionObserver" in window)) return;
    var demoed = false;
    var demo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting || demoed) return;
        demoed = true;
        demo.disconnect();
        phase.classList.add("demo");
        setTimeout(function () { set("before"); }, 520);
        setTimeout(function () { set("after"); }, 1900);
        setTimeout(function () { phase.classList.remove("demo"); }, 2400);
      });
    }, { threshold: 0.35 });
    demo.observe(phase);
  });


  /* Real numbers only. data/results.json starts empty on purpose: a strip
     appears for a case the moment someone puts sourced figures in it. */
  var metricSlots = document.querySelectorAll(".phase-metrics");
  if (metricSlots.length) {
    fetch("data/results.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        metricSlots.forEach(function (slot) {
          var entry = data[slot.dataset.case];
          var rows = entry && entry.metrics;
          if (!rows || !rows.length) return;
          slot.innerHTML = rows.map(function (m) {
            var dir = m.dir === "up" ? "up" : m.dir === "down" ? "down" : "flat";
            var arrow = m.dir === "up" ? "\u2191" : m.dir === "down" ? "\u2193" : "";
            var note = m.note ? '<i class="' + dir + '">' + arrow + " " + m.note + "</i>" : "";
            return '<div class="metric"><b>' + m.value + "</b><span>" + m.label + "</span>" + note + "</div>";
          }).join("");
          slot.hidden = false;
        });
      })
      .catch(function () { /* no numbers, no strip */ });
  }

  /* accent preview switcher, temporary review tool */
  var sw = document.getElementById("sw");
  if (sw) {
    var saved = null;
    try { saved = localStorage.getItem("deyarts-accent"); } catch (err) { saved = null; }
    var apply = function (name) {
      if (name && name !== "blue") document.documentElement.setAttribute("data-accent", name);
      else document.documentElement.removeAttribute("data-accent");
      sw.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.a === (name || "blue")));
      });
      try { localStorage.setItem("deyarts-accent", name || "blue"); } catch (err) {}
    };
    if (saved) apply(saved);
    sw.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (b) apply(b.dataset.a);
    });
  }
})();
