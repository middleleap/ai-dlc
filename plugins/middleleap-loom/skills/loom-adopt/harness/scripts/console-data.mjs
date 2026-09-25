// The Loom console's data contract (loom.console/v1). One pure read of an adopted repository into
// the JSON the oversight console renders — so the console is a PROJECTION OF THE RECORD, not a page
// someone wrote. It writes nothing but its own output file, decides nothing, and holds no authority.
//
// Every fact it emits carries its provenance: the file it was read from, and one of four kinds —
//   record          read from a governed file in the tree (a run artifact, a register, the BrainKit)
//   executed-check  the result of a gate this script actually ran (the D1–D9 validator, brainkit-check)
//   derived         computed here from records (a run's stage, whether a sponsor resolves)
//   telemetry       a report that flags and never blocks (the approval queue, ages against the SLA)
// A console that shows a fact without one of these is showing an opinion.
//
// Gate states are the validator's, unsoftened: a gate that fails because its stage has not been
// reached is still `fail`, with `reached: false` beside it. The console may say "not reached yet";
// it may never say "pass".
//
//   node scripts/console-data.mjs [--out <file>] [--now <ISO date>] [--pretty]
//
// Run from the repo root. `--now` pins the clock so ages are reproducible (tests, demos).
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { validateRun, prototypeDigest } from '../discovery/gates/validate.mjs';
import { frontMatter, section, filledRows, signalIds, drIds, ctrlIds, obIds } from '../discovery/gates/lib.mjs';
import { collect as approvalQueue } from './approval-status.mjs';

export const SCHEMA = 'loom.console/v1';
const RUNS_DIR = 'discovery/runs';
const ART = {
  intent: 'intent.md', research: 'research-log.md', synthesis: 'synthesis.md', problem: 'problem-statement.md',
  dataGov: 'data-governance.md', prototype: 'prototype.md', reaction: 'stakeholder-reaction.md',
  handoff: 'handoff.md', outcome: 'outcome.md', businessCase: 'business-case.md', npa: 'npa/decision.json',
};
// The left diamond in order: the artifact each stage writes and the gates that judge THAT artifact.
export const STAGES = [
  { id: '1', name: 'Signals', artifact: 'research', gates: ['D2'] },
  { id: '2', name: 'Synthesis', artifact: 'synthesis', gates: ['D5'] },
  { id: '3', name: 'Problem', artifact: 'problem', gates: ['D1', 'D3', 'D4'] },
  { id: '4', name: 'Data & risk', artifact: 'dataGov', gates: ['D6'] },
  { id: '5', name: 'Prototype', artifact: 'prototype', gates: ['D7', 'D8'] },
  { id: '5b', name: 'Reaction', artifact: 'reaction', gates: ['D9'] },
  { id: '6', name: 'Hand-off', artifact: 'handoff', gates: [] },
];
const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const readText = (p) => { try { return readFileSync(p, 'utf8'); } catch { return ''; } };
const rel = (cwd, p) => p.slice(cwd.length + 1);
const src = (file, kind = 'record') => ({ file, kind });

/** Is a gate's own subject present? A gate that fails on an absent artifact has not been reached. */
function reachedMap(has) {
  return {
    D1: has.problem, D2: has.synthesis || has.problem, D3: has.problem, D4: true, D5: has.synthesis,
    D6: has.dataGov, D7: true, D8: has.prototype, D9: has.prototype,
  };
}

function hypotheses(problemBody, reactionBody, outcomeFm) {
  const out = [];
  for (const m of problemBody.matchAll(/^\s*-\s*\*\*(H\d+)\*\*\s*[—-]\s*(.+)$/gm)) {
    out.push({ id: m[1], text: m[2].replace(/\s*\((?:S-\d+(?:,\s*)?)+\)\s*/g, ' ').replace(/\*[^*]+\*\s*$/, '').trim(), reactions: [] });
  }
  for (const cells of filledRows(section(reactionBody, 'Reactions'), ['hypothesis', 'verdict'])) {
    const h = out.find((x) => x.id === (cells[0] || '').trim());
    if (h) h.reactions.push({ stakeholder: (cells[1] || '').replace(/`\[synthetic\]`/g, '').trim(), verdict: (cells[2] || '').trim().toLowerCase() });
  }
  // A stopped run's outcome records the verdict the decision rests on.
  const fmVerdicts = [...String(outcomeFm.__raw || '').matchAll(/-\s*id:\s*(H\d+)\s*\n\s*verdict:\s*([\w-]+)/g)];
  for (const [, id, v] of fmVerdicts) { const h = out.find((x) => x.id === id); if (h) h.outcome = v; }
  for (const h of out) {
    const vs = h.reactions.map((r) => r.verdict);
    h.verdict = h.outcome || (vs.includes('refuted') ? 'refuted' : vs.includes('uncertain') ? 'uncertain' : vs.length ? 'confirmed' : 'open');
  }
  return out;
}

function bullet(body, label) {
  const m = body.match(new RegExp(`^\\s*-\\s*\\*\\*${label}:\\*\\*\\s*(.+)$`, 'mi'));
  return m ? m[1].trim() : null;
}

export function readRun(cwd, slug, ctx) {
  const dir = join(cwd, RUNS_DIR, slug);
  const file = (k) => join(dir, ART[k]);
  const has = Object.fromEntries(Object.keys(ART).map((k) => [k, existsSync(file(k))]));
  const doc = (k) => { const raw = readText(file(k)); const { fm, body } = frontMatter(raw); fm.__raw = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] || ''; return { fm, body }; };
  const intent = doc('intent'), problem = doc('problem'), reaction = doc('reaction'), outcome = doc('outcome'), handoff = doc('handoff'), research = doc('research');
  const v = validateRun(dir, ctx.validateOpts);
  const reached = reachedMap(has);
  const gates = v.gates.map((g) => ({ id: g.id, name: g.name, status: g.status, reached: reached[g.id], issues: g.issues, ...(g.verdict !== undefined ? { verdict: g.verdict } : {}) }));
  const G = Object.fromEntries(gates.map((g) => [g.id, g]));

  // Stage: the first stage not complete. Complete = its artifact exists and every gate that judges
  // it passes (or is skipped). A gate failing on an artifact that exists and is reached is BLOCKED.
  let stage = STAGES[STAGES.length - 1], status = 'in-progress', blockedBy = [];
  for (const s of STAGES) {
    if (!has[s.artifact]) { stage = s; break; }
    const bad = s.gates.filter((id) => G[id] && G[id].status === 'fail');
    if (bad.length) { stage = s; const real = bad.filter((id) => G[id].reached); if (real.length) { status = 'gate-failing'; blockedBy = real; } break; }
  }
  if (has.outcome) { status = (outcome.fm.outcome || 'stopped'); stage = [...STAGES].reverse().find((x) => has[x.artifact]) || STAGES[0]; }
  else if (has.handoff && v.ok) { status = 'handed-off'; stage = STAGES[STAGES.length - 1]; }
  else if (stage.id === '5b' && has.prototype && !has.reaction) status = 'awaiting-reaction';

  const sponsor = intent.fm.sponsor || outcome.fm.decided_by || null;
  const strategic = intent.fm.strategic_intent || null;
  const signals = signalIds(section(research.body, 'Signals'));
  const proto = has.prototype ? {
    brief: `${RUNS_DIR}/${slug}/${ART.prototype}`,
    wireframe: existsSync(join(dir, doc('prototype').fm.wireframe || 'wireframe.html')) ? `${RUNS_DIR}/${slug}/${doc('prototype').fm.wireframe || 'wireframe.html'}` : null,
    digest: prototypeDigest(dir, doc('prototype').fm.wireframe || 'wireframe.html'),
    reaction_bound_to: reaction.fm.prototype_digest || null,
  } : null;
  if (proto) proto.reaction_binding = proto.reaction_bound_to ? (proto.reaction_bound_to === proto.digest ? 'bound' : 'stale') : 'none';
  const dg = has.dataGov ? readText(file('dataGov')) : '';
  const uncovered = has.dataGov ? section(frontMatter(dg).body, 'Uncovered risks').split('\n').map((l) => l.replace(/^-\s*/, '').trim()).filter((l) => l && !/^none/i.test(l)) : [];
  const npa = has.npa ? readJson(file('npa')) : null;
  return {
    slug,
    title: intent.fm.title || intent.fm.statement || slug,
    statement: intent.fm.statement || null,
    sponsor: sponsor ? { id: sponsor, resolves: ctx.humans.has(sponsor), source: src(`${RUNS_DIR}/${slug}/${has.intent ? ART.intent : ART.outcome}`) } : null,
    strategic_intent: strategic ? { id: strategic, resolves: ctx.intents.has(strategic), source: src(`${RUNS_DIR}/${slug}/${ART.intent}`) } : null,
    product_profile: intent.fm.product_profile ? { id: intent.fm.product_profile, resolves: ctx.productProfiles.has(intent.fm.product_profile), source: src(`${RUNS_DIR}/${slug}/${ART.intent}`) } : null,
    status, stage: { id: stage.id, name: stage.name, source: src(`${RUNS_DIR}/${slug}`, 'derived') }, blocked_by: blockedBy,
    artifacts: Object.fromEntries(Object.entries(ART).filter(([k]) => has[k]).map(([k, f]) => [k, `${RUNS_DIR}/${slug}/${f}`])),
    gates, gates_ok: v.ok, gates_source: src('discovery/gates/validate.mjs', 'executed-check'),
    signals: { count: signals.size, source: src(`${RUNS_DIR}/${slug}/${ART.research}`) },
    hypotheses: hypotheses(problem.body, reaction.body, outcome.fm),
    prototype: proto,
    data_governance: has.dataGov ? { verdict: G.D6?.verdict ?? null, risks: [...drIds(dg)], controls: [...ctrlIds(dg)], obligations: [...obIds(dg)], uncovered, source: src(`${RUNS_DIR}/${slug}/${ART.dataGov}`) } : null,
    handoff: has.handoff ? {
      problem: bullet(handoff.body, 'Problem'), target_user: bullet(handoff.body, 'Target user'), success: bullet(handoff.body, 'Success measures'),
      out_of_scope: bullet(handoff.body, 'Explicitly out of scope'), verdict: bullet(handoff.body, 'Residual-risk verdict'),
      source: src(`${RUNS_DIR}/${slug}/${ART.handoff}`),
    } : null,
    outcome: has.outcome ? { outcome: outcome.fm.outcome, decided_by: outcome.fm.decided_by, decided_at: outcome.fm.decided_at, reason: outcome.fm.reason, source: src(`${RUNS_DIR}/${slug}/${ART.outcome}`) } : null,
    npa: npa ? { receipt: npa.receipt, decision: npa.decision, approved_by: npa.approved_by, decided_at: npa.decided_at, conditions: npa.conditions || [], valid_until: npa.valid_until, evidence_status: npa.evidence_status || null, source: src(`${RUNS_DIR}/${slug}/${ART.npa}`) } : null,
    synthetic: /\[synthetic\]/.test(readText(file('research'))),
  };
}

function readBrainkit(cwd) {
  const mp = join(cwd, 'institution/brainkit/manifest.json');
  const m = readJson(mp);
  if (!m) return null;
  const strat = readText(join(cwd, 'institution/brainkit/strategy.md'));
  const intents = [];
  for (const cells of filledRows(section(strat, 'Intents'), ['id', 'intent'])) {
    const id = (cells[0] || '').match(/SI-\d+/)?.[0];
    if (id) intents.push({ id, intent: cells[1], owner_role: cells[2], measure: cells[3], source_id: cells[4], pursued: true });
  }
  for (const cells of filledRows(section(strat, 'Explicitly not pursued'), ['id', 'intent'])) {
    const id = (cells[0] || '').match(/SI-P\d+/)?.[0];
    if (id) intents.push({ id, intent: cells[1], rationale: cells[2], source_id: cells[3], pursued: false });
  }
  const tp = readJson(join(cwd, 'institution/brainkit/technology-policy.json')) || {};
  const check = existsSync(join(cwd, 'scripts/brainkit-check.mjs')) ? spawnSync(process.execPath, ['scripts/brainkit-check.mjs'], { cwd, encoding: 'utf8' }) : null;
  const placeholder = JSON.stringify(m).includes('ADOPT:');
  return {
    id: m.brainkit_id, version: m.version, status: placeholder ? 'adopt-pending' : m.status, effective_at: m.effective_at,
    package_digest: m.package_digest, owners: m.owners, approvals: m.approvals || [],
    sections: (m.sections || []).map((s) => ({ section: s.section, path: `institution/brainkit/${s.path}`, digest: s.digest, sources: s.sources })),
    intents, radar: (tp.radar?.entries || []).map((e) => ({ technology: e.technology, ring: e.ring, owner: e.owner, review_by: e.review_by || null })),
    check: check ? { ok: check.status === 0, summary: (check.stdout || check.stderr).trim().split('\n').slice(-1)[0], source: src('scripts/brainkit-check.mjs', 'executed-check') } : null,
    source: src('institution/brainkit/manifest.json'),
  };
}

function readRegisters(cwd) {
  const R = join(cwd, 'docs/governance/data-risk-register');
  const arr = (f) => { const j = readJson(join(R, f)); return Array.isArray(j) ? j : []; };
  const ob = readJson(join(cwd, 'docs/governance/obligations.json'));
  return {
    risk_categories: arr('risk-taxonomy.json').map((t) => ({ id: t.risk_category_id, name: t.risk_category_name, domain: t.risk_domain_name })),
    risks: arr('risk-statements.json').map((r) => ({ id: r.risk_id, category: r.risk_category_id, inherent: r.inherent_rating, residual: r.residual_rating, controls: r.control_ids })),
    controls: arr('controls.json').map((c) => ({ id: c.control_id, name: c.control_name, owner: c.control_owner, risks: c.risk_ids, automation: c.automation_level })),
    obligations: (ob?.obligations || []).map((o) => ({
      id: o.id, title: o.title, source: o.source, owner_role: o.owner_role, last_verified: o.last_verified, illustrative: !!o.illustrative,
      // What the citation actually is: a real article, a stand-in the demo wrote over the template, or
      // a source named with the article deliberately left for its owner to verify.
      article_status: /^demo fixture/i.test(o.article || '') ? 'demo-stand-in' : /to be verified|verify/i.test(o.article || '') ? 'owner-verification-pending' : o.article ? 'cited' : 'missing',
      risks: o.risk_ids, controls: o.control_ids,
    })),
    source: src('docs/governance/data-risk-register'),
    obligations_source: src('docs/governance/obligations.json'),
  };
}

function readControlCatalog(cwd) {
  const c = readJson(join(cwd, 'docs/governance/control-catalog.json'));
  if (!c) return null;
  const ladder = ['absent', 'defined', 'mechanically-validated', 'platform-enforced', 'organisationally-enforced'];
  const counts = Object.fromEntries(ladder.map((s) => [s, 0]));
  for (const x of c.controls || []) counts[x.state] = (counts[x.state] || 0) + 1;
  return {
    ladder, counts, total: (c.controls || []).length,
    governance: (c.controls || []).filter((x) => /^HG-/.test(x.control_id)).map((x) => ({ id: x.control_id, objective: x.objective, state: x.state, owner_role: x.owner_role })).sort((a, b) => a.id.localeCompare(b.id)),
    below_validated: (c.controls || []).filter((x) => ['absent', 'defined'].includes(x.state)).map((x) => ({ id: x.control_id, objective: x.objective, state: x.state, owner_role: x.owner_role, note: x.note || null })),
    source: src('docs/governance/control-catalog.json'),
  };
}

function readInstallation(cwd) {
  const a = readJson(join(cwd, '.loom/adoption.json'));
  const s = readJson(join(cwd, '.claude/settings.json'));
  const hooks = [];
  for (const [event, groups] of Object.entries(s?.hooks || {})) for (const g of groups) for (const h of g.hooks || []) hooks.push({ event, matcher: g.matcher || null, name: h.statusMessage || basename(String(h.command || '')).replace(/"/g, ''), command: h.command });
  const wfDir = join(cwd, '.github/workflows');
  const ci = existsSync(wfDir) ? readdirSync(wfDir).filter((f) => /\.ya?ml$/.test(f)).map((f) => ({ file: `.github/workflows/${f}`, steps: [...readText(join(wfDir, f)).matchAll(/^\s*-\s*name:\s*(.+)$/gm)].map((m) => m[1].trim()) })) : [];
  const residency = existsSync(join(cwd, 'docs/governance/residency-approval.json'));
  return {
    bundle_version: a?.bundle_version || null, adopted_at: a?.first_adopted_at || null, tier: a?.tier || null,
    hooks, ci, agents: existsSync(join(cwd, '.claude/agents')) ? readdirSync(join(cwd, '.claude/agents')).filter((f) => f.endsWith('.md')) : [],
    seams: {
      brainkit: existsSync(join(cwd, 'institution/brainkit/manifest.json')),
      register: existsSync(join(cwd, 'docs/governance/data-risk-register/risk-taxonomy.json')),
      obligations: existsSync(join(cwd, 'docs/governance/obligations.json')),
      brand: existsSync(join(cwd, 'discovery/brand/design.md')),
      floor: residency,
    },
    floor_blocked_by: residency ? null : 'docs/governance/residency-approval.json is not present, so residency-check refuses floor content',
    source: src('.loom/adoption.json'),
  };
}

function git(cwd) {
  const r = spawnSync('git', ['log', '-1', '--format=%H %cI'], { cwd, encoding: 'utf8' });
  if (r.status !== 0) return { commit: null, committed_at: null, note: 'not a git checkout: ages come from the records themselves, not from commit history' };
  const [commit, at] = r.stdout.trim().split(' ');
  const b = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd, encoding: 'utf8' });
  return { commit, committed_at: at, branch: b.stdout.trim() || null };
}

/** Dated events that are actually in the record. Nothing here is inferred. */
function trail(cwd, runs, bk, signals, changes) {
  const ev = [];
  for (const a of bk?.approvals || []) ev.push({ at: a.at, kind: 'approval', actor: a.by, what: `BrainKit ${a.version} approved`, detail: a.note || null, source: bk.source });
  for (const r of runs) {
    if (r.outcome?.decided_at) ev.push({ at: r.outcome.decided_at, kind: 'decision', actor: r.outcome.decided_by, what: `${r.slug}: ${r.outcome.outcome}`, detail: r.outcome.reason, source: r.outcome.source });
    if (r.npa?.decided_at) ev.push({ at: r.npa.decided_at, kind: 'decision', actor: r.npa.approved_by, what: `${r.slug}: ${r.npa.receipt} ${r.npa.decision}`, detail: `${r.npa.conditions.length} conditions · valid until ${r.npa.valid_until}`, source: r.npa.source });
    if (r.prototype?.reaction_bound_to) ev.push({ at: null, kind: 'binding', actor: null, what: `${r.slug}: stakeholder reaction bound to prototype ${r.prototype.reaction_bound_to.slice(0, 12)}…`, detail: r.prototype.reaction_binding === 'bound' ? 'digest matches the prototype on disk' : 'STALE: the prototype changed after the reaction', source: src(`${RUNS_DIR}/${r.slug}/${ART.reaction}`, 'executed-check') });
  }
  for (const s of signals) ev.push({ at: s.detected, kind: 'signal', actor: s.source, what: `${s.id} routed ${s.route}${s.link ? ` → ${s.link}` : ''}`, detail: s.summary, source: src('docs/governance/operations-signal.json') });
  for (const c of changes) for (const h of c.state_history || []) ev.push({ at: h.at, kind: 'change', actor: h.by, what: `${c.change_id} → ${h.state}`, detail: null, source: src(`docs/governance/changes/${c.change_id}/change-envelope.json`) });
  return ev.sort((a, b) => String(a.at || '9').localeCompare(String(b.at || '9')));
}

export function consoleData(cwd = process.cwd(), { now = Date.now() } = {}) {
  const ids = readJson(join(cwd, 'docs/governance/identities.json')) || { identities: [] };
  const humans = new Map((ids.identities || []).filter((i) => i.kind === 'human').map((i) => [i.id, i]));
  const bk = readBrainkit(cwd);
  const intents = new Set((bk?.intents || []).map((i) => i.id));
  const profDir = join(cwd, 'profiles/products');
  const productProfiles = new Set(existsSync(profDir) ? readdirSync(profDir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')) : []);
  const regDir = join(cwd, 'docs/governance/data-risk-register');
  const validateOpts = {
    registerDir: existsSync(regDir) ? regDir : undefined, register: existsSync(regDir) ? undefined : null,
    brandPath: join(cwd, 'discovery/brand/design.md'),
    obligationsPath: existsSync(join(cwd, 'docs/governance/obligations.json')) ? join(cwd, 'docs/governance/obligations.json') : undefined,
  };
  const runsDir = join(cwd, RUNS_DIR);
  const slugs = existsSync(runsDir) ? readdirSync(runsDir).filter((d) => statSync(join(runsDir, d)).isDirectory()).sort() : [];
  const runs = slugs.map((s) => readRun(cwd, s, { humans, intents, productProfiles, validateOpts }));
  const sig = readJson(join(cwd, 'docs/governance/operations-signal.json'))?.signals || [];
  const chDir = join(cwd, 'docs/governance/changes');
  const changes = existsSync(chDir) ? readdirSync(chDir).map((d) => readJson(join(chDir, d, 'change-envelope.json'))).filter(Boolean) : [];
  const queue = approvalQueue(cwd, now);
  const roleHolders = {};
  for (const h of humans.values()) for (const r of h.roles || []) (roleHolders[r] ||= []).push(h.id);
  const queueRows = queue.rows.map((r) => ({ ...r, holders: roleHolders[r.role] || [] }));
  return {
    schema: SCHEMA,
    generated_at: new Date(now).toISOString(),
    generator: 'scripts/console-data.mjs',
    authority: 'none',
    repository: git(cwd),
    institution: { profile: readdirSync(join(cwd, 'profiles/institutions')).filter((f) => f.endsWith('.json') && !f.includes('template')).map((f) => f.replace(/\.json$/, ''))[0] || null },
    identities: [...humans.values()].map((h) => ({ id: h.id, display: h.display || null, roles: h.roles || [] })),
    brainkit: bk,
    registers: readRegisters(cwd),
    control_catalog: readControlCatalog(cwd),
    product_profiles: [...productProfiles].sort(),
    runs,
    signals: sig.map((s) => ({ id: s.id, source: s.source, type: s.type, severity: s.severity, detected: s.detected, route: s.route, link: s.link || null, summary: s.summary, caused_by_change: s.caused_by_change || null })),
    changes: changes.map((c) => ({ change_id: c.change_id, state: c.state, required_profiles: c.required_profiles || [], source: src(`docs/governance/changes/${c.change_id}/change-envelope.json`) })),
    approvals: { rows: queueRows, sla: queue.sla ? { default_target_days: queue.sla.default_target_days, wip_limit_per_role: queue.sla.wip_limit_per_role } : null, source: src('scripts/approval-status.mjs', 'telemetry') },
    installation: readInstallation(cwd),
    trail: trail(cwd, runs, bk, sig, changes),
    integrity: {
      unresolved_sponsors: runs.filter((r) => r.sponsor && !r.sponsor.resolves).map((r) => `${r.slug}: ${r.sponsor.id}`),
      unresolved_intents: runs.filter((r) => r.strategic_intent && !r.strategic_intent.resolves).map((r) => `${r.slug}: ${r.strategic_intent.id}`),
      unresolved_profiles: runs.filter((r) => r.product_profile && !r.product_profile.resolves).map((r) => `${r.slug}: ${r.product_profile.id}`),
      stale_reactions: runs.filter((r) => r.prototype?.reaction_binding === 'stale').map((r) => r.slug),
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const nowArg = opt('--now');
  const data = consoleData(process.cwd(), { now: nowArg ? Date.parse(nowArg) : Date.now() });
  const text = JSON.stringify(data, null, args.includes('--pretty') ? 2 : 0) + '\n';
  const out = opt('--out');
  if (out) { mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, text); process.stderr.write(`console data → ${out} (${data.runs.length} runs, ${data.trail.length} trail events)\n`); }
  else process.stdout.write(text);
}
