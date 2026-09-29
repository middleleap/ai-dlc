// scripts/ci/local.mjs reads .github/workflows/validate.yml so local runs cannot drift from CI.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseSteps, parseArgs, failureHint, runnerEnv } from './ci/local.mjs';

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

test('a step that starts with id: is a new step, not an overwrite of the previous one', () => {
  const y = ['      - name: first', '        run: echo first', '      - id: probe', '        name: second', '        run: echo second'].join('\n');
  const steps = parseSteps(y);
  assert.deepEqual(steps.map((s) => s.run), ['echo first', 'echo second']);
});

test('step keys the runner cannot honour locally are an error, not silently ignored', () => {
  for (const key of ['if: always()', 'continue-on-error: true', 'shell: sh', 'timeout-minutes: 5', 'env:']) {
    const y = ['      - name: s', `        ${key}`, '          X: 1', '        run: echo s'].join('\n');
    assert.throws(() => parseSteps(y), /cannot run locally|not understood/, key);
  }
});

test('comments and a uses: step with a with: block are tolerated', () => {
  const y = ['      - uses: actions/checkout@v4', '        with:', '          # full history', '          fetch-depth: 0',
    '      # a comment between steps', '      - name: s', '        # a comment inside a step', '        run: echo s'].join('\n');
  assert.deepEqual(parseSteps(y).map((s) => s.run), ['echo s']);
});

test('--from must be a step number', () => {
  assert.throws(() => parseArgs(['--from']), /--from needs a step number/);
  assert.throws(() => parseArgs(['--from', 'x']), /--from needs a step number/);
  assert.equal(parseArgs(['--from', '12']).from, 12);
});

test('a failure says how to resume with the same scratch dir (later steps reuse the dry-run tree)', () => {
  const hint = failureHint(12, 'Loom bundle — negative bypass', '/tmp/ci-local-abc');
  assert.match(hint, /RUNNER_TEMP=\/tmp\/ci-local-abc node scripts\/ci\/local\.mjs --from 12/);
});

test('the runner env keeps GITHUB_ENV inside RUNNER_TEMP, so a resumed run finds it', () => {
  const env = runnerEnv({ RUNNER_TEMP: '/tmp/x' }, '/tmp/fresh');
  assert.equal(env.RUNNER_TEMP, '/tmp/x');
  assert.equal(env.GITHUB_ENV, '/tmp/x/github-env');
});
