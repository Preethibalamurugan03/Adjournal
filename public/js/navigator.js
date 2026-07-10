import { restorePages, newJournal, addPage } from './pages.js';
import { getState, setColor, setDarkMode, setSize, setSpacing, setTemplate, setMargin, setBgImage, saveSettings } from './settings.js';

const JOURNAL_KEY    = 'adjournal_journals';
const AUTOSAVE_KEY   = 'adjournal_autosave_counter';

let isDirty = false;

// Mark dirty on any text input or drawing within a page
document.addEventListener('input', e => {
  if (e.target.closest('.page-sheet')) isDirty = true;
});
document.addEventListener('pointerdown', e => {
  if (e.target.closest('.draw-canvas, .lasso-canvas')) isDirty = true;
});

// ── Reset appearance to defaults (blank page, no bg image) ─────
function applyDefaultAppearance() {
  setTemplate('blank');
  setBgImage('none');
  saveSettings();
  document.querySelectorAll('.template-card').forEach(b => b.classList.toggle('active', b.dataset.template === 'blank'));
  document.querySelectorAll('.bg-template-card').forEach(b => b.classList.toggle('active', b.dataset.bg === 'none'));
}

// ── Permanent preset journals ───────────────────────────────────
const PRESET_JOURNALS = [
  {
    id: 'preset-1',
    title: 'Try Adding an image of kidney in the box using the magic pen',
    pageCount: 1,
    preset: true,
    pages: [{ title: 'Try Adding an image of kidney in the box using the magic pen', text: '', canvas: '/images/presets/preset-1.png' }],
    settings: { color: 'blush', dark: false, size: 'a4', spacing: 'narrow', template: 'blank', margin: false, bgImage: '/images/templates/12.png' },
  },
  {
    id: 'preset-2',
    title: 'Try asking Nova how you have improved compared to your previous week\'s journal',
    pageCount: 1,
    preset: true,
    pages: [{ title: 'Try asking Nova how you have improved compared to your previous week\'s journal', text: '', canvas: '/images/presets/preset-2.png' }],
    settings: { color: 'blush', dark: false, size: 'a4', spacing: 'narrow', template: 'blank', margin: false, bgImage: '/images/templates/8.png' },
  },
  {
    id: 'preset-3',
    title: 'Ask Nova to explain this text to you',
    pageCount: 1,
    preset: true,
    pages: [{ title: 'Ask Nova to explain this text to you', text: '', canvas: '/images/presets/preset-3.png' }],
    settings: { color: 'blush', dark: false, size: 'a4', spacing: 'narrow', template: 'blank', margin: false, bgImage: '/images/templates/7.jpeg' },
  },
  {
    id: 'preset-4',
    title: 'Try encircling the unsolved equation using the magic pen and ask me to solve it',
    pageCount: 1,
    preset: true,
    pages: [{ title: 'Try encircling the unsolved equation using the magic pen and ask me to solve it', text: '', canvas: '/images/presets/preset-4.png' }],
    settings: { color: 'blush', dark: false, size: 'a4', spacing: 'narrow', template: 'blank', margin: false, bgImage: '/images/templates/before.png' },
  },
];

let currentLoadedId = null; // id of the journal currently loaded, null if unsaved session

// ── Autosave helper (used on close and switching saved journals) ─
function doAutoSave() {
  if (!isDirty) return;
  const snapshot = captureSnapshot();
  if (currentLoadedId) {
    // Overwrite the existing saved entry
    const existing = savedJournals().find(j => j.id === currentLoadedId);
    if (existing) persistJournal({ ...snapshot, id: existing.id, title: existing.title, auto: existing.auto });
    else persistJournal(snapshot);
  } else {
    const hasContent = snapshot.pages.some(p => p.text || p.canvas);
    if (hasContent) persistJournal(snapshot);
  }
  isDirty = false;
}

// ── Unsaved changes dialog ──────────────────────────────────────
// mode: 'saved' = switching from a saved journal (Save | Discard)
//       'new'   = switching from an unsaved session (Save | Autosave | Discard)
function showUnsavedDialog(mode, onProceed) {
  const overlay    = document.getElementById('unsavedModalOverlay');
  const titleInput = document.getElementById('unsavedTitleInput');
  const saveBtn    = document.getElementById('unsavedSave');
  const autosaveBtn= document.getElementById('unsavedAutosave');
  const discardBtn = document.getElementById('unsavedDiscard');

  if (mode === 'saved') {
    // Switching from a saved journal — just Save or Discard, no title needed
    const existing = savedJournals().find(j => j.id === currentLoadedId);
    titleInput.style.display  = 'none';
    autosaveBtn.style.display = 'none';
    saveBtn.disabled          = false;
    saveBtn.onclick = () => {
      const snapshot = captureSnapshot();
      persistJournal({ ...snapshot, id: existing.id, title: existing.title, auto: existing.auto });
      isDirty = false;
      close(); onProceed();
    };
  } else {
    // Switching from a fresh unsaved session — Save (with title) | Autosave | Discard
    const existingTitle = document.querySelector('.title-input')?.value.trim() || '';
    titleInput.style.display  = '';
    autosaveBtn.style.display = '';
    titleInput.value   = existingTitle;
    saveBtn.disabled   = !existingTitle;
    titleInput.oninput = () => { saveBtn.disabled = !titleInput.value.trim(); };
    saveBtn.onclick = () => {
      const title = titleInput.value.trim();
      if (!title) return;
      persistJournal(captureSnapshot(title));
      isDirty = false;
      close(); onProceed();
    };
    autosaveBtn.onclick = () => {
      persistJournal(captureSnapshot());
      isDirty = false;
      close(); onProceed();
    };
  }

  discardBtn.onclick = () => { isDirty = false; close(); onProceed(); };
  overlay.onclick    = e => { if (e.target === overlay) close(); };

  function close() { overlay.classList.remove('active'); }
  overlay.classList.add('active');
  if (mode === 'new') titleInput.focus();
}

// ── Persistence ────────────────────────────────────────────────
function savedJournals() {
  try { return JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]'); }
  catch { return []; }
}

function persistJournal(entry) {
  const list = savedJournals();
  // Replace existing entry with same id, otherwise prepend
  const idx = list.findIndex(j => j.id === entry.id);
  if (idx !== -1) list.splice(idx, 1);
  list.unshift(entry);
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(list.slice(0, 100)));
}

function deleteJournal(id, savedAt) {
  const list = savedJournals().filter(j => {
    if (id && j.id) return j.id !== id;
    return j.savedAt !== savedAt; // fallback for entries without an id
  });
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(list));
}

function nextAutoSaveTitle() {
  const n = (parseInt(localStorage.getItem(AUTOSAVE_KEY) || '0', 10)) + 1;
  localStorage.setItem(AUTOSAVE_KEY, String(n));
  return `Auto saved ${n}`;
}

// ── Capture current session ─────────────────────────────────────
function captureSnapshot(forcedTitle) {
  const sheets = document.querySelectorAll('.page-sheet');
  const pages = Array.from(sheets).map(sheet => {
    const drawCv = sheet.querySelector('.draw-canvas');
    return {
      title:  sheet.querySelector('.title-input')?.value || '',
      text:   sheet.querySelector('.entry-area')?.value  || '',
      canvas: (drawCv && drawCv.width > 0) ? drawCv.toDataURL() : null,
    };
  });

  const manualTitle = document.querySelector('.title-input')?.value?.trim() || '';
  const title   = forcedTitle || manualTitle || nextAutoSaveTitle();
  const snippet = pages[0]?.text?.trim().slice(0, 80) || '';
  const id      = manualTitle
    ? `manual-${manualTitle}`           // user-titled: stable id so re-saves overwrite
    : `auto-${Date.now()}`;             // auto-saves: always a new entry

  return { id, savedAt: Date.now(), title, snippet, pageCount: pages.length, pages, settings: getState(), auto: !manualTitle && !forcedTitle };
}


// ── Page card (current session) ─────────────────────────────────
function buildPageThumb(sheet, n, onClose) {
  const card = document.createElement('button');
  card.className = 'nav-page-card';

  const drawCv = sheet.querySelector('.draw-canvas');
  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'nav-page-thumb';

  if (drawCv && drawCv.width > 0) {
    const img = document.createElement('img');
    img.src = drawCv.toDataURL();
    img.alt = `Page ${n}`;
    thumbWrap.appendChild(img);
  }

  const ta = sheet.querySelector('.entry-area');
  const snippet = ta?.value?.trim().slice(0, 60) || '';
  const title = sheet.querySelector('.title-input')?.value?.trim() || `Page ${n}`;

  const label = document.createElement('div');
  label.className = 'nav-page-label';
  label.innerHTML = `<strong>${title}</strong>${snippet ? `<span>${snippet}…</span>` : ''}`;

  card.appendChild(thumbWrap);
  card.appendChild(label);
  card.addEventListener('click', () => {
    sheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
    onClose();
  });

  return card;
}

// ── Journal list item ───────────────────────────────────────────
function buildJournalItem(entry, journalsPane, refreshJournals, onClose) {
  const item = document.createElement('div');
  item.className = 'nav-journal-item';

  const date    = new Date(entry.savedAt);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const displayTitle = entry.title || 'Untitled journal';
  const isAuto = entry.auto;

  const isPreset = !!entry.preset;

  const body = document.createElement('div');
  body.className = 'nav-journal-body';
  body.setAttribute('role', 'button');
  body.tabIndex = 0;
  body.innerHTML = `
    <div class="nav-journal-meta">
      <span class="nav-journal-title">${displayTitle}${isAuto ? ' <span class="nav-auto-badge">auto</span>' : ''}${isPreset ? ' <span class="nav-preset-badge">preset</span>' : ''}</span>
      <span class="nav-journal-pages">${entry.pageCount} page${entry.pageCount !== 1 ? 's' : ''}</span>
    </div>
    ${isPreset ? '' : `<div class="nav-journal-date">${dateStr} · ${timeStr}</div>`}
    <div class="nav-journal-snippet">${entry.snippet || (isPreset ? 'Starter journal' : 'No content')}</div>`;

  item.appendChild(body);

  if (!isPreset) {
    const delBtn = document.createElement('button');
    delBtn.className = 'nav-journal-delete';
    delBtn.title = 'Delete this journal';
    delBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      deleteJournal(entry.id, entry.savedAt);
      refreshJournals();
    });
    item.appendChild(delBtn);
  }

  function doLoad() {
    isDirty = false;
    currentLoadedId = entry.id;
    restorePages(entry.pages);
    if (entry.preset) {
      setTimeout(() => document.querySelectorAll('.entry-area').forEach(ta => ta.removeAttribute('placeholder')), 80);
    }
    if (entry.settings) {
      const s = entry.settings;
      setColor(s.color);
      setDarkMode(s.dark);
      setSize(s.size);
      setSpacing(s.spacing);
      setTemplate(s.template);
      setMargin(s.margin);
      setBgImage(s.bgImage);
      saveSettings();
      // Sync sidebar UI controls
      document.querySelectorAll('.page-swatch').forEach(b => b.classList.toggle('active', b.dataset.color === s.color));
      document.querySelectorAll('[data-size]').forEach(b => b.classList.toggle('active', b.dataset.size === s.size));
      document.querySelectorAll('[data-spacing]').forEach(b => b.classList.toggle('active', b.dataset.spacing === s.spacing));
      document.querySelectorAll('.template-card').forEach(b => b.classList.toggle('active', b.dataset.template === s.template));
      document.querySelectorAll('.bg-template-card').forEach(b => b.classList.toggle('active', b.dataset.bg === s.bgImage));
      const darkToggle = document.getElementById('darkModeToggle');
      const marginToggle = document.getElementById('marginToggle');
      if (darkToggle) darkToggle.checked = s.dark;
      if (marginToggle) marginToggle.checked = s.margin;
    }
    refreshJournals();
    onClose();
  }

  function triggerLoad() {
    if (!isDirty) { doLoad(); return; }

    const isAlreadySaved = currentLoadedId !== null;
    if (isAlreadySaved) {
      showUnsavedDialog('saved', doLoad);
    } else {
      const hasContent = Array.from(document.querySelectorAll('.page-sheet')).some(s =>
        s.querySelector('.entry-area')?.value.trim() || s.querySelector('.title-input')?.value.trim()
      );
      if (hasContent) showUnsavedDialog('new', doLoad);
      else doLoad();
    }
  }

  body.addEventListener('click', triggerLoad);
  body.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') triggerLoad(); });

  return item;
}

// ── Init ───────────────────────────────────────────────────────
export function initNavigator() {
  // Autosave on accidental close/refresh
  window.addEventListener('beforeunload', () => { if (isDirty) doAutoSave(); });

  const panel      = document.getElementById('navPanel');
  const overlay    = document.getElementById('navOverlay');
  const openBtn    = document.getElementById('navToggle');
  const closeBtn   = document.getElementById('navClose');
  const journalsPane = document.getElementById('journalsPane');
  const pagesList    = document.getElementById('pagesList');
  const journalsList = document.getElementById('journalsList');

  function open() {
    panel.classList.add('open');
    overlay.classList.add('open');
    refreshPages();
    refreshJournals();
  }

  function close() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
  }

  function refreshPages() {
    pagesList.innerHTML = '';
    const sheets = document.querySelectorAll('.page-sheet');
    if (!sheets.length) {
      pagesList.innerHTML = '<p class="nav-empty">No pages yet.</p>';
      return;
    }
    sheets.forEach((sheet, i) => pagesList.appendChild(buildPageThumb(sheet, i + 1, close)));
  }

  function refreshJournals() {
    journalsList.innerHTML = '';

    // Preset section
    const presetHeader = document.createElement('p');
    presetHeader.className = 'nav-section-label';
    presetHeader.textContent = 'Starter Journals';
    journalsList.appendChild(presetHeader);
    PRESET_JOURNALS.forEach(entry => journalsList.appendChild(buildJournalItem(entry, journalsList, refreshJournals, close)));

    // User journals section
    const list = savedJournals();
    const userHeader = document.createElement('p');
    userHeader.className = 'nav-section-label';
    userHeader.textContent = 'My Journals';
    journalsList.appendChild(userHeader);
    if (!list.length) {
      const empty = document.createElement('p');
      empty.className = 'nav-empty';
      empty.innerHTML = 'No saved journals yet.<br>Click <strong>Save</strong> to record a snapshot.';
      journalsList.appendChild(empty);
    } else {
      list.forEach(entry => journalsList.appendChild(buildJournalItem(entry, journalsList, refreshJournals, close)));
    }
  }

  // Tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.nav-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.pane).classList.add('active');
    });
  });

  // ── New journal button ────────────────────────────────────
  document.getElementById('newJournalBtn').addEventListener('click', () => {
    function doNew() {
      currentLoadedId = null;
      newJournal();
      applyDefaultAppearance();
      close();
    }
    if (!isDirty) { doNew(); return; }
    const isAlreadySaved = currentLoadedId !== null;
    if (isAlreadySaved) showUnsavedDialog('saved', doNew);
    else {
      const hasContent = Array.from(document.querySelectorAll('.page-sheet')).some(s =>
        s.querySelector('.entry-area')?.value.trim() || s.querySelector('.title-input')?.value.trim()
      );
      if (hasContent) showUnsavedDialog('new', doNew);
      else doNew();
    }
  });

  // ── Add page button (pages pane) ──────────────────────────
  document.getElementById('addPageNavBtn').addEventListener('click', () => {
    addPage();
    close();
  });

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  return {
    saveSnapshot() {
      const entry = captureSnapshot();
      persistJournal(entry);
      currentLoadedId = entry.id;
      isDirty = false;
    },
  };
}
