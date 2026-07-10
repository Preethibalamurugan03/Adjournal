const MIN_W = 80;
const MIN_H = 60;

// ── Resize handles ────────────────────────────────────────────
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

function addHandles(overlayEl) {
  HANDLES.forEach(h => {
    const el = document.createElement('div');
    el.className    = 'jr-handle';
    el.style.cursor = h.cursor;
    el.style.left   = `calc(${h.left * 100}% - 5px)`;
    el.style.top    = `calc(${h.top  * 100}% - 5px)`;

    el.addEventListener('mousedown', e => {
      e.stopPropagation();
      e.preventDefault();

      const startX = e.clientX;
      const startY = e.clientY;
      const startL = overlayEl.offsetLeft;
      const startT = overlayEl.offsetTop;
      const startW = overlayEl.offsetWidth;
      const startH = overlayEl.offsetHeight;

      function onMove(ev) {
        const ddx = ev.clientX - startX;
        const ddy = ev.clientY - startY;
        let L = startL, T = startT, W = startW, H = startH;

        if (h.dx ===  1) W = Math.max(MIN_W, startW + ddx);
        if (h.dx === -1) { W = Math.max(MIN_W, startW - ddx); L = startL + (startW - W); }
        if (h.dy ===  1) H = Math.max(MIN_H, startH + ddy);
        if (h.dy === -1) { H = Math.max(MIN_H, startH - ddy); T = startT + (startH - H); }

        overlayEl.style.left   = `${L}px`;
        overlayEl.style.top    = `${T}px`;
        overlayEl.style.width  = `${W}px`;
        overlayEl.style.height = `${H}px`;
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    overlayEl.appendChild(el);
  });
}

// ── Place an image as a DOM element floating above the page ───
function placeDOMImage(pageContentEl, bbox, src) {
  const overlay = document.createElement('div');
  overlay.className = 'jr-overlay jr-image-overlay';
  overlay.style.left   = `${bbox.x}px`;
  overlay.style.top    = `${bbox.y}px`;
  overlay.style.width  = `${bbox.w}px`;
  overlay.style.height = `${bbox.h}px`;

  // The image fills the overlay completely
  const img = document.createElement('img');
  img.src = src;
  img.className = 'jr-image';
  overlay.appendChild(img);

  // Delete button — visible when focused
  const del = document.createElement('button');
  del.className   = 'jr-delete';
  del.title       = 'Remove';
  del.textContent = '✕';
  del.addEventListener('click', e => { e.stopPropagation(); overlay.remove(); });
  overlay.appendChild(del);

  addHandles(overlay);

  // Drag to move
  overlay.addEventListener('mousedown', e => {
    if (e.target !== overlay && e.target !== img) return;
    e.stopPropagation();
    overlay.classList.add('jr-focused');

    const startX = e.clientX;
    const startY = e.clientY;
    const startL = overlay.offsetLeft;
    const startT = overlay.offsetTop;

    function onMove(ev) {
      overlay.style.left = `${startL + ev.clientX - startX}px`;
      overlay.style.top  = `${startT + ev.clientY - startY}px`;
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  document.addEventListener('mousedown', function onOut(e) {
    if (!overlay.contains(e.target)) overlay.classList.remove('jr-focused');
  });

  document.addEventListener('keydown', function onKey(e) {
    if ((e.key === 'Delete' || e.key === 'Backspace') && overlay.classList.contains('jr-focused')) {
      e.preventDefault();
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    }
  });

  pageContentEl.appendChild(overlay);
}

// ── Public API ────────────────────────────────────────────────
export function placeResponse(ctx, pageContentEl, bbox, type) {
  if (type === 'math') {
    placeDOMImage(pageContentEl, bbox, 'public/images/math ans.jpeg');
    return;
  }
  if (type === 'image') {
    placeDOMImage(pageContentEl, bbox, 'public/images/kidney.jpeg');
    return;
  }
}

export function matchQuery(query) {
  const q = query.toLowerCase();
  if (q.includes('heart') || q.includes('kidney') || q.includes('diagram') || q.includes('picture')) return 'image';
  if (q.includes('solve') || q.includes('math')   || q.includes('equation') || q.includes('question')) return 'math';
  return null;
}
