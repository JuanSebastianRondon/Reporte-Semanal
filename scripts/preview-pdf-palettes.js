const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const { generatePDF } = require(path.join(root, 'dist', 'reports', 'templates', 'pdf.template.js'));
const { PDF_PALETTES } = require(path.join(root, 'dist', 'reports', 'templates', 'pdf-palettes.js'));

function sampleMetrics() {
  const apps = [
    ['Visual Studio Code', 18420],
    ['Windows Terminal Host', 12360],
    ['OneCommander', 6420],
    ['Google Chrome', 4380],
    ['Microsoft Edge', 3120],
    ['Notion', 2340],
    ['Spotify', 1860],
    ['PowerShell', 1320],
    ['Excel', 960],
    ['Word', 720],
    ['Teams', 540],
    ['Slack', 420],
    ['Explorer', 300],
    ['Figma', 180],
    ['Postman', 120],
  ].map(([name, seconds]) => ({ name, minutes: Math.round(seconds / 60) }));

  return {
    apps,
    totalHours: '12.4h',
    periodLabel: '2026-W47 · 16 nov – 22 nov',
  };
}

function swatches(palette) {
  return ['header', 'headerDark', 'accent', 'tableHead', 'soft', 'rowAlt', 'barTrack']
    .map((key) => `
      <div class="swatch">
        <span style="background:${palette[key]}"></span>
        <small>${key}</small>
        <code>${palette[key]}</code>
      </div>`)
    .join('');
}

(async () => {
  const outDir = path.join(os.tmpdir(), 'reporte-pdf-paletas');
  fs.mkdirSync(outDir, { recursive: true });

  const cards = [];

  for (const [key, palette] of Object.entries(PDF_PALETTES)) {
    process.env.REPORT_PDF_PALETTE = key;
    const generated = await generatePDF(sampleMetrics());
    const preview = path.join(outDir, `${key}.pdf`);
    fs.writeFileSync(preview, generated);

    cards.push(`
      <article>
        <h2>${palette.name} <code>${key}</code></h2>
        <div class="swatches">${swatches(palette)}</div>
        <p>Configura <code>REPORT_PDF_PALETTE=${key}</code> en <code>.env</code>.</p>
        <a href="${key}.pdf">Abrir PDF de ejemplo</a>
      </article>`);
  }

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Paletas del reporte PDF</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; margin: 32px; color: #111827; background: #f8fafc; }
    h1 { margin-bottom: 4px; }
    .hint { color: #6b7280; margin-top: 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
    article { background: #fff; border: 1px solid #dbe4f0; border-radius: 10px; padding: 20px; }
    h2 { margin-top: 0; font-size: 18px; }
    code { background: #f1f5f9; border-radius: 4px; padding: 1px 5px; font-size: 12px; }
    .swatches { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 16px 0; }
    .swatch { display: grid; grid-template-columns: 28px 1fr; column-gap: 8px; align-items: center; font-size: 12px; }
    .swatch span { grid-row: span 2; width: 28px; height: 28px; border: 1px solid #d1d5db; border-radius: 6px; }
    .swatch small { color: #6b7280; }
    a { color: #1d4ed8; font-weight: 600; }
  </style>
</head>
<body>
  <h1>Paletas del reporte PDF</h1>
  <p class="hint">Abre el PDF de cada paleta y elige la que prefieras. Se activa con <code>REPORT_PDF_PALETTE</code>.</p>
  <div class="grid">${cards.join('')}</div>
</body>
</html>`;

  const indexPath = path.join(outDir, 'index.html');
  fs.writeFileSync(indexPath, html, 'utf-8');

  console.log(`Vista previa: ${indexPath}`);
  Object.keys(PDF_PALETTES).forEach((key) => {
    console.log(`  ${key}: ${path.join(outDir, `${key}.pdf`)}`);
  });
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
