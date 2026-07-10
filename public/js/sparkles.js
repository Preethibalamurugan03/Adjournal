// Animated sparkle layer — sits above the draw canvas, never persists to saved strokes.

export function initSparkles(canvasEl) {
  const ctx    = canvasEl.getContext('2d');
  const parent = canvasEl.parentElement;
  let particles = [];
  let rafId     = null;

  // ── Resize (mirrors draw canvas sizing) ─────────────────
  function resize() {
    const { width, height } = parent.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    canvasEl.width  = width;
    canvasEl.height = height;
  }

  const ro = new ResizeObserver(resize);
  ro.observe(parent);
  requestAnimationFrame(resize);

  // ── 4-pointed star path ──────────────────────────────────
  function drawStar(x, y, r, alpha, hue) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);

    // Outer glow
    ctx.shadowBlur  = r * 3;
    ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;

    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle  = (i * Math.PI) / 4;
      const radius = i % 2 === 0 ? r : r * 0.35;
      const px     = Math.cos(angle - Math.PI / 2) * radius;
      const py     = Math.sin(angle - Math.PI / 2) * radius;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = `hsl(${hue}, 100%, 78%)`;
    ctx.fill();
    ctx.restore();
  }

  // ── Animation loop ───────────────────────────────────────
  function tick() {
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    particles = particles.filter(p => p.life > 0);

    for (const p of particles) {
      p.life -= p.decay;
      p.x    += p.vx;
      p.y    += p.vy;
      p.r    *= 0.97;
      p.hue  = (p.hue + 2) % 360;
      drawStar(p.x, p.y, p.r, Math.max(0, p.life), p.hue);
    }

    rafId = requestAnimationFrame(tick);
  }

  // Start the loop immediately
  rafId = requestAnimationFrame(tick);

  // ── Public API ───────────────────────────────────────────
  return {
    // Emit sparkles at a point.
    // gated: if true (default), fires ~28% of the time (for stroke use).
    //        if false, always fires (for glisten loop use).
    // dx, dy: primary outward direction (-1, 0, or 1 each axis)
    // dx, dy: outward direction. e.g. top edge = (0,-1), right = (1,0), etc.
    emit(x, y, hue, gated = true, dx = 0, dy = -1) {
      if (gated && Math.random() > 0.28) return;
      const count = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < count; i++) {
        const speed = Math.random() * 0.9 + 0.3;
        const drift = (Math.random() - 0.5) * 0.5;
        particles.push({
          x,    y,
          r:    Math.random() * 4 + 2.5,
          hue:  (hue + Math.random() * 60 - 30 + 360) % 360,
          vx:   dx * speed + (dy !== 0 ? drift : 0),
          vy:   dy * speed + (dx !== 0 ? drift : 0),
          life: 0.9 + Math.random() * 0.1,
          decay: 0.018 + Math.random() * 0.012,
        });
      }
    },
    destroy() {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    },
  };
}
