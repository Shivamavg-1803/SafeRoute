'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ML = require('../assets/js/model.js');
const D = require('../assets/js/data.js');
const clone = rows => rows.map(r => ({ ...r }));
const series = (value = 0, length = 28, area = 'Test Area') => Array.from({ length }, (_, i) => ({ area, week: new Date(Date.UTC(2025, 0, 6) + i * 604800000).toISOString().slice(0, 10), report_count: value }));

test('bundled CSV is exactly the reproducible synthetic dataset', () => {
  const text = readFileSync(join(__dirname, '../data/sample-weekly-counts.csv'), 'utf8');
  assert.equal(text, ML.toCSV(D.weekly));
  assert.deepEqual(ML.parseCSV(text), D.weekly);
  const valid = ML.validate(D.weekly);
  assert.equal(valid.areas.length, 6);
  assert.equal(valid.timeline.length, 52);
  assert.equal(D.reports.length, 72);
  assert.equal(new Set(D.reports.map(r => r.id)).size, 72);
  for (const r of D.reports) {
    assert.ok(D.zones.some(z => z.id === r.zone));
    assert.ok(D.categories.some(c => c.id === r.category));
    assert.equal(r.synthetic, true);
    assert.equal(r.status, 'example');
  }
});

test('CSV quoting, commas, BOM, and CRLF survive round trip', () => {
  const rows = series(3, 26, 'North, "Garden"');
  const csv = '\uFEFF' + ML.toCSV(rows).replaceAll('\n', '\r\n');
  assert.deepEqual(ML.parseCSV(csv), rows);
  assert.equal(ML.validate(ML.parseCSV(csv)).areas[0], 'North, "Garden"');
});

test('bad header, malformed quotes, missing fields, and invalid counts are rejected', () => {
  for (const csv of [
    'AREA,week,report_count\nA,2026-01-05,2',
    'area,week,report_count\n"A,2026-01-05,2',
    'area,week,report_count\n"A"x,2026-01-05,2',
    'area,week,report_count\nA,2026-01-05,',
    'area,week,report_count\nA,2026-01-05,-2',
    'area,week,report_count\nA,2026-01-05,2.5',
    'area,week,report_count\nA,2026-01-05,NaN',
    'area,week,report_count\nA,2026-01-05,2,extra'
  ]) assert.throws(() => ML.parseCSV(csv));
  assert.throws(() => ML.parseCSV('x'.repeat(1000001)), /1 MB/);
});

test('calendar validation rejects impossible dates and accepts leap day', () => {
  assert.throws(() => ML.dateValue('2026-02-29'));
  assert.throws(() => ML.dateValue('2026-13-01'));
  assert.throws(() => ML.dateValue('01/05/2026'));
  assert.ok(Number.isFinite(ML.dateValue('2024-02-29')));
});

test('coverage rules reject duplicate, missing, unequal, and insufficient weeks', () => {
  const duplicate = series(3); duplicate[5].week = duplicate[4].week;
  assert.throws(() => ML.validate(duplicate), /Duplicate or missing/);
  const missing = series(3); missing.splice(7, 1);
  assert.throws(() => ML.validate(missing), /Duplicate or missing/);
  assert.throws(() => ML.validate(series(3, 23)), /24/);
  const offset = [...series(3), ...series(5, 28, 'Other Area').map(r => ({ ...r, week: new Date(ML.dateValue(r.week) + 604800000).toISOString().slice(0, 10) }))];
  assert.throws(() => ML.validate(offset), /same weekly dates/);
  assert.throws(() => ML.validate([...series(3), ...series(5, 27, 'Other Area')]), /same weekly dates/);
});

test('range and area bounds reject unsuitable input', () => {
  for (const count of [-1, 1.5, Infinity, NaN, 100001]) {
    const rows = series(3); rows[1].report_count = count;
    assert.throws(() => ML.validate(rows), /integers/);
  }
  assert.throws(() => ML.validate(series(3, 28, 'A'.repeat(61))), /1–60/);
  assert.throws(() => ML.validate(series(3, 28, 'Bad\nArea')), /printable/);
  assert.throws(() => ML.validate(Array.from({ length: 21 }, (_, i) => series(2, 24, 'Area ' + i)).flat()), /20 areas/);
});

test('ridge solver recovers an independently known linear relationship', () => {
  const X = Array.from({ length: 40 }, (_, i) => [i - 20]);
  const y = X.map(([x]) => 40 + 2 * x);
  const fit = ML.fit(X, y, 0.00000001);
  assert.ok(Math.abs(ML.predict(fit, [7]) - 54) < 1e-6);
  assert.ok(Math.abs(ML.predict(fit, [-10]) - 20) < 1e-6);
  assert.equal(ML.predict(fit, [-100]), 0, 'Negative predictions are clipped.');
});

test('zero series fits without NaN and has zero baseline and model error', () => {
  const result = ML.run(series());
  assert.equal(result.mae, 0); assert.equal(result.baselineMAE, 0);
  assert.equal(result.forecast[0].estimate, 0);
  assert.equal(result.forecast[0].lower, 0);
  assert.equal(result.forecast[0].upper, 0);
});

test('model split and metrics agree with independently recomputed held-out errors', () => {
  const result = ML.run(D.weekly);
  assert.equal(result.trainRows, 222); assert.equal(result.testRows, 66);
  assert.equal(result.testWeeks, 11);
  assert.ok(result.trainEnd < result.splitWeek);
  assert.ok(result.evaluated.every(row => row.week >= result.splitWeek));
  const mae = result.evaluated.reduce((v, row) => v + Math.abs(row.actual - row.predicted), 0) / 66;
  assert.ok(Math.abs(mae - result.mae) < 1e-12);
  const baseline = result.evaluated.reduce((v, row) => v + Math.abs(row.actual - row.baseline), 0) / 66;
  assert.equal(baseline, result.baselineMAE);
  const errors = result.evaluated.map(row => Math.abs(row.actual - row.predicted)).sort((a, b) => a - b);
  assert.equal(result.margin, errors[Math.ceil(errors.length * .8) - 1]);
  for (const row of result.forecast) {
    assert.equal(row.week, '2026-10-19');
    assert.ok(Number.isFinite(row.estimate) && row.estimate >= 0);
    assert.ok(row.lower <= row.estimate && row.estimate <= row.upper);
  }
});

test('changing held-out targets cannot change training preprocessing or coefficients', () => {
  const original = ML.run(D.weekly);
  const changed = D.weekly.map(row => ({ ...row, report_count: row.week >= original.splitWeek ? row.report_count + 100 : row.report_count }));
  const result = ML.run(changed);
  assert.deepEqual(result.validationModel, original.validationModel);
  assert.notDeepEqual(result.fitted.coefficients, original.fitted.coefficients);
  assert.notEqual(result.mae, original.mae);
});

test('row ordering does not affect estimates and the input is not mutated', () => {
  const rows = clone(D.weekly), before = JSON.stringify(rows);
  const forward = ML.run(rows), reversed = ML.run([...rows].reverse());
  assert.equal(JSON.stringify(rows), before);
  assert.deepEqual(forward.forecast, reversed.forecast);
  assert.deepEqual(forward.validationModel, reversed.validationModel);
});

test('serialized model retains the same predictions', () => {
  const result = ML.run(D.weekly);
  const restored = JSON.parse(JSON.stringify(result.fitted));
  const features = [...result.areas.map((_, i) => +(i === 0)), 18, 17, 52, 0, 1];
  assert.equal(ML.predict(restored, features), ML.predict(result.fitted, features));
});
