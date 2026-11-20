require('reflect-metadata');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getWeekKey,
  parseWeekKey,
  isDueForWeeklyReport,
  getWeekRangeLabel,
} = require('../dist/reports/week');

test('getWeekKey calcula la semana ISO de la fecha local', () => {
  assert.equal(getWeekKey(new Date('2026-11-20T12:00:00')), '2026-W47');
  assert.equal(getWeekKey(new Date('2026-11-09T12:00:00')), '2026-W46');
  // Semanas que cruzan año
  assert.equal(getWeekKey(new Date('2026-01-01T12:00:00')), '2026-W01');
  assert.equal(getWeekKey(new Date('2026-12-31T12:00:00')), '2026-W53');
});

test('parseWeekKey entiende el formato nuevo y el antiguo', () => {
  assert.equal(parseWeekKey('2026-W47'), '2026-W47');
  assert.equal(parseWeekKey('Mon Nov 09 2026'), '2026-W46');
  assert.equal(parseWeekKey(''), null);
  assert.equal(parseWeekKey('no-es-una-fecha'), null);
});

test('isDueForWeeklyReport envía si se perdió el lunes', () => {
  const jueves = new Date('2026-11-20T12:00:00'); // W47
  assert.equal(isDueForWeeklyReport(null, jueves), true);
  assert.equal(isDueForWeeklyReport('2026-W46', jueves), true);
  assert.equal(isDueForWeeklyReport('2026-W47', jueves), false);
  // Flag antiguo con formato de Date
  assert.equal(isDueForWeeklyReport('Mon Nov 09 2026', jueves), true);
});

test('getWeekRangeLabel muestra el rango de la semana', () => {
  const label = getWeekRangeLabel(new Date('2026-11-20T12:00:00'));
  assert.match(label, /2026-W47/);
  assert.match(label, /–/);
});
