// The discovery-sync gate (rc.29). The Loom's discovery machinery exists TWICE: here, as the
// generic harness the bundle installs, and in `openfinance-os/ofbo` as the instantiation it was
// extracted from on 2026-07-17. Every hardening since then has landed HERE, and CLAUDE.md has
// carried the same standing note the whole time:
//
//   "must track upstream fixes made in ofbo/discovery/ (no automated sync; CI's adoption
//    dry-run catches breakage, not drift)"
//
// That is a promise with nothing behind it, and it is the same shape as every defect the rc.18–
// rc.28 review found: a claim and its evidence drifting apart. The dry-run proves the tree still
// WORKS. Nothing proved it still MATCHES, and nothing counted what was owed. Seven files had
// diverged across four workstreams before anyone measured it — and measuring it took one command
// nobody had written.
//
// WHAT THIS GATE CAN AND CANNOT KNOW, stated plainly because the distinction is the whole point:
//
//   IT KNOWS, with no external access, whether a file here has changed since the last recorded
//   sync point. That is the half that actually rots, because this is where the hardening happens.
//   A change with no declared port is a silent divergence, and that now fails the build.
//
//   IT CANNOT KNOW whether ofbo has moved, unless someone runs it with a checkout
//   (`--upstream <path>`). So it never says the trees agree. It says what it recorded, what has
//   changed since, and how long it has been since anyone actually looked — and it prints the
//   unverifiable part on every single run rather than letting a green tick imply it.
//
// The ledger is discovery-sync.json at the harness root, beside copy-manifest.json and
// upgrade-notes.json — bundle provenance, never installed into an adopting repo. Per-file state:
//
//   at-extraction  byte-identical to what was extracted; nothing owed FROM this side
//   owed           changed here since the sync point; a back-port to ofbo is outstanding
//   bundle-only    added here, never existed upstream
//   reconciled     verified equal to upstream at `last_reconciled` (only --reconcile sets it)
//   upstream-ahead ofbo moved and we did not; a forward-port to HERE is outstanding   (rc.35)
//   conflict       both sides moved from the shared base — a merge, not a copy        (rc.35)
//
// The last two exist because the first real reconciliation (2026-07-28, the first time anyone ran
// --upstream against a checkout) showed the vocabulary could not describe what was true. Every
// earlier state said something about what WE did, so a debt owed TO us was invisible by
// construction — and six files needed a merge while the ledger only knew the word "port", which
// invites someone to settle a conflict by overwriting one side.
//
// Also learned that day: `--reconcile` had been documented in this header since the gate shipped
// and never implemented. The debt was not merely unretired, it was unretirable.
//
//   node scripts/discovery-sync-check.mjs                  # verify + report the debt
//   node scripts/discovery-sync-check.mjs --record         # accept local changes as owed
//   node scripts/discovery-sync-check.mjs --upstream <dir> # three-way compare against a checkout
//   node scripts/discovery-sync-check.mjs --upstream <dir> --reconcile   # stamp a real sync point
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const LEDGER = resolve(HARNESS, 'discovery-sync.json');
export const TRACKED = resolve(HARNESS, 'discovery');

const sha = (p) => `sha256:${createHash('sha256').update(readFileSync(p)).digest('hex')}`;

/** States a tracked file can be in. `reconciled` is the only one that asserts anything about ofbo. */
export const STATE = {
  EXTRACTION: 'at-extraction',
  OWED: 'owed',
  BUNDLE_ONLY: 'bundle-only',
  RECONCILED: 'reconciled',
  // rc.35. The first real reconciliation found two things the old vocabulary could not say.
  //
  // UPSTREAM_AHEAD — ofbo hardened a file and we never received it. Every previous state was
  // one-directional (owed / at-extraction / bundle-only all describe what WE did), so a genuine
  // gap in our own tree was invisible by construction, not by oversight.
  //
  // CONFLICT — both sides moved from the shared base. "Port owed" quietly assumes a copy will
  // settle it. For a conflict it will not, and calling it a port invites someone to overwrite
  // one side with the other. Six files were in this state the first time anyone looked.
  UPSTREAM_AHEAD: 'upstream-ahead',
  CONFLICT: 'conflict',
};
/** States that mean "this file is knowingly different from, or unknown to, upstream". */
const DEBT = new Set([STATE.OWED, STATE.BUNDLE_ONLY, STATE.UPSTREAM_AHEAD, STATE.CONFLICT]);

/**
 * Paths that live in ofbo alone and are not divergence.
 *
 * ofbo is an INSTANTIATION: its own discovery runs and the artifacts rendered from them belong
 * there and must never be pulled into the generic bundle. `DISCOVERY.md` is a third case — in the
 * bundle it is not a file at all, but generated from the loom skill's canon via copy-manifest, so
 * comparing it here reports a difference that does not exist.
 *
 * This matters more than tidiness. The first comparison returned 46 `missing-here` rows of which
 * 44 were this noise, burying the 21 that mattered. A gate whose output you learn to skim is a
 * gate you have stopped reading.
 */
export function ofboSpecific(path) {
  return /^discovery\/runs\//.test(path)
    || /^discovery\/brand\/examples\/rendered\//.test(path)
    || path === 'discovery/DISCOVERY.md';
}

/** Every tracked file, harness-relative, sorted. */
export function trackedFiles(root = TRACKED) {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir).sort()) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(relative(resolve(root, '..'), p));
    }
  };
  if (existsSync(root)) walk(root);
  return out.sort();
}

/**
 * Compare the ledger against the tree on disk. Pure: `digests` maps path → current digest, so the
 * caller decides where the bytes come from and the tests need no filesystem.
 *
 * Findings BLOCK. Notices are printed and never block — the outstanding debt is a fact to keep in
 * front of people, not a reason to stop the build, because the port lands in a different repository
 * and cannot be a merge condition here.
 */
export function evaluate(ledger, digests) {
  const findings = [];
  const notices = [];
  const entries = ledger.files || {};
  const onDisk = Object.keys(digests).sort();
  const recorded = Object.keys(entries).sort();

  // C1 — coverage. The tree and the ledger must describe the same set of files. This is how a
  // tree silently grows apart: someone adds a gate here, nobody records it, and the ledger keeps
  // reporting a debt of N while the real answer is N+1.
  for (const p of onDisk) {
    if (!entries[p]) {
      findings.push(
        `${p}: tracked by discovery/ but absent from discovery-sync.json — a new file here is a ` +
        `divergence from ofbo by definition. Record it: \`node scripts/discovery-sync-check.mjs --record\`.`,
      );
    }
  }
  for (const p of recorded) {
    if (!digests[p]) {
      findings.push(`${p}: recorded in discovery-sync.json but no longer on disk — remove the entry, or restore the file.`);
    }
  }

  // C2 — a change since the recorded sync point must be DECLARED, not discovered later.
  for (const p of onDisk) {
    const e = entries[p];
    if (!e || !e.bundle) continue;
    if (e.bundle === digests[p]) continue;
    findings.push(
      `${p}: content differs from the digest recorded at the last sync point, and its state is ` +
      `'${e.state}' rather than '${STATE.OWED}'. A change here that is not declared as owed is ` +
      `exactly the drift this gate exists to stop. Run \`--record\` to accept it as a port owed to ofbo.`,
    );
  }

  // C3 — the debt, and the honest age of the record. Printed on every run, including a clean one.
  const debt = onDisk.filter((p) => entries[p] && DEBT.has(entries[p].state));
  const never = !ledger.upstream || !ledger.upstream.last_reconciled;
  // The limit goes FIRST, so nothing below it can be read as a claim about upstream.
  notices.push(
    never
      ? `NOT VERIFIED: no one has ever compared this tree against ${upstreamName(ledger)} from a checkout. `
        + `Nothing here asserts the two agree — only what changed on THIS side since extraction.`
      : `Last reconciled against ${upstreamName(ledger)} at ${ledger.upstream.last_reconciled}`
        + `${ledger.upstream.last_reconciled_ref ? ` (${ledger.upstream.last_reconciled_ref})` : ''}. `
        + `Whether upstream has moved since is not knowable from here — re-run with --upstream <checkout>.`,
  );
  if (debt.length) {
    // "owe a port TO ofbo" was true when every state described what we did. It stopped being true
    // the moment `upstream-ahead` existed: that debt runs the other way, and a summary line that
    // points every divergence outward is how a gap in our own tree stays invisible. The per-file
    // notes carry the direction; this line no longer guesses it.
    notices.push(`${debt.length} of ${onDisk.length} tracked file(s) diverge from ${upstreamName(ledger)} (direction per file below):`);
    for (const p of debt) notices.push(`    · ${p} (${entries[p].state})${entries[p].note ? ` — ${entries[p].note}` : ''}`);
  }
  return { findings, notices, debt, total: onDisk.length };
}

const upstreamName = (l) => (l.upstream && l.upstream.repo) || 'upstream';

/**
 * Three-way comparison against a real checkout. Only this can retire a debt, because only this has
 * seen the other side. Returns one verdict per file in the union of both trees.
 *
 * The ancestor is `base` — the last content the two sides are KNOWN to have shared — and not
 * `bundle`, which is merely what this side looked like when someone last ran --record. For a file
 * already carrying a debt those are different, and using the wrong one inverts the answer: a file
 * we hardened and upstream never received comes back as "upstream-ahead, forward-port", which would
 * have someone overwrite the hardening with the very content it replaced. `base` moves only on a
 * real reconciliation; --record never touches it.
 */
export function compareUpstream(ledger, digests, upstreamDigests) {
  const entries = ledger.files || {};
  const all = [...new Set([...Object.keys(digests), ...Object.keys(upstreamDigests)])]
    .filter((p) => !ofboSpecific(p)).sort();
  return all.map((p) => {
    const here = digests[p] || null;
    const there = upstreamDigests[p] || null;
    const base = entries[p] ? entries[p].base || null : null;
    if (here && !there) return { path: p, verdict: 'missing-upstream', detail: 'exists here only — port it, or record it as bundle-only' };
    if (!here && there) return { path: p, verdict: 'missing-here', detail: 'exists upstream only — forward-port it, or it is ofbo-specific' };
    if (here === there) return { path: p, verdict: 'identical', detail: 'in sync' };
    if (!base) return { path: p, verdict: 'no-shared-base', detail: 'both sides have it, no shared ancestor recorded — compare by hand, do not copy either way' };
    if (here !== base && there === base) return { path: p, verdict: 'bundle-ahead', detail: 'changed here since the shared base; upstream still at base — back-port' };
    if (here === base && there !== base) return { path: p, verdict: 'upstream-ahead', detail: 'changed upstream since the shared base; unchanged here — forward-port' };
    return { path: p, verdict: 'both-changed', detail: 'both sides moved since the shared base — a real merge, not a copy' };
  });
}

/** Digest every tracked file under a root that mirrors this layout (`<root>/discovery/...`). */
export function digestTree(root) {
  const out = {};
  for (const p of trackedFiles(join(root, 'discovery'))) out[p] = sha(join(root, p));
  return out;
}

/**
 * Rewrite the ledger: accept current content, flipping anything changed to `owed`.
 *
 * It updates `bundle` and never `base` or `upstream`. That is the whole discipline — --record has
 * not seen ofbo, so the only thing it is entitled to write is what THIS side now looks like. Moving
 * the shared base here would quietly erase the debt it is supposed to be booking.
 */
export function record(ledger, digests, { now }) {
  const files = { ...(ledger.files || {}) };
  for (const [p, d] of Object.entries(digests)) {
    const prev = files[p];
    // A file that appears here and was never extracted has no shared ancestor: base stays null.
    if (!prev) { files[p] = { base: null, bundle: d, upstream: null, state: STATE.BUNDLE_ONLY, note: `added here ${now}` }; continue; }
    if (prev.bundle === d) continue;
    files[p] = { ...prev, bundle: d, state: STATE.OWED, note: `changed here ${now}; see \`git log -- ${p}\`` };
  }
  for (const p of Object.keys(files)) if (!digests[p]) delete files[p];
  return { ...ledger, files };
}

/**
 * Stamp a real sync point from a comparison that has actually seen ofbo.
 *
 * This is what the header, the ledger's own note and CLAUDE.md have all promised since the gate
 * shipped — and what nothing implemented, which is why `last_reconciled` was null. The debt was
 * not merely unretired; it was structurally unretirable.
 *
 * The discipline is in what it refuses to do. **`base` moves only for files verified equal on
 * both sides.** A file we are ahead on keeps its old base, because moving it would erase the
 * exact debt the ledger exists to book — the failure mode the `--record` comment warns about,
 * arriving by a different door. A conflict gets no new base either: there is no shared ancestor
 * to move to when both sides have left it.
 */
export function reconcile(ledger, digests, upstreamDigests, { now, ref }) {
  const files = { ...(ledger.files || {}) };
  for (const row of compareUpstream(ledger, digests, upstreamDigests)) {
    const prev = files[row.path] || { base: null, upstream: null };
    const here = digests[row.path] || null;
    const there = upstreamDigests[row.path] || null;
    const set = (state, note, base = prev.base) =>
      { files[row.path] = { ...prev, base, bundle: here, upstream: there, state, note }; };

    switch (row.verdict) {
      case 'identical':
        // Equal on both sides — this IS the new shared ancestor, and the only case that earns one.
        set(STATE.RECONCILED, `verified equal to upstream ${now}`, here);
        break;
      case 'bundle-ahead':
        set(STATE.OWED, `ahead of upstream at ${now} — back-port owed to ofbo`);
        break;
      case 'upstream-ahead':
        set(STATE.UPSTREAM_AHEAD, `upstream ahead at ${now} — forward-port owed to THIS repository`);
        break;
      case 'both-changed':
      case 'no-shared-base':
        set(STATE.CONFLICT, `both sides moved as of ${now} — a real merge, not a copy`);
        break;
      case 'missing-upstream':
        set(STATE.BUNDLE_ONLY, `exists here only as of ${now}`);
        break;
      default: // missing-here — not tracked on this side; nothing to record about our own tree
        break;
    }
  }
  return {
    ...ledger,
    upstream: {
      ...(ledger.upstream || {}),
      last_reconciled: now,
      last_reconciled_ref: ref,
      note: `Reconciled against a real checkout on ${now}. States below are a three-way comparison, `
        + 'not an inference from this repository alone. Whether upstream has moved SINCE is still '
        + 'not knowable from here — re-run with --upstream <checkout>.',
    },
    files,
  };
}

export function main(argv = process.argv.slice(2)) {
  process.stdout.write('\nDiscovery-sync gate — the bundle\'s copy of the discovery machinery vs its upstream\n\n');
  if (!existsSync(LEDGER)) {
    process.stdout.write('  bundle-only check — no discovery-sync.json in this layout, nothing to verify\n\n');
    return 0;
  }
  const ledger = JSON.parse(readFileSync(LEDGER, 'utf8'));
  const digests = {};
  for (const p of trackedFiles()) digests[p] = sha(resolve(HARNESS, p));

  if (argv.includes('--record')) {
    const now = new Date().toISOString().slice(0, 10);
    writeFileSync(LEDGER, `${JSON.stringify(record(ledger, digests, { now }), null, 2)}\n`);
    process.stdout.write('  ledger updated — changed files are now recorded as a port owed to ofbo\n\n');
    return 0;
  }

  const ui = argv.indexOf('--upstream');
  if (ui >= 0 && argv[ui + 1]) {
    const root = resolve(argv[ui + 1]);
    if (!existsSync(join(root, 'discovery'))) {
      process.stderr.write(`  ${root} has no discovery/ — point --upstream at the repository root of a checkout\n\n`);
      return 1;
    }
    const upstreamDigests = digestTree(root);
    const rows = compareUpstream(ledger, digests, upstreamDigests);
    for (const r of rows) process.stdout.write(`  ${r.verdict.padEnd(17)} ${r.path}\n${r.verdict === 'identical' ? '' : `                    ${r.detail}\n`}`);
    const diverged = rows.filter((r) => r.verdict !== 'identical');
    process.stdout.write(`\n  ${rows.length - diverged.length} of ${rows.length} identical; ${diverged.length} diverged\n`);
    process.stdout.write('  (ofbo\'s own runs and rendered artifacts are excluded — an instantiation is not a divergence)\n\n');

    if (argv.includes('--reconcile')) {
      let ref = null;
      try {
        ref = execFileSync('git', ['-C', root, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
      } catch {
        process.stderr.write('  --reconcile needs the upstream checkout to be a git repository (to pin the ref)\n\n');
        return 1;
      }
      const now = new Date().toISOString().slice(0, 10);
      writeFileSync(LEDGER, `${JSON.stringify(reconcile(ledger, digests, upstreamDigests, { now, ref }), null, 2)}\n`);
      process.stdout.write(`  ledger reconciled against ${root} @ ${ref} — states are now a three-way comparison\n\n`);
      return 0;
    }
    return diverged.length ? 1 : 0;
  }

  const { findings, notices, debt, total } = evaluate(ledger, digests);
  for (const n of notices) process.stdout.write(`  ${n}\n`);
  process.stdout.write('\n');
  if (findings.length) {
    process.stdout.write('Discovery-sync gate — FAIL\n\n');
    for (const f of findings) process.stdout.write(`  - ${f}\n`);
    process.stdout.write('\nA change to the shared discovery machinery must be declared, so the port owed to\nofbo is counted rather than remembered.\n\n');
    return 1;
  }
  process.stdout.write(`Discovery-sync gate — OK (${total} file(s) tracked, ${debt.length} owing a port)\n\n`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
