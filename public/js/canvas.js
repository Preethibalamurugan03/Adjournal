import { initSparkles } from './sparkles.js';
import { initLasso }    from './lasso.js';

export function initCanvas(canvasEl, lassoCanvasEl, sparkleCanvasEl, onLassoSubmit) {
  const ctx    = canvasEl.getContext('2d');
  const parent = canvasEl.parentElement;

  let activeTool  = null;
  let activeColor = '#2c2c2c';
  let isDrawing   = false;
  let lastX       = 0;
  let lastY       = 0;
  let lastTime    = 0;
  let lastWidth   = 2;

  // Sparkle + lasso systems
  const sparkles = initSparkles(sparkleCanvasEl);
  const lasso    = initLasso(lassoCanvasEl, sparkles, onLassoSubmit);

  // ── Resize ──────────────────────────────────────────────
  function resize() {
    const { width, height } = parent.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    const snapshot = canvasEl.toDataURL();
    canvasEl.width  = width;
    canvasEl.height = height;
    const img = new Image();
    img.src = snapshot;
    img.onload = () => ctx.drawImage(img, 0, 0);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(parent);
  requestAnimationFrame(resize);

  // ── Coordinate helper ────────────────────────────────────
  function getPos(e) {
    const rect    = canvasEl.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return [clientX - rect.left, clientY - rect.top];
  }

  // ── Speed → width (brush) ────────────────────────────────
  function lerp(a, b, t) { return a + (b - a) * Math.min(Math.max(t, 0), 1); }

  function speedWidth(tool, x, y, now) {
    const dx    = x - lastX;
    const dy    = y - lastY;
    const dist  = Math.sqrt(dx * dx + dy * dy);
    const dt    = Math.max(now - lastTime, 1);
    const speed = dist / dt;
    const t     = Math.min(speed / 1.5, 1);
    const target = lerp(tool.maxWidth, tool.minWidth, t);
    lastWidth = lerp(lastWidth, target, 0.35);
    return lastWidth;
  }

  // ── Normal segment ───────────────────────────────────────
  function drawSegment(x, y) {
    if (!activeTool) return;
    const tool = activeTool;
    const now  = performance.now();

    let width = tool.lineWidth;
    let alpha = tool.globalAlpha;

    if (tool.speedVariant) width = speedWidth(tool, x, y, now);
    if (tool.jitter) {
      const wRange = tool.maxWidth - tool.minWidth;
      width = tool.minWidth + Math.random() * wRange;
      alpha = tool.globalAlpha + (Math.random() - 0.5) * 0.15;
    }

    ctx.globalCompositeOperation = tool.compositeOp;
    ctx.globalAlpha  = alpha;
    ctx.strokeStyle  = activeColor;
    ctx.lineWidth    = width;
    ctx.lineCap      = tool.lineCap;
    ctx.lineJoin     = tool.lineJoin;
    ctx.shadowBlur   = 0;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX    = x;
    lastY    = y;
    lastTime = now;
  }

  // ── Undo / Redo stacks ───────────────────────────────────
  const undoStack = [];
  const redoStack = [];
  const MAX_UNDO  = 20;

  function pushUndo() {
    undoStack.push(canvasEl.toDataURL());
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack.length = 0;
  }

  function applyDataURL(dataURL) {
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataURL;
  }

  // ── Text box — DOM overlay, never touches canvas ─────────
  function createTextBox(e) {
    const [x, y] = getPos(e);

    const box = document.createElement('div');
    box.className = 'jr-overlay jr-textbox-overlay';
    box.style.left   = `${x}px`;
    box.style.top    = `${y}px`;
    box.style.width  = '160px';
    box.style.minHeight = '32px';
    box.classList.add('jr-focused');

    const ta = document.createElement('textarea');
    ta.className = 'jr-textbox-area';
    ta.style.color = activeColor;
    ta.placeholder = 'Type here…';
    box.appendChild(ta);

    // Delete button above top-middle
    const del = document.createElement('button');
    del.className   = 'jr-delete';
    del.title       = 'Remove';
    del.textContent = '✕';
    del.addEventListener('click', ev => { ev.stopPropagation(); box.remove(); });
    box.appendChild(del);

    // Resize handles (reuse same pattern as image overlays)
    const HANDLES = [
      { cursor: 'nw-resize', top: 0,   left: 0,   dx: -1, dy: -1 },
      { cursor: 'n-resize',  top: 0,   left: 0.5, dx:  0, dy: -1 },
      { cursor: 'ne-resize', top: 0,   left: 1,   dx:  1, dy: -1 },
      { cursor: 'e-resize',  top: 0.5, left: 1,   dx:  1, dy:  0 },
      { cursor: 'se-resize', top: 1,   left: 1,   dx:  1, dy:  1 },
      { cursor: 's-resize',  top: 1,   left: 0.5, dx:  0, dy:  1 },
      { cursor: 'sw-resize', top: 1,   left: 0,   dx: -1, dy:  1 },
      { cursor: 'w-resize',  top: 0.5, left: 0,   dx: -1, dy:  0 },
    ];
    HANDLES.forEach(h => {
      const hEl = document.createElement('div');
      hEl.className    = 'jr-handle';
      hEl.style.cursor = h.cursor;
      hEl.style.left   = `calc(${h.left * 100}% - 5px)`;
      hEl.style.top    = `calc(${h.top  * 100}% - 5px)`;
      hEl.addEventListener('mousedown', ev => {
        ev.stopPropagation(); ev.preventDefault();
        const sx = ev.clientX, sy = ev.clientY;
        const sl = box.offsetLeft, st = box.offsetTop;
        const sw = box.offsetWidth, sh = box.offsetHeight;
        function onMove(mv) {
          const ddx = mv.clientX - sx, ddy = mv.clientY - sy;
          let L = sl, T = st, W = sw, H = sh;
          if (h.dx ===  1) W = Math.max(80, sw + ddx);
          if (h.dx === -1) { W = Math.max(80, sw - ddx); L = sl + (sw - W); }
          if (h.dy ===  1) H = Math.max(32, sh + ddy);
          if (h.dy === -1) { H = Math.max(32, sh - ddy); T = st + (sh - H); }
          box.style.left = `${L}px`; box.style.top = `${T}px`;
          box.style.width = `${W}px`; box.style.height = `${H}px`;
        }
        function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
      box.appendChild(hEl);
    });

    // Drag to move via the box border area
    box.addEventListener('mousedown', ev => {
      if (ev.target !== box) return;
      ev.stopPropagation();
      box.classList.add('jr-focused');
      const sx = ev.clientX, sy = ev.clientY;
      const sl = box.offsetLeft, st = box.offsetTop;
      function onMove(mv) {
        box.style.left = `${sl + mv.clientX - sx}px`;
        box.style.top  = `${st + mv.clientY - sy}px`;
      }
      function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    ta.addEventListener('focus', () => box.classList.add('jr-focused'));
    document.addEventListener('mousedown', function onOut(ev) {
      if (!box.contains(ev.target)) box.classList.remove('jr-focused');
    });
    document.addEventListener('keydown', function onKey(ev) {
      if ((ev.key === 'Delete' || ev.key === 'Backspace') && box.classList.contains('jr-focused') && document.activeElement !== ta) {
        ev.preventDefault(); box.remove(); document.removeEventListener('keydown', onKey);
      }
    });

    parent.appendChild(box);
    ta.focus();
  }

  // ── Event handlers ───────────────────────────────────────
  function onDown(e) {
    if (activeTool?.rainbow)  { lasso.onPointerDown(e); return; }
    if (activeTool?.textbox)  { createTextBox(e); return; }
    e.preventDefault();
    pushUndo();
    isDrawing = true;
    [lastX, lastY] = getPos(e);
    lastTime  = performance.now();
    lastWidth = activeTool ? activeTool.lineWidth : 2;

    ctx.globalCompositeOperation = activeTool?.compositeOp ?? 'source-over';
    ctx.globalAlpha  = activeTool?.globalAlpha ?? 1;
    ctx.fillStyle    = activeColor;
    ctx.shadowBlur   = 0;
    ctx.beginPath();
    ctx.arc(lastX, lastY, (activeTool?.lineWidth ?? 2) / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function onMove(e) {
    if (activeTool?.rainbow) { lasso.onPointerMove(e); return; }
    if (!isDrawing) return;
    e.preventDefault();
    const [x, y] = getPos(e);
    drawSegment(x, y);
  }

  function onUp(e) {
    if (activeTool?.rainbow) { lasso.onPointerUp(e); return; }
    isDrawing = false;
  }

  canvasEl.addEventListener('mousedown',  onDown);
  canvasEl.addEventListener('mousemove',  onMove);
  canvasEl.addEventListener('mouseup',    onUp);
  canvasEl.addEventListener('mouseleave', e => { if (!activeTool?.rainbow) isDrawing = false; });
  canvasEl.addEventListener('touchstart', onDown, { passive: false });
  canvasEl.addEventListener('touchmove',  onMove, { passive: false });
  canvasEl.addEventListener('touchend',   onUp);

  // ── Public API ───────────────────────────────────────────
  return {
    setTool(toolDescriptor) {
      if (activeTool?.rainbow && !toolDescriptor?.rainbow) lasso.dismiss();
      activeTool = toolDescriptor;
    },
    setColor(hex) { activeColor = hex; },
    clear() {
      pushUndo();
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    },
    undo() {
      if (!undoStack.length) return;
      redoStack.push(canvasEl.toDataURL());
      applyDataURL(undoStack.pop());
    },
    redo() {
      if (!redoStack.length) return;
      undoStack.push(canvasEl.toDataURL());
      applyDataURL(redoStack.pop());
    },
    getContext() { return ctx; },
    enableDrawing() {
      canvasEl.style.pointerEvents = 'all';
      canvasEl.style.cursor = 'crosshair';
      canvasEl.parentElement.querySelector('textarea')?.classList.add('no-pointer');
    },
    disableDrawing() {
      canvasEl.style.pointerEvents = 'none';
      canvasEl.style.cursor        = '';
      isDrawing = false;
      canvasEl.parentElement.querySelector('textarea')?.classList.remove('no-pointer');
    },
    getDataURL() { return canvasEl.toDataURL(); },
  };
}
