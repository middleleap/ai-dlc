// scripts/ci/local.mjs reads .github/workflows/validate.yml so local runs cannot drift from CI.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseSteps } from './ci/local.mjs';

test('every step of the real workflow is understood (uses: steps skipped, none dropped)', () => {
  const text = readFileSync(new URL('../.github/workflows/validate.yml', import.meta.url), 'utf8');
  const names = (text.match(/^      - name: /gm) ?? []).length;
  const steps = parseSteps(text);
  assert.equal(steps.length, names, 'one runnable step per named step');
  assert.ok(steps.every((s) => typeof s.run === 'string' && s.run.trim()), 'every step has a command');
  assert.ok(steps.some((s) => s.run === 'bash scripts/ci/loom-dry-run.sh'), 'the extracted dry-run is called');
});

test('a literal run block keeps its lines and working-directory', () => {
  const y = ['jobs:', '  j:', '    steps:', '      - uses: actions/checkout@v4',
    '      - name: two lines', '        working-directory: sub/dir', '        run: |', '          echo a', '', '          echo b', ''].join('\n');
  const [s] = parseSteps(y);
  assert.deepEqual(s, { name: 'two lines', uses: false, cwd: 'sub/dir', run: 'echo a\n\necho b' });
});

test('a step shape the parser does not understand is an error, not a silent skip', () => {
  const y = ['      - name: odd', '        run: >', '          folded'].join('\n');
  assert.throws(() => parseSteps(y), /has no run: this parser understands/);
});
