import {
  setColor, setDarkMode, setSize, setSpacing, setTemplate, setMargin, setBgImage,
  loadSettings, saveSettings, getState,
} from './settings.js';

// SVG previews for template cards
const TEMPLATE_PREVIEWS = {
  ruled: (lineColor) => `
    <svg width="100%" height="60" xmlns="http://www.w3.org/2000/svg">
      ${[12,22,32,42,52].map(y => `<line x1="8" y1="${y}" x2="100%" y2="${y}" stroke="${lineColor}" stroke-width="1"/>`).join('')}
    </svg>`,
  blank: () => `<svg width="100%" height="60" xmlns="http://www.w3.org/2000/svg"></svg>`,
  dotted: (lineColor) => `
    <svg width="100%" height="60" xmlns="http://www.w3.org/2000/svg">
      ${[1,2,3,4,5].flatMap(r => [1,2,3,4,5,6,7,8,9,10].map(c =>
        `<circle cx="${c*14-4}" cy="${r*12-4}" r="1.2" fill="${lineColor}"/>`
      )).join('')}
    </svg>`,
  grid: (lineColor) => `
    <svg width="100%" height="60" xmlns="http://www.w3.org/2000/svg">
      ${[10,20,30,40,50].map(y => `<line x1="0" y1="${y}" x2="100%" y2="${y}" stroke="${lineColor}" stroke-width="0.8"/>`).join('')}
      ${[14,28,42,56,70,84,98,112,126].map(x => `<line x1="${x}" y1="0" x2="${x}" y2="60" stroke="${lineColor}" stroke-width="0.8"/>`).join('')}
    </svg>`,
};

function getLineColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--line-color').trim() || '#d4cfc8';
}

function refreshTemplatePreviews() {
  const lc = getLineColor();
  document.querySelectorAll('.template-card').forEach(card => {
    const preview = card.querySelector('.template-preview');
    const key = card.dataset.template;
    if (preview && TEMPLATE_PREVIEWS[key]) {
      preview.innerHTML = TEMPLATE_PREVIEWS[key](lc);
    }
  });
}

export function initSidebar() {
  const sidebar  = document.getElementById('settingsSidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const openBtn  = document.getElementById('settingsToggle');
  const closeBtn = document.getElementById('sidebarClose');

  function open() {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    openBtn.setAttribute('aria-expanded', 'true');
    refreshTemplatePreviews();
  }
  function close() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    openBtn.setAttribute('aria-expanded', 'false');
  }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  // ── Page color swatches ───────────────────────────────────
  document.querySelectorAll('.page-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.page-swatch').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setColor(btn.dataset.color);
      saveSettings();
    });
  });

  // ── Dark mode toggle ──────────────────────────────────────
  const darkToggle = document.getElementById('darkModeToggle');
  darkToggle.addEventListener('change', () => {
    setDarkMode(darkToggle.checked);
    saveSettings();
    setTimeout(refreshTemplatePreviews, 50);
  });

  // ── Margin toggle ─────────────────────────────────────────
  const marginToggle = document.getElementById('marginToggle');
  marginToggle.addEventListener('change', () => {
    setMargin(marginToggle.checked);
    saveSettings();
  });

  // ── Generic pill group wirer ──────────────────────────────
  function wireGroup(attr, handler) {
    document.querySelectorAll(`[data-${attr}]`).forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll(`[data-${attr}]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        handler(btn.dataset[attr]);
        saveSettings();
      });
    });
  }

  wireGroup('size',    setSize);
  wireGroup('spacing', setSpacing);

  // ── Background template images ────────────────────────────
  document.querySelectorAll('.bg-template-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.bg-template-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      setBgImage(card.dataset.bg);
      saveSettings();
    });
  });

  // ── Template cards ────────────────────────────────────────
  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      setTemplate(card.dataset.template);
      saveSettings();
    });
  });

  // ── Sync UI to persisted state ────────────────────────────
  function syncUI() {
    const s = getState();

    document.querySelectorAll('.page-swatch').forEach(b => {
      b.classList.toggle('active', b.dataset.color === s.color);
    });

    darkToggle.checked  = s.dark;
    marginToggle.checked = s.margin;

    ['size', 'spacing'].forEach(attr => {
      document.querySelectorAll(`[data-${attr}]`).forEach(b => {
        b.classList.toggle('active', b.dataset[attr] === s[attr]);
      });
    });

    document.querySelectorAll('.template-card').forEach(c => {
      c.classList.toggle('active', c.dataset.template === s.template);
    });

    document.querySelectorAll('.bg-template-card').forEach(c => {
      c.classList.toggle('active', c.dataset.bg === s.bgImage);
    });
  }

  loadSettings();
  syncUI();
}
