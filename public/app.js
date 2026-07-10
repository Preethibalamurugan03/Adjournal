// ── Date label ──
const dateLabel = document.getElementById('dateLabel');
dateLabel.textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

// ── Word count ──
const entryArea = document.getElementById('entryArea');
const wordCount = document.getElementById('wordCount');

entryArea.addEventListener('input', () => {
  const words = entryArea.value.trim().split(/\s+/).filter(Boolean).length;
  wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
});

// ── Save & toast ──
const saveBtn = document.getElementById('saveBtn');
const toast   = document.getElementById('toast');

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

saveBtn.addEventListener('click', () => {
  const title   = document.querySelector('.title-input').value.trim() || 'Untitled';
  const content = entryArea.value.trim();
  if (!content) { showToast('Nothing to save yet!'); return; }

  const entries = JSON.parse(localStorage.getItem('adjournal_entries') || '[]');
  entries.unshift({ title, content, date: new Date().toISOString() });
  localStorage.setItem('adjournal_entries', JSON.stringify(entries));
  showToast('Entry saved!');
});

// ── Canvas drawing ──
const canvas      = document.getElementById('drawCanvas');
const ctx         = canvas.getContext('2d');
const pageContent = canvas.parentElement;
const page        = document.getElementById('page');

const PEN_COLORS = {
  penRed:  '#c0392b',
  penBlue: '#2471a3',
};

let activePen  = null;   // 'penRed' | 'penBlue' | null
let isDrawing  = false;
let lastX      = 0;
let lastY      = 0;

function resizeCanvas() {
  const { width, height } = pageContent.getBoundingClientRect();
  // Save existing drawing before resize
  const img = canvas.toDataURL();
  canvas.width  = width;
  canvas.height = height;
  // Restore after resize
  const image = new Image();
  image.src = img;
  image.onload = () => ctx.drawImage(image, 0, 0);
}

window.addEventListener('resize', resizeCanvas);
// Wait for layout to settle before first sizing
requestAnimationFrame(resizeCanvas);

function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return [clientX - rect.left, clientY - rect.top];
}

canvas.addEventListener('mousedown', e => {
  if (!activePen) return;
  isDrawing = true;
  [lastX, lastY] = getCanvasPos(e);
  // Draw a dot on click without drag
  ctx.beginPath();
  ctx.arc(lastX, lastY, 1, 0, Math.PI * 2);
  ctx.fillStyle = PEN_COLORS[activePen];
  ctx.fill();
});

canvas.addEventListener('mousemove', e => {
  if (!isDrawing || !activePen) return;
  const [x, y] = getCanvasPos(e);

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.strokeStyle = PEN_COLORS[activePen];
  ctx.lineWidth   = 2;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.globalAlpha = 0.92;
  ctx.stroke();

  [lastX, lastY] = [x, y];
});

canvas.addEventListener('mouseup',    () => { isDrawing = false; });
canvas.addEventListener('mouseleave', () => { isDrawing = false; });

// ── Clear drawing ──
document.getElementById('clearDrawBtn').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// ── Pen selection ──
function selectPen(penId) {
  if (activePen === penId) {
    // Clicking active pen deselects it (back to typing mode)
    activePen = null;
    document.getElementById(penId).classList.remove('selected');
    page.classList.remove('draw-mode');
    entryArea.focus();
    return;
  }

  // Deselect previous
  if (activePen) document.getElementById(activePen).classList.remove('selected');

  activePen = penId;
  document.getElementById(penId).classList.add('selected');
  page.classList.add('draw-mode');
  ctx.globalAlpha = 0.92;
}

document.getElementById('penRed').addEventListener('click',  () => selectPen('penRed'));
document.getElementById('penBlue').addEventListener('click', () => selectPen('penBlue'));

// Pressing Escape deselects pen and returns to typing
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && activePen) {
    selectPen(activePen); // toggles off
  }
});
