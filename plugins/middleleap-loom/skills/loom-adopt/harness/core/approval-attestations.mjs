// The approval-attestation contract (Factory Floor WS2 · D2.4). When a product approval is
// made somewhere other than the repository — a collaboration surface, a workflow tool, an
// approval page — the decision must come home as evidence that survives an auditor's two
// questions: WHO decided, and WHAT exactly did they approve.
//
// Two signatures, two different meanings, and the whole contract turns on not confusing them:
//
//   subject.assertion       — the HUMAN's proof. Issued by the institution's identity provider
//                             (the assertion-issuers registry), binding an immutable subject to
//                             THIS decision payload via a nonce. This is what makes the approval
//                             an approval.
//   transcription.attestation — the BRIDGE's proof. The service that carried the decision from
//                             the external surface into the repository signs that it transcribed
//                             faithfully. It proves custody, never authority.
//
// A bridge-signed record with no subject assertion authenticates the worker, not the approver —
// a service key saying "a human clicked" is an assertion about the service, not about the human.
// This module refuses that shape outright: an assertion signed by a key from the ATTESTATION
// issuers registry (service keys) is rejected, the transcriber may never be the subject, and the
// payload the human signs names the plan hash and the content digests, so an approval cannot
// survive the thing it approved being changed underneath it.
//
// Honest gaps, in the tradition of `attestations.mjs`: `ed25519` assertion material is verified
// here for real; `oidc-step-up` and `sigstore` declare mechanisms an adopter wires to pinned IdP
// metadata, and are reported UNVERIFIED-HERE — a finding, never a silent pass.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { verifySignatureOver } from './attestations.mjs';

export const SCHEMA_ID = 'loom.approval-attestation/v1';
export const APPROVALS_SUBDIR = 'approvals';
export const ASSERTION_ISSUERS_LOCATIONS = ['docs/governance/assertion-issuers.json', 'assertion-issuers.json'];
/** Mechanisms an assertion may declare. Only `ed25519` is verified by this module. */
export const ASSERTION_MECHANISMS = new Set(['ed25519', 'oidc-step-up', 'sigstore']);
/** The capability a compiled plan sets to make envelope-backed approvals mandatory. */
export const CAPABILITY = 'approval_attestation';

export function loadAssertionIssuers(cwd = process.cwd()) {
  const path = ASSERTION_ISSUERS_LOCATIONS.map((p) => `${cwd}/${p}`).find(existsSync);
  if (!path) return null;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

/** Is this change's plan requiring envelope-backed approvals? (mandatory-when-compiled) */
export function attestationRequired(plan) {
  return Boolean(plan?.required_capabilities?.[CAPABILITY]?.required);
}

export const sha256 = (s) => `sha256:${createHash('sha256').update(s, 'utf8').digest('hex')}`;

/**
 * The exact string a human's assertion must bind. Deterministic and order-fixed — no JSON
 * key-order ambiguity, so a verifier and an issuer cannot disagree about what was signed.
 * Binding the plan hash and the content digests is what stops an approval outliving its subject.
 *
 * Each field is JSON-encoded before joining. A bare newline-join would be ambiguous: a value
 * containing a newline could shift the remaining fields and let two DIFFERENT records produce
 * the same signed string. Encoding escapes the delimiter, so one payload means one record.
 */
export function canonicalDecisionPayload(rec) {
  const b = rec?.bound_to || {};
  return [
    SCHEMA_ID,
    rec?.change_id ?? '',
    rec?.stage ?? '',
    rec?.outcome ?? '',
    rec?.role ?? '',
    rec?.subject?.registry_id ?? '',
    rec?.subject?.idp_subject ?? '',
    b.plan_hash ?? '',
    b.passport_digest ?? '',
    b.source_sha ?? '',
    b.artifact_digest ?? '',
    rec?.origin?.nonce ?? '',
    // The claimed decision time is signed too, so a carrier cannot back- or forward-date a
    // decision without breaking the human's signature. Without this the only anchor for "when"
    // is the merge time of the file, which is the bridge's word until git records it.
    rec?.validity?.issued_at ?? '',
  ].map((v) => JSON.stringify(typeof v === 'string' ? v : String(v ?? ''))).join('\n');
}

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const parseTime = (v) => { const t = Date.parse(v); return Number.isNaN(t) ? null : t; };

/**
 * Verify one approval-attestation record.
 *
 * ctx: {
 *   stage, role, by,            — what the passport claims, so the record must agree
 *   plan,                       — the compiled control plan (plan_hash, risk tier)
 *   passportDigest,             — digest of the passport as committed
 *   registry, issuers,          — identity registry · ATTESTATION (service) issuers
 *   assertionIssuers,           — IdP verification material
 *   resolveApprover, identityOf — injected from the identity gate (no cycle)
 *   seen,                       — Map of nonce/event ids already used (replay detection)
 *   now                         — ms epoch, for expiry
 * }
 * Findings ([] ⇒ the approval is authentically made by the named human over this exact subject).
 */
export function verifyApprovalAttestation(rec, ctx, label = 'approval') {
  const findings = [];
  if (!rec) return [`${label}: no approval attestation — an approval recorded only as a name in a file is a claim, not evidence`];
  if (rec.schema !== SCHEMA_ID) {
    findings.push(`${label}: schema ${JSON.stringify(rec.schema)} is not ${SCHEMA_ID} — an unversioned record cannot be verified`);
    return findings; // shape is unknown; every further check would be guesswork
  }

  // 1 · The record agrees with what the passport claims.
  if (rec.change_id !== ctx.plan?.change_id) findings.push(`${label}: change_id ${JSON.stringify(rec.change_id)} does not match the plan (${ctx.plan?.change_id})`);
  if (rec.stage !== ctx.stage) findings.push(`${label}: stage ${JSON.stringify(rec.stage)} does not match the passport stage ${ctx.stage}`);
  if (rec.role !== ctx.role) findings.push(`${label}: role ${JSON.stringify(rec.role)} does not match the required role ${ctx.role}`);
  if (rec.outcome !== 'approved') findings.push(`${label}: outcome ${JSON.stringify(rec.outcome)} — only an approved decision evidences an approval`);
  if (rec.subject?.registry_id !== ctx.by) findings.push(`${label}: subject ${JSON.stringify(rec.subject?.registry_id)} is not the approver named in the passport (${ctx.by})`);

  // 2 · WHO — the subject resolves to a human holding the role, and is not a service identity.
  findings.push(...ctx.resolveApprover(ctx.registry, rec.subject?.registry_id, rec.role, `${label} · subject`));
  if (!isStr(rec.subject?.idp_subject)) {
    findings.push(`${label}: subject.idp_subject missing — a workspace-scoped person id is reassignable; the immutable institutional subject is the pivot`);
  }

  // 3 · WHAT — bound to this exact plan and this exact content (nothing may change underneath).
  const b = rec.bound_to || {};
  if (!isStr(b.plan_hash)) findings.push(`${label}: bound_to.plan_hash missing — an approval not bound to a compiled plan approves nothing in particular`);
  else if (ctx.plan?.plan_hash && b.plan_hash !== ctx.plan.plan_hash) findings.push(`${label}: bound_to.plan_hash does not match the compiled plan — the plan changed after the decision`);
  if (!isStr(b.passport_digest)) findings.push(`${label}: bound_to.passport_digest missing — the approved content is not pinned`);
  else if (ctx.passportDigest && b.passport_digest !== ctx.passportDigest) findings.push(`${label}: bound_to.passport_digest does not match the passport — the content changed after the decision was made`);
  if (rec.stage === 'PA1' && !isStr(b.source_sha)) findings.push(`${label}: PA1 requires bound_to.source_sha — permission to develop is granted against a source state`);
  if (rec.stage === 'PA2' && !isStr(b.artifact_digest)) findings.push(`${label}: PA2 requires bound_to.artifact_digest — permission to launch is granted against the built artifact, not a commit`);

  // 4 · WHERE — origin provenance, and replay.
  const o = rec.origin || {};
  for (const f of ['system', 'event_id', 'nonce']) {
    if (!isStr(o[f])) findings.push(`${label}: origin.${f} missing — provenance and replay protection depend on it`);
  }
  if (ctx.seen && isStr(o.nonce)) {
    const key = `${o.system}:${o.nonce}`;
    const prior = ctx.seen.get(key);
    if (prior && prior !== label) findings.push(`${label}: origin.nonce replays ${prior} — a decision nonce is single-use`);
    else ctx.seen.set(key, label);
  }
  if (ctx.seen && isStr(o.event_id)) {
    const key = `${o.system}:event:${o.event_id}`;
    const prior = ctx.seen.get(key);
    if (prior && prior !== label) findings.push(`${label}: origin.event_id replays ${prior} — webhooks are signals, deduplicated on event id`);
    else ctx.seen.set(key, label);
  }

  // 5 · WHEN — validity.
  const v = rec.validity || {};
  if (v.revoked === true) findings.push(`${label}: the attestation is revoked`);
  const now = ctx.now ?? Date.now();
  const exp = parseTime(v.expires_at);
  if (isStr(v.expires_at) && exp === null) findings.push(`${label}: validity.expires_at is not a parseable timestamp`);
  else if (exp !== null && exp < now) findings.push(`${label}: the attestation expired at ${v.expires_at}`);

  // 6 · The HUMAN's assertion — the finding-F1 teeth.
  findings.push(...verifySubjectAssertion(rec, ctx, label));

  // 7 · The BRIDGE's transcription — custody, never authority.
  findings.push(...verifyTranscription(rec, ctx, label));

  return findings;
}

/**
 * The human's proof, verified independently of whatever carried it. Three refusals live here:
 * an absent assertion, an assertion signed by a SERVICE key (the bridge vouching for the human),
 * and an assertion that does not bind this exact decision payload.
 */
export function verifySubjectAssertion(rec, ctx, label) {
  const a = rec?.subject?.assertion;
  if (!a) return [`${label}: subject.assertion missing — without it the record proves only that a service wrote a file`];
  const findings = [];
  if (!ASSERTION_MECHANISMS.has(a.mechanism)) {
    return [`${label}: assertion mechanism ${JSON.stringify(a.mechanism)} is not one of ${[...ASSERTION_MECHANISMS].join(' | ')}`];
  }
  if (!isStr(a.issuer)) return [`${label}: assertion has no issuer — an unattributed assertion is not evidence`];

  // A service key may never vouch for a human. This is the whole point of the contract.
  const serviceIssuer = (ctx.issuers?.issuers || []).some((i) => i.id === a.issuer);
  if (serviceIssuer) {
    findings.push(`${label}: assertion issuer ${JSON.stringify(a.issuer)} is a registered SERVICE attestation issuer — a service signing for a human authenticates the service, not the approver`);
  }
  if (isStr(rec?.transcription?.by) && a.issuer === rec.transcription.by) {
    findings.push(`${label}: the transcriber ${JSON.stringify(a.issuer)} issued the subject assertion — the bridge transcribes, it never vouches`);
  }

  // The assertion must bind THIS decision: audience, subject, and a nonce over the payload.
  const payload = canonicalDecisionPayload(rec);
  if (isStr(a.subject) && isStr(rec?.subject?.idp_subject) && a.subject !== rec.subject.idp_subject) {
    findings.push(`${label}: assertion subject ${JSON.stringify(a.subject)} is not the record's idp_subject`);
  }
  if (isStr(a.nonce) && a.nonce !== sha256(payload)) {
    findings.push(`${label}: assertion nonce does not bind the decision payload — the assertion could be replayed onto a different decision`);
  } else if (!isStr(a.nonce)) {
    findings.push(`${label}: assertion carries no nonce over the decision payload — binding is what separates an approval from a login`);
  }
  // An identity-provider assertion is SHORT-LIVED by design — a step-up ID token lives minutes.
  // It must have been valid when the HUMAN DECIDED, not when a gate re-verifies it months later:
  // checking it against verification time would make every genuine approval rot on a timer, and
  // the contract would be unusable with exactly the mechanism it recommends. The decision time is
  // itself signed (it is in the canonical payload), so a carrier cannot move it to suit.
  const decidedAt = parseTime(rec?.validity?.issued_at);
  const aExp = parseTime(a.expires_at);
  const aIat = parseTime(a.issued_at);
  if (decidedAt === null) {
    findings.push(`${label}: validity.issued_at is missing or unparseable — without a signed decision time the assertion's own validity window cannot be judged`);
  } else {
    if (aExp !== null && aExp < decidedAt) findings.push(`${label}: the subject assertion had already expired when the decision was made (assertion expired ${a.expires_at}, decision ${rec.validity.issued_at})`);
    if (aIat !== null && aIat > decidedAt) findings.push(`${label}: the subject assertion was issued after the decision it attests (${a.issued_at} > ${rec.validity.issued_at})`);
  }

  // Verification material: real for ed25519, honestly reported for the platform mechanisms.
  const reg = ctx.assertionIssuers;
  if (!reg) {
    findings.push(`${label}: no assertion-issuers registry (${ASSERTION_ISSUERS_LOCATIONS[0]}) — the identity provider's verification material is not pinned, so the assertion is UNVERIFIED-HERE`);
    return findings;
  }
  const idp = (reg.issuers || []).find((i) => i.id === a.issuer);
  if (!idp) {
    findings.push(`${label}: assertion issuer ${JSON.stringify(a.issuer)} is not in the assertion-issuers registry — an unpinned identity provider is not trusted`);
    return findings;
  }
  if (a.mechanism === 'ed25519' && idp.mechanism === 'ed25519') {
    findings.push(...verifySignatureOver(payload, { issuer: a.issuer, signature: a.signature }, reg, 'decision payload')
      .map((f) => `${label}: ${f}`));
  } else {
    findings.push(`${label}: assertion mechanism ${JSON.stringify(a.mechanism)} is verified against pinned identity-provider metadata by the platform, not by this module — wire it per the registry and record activation evidence; until then this assertion is UNVERIFIED-HERE`);
  }
  return findings;
}

/** The bridge's custody proof: a registered service issuer, never the subject, holding no role. */
export function verifyTranscription(rec, ctx, label) {
  const t = rec?.transcription;
  if (!t) return [`${label}: transcription block missing — the chain of custody from the external surface is unrecorded`];
  const findings = [];
  if (!isStr(t.by)) findings.push(`${label}: transcription.by missing — the carrying identity is unnamed`);
  if (isStr(t.by) && t.by === rec?.subject?.registry_id) {
    findings.push(`${label}: the transcriber and the approver are the same identity (${t.by}) — custody and decision must be separable`);
  }
  const who = isStr(t.by) && ctx.identityOf ? ctx.identityOf(ctx.registry, t.by) : null;
  if (isStr(t.by) && !who) findings.push(`${label}: transcriber ${JSON.stringify(t.by)} is not in the identity registry`);
  if (who && (who.roles || []).length > 0) {
    findings.push(`${label}: transcriber ${t.by} holds approval roles (${(who.roles || []).join(', ')}) — the bridge must hold none`);
  }
  findings.push(...verifySignatureOver(canonicalDecisionPayload(rec), t.attestation, ctx.issuers, 'transcribed decision')
    .map((f) => `${label}: ${f}`));
  return findings;
}

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

/** Load a change's approval attestations: [{ file, record }]. */
export function loadApprovals(changeDir) {
  const dir = `${changeDir}/${APPROVALS_SUBDIR}`;
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith('.json'))
    .sort()
    .map((n) => ({ file: n, record: readJson(`${dir}/${n}`) }));
}

/** The digest of a passport as committed — what an approval binds itself to. */
export function passportDigest(changeDir) {
  const p = `${changeDir}/product-passport.json`;
  if (!existsSync(p)) return null;
  return sha256(readFileSync(p, 'utf8'));
}

// CLI: print the canonical decision payload and its digest for a record — the string an
// identity provider must bind, so an adopter can wire their signer without guessing.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = process.argv[2];
  if (!path) {
    process.stderr.write('usage: node core/approval-attestations.mjs <approval-record.json>\n');
    process.exit(2);
  }
  const rec = readJson(path);
  if (!rec) { process.stderr.write(`cannot read ${path}\n`); process.exit(2); }
  const payload = canonicalDecisionPayload(rec);
  process.stdout.write(`${payload}\n\n--- digest (the assertion nonce) ---\n${sha256(payload)}\n`);
}
