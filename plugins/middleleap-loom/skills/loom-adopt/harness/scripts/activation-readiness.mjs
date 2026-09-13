// Adoption command, not a replacement for the platform-activation CI consistency gate.
// Checks the explicitly named repository's baseline receipts; never observes or mutates a host.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { evaluate, ACTIVATION_DIR } from './platform-activation-check.mjs';
import { loadIssuers } from '../core/attestations.mjs';

export const BASELINE = ['HG-0001', 'HG-0002', 'HG-0004'];
export function readiness({ records, registry, issuers, repository, platform = 'github', now = Date.now() }) {
  const findings = [], verified = new Set();
  if (platform !== 'github') findings.push('Only the GitHub baseline is supported by this command.');
  if (!repository || !/^[^/\s]+\/[^/\s]+$/.test(repository)) findings.push('Name the repository as owner/repository.');
  if (!Array.isArray(registry?.identities)) findings.push('A valid identity registry is required to verify observer independence.');
  for (const record of records) {
    if (!record || typeof record !== 'object') { findings.push('Invalid activation record.'); continue; }
    if (record.platform !== platform || record.repository !== repository) continue;
    const errors = evaluate(record, { registry, issuers, now });
    const observer = registry?.identities?.find(i => i.id === record.observer_identity);
    if (observer?.kind !== 'human') errors.push('The observer must resolve to a human identity.');
    for (const date of [record.observed_at, record.bypass_test?.tested_at]) {
      if (Date.parse(date) > now) errors.push('An observation or bypass test cannot be dated in the future.');
    }
    if (errors.length) findings.push(...errors);
    else verified.add(record.satisfies_control);
  }
  const missing = BASELINE.filter(id => !verified.has(id));
  return { ready: findings.length === 0 && missing.length === 0, findings, missing, verified: [...verified] };
}

export function activationReadiness(args, cwd = process.cwd(), out = process.stdout, err = process.stderr) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--platform', '--repository'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) {
      err.write('usage: loom activate --platform github --repository owner/repository\n'); return 2;
    }
    options[args[i].slice(2)] = args[i + 1];
  }
  if (!options.platform || !options.repository) { err.write('usage: loom activate --platform github --repository owner/repository\n'); return 2; }
  const read = p => JSON.parse(readFileSync(p, 'utf8'));
  const registryPath = ['docs/governance/identities.json', 'identities.json'].map(p => join(cwd, p)).find(existsSync);
  const dir = ACTIVATION_DIR.map(p => join(cwd, p)).find(existsSync);
  try {
    const records = dir ? readdirSync(dir).filter(f => f.endsWith('.json')).map(f => read(join(dir, f))) : [];
    const result = readiness({ ...options, records, registry: registryPath ? read(registryPath) : null, issuers: loadIssuers(cwd) });
    out.write(`Activation evidence for ${options.platform} ${options.repository}: ${result.ready ? 'BASELINE COMPLETE' : 'INCOMPLETE'}\n`);
    for (const id of result.missing) out.write(`  Missing independently verified evidence: ${id}\n`);
    for (const finding of result.findings) out.write(`  ${finding}\n`);
    out.write('This command reads receipts only; it does not activate or observe the platform. Ask your platform administrator to follow docs/governance/activation-runbook.md.\n');
    out.write('Scope: four-eyes, control ownership and agent identity baseline. Additional applicable controls and institutional/production readiness are not assessed.\n');
    return result.ready ? 0 : 1;
  } catch (error) { err.write(`Activation evidence is incomplete or unreadable: ${error.message}\n`); return 1; }
}
