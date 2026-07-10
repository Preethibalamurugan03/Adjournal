export const DEFAULT_TOOL  = 'fineliner';
export const DEFAULT_COLOR = '#2c2c2c';

// SVG tip paths (24x24 viewBox, pointing downward)
const TIPS = {
  fineliner: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="2" width="6" height="10" rx="1.5" fill="currentColor"/>
      <polygon points="9,12 15,12 12,22" fill="currentColor"/>
      <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,

  brush: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="2" width="8" height="9" rx="2" fill="currentColor"/>
      <path d="M8 11 Q7 16 12 22 Q17 16 16 11Z" fill="currentColor"/>
    </svg>`,

  marker: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="2" width="10" height="11" rx="2" fill="currentColor"/>
      <rect x="7" y="13" width="10" height="6" rx="0" fill="currentColor" opacity="0.7"/>
      <rect x="8" y="19" width="8" height="3" rx="1" fill="currentColor" opacity="0.5"/>
    </svg>`,

  pencil: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="2" width="6" height="13" rx="1" fill="currentColor"/>
      <polygon points="9,15 15,15 12,21" fill="currentColor" opacity="0.8"/>
      <polygon points="10.5,19 13.5,19 12,22" fill="#f5deb3"/>
      <line x1="12" y1="21.5" x2="12" y2="23" stroke="#555" stroke-width="1" stroke-linecap="round"/>
    </svg>`,

  highlighter: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="10" width="14" height="8" rx="2" fill="currentColor" opacity="0.5"/>
      <polygon points="17,10 21,7 21,21 17,18" fill="currentColor" opacity="0.7"/>
      <line x1="3" y1="21" x2="17" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

  eraser: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="16" height="10" rx="3" fill="currentColor" opacity="0.85"/>
      <rect x="4" y="15" width="16" height="3" rx="1.5" fill="currentColor"/>
      <line x1="4" y1="15" x2="20" y2="15" stroke="white" stroke-width="1" opacity="0.4"/>
    </svg>`,

  journie: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="4" y1="20" x2="14" y2="10" stroke="#ff6644" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="14" y1="10" x2="17" y2="7" stroke="#ffaa00" stroke-width="2" stroke-linecap="round"/>
      <path d="M19 4l.8 2.4L22 7.2l-2.2.8L19 10.4l-.8-2.4L16 7.2l2.2-.8z" fill="#aa44ff"/>
      <path d="M8 5l.5 1.5L10 7l-1.5.5L8 9l-.5-1.5L6 7l1.5-.5z" fill="#2288ff"/>
    </svg>`,

  textbox: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/>
      <path d="M8 9h8M8 12h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="13" y1="15" x2="13" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
};

export const TOOLS = {
  fineliner: {
    key:          'fineliner',
    label:        'Fine Liner',
    icon:         TIPS.fineliner,
    lineWidth:    1.2,
    minWidth:     1.2,
    maxWidth:     1.2,
    globalAlpha:  0.97,
    lineCap:      'round',
    lineJoin:     'round',
    compositeOp:  'source-over',
    jitter:       false,
    speedVariant: false,
  },
  brush: {
    key:          'brush',
    label:        'Brush',
    icon:         TIPS.brush,
    lineWidth:    10,
    minWidth:     4,
    maxWidth:     18,
    globalAlpha:  0.55,
    lineCap:      'round',
    lineJoin:     'round',
    compositeOp:  'source-over',
    jitter:       false,
    speedVariant: true,   // width varies with pointer speed
  },
  marker: {
    key:          'marker',
    label:        'Marker',
    icon:         TIPS.marker,
    lineWidth:    14,
    minWidth:     14,
    maxWidth:     14,
    globalAlpha:  0.35,
    lineCap:      'square',
    lineJoin:     'miter',
    compositeOp:  'source-over',
    jitter:       false,
    speedVariant: false,
  },
  pencil: {
    key:          'pencil',
    label:        'Pencil',
    icon:         TIPS.pencil,
    lineWidth:    1.5,
    minWidth:     1.1,
    maxWidth:     1.9,
    globalAlpha:  0.65,
    lineCap:      'round',
    lineJoin:     'round',
    compositeOp:  'source-over',
    jitter:       true,   // random per-segment noise
    speedVariant: false,
  },
  textbox: {
    key:          'textbox',
    label:        'Text Box',
    icon:         TIPS.textbox,
    textbox:      true,
    lineWidth:    0,
    minWidth:     0,
    maxWidth:     0,
    globalAlpha:  1,
    lineCap:      'round',
    lineJoin:     'round',
    compositeOp:  'source-over',
    jitter:       false,
    speedVariant: false,
  },
  highlighter: {
    key:          'highlighter',
    label:        'Highlighter',
    icon:         TIPS.highlighter,
    lineWidth:    16,
    minWidth:     16,
    maxWidth:     16,
    globalAlpha:  0.3,
    lineCap:      'square',
    lineJoin:     'miter',
    compositeOp:  'source-over',
    jitter:       false,
    speedVariant: false,
  },
  eraser: {
    key:          'eraser',
    label:        'Eraser',
    icon:         TIPS.eraser,
    lineWidth:    18,
    minWidth:     18,
    maxWidth:     18,
    globalAlpha:  1.0,
    lineCap:      'round',
    lineJoin:     'round',
    compositeOp:  'destination-out',
    jitter:       false,
    speedVariant: false,
  },
  journie: {
    key:          'journie',
    label:        'Journie',
    icon:         TIPS.journie,
    lineWidth:    3,
    minWidth:     2,
    maxWidth:     5,
    globalAlpha:  1.0,
    lineCap:      'round',
    lineJoin:     'round',
    compositeOp:  'source-over',
    jitter:       false,
    speedVariant: false,
    rainbow:      true,   // special renderer in canvas.js
  },
};

// 10 colours in 2 rows of 5
export const COLORS = [
  // Row 1
  { id: 'crimson',   label: 'Crimson',   hex: '#c0392b' },
  { id: 'coral',     label: 'Coral',     hex: '#e8673a' },
  { id: 'amber',     label: 'Amber',     hex: '#e8a020' },
  { id: 'forest',    label: 'Forest',    hex: '#2d7a4f' },
  { id: 'ocean',     label: 'Ocean',     hex: '#2471a3' },
  // Row 2
  { id: 'rose',      label: 'Rose',      hex: '#d4698a' },
  { id: 'lavender',  label: 'Lavender',  hex: '#7d5fa8' },
  { id: 'slate',     label: 'Slate',     hex: '#4a5568' },
  { id: 'sepia',     label: 'Sepia',     hex: '#8b6347' },
  { id: 'charcoal',  label: 'Charcoal',  hex: '#2c2c2c' },
];
