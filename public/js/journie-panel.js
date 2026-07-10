// Nova AI assistant chat panel
import { setBgImage, saveSettings } from './settings.js';

const RESPONSES = [
  "That's a beautiful thought — let it breathe on the page.",
  "Try writing about what you felt before the words come. Start with a colour, a texture, a temperature.",
  "What would you say if no one were reading?",
  "Interesting. Can you push that idea one line further?",
  "Sometimes the thing we avoid writing is the thing most worth writing.",
  "Write it badly first. Perfection can wait.",
  "What does this remind you of from ten years ago?",
  "Your journal doesn't judge. Neither do I.",
];

// Keyword-matched answers
const MATCHED = [
  {
    keywords: ['periodic', 'periodic component', 'fourier', 'explain', 'explain this doc', 'explain this document', 'explain this', 'explain to me', 'elaborate', 'what does this mean', 'what is this', 'tell me about this', 'describe this', 'break this down', 'summarise this', 'summarize this', 'what does this say'],
    answer: "In signal processing, periodic components are the predictable, repeating rhythms hidden within a chaotic signal—much like individual musical notes buried inside a noisy room. While these cycles are almost impossible to tease apart when looking at a standard time-domain graph, the Fourier transform acts as a mathematical prism. By switching the perspective to the frequency domain, it strips away the confusing background noise and exposes each hidden repetition as a sharp, distinct peak, making it easy to diagnose a faulty machine, decode brain waves, or isolate long-term climate patterns.",
  },
  {
    keywords: ['last week', 'compared to last week', 'how have i done', 'how did i do'],
    answer: "Compared to last week, you seem to have made meaningful progress. You appear more focused on taking care of yourself, and your reflections suggest a more positive and balanced mindset. You're recognizing your achievements, showing greater gratitude for the small things, and being kinder to yourself instead of dwelling on what went wrong. While there is always room to grow, it's clear that you're building healthier habits and becoming more intentional with your thoughts and actions. Keep celebrating these small improvements—they add up over time.",
  },
  {
    keywords: ['aesthetic', 'make it look better', 'make this look better', 'prettier', 'beautify', 'make it prettier', 'make this prettier', 'make it more beautiful', 'improve the look'],
    answer: "There you go — I've switched to a more aesthetic template for you. ✨",
    action() {
      const src = 'images/templates/11.png';
      setBgImage(src);
      saveSettings();
      document.querySelectorAll('.bg-template-card').forEach(c => {
        c.classList.toggle('active', c.dataset.bg === src);
      });
    },
  },
];

function matchResponse(text) {
  const lower = text.toLowerCase();
  for (const entry of MATCHED) {
    if (entry.keywords.some(kw => lower.includes(kw))) return entry;
  }
  return { answer: RESPONSES[Math.floor(Math.random() * RESPONSES.length)] };
}

function formatTime() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function initJourniePanel() {
  const panel      = document.getElementById('journiePanel');
  const messages   = document.getElementById('journiePanelMessages');
  const input      = document.getElementById('journiePanelInput');
  const sendBtn    = document.getElementById('journiePanelSend');
  const closeBtn   = document.getElementById('journiePanelClose');
  const toggleBtn  = document.getElementById('journiePanelToggle');
  const dragHandle = document.getElementById('novaDragHandle');

  // ── Resize via top-left drag handle ────────────────────────
  let isResizing = false, startX, startY, startW, startH;

  dragHandle.addEventListener('mousedown', e => {
    e.preventDefault();
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startW = panel.offsetWidth;
    startH = panel.offsetHeight;
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', e => {
    if (!isResizing) return;
    const dw = startX - e.clientX; // dragging left = wider
    const dh = startY - e.clientY; // dragging up   = taller
    const newW = Math.max(320, Math.min(startW + dw, window.innerWidth - 40));
    const newH = Math.max(300, Math.min(startH + dh, window.innerHeight - 80));
    panel.style.width  = newW + 'px';
    panel.style.height = newH + 'px';
    // Remove max-height so the user's chosen height is respected
    panel.style.maxHeight = 'none';
  });

  document.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.userSelect = '';
  });

  function open() {
    panel.classList.add('open');
    input.focus();
  }

  function close() {
    panel.classList.remove('open');
  }

  function appendMessage(text, role) {
    const msg = document.createElement('div');
    msg.className = `jp-message jp-message--${role}`;
    msg.innerHTML = `
      <div class="jp-bubble">${text}</div>
      <div class="jp-time">${formatTime()}</div>
    `;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  function appendThinking() {
    const msg = document.createElement('div');
    msg.className = 'jp-message jp-message--journie jp-thinking';
    msg.innerHTML = `<div class="jp-bubble"><span></span><span></span><span></span></div>`;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
    return msg;
  }

  function send() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    appendMessage(text, 'user');

    const thinking = appendThinking();
    setTimeout(() => {
      thinking.remove();
      const match = matchResponse(text);
      if (match.action) match.action();
      appendMessage(match.answer ?? match, 'journie');
    }, 900 + Math.random() * 600);
  }

  toggleBtn.addEventListener('click', () => {
    panel.classList.contains('open') ? close() : open();
  });

  closeBtn.addEventListener('click', close);

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

  // Welcome message
  appendMessage("Hi! I'm Nova ✨ I'm here to help you reflect, write, and answer any questions you might have.", 'journie');
}
