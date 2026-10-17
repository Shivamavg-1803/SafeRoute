/* Small, dependency-free ridge-regression implementation. See docs/MODEL_CARD.md. */
(function (root) {
  'use strict';
  const WEEK = 604800000;
  function fail(message) { throw new Error(message); }
  function dateValue(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('Use dates in YYYY-MM-DD format.');
    const t = Date.parse(value + 'T00:00:00Z');
    if (!Number.isFinite(t) || new Date(t).toISOString().slice(0, 10) !== value) fail('The CSV contains an invalid date.');
    return t;
  }
  function parseCSV(text) {
    if (text.length > 1000000) fail('Please use a CSV smaller than 1 MB.');
    const rows = []; let row = [], field = '', quoted = false, closed = false;
    text = text.replace(/^\uFEFF/, '');
    for (let i = 0; i <= text.length; i++) {
      const ch = i === text.length ? '\n' : text[i];
      if (ch === '"') {
        if (quoted && text[i + 1] === '"') { field += '"'; i++; }
        else if (quoted) { quoted = false; closed = true; }
        else if (field === '' && !closed) quoted = true;
        else fail('Malformed CSV quotation.');
      } else if ((ch === ',' || ch === '\n' || ch === '\r') && !quoted) {
        row.push(field.trim()); field = ''; closed = false;
        if (ch !== ',') { if (row.some(Boolean)) rows.push(row); row = []; if (ch === '\r' && text[i + 1] === '\n') i++; }
      } else { if (closed && ch.trim()) fail('Unexpected characters after a quoted CSV field.'); field += ch; }
    }
    if (quoted) fail('A quoted CSV field was not closed.');
    if (rows.length < 2) fail('The CSV needs a header and data rows.');
    const header = rows.shift();
    if (header.join(',') !== 'area,week,report_count') fail('Required header: area,week,report_count (in this order).');
    return rows.map((r, i) => {
      if (r.length !== 3 || r.some(x => x === '')) fail('Row ' + (i + 2) + ' needs exactly three non-empty fields.');
      if (!/^\d+$/.test(r[2])) fail('Report counts must be non-negative whole numbers.');
      return { area: r[0], week: r[1], report_count: Number(r[2]) };
    });
  }
  function validate(rows) {
    if (!Array.isArray(rows) || rows.length < 24 || rows.length > 10000) fail('Use 24–520 complete weeks per area and at most 10,000 rows.');
    const byArea = new Map();
    rows.forEach(r => {
      if (!r || typeof r.area !== 'string' || !r.area.trim() || r.area.length > 60 || /[\u0000-\u001f]/.test(r.area)) fail('Area names must contain 1–60 printable characters.');
      if (!Number.isInteger(r.report_count) || r.report_count < 0 || r.report_count > 100000) fail('Report counts must be integers between 0 and 100,000.');
      dateValue(r.week);
      const area = r.area.trim();
      if (!byArea.has(area)) byArea.set(area, []);
      byArea.get(area).push({ area, week: r.week, report_count: r.report_count });
    });
    if (byArea.size > 20) fail('The browser prototype supports up to 20 areas.');
    const areas = [...byArea.keys()].sort();
    let timeline;
    for (const area of areas) {
      const series = byArea.get(area).sort((a, b) => a.week.localeCompare(b.week));
      if (series.length < 24 || series.length > 520) fail('Each area needs 24–520 complete weekly observations.');
      for (let i = 1; i < series.length; i++) {
        if (dateValue(series[i].week) - dateValue(series[i - 1].week) !== WEEK) fail('Duplicate or missing weeks in ' + area + '. Use consecutive dates exactly 7 days apart.');
      }
      if (!timeline) timeline = series.map(r => r.week);
      else if (series.length !== timeline.length || series.some((r, i) => r.week !== timeline[i])) fail('All areas must cover the same weekly dates. Missing records are not treated as zero.');
    }
    return { areas, byArea, timeline };
  }
  function features(series, i, z, n) {
    const history = series.slice(i - 4, i).map(x => x.report_count);
    const onehot = Array.from({ length: n }, (_, j) => +(j === z));
    return [...onehot, history[3], history.reduce((a, b) => a + b, 0) / 4, i, Math.sin(2 * Math.PI * i / 52), Math.cos(2 * Math.PI * i / 52)];
  }
  function solve(A, b) {
    const m = A.map((row, i) => [...row, b[i]]); const n = b.length;
    for (let k = 0; k < n; k++) {
      let pivot = k;
      for (let i = k + 1; i < n; i++) if (Math.abs(m[i][k]) > Math.abs(m[pivot][k])) pivot = i;
      [m[k], m[pivot]] = [m[pivot], m[k]];
      if (Math.abs(m[k][k]) < 1e-12) fail('The model could not be fitted. Review the dataset variation.');
      const scale = m[k][k]; for (let j = k; j <= n; j++) m[k][j] /= scale;
      for (let i = 0; i < n; i++) if (i !== k) { const f = m[i][k]; for (let j = k; j <= n; j++) m[i][j] -= f * m[k][j]; }
    }
    return m.map(row => row[n]);
  }
  function fit(X, y, alpha = 1) {
    const d = X[0].length;
    const means = Array.from({ length: d }, (_, j) => X.reduce((v, row) => v + row[j], 0) / X.length);
    const scales = means.map((v, j) => Math.sqrt(X.reduce((sum, row) => sum + (row[j] - v) ** 2, 0) / X.length) || 1);
    const A = Array.from({ length: d + 1 }, () => Array(d + 1).fill(0)); const b = Array(d + 1).fill(0);
    X.forEach((row, k) => {
      const x = [1, ...row.map((v, j) => (v - means[j]) / scales[j])];
      for (let i = 0; i <= d; i++) { b[i] += x[i] * y[k]; for (let j = 0; j <= d; j++) A[i][j] += x[i] * x[j]; }
    });
    for (let j = 1; j <= d; j++) A[j][j] += alpha;
    return { means, scales, coefficients: solve(A, b), alpha };
  }
  function predict(model, x) { return Math.max(0, model.coefficients[0] + x.reduce((sum, v, i) => sum + (v - model.means[i]) / model.scales[i] * model.coefficients[i + 1], 0)); }
  function run(rows) {
    const dataset = validate(rows); const { areas, byArea, timeline } = dataset;
    const testWeeks = Math.max(4, Math.ceil(timeline.length * .2)); const split = timeline.length - testWeeks;
    const samples = [];
    areas.forEach((area, z) => {
      const series = byArea.get(area);
      for (let i = 4; i < series.length; i++) samples.push({ area, week: series[i].week, index: i, x: features(series, i, z, areas.length), y: series[i].report_count, baseline: series[i - 1].report_count });
    });
    const train = samples.filter(s => s.index < split), test = samples.filter(s => s.index >= split);
    const validationModel = fit(train.map(s => s.x), train.map(s => s.y));
    const evaluated = test.map(s => ({ area: s.area, week: s.week, actual: s.y, predicted: predict(validationModel, s.x), baseline: s.baseline }));
    const errors = evaluated.map(e => Math.abs(e.actual - e.predicted)).sort((a, b) => a - b);
    const mae = errors.reduce((a, b) => a + b, 0) / errors.length;
    const baselineMAE = evaluated.reduce((a, e) => a + Math.abs(e.actual - e.baseline), 0) / evaluated.length;
    const rmse = Math.sqrt(evaluated.reduce((a, e) => a + (e.actual - e.predicted) ** 2, 0) / evaluated.length);
    const margin = errors[Math.min(errors.length - 1, Math.ceil(errors.length * .8) - 1)];
    const fitted = fit(samples.map(s => s.x), samples.map(s => s.y));
    const nextWeek = new Date(dateValue(timeline.at(-1)) + WEEK).toISOString().slice(0, 10);
    const forecast = areas.map((area, z) => {
      const series = byArea.get(area); const estimate = predict(fitted, features(series, series.length, z, areas.length));
      return { area, week: nextWeek, estimate, lower: Math.max(0, estimate - margin), upper: estimate + margin, last: series.at(-1).report_count };
    });
    if (![mae, baselineMAE, rmse, ...forecast.map(f => f.estimate)].every(Number.isFinite)) fail('Non-finite model output; check the input range.');
    return { areas, timeline, trainRows: train.length, testRows: test.length, testWeeks, splitWeek: timeline[split], trainEnd: timeline[split - 1], mae, baselineMAE, rmse, margin, fitted, validationModel, evaluated, forecast, samples: rows.length, schemaVersion: 1 };
  }
  function toCSV(rows) {
    const quote = v => '"' + String(v).replaceAll('"', '""') + '"';
    return 'area,week,report_count\n' + rows.map(r => [quote(r.area), r.week, r.report_count].join(',')).join('\n') + '\n';
  }
  const api = { parseCSV, validate, fit, predict, run, toCSV, dateValue };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SafeRouteML = api;
})(typeof window !== 'undefined' ? window : globalThis);
