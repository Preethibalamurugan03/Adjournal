const ROOT = document.documentElement;
const STORAGE_KEY = 'adjournal_settings';

const PAGE_COLORS = {
  cream:   { light: '#fffdf7', dark: '#242018' },
  white:   { light: '#ffffff', dark: '#2c2824' },
  yellow:  { light: '#fef9e7', dark: '#28240e' },
  sage:    { light: '#f0f4ee', dark: '#1c221a' },
  blue:    { light: '#eef2f8', dark: '#1a1e26' },
  blush:   { light: '#fdf0f0', dark: '#261a1a' },
  charcoal:{ light: '#e8e4df', dark: '#141210' },
};

const PAGE_SIZES = {
  a5:     520,
  a4:     680,
  letter: 660,
  wide:   860,
};

const LINE_SPACINGS = {
  narrow: { lineHeight: '24px', lineSize: '23px' },
  medium: { lineHeight: '32px', lineSize: '31px' },
  wide:   { lineHeight: '40px', lineSize: '39px' },
  none:   { lineHeight: '32px', lineSize: '31px' },
};

const state = {
  color:    'cream',
  dark:     false,
  size:     'a4',
  spacing:  'medium',
  template: 'blank',
  margin:   false,
  bgImage:  'none',
};

// ── Helpers ───────────────────────────────────────────────────
function getTextareas() { return document.querySelectorAll('.entry-area'); }

function buildRuledBg() {
  return `repeating-linear-gradient(
    to bottom,
    transparent, transparent var(--line-size),
    var(--line-color) var(--line-size), var(--line-color) var(--line-height)
  )`;
}

function applyTemplateBg(template, spacing) {
  const tas = getTextareas();
  if (!tas.length) return;
  const noRules = spacing === 'none';
  const lh = LINE_SPACINGS[spacing]?.lineHeight ?? '32px';

  tas.forEach(ta => {
    ta.style.backgroundAttachment = 'local';
    ta.style.backgroundSize       = '';
    ta.style.backgroundPosition   = '';

    if (template === 'blank' || noRules) {
      ta.style.backgroundImage = 'none';
    } else if (template === 'ruled') {
      ta.style.backgroundImage = buildRuledBg();
    } else if (template === 'dotted') {
      ta.style.backgroundImage    = 'radial-gradient(circle, var(--line-color) 1.5px, transparent 1.5px)';
      ta.style.backgroundSize     = `${lh} ${lh}`;
      ta.style.backgroundPosition = '8px 10px';
    } else if (template === 'grid') {
      ta.style.backgroundImage =
        `linear-gradient(to right, var(--line-color) 1px, transparent 1px),
         linear-gradient(to bottom, var(--line-color) 1px, transparent 1px)`;
      ta.style.backgroundSize     = `${lh} ${lh}`;
      ta.style.backgroundPosition = '0 0';
    }
  });
}

// ── Appliers ──────────────────────────────────────────────────
function applyColor(key) {
  const map = PAGE_COLORS[key] ?? PAGE_COLORS.cream;
  const hex = state.dark ? map.dark : map.light;
  ROOT.style.setProperty('--page-bg', hex);
  ROOT.style.setProperty('--page-bg-grad-top', hex);
}

function applyDark(enabled) {
  document.body.dataset.theme = enabled ? 'dark' : '';
  applyColor(state.color);
}

function applySize(key) {
  const px = PAGE_SIZES[key] ?? PAGE_SIZES.a4;
  ROOT.style.setProperty('--page-width', `${px}px`);
}

function applySpacing(key) {
  const s = LINE_SPACINGS[key] ?? LINE_SPACINGS.medium;
  ROOT.style.setProperty('--line-height', s.lineHeight);
  ROOT.style.setProperty('--line-size',   s.lineSize);
  getTextareas().forEach(ta => { ta.style.lineHeight = s.lineHeight; });
  applyTemplateBg(state.template, key);
}

function applyTemplate(key) {
  applyTemplateBg(key, state.spacing);
}

function applyBgImage(src) {
  document.querySelectorAll('.page-content').forEach(el => {
    el.style.backgroundImage  = src === 'none' ? '' : `url('${src}')`;
    el.style.backgroundSize   = src === 'none' ? '' : '100% 100%';
    el.style.backgroundRepeat = src === 'none' ? '' : 'no-repeat';
  });
}

function applyMargin(on) {
  document.querySelectorAll('.red-margin').forEach(el => {
    el.style.display = on ? 'block' : 'none';
  });
}

// ── Public setters ────────────────────────────────────────────
export function setColor(key)    { state.color    = key; applyColor(key); }
export function setDarkMode(on)  { state.dark      = on;  applyDark(on);   }
export function setSize(key)     { state.size      = key; applySize(key);  }
export function setSpacing(key)  { state.spacing   = key; applySpacing(key); }
export function setTemplate(key) { state.template  = key; applyTemplate(key); }
export function setMargin(on)    { state.margin    = on;  applyMargin(on);  }
export function setBgImage(src)  { state.bgImage   = src; applyBgImage(src); }
export function getState()       { return { ...state }; }

// ── Persistence ───────────────────────────────────────────────
export function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved.color)                state.color    = saved.color;
    if (saved.dark   !== undefined) state.dark     = saved.dark;
    if (saved.size)                 state.size     = saved.size;
    if (saved.spacing)              state.spacing  = saved.spacing;
    if (saved.template)             state.template = saved.template;
    if (saved.margin  !== undefined) state.margin  = saved.margin;
    if (saved.bgImage)               state.bgImage = saved.bgImage;
  } catch (_) { /* ignore */ }

  // Always open fresh with blank template and no background image
  state.template = 'blank';
  state.bgImage  = 'none';

  applyDark(state.dark);
  applySize(state.size);
  applySpacing(state.spacing);
  applyTemplate(state.template);
  applyMargin(state.margin);
  applyBgImage(state.bgImage);
}
