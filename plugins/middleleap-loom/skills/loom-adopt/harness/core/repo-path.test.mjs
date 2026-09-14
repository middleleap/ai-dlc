import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertRepoRelative, isRepoRelative, resolveNoSymlink } from './repo-path.mjs';

test('one rule for a repository-relative path: no root, drive, backslash, NUL, dot or traversal segment', () => {
  for (const ok of ['a', 'a/b.json', '.loom/project.json', 'docs/governance/x.md', 'a b/c']) assert.ok(isRepoRelative(ok), ok);
  for (const bad of ['', '/a', 'a/../b', '../a', './a', 'a/./b', 'a//b', 'a/', 'a\\b', 'C:x', 'a\0b', 42, null, undefined]) {
    assert.ok(!isRepoRelative(bad), String(bad));
    assert.throws(() => assertRepoRelative(bad, 'snapshot input'), /Unsafe snapshot input/);
  }
});

test('resolveNoSymlink joins under the root, tolerates missing segments and refuses any symlink on the way', () => {
  const root = mkdtempSync(join(tmpdir(), 'loom-repo-path-'));
  try {
    mkdirSync(join(root, 'real'));
    writeFileSync(join(root, 'real/file.txt'), 'x');
    symlinkSync(join(root, 'real'), join(root, 'link'));
    assert.equal(resolveNoSymlink(root, 'real/file.txt'), join(root, 'real/file.txt'));
    assert.equal(resolveNoSymlink(root, 'real/absent/deeper.txt'), join(root, 'real/absent/deeper.txt'));
    assert.throws(() => resolveNoSymlink(root, 'link/file.txt', 'pinned adapter input'), /Symlink is not a pinned adapter input: link\/file.txt/);
    assert.throws(() => resolveNoSymlink(root, '../real/file.txt'), /Unsafe repository path/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
