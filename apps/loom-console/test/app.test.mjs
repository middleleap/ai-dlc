// The app around the data: the static build carries exactly the UI, the data and the committed
// wireframes; the page makes no network call beyond its own origin; the local server is read-only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite, WEB } from '../src/build.mjs';
import { createConsoleServer } from '../src/serve.mjs';
import { meridianInstallation, HARNESS } from '../src/demo.mjs';

const skip = !existsSync(join(HARNESS, 'brainkit-example')) && 'the Meridian demo is bundle-only';
const NOW = Date.parse('2026-09-24T09:00:00Z');
let A = null, OUT = null;
if (!skip) { A = await meridianInstallation(); OUT = mkdtempSync(join(tmpdir(), 'loom-console-site-')); }
process.on('exit', () => { for (const d of [A, OUT]) if (d) rmSync(d, { recursive: true, force: true }); });

test('the build is the UI, the data and the committed wireframes, byte for byte', { skip }, async () => {
  const r = await buildSite(A, OUT, { now: NOW });
  assert.deepEqual(readdirSync(OUT).sort(), ['app.css', 'app.js', 'artifacts', 'console.json', 'index.html']);
  assert.equal(r.artifacts, 3);
  for (const run of r.data.runs.filter((x) => x.prototype)) {
    assert.ok(readFileSync(join(OUT, run.prototype.site_wireframe)).equals(readFileSync(join(A, run.prototype.wireframe))), run.slug);
  }
  const data = JSON.parse(readFileSync(join(OUT, 'console.json'), 'utf8'));
  assert.equal(data.authority, 'none');
});

test('the page reaches nothing beyond its own origin', () => {
  const html = readFileSync(join(WEB, 'index.html'), 'utf8');
  assert.match(html, /default-src 'self'; script-src 'self';/);
  assert.match(html, /form-action 'none'/);
  for (const f of ['index.html', 'app.js', 'app.css']) {
    const t = readFileSync(join(WEB, f), 'utf8');
    assert.doesNotMatch(t, /https?:\/\/(?!127\.0\.0\.1)/, `${f} must not reference an external host`);
    assert.doesNotMatch(t, /<form|method=["']?post/i, `${f} has no form`);
  }
  assert.doesNotMatch(readFileSync(join(WEB, 'app.js'), 'utf8'), /fetch\((?!'console\.json')/, 'the only fetch is console.json');
});

test('the local server is read-only and serves only the UI, the data and named wireframes', { skip }, async () => {
  const srv = createConsoleServer(A, { now: NOW });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  try {
    assert.equal((await fetch(base + '/')).status, 200);
    const data = await (await fetch(base + '/console.json')).json();
    assert.equal(data.runs.length, 6);
    assert.equal((await fetch(base + '/artifacts/plain-language-decline/wireframe.html')).status, 200);
    for (const m of ['POST', 'PUT', 'DELETE', 'PATCH']) assert.equal((await fetch(base + '/console.json', { method: m })).status, 405, m);
    for (const p of ['/docs/governance/identities.json', '/../package.json', '/artifacts/../../etc/passwd', '/discovery/runs/cross-bank-money/research-log.md']) {
      assert.equal((await fetch(base + p)).status, 404, p);
    }
  } finally { srv.close(); }
});
