const fs = require('fs');
const path = require('path');

function getImages(dir, prefix) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).map(f => {
    return {
      filename: f,
      url: '/extracted/' + prefix + '/' + f,
      prefix: prefix
    };
  });
}

const list1 = getImages('public/extracted/pdf1', 'pdf1');
const list2 = getImages('public/extracted/pdf2', 'pdf2');
const all = [...list1, ...list2];

const itemsHtml = all.map((item, idx) => {
  return `
  <div class="card" id="card-${idx}">
    <div class="img-box">
      <img src="${item.url}" id="img-${idx}" loading="lazy" alt="${item.filename}">
    </div>
    <div class="name">#${idx + 1} (${item.prefix}): <strong>${item.filename}</strong></div>
    <div class="rot-controls">
      <button onclick="rotateImg(${idx}, -90)">⟲ -90°</button>
      <button onclick="rotateImg(${idx}, 90)">⟳ +90°</button>
      <button onclick="rotateImg(${idx}, 180)">180°</button>
      <span class="deg-label" id="deg-${idx}">0°</span>
    </div>
  </div>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Extracted Photos Review & Angle Adjustment</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f1115; color: #eee; margin: 0; padding: 24px; }
    h1 { color: #d4af37; margin-bottom: 8px; }
    p { color: #aaa; margin-bottom: 20px; font-size: 14px; }
    .export-box { background: #1a1e24; border: 1px solid #333; padding: 12px 18px; border-radius: 8px; margin-bottom: 24px; display: flex; gap: 12px; align-items: center; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .card { background: #181b20; border: 1px solid #282e38; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
    .img-box { width: 100%; height: 260px; display: flex; align-items: center; justify-content: center; background: #000; border-radius: 6px; overflow: hidden; position: relative; }
    .img-box img { max-width: 100%; max-height: 100%; object-fit: contain; transition: transform 0.2s ease; }
    .name { font-size: 11px; margin-top: 10px; color: #ccc; word-break: break-all; text-align: center; }
    .rot-controls { display: flex; gap: 6px; margin-top: 8px; align-items: center; }
    button { background: #252b36; color: #e5c07b; border: 1px solid #3e4756; padding: 5px 9px; font-size: 11px; border-radius: 4px; cursor: pointer; }
    button:hover { background: #353e4f; }
    .deg-label { font-size: 11px; color: #888; min-width: 28px; text-align: center; }
  </style>
</head>
<body>
  <h1>Sri Akil - Photo Review & Orientation Tuner</h1>
  <p>Showing ${all.length} extracted images. Click rotation buttons to orient sideways images.</p>
  <div class="export-box">
    <button onclick="exportRotations()" style="padding: 8px 16px; font-weight: bold; background: #d4af37; color: #000;">Export Rotations JSON</button>
    <span id="export-status" style="font-size: 12px; color: #4ade80;"></span>
  </div>
  <div class="grid">
    ${itemsHtml}
  </div>

  <script>
    const rotations = {};
    function rotateImg(idx, delta) {
      rotations[idx] = ((rotations[idx] || 0) + delta) % 360;
      if (rotations[idx] < 0) rotations[idx] += 360;
      const img = document.getElementById('img-' + idx);
      img.style.transform = 'rotate(' + rotations[idx] + 'deg)';
      document.getElementById('deg-' + idx).innerText = rotations[idx] + '°';
    }

    function exportRotations() {
      const active = {};
      for (const [k, v] of Object.entries(rotations)) {
        if (v !== 0) active[k] = v;
      }
      localStorage.setItem('activeRotations', JSON.stringify(active));
      document.getElementById('export-status').innerText = 'Saved ' + Object.keys(active).length + ' rotated images!';
      console.log('Rotations:', JSON.stringify(active));
    }
  </script>
</body>
</html>`;

fs.writeFileSync('public/catalog.html', html, 'utf8');
console.log('Updated public/catalog.html with rotation tuner.');
