// Runner identity, VERIFIED (PR6's second half; kosli-seam.md §5 question 3, the Loom's side).
//
// A record envelope names the CI runner that produced it — subject, repository, ref, sha — from the
// CI environment (external-record.mjs runnerFromEnv). That is a declaration: any process with the
// same variables could write it. GitHub Actions can also hand the job a short-lived OIDC ID token,
// signed by GitHub, whose claims say the same things. Carried on the envelope and verified against
// the issuer's published keys, the runner row stops being DECLARED and becomes VERIFIED — by the
// Loom, before the record is posted, and by any auditor later while the key is still published.
//
// What is checked: RS256 signature against a key from the JWKS by `kid`; issuer pinned to GitHub's;
// audience pinned to `loom-record` (a token minted for the Loom is useless to a cloud provider that
// trusts a different audience); expiry; and that subject, repository, ref and sha on the envelope
// equal the token's claims. Anything else is a finding, named.
//
// What is NOT claimed: the token proves a GitHub job with that identity asked for it — not that the
// job ran the gate honestly. That remains PR1's rule (the result comes from the tool) plus the
// platform enforcement that HG-0005 grades. And a token attached by hand to a hand-named runner
// (LOOM_RUNNER_*) would only launder the declaration, so attaching is inert in that case.
import { createPublicKey, verify as cryptoVerify } from 'node:crypto';

export const AUDIENCE = 'loom-record';
export const GITHUB_ISSUER = 'https://token.actions.githubusercontent.com';
export const JWKS_URL = `${GITHUB_ISSUER}/.well-known/jwks`;
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const RUNNER_CLAIMS = { subject: 'sub', repository: 'repository', ref: 'ref', sha: 'sha' };

const fromB64u = (s) => Buffer.from(String(s), 'base64url');

/** Split a compact JWT into header, claims, the signing input and the signature bytes. Throws on shape. */
export function decodeJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('not a compact JWT (expected three dot-separated parts)');
  let header, claims;
  try { header = JSON.parse(fromB64u(parts[0]).toString('utf8')); claims = JSON.parse(fromB64u(parts[1]).toString('utf8')); } catch { throw new Error('JWT header or claims are not base64url JSON'); }
  return { header, claims, signingInput: `${parts[0]}.${parts[1]}`, signature: fromB64u(parts[2]) };
}

/**
 * Verify a token against a JWKS. { ok, claims, kid, findings }. Every finding is a reason the
 * token proves nothing; an empty list means signature, issuer, audience and time all hold.
 */
export function verifyJwt(token, jwks, { audience = AUDIENCE, issuer = GITHUB_ISSUER, now = Date.now(), leewayMs = 60_000 } = {}) {
  const findings = [];
  let d;
  try { d = decodeJwt(token); } catch (e) { return { ok: false, claims: null, kid: null, findings: [e.message] }; }
  const { header, claims } = d;
  if (header.alg !== 'RS256') findings.push(`token alg is ${JSON.stringify(header.alg)}, not RS256 — only RSA-SHA256 signatures are accepted`);
  const key = (jwks?.keys || []).find((k) => k.kid === header.kid);
  if (!key) findings.push(`no key ${JSON.stringify(header.kid)} in the JWKS — the token was not signed by a published issuer key`);
  if (findings.length) return { ok: false, claims, kid: header.kid ?? null, findings };
  let sigOk = false;
  try { sigOk = cryptoVerify('sha256', Buffer.from(d.signingInput, 'utf8'), createPublicKey({ key, format: 'jwk' }), d.signature); } catch (e) { findings.push(`signature check failed to run: ${e.message}`); }
  if (!sigOk && !findings.length) findings.push('signature does not verify against the issuer key — the token was altered or not issued by this issuer');
  if (claims.iss !== issuer) findings.push(`issuer is ${JSON.stringify(claims.iss)}, expected ${issuer}`);
  const auds = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!auds.includes(audience)) findings.push(`audience is ${JSON.stringify(claims.aud)}, not ${audience} — a token minted for someone else`);
  const t = now / 1000;
  if (typeof claims.exp !== 'number') findings.push('token has no exp');
  else if (claims.exp + leewayMs / 1000 < t) findings.push(`token expired at ${new Date(claims.exp * 1000).toISOString()}`);
  if (typeof claims.nbf === 'number' && claims.nbf - leewayMs / 1000 > t) findings.push('token is not yet valid (nbf in the future)');
  return { ok: findings.length === 0, claims, kid: header.kid, findings };
}

/** The runner record a token's claims describe. */
export function runnerFromClaims(claims) {
  return { subject: claims?.sub ?? null, repository: claims?.repository ?? null, ref: claims?.ref ?? null, sha: claims?.sha ?? null, run: claims?.run_id != null ? String(claims.run_id) : null, workflow: claims?.job_workflow_ref ?? null };
}

/**
 * Findings where the envelope's runner record disagrees with the token's claims. `fields` narrows the
 * comparison: the environment synthesises `subject` as repo:<repo>:ref:<ref>, but GitHub's token says
 * `repo:<repo>:pull_request` on a pull-request event (and other shapes for environments and tags), so a
 * caller comparing a synthesised record checks the concrete claims and lets the token name the subject.
 */
export function runnerFindings(runner, claims, { fields = Object.keys(RUNNER_CLAIMS) } = {}) {
  const f = [];
  for (const [field, claim] of Object.entries(RUNNER_CLAIMS)) {
    if (!fields.includes(field)) continue;
    const a = runner?.[field], b = claims?.[claim];
    if (isStr(a) && isStr(b) && a !== b) f.push(`runner ${field} ${JSON.stringify(a)} does not match the token's ${claim} ${JSON.stringify(b)}`);
    else if (isStr(a) && !isStr(b)) f.push(`the token carries no ${claim} to check the runner's ${field} against`);
  }
  return f;
}

/** [] when the runner carries no token (nothing to verify) or the token verifies and matches; else the reasons. */
export function verifyRunner(runner, { jwks, audience = AUDIENCE, issuer = GITHUB_ISSUER, now = Date.now() } = {}) {
  const token = runner?.oidc?.token;
  if (!isStr(token)) return [];
  if (!jwks) return [];
  const v = verifyJwt(token, jwks, { audience, issuer, now });
  if (!v.ok) return v.findings.map((x) => `runner OIDC token: ${x}`);
  return runnerFindings(runner, v.claims);
}

/** Ask the platform for an ID token for our audience. null when the platform offers none. */
export async function requestIdToken(env = process.env, { audience = AUDIENCE, fetchImpl = globalThis.fetch, timeoutMs = 10_000 } = {}) {
  const url = env.ACTIONS_ID_TOKEN_REQUEST_URL, bearer = env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!isStr(url) || !isStr(bearer) || typeof fetchImpl !== 'function') return null;
  const sep = url.includes('?') ? '&' : '?';
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs) : null;
  try {
    const r = await fetchImpl(`${url}${sep}audience=${encodeURIComponent(audience)}`, { headers: { Authorization: `bearer ${bearer}`, Accept: 'application/json; api-version=2.0' }, signal: ctl?.signal });
    if (!r?.ok) return null;
    const j = await r.json();
    return isStr(j?.value) ? j.value : null;
  } catch { return null; } finally { if (timer) clearTimeout(timer); }
}

/** The issuer's published keys, or null when unreachable — the caller says "not verified here", never "verified". */
export async function fetchJwks({ url = JWKS_URL, fetchImpl = globalThis.fetch, timeoutMs = 5_000 } = {}) {
  if (typeof fetchImpl !== 'function') return null;
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs) : null;
  try { const r = await fetchImpl(url, { signal: ctl?.signal }); if (!r?.ok) return null; const j = await r.json(); return Array.isArray(j?.keys) ? j : null; }
  catch { return null; } finally { if (timer) clearTimeout(timer); }
}

/**
 * Attach the platform's token to a runner record. Inert when: the platform offers no token; the
 * runner was named by hand (LOOM_RUNNER_*), because a platform token cannot vouch for a declaration
 * it did not make; or there is no runner. Returns a new record; never throws.
 */
export async function attachOidc(runner, env = process.env, { audience = AUDIENCE, fetchImpl = globalThis.fetch } = {}) {
  if (!runner || typeof runner !== 'object') return runner;
  if (isStr(env.LOOM_RUNNER_SUBJECT) || isStr(env.LOOM_RUNNER_REPOSITORY) || isStr(env.LOOM_RUNNER_SHA)) return runner;
  const token = await requestIdToken(env, { audience, fetchImpl });
  if (!token) return runner;
  let d;
  try { d = decodeJwt(token); } catch { return runner; }
  // The token is the authority for the subject: the environment can only synthesise repo:<repo>:ref:<ref>,
  // and the platform's own `sub` differs by event (pull_request, environment, tag). Repository, ref and
  // sha stay as the environment stated them and are checked against the claims on verification.
  return { ...runner, subject: isStr(d.claims.sub) ? d.claims.sub : runner.subject, oidc: { token, iss: d.claims.iss ?? null, aud: d.claims.aud ?? null, sub: d.claims.sub ?? null, kid: d.header.kid ?? null, exp: d.claims.exp ?? null } };
}
