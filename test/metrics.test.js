require('reflect-metadata');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { MetricsService } = require('../dist/metrics/metrics.service');
const { generatePDF } = require('../dist/reports/templates/pdf.template');

function tempData(data) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reporte-metrics-'));
  const file = path.join(dir, 'data.json');
  fs.writeFileSync(file, JSON.stringify(data));
  return { dir, file };
}

test('MetricsService agrupa, ordena y limita a 15 aplicaciones', () => {
  const apps = {};
  for (let i = 0; i < 20; i++) apps[`app${i}`] = (20 - i) * 120;
  const { dir, file } = tempData({ apps, totalSeconds: 25200 });

  const metrics = new MetricsService(file).getWeeklyMetrics();
  assert.equal(metrics.apps.length, 15);
  assert.equal(metrics.apps[0].name, 'app0');
  assert.equal(metrics.apps[0].minutes, 40);
  assert.equal(metrics.totalHours, '7.0h');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('MetricsService tolera un archivo inexistente', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reporte-metrics-'));
  const metrics = new MetricsService(path.join(dir, 'no-existe.json')).getWeeklyMetrics();
  assert.deepEqual(metrics.apps, []);
  assert.equal(metrics.totalHours, '0.0h');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('generatePDF incluye la etiqueta del período y el estado vacío', async () => {
  const pdf = await generatePDF({
    apps: [],
    totalHours: '0.0h',
    periodLabel: '2026-W47 · 16 nov – 22 nov',
  });
  assert.ok(fs.existsSync(pdf));
  assert.ok(fs.statSync(pdf).size > 1000);
  fs.unlinkSync(pdf);
});
