// Journie lasso — draws a freehand rainbow stroke, then on lift replaces it
// with the tightest bounding rectangle, flickers it, and shows the AI prompt.

export function initLasso(lassoCanvasEl, sparkleEmitter, onSubmit) {
  const ctx    = lassoCanvasEl.getContext('2d');
  const parent = lassoCanvasEl.parentElement;

  let isDrawing  = false;
  let lastX      = 0;
  let lastY      = 0;
  let rainbowHue = 0;
  let hasStroke  = false;
  let points     = [];   // all sampled points for bounding-box calc

  let flickerTimer = null;
  let flickerCount = 0;
  let bbox         = null; // { x, y, w, h } of the snapped rectangle

  // ── Resize ───────────────────────────────────────────────
  function resize() {
    const { width, height } = parent.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    lassoCanvasEl.width  = width;
    lassoCanvasEl.height = height;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(parent);
  requestAnimationFrame(resize);

  // ── Popup ────────────────────────────────────────────────
  const popup = document.createElement('div');
  popup.className = 'journie-popup';
  popup.innerHTML = `
    <div class="journie-popup-header">
      <span class="journie-popup-icon">✨</span>
      <span class="journie-popup-title">How can I help you?</span>
      <button class="journie-popup-close" title="Dismiss">✕</button>
    </div>
    <div class="journie-popup-body">
      <input class="journie-popup-input" type="text"
             placeholder="Ask anything about your selection…" autocomplete="off" />
      <button class="journie-popup-submit">Ask</button>
    </div>`;
  document.body.appendChild(popup);

  const closeBtn    = popup.querySelector('.journie-popup-close');
  const submitBtn   = popup.querySelector('.journie-popup-submit');
  const promptInput = popup.querySelector('.journie-popup-input');

  // ── Freehand segment (while drawing) ─────────────────────
  function drawSegment(x, y) {
    const hue1 = rainbowHue;
    rainbowHue = (rainbowHue + 3) % 360;

    const grad = ctx.createLinearGradient(lastX, lastY, x, y);
    grad.addColorStop(0, `hsl(${hue1}, 100%, 55%)`);
    grad.addColorStop(1, `hsl(${rainbowHue}, 100%, 55%)`);

    // Soft glow
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha  = 0.22;
    ctx.strokeStyle  = `hsl(${hue1}, 100%, 70%)`;
    ctx.lineWidth    = 10;
    ctx.lineCap      = 'round';
    ctx.lineJoin     = 'round';
    ctx.shadowBlur   = 8;
    ctx.shadowColor  = `hsl(${hue1}, 100%, 65%)`;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Crisp line
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 3;
    ctx.shadowBlur  = 0;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    sparkleEmitter.emit(x, y, rainbowHue);

    lastX = x;
    lastY = y;
  }

  // ── Bounding rect from collected points ──────────────────
  function computeBBox() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [px, py] of points) {
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
    return {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
    };
  }

  // ── Draw rainbow rectangle ────────────────────────────────
  // lightness: 55 = vivid (normal), 80 = washed-out (flicker frame)
  function drawRainbowRect(box, lightness = 55) {
    ctx.clearRect(0, 0, lassoCanvasEl.width, lassoCanvasEl.height);

    const { x, y, w, h } = box;
    const corners = [
      [x,     y    ],
      [x + w, y    ],
      [x + w, y + h],
      [x,     y + h],
      [x,     y    ],
    ];

    const perim = 2 * (w + h);
    let hue = rainbowHue;

    for (let i = 0; i < corners.length - 1; i++) {
      const [x1, y1] = corners[i];
      const [x2, y2] = corners[i + 1];
      const segLen   = Math.hypot(x2 - x1, y2 - y1);
      const hue2     = (hue + (segLen / perim) * 360) % 360;

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, `hsl(${hue},  100%, ${lightness}%)`);
      grad.addColorStop(1, `hsl(${hue2}, 100%, ${lightness}%)`);

      // Glow pass
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha  = lightness > 60 ? 0.12 : 0.25;
      ctx.strokeStyle  = `hsl(${hue}, 100%, ${lightness + 10}%)`;
      ctx.lineWidth    = 10;
      ctx.lineCap      = 'round';
      ctx.lineJoin     = 'round';
      ctx.shadowBlur   = 10;
      ctx.shadowColor  = `hsl(${hue}, 100%, ${lightness + 8}%)`;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Crisp pass
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 3;
      ctx.shadowBlur  = 0;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      if (i < 4) sparkleEmitter.emit(x1, y1, hue);
      hue = hue2;
    }
  }

  // ── Continuous sparkle emission along the rectangle perimeter ──
  function startGlisten(box) {
    clearInterval(flickerTimer);

    const { x, y, w, h } = box;
    const perim = 2 * (w + h);

    flickerTimer = setInterval(() => {
      // Pick 2-3 random positions along the perimeter each tick
      const count = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < count; i++) {
        const t  = Math.random() * perim;
        let px, py, dx, dy;

        if (t < w) {
          px = x + t;                    py = y;                      dx = 0;  dy = -1; // top → up
        } else if (t < w + h) {
          px = x + w;                    py = y + (t - w);            dx = 1;  dy = 0;  // right → right
        } else if (t < 2 * w + h) {
          px = x + w - (t - w - h);     py = y + h;                  dx = 0;  dy = 1;  // bottom → down
        } else {
          px = x;                        py = y + h - (t - 2*w - h); dx = -1; dy = 0;  // left → left
        }

        const hue = (rainbowHue + (t / perim) * 360) % 360;
        sparkleEmitter.emit(px, py, hue, false, dx, dy);
      }
    }, 120);
  }

  // ── Show popup + start glistening ────────────────────────
  function flickerThenShow(box) {
    clearInterval(flickerTimer);
    setTimeout(() => showPopup(box.x + box.w, box.y + box.h), 300);
    startGlisten(box);
  }

  // ── Popup position ───────────────────────────────────────
  function showPopup(canvasX, canvasY) {
    const rect  = lassoCanvasEl.getBoundingClientRect();
    const pageX = rect.left + canvasX + window.scrollX;
    const pageY = rect.top  + canvasY + window.scrollY;

    const PW = 280, PH = 100;
    let left = pageX + 10;
    let top  = pageY + 10;
    if (left + PW > window.innerWidth  - 16) left = pageX - PW - 10;
    if (top  + PH > window.innerHeight - 8)  top  = pageY - PH - 10;
    if (top < 8) top = 8;

    popup.style.left = `${left}px`;
    popup.style.top  = `${top}px`;
    popup.classList.add('visible');
    promptInput.value = '';
    promptInput.focus();
  }

  // ── Dismiss ──────────────────────────────────────────────
  function dismiss() {
    popup.classList.remove('visible');
    ctx.clearRect(0, 0, lassoCanvasEl.width, lassoCanvasEl.height);
    clearInterval(flickerTimer);
    hasStroke = false;
    bbox      = null;
    points    = [];
  }

  closeBtn.addEventListener('click', dismiss);

  submitBtn.addEventListener('click', () => {
    const query = promptInput.value.trim();
    if (!query) return;
    const currentBbox = bbox;
    dismiss();
    if (onSubmit) onSubmit(query, currentBbox);
  });

  promptInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  submitBtn.click();
    if (e.key === 'Escape') dismiss();
  });

  // Click outside → dismiss
  document.addEventListener('pointerdown', e => {
    if (!popup.classList.contains('visible')) return;
    if (!popup.contains(e.target)) dismiss();
  }, true);

  // ── Public API ───────────────────────────────────────────
  return {
    onPointerDown(e) {
      dismiss();
      isDrawing  = true;
      hasStroke  = false;
      rainbowHue = Math.random() * 360;
      points     = [];

      const rect = lassoCanvasEl.getBoundingClientRect();
      lastX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      lastY = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      points.push([lastX, lastY]);
    },

    onPointerMove(e) {
      if (!isDrawing) return;
      const rect = lassoCanvasEl.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      drawSegment(x, y);
      points.push([x, y]);
      hasStroke = true;
    },

    onPointerUp(e) {
      if (!isDrawing) return;
      isDrawing = false;
      if (!hasStroke || points.length < 2) return;

      bbox = computeBBox();
      drawRainbowRect(bbox);
      flickerThenShow(bbox);
    },

    dismiss,
    isActive() { return isDrawing; },
  };
}
