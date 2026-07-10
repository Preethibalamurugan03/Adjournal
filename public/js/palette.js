export function initPalette(containerEl, colors, onColorSelect) {
  const row1 = colors.slice(0, 5);
  const row2 = colors.slice(5, 10);
  let activeDot = null;

  const palette = document.createElement('div');
  palette.className = 'palette';

  [row1, row2].forEach(row => {
    const rowEl = document.createElement('div');
    rowEl.className = 'palette-row';

    row.forEach(({ id, label, hex }) => {
      const dot = document.createElement('button');
      dot.className = 'color-dot';
      dot.title = label;
      dot.dataset.color = hex;
      dot.style.setProperty('--dot-color', hex);

      dot.addEventListener('click', () => {
        setActiveColor(hex);
        onColorSelect(hex);
      });

      rowEl.appendChild(dot);
    });

    palette.appendChild(rowEl);
  });

  containerEl.appendChild(palette);

  function setActiveColor(hex) {
    if (activeDot) activeDot.classList.remove('active');
    activeDot = palette.querySelector(`[data-color="${hex}"]`);
    if (activeDot) activeDot.classList.add('active');
  }

  return { setActiveColor };
}
