// Public installed-layout regression: never supply full-tier fixtures to core.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const installer = new URL('../adopt.mjs', import.meta.url);
const bundled = existsSync(fileURLToPath(installer));
for (const tier of ['core', 'governed', 'full']) {
  test(`fresh ${tier} adoption runs intake checks and handoff tests`, { skip: !bundled && 'installer is bundle-only; this scenario runs in source CI' }, async () => {
    const { install } = await import(installer.href);
    const cwd = mkdtempSync(join(tmpdir(), 'loom-intake-install-'));
    try {
      install(cwd, { tier });
      for (const args of [
        ['scripts/intake-check.mjs'],
        ['--test', 'scripts/intake-check.test.mjs', 'scripts/intake-record.test.mjs', 'scripts/intake-session.test.mjs'],
      ]) {
        const result = spawnSync(process.execPath, args, { cwd, encoding: 'utf8' });
        assert.equal(result.status, 0, `${tier}: ${result.stdout}\n${result.stderr}`);
      }
      for (const args of [['scripts/intake-check.mjs', '--record'], ['scripts/intake-check.mjs', '--record', 'missing-record.json']]) {
        const result = spawnSync(process.execPath, args, { cwd, encoding: 'utf8' });
        assert.equal(result.status, 2, 'an explicitly requested missing record is not a successful empty check');
      }
    } finally { rmSync(cwd, { recursive: true, force: true }); }
  });
}
