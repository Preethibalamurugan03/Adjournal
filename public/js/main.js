import { TOOLS, COLORS, DEFAULT_TOOL, DEFAULT_COLOR } from './tools.js';
import { initToolbar }      from './toolbar.js';
import { initSidebar }      from './sidebar.js';
import { loadSettings, saveSettings } from './settings.js';
import { initNavigator }    from './navigator.js';
import { initJourniePanel } from './journie-panel.js';
import { initTour }         from './tour.js';
import {
  initPages, addPage,
  setActiveTool, setActiveColor,
  disableDrawing, undoActive, redoActive,
  onPageCountChange,
} from './pages.js';

// ── Pages ─────────────────────────────────────────────────────
initPages();

// Update page indicator when pages are added
onPageCountChange(count => {
  document.getElementById('pageIndicator').textContent =
    `Page ${count}`;
});

// ── Toolbar ───────────────────────────────────────────────────
const toolbar = initToolbar(
  document.getElementById('toolbarContainer'),
  TOOLS,
  COLORS,
  (toolKey) => {
    if (toolKey === null) {
      disableDrawing();
    } else {
      setActiveTool(TOOLS[toolKey]);
    }
  },
  (hex) => setActiveColor(hex),
  () => undoActive(),
  () => redoActive(),
);

toolbar.setActiveColor(DEFAULT_COLOR);
setActiveColor(DEFAULT_COLOR);

// ── Navigator (left panel) ────────────────────────────────────
const navigator = initNavigator();

// ── Journie AI panel ──────────────────────────────────────────
initJourniePanel();

// ── Save helpers ──────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

function commitSave() {
  saveSettings();
  navigator.saveSnapshot();
  showToast('Saved ✓');
}

// ── Title modal ───────────────────────────────────────────────
const titleModalOverlay = document.getElementById('titleModalOverlay');
const titleModalInput   = document.getElementById('titleModalInput');
const titleModalSave    = document.getElementById('titleModalSave');
const titleModalCancel  = document.getElementById('titleModalCancel');

function openTitleModal(onConfirm) {
  titleModalInput.value = '';
  titleModalOverlay.classList.add('open');
  setTimeout(() => titleModalInput.focus(), 80);

  function confirm() {
    const val = titleModalInput.value.trim();
    if (!val) { titleModalInput.focus(); return; }
    closeTitleModal();
    onConfirm(val);
  }

  function closeTitleModal() {
    titleModalOverlay.classList.remove('open');
    titleModalSave.onclick   = null;
    titleModalCancel.onclick = null;
    titleModalInput.onkeydown = null;
  }

  titleModalSave.onclick    = confirm;
  titleModalCancel.onclick  = closeTitleModal;
  titleModalInput.onkeydown = e => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') closeTitleModal(); };
  titleModalOverlay.onclick = e => { if (e.target === titleModalOverlay) closeTitleModal(); };
}

// ── Bottom bar actions ────────────────────────────────────────
document.getElementById('saveBtn')?.addEventListener('click', () => {
  const firstTitle = document.querySelector('.title-input');
  if (!firstTitle?.value?.trim()) {
    openTitleModal(title => {
      firstTitle.value = title;
      commitSave();
    });
  } else {
    commitSave();
  }
});

// Add page manually
document.getElementById('addPageBtn')?.addEventListener('click', () => {
  addPage();
});

// ── Keyboard shortcuts ────────────────────────────────────────
document.addEventListener('keydown', e => {
  const mod = e.metaKey || e.ctrlKey;
  if (e.key === 'Escape') { toolbar.setActiveTool(null); disableDrawing(); }
  if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undoActive(); }
  if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redoActive(); }
});

// ── Settings sidebar ──────────────────────────────────────────
initSidebar();
loadSettings();

// ── First-time tour ───────────────────────────────────────────
setTimeout(initTour, 400);
