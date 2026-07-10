import { initPalette } from './palette.js';

const UNDO_ICON = `<svg viewBox="0 0 24 24" fill="none">
  <path d="M4 8h10a6 6 0 0 1 0 12H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4 8l4-4M4 8l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const REDO_ICON = `<svg viewBox="0 0 24 24" fill="none">
  <path d="M20 8H10a6 6 0 0 0 0 12h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 8l-4-4M20 8l-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const CURSOR_ICON = `<svg viewBox="0 0 24 24" fill="none">
  <path d="M5 3l14 9-7 2-3 7L5 3z" fill="currentColor"/>
</svg>`;

export function initToolbar(containerEl, tools, colors, onToolSelect, onColorSelect, onUndo, onRedo) {
  let activeKey = null;

  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';

  const buttons = {};

  function makeBtn(icon, title, onClick, extraClass = '') {
    const btn = document.createElement('button');
    btn.className = `tool-btn${extraClass ? ' ' + extraClass : ''}`;
    btn.title = title;
    btn.innerHTML = icon;
    btn.addEventListener('click', onClick);
    return btn;
  }

  // ── Undo / Redo ──────────────────────────────────────────
  toolbar.appendChild(makeBtn(UNDO_ICON, 'Undo (⌘Z)', onUndo, 'tool-btn--action'));
  toolbar.appendChild(makeBtn(REDO_ICON, 'Redo (⌘⇧Z)', onRedo, 'tool-btn--action'));

  const divA = document.createElement('div');
  divA.className = 'toolbar-divider';
  toolbar.appendChild(divA);

  // ── Cursor / type mode ───────────────────────────────────
  const toolsWrap = document.createElement('div');
  toolsWrap.className = 'toolbar-tools';

  const textBtn = makeBtn(CURSOR_ICON, 'Select / Type (Esc)', () => {
    setActiveTool(null);
    onToolSelect(null);
  }, 'tool-btn--text active');
  textBtn.dataset.tool = 'text';
  buttons['text'] = textBtn;
  toolsWrap.appendChild(textBtn);

  // ── Drawing tools (all except journie) ──────────────────
  Object.values(tools).forEach(tool => {
    if (tool.key === 'journie') return;
    const btn = makeBtn(tool.icon, tool.label, () => {
      if (activeKey === tool.key) { setActiveTool(null); onToolSelect(null); }
      else { setActiveTool(tool.key); onToolSelect(tool.key); }
    });
    btn.dataset.tool = tool.key;
    buttons[tool.key] = btn;
    toolsWrap.appendChild(btn);
  });

  toolbar.appendChild(toolsWrap);

  // ── Divider ──────────────────────────────────────────────
  const divB = document.createElement('div');
  divB.className = 'toolbar-divider';
  toolbar.appendChild(divB);

  // ── Colour palette ───────────────────────────────────────
  const paletteSlot = document.createElement('div');
  paletteSlot.className = 'palette-slot';
  toolbar.appendChild(paletteSlot);

  const palette = initPalette(paletteSlot, colors, hex => {
    onColorSelect(hex);
    if (activeKey === null) {
      const first = Object.keys(tools)[0];
      setActiveTool(first);
      onToolSelect(first);
    }
  });

  // ── Divider ──────────────────────────────────────────────
  const divC = document.createElement('div');
  divC.className = 'toolbar-divider';
  toolbar.appendChild(divC);

  // ── Journie lasso (magic pen) ────────────────────────────
  const journieTool = tools['journie'];
  if (journieTool) {
    const journieBtn = makeBtn(journieTool.icon, 'Journie — magic lasso', () => {
      if (activeKey === 'journie') { setActiveTool(null); onToolSelect(null); }
      else { setActiveTool('journie'); onToolSelect('journie'); }
    }, 'tool-btn journie-btn');
    journieBtn.dataset.tool = 'journie';
    buttons['journie'] = journieBtn;
    toolbar.appendChild(journieBtn);
  }

  // ── Divider ──────────────────────────────────────────────
  const divD = document.createElement('div');
  divD.className = 'toolbar-divider';
  toolbar.appendChild(divD);

  // ── Journie AI button ────────────────────────────────────
  const journieAIBtn = document.createElement('button');
  journieAIBtn.className = 'tool-btn journie-ai-btn';
  journieAIBtn.id = 'journiePanelToggle';
  journieAIBtn.title = 'Nova — AI writing assistant';
  journieAIBtn.innerHTML = `<span class="journie-ai-label">Nova</span>`;
  toolbar.appendChild(journieAIBtn);

  containerEl.appendChild(toolbar);

  // ── Public API ───────────────────────────────────────────
  function setActiveTool(key) {
    if (activeKey) buttons[activeKey]?.classList.remove('active');
    activeKey = key;
    if (activeKey) buttons[activeKey]?.classList.add('active');
    textBtn.classList.toggle('active', key === null);
  }

  return { setActiveTool, setActiveColor: palette.setActiveColor };
}
