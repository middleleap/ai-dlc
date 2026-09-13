// One rule for a repository-relative path, shared by every script that resolves one.
// Four copies once disagreed about `./x`, backslashes and drive letters; a path-safety fix
// made in one place and missed in another is exactly the gap this file closes.
import {lstatSync} from 'node:fs';
import {join} from 'node:path';

const SEGMENT_OK = p => p !== '' && p !== '.' && p !== '..';

/** Throws unless `rel` is a plain, forward-slash, non-traversing path with no root, drive or NUL. */
export function assertRepoRelative(rel, what = 'repository path') {
  if (typeof rel !== 'string' || !rel || rel.startsWith('/') || rel.includes('\\') || rel.includes(':') || rel.includes('\0') || !rel.split('/').every(SEGMENT_OK)) {
    throw new Error(`Unsafe ${what}: ${rel}`);
  }
  return rel;
}

export function isRepoRelative(rel) {
  try { assertRepoRelative(rel); return true; } catch { return false; }
}

/** Resolves `rel` under `root`, refusing any symlink on the way (a missing segment is fine). */
export function resolveNoSymlink(root, rel, what = 'repository path') {
  assertRepoRelative(rel, what);
  let path = root;
  for (const part of rel.split('/')) {
    path = join(path, part);
    let stat;
    try { stat = lstatSync(path); } catch (e) { if (e.code === 'ENOENT') continue; throw e; }
    if (stat.isSymbolicLink()) throw new Error(`Symlink is not a ${what}: ${rel}`);
  }
  return path;
}
