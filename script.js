/*!
 * Everwind Servers Background Animation
 * Copyright (c) 2025 Viktor Vasko (Yamiru)
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

"use strict";

(() => {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;

  // If user prefers reduced motion, disable the effect early
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotionQuery.matches) {
    canvas.style.display = "none";
    return;
  }

  const ctx = canvas.getContext("2d", { alpha: true });
  const DPR = Math.min(1.3, window.devicePixelRatio || 1); // cap DPR for mobile

  let width = 0;
  let height = 0;
  let stars = [];
  let t = 0;
  let active = true;
  let maxStars = /Mobi|Android/i.test(navigator.userAgent) ? 70 : 110;

  function resize() {
    width = Math.floor(window.innerWidth * DPR);
    height = Math.floor(window.innerHeight * DPR);

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width / DPR + "px";
    canvas.style.height = height / DPR + "px";

    const base = Math.min(width, height) / 900;
    const count = Math.max(50, Math.floor(maxStars * base));

    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: (Math.random() * 1.2 + 0.5) * DPR,
      a: Math.random() * Math.PI * 2,
      v: Math.random() * 0.018 + 0.006,
      drift: Math.random() * 0.5 + 0.2
    }));
  }

  let last = 0;
  let fpsMA = 60;
  let skip = 0;

  function tick(now) {
    if (!active) return;

    const dt = now - last;
    last = now;

    const fps = dt > 0 ? 1000 / dt : 60;
    fpsMA = fpsMA * 0.9 + fps * 0.1;

    // Auto-degrade particle count on weak devices
    if (fpsMA < 55 && stars.length > 50) {
      stars.length = Math.floor(stars.length * 0.85);
    }

    // Frame skipping fallback
    if (fpsMA < 48 && ++skip % 2) {
      requestAnimationFrame(tick);
      return;
    }

    t += 0.003;

    ctx.clearRect(0, 0, width, height);

    const gx = (Math.sin(t) + 1) / 2;
    const gy = (Math.cos(t * 0.8) + 1) / 2;

    const gradient = ctx.createRadialGradient(
      width * (0.3 + 0.4 * gx),
      height * (0.2 + 0.2 * gy),
      0,
      width * 0.5,
      height * 0.6,
      Math.max(width, height) * 0.9
    );

    gradient.addColorStop(0, "rgba(56,225,219,.12)");
    gradient.addColorStop(0.4, "rgba(155,107,255,.10)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (const s of stars) {
      s.a += s.v;
      s.x += Math.cos(s.a) * s.drift * 0.2;
      s.y += Math.sin(s.a * 0.7) * s.drift * 0.1;

      if (s.x < 0) s.x += width;
      if (s.x > width) s.x -= width;
      if (s.y < 0) s.y += height;
      if (s.y > height) s.y -= height;

      const tw = (Math.sin(s.a * 1.3) + 1) / 2;
      const radius = s.r * (1 + tw * 0.4);

      ctx.beginPath();
      ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.1 + tw * 0.3})`;
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  document.addEventListener("visibilitychange", () => {
    active = !document.hidden;
    if (active) {
      last = performance.now();
      requestAnimationFrame(tick);
    }
  });

  window.addEventListener("blur", () => {
    active = false;
  });

  window.addEventListener("focus", () => {
    if (!active) {
      active = true;
      last = performance.now();
      requestAnimationFrame(tick);
    }
  });

  window.addEventListener("resize", resize, { passive: true });

  resize();
  last = performance.now();
  requestAnimationFrame(tick);
})();
