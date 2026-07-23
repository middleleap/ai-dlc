// The BrainKit digest + load helpers (Loom 2.0-rc.8 WS7). ONE place computes a BrainKit's section
// and package digests, so the policy compiler (which binds a plan to the live BrainKit digest) and
// the brainkit-check gate (which verifies the declared digests match the files) agree by
// construction. Pure Node, no dependency on the policy compiler — the compiler imports THIS, not
// the other way round, so there is no cycle.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

export const BRAINKIT_DIR = 'institution/brainkit';
export const LIFECYCLE = new Set(['draft', 'approved', 'retired']);
export const SECTION_KEYS = ['identity', 'terminology', 'architecture', 'technology-policy', 'governance', 'source-register'];

/** sha256 of a file's bytes, prefixed. */
export const fileDigest = (absPath) => 'sha256:' + createHash('sha256').update(readFileSync(absPath)).digest('hex');

/**
 * The whole-package digest: sha256 over the sorted "section\tdigest" lines. Deterministic and
 * order-independent, and it changes iff any section digest changes — so binding a plan to it makes
 * any BrainKit content change force recompilation.
 */
export function packageDigestFrom(sections) {
  const lines = [...sections].map((s) => `${s.section}\t${s.digest}`).sort().join('\n');
  return 'sha256:' + createHash('sha256').update(lines).digest('hex');
}

/** Recompute section + package digests from the ACTUAL files under brainkitDir. */
export function computeDigests(brainkitDir, manifest) {
  const sections = (manifest?.sections || []).map((s) => {
    const p = join(brainkitDir, s.path);
    return { section: s.section, path: s.path, digest: existsSync(p) ? fileDigest(p) : null };
  });
  const present = sections.filter((s) => s.digest).map((s) => ({ section: s.section, digest: s.digest }));
  return { sections, package_digest: packageDigestFrom(present) };
}

/** The live package digest the BrainKit hashes to right now — what the compiler binds a plan to. */
export function livePackageDigest(brainkitDir, manifest) {
  return computeDigests(brainkitDir, manifest).package_digest;
}

/** Load the BrainKit at cwd/rel, or null if there is none. On parse failure, returns parseError. */
export function loadBrainkit(cwd = process.cwd(), rel = BRAINKIT_DIR) {
  const dir = join(cwd, rel);
  const manifestPath = join(dir, 'manifest.json');
  if (!existsSync(manifestPath)) return null;
  try { return { dir, manifestPath, manifest: JSON.parse(readFileSync(manifestPath, 'utf8')) }; }
  catch (e) { return { dir, manifestPath, manifest: null, parseError: e.message }; }
}
