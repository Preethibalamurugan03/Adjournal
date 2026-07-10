const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/save-preset', (req, res) => {
  const { name, dataURL } = req.body;
  if (!name || !dataURL) return res.status(400).json({ error: 'name and dataURL required' });
  const base64 = dataURL.replace(/^data:image\/png;base64,/, '');
  const filePath = path.join(__dirname, 'public', 'images', 'presets', `${name}.png`);
  fs.writeFile(filePath, base64, 'base64', err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, path: `/images/presets/${name}.png` });
  });
});

app.listen(PORT, () => {
  console.log(`Adjournal running at http://localhost:${PORT}`);
});
