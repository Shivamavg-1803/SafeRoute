/* SafeRoute UI. Everything runs locally; there are no reporting/API requests. */
(function () {
  'use strict';
  const D = window.SafeRouteData, ML = window.SafeRouteML;
  const $ = id => document.getElementById(id);
  const KEY = 'saferoute.demo.v1';
  const routes = ['home', 'explore', 'insights', 'resources', 'about', 'review'];
  const periods = ['Morning', 'Afternoon', 'Evening', 'Night'];
  const esc = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const icon = name => '<svg class="icon" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  const zoneOf = id => D.zones.find(z => z.id === id);
  const categoryOf = id => D.categories.find(c => c.id === id);
  const prettyDate = value => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));
  const shortDate = value => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));
  const fmt = value => Number(value).toLocaleString('en', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const state = { route: '', category: 'all', zone: 'all', period: 'all', search: '', sort: 'newest', limit: 8, zoom: 1, reviewStatus: 'pending', reports: [], flags: [], weekly: D.weekly, source: 'synthetic', filename: '', model: null };
  let toastTimer, storageAvailable = true, importToken = 0;

  function toast(message) {
    clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 6500);
  }
  function validLocal(r) {
    if (!r || typeof r !== 'object' || !/^LOCAL-[a-zA-Z0-9-]{5,80}$/.test(r.id || '')) return false;
    if (!zoneOf(r.zone) || !categoryOf(r.category) || !periods.includes(r.period)) return false;
    if (!['pending', 'approved', 'rejected'].includes(r.status)) return false;
    if (typeof r.title !== 'string' || r.title.length < 6 || r.title.length > 80) return false;
    if (typeof r.description !== 'string' || r.description.length < 20 || r.description.length > 500) return false;
    try { ML.dateValue(r.date); } catch (_) { return false; }
    return r.date >= '2020-01-01' && r.date <= today();
  }
  function loadLocal() {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (!stored || typeof stored !== 'object') return;
      const seen = new Set();
      state.reports = (Array.isArray(stored.reports) ? stored.reports : []).filter(r => validLocal(r) && !seen.has(r.id) && seen.add(r.id)).slice(0, 200).map(r => ({ id: r.id, zone: r.zone, category: r.category, period: r.period, status: r.status, date: r.date, title: r.title, description: r.description, synthetic: true }));
      state.flags = [...new Set((Array.isArray(stored.flags) ? stored.flags : []).filter(id => typeof id === 'string' && D.reports.some(r => r.id === id)))];
    } catch (_) { storageAvailable = false; }
  }
  function saveLocal() {
    try { localStorage.setItem(KEY, JSON.stringify({ reports: state.reports, flags: state.flags })); storageAvailable = true; return true; }
    catch (_) { storageAvailable = false; toast('Browser storage is unavailable. Your changes last only for this open page.'); return false; }
  }
  function allReports() { return [...D.reports, ...state.reports.filter(r => r.status === 'approved')]; }
  function filteredReports(ignoreZone = false) {
    const reports = allReports();
    const latest = reports.reduce((date, r) => r.date > date ? r.date : date, '2020-01-01');
    const cutoff = ML.dateValue(latest) - (Number(state.period) - 1) * 86400000;
    return reports.filter(r => (ignoreZone || state.zone === 'all' || r.zone === state.zone)
      && (state.category === 'all' || r.category === state.category)
      && (state.period === 'all' || ML.dateValue(r.date) >= cutoff)
      && (!state.search || [r.title, r.description, zoneOf(r.zone).name, categoryOf(r.category).label].join(' ').toLowerCase().includes(state.search)))
      .sort((a, b) => (state.sort === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)) || a.id.localeCompare(b.id));
  }
  function mapMarkup(reports, isHome) {
    const counts = Object.fromEntries(D.zones.map(z => [z.id, reports.filter(r => r.zone === z.id).length]));
    const zoom = isHome ? 1 : state.zoom, width = 630 / zoom, height = 600 / zoom;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (630 - width) / 2 + ' ' + (600 - height) / 2 + ' ' + width + ' ' + height + '" role="group" aria-label="Fictional Demo City. Select a neighborhood to filter reports.">'
      + '<rect width="630" height="600" fill="#edf1e5"/><path class="map-water map-water-outline" d="M310-20C320 100 275 130 292 245S273 377 313 475 318 560 345 625"/><path class="map-water" d="M310-20C320 100 275 130 292 245S273 377 313 475 318 560 345 625"/>'
      + '<path class="map-road" d="M0 226H630M0 403H630M34 0 28 600M602 0 603 600"/>'
      + D.zones.map(z => '<g class="zone' + (!isHome && state.zone === z.id ? ' selected' : '') + '" role="button" tabindex="0" data-map-zone="' + z.id + '" data-map-home="' + isHome + '" aria-pressed="' + (!isHome && state.zone === z.id) + '" aria-label="' + esc(z.name) + ': ' + counts[z.id] + ' example reports"><path class="zone-shape" d="' + z.path + '"/><path class="map-park" d="M' + (z.x - 82) + ' ' + (z.y + 34) + 'h22v18h-22z"/><circle class="map-count-circle" cx="' + z.x + '" cy="' + (z.y - 8) + '" r="21"/><text class="map-count" x="' + z.x + '" y="' + (z.y - 7) + '">' + counts[z.id] + '</text><text class="zone-label" x="' + z.x + '" y="' + (z.y + 35) + '">' + z.short + '</text></g>').join('')
      + '<text class="map-label" x="62" y="590">DEMO CITY · NO REAL GEOGRAPHY</text></svg>';
  }
  function drawMaps() {
    $('home-map').innerHTML = mapMarkup(D.reports, true);
    $('explorer-map').innerHTML = mapMarkup(filteredReports(true), false);
    $('zoom-in').disabled = state.zoom >= 1.6; $('zoom-out').disabled = state.zoom <= 1;
  }
  function renderChips() {
    $('category-filters').innerHTML = [{ id: 'all', label: 'All concerns' }, ...D.categories].map(c => '<button type="button" class="chip' + (state.category === c.id ? ' active' : '') + '" data-category="' + c.id + '" aria-pressed="' + (state.category === c.id) + '">' + (c.icon ? icon(c.icon) : '') + c.label + '</button>').join('');
  }
  function cardMarkup(r) {
    const c = categoryOf(r.category);
    return '<button class="report-card" type="button" data-report-id="' + esc(r.id) + '"><span class="report-top"><span class="category-icon" style="color:' + c.color + '">' + icon(c.icon) + '</span>' + c.label + '<span class="report-date">' + shortDate(r.date) + '</span></span><span class="report-title">' + esc(r.title) + '</span><span class="report-meta">' + icon('pin') + esc(zoneOf(r.zone).name) + ' · ' + r.period + '<span class="tag' + (r.status === 'approved' ? ' local' : '') + '">' + (r.status === 'approved' ? 'Local demo' : 'Fictional') + '</span></span></button>';
  }
  function renderExplorer() {
    const reports = filteredReports();
    $('zone-filter').value = state.zone; $('period-filter').value = state.period; $('sort-reports').value = state.sort;
    $('result-count').textContent = reports.length;
    $('filter-summary').textContent = reports.length + ' matching example' + (reports.length === 1 ? '' : 's') + ' · ' + (state.zone === 'all' ? 'All neighborhoods' : zoneOf(state.zone).name);
    $('report-list').innerHTML = reports.length ? reports.slice(0, state.limit).map(cardMarkup).join('') : '<div class="empty-state">' + icon('search') + '<h3>No matching examples</h3><p>Try another category or reset your filters.</p></div>';
    $('load-more').hidden = reports.length <= state.limit;
    drawMaps();
  }
  function setZone(id, fromHome) {
    if (!zoneOf(id)) return;
    state.zone = !fromHome && state.zone === id ? 'all' : id; state.limit = 8;
    renderExplorer();
    if (fromHome) window.location.hash = '#explore';
  }
  function openDialog(dialog) { if (dialog.open) return; if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', ''); }
  function closeDialog(dialog) { if (dialog.close) dialog.close(); else dialog.removeAttribute('open'); }
  function openReport() {
    $('report-form').reset(); $('new-date').max = today(); $('new-date').value = today();
    if (state.zone !== 'all') $('new-zone').value = state.zone;
    $('report-form').hidden = false; $('report-success').hidden = true; $('report-error').hidden = true;
    openDialog($('report-dialog'));
  }
  function details(id) {
    const r = allReports().find(item => item.id === id); if (!r) return;
    const c = categoryOf(r.category);
    $('detail-title').textContent = r.title;
    $('detail-content').innerHTML = '<div class="button-row"><span class="tag' + (r.status === 'approved' ? ' local' : '') + '">' + (r.status === 'approved' ? 'Approved locally · fictional demo' : 'Bundled fictional example') + '</span><span class="small muted">' + esc(r.id) + '</span></div><p class="detail-description">' + esc(r.description) + '</p><dl class="detail-meta"><div><dt>Neighborhood</dt><dd>' + esc(zoneOf(r.zone).name) + '</dd></div><div><dt>Category</dt><dd>' + c.label + '</dd></div><div><dt>Date</dt><dd>' + prettyDate(r.date) + '</dd></div><div><dt>Time of day</dt><dd>' + r.period + '</dd></div></dl><div class="notice compact small">A demo entry does not establish an incident, a neighborhood’s safety, or the experience of everyone in that area.</div><div class="detail-footer"><span class="small muted">No identifying details or precise coordinates.</span>' + (r.status === 'example' ? '<button type="button" class="text-button" data-flag-id="' + r.id + '">' + (state.flags.includes(r.id) ? 'Remove local flag' : 'Flag for local review') + '</button>' : '<a href="#review" data-detail-review>Review this local entry ↗</a>') + '</div>';
    openDialog($('detail-dialog'));
  }
  function submitReport(event) {
    event.preventDefault();
    const form = $('report-form'); if (!form.reportValidity()) return;
    const values = new FormData(form);
    const r = { id: 'LOCAL-' + (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2)), zone: values.get('zone'), category: values.get('category'), date: values.get('date'), period: values.get('period'), title: String(values.get('title') || '').trim(), description: String(values.get('description') || '').trim(), status: 'pending', synthetic: true };
    let error = '';
    if (!validLocal(r) || !values.get('consent')) error = 'Check the fields, date, and fictional-information agreement.';
    else if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|(?:\d[\s()+.-]*){10,}/i.test(r.title + ' ' + r.description)) error = 'Please remove email addresses and long phone-like numbers. Use fictional information without contact details.';
    else if (state.reports.length >= 200) error = 'This demo supports 200 local entries. Export and clear your local entries in About to start again.';
    if (error) { $('report-error').textContent = error; $('report-error').hidden = false; return; }
    state.reports.unshift(r); saveLocal();
    $('report-form').hidden = true; $('report-success').hidden = false;
    $('report-success-message').textContent = 'Reference ' + r.id + '. ' + (storageAvailable ? 'Saved only in this browser.' : 'Browser storage is unavailable; this entry lasts only while this page is open.');
    $('go-review').focus(); renderReview();
  }
  function renderReview() {
    document.querySelectorAll('[data-review-status]').forEach(button => {
      const status = button.dataset.reviewStatus, active = status === state.reviewStatus;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
      button.textContent = ({ pending: 'Pending', approved: 'Approved locally', rejected: 'Rejected locally' })[status] + ' (' + state.reports.filter(r => r.status === status).length + ')';
    });
    const list = state.reports.filter(r => r.status === state.reviewStatus);
    $('review-list').innerHTML = list.length ? list.map(r => '<article class="review-card"><span class="tag local">Local demo · ' + r.status + '</span><h3>' + esc(r.title) + '</h3><p class="small muted">' + esc(zoneOf(r.zone).name) + ' · ' + categoryOf(r.category).label + ' · ' + prettyDate(r.date) + '</p><p>' + esc(r.description) + '</p><div class="button-row">' + (r.status !== 'approved' ? '<button type="button" class="button button-small" data-review-action="approved" data-id="' + r.id + '">Approve locally</button>' : '') + (r.status !== 'rejected' ? '<button type="button" class="button button-outline button-small" data-review-action="rejected" data-id="' + r.id + '">Reject locally</button>' : '') + (r.status !== 'pending' ? '<button type="button" class="text-button" data-review-action="pending" data-id="' + r.id + '">Return to pending</button>' : '') + '</div></article>').join('') : '<div class="empty-state">' + icon('shield') + '<h3>No ' + state.reviewStatus + ' entries</h3><p>Add a fictional demo report to try the local review flow.</p></div>';
    $('flags-list').innerHTML = state.flags.length ? state.flags.map(id => { const r = D.reports.find(report => report.id === id); return '<div class="flag-item"><span><strong>' + esc(r.title) + '</strong><br>' + esc(zoneOf(r.zone).name) + ' · ' + id + ' · flag stays in this browser</span><button type="button" class="text-button" data-unflag="' + id + '">Remove flag</button></div>'; }).join('') : '<p class="small muted">No examples flagged locally. You can flag a bundled example from its detail panel.</p>';
    $('export-local').disabled = state.reports.length === 0 && state.flags.length === 0;
  }
  function renderResources() {
    const term = $('resource-search').value.trim().toLowerCase();
    const items = D.resources.filter(r => [r.title, r.category, r.provider, r.description].join(' ').toLowerCase().includes(term));
    $('resource-list').innerHTML = items.length ? items.map(r => '<article class="resource-card"><div class="resource-top"><span class="feature-icon">' + icon(r.icon) + '</span><span class="tag">' + esc(r.category) + '</span></div><h2>' + esc(r.title) + '</h2><span class="resource-provider">' + esc(r.provider) + '</span><p>' + esc(r.description) + '</p><div class="resource-links"><a class="text-link" href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">Visit official website ' + icon('external') + '</a>' + (r.phone ? '<a href="tel:' + r.phone + '">Call ' + r.phone + '</a>' : '') + '</div><a class="source-link" href="' + esc(r.source) + '" target="_blank" rel="noopener noreferrer">Source &amp; current details ↗</a></article>').join('') : '<div class="empty-state"><h3>No matching resources</h3><p>Try “emergency”, “women”, “online”, or “SDG”.</p></div>';
  }

  function resetModel() {
    state.model = null;
    $('model-mae').textContent = '—'; $('baseline-mae').textContent = '—'; $('validation-weeks').textContent = '—';
    $('model-chart').innerHTML = '<p>Choose a dataset and fit the model to see its results.</p>';
    $('forecast-result').textContent = ''; $('model-comparison').textContent = 'Fit the model to compare its error with a simple baseline.'; $('split-summary').textContent = '';
    $('download-model').disabled = true; $('validation-table-wrap').hidden = true; $('toggle-data').textContent = 'Show validation table'; $('model-area').innerHTML = '';
  }
  function trainModel(announce = true) {
    try {
      state.model = ML.run(state.weekly);
      const m = state.model;
      $('model-mae').textContent = fmt(m.mae); $('baseline-mae').textContent = fmt(m.baselineMAE); $('validation-weeks').textContent = m.testWeeks;
      $('model-area').innerHTML = m.areas.map(area => '<option value="' + esc(area) + '">' + esc(area) + '</option>').join('');
      const better = m.mae < m.baselineMAE;
      $('model-comparison').textContent = 'On the held-out weeks, the model missed by ' + fmt(m.mae) + ' reports per area per week on average. Repeating last week’s count missed by ' + fmt(m.baselineMAE) + '. ' + (better ? 'The model has lower error on this dataset.' : 'The simple baseline performs as well as or better than the model; it should be preferred for this comparison.') + (state.source === 'synthetic' ? ' These are synthetic-data results, not real-world validation.' : ' These imported-data results do not validate a safety prediction.');
      $('split-summary').textContent = m.trainRows + ' training rows through ' + prettyDate(m.trainEnd) + '; ' + m.testRows + ' validation rows from ' + prettyDate(m.splitWeek) + ' to ' + prettyDate(m.timeline.at(-1)) + '. Evaluation uses observed prior-week counts, one week at a time. The first four weeks are lag history.';
      $('download-model').disabled = false; $('csv-error').hidden = true;
      renderModelArea();
      if (announce) toast('Model fitted and evaluated on ' + m.testRows + ' held-out rows.');
    } catch (error) {
      resetModel(); $('csv-error').textContent = error.message; $('csv-error').hidden = false;
    }
  }
  function renderModelArea() {
    const m = state.model; if (!m) return;
    const area = $('model-area').value;
    const history = state.weekly.filter(r => r.area.trim() === area).sort((a, b) => a.week.localeCompare(b.week)).slice(-14);
    const test = m.evaluated.filter(r => r.area === area); const forecast = m.forecast.find(r => r.area === area);
    const W = 760, H = 300, left = 48, top = 24, right = 28, bottom = 46;
    const max = Math.max(4, ...history.map(r => r.report_count), ...test.map(r => r.predicted), forecast.upper) * 1.1;
    const x = i => left + i * (W - left - right) / history.length;
    const y = value => top + (1 - value / max) * (H - top - bottom);
    const series = history.map((r, i) => x(i).toFixed(2) + ',' + y(r.report_count).toFixed(2)).join(' ');
    const testPoints = history.map((r, i) => ({ i, point: test.find(t => t.week === r.week) })).filter(r => r.point);
    const predictionLine = testPoints.map(r => x(r.i).toFixed(2) + ',' + y(r.point.predicted).toFixed(2)).join(' ');
    const ticks = Array.from({ length: 5 }, (_, i) => max * i / 4);
    $('model-chart').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(area) + ': recent observed weekly report counts, validation estimates, and a next-week estimate of ' + fmt(forecast.estimate) + '. Exact validation values are available in the table below."><title>' + esc(area) + ' — report count experiment</title>'
      + ticks.map(v => '<line x1="' + left + '" x2="' + (W - right) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#e7ece4"/><text x="' + (left - 12) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="#718073">' + Math.round(v) + '</text>').join('')
      + '<text x="' + left + '" y="12" font-size="10" fill="#718073">REPORTS / WEEK</text><polyline points="' + series + '" fill="none" stroke="#226b5b" stroke-width="3" stroke-linejoin="round"/><polyline points="' + predictionLine + '" fill="none" stroke="#bd7c41" stroke-width="2.5" stroke-dasharray="6 4"/>'
      + history.map((r, i) => '<circle cx="' + x(i) + '" cy="' + y(r.report_count) + '" r="3" fill="#226b5b"><title>' + shortDate(r.week) + ': ' + r.report_count + ' observed reports</title></circle>').join('')
      + '<line x1="' + x(history.length - 1) + '" x2="' + x(history.length) + '" y1="' + y(history.at(-1).report_count) + '" y2="' + y(forecast.estimate) + '" stroke="#82658e" stroke-dasharray="4 4"/><line x1="' + x(history.length) + '" x2="' + x(history.length) + '" y1="' + y(forecast.upper) + '" y2="' + y(forecast.lower) + '" stroke="#82658e" stroke-width="10" opacity=".18"/><circle cx="' + x(history.length) + '" cy="' + y(forecast.estimate) + '" r="5" fill="#82658e"><title>Next week: ' + fmt(forecast.estimate) + '; illustrative range ' + fmt(forecast.lower) + '–' + fmt(forecast.upper) + '</title></circle>'
      + [0, Math.floor(history.length / 2), history.length - 1].map(i => '<text x="' + x(i) + '" y="' + (H - 18) + '" text-anchor="middle" font-size="11" fill="#718073">' + shortDate(history[i].week) + '</text>').join('')
      + '<text x="' + x(history.length) + '" y="' + (H - 3) + '" text-anchor="end" font-size="10" fill="#82658e">NEXT</text></svg>';
    $('forecast-result').innerHTML = '<div><span class="eyebrow">NEXT-WEEK COUNT EXPERIMENT</span><h3>' + esc(area) + '</h3><p>Week of ' + prettyDate(forecast.week) + ' · Illustrative error range ' + fmt(forecast.lower) + '–' + fmt(forecast.upper) + '</p><p class="small muted">Not a confidence interval or safety rating.</p></div><div class="forecast-value"><strong>' + fmt(forecast.estimate) + '</strong><span>estimated reports</span></div>';
    $('validation-table-wrap').innerHTML = '<table><caption>Held-out weekly values for ' + esc(area) + '</caption><thead><tr><th scope="col">Week</th><th scope="col">Observed</th><th scope="col">Model estimate</th><th scope="col">Baseline</th></tr></thead><tbody>' + test.map(r => '<tr><th scope="row">' + prettyDate(r.week) + '</th><td>' + r.actual + '</td><td>' + fmt(r.predicted) + '</td><td>' + r.baseline + '</td></tr>').join('') + '</tbody></table>';
  }
  async function importCSV(event) {
    const file = event.target.files[0]; if (!file) return;
    const token = ++importToken;
    if (!$('csv-consent').checked) { $('csv-error').textContent = 'Please confirm the aggregated-data agreement before importing.'; $('csv-error').hidden = false; event.target.value = ''; return; }
    if (file.size > 1000000) { $('csv-error').textContent = 'Please use a CSV smaller than 1 MB.'; $('csv-error').hidden = false; event.target.value = ''; return; }
    try {
      const text = await file.text(); if (token !== importToken) return;
      const rows = ML.parseCSV(text), dataset = ML.validate(rows);
      // Normalize names once so filtering, model inputs, and exported labels agree.
      state.weekly = dataset.areas.flatMap(area => dataset.byArea.get(area));
      state.source = 'imported'; state.filename = file.name;
      resetModel(); $('dataset-badge').textContent = 'Imported data · unvalidated';
      $('dataset-status').textContent = rows.length + ' records · ' + dataset.areas.length + ' areas · ' + dataset.timeline.length + ' weeks. Imported in memory: ' + file.name;
      $('csv-error').hidden = true; trainModel();
    } catch (error) {
      if (token === importToken) { $('csv-error').textContent = error.message + ' Your previous dataset is unchanged.'; $('csv-error').hidden = false; }
    } finally { if (token === importToken) event.target.value = ''; }
  }
  function download(name, contents, type) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportModel() {
    const m = state.model; if (!m) return;
    const result = { project: 'SafeRoute', exportedAt: new Date().toISOString(), dataSource: state.source, inputFile: state.filename || 'bundled synthetic data', model: 'Ridge regression, alpha=1', schemaVersion: m.schemaVersion, target: 'Next-week submitted-report count, not personal risk or safety', featureOrder: [...m.areas.map(a => 'area=' + a), 'previous_week_count', 'previous_four_week_mean', 'week_index', 'sin_annual', 'cos_annual'], fitted: m.fitted, validationModel: m.validationModel, evaluation: { strategy: 'Chronological holdout; one-step forecasts with observed lag counts', firstValidationWeek: m.splitWeek, trainingRows: m.trainRows, validationRows: m.testRows, validationWeeks: m.testWeeks, mae: m.mae, baselineMAE: m.baselineMAE, rmse: m.rmse, empirical80thPercentileAbsoluteError: m.margin }, forecast: m.forecast, validation: m.evaluated, limitations: ['Synthetic results do not establish real-world performance.', 'Reported counts are affected by reporting access and missing data.', 'The error range is pooled across areas and is not a calibrated confidence interval.', 'No safety, incident, individual-risk, or routing prediction is made.'] };
    download('saferoute-model-report.json', JSON.stringify(result, null, 2), 'application/json'); toast('Model report exported as JSON.');
  }
  function route(initial = false) {
    const hash = window.location.hash.slice(1);
    if (hash === 'main') { $('main').focus(); return; }
    const next = routes.includes(hash) ? hash : 'home';
    document.querySelectorAll('[data-view]').forEach(section => { section.hidden = section.dataset.view !== next; });
    document.querySelectorAll('[data-route]').forEach(link => { if (link.dataset.route === next) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
    $('main-nav').classList.remove('open'); $('menu-toggle').setAttribute('aria-expanded', 'false'); $('menu-toggle').setAttribute('aria-label', 'Open navigation');
    const changed = state.route !== next; state.route = next;
    const names = { home: 'Community information, thoughtfully shared', explore: 'Community explorer', insights: 'Insights lab', resources: 'Support & information', about: 'About & privacy', review: 'Local review workspace' };
    document.title = 'SafeRoute — ' + names[next];
    if (next === 'explore') renderExplorer(); if (next === 'review') renderReview();
    if (next === 'insights' && !state.model) trainModel(false);
    if (!initial && changed) { $('main').focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }
  }

  loadLocal();
  $('zone-filter').insertAdjacentHTML('beforeend', D.zones.map(z => '<option value="' + z.id + '">' + z.name + '</option>').join(''));
  $('new-zone').innerHTML = D.zones.map(z => '<option value="' + z.id + '">' + z.name + '</option>').join('');
  $('new-category').innerHTML = D.categories.map(c => '<option value="' + c.id + '">' + c.label + '</option>').join('');
  $('new-date').max = today();
  renderChips(); renderExplorer(); renderResources(); renderReview(); route(true);

  window.addEventListener('hashchange', () => route());
  $('menu-toggle').addEventListener('click', () => { const open = $('main-nav').classList.toggle('open'); $('menu-toggle').setAttribute('aria-expanded', String(open)); $('menu-toggle').setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { $('main-nav').classList.remove('open'); $('menu-toggle').setAttribute('aria-expanded', 'false'); $('menu-toggle').setAttribute('aria-label', 'Open navigation'); }
    const zone = event.target.closest && event.target.closest('[data-map-zone]');
    if (zone && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); const id = zone.dataset.mapZone, home = zone.dataset.mapHome === 'true';
      setZone(id, home);
      if (!home) { const replacement = $('explorer-map').querySelector('[data-map-zone="' + id + '"]'); if (replacement) replacement.focus(); }
    }
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('button,a,[data-map-zone]'); if (!button) return;
    if (button.matches('[data-open-report]')) openReport();
    if (button.matches('[data-close-dialog]')) closeDialog(button.closest('dialog'));
    if (button.matches('[data-report-id]')) details(button.dataset.reportId);
    if (button.matches('[data-map-zone]')) setZone(button.dataset.mapZone, button.dataset.mapHome === 'true');
    if (button.matches('[data-category]')) { state.category = button.dataset.category; state.limit = 8; renderChips(); renderExplorer(); const active = $('category-filters').querySelector('[data-category="' + state.category + '"]'); if (active) active.focus(); }
    if (button.matches('[data-review-status]')) { state.reviewStatus = button.dataset.reviewStatus; renderReview(); }
    if (button.matches('[data-review-action]')) { const r = state.reports.find(item => item.id === button.dataset.id); if (r && ['pending', 'approved', 'rejected'].includes(button.dataset.reviewAction)) { r.status = button.dataset.reviewAction; const saved = saveLocal(); renderReview(); renderExplorer(); if (saved) toast('Entry marked ' + r.status + ' in this browser.'); } }
    if (button.matches('[data-flag-id]')) { const id = button.dataset.flagId; if (!D.reports.some(r => r.id === id)) return; if (state.flags.includes(id)) state.flags = state.flags.filter(f => f !== id); else state.flags.push(id); const saved = saveLocal(); details(id); renderReview(); if (saved) toast(state.flags.includes(id) ? 'Flagged locally. No organization was contacted.' : 'Local flag removed.'); }
    if (button.matches('[data-unflag]')) { state.flags = state.flags.filter(id => id !== button.dataset.unflag); const saved = saveLocal(); renderReview(); if (saved) toast('Local flag removed.'); }
    if (button.matches('[data-detail-review]')) closeDialog($('detail-dialog'));
  });
  $('report-search').addEventListener('input', event => { state.search = event.target.value.trim().toLowerCase(); state.limit = 8; renderExplorer(); });
  $('zone-filter').addEventListener('change', event => { state.zone = event.target.value; state.limit = 8; renderExplorer(); });
  $('period-filter').addEventListener('change', event => { state.period = event.target.value; state.limit = 8; renderExplorer(); });
  $('sort-reports').addEventListener('change', event => { state.sort = event.target.value; renderExplorer(); });
  $('clear-filters').addEventListener('click', () => { state.search = ''; state.category = 'all'; state.zone = 'all'; state.period = 'all'; state.sort = 'newest'; state.limit = 8; $('report-search').value = ''; renderChips(); renderExplorer(); });
  $('load-more').addEventListener('click', () => { state.limit += 8; renderExplorer(); });
  $('zoom-in').addEventListener('click', () => { state.zoom = Math.min(1.6, +(state.zoom + .2).toFixed(1)); drawMaps(); });
  $('zoom-out').addEventListener('click', () => { state.zoom = Math.max(1, +(state.zoom - .2).toFixed(1)); drawMaps(); });
  $('zoom-reset').addEventListener('click', () => { state.zoom = 1; drawMaps(); });
  $('report-form').addEventListener('submit', submitReport);
  $('go-review').addEventListener('click', () => { closeDialog($('report-dialog')); if (state.route === 'review') { renderReview(); $('main').focus(); } });
  $('resource-search').addEventListener('input', renderResources);
  $('clear-local').addEventListener('click', () => openDialog($('confirm-dialog')));
  $('confirm-clear').addEventListener('click', () => {
    try { localStorage.removeItem(KEY); state.reports = []; state.flags = []; closeDialog($('confirm-dialog')); renderExplorer(); renderReview(); toast('Your local demo data was deleted from this browser.'); }
    catch (_) { state.reports = []; state.flags = []; closeDialog($('confirm-dialog')); renderExplorer(); renderReview(); toast('Cleared this page. Storage is blocked; use browser site settings to remove any older saved data.'); }
  });
  $('export-local').addEventListener('click', () => download('saferoute-local-demo.json', JSON.stringify({ project: 'SafeRoute', warning: 'Fictional local demo entries. No public reporting service.', exportedAt: new Date().toISOString(), reports: state.reports, flaggedExampleIds: state.flags }, null, 2), 'application/json'));
  $('csv-upload').addEventListener('change', importCSV);
  $('use-sample').addEventListener('click', () => { importToken++; state.weekly = D.weekly; state.source = 'synthetic'; state.filename = ''; $('csv-upload').value = ''; $('csv-consent').checked = false; $('dataset-badge').textContent = 'Synthetic example data'; $('dataset-status').textContent = '312 records across 6 fictional areas. 52 complete weeks.'; resetModel(); trainModel(); });
  $('train-model').addEventListener('click', () => trainModel());
  $('model-area').addEventListener('change', renderModelArea);
  $('download-model').addEventListener('click', exportModel);
  $('toggle-data').addEventListener('click', () => { if (!state.model) { toast('Fit a model first to view the validation table.'); return; } const container = $('validation-table-wrap'); container.hidden = !container.hidden; $('toggle-data').textContent = container.hidden ? 'Show validation table' : 'Hide validation table'; });
})();
