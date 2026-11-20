require('reflect-metadata');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ReportsService } = require('../dist/reports/reports.service');
const { getWeekKey } = require('../dist/reports/week');

function createService(dir) {
  const state = { sent: 0, resets: 0, flushes: 0 };
  const mail = {
    sendReportEmail: async () => { state.sent++; },
  };
  const metrics = {
    getWeeklyMetrics: () => ({ apps: [{ name: 'Vivaldi', minutes: 30 }], totalHours: '0.5h' }),
  };
  const tracker = {
    flush: () => { state.flushes++; },
    resetData: () => { state.resets++; },
  };
  return { service: new ReportsService(mail, metrics, tracker, dir), state };
}

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'reporte-reports-'));
}

test('el envío automático marca la semana y reinicia el acumulado', async () => {
  const dir = tempDir();
  const { service, state } = createService(dir);

  await service.sendWeeklyReport({ automatic: true });

  assert.equal(state.sent, 1);
  assert.equal(state.resets, 1);
  assert.ok(state.flushes >= 1);
  assert.equal(fs.readFileSync(path.join(dir, '.report-sent'), 'utf-8'), getWeekKey(new Date()));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('el envío manual conserva el acumulado y no cierra la semana', async () => {
  const dir = tempDir();
  const { service, state } = createService(dir);

  await service.sendWeeklyReport({ automatic: false });

  assert.equal(state.sent, 1);
  assert.equal(state.resets, 0);
  assert.equal(service.getLastSentDate(), null);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('no se envía dos veces aunque haya varias peticiones simultáneas', async () => {
  const dir = tempDir();
  const { service, state } = createService(dir);

  await Promise.all([
    service.sendWeeklyReport({ automatic: false }),
    service.sendWeeklyReport({ automatic: false }),
  ]);

  assert.equal(state.sent, 1);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('una semana anterior obliga a enviar, la actual no', () => {
  const dir = tempDir();
  const { service } = createService(dir);
  const flag = path.join(dir, '.report-sent');

  fs.writeFileSync(flag, '2020-W01');
  assert.equal(service.isDueForWeeklyReport(), true);

  fs.writeFileSync(flag, getWeekKey(new Date()));
  assert.equal(service.isDueForWeeklyReport(), false);
  fs.rmSync(dir, { recursive: true, force: true });
});
