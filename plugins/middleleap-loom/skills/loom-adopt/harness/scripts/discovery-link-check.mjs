// HG-0007 — the waist gate (discovery → delivery). The delivery loop is excellent at
// building the thing right and silent on whether it is the right thing. This gate makes a
// green discovery hand-off the entry condition for a *new* feature-bearing backlog item, so
// a feature traces to an evidenced problem + a data-governance verdict + a tangible,
// stakeholder-tested direction — not an unsourced request.
//
// Three deterministic checks over docs/backlog.yaml (pure Node, reuses the D1–D9 validator):
//   1. Referential integrity — any feature item that carries `discovery: <slug>` must point
//      at a discovery/runs/<slug>/ whose hand-off exists and passes ALL applicable gates.
//   2. Mandatory link — a feature item (matching FEATURE below) that is `pending` must carry a
//      `discovery:` link (or an explicit `discovery_exempt: true` escape hatch with a reason).
//      Items already in flight or shipped (done/in-progress/blocked/deferred) are grandfathered:
//      the policy binds work that enters the queue AFTER it, never rewrites history.
//   3. Coverage — the gate must have examined something before it may print OK, and it says how
//      much. A backlog with content but no recognised item, or an `ADOPT:` marker still on the
//      shipped default while the real ids look nothing like it, are the two ways this gate goes
//      quiet without going red. See coverage() for why one of those fails and the other reports.
//
// Run from the repo root: `node scripts/discovery-link-check.mjs` (exit 1 on any finding).
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { validateRun } from '../discovery/gates/validate.mjs';
import { pathToFileURL } from 'node:url';

const BACKLOG = 'docs/backlog.yaml';
// The shipped default, recorded separately so the gate can tell "never adopted" from "customised
// and currently matching nothing". Do NOT edit this line — edit FEATURE below.
const SHIPPED_DEFAULT = '^STORY-\\d+$';
// ADOPT: set this to your feature-item id convention (infra items should NOT match).
export const FEATURE = /^STORY-\d+$/;

/** Indentation (leading spaces) of a line. */
const indent = (line) => line.length - line.trimStart().length;
/** A list element that is a backlog item (inline `- { id:…}` or block `- id:…`) — NOT a milestone (`- name:`). */
export const isItemStart = (line) => /^\s*-\s+(\{|id:)/.test(line);

/**
 * Slice docs/backlog.yaml into per-item text blocks. An item owns its start line plus every
 * following line indented deeper than its `-` (captures multi-line block items); a sibling at
 * the same indent, any dedent, or the next item start at ANY indent ends it. Milestone headers
 * (`- name:`) never start an item.
 *
 * The last of those boundaries arrived in rc.28, and it closed a specific silent miss:
 *
 *   milestones:
 *     - id: M1          ← looks exactly like an item start
 *       items:
 *         - id: STORY-1 ← swallowed into M1's block under the old rule
 *           status: pending
 *
 * `isItemStart` excludes `- name:` precisely so a milestone keyed by NAME is not mistaken for an
 * item — but nothing stopped a milestone keyed by `id`, which is an entirely natural thing to
 * write. Under the old boundary its children were absorbed, `id` resolved to the MILESTONE's id,
 * that did not match the feature pattern, and every real item beneath it went unexamined. The gate
 * reported OK. HG-0007 is the waist of the double diamond; an inert one that says OK is worse than
 * an absent one, because nobody goes looking.
 *
 * Ending at the next item start makes the container its own short block (no `status`, so it is
 * skipped) and gives every real item a block of its own, in both nesting styles and flat files.
 */
export function parseItems(text) {
  const lines = text.split('\n');
  const items = [];
  for (let i = 0; i < lines.length; i++) {
    if (!isItemStart(lines[i])) continue;
    const base = indent(lines[i]);
    const buf = [lines[i]];
    let j = i + 1;
    for (; j < lines.length; j++) {
      if (lines[j].trim() === '') { buf.push(lines[j]); continue; }
      if (indent(lines[j]) <= base) break;
      if (isItemStart(lines[j])) break; // a nested item is its own block, never this one's tail
      buf.push(lines[j]);
    }
    i = j - 1;
    items.push(buf.join('\n'));
  }
  return items;
}

const field = (text, re) => (text.match(re) || [])[1];
/** An item's id — the first `id:` in its block, quoted or bare. */
const ID = /\bid:\s*["']?([A-Za-z0-9-]+)/;

/**
 * Does the file carry anything a backlog item could be made of? Blank lines, comments, document
 * markers, bare keys and EMPTY collections do not count — `milestones: []` is a legitimately empty
 * backlog and the SKILL says so. Anything else does.
 */
export function hasContent(text) {
  return text.split('\n').some((line) => {
    const t = line.replace(/#.*$/, '').trim();
    if (!t || t === '---' || t === '-') return false;
    return !/^[\w.-]+:\s*(\[\s*\]|\{\s*\}|~|null)?$/.test(t);
  });
}

/**
 * How much of the backlog this gate actually examined — the loud-not-silent half (rc.28).
 *
 * A gate that prints OK is making a claim: "every feature backlog item traces to a green discovery
 * hand-off". When it examined nothing, that claim has no evidence behind it, and HG-0007 is the one
 * gate where an inert pass is worse than an absent gate — the waist of the double diamond is exactly
 * where nobody goes looking, because the light is green. Two ways it can go quiet, both real:
 *
 *   · the parser recognises no items in a backlog that plainly has content (an unanticipated
 *     shape — a mapping instead of a list, a nesting style nobody tried);
 *   · items parse, but none matches FEATURE, because the `ADOPT:` marker above was never set to
 *     the adopter's own id convention. Every brownfield repo has ids like FEAT-102 or PAY-88, so
 *     the shipped `STORY-<n>` default matches nothing and the gate gates nothing.
 *
 * The second distinguishes UNEDITED from CUSTOMISED, and treats them differently on purpose. An
 * unedited marker is an unfinished adoption and fails. A marker the adopter deliberately set that
 * happens to match nothing today is an ordinary state of a backlog — reported, never failed.
 */
export function coverage(text, feature = FEATURE) {
  const items = parseItems(text);
  const ids = items.map((b) => field(b, ID)).filter(Boolean);
  const matched = ids.filter((id) => feature.test(id));
  const unedited = feature.source === SHIPPED_DEFAULT;
  const stats = { items: items.length, ids: ids.length, matched: matched.length, unedited };
  const findings = [];
  const notices = [];

  if (!items.length) {
    if (hasContent(text)) {
      findings.push(
        `${BACKLOG} has content, but the waist gate recognised no backlog item in it. An item is a ` +
        `list element keyed by id — '- id: STORY-1' on its own line, or inline '- { id: STORY-1, … }'; ` +
        `docs/backlog.example.yaml shows both nesting styles. Passing here would claim every ` +
        `feature traces to a green hand-off on the strength of having examined nothing.`,
      );
    } else {
      notices.push(`${BACKLOG} declares no items yet — nothing for the waist gate to examine.`);
    }
  } else if (!matched.length && unedited) {
    findings.push(
      `${BACKLOG} has ${items.length} item(s) and none carries an id matching ${feature} — which is ` +
      `still this bundle's shipped default. Set FEATURE in scripts/discovery-link-check.mjs (the ` +
      `'ADOPT:' line) to your own feature-item id convention. Until you do, HG-0007 reads every item ` +
      `and gates none of them.`,
    );
  } else if (!matched.length) {
    notices.push(`${items.length} item(s) examined, none matching ${feature} — no feature work in the backlog right now.`);
  }
  return { findings, notices, stats };
}

/**
 * Pure waist-gate logic over backlog TEXT. `resolveRun(slug)` reports a linked run's state:
 * `{ handoffMissing: true }`, `{ failedGates: [...] }`, or `null` when the run is gate-green.
 * `feature` decides which ids are waist-gated. No filesystem here — see check() for the wiring.
 */
/**
 * Does this item carry a reason a human could argue with? Presence is not enough — an empty
 * string, whitespace, or a leftover placeholder is the same silence the check exists to stop,
 * dressed as compliance.
 */
function hasReason(block) {
  const raw = field(block, /\breason:\s*(.+)/);
  if (!raw) return false;
  const reason = raw.trim().replace(/^["']|["'],?$/g, '').replace(/[,}]\s*$/, '').trim();
  if (!reason) return false;
  return !/^(TODO|TBD|ADOPT|N\/?A|none|<[^>]*>)$/i.test(reason);
}

export function checkItems(text, resolveRun, feature = FEATURE) {
  const findings = [];
  for (const block of parseItems(text)) {
    const id = field(block, ID);
    if (!id || !feature.test(id)) continue; // only PRD feature items are waist-gated
    // Trigger on EXPLICIT `status: pending` only. The loop's Pick step picks pending items, so
    // an un-statused stub (id+title, a someday-maybe) cannot enter delivery until someone marks
    // it pending — which is exactly when the hand-off must exist. No status ≠ pending here.
    // Tolerate quoted/cased YAML scalars: `status: "Pending"` is the same as `status: pending`.
    // Matching only bare lowercase let a quoted or capitalized status slip the waist gate.
    const rawStatus = field(block, /\bstatus:\s*["']?([A-Za-z-]+)/);
    const status = rawStatus ? rawStatus.toLowerCase() : undefined;
    const slug = field(block, /\bdiscovery:\s*["']?([A-Za-z0-9-]+)/);
    const exempt = /\bdiscovery_exempt:\s*["']?true\b/i.test(block);

    if (slug) {
      // Check 1 — the link must resolve to a green discovery run.
      const r = resolveRun(slug);
      if (r && r.handoffMissing) {
        findings.push(`${id}: discovery: ${slug} — no hand-off at discovery/runs/${slug}/handoff.md`);
      } else if (r && r.failedGates && r.failedGates.length) {
        findings.push(`${id}: discovery run '${slug}' is not gate-green (failing: ${r.failedGates.join(', ')})`);
      }
    } else if (status === 'pending' && !exempt) {
      // Check 2 — a new feature may not enter delivery without an evidenced problem.
      findings.push(
        `${id}: pending feature with no 'discovery: <slug>' hand-off (HG-0007). ` +
        `Run the discovery harness first, or set 'discovery_exempt: true' with a reason.`,
      );
    } else if (status === 'pending' && exempt && !hasReason(block)) {
      // Check 2b — the escape hatch may be taken, but only OUT LOUD. An exemption with no
      // reason is a silent bypass of the gate that makes discovery non-optional: one line,
      // no justification, and the gate prints OK. Three places promised a reason was
      // required (the header comment, the failure message above, and the shipped example's
      // "Silence is not an option; an exemption is") and until rc.33 nothing checked.
      findings.push(
        `${id}: discovery_exempt: true with no reason (HG-0007). An exemption is allowed; ` +
        `a silent one is not. Add 'reason: <why no discovery applies>' — a sentence a human can argue with.`,
      );
    }
  }
  return findings;
}

/** The filesystem-backed run resolver the CLI uses (reuses the D1–D9 validator). */
function fsResolveRun(slug) {
  const runDir = `discovery/runs/${slug}`;
  if (!existsSync(`${runDir}/handoff.md`)) return { handoffMissing: true };
  const res = validateRun(runDir, {});
  return res.ok ? null : { failedGates: res.gates.filter((g) => g.status === 'fail').map((g) => g.id) };
}

export function check() {
  // The installer deliberately does not ship a backlog — it is the adopter's own content, not a
  // template — so a freshly adopted repo meets this gate before the file exists. That is still a
  // failure and not a no-op: an absent backlog means the waist is unwired, and passing here would
  // make "no backlog" indistinguishable from "every item traces to a green hand-off". But the
  // finding has to say what to DO, because the reader is an adopter on their first CI run who has
  // not done anything wrong.
  if (!existsSync(BACKLOG)) {
    return {
      findings: [`${BACKLOG} not found — the installer does not ship one because a backlog is your `
        + `content, not a template. Create it (the loom-adopt SKILL lists it under "Also create if `
        + `missing"), copying the shape from the docs/backlog.example.yaml this bundle installs beside it; an empty \`milestones: []\` `
        + `is valid and passes this gate.`],
      notices: [],
      stats: null,
    };
  }
  const text = readFileSync(BACKLOG, 'utf8');
  const { findings, notices, stats } = coverage(text);
  return { findings: [...findings, ...checkItems(text, fsResolveRun)], notices, stats };
}

// CLI (skipped when imported by the test suite).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { findings, notices, stats } = check();
  for (const n of notices) process.stdout.write(`  note: ${n}\n`);
  if (findings.length) {
    process.stderr.write('\nDiscovery → delivery waist gate (HG-0007) — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nA feature backlog item must trace to a green discovery hand-off.\n');
    process.exit(1);
  }
  // OK states its coverage. A bare OK is the shape of claim this gate exists to refuse.
  const scope = stats ? ` (${stats.matched} of ${stats.items} backlog item(s) waist-gated)` : '';
  process.stdout.write(`Discovery → delivery waist gate (HG-0007) — OK${scope}\n`);
}
