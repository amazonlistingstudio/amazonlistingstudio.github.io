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

  /* flip a whole listing between its before and after versions */
  document.querySelectorAll(".phase").forEach(function (phase) {
    var buttons = phase.querySelectorAll(".toggle button");
    phase.querySelector(".toggle").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      phase.dataset.state = b.dataset.v;
      buttons.forEach(function (x) {
        x.setAttribute("aria-pressed", String(x === b));
      });
    });
  });

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
