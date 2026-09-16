// runner-identity: the CI runner's OIDC token is VERIFIED, not declared — RS256 against the
// issuer's JWKS, issuer and audience pinned, expiry honoured, and every claim the runner record
// asserts (subject, repository, ref, sha) must match the token. A token for another audience, an
// expired one, a tampered one, or one from an unknown key verifies nothing. Attaching is inert
// where no platform issues a token, and when the runner was named by hand (LOOM_RUNNER_*).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSign, generateKeyPairSync } from 'node:crypto';
import { AUDIENCE, GITHUB_ISSUER, attachOidc, decodeJwt, requestIdToken, runnerFindings, runnerFromClaims, verifyJwt, verifyRunner } from './runner-identity.mjs';
import { buildEnvelope, evaluateProvenance, signEnvelope } from './provenance.mjs';

const b64u = (b) => Buffer.from(b).toString('base64url');
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const KID = 'test-kid-1';
const JWKS = { keys: [{ ...publicKey.export({ format: 'jwk' }), kid: KID, alg: 'RS256', use: 'sig' }] };
const NOW = Date.parse('2026-09-16T12:00:00Z');
const SHA = 'b'.repeat(40);
const CLAIMS = { iss: GITHUB_ISSUER, aud: AUDIENCE, sub: 'repo:demo-bank/credit:ref:refs/heads/main', repository: 'demo-bank/credit', ref: 'refs/heads/main', sha: SHA, run_id: '12345', job_workflow_ref: 'demo-bank/credit/.github/workflows/validate.yml@refs/heads/main', iat: NOW / 1000 - 30, exp: NOW / 1000 + 300 };

function mint(claims = CLAIMS, { kid = KID, key = privateKey, alg = 'RS256' } = {}) {
  const header = { alg, typ: 'JWT', kid };
  const input = `${b64u(JSON.stringify(header))}.${b64u(JSON.stringify(claims))}`;
  const s = createSign('RSA-SHA256'); s.update(input); s.end();
  return `${input}.${s.sign(key).toString('base64url')}`;
}
const RUNNER = { subject: CLAIMS.sub, repository: CLAIMS.repository, ref: CLAIMS.ref, sha: SHA };

test('a token from the issuer, for our audience, signed by a published key, verifies and yields its claims', () => {
  const tok = mint();
  const d = decodeJwt(tok);
  assert.equal(d.header.kid, KID);
  const v = verifyJwt(tok, JWKS, { now: NOW });
  assert.deepEqual(v.findings, []);
  assert.equal(v.ok, true);
  assert.equal(v.claims.sha, SHA);
  assert.deepEqual(runnerFromClaims(v.claims), { subject: CLAIMS.sub, repository: 'demo-bank/credit', ref: 'refs/heads/main', sha: SHA, run: '12345', workflow: CLAIMS.job_workflow_ref });
});

test('wrong audience, wrong issuer, expired, tampered, and unknown key each verify nothing — and say why', () => {
  const cases = [
    ['audience', mint({ ...CLAIMS, aud: 'sts.amazonaws.com' }), /audience/],
    ['issuer', mint({ ...CLAIMS, iss: 'https://example.com' }), /issuer/],
    ['expired', mint({ ...CLAIMS, exp: NOW / 1000 - 300 }), /expired/], // 60s of clock-skew leeway is allowed; five minutes past is not
    ['unknown kid', mint(CLAIMS, { kid: 'nope' }), /no key/],
  ];
  for (const [label, tok, re] of cases) {
    const v = verifyJwt(tok, JWKS, { now: NOW });
    assert.equal(v.ok, false, label);
    assert.match(v.findings.join('\n'), re, label);
  }
  const good = mint();
  const tampered = good.slice(0, -4) + (good.endsWith('AAAA') ? 'BBBB' : 'AAAA');
  const v = verifyJwt(tampered, JWKS, { now: NOW });
  assert.equal(v.ok, false); assert.match(v.findings.join('\n'), /signature/);
  const alg = verifyJwt(mint(CLAIMS, { alg: 'none' }).replace(/\.[^.]*$/, '.'), JWKS, { now: NOW });
  assert.equal(alg.ok, false);
});

test('the runner record must agree with the token on subject, repository, ref and sha', () => {
  assert.deepEqual(runnerFindings(RUNNER, CLAIMS), []);
  const f = runnerFindings({ ...RUNNER, sha: 'c'.repeat(40) }, CLAIMS);
  assert.equal(f.length, 1); assert.match(f[0], /sha/);
  const f2 = runnerFindings({ ...RUNNER, subject: 'repo:evil/repo:ref:refs/heads/main' }, CLAIMS);
  assert.match(f2.join('\n'), /subject/);
});

test('verifyRunner: no token is nothing to verify (no finding); a token is verified and matched', () => {
  assert.deepEqual(verifyRunner(RUNNER, { jwks: JWKS, now: NOW }), []);
  const withTok = { ...RUNNER, oidc: { token: mint() } };
  assert.deepEqual(verifyRunner(withTok, { jwks: JWKS, now: NOW }), []);
  const lying = { ...RUNNER, sha: 'c'.repeat(40), oidc: { token: mint() } };
  assert.match(verifyRunner(lying, { jwks: JWKS, now: NOW }).join('\n'), /sha/);
});

test('attachOidc requests a token for the loom audience from the platform, and is inert without one or when the runner was named by hand', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => { calls.push({ url, auth: init?.headers?.Authorization }); return { ok: true, json: async () => ({ value: mint() }) }; };
  const env = { ACTIONS_ID_TOKEN_REQUEST_URL: 'https://token.example/req?api-version=1', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'req-secret', GITHUB_REPOSITORY: 'demo-bank/credit', GITHUB_REF: 'refs/heads/main', GITHUB_SHA: SHA };
  const r = await attachOidc(RUNNER, env, { fetchImpl });
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /audience=loom-record/);
  assert.equal(calls[0].auth, 'bearer req-secret');
  assert.equal(r.oidc.kid, KID); assert.equal(r.oidc.aud, AUDIENCE); assert.equal(r.oidc.sub, CLAIMS.sub);
  assert.ok(r.oidc.token.split('.').length === 3);

  const none = await attachOidc(RUNNER, { GITHUB_REPOSITORY: 'x' }, { fetchImpl });
  assert.equal(none.oidc, undefined, 'no platform token endpoint → nothing attached');
  const byHand = await attachOidc(RUNNER, { ...env, LOOM_RUNNER_SUBJECT: 'repo:demo-bank/credit:ref:refs/heads/main' }, { fetchImpl });
  assert.equal(byHand.oidc, undefined, 'a hand-named runner is a declaration; a platform token would contradict or launder it');
  assert.equal(await requestIdToken({ }, { fetchImpl }), null);
});

test('on a pull-request event the token names the subject (repo:<repo>:pull_request) and the environment cannot — attaching adopts the token\'s sub, and the concrete claims still have to match', async () => {
  const prClaims = { ...CLAIMS, sub: 'repo:demo-bank/credit:pull_request', ref: 'refs/pull/83/merge' };
  const fetchImpl = async () => ({ ok: true, json: async () => ({ value: mint(prClaims) }) });
  const env = { ACTIONS_ID_TOKEN_REQUEST_URL: 'https://token.example/req', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 's', GITHUB_REPOSITORY: 'demo-bank/credit', GITHUB_REF: 'refs/pull/83/merge', GITHUB_SHA: SHA };
  const synthesised = { subject: 'repo:demo-bank/credit:ref:refs/pull/83/merge', repository: 'demo-bank/credit', ref: 'refs/pull/83/merge', sha: SHA };
  const r = await attachOidc(synthesised, env, { fetchImpl });
  assert.equal(r.subject, 'repo:demo-bank/credit:pull_request');
  assert.deepEqual(verifyRunner(r, { jwks: JWKS, now: NOW }), []);
  // the self-check compares the concrete claims and lets the token name the subject
  assert.deepEqual(runnerFindings(synthesised, prClaims, { fields: ['repository', 'ref', 'sha'] }), []);
  assert.match(runnerFindings({ ...synthesised, ref: 'refs/heads/main' }, prClaims, { fields: ['repository', 'ref', 'sha'] }).join('\n'), /ref/);
});

test('PR6 with a JWKS: an envelope whose runner carries a matching token passes; a runner that lies about its sha is refused', () => {
  const { publicKey: ek, privateKey: epk } = generateKeyPairSync('ed25519');
  const issuers = { issuers: [{ id: 'ci', mechanism: 'ed25519', verify: { public_key: ek.export({ type: 'spki', format: 'pem' }).toString() } }] };
  const signer = { issuer: 'ci', privateKeyPem: epk.export({ type: 'pkcs8', format: 'pem' }).toString() };
  const registry = { identities: [{ id: 'agent-x', kind: 'agent', model: { model_id: 'm@1' } }] };
  const base = { kind: 'gate', name: 'gate.x', subject: { flow: 'delivery', trail: 'CHG-1' }, commit: SHA, actor: { id: 'agent-x', kind: 'agent', model: { model_id: 'm@1' } }, origin: 'tool', payload: { gate: 'scripts/x.mjs', result: 'pass', controls: ['A'] }, producedAt: new Date(NOW).toISOString() };
  const good = signEnvelope(buildEnvelope({ ...base, runner: { ...RUNNER, oidc: { token: mint() } } }), { ...signer, issuedAt: new Date(NOW).toISOString() });
  assert.deepEqual(evaluateProvenance(good, { registry, issuers, jwks: JWKS, now: NOW }), []);
  const lie = signEnvelope(buildEnvelope({ ...base, runner: { ...RUNNER, oidc: { token: mint({ ...CLAIMS, sha: 'd'.repeat(40) }) } } }), { ...signer, issuedAt: new Date(NOW).toISOString() });
  assert.match(evaluateProvenance(lie, { registry, issuers, jwks: JWKS, now: NOW }).join('\n'), /PR6.*sha/);
  // without a JWKS the token cannot be checked here, and PR6 says nothing rather than pretending
  assert.deepEqual(evaluateProvenance(lie, { registry, issuers, now: NOW }), []);
});
