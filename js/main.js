/* ==========================================================================
   ROBOZIK — interactions
   ========================================================================== */
(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  let siteReady = false;

  /* ------------------------------------------------------------------
     Preloader
  ------------------------------------------------------------------ */
  const preloader = $("#preloader");
  const bootFill = $("#bootFill");
  const bootPct = $("#bootPct");
  const bootStatus = $("#bootStatus");

  function finishBoot() {
    if (siteReady) return;
    siteReady = true;

    if (preloader) {
      preloader.classList.add("is-done");
      setTimeout(() => { preloader.style.display = "none"; }, 800);
    }
    document.body.classList.remove("is-loading");
    // eslint-disable-next-line no-unused-expressions
    void document.body.offsetWidth;
    document.body.classList.add("is-ready");
    initSite();
  }

  function startBoot() {
    if (!preloader) { finishBoot(); return; }
    if (reduceMotion) { finishBoot(); return; }

    let pct = 0;
    const timer = setInterval(() => {
      pct = Math.min(100, pct + Math.random() * 15 + 5);
      if (bootFill) bootFill.style.width = pct + "%";
      if (bootPct) bootPct.textContent = Math.round(pct) + "%";
      if (bootStatus) {
        if (pct < 32) bootStatus.textContent = "Initializing neural core";
        else if (pct < 64) bootStatus.textContent = "Calibrating sensor array";
        else if (pct < 92) bootStatus.textContent = "Syncing vision stack";
        else bootStatus.textContent = "Bringing systems online";
      }
      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(finishBoot, 340);
      }
    }, 130);

    // Safety net: never trap the page behind the loader.
    setTimeout(finishBoot, 6000);
  }

  /* ------------------------------------------------------------------
     Reveal on scroll
  ------------------------------------------------------------------ */
  function initReveals() {
    const items = $$("[data-reveal]");
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    items.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------
     Animated counters
  ------------------------------------------------------------------ */
  function initCounters() {
    const counters = $$("[data-count]");
    if (!counters.length) return;

    function animate(el) {
      const target = parseFloat(el.dataset.count || "0");
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const duration = 1700;
      const start = performance.now();

      function frame(now) {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = target.toFixed(decimals);
      }
      requestAnimationFrame(frame);
    }

    if (!("IntersectionObserver" in window) || reduceMotion) {
      counters.forEach((el) => {
        el.textContent = parseFloat(el.dataset.count || "0").toFixed(parseInt(el.dataset.decimals || "0", 10));
      });
      return;
    }

    // Markup carries the final values for no-JS visitors; reset to zero
    // only when the count-up animation will actually run.
    counters.forEach((el) => {
      el.textContent = (0).toFixed(parseInt(el.dataset.decimals || "0", 10));
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    counters.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------
     Cursor-tracked spotlight on service cards
  ------------------------------------------------------------------ */
  function initSpotlights() {
    if (!finePointer || reduceMotion) return;
    $$(".spot").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });
  }

  /* ------------------------------------------------------------------
     3D tilt on robot cards
  ------------------------------------------------------------------ */
  function initTilt() {
    if (!finePointer || reduceMotion) return;
    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
        card.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg");
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--ry", "0deg");
        card.style.setProperty("--rx", "0deg");
      });
    });
  }

  /* ------------------------------------------------------------------
     Magnetic buttons (uses independent `translate` so hover transforms
     stay intact)
  ------------------------------------------------------------------ */
  function initMagnets() {
    if (!finePointer || reduceMotion) return;
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.28;
        el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      });
      el.addEventListener("pointerleave", () => { el.style.translate = ""; });
    });
  }

  /* ------------------------------------------------------------------
     Hero parallax
  ------------------------------------------------------------------ */
  function initParallax() {
    const stage = $("#botStage");
    if (!stage || !finePointer || reduceMotion) return;

    let queued = false;
    let mx = 0.5;
    let my = 0.5;

    window.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      mx = e.clientX / window.innerWidth;
      my = e.clientY / window.innerHeight;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        stage.style.transform = `translate3d(${(-(mx - 0.5) * 20).toFixed(1)}px, ${(-(my - 0.5) * 14).toFixed(1)}px, 0)`;
        queued = false;
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Particle network canvas
  ------------------------------------------------------------------ */
  function initNet() {
    const canvas = $("#net");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    let nodes = [];
    let raf = null;
    let running = true;
    const mouse = { x: -9999, y: -9999 };

    function build() {
      const rect = canvas.parentElement.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(Math.min(84, Math.max(24, (w * h) / 24000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.5 + 0.6
      }));

      if (reduceMotion) draw(true);
    }

    function draw(staticMode) {
      ctx.clearRect(0, 0, w, h);
      const linkDist = 132;

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];

        if (!staticMode) {
          a.x += a.vx;
          a.y += a.vy;

          const dx = a.x - mouse.x;
          const dy = a.y - mouse.y;
          const md = Math.hypot(dx, dy);
          if (md < 150 && md > 0.1) {
            a.x += (dx / md) * 0.45;
            a.y += (dy / md) * 0.45;
          }

          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
          a.x = Math.max(0, Math.min(w, a.x));
          a.y = Math.max(0, Math.min(h, a.y));
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < linkDist) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(70, 190, 255, ${((1 - dist / linkDist) * 0.16).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        if (!staticMode) {
          const mdist = Math.hypot(a.x - mouse.x, a.y - mouse.y);
          if (mdist < 190) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(34, 230, 255, ${((1 - mdist / 190) * 0.3).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34, 230, 255, 0.58)";
        ctx.fill();
      }

      if (!staticMode && running) raf = requestAnimationFrame(() => draw(false));
    }

    function start() {
      if (reduceMotion) return;
      if (!raf) raf = requestAnimationFrame(() => draw(false));
    }
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }

    window.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    }, { passive: true });

    window.addEventListener("pointerleave", () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { running = false; stop(); }
      else if (!reduceMotion) { running = true; start(); }
    });

    if ("ResizeObserver" in window) {
      new ResizeObserver(() => {
        stop();
        build();
        start();
      }).observe(canvas.parentElement);
    } else {
      window.addEventListener("resize", () => { stop(); build(); start(); });
    }

    build();
    draw(reduceMotion);
    start();
  }

  /* ------------------------------------------------------------------
     Nav, scroll progress, scrollspy
  ------------------------------------------------------------------ */
  function initScrollUI() {
    const nav = $("#nav");
    const bar = $("#scrollBar");
    const toTop = $("#toTop");

    function onScroll() {
      const y = window.scrollY || window.pageYOffset;
      if (nav) nav.classList.toggle("is-scrolled", y > 24);
      if (toTop) toTop.classList.toggle("is-visible", y > 680);
      if (bar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      });
    }

    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();
  }

  function initScrollSpy() {
    const links = $$(".nav__links a");
    if (!links.length || !("IntersectionObserver" in window)) return;

    const map = new Map();
    links.forEach((link) => {
      const id = link.getAttribute("href");
      const section = id && id.startsWith("#") ? $(id) : null;
      if (section) map.set(section, link);
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const link = map.get(entry.target);
        if (!link) return;
        links.forEach((l) => l.classList.toggle("is-active", l === link));
      });
    }, { rootMargin: "-46% 0px -48% 0px", threshold: 0 });

    map.forEach((_, section) => io.observe(section));
  }

  /* ------------------------------------------------------------------
     Mobile menu
  ------------------------------------------------------------------ */
  function initMenu() {
    const burger = $("#burger");
    const menu = $("#mobileMenu");
    if (!burger || !menu) return;

    function setOpen(open) {
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.setAttribute("aria-hidden", String(!open));
    }

    burger.addEventListener("click", () => {
      setOpen(!document.body.classList.contains("menu-open"));
    });

    $$("a", menu).forEach((a) => {
      a.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------
     Testimonials
  ------------------------------------------------------------------ */
  function initTestimonials() {
    const slider = $("#tSlider");
    if (!slider) return;
    const slides = $$(".t-slide", slider);
    const current = $("#tCurrent");
    const prev = $("[data-t-prev]");
    const next = $("[data-t-next]");
    if (!slides.length) return;

    let index = 0;
    let timer = null;

    function go(n) {
      index = (n + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
      if (current) current.textContent = String(index + 1).padStart(2, "0");
    }

    function startAuto() {
      stopAuto();
      if (reduceMotion) return;
      timer = setInterval(() => go(index + 1), 6500);
    }
    function stopAuto() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    if (prev) prev.addEventListener("click", () => { go(index - 1); startAuto(); });
    if (next) next.addEventListener("click", () => { go(index + 1); startAuto(); });

    slider.addEventListener("pointerenter", stopAuto);
    slider.addEventListener("pointerleave", startAuto);
    slider.addEventListener("focusin", stopAuto);
    slider.addEventListener("focusout", startAuto);

    go(0);
    startAuto();
  }

  /* ------------------------------------------------------------------
     Field reel modal
  ------------------------------------------------------------------ */
  const reelFrames = [
    { src: "thinkin_bot_14050821_125646837.jpg", caption: "Balance trial / bipedal stack" },
    { src: "thinkin_bot_14050821_125647254.jpg", caption: "Vision calibration / stereo pair" },
    { src: "thinkin_bot_14050821_125647757.jpg", caption: "Dexterous hand / 22 DOF" },
    { src: "thinkin_bot_14050821_125648261.jpg", caption: "Gait lab / 1.4 m/s" },
    { src: "thinkin_bot_14050821_125648948.jpg", caption: "Thermal soak / 8 h runtime" },
    { src: "thinkin_bot_14050821_125649292.jpg", caption: "Field test / loading dock" },
    { src: "thinkin_bot_14050821_125649881.jpg", caption: "Sensor bay / 360° lidar" },
    { src: "thinkin_bot_14050821_125650256.jpg", caption: "Actuator service / bay 03" },
    { src: "thinkin_bot_14050821_125650760.jpg", caption: "Night shift / autonomous patrol" }
  ];

  function initReel() {
    const modal = $("#reelModal");
    const stage = $("#reelStage");
    const dotsWrap = $("#reelDots");
    const count = $("#reelCount");
    const timerEl = $("#reelTimer");
    if (!modal || !stage) return;

    const frameEls = [];
    const dotEls = [];

    reelFrames.forEach((frame, i) => {
      const fig = document.createElement("figure");
      fig.className = "reel__frame" + (i === 0 ? " is-active" : "");

      const img = document.createElement("img");
      img.src = frame.src;
      img.alt = "ROBOZIK field reel, frame " + (i + 1) + " — " + frame.caption;
      img.loading = "lazy";
      img.draggable = false;

      const cap = document.createElement("figcaption");
      cap.textContent = String(i + 1).padStart(2, "0") + " — " + frame.caption;

      fig.append(img, cap);
      stage.appendChild(fig);
      frameEls.push(fig);

      if (dotsWrap) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "Go to frame " + (i + 1));
        if (i === 0) dot.classList.add("is-active");
        dot.addEventListener("click", () => { show(i); restart(); });
        dotsWrap.appendChild(dot);
        dotEls.push(dot);
      }
    });

    let index = 0;
    let auto = null;
    let clock = null;
    let seconds = 0;

    function show(n) {
      index = (n + frameEls.length) % frameEls.length;
      frameEls.forEach((el, i) => el.classList.toggle("is-active", i === index));
      dotEls.forEach((el, i) => el.classList.toggle("is-active", i === index));
      if (count) count.textContent = String(index + 1).padStart(2, "0") + " / " + String(frameEls.length).padStart(2, "0");
    }

    function restart() {
      if (auto) clearInterval(auto);
      if (reduceMotion) return;
      auto = setInterval(() => show(index + 1), 3000);
    }

    function startClock() {
      seconds = 0;
      if (timerEl) timerEl.textContent = "00:00:00";
      if (clock) clearInterval(clock);
      clock = setInterval(() => {
        seconds++;
        const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");
        if (timerEl) timerEl.textContent = h + ":" + m + ":" + s;
      }, 1000);
    }

    function open() {
      if (typeof modal.showModal === "function") {
        if (!modal.open) modal.showModal();
      } else {
        modal.setAttribute("open", "");
      }
      document.body.classList.add("modal-open");
      show(index);
      startClock();
      restart();
    }

    function close() {
      if (auto) clearInterval(auto);
      if (clock) clearInterval(clock);
      auto = null;
      clock = null;
      if (typeof modal.close === "function" && modal.open) modal.close();
      else modal.removeAttribute("open");
      document.body.classList.remove("modal-open");
    }

    $$("[data-open-reel]").forEach((btn) => btn.addEventListener("click", open));
    $$("[data-close-reel]").forEach((btn) => btn.addEventListener("click", close));

    const prevBtn = $("[data-reel-prev]");
    const nextBtn = $("[data-reel-next]");
    if (prevBtn) prevBtn.addEventListener("click", () => { show(index - 1); restart(); });
    if (nextBtn) nextBtn.addEventListener("click", () => { show(index + 1); restart(); });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
    modal.addEventListener("cancel", (e) => {
      e.preventDefault();
      close();
    });
    modal.addEventListener("close", () => {
      if (auto) clearInterval(auto);
      if (clock) clearInterval(clock);
      auto = null;
      clock = null;
      document.body.classList.remove("modal-open");
    });

    show(0);
  }

  /* ------------------------------------------------------------------
     Forms & toast
  ------------------------------------------------------------------ */
  function initForms() {
    const toast = $("#toast");
    const toastMsg = $("#toastMsg");
    let toastTimer = null;

    function showToast(message) {
      if (!toast) return;
      if (toastMsg) toastMsg.textContent = message;
      toast.classList.add("is-show");
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("is-show"), 4200);
    }

    const form = $("#contactForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }

        const btn = form.querySelector('button[type="submit"]');
        const original = btn ? btn.innerHTML : "";
        if (btn) { btn.disabled = true; btn.textContent = "Transmitting…"; }

        setTimeout(() => {
          form.reset();
          showToast("Transmission received. An engineer will reply within 2 working days.");
          if (btn) {
            btn.textContent = "Message sent ✓";
            setTimeout(() => {
              btn.innerHTML = original;
              btn.disabled = false;
            }, 2200);
          }
        }, 850);
      });
    }

    const news = $("#newsletterForm");
    if (news) {
      news.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!news.checkValidity()) { news.reportValidity(); return; }
        news.reset();
        showToast("You're on the list. First field notes arrive next month.");
      });
    }
  }

  /* ------------------------------------------------------------------
     Custom cursor
  ------------------------------------------------------------------ */
  function initCursor() {
    if (!finePointer || reduceMotion) return;
    const dot = $(".cursor__dot");
    const ring = $(".cursor__ring");
    if (!dot || !ring) return;

    document.documentElement.classList.add("has-cursor");

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;

    window.addEventListener("pointermove", (e) => {
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }, { passive: true });

    (function loop() {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      ring.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0)`;
      requestAnimationFrame(loop);
    })();

    const selector = "a, button, input, textarea, select, .svc, .robot-card";
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest && e.target.closest(selector)) document.body.classList.add("cursor-hover");
    });
    document.addEventListener("pointerout", (e) => {
      const to = e.relatedTarget;
      if (to && to.closest && to.closest(selector)) return;
      document.body.classList.remove("cursor-hover");
    });
    document.addEventListener("mouseleave", () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    });
    document.addEventListener("mouseenter", () => {
      dot.style.opacity = "";
      ring.style.opacity = "";
    });
  }

  /* ------------------------------------------------------------------
     Boot everything after the loader
  ------------------------------------------------------------------ */
  function initSite() {
    initReveals();
    initCounters();
    initSpotlights();
    initTilt();
    initMagnets();
    initParallax();
    initNet();
    initScrollUI();
    initScrollSpy();
    initMenu();
    initTestimonials();
    initReel();
    initForms();
    initCursor();
  }

  startBoot();
})();
