// runner-identity-check — prove, on the platform itself, that the runner's OIDC token verifies
// (core/runner-identity.mjs; PR6 second half; kosli-seam.md §5 question 3, the Loom's side).
//
// In a GitHub Actions job with `permissions: id-token: write`, this asks the platform for a token
// with the Loom's audience, fetches the issuer's published keys, verifies the signature, issuer,
// audience and expiry, and checks that the token's repository, ref and sha are the ones the job
// environment claims. Anywhere else — a laptop, a fork's pull request (no token is issued), a
// platform without OIDC — it says so and exits 0: inert, out loud, never a silent pass.
//
//   node scripts/runner-identity-check.mjs [--json]      exit 0 verified or inert · 1 the token does not verify
import process from 'node:process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { AUDIENCE, fetchJwks, requestIdToken, runnerFindings, runnerFromClaims, verifyJwt } from '../core/runner-identity.mjs';
import { runnerFromEnv } from '../core/external-record.mjs';

export async function check(env = process.env, { fetchImpl = globalThis.fetch } = {}) {
  if (!env.ACTIONS_ID_TOKEN_REQUEST_URL || !env.ACTIONS_ID_TOKEN_REQUEST_TOKEN) return { state: 'inert', reason: 'no platform token endpoint in the environment (not a GitHub Actions job with id-token: write, or a fork pull request)' };
  const token = await requestIdToken(env, { fetchImpl });
  if (!token) return { state: 'inert', reason: 'the platform did not issue a token for this job' };
  const jwks = await fetchJwks({ fetchImpl });
  if (!jwks) return { state: 'inert', reason: 'the issuer JWKS was unreachable — nothing can be verified from here' };
  const v = verifyJwt(token, jwks);
  if (!v.ok) return { state: 'fail', findings: v.findings.map((f) => `token: ${f}`) };
  const declared = runnerFromEnv(env);
  // The environment synthesises the subject; the token names it. Compare what both state concretely.
  const f = declared ? runnerFindings(declared, v.claims, { fields: ['repository', 'ref', 'sha'] }) : ['no runner identity in the environment to compare the token against'];
  return { state: f.length ? 'fail' : 'verified', kid: v.kid, audience: AUDIENCE, runner: runnerFromClaims(v.claims), findings: f };
}

async function main(argv = process.argv.slice(2)) {
  const r = await check();
  if (argv.includes('--json')) { process.stdout.write(JSON.stringify(r, null, 2) + '\n'); return r.state === 'fail' ? 1 : 0; }
  if (r.state === 'inert') { process.stdout.write(`Runner-identity check — inert: ${r.reason}\n`); return 0; }
  if (r.state === 'fail') { process.stderr.write('Runner-identity check — FAIL\n'); for (const x of r.findings) process.stderr.write(`  - ${x}\n`); return 1; }
  process.stdout.write(`Runner-identity check — VERIFIED: ${r.runner.subject} @ ${String(r.runner.sha).slice(0, 12)}… (run ${r.runner.run}), token signed by kid ${r.kid} for audience ${r.audience}, claims match the job environment\n`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().then((c) => process.exit(c));
