// The Open Finance prototyping kit (open-finance-uiux): large templates are real HTML files the
// skill names by path, placeholders survive, and the kit agrees with itself.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const K = new URL('../plugins/middleleap-open-finance-uae/skills/open-finance-uiux/', import.meta.url);
const read = (p) => readFileSync(new URL(p, K), 'utf8');

test('the three large templates are HTML files the skill names by path', () => {
  for (const t of ['presentation', 'consent-flow', 'app-flow']) {
    assert.ok(existsSync(new URL(`assets/templates/${t}.html`, K)), `${t}.html missing`);
    assert.match(read('SKILL.md'), new RegExp(`assets/templates/${t}\\.html`));
  }
});

test('placeholders survive the move', () => {
  const count = (s) => (s.match(/\{\{[A-Z0-9_]+\}\}/g) ?? []).length;
  assert.ok(count(read('assets/templates/presentation.html')) >= 60, 'presentation placeholders: 69 at the move; the rest are in the blueprint fill-in table');
  assert.ok(count(read('assets/templates/app-flow.html')) > 0, 'app-flow placeholders');
  assert.match(read('assets/templates/consent-flow.html'), /<!-- INSERT DARK LOGO SVG/);
});

test('no blueprint keeps a fenced block over 300 lines', () => {
  for (const f of ['app-context-blueprint', 'html-blueprint', 'presentation-blueprint']) {
    const lines = read(`references/${f}.md`).split('\n'); let open = -1;
    lines.forEach((l, i) => {
      if (/^```/.test(l)) { if (open < 0) open = i; else { assert.ok(i - open < 300, `${f}.md:${open + 1} block is ${i - open} lines`); open = -1; } }
    });
  }
});

test('components inline logos and spinners, as svg-assets.md requires (no <img> to asset files)', () => {
  assert.doesNotMatch(read('references/component-library.md'), /<img src="assets\//);
});

test('the inline white logo matches its asset file (the dark logo keeps its own coordinate)', () => {
  const blocks = read('references/svg-assets.md').split(/^```/m).filter((_, i) => i % 2 === 1);
  const white = blocks[1]; // svg-assets.md order: dark logo, white logo, white mark, spinner
  assert.doesNotMatch(white, /351\.674/);
  assert.match(read('assets/logos/white-logo.svg'), /351\.679/);
});

test('the :root block declares every token the tables list', () => {
  const t = read('references/design-tokens.md');
  const root = t.slice(t.lastIndexOf(':root'));
  for (const v of ['--color-accent-green', '--color-unselected-border', '--color-checkbox-checked', '--gradient-spinner'])
    assert.match(root, new RegExp(v), v);
});
