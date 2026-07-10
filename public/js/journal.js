export function initJournal({ dateEl, textareaEl, wordCountEl, saveBtn, toastEl }) {
  // ── Date ─────────────────────────────────────────────────
  dateEl.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // ── Word count ───────────────────────────────────────────
  textareaEl.addEventListener('input', () => {
    const words = textareaEl.value.trim().split(/\s+/).filter(Boolean).length;
    wordCountEl.textContent = `${words} word${words !== 1 ? 's' : ''}`;
  });

  // ── Toast ────────────────────────────────────────────────
  let toastTimer = null;

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  // ── Save ─────────────────────────────────────────────────
  saveBtn.addEventListener('click', () => {
    const titleEl = document.querySelector('.title-input');
    const title   = titleEl ? titleEl.value.trim() || 'Untitled' : 'Untitled';
    const content = textareaEl.value.trim();

    if (!content) { showToast('Nothing to save yet!'); return; }

    const entries = JSON.parse(localStorage.getItem('adjournal_entries') || '[]');
    entries.unshift({ title, content, date: new Date().toISOString() });
    localStorage.setItem('adjournal_entries', JSON.stringify(entries));
    showToast('Entry saved!');
  });

  return {
    showToast,
    getContent() {
      return {
        title: document.querySelector('.title-input')?.value.trim() || 'Untitled',
        text:  textareaEl.value,
      };
    },
  };
}
