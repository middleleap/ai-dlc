// Generate a drift observation for the bundled freeze example (Factory Floor WS4 · D4.2).
//
// WHY THIS IS GENERATED AND NOT COMMITTED. An observation carries the instant a page was looked at,
// and `drift-check` refuses one older than OBSERVATION_MAX_AGE_DAYS (7) wherever the plan compiles
// the capability. A committed, statically-dated observation would therefore pass for a week and
// then start failing every build for a reason that has nothing to do with the change under review —
// so it would be deleted, and the gate would go back to passing vacuously. Generating it keeps it
// perpetually fresh and faithful to how a real watcher produces one. The same argument is why
// validate.yml generates the platform-activation observation rather than shipping it.
//
//   node drift-example/observe.mjs                 → in sync with the freeze stamp
//   node drift-example/observe.mjs --drifted        → the page has moved on since the freeze
//
// Prints the observation to stdout. The caller decides where it lands.
//
// WHAT THIS IS NOT. It is not a watcher. A real watcher fetches the live page, exports it through
// `core/floor-export.mjs`, and hashes THAT — `core/floor-drift.mjs` exports `observe()` taking an
// injected reader for exactly that. Here the digest is copied from the freeze stamp (or mutated,
// with `--drifted`) because the bundle has no workspace to read. So this demonstrates the SHAPE and
// exercises the gate; it does not demonstrate that anybody looked at anything.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { driftObservation } from '../core/floor-drift.mjs';

const H = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stamp = JSON.parse(readFileSync(`${H}/freeze-example/data-governance.freeze.json`, 'utf8'));

const drifted = process.argv.includes('--drifted');
// A drifted digest must be a plausible-looking sha256, not a marker string: the gate compares
// digests for equality and a reader should not be able to tell "drifted" from "malformed".
const digest = drifted
  ? `sha256:${'d'.repeat(8)}${stamp.digest.slice(15)}`
  : stamp.digest;

process.stdout.write(`${JSON.stringify(driftObservation({
  source: stamp.source,
  digest,
  observedAt: new Date().toISOString(),
  // NOT the freezer. An observation by the identity that wrote the freeze is self-corroboration
  // and `driftState()` refuses to count it (DR-F06). `padmin-zoe` is the platform-admin observer
  // the bundle already uses for activation evidence.
  observedBy: 'padmin-zoe',
}), null, 2)}\n`);
