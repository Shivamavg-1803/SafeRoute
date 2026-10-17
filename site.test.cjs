'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'assets/js/app.js'), 'utf8');
const files = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);

test('HTML has unique IDs and every fixed app binding has a target', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size, 'HTML IDs must be unique.');
  for (const match of app.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(match[1]), 'Missing #' + match[1]);
  for (const route of ['home', 'explore', 'insights', 'resources', 'about', 'review']) assert.ok(html.includes('data-view="' + route + '"'));
});

test('all local HTML references and Markdown file links resolve', () => {
  for (const file of files(root).filter(f => /\.(html|md)$/.test(f))) {
    const text = fs.readFileSync(file, 'utf8');
    const matches = file.endsWith('.html') ? [...text.matchAll(/(?:src|href)="([^"]+)"/g)] : [...text.matchAll(/\]\(([^)]+)\)/g)];
    for (const match of matches) {
      const ref = match[1]; if (/^(?:https?:|tel:|mailto:|#|data:)/.test(ref)) continue;
      assert.ok(!ref.startsWith('/'), 'Root-relative path would break repository hosting: ' + ref);
      const target = path.resolve(path.dirname(file), ref.split('#')[0]);
      assert.ok(target.startsWith(root + path.sep), 'Path leaves project: ' + ref);
      assert.ok(fs.existsSync(target), 'Missing ' + ref + ' from ' + path.relative(root, file));
    }
  }
});

test('scripts parse and load in the intended dependency order', () => {
  const scripts = [...html.matchAll(/<script defer src="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(scripts, ['assets/js/data.js', 'assets/js/model.js', 'assets/js/app.js']);
  for (const script of scripts) new vm.Script(fs.readFileSync(path.join(root, script), 'utf8'), { filename: script });
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), 'No inline script expected with this CSP.');
  assert.ok(!/\son(?:click|load|error|submit)=/i.test(html), 'No inline event handler expected.');
});

test('static app has no runtime API request or external script dependency', () => {
  for (const file of ['assets/js/app.js', 'assets/js/data.js', 'assets/js/model.js']) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon\s*\(/.test(text), 'Unexpected network API in ' + file);
    assert.ok(!/\beval\s*\(|new\s+Function\s*\(/.test(text), 'Dynamic code evaluation in ' + file);
  }
  assert.ok(html.includes("connect-src 'none'"));
  assert.ok(!/<script[^>]*src="https?:/i.test(html));
  assert.ok(fs.existsSync(path.join(root, '.nojekyll')));
});
