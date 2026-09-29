// "One brand, everywhere": the Loom's Meridian brand profile (harness discovery/brand/examples/
// meridian-trust.design.md) is a token projection of the meridian-brand-guidelines skill. This
// binds the two, so a change on one side without the other fails the build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const at = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const css = at('plugins/middleleap-loom-demo/skills/meridian-brand-guidelines/references/meridian-variables.css');
const md = at('plugins/middleleap-loom/skills/loom-adopt/harness/discovery/brand/examples/meridian-trust.design.md');
const v = (name) => (css.match(new RegExp(`--${name}:\\s*([^;]+);`)) ?? [])[1]?.trim();
const t = (key) => (md.match(new RegExp('\\|\\s*`' + key.replace(/\./g, '\\.') + '`\\s*\\|\\s*`([^`]+)`')) ?? [])[1]?.trim();
const norm = (s) => s?.replace(/["']/g, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').toLowerCase();

const PAIRS = [
  ['mt-blue', 'color.brand.primary'], ['mt-cyan', 'color.brand.signature'], ['mt-amber', 'color.brand.highlight'],
  ['mt-mist', 'color.brand.tint'], ['mt-success', 'color.brand.accent'], ['mt-warning', 'color.status.warn'],
  ['mt-danger', 'color.status.danger'], ['mt-gray-bg', 'color.surface.bg'], ['mt-midnight', 'color.ink.strong'],
  ['mt-midnight', 'color.surface.hero'], ['mt-slate', 'color.ink.muted'], ['mt-silver-light', 'color.border.subtle'],
  ['mt-font', 'font.family.sans'], ['mt-font-mono', 'font.family.mono'],
];

test('the Loom brand profile projects the Meridian skill tokens exactly', () => {
  for (const [c, d] of PAIRS) {
    assert.ok(v(c), `--${c} missing from meridian-variables.css`);
    assert.ok(t(d), `${d} missing from meridian-trust.design.md`);
    assert.equal(norm(t(d)), norm(v(c)), `--${c} vs ${d}`);
  }
});
