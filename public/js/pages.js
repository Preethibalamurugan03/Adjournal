import { initCanvas }          from './canvas.js';
import { placeResponse, matchQuery } from './response.js';
import { getState } from './settings.js';

let pageCount    = 0;
let activeDrawing = null;
let sharedTool   = null;
let sharedColor  = '#2c2c2c';
let onPageChange = null;   // callback(count)

const container = document.getElementById('pagesContainer');

// ── Format today's date ─────────────────────────────────────────
function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Build one page DOM node ─────────────────────────────────────
function buildPageDOM(n) {
  const sheet = document.createElement('div');
  sheet.className = 'page-sheet';
  sheet.dataset.page = n;

  sheet.innerHTML = `
    <header class="page-header">
      <span class="date-label">${formatDate()}</span>
      <textarea class="title-input" placeholder="Title…" aria-label="Page title" rows="1"></textarea>
    </header>
    <div class="page-body">
      <div class="red-margin"></div>
      <div class="page-content">
        <textarea class="entry-area" placeholder="Write something…" aria-label="Journal entry"></textarea>
        <canvas class="draw-canvas"    aria-hidden="true"></canvas>
        <canvas class="lasso-canvas"   aria-hidden="true"></canvas>
        <canvas class="sparkle-canvas" aria-hidden="true"></canvas>
      </div>
    </div>
    <footer class="page-footer">
      <span class="page-number-label">Page ${n}</span>
      <span class="word-count">0 words</span>
    </footer>
  `;

  const titleInput = sheet.querySelector('.title-input');
  titleInput.addEventListener('input', () => {
    titleInput.style.height = 'auto';
    titleInput.style.height = titleInput.scrollHeight + 'px';
  });

  return sheet;
}

// ── Make a page the active drawing target ───────────────────────
function activatePage(sheet) {
  const drawCv    = sheet.querySelector('.draw-canvas');
  const lassoCv   = sheet.querySelector('.lasso-canvas');
  const sparkleCv = sheet.querySelector('.sparkle-canvas');
  const content   = sheet.querySelector('.page-content');

  const drawing = initCanvas(drawCv, lassoCv, sparkleCv, (query, bbox) => {
    const type = matchQuery(query);
    if (type) placeResponse(drawing.getContext(), content, bbox, type);
  });

  if (sharedTool)  { drawing.setTool(sharedTool); drawing.enableDrawing(); }
  if (sharedColor) drawing.setColor(sharedColor);

  activeDrawing = drawing;
  sheet._drawing = drawing;
}

// ── Word count + placeholder removal ───────────────────────────
function wireWordCount(sheet) {
  const ta      = sheet.querySelector('.entry-area');
  const content = sheet.querySelector('.page-content');
  const span    = sheet.querySelector('.word-count');

  function update() {
    const words = ta.value.trim().split(/\s+/).filter(Boolean).length;
    span.textContent = `${words} word${words !== 1 ? 's' : ''}`;
  }

  // Remove placeholder on any first interaction with the page
  function clearPlaceholder() {
    ta.removeAttribute('placeholder');
    content.removeEventListener('pointerdown', clearPlaceholder);
  }
  content.addEventListener('pointerdown', clearPlaceholder);

  ta.addEventListener('input', () => {
    update();
    checkOverflow(sheet, ta);
  });
}

// ── Overflow detection → add new page ──────────────────────────
function checkOverflow(sheet, ta) {
  if (ta.scrollHeight > ta.clientHeight + 5) {
    ta.style.height = ta.scrollHeight + 'px';  // grow this page
    // If this is the last page, add a new one
    if (sheet === container.lastElementChild) {
      addPage();
    }
  }
}

// ── Click-to-focus: route tool events to clicked page's canvas ──
function wireFocus(sheet) {
  sheet.addEventListener('pointerdown', () => {
    if (sheet._drawing && sheet._drawing !== activeDrawing) {
      activeDrawing = sheet._drawing;
      // re-apply shared state
      if (sharedTool)  { activeDrawing.setTool(sharedTool); activeDrawing.enableDrawing(); }
      if (sharedColor)   activeDrawing.setColor(sharedColor);
    }
  }, { capture: true });
}

// ── Public: add a page ──────────────────────────────────────────
export function addPage() {
  pageCount++;
  const sheet = buildPageDOM(pageCount);
  container.appendChild(sheet);

  // Inherit current settings state
  const s = getState();
  const margin = sheet.querySelector('.red-margin');
  if (margin) margin.style.display = s.margin ? 'block' : 'none';
  const content = sheet.querySelector('.page-content');
  if (content && s.bgImage && s.bgImage !== 'none') {
    content.style.backgroundImage  = `url('${s.bgImage}')`;
    content.style.backgroundSize   = 'cover';
    content.style.backgroundRepeat = 'no-repeat';
  }

  activatePage(sheet);
  wireWordCount(sheet);
  wireFocus(sheet);

  if (onPageChange) onPageChange(pageCount);

  // Scroll new page into view (slight delay so layout settles)
  if (pageCount > 1) {
    setTimeout(() => sheet.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  return sheet;
}

// ── Public: set active tool (called by toolbar) ─────────────────
export function setActiveTool(toolDescriptor) {
  sharedTool = toolDescriptor;
  if (activeDrawing) {
    if (toolDescriptor === null) {
      activeDrawing.disableDrawing();
    } else {
      activeDrawing.setTool(toolDescriptor);
      activeDrawing.enableDrawing();
    }
  }
}

// ── Public: set active color (called by toolbar) ────────────────
export function setActiveColor(hex) {
  sharedColor = hex;
  if (activeDrawing) activeDrawing.setColor(hex);
}

// ── Public: disable drawing on active page ──────────────────────
export function disableDrawing() {
  sharedTool = null;
  if (activeDrawing) activeDrawing.disableDrawing();
}

// ── Public: undo / redo on active page ─────────────────────────
export function undoActive() { if (activeDrawing) activeDrawing.undo(); }
export function redoActive() { if (activeDrawing) activeDrawing.redo(); }

// ── Public: new blank journal ───────────────────────────────────
export function newJournal() {
  container.innerHTML = '';
  pageCount    = 0;
  activeDrawing = null;
  addPage();
  container.scrollTop = 0;
}

// ── Public: set page-change callback ───────────────────────────
export function onPageCountChange(cb) { onPageChange = cb; }

// ── Scroll-based page creation ──────────────────────────────────
function lastPageHasContent() {
  const last = container.lastElementChild;
  if (!last) return false;
  const ta = last.querySelector('.entry-area');
  return ta && ta.value.trim().length > 0;
}

function onContainerScroll() {
  const { scrollTop, scrollHeight, clientHeight } = container;
  const nearBottom = scrollTop + clientHeight >= scrollHeight - 120;
  if (nearBottom && lastPageHasContent()) {
    addPage();
  }
}

// ── Public: restore pages from a saved journal ──────────────────
export function restorePages(pagesData) {
  // Clear existing pages
  container.innerHTML = '';
  pageCount    = 0;
  activeDrawing = null;

  pagesData.forEach(data => {
    const sheet = addPage();

    if (data.title) {
      const titleEl = sheet.querySelector('.title-input');
      if (titleEl) {
        titleEl.value = data.title;
        requestAnimationFrame(() => {
          titleEl.style.height = 'auto';
          titleEl.style.height = titleEl.scrollHeight + 'px';
        });
      }
    }

    if (data.text) {
      const ta = sheet.querySelector('.entry-area');
      if (ta) {
        ta.value = data.text;
        ta.removeAttribute('placeholder');
        // Update word count
        const words = data.text.trim().split(/\s+/).filter(Boolean).length;
        const wc = sheet.querySelector('.word-count');
        if (wc) wc.textContent = `${words} word${words !== 1 ? 's' : ''}`;
      }
    }

    if (data.canvas) {
      const drawCv = sheet.querySelector('.draw-canvas');
      if (drawCv) {
        const img = new Image();
        img.onload = () => {
          drawCv.width  = drawCv.offsetWidth  || 680;
          drawCv.height = drawCv.offsetHeight || 780;
          drawCv.getContext('2d').drawImage(img, 0, 0, drawCv.width, drawCv.height);
        };
        img.src = data.canvas;
      }
    }
  });

  // Scroll back to top
  container.scrollTop = 0;
}

// ── Public: init with first page ───────────────────────────────
export function initPages() {
  addPage();
  container.addEventListener('scroll', onContainerScroll, { passive: true });
}
