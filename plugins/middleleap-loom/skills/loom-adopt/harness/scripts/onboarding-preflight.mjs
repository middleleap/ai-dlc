// Read-only setup diagnostics. Presence is never reported as activation or institutional approval.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function preflight(cwd = process.cwd(), { runtime = 'claude-code', nodeVersion = process.versions.node, spawn = spawnSync } = {}) {
  const checks = [];
  const add = (id, passed, action) => checks.push({ id, passed, action });
  add('node', Number(nodeVersion.split('.')[0]) >= 18, `Node ${nodeVersion}; Node >=18 is required, CI uses Node 22.`);
  add('git-repository', spawn('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' }).status === 0, 'Run from a Git repository; Git history and reviewed changes are required.');
  add('runtime', runtime === 'claude-code', runtime === 'claude-code' ? 'Claude Code is the reference runtime. This check does not prove its hooks are active.' : runtime === 'codex' ? 'Codex has a bounded read-only reviewer adapter (loom runtime codex), but no qualified Loom pre-action hooks or write-capable delivery adapter. Full delivery setup remains unsupported.' : `${runtime} has no tested Loom pre-action adapter here. CI checks do not imply equivalent local protection.`);
  for (const command of ['bash', 'jq']) add(command, spawn(command, ['--version'], { cwd, encoding: 'utf8' }).status === 0, `Install ${command} before enabling the Claude Code hooks.`);
  const settings = existsSync(join(cwd, '.claude/settings.json'))
    ? 'Existing .claude/settings.json: a differing installer version is preserved as a sidecar for review/merge; existing hook activation is not assessed.'
    : 'No .claude/settings.json: adoption writes the hook settings directly. Review them before using the coding runtime.';
  return { readyForSetup: checks.every(c => c.passed), checks, settings, scope: 'Local prerequisites only. No live platform, credentials, model evaluation or institutional approvals assessed.' };
}

export function preflightCommand(args, cwd = process.cwd(), out = process.stdout, err = process.stderr) {
  let runtime = 'claude-code', json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') json = true;
    else if (args[i] === '--runtime' && args[i + 1] && !args[i + 1].startsWith('--')) runtime = args[++i];
    else { err.write('usage: loom preflight [--runtime claude-code] [--json]\n'); return 2; }
  }
  const result = preflight(cwd, { runtime });
  if (json) out.write(JSON.stringify(result, null, 2) + '\n');
  else {
    out.write(`Setup preflight: ${result.readyForSetup ? 'prerequisites found' : 'action required'}\n`);
    for (const check of result.checks) out.write(`  ${check.passed ? 'OK' : 'MISSING/UNSUPPORTED'} ${check.id}: ${check.action}\n`);
    out.write(`${result.settings}\n${result.scope}\n`);
  }
  return result.readyForSetup ? 0 : 1;
}
