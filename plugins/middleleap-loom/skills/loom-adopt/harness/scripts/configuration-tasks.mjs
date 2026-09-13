// Read-only projection of declared setup inputs. No completion ledger or approval is written.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { checkProject } from './project-config-check.mjs';
import { spawnSync } from 'node:child_process';
const TIERS = ['core', 'governed', 'full'];
export const REGISTRY = 'core/configuration-tasks.json';
const marker = /@your-org\/|\bADOPT[:\-]/;
const safePath = p => typeof p === 'string' && p.length > 0 && !p.startsWith('/') && !p.split(/[\\/]/).includes('..');
function unresolved(value, path = '') {
  if (typeof value === 'string') return marker.test(value) || (path.endsWith('.status') && value === 'draft');
  if (Array.isArray(value)) return value.some((v, i) => unresolved(v, `${path}.${i}`));
  if (value && typeof value === 'object') return Object.entries(value).some(([k, v]) => !k.startsWith('_') && unresolved(v, `${path}.${k}`));
  return false;
}
export function inspectInput(cwd, task) {
  const file = join(cwd, task.path);
  if (!existsSync(file)) return { state: 'missing', reason: 'Required input is absent.' };
  if (!statSync(file).isFile()) return { state: 'invalid', reason: 'Expected a file.' };
  const text = readFileSync(file, 'utf8');
  if (!text.trim()) return { state: 'needs-input', reason: 'Input is empty.' };
  if (task.validator === 'project-inputs') {
    const checked=checkProject(cwd);if(checked.findings.length)return {state:'needs-input',reason:checked.findings.join(' ')};
  } else if (task.validator === 'json-inputs') {
    let data;try { data = JSON.parse(text); } catch { return { state: 'invalid', reason: 'Input is not valid JSON.' }; }
    if (!data || typeof data !== 'object' || !Object.keys(data).filter(k => !k.startsWith('_')).length) return { state: 'needs-input', reason: 'No configuration values are present.' };
    if (unresolved(data)) return { state: 'needs-input', reason: 'Configuration values contain unresolved placeholders or draft status.' };
  } else if (task.validator === 'brand-inputs') {
    if (/^status:\s*demo\s*$/m.test(text)) return { state: 'needs-input', reason: 'Demo brand is still mounted. Supply approved institutional identity for real adoption.' };
    if (marker.test(text)) return { state: 'needs-input', reason: 'Brand inputs contain placeholders.' };
  } else if (marker.test(text)) return { state: 'needs-input', reason: 'Input contains unresolved project instructions.' };
  return { state: 'input-present', reason: 'Input supplied; semantic correctness, approval and live operation are not inferred.' };
}

export function configurationTasks(cwd = process.cwd(), { run = false, spawn = spawnSync } = {}) {
  const path = join(cwd, REGISTRY);
  if (!existsSync(path)) return { available: false, tasks: [], pending: [REGISTRY], error: 'Configuration task registry is missing; upgrade the bundle. Setup completion is not assessed.' };
  let registry, stamp;
  try {
    registry = JSON.parse(readFileSync(path, 'utf8'));
    const sp = join(cwd, '.loom/adoption.json'); stamp = existsSync(sp) ? JSON.parse(readFileSync(sp, 'utf8')) : null;
  } catch (error) { return { available: false, tasks: [], pending: [REGISTRY], error: `Cannot read configuration inputs: ${error.message}` }; }
  const tier = stamp ? (stamp.tier || 'full') : 'core';
  const validators = ['json-inputs','text-inputs','brand-inputs','project-inputs'];
  const ids = new Set();
  if (registry.schema !== 'loom.configuration-tasks/v1' || !Array.isArray(registry.tasks) || !TIERS.includes(tier) || !registry.tasks.length || registry.tasks.some(t => {
    if (!t || typeof t.id !== 'string' || !t.id || ids.has(t.id) || !safePath(t.path) || ![t.title, t.owner, t.action, t.completion].every(v => typeof v === 'string' && v.trim()) || !TIERS.includes(t.tier) || !validators.includes(t.validator) || (t.component && t.component !== 'brainkit') || (t.check && (!/^scripts\/[\w-]+\.mjs$/.test(t.check)))) return true;
    ids.add(t.id); return false;
  })) return { available: false, tasks: [], pending: [REGISTRY], error: 'Invalid task registry or adoption tier; setup completion is not assessed.' };
  const checks = new Map();
  const tasks = registry.tasks.map(original => {
    const task = original.path === '.github/workflows/ci.yml' && stamp?.ci_mode === 'separate' ? {...original,path:'.github/workflows/loom.yml',action:'Review the separate Loom workflow, retain your team workflow and configure required checks in branch protection.'} : original;
    const applicable = stamp?.components?.includes(task.component) || TIERS.indexOf(task.tier) <= TIERS.indexOf(tier) || existsSync(join(cwd, task.path));
    if (!applicable) return { ...task, state: 'deferred', reason: `Not installed at tier ${tier}. Compiled controls can still require this input.`, checkState: 'not-run' };
    let input;try { input = inspectInput(cwd, task); } catch (error) { input = { state: 'invalid', reason: error.message }; }
    let checkState = 'not-run';
    if (run && task.check && input.state === 'input-present') {
      if (!existsSync(join(cwd, task.check))) checkState = 'unavailable';
      else {
        if (!checks.has(task.check)) {
          try {
            const result = spawn(process.execPath, [task.check], { cwd, encoding: 'utf8', timeout: 30_000 });
            checks.set(task.check, result.error ? 'unavailable' : result.status === 0 ? 'passed' : 'failed');
          } catch { checks.set(task.check, 'unavailable'); }
        }
        checkState = checks.get(task.check);
        if (checkState !== 'passed') input.reason = `Run node ${task.check} for details. ${input.reason}`;
      }
    }
    return { ...task, ...input, checkState };
  });
  const pending = tasks.filter(t => !['input-present','deferred'].includes(t.state) || ['failed','unavailable'].includes(t.checkState)).map(t => t.path);
  return { available: true, scope: registry.scope, tier, tasks, pending: [...new Set(pending)].sort() };
}

export function configureCommand(args, cwd = process.cwd(), out = process.stdout, err = process.stderr) {
  if (args.some(a => !['--json','--run','--all'].includes(a))) { err.write('usage: loom configure [--json] [--run] [--all]\n'); return 2; }
  const report = configurationTasks(cwd, { run: args.includes('--run') });
  if (args.includes('--json')) out.write(JSON.stringify(report, null, 2) + '\n');
  else if (report.error) err.write(report.error + '\n');
  else {
    out.write(`Configuration tasks — tier ${report.tier}\n${report.scope}\n\n`);
    out.write(`${report.pending.length} input(s) need attention. Showing ${args.includes('--all') ? 'all installed tasks' : 'pending tasks'}; use --all for supplied inputs.\n\n`);
    for (const t of report.tasks.filter(t => t.state !== 'deferred' && (args.includes('--all') || report.pending.includes(t.path)))) out.write(`${t.title}: ${t.state} (check: ${t.checkState})\n  Owner: ${t.owner}\n  Input: ${t.path}\n  Next: ${t.action}\n  Completion: ${t.completion}\n  ${t.reason}\n${t.check ? `  Validate: node ${t.check}\n` : ''}\n`);
    out.write(`${report.pending.length} input(s) need attention; ${report.tasks.filter(t => t.state === 'deferred').length} deferred by installation tier.\nInput present is not approval. Use loom gates and the applicable institutional review/activation processes.\n`);
  }
  return report.error ? 2 : report.pending.length ? 1 : 0;
}
