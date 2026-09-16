// discovery-attest — the records the seam carries at BOTH ENDS of the loop, built from a run's own
// artifacts and posted on the run's trail (kosli-seam.md §3; core.md "Where Kosli sits"). Kosli's
// custody begins when there is something to attest; these are the somethings that exist before
// code does, and the one that exists after deploy:
//
//   intent               the sponsor's ask, from discovery/runs/<run>/intent.md — signed by the human
//   problem-selected     the falsifiable problem and its framing hypotheses, from problem-statement.md,
//                        decided by a human (an agent may propose framings; it never selects one)
//   discovery-stopped    the run that ended without a hand-off, from outcome.md (core/loop-attestations)
//   npa-pack             the New Product Approval pack the run assembled — the Business Proposition
//                        Form read and digested, its request type and the obligations it cites by id
//   npa-approved         the NPA committee's decision at PA1 or PA2 — a human's, with its conditions
//   reopened-discovery   an operations signal routed `discovery`, attributed to the change that sent
//                        the problem back (core/loop-attestations) — the Run → Discovery edge
//
// Nothing here is typed by hand: every payload is derived from a governed file, so a record that
// disagrees with its source can be caught. Every envelope carries the actor, the runner (PR6) and a
// signature (never a key from the tree), and is refused by the same provenance rules as a gate
// record before it is posted. A kept copy lands beside the evidence, as the gate runner keeps its.
//
//   node scripts/discovery-attest.mjs <kind> --run <slug> --actor <registry-id>
//        [--runs-dir discovery/runs] [--origin human|narrated|tool]
//        [--signal <id> [--signals docs/governance/operations-signal.json]]     reopened-discovery
//        [--form <path>] [--proposition <id>]                                   npa-pack
//        [--decision <path>]                                                    npa-approved
//        [--record-issuer <id> --record-key <pem-path>] [--emit-dir docs/governance/evidence] [--json]
//
// Exit 0 recorded (or queued with the provider unreachable — said so) · 2 usage or unmounted ·
// 3 refused by the provenance rules (nothing posted).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { buildEnvelope, signEnvelope } from '../core/provenance.mjs';
import { actorFor, loadRegistry, post, runnerFromEnv, signerFromArgs, status as recordStatus } from '../core/external-record.mjs';
import { discoveryStoppedRecord, readOutcome, reopenedDiscoveryRecord } from '../core/loop-attestations.mjs';

export const KINDS = ['intent', 'problem-selected', 'discovery-stopped', 'npa-pack', 'npa-approved', 'reopened-discovery'];
/** A decision is a human act: an agent may prepare a framing or a pack; it never selects, approves or reopens. */
export const HUMAN_ONLY = new Set(['problem-selected', 'npa-approved', 'reopened-discovery', 'discovery-stopped']);
/** The record name on the trail — one per kind, except where several may exist on one run. */
export const NAMES = {
  'intent': () => 'intent',
  'problem-selected': () => 'problem-selected',
  'discovery-stopped': () => 'discovery-stopped',
  'npa-pack': () => 'npa-pack',
  'npa-approved': (p) => `npa-approved.${String(p?.receipt || 'pa1').toLowerCase()}`,
  'reopened-discovery': (p) => `reopened-discovery.${p?.signal_id || 'signal'}`,
};
const REQUEST_TYPES = ['New', 'Amendment', 'Withdrawal'];
const NPA_FIELDS = 33;

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const uniq = (arr) => [...new Set(arr)];
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

/** Minimal front-matter reader: `key: value`, quoted strings, and `[a, b]` lists. */
function frontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { fm: {}, body: text };
  const fm = {};
  for (const raw of m[1].split('\n')) {
    const kv = raw.match(/^([\w-]+):\s*(.*)$/); if (!kv) continue;
    let v = kv[2].trim();
    if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    else v = v.replace(/^"|"$/g, '');
    fm[kv[1]] = v;
  }
  return { fm, body: text.slice(m[0].length).trim() };
}
const slugOf = (runDir, fm) => (isStr(fm.run) ? fm.run : runDir.replace(/[\\/]+$/, '').split(/[\\/]/).pop());
const signalIds = (text) => uniq(text.match(/\bS-\d{3}\b/g) || []).sort();
const unbold = (s) => s.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

/** intent — from discovery/runs/<run>/intent.md. */
export function intentPayload(runDir) {
  const p = join(runDir, 'intent.md');
  if (!existsSync(p)) throw new Error(`${p} is missing — the intent is the sponsor's own words, written down before a problem is framed`);
  const { fm, body } = frontMatter(readFileSync(p, 'utf8'));
  if (!isStr(fm.statement)) throw new Error('intent.md front-matter has no statement');
  if (!isStr(fm.sponsor)) throw new Error('intent.md front-matter has no sponsor — an intent nobody asked for is not an intent');
  return {
    run: slugOf(runDir, fm), artifact: 'intent.md', sponsor: fm.sponsor, strategic_intent: fm.strategic_intent ?? null,
    statement: fm.statement, sources: Array.isArray(fm.sources) ? fm.sources : signalIds(body), body_sha256: sha256(body),
  };
}

/** problem-selected — from problem-statement.md: the problem, the H-hypotheses, the evidence, the D4 refusal. */
export function problemSelectedPayload(runDir) {
  const p = join(runDir, 'problem-statement.md');
  if (!existsSync(p)) throw new Error(`${p} is missing`);
  const text = readFileSync(p, 'utf8');
  const { fm, body } = frontMatter(text);
  const sec = body.split(/^## /m).find((s) => /^The problem/i.test(s)) || '';
  const quote = sec.split('\n').filter((l) => l.startsWith('>')).map((l) => l.replace(/^>\s?/, '')).join(' ');
  const problem = unbold(quote);
  if (!problem) throw new Error('problem-statement.md has no blockquoted problem under "## The problem"');
  const hypotheses = [];
  for (const m of body.matchAll(/^- \*\*(H\d+)\*\*\s*[—-]\s*(.+)$/gm)) hypotheses.push({ id: m[1], text: unbold(m[2]).replace(/\s*\([^)]*\)\s*$/, '') });
  if (!hypotheses.length) throw new Error('problem-statement.md names no framing hypotheses (H1, H2, …)');
  return {
    run: slugOf(runDir, fm), artifact: 'problem-statement.md', problem, hypotheses, evidence: signalIds(body),
    refused_solutioning: /Not here \(D4\)/.test(body), body_sha256: sha256(body),
  };
}

/** discovery-stopped — the loop-attestation record from outcome.md, as a payload. */
export function discoveryStoppedPayload(runDir) {
  const outcome = readOutcome(runDir);
  if (!outcome) throw new Error(`${join(runDir, 'outcome.md')} is missing — a stop is recorded in outcome.md or it did not happen`);
  if (outcome._error) throw new Error(outcome._error);
  const slug = runDir.replace(/[\\/]+$/, '').split(/[\\/]/).pop();
  const { attestation: _a, ...rec } = discoveryStoppedRecord(slug, outcome);
  return rec;
}

/** reopened-discovery — the loop-attestation record for one signal routed `discovery`. */
export function reopenedDiscoveryPayload(signals, signalId) {
  const log = typeof signals === 'string' ? readJson(signals) : signals;
  const s = (log?.signals || []).find((x) => x.id === signalId);
  if (!s) throw new Error(`signal ${signalId} is not in the operations log`);
  if (s.route !== 'discovery') throw new Error(`signal ${signalId} is routed ${JSON.stringify(s.route)}, not discovery — only a signal sent back to the left diamond reopens it`);
  const { attestation: _a, ...rec } = reopenedDiscoveryRecord(s);
  return rec;
}

/** npa-pack — the Business Proposition Form, read: product, request type, field coverage, cited ids, digest. */
export function npaPackPayload(formPath, { propositionId } = {}) {
  if (!existsSync(formPath)) throw new Error(`${formPath} is missing`);
  const buf = readFileSync(formPath); const text = buf.toString('utf8');
  const product = (text.match(/\|\s*\*\*Product Name \/ Initiative\*\*\s*\|\s*([^|]+)\|/) || [])[1]?.trim() ?? null;
  const rtCell = (text.match(/\|\s*\*\*Request Type\*\*\s*\|\s*([^|]+)\|/) || [])[1] ?? '';
  const request_type = REQUEST_TYPES.find((t) => new RegExp(`${t}\\s*☑`).test(rtCell)) ?? null;
  const fields = uniq([...text.matchAll(/^\*\*(\d\.\d{1,2})(?:\s[^*]*)?\*\*/gm)].map((m) => m[1]));
  const fields_present = fields.length;
  const decision_present = /^## NPA Committee decision/m.test(text);
  return {
    proposition_id: propositionId ?? null, artifact: formPath.split(/[\\/]/).pop(), product, request_type,
    fields_present, fields_expected: NPA_FIELDS, status: fields_present >= NPA_FIELDS && request_type ? 'complete' : 'draft',
    obligations_cited: uniq(text.match(/\bOB-[A-Z]{2}-[A-Z0-9-]+-\d{3}\b/g) || []).sort(),
    risks_cited: uniq(text.match(/\bDR-\d\.\d-\d{3}\b/g) || []).sort(),
    controls_cited: uniq(text.match(/\bCTRL-\d{3}\b/g) || []).sort(),
    decision_present, form_sha256: sha256(buf),
  };
}

/** npa-approved — the committee decision as recorded, validated for shape. */
export function npaApprovedPayload(decision) {
  const d = typeof decision === 'string' ? readJson(decision) : decision;
  for (const k of ['proposition_id', 'receipt', 'decision', 'approved_by', 'decided_at']) if (!isStr(d?.[k])) throw new Error(`decision has no ${k}`);
  if (!['PA1', 'PA2'].includes(d.receipt)) throw new Error(`receipt ${JSON.stringify(d.receipt)} is not PA1 or PA2`);
  if (!['approved', 'approved-with-conditions', 'rejected'].includes(d.decision)) throw new Error(`decision ${JSON.stringify(d.decision)} is not approved | approved-with-conditions | rejected`);
  if (Number.isNaN(Date.parse(d.decided_at))) throw new Error('decided_at is not a parseable timestamp');
  const conditions = Array.isArray(d.conditions) ? d.conditions.filter(isStr) : [];
  if (d.decision === 'approved-with-conditions' && !conditions.length) throw new Error('approved-with-conditions with no conditions listed');
  return { proposition_id: d.proposition_id, receipt: d.receipt, decision: d.decision, approved_by: d.approved_by, decided_at: d.decided_at, conditions, valid_until: d.valid_until ?? null, evidence_status: d.evidence_status ?? null };
}

/** The envelope for a kind on a run's trail. Throws when a decision kind is given a non-human actor. */
export function envelopeFor(kind, { run, payload, actor, origin = 'human', commit, runner, producedAt = new Date().toISOString() }) {
  if (!KINDS.includes(kind)) throw new Error(`kind ${JSON.stringify(kind)} is not one of ${KINDS.join(', ')}`);
  if (!isStr(run)) throw new Error('a run slug is required — a discovery record binds to a run');
  if (!actor || !isStr(actor.id)) throw new Error('an actor is required');
  if (HUMAN_ONLY.has(kind) && actor.kind !== 'human') throw new Error(`${kind} is a decision: its actor must be a human, and ${actor.id} is ${actor.kind ? `an ${actor.kind}` : 'of unknown kind'}`);
  if (kind === 'npa-approved' && isStr(payload?.approved_by) && payload.approved_by !== actor.id) throw new Error(`npa-approved is signed by ${actor.id} but the decision names ${payload.approved_by} — the approver attests their own decision`);
  const controls = kind === 'npa-pack'
    ? { institution: payload?.obligations_cited || [], finos: [], catalog: [], controls_source: 'business-proposition-form' }
    : null;
  return buildEnvelope({ kind, name: NAMES[kind](payload), subject: { flow: 'discovery', trail: run }, commit, actor, runner, payload, origin, controls, producedAt });
}

function arg(argv, k) { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; }
const head = (cwd) => { try { return execFileSync('git', ['-C', cwd, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };

/** Build, sign, post and keep one record. Returns { envelope, result, kept }. */
export async function attest(kind, { cwd = process.cwd(), env = process.env, run, runsDir = 'discovery/runs', actorId, origin = 'human', signal = null, signals = 'docs/governance/operations-signal.json', form = null, proposition = null, decision = null, emitDir = 'docs/governance/evidence', issuer = null, keyPath = null } = {}) {
  const runDir = resolve(cwd, runsDir, run);
  let payload;
  switch (kind) {
    case 'intent': payload = intentPayload(runDir); break;
    case 'problem-selected': payload = problemSelectedPayload(runDir); break;
    case 'discovery-stopped': payload = discoveryStoppedPayload(runDir); break;
    case 'reopened-discovery': if (!signal) throw new Error('--signal <id> is required for reopened-discovery'); payload = reopenedDiscoveryPayload(resolve(cwd, signals), signal); break;
    case 'npa-pack': payload = npaPackPayload(resolve(cwd, form || join(runsDir, run, 'npa/business-proposition-form.md')), { propositionId: proposition }); break;
    case 'npa-approved': payload = npaApprovedPayload(resolve(cwd, decision || join(runsDir, run, 'npa/decision.json'))); break;
    default: throw new Error(`kind ${JSON.stringify(kind)} is not one of ${KINDS.join(', ')}`);
  }
  const commit = head(cwd);
  if (!commit) throw new Error('no git HEAD — a record binds to the commit it describes');
  const actor = actorFor(cwd, actorId || (kind === 'npa-approved' ? payload.approved_by : null) || (kind === 'intent' ? payload.sponsor : null) || (kind === 'discovery-stopped' ? payload.decided_by : null));
  if (!actor) throw new Error('--actor <registry-id> is required');
  const registry = loadRegistry(cwd);
  const known = (registry?.identities || []).find((i) => i.id === actor.id);
  if (known) actor.kind = known.kind;
  const runner = runnerFromEnv(env, commit);
  let envelope = envelopeFor(kind, { run, payload, actor, origin, commit, runner });
  const signer = signerFromArgs({ issuer, keyPath }, env);
  if (signer) envelope = signEnvelope(envelope, signer);
  const result = await post(envelope, { cwd, env });
  let kept = null;
  if (emitDir && result.status !== 'rejected') {
    const dir = resolve(cwd, emitDir, 'records'); mkdirSync(dir, { recursive: true });
    const abs = join(dir, `${run}-${envelope.name}.json`);
    writeFileSync(abs, JSON.stringify({ ...envelope, record: result }, null, 2) + '\n');
    kept = relative(cwd, abs); // relative to the tree, whatever the OS calls the tree's real path
  }
  return { envelope, result, kept };
}

async function main(argv = process.argv.slice(2)) {
  const kind = argv[0];
  const run = arg(argv, '--run');
  if (!KINDS.includes(kind) || !run) { process.stderr.write(`usage: node scripts/discovery-attest.mjs <${KINDS.join('|')}> --run <slug> --actor <id> [--signal <id>] [--form <path>] [--decision <path>] [--record-issuer <id> --record-key <pem>]\n`); return 2; }
  const st = recordStatus(process.cwd());
  if (!st.mounted) { process.stderr.write(`external record not mounted — ${st.reason}\n`); return 2; }
  let r;
  try {
    r = await attest(kind, { run, runsDir: arg(argv, '--runs-dir') || 'discovery/runs', actorId: arg(argv, '--actor'), origin: arg(argv, '--origin') || 'human', signal: arg(argv, '--signal'), signals: arg(argv, '--signals') || 'docs/governance/operations-signal.json', form: arg(argv, '--form'), proposition: arg(argv, '--proposition'), decision: arg(argv, '--decision'), emitDir: arg(argv, '--emit-dir') || 'docs/governance/evidence', issuer: arg(argv, '--record-issuer'), keyPath: arg(argv, '--record-key') });
  } catch (e) { process.stderr.write(`${kind}: ${e.message}\n`); return 2; }
  if (argv.includes('--json')) { process.stdout.write(JSON.stringify({ kind, name: r.envelope.name, trail: r.envelope.subject.trail, actor: r.envelope.actor, result: r.result, kept: r.kept }, null, 2) + '\n'); return r.result.status === 'rejected' ? 3 : 0; }
  if (r.result.status === 'rejected') { process.stderr.write(`${kind} REFUSED before posting:\n`); for (const f of r.result.findings) process.stderr.write(`  - ${f}\n`); return 3; }
  const who = `${r.envelope.actor.id} (${r.envelope.actor.kind || '?'})`;
  process.stdout.write(`${kind} → ${r.envelope.name} on discovery trail ${r.envelope.subject.trail}: ${r.result.status}${r.result.id ? ` as ${r.result.id}` : ''} · actor ${who}${r.kept ? ` · kept ${r.kept}` : ''}\n`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().then((c) => process.exit(c));
