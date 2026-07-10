const TOUR_KEY = 'adjournal_toured_v1';

const STEPS = [
  {
    title: 'Welcome to Adobe Chronicle ✨',
    text: 'Your all-in-one smart journal — built for drawing, writing, and reflecting. This is a prototype targeted at Android & Apple mobile users; this web version is for ease of sharing and testing. <strong>Nova\'s responses are handcrafted examples rather than live AI</strong>, giving you a true feel for the experience.',
    target: null,
    position: 'center',
  },
  {
    title: 'Drawing tools',
    text: 'Pick a pen, highlighter, eraser, or textbox from the toolbar. Choose a colour from the palette beside them. Undo and redo are on the left.',
    target: '#toolbarContainer',
    position: 'below',
  },
  {
    title: 'Magic Pen ✦',
    text: 'The rainbow tool is the Magic Pen. Draw a loop around anything on the page and Chronicle will recognise what you\'ve circled — try encircling an equation or a sketch.',
    target: '.journie-btn',
    position: 'below',
  },
  {
    title: 'Nova — your AI assistant',
    text: 'Tap Nova in the toolbar to open the chat. Ask it to reflect on your week, explain a concept, or make the page look more aesthetic.',
    target: '#journiePanelToggle',
    position: 'below',
  },
  {
    title: 'Make it yours ✨',
    text: 'Open Settings (the ⚙︎ icon top right) to change the page colour, size, line style, and background template. Everything applies instantly across all pages.',
    target: '#settingsToggle',
    position: 'below',
  },
  {
    title: 'Starter Journals',
    text: 'The Journals panel (open now 👇) has four preset journals that show exactly what Chronicle can do. Tap any one to load it and explore.',
    target: '#journalsPane',
    position: 'right',
    onEnter() {
      // Open nav panel via the toggle button so refreshJournals() fires
      const navPanel = document.getElementById('navPanel');
      if (!navPanel.classList.contains('open')) {
        document.getElementById('navToggle')?.click();
      }
      // Switch to Journals tab
      setTimeout(() => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.nav-pane').forEach(p => p.classList.remove('active'));
        const journalsTab = document.querySelector('[data-pane="journalsPane"]');
        const journalsPane = document.getElementById('journalsPane');
        if (journalsTab) journalsTab.classList.add('active');
        if (journalsPane) journalsPane.classList.add('active');
      }, 50);
    },
  },
];

function getRect(selector) {
  const el = document.querySelector(selector);
  return el ? el.getBoundingClientRect() : null;
}

export function initTour() {
  // if (localStorage.getItem(TOUR_KEY)) return;

  let step = 0;

  const overlay = document.createElement('div');
  overlay.className = 'tour-overlay';
  document.body.appendChild(overlay);

  const ring = document.createElement('div');
  ring.className = 'tour-highlight-ring';
  ring.style.display = 'none';
  document.body.appendChild(ring);

  // Card is a sibling of ring at higher z-index so it paints above the shadow
  const card = document.createElement('div');
  card.className = 'tour-card';
  document.body.appendChild(card);

  function render() {
    const s = STEPS[step];

    if (s.onEnter) s.onEnter();

    const isWelcome = step === 0;
    card.className = isWelcome ? 'tour-card tour-card--welcome' : 'tour-card';
    card.innerHTML = `
      <div class="tour-step-count">${step + 1} / ${STEPS.length}</div>
      <h3 class="tour-title" style="${isWelcome ? 'font-size:22px;margin-bottom:14px;' : ''}">${s.title}</h3>
      <p class="tour-text" style="${isWelcome ? 'font-size:15px;' : ''}">${s.text}</p>
      <div class="tour-actions">
        ${step > 0 ? '<button class="tour-btn tour-btn--ghost" id="tourBack">Back</button>' : ''}
        <button class="tour-btn tour-btn--primary" id="tourNext">${step === STEPS.length - 1 ? 'Get started' : 'Next'}</button>
      </div>
    `;

    card.querySelector('#tourNext').addEventListener('click', () => {
      if (step === STEPS.length - 1) { finish(); return; }
      step++;
      render();
    });
    const backBtn = card.querySelector('#tourBack');
    if (backBtn) backBtn.addEventListener('click', () => { step--; render(); });

    if (s.target) {
      const rect = getRect(s.target);
      overlay.classList.add('tour-overlay--dim');
      ring.style.display = 'block';

      if (rect) {
        const pad = 8;
        ring.style.left   = (rect.left - pad) + 'px';
        ring.style.top    = (rect.top  - pad) + 'px';
        ring.style.width  = (rect.width  + pad * 2) + 'px';
        ring.style.height = (rect.height + pad * 2) + 'px';

        const cardW = 320;
        let left, top;
        if (s.position === 'below') {
          left = Math.min(rect.left, window.innerWidth - cardW - 16);
          top  = rect.bottom + 16;
        } else if (s.position === 'right') {
          left = rect.right + 16;
          top  = rect.top;
        } else {
          left = (window.innerWidth - cardW) / 2;
          top  = (window.innerHeight - 220) / 2;
        }
        card.style.position  = 'fixed';
        card.style.left      = Math.max(12, Math.min(left, window.innerWidth - cardW - 12)) + 'px';
        card.style.top       = Math.max(12, top) + 'px';
        card.style.transform = 'none';
      }
    } else {
      overlay.classList.remove('tour-overlay--dim');
      ring.style.display   = 'none';
      card.style.position  = 'fixed';
      card.style.left      = '50%';
      card.style.top       = '50%';
      card.style.transform = 'translate(-50%, -50%)';
    }
  }

  function finish() {
    localStorage.setItem(TOUR_KEY, '1');
    overlay.remove();
    ring.remove();
    card.remove();
  }

  render();
}
