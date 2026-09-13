import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { configurationTasks, configureCommand, REGISTRY } from './configuration-tasks.mjs';
import { computeStatus } from './adoption-status.mjs';
const task = (path, extra = {}) => ({ id: path, path, title: 'Identity', owner: 'Platform administrator', action: 'Supply identities', completion: 'Input present; approval separate', tier: 'core', validator: 'json-inputs', ...extra });
function fixture(t, tasks, files = {}, tier = 'core') {
  const cwd = mkdtempSync(join(tmpdir(), 'loom-configure-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  put(cwd, REGISTRY, JSON.stringify({ schema: 'loom.configuration-tasks/v1', tasks }));
  put(cwd, '.loom/adoption.json', JSON.stringify({ tier, files: { [REGISTRY]: {} } }));
  put(cwd, 'docs/governance/control-catalog.json', '{"controls":[]}');
  for (const [path, text] of Object.entries(files)) put(cwd, path, text);
  return cwd;
}
function put(cwd, path, text) { mkdirSync(join(cwd, path, '..'), { recursive: true }); writeFileSync(join(cwd, path), text); }
test('registry covers every adoption template and names existing checkers', { skip: !existsSync(new URL('../copy-manifest.json', import.meta.url)) }, () => {
  const h = new URL('../', import.meta.url);
  const tasks = JSON.parse(readFileSync(new URL(REGISTRY, h))).tasks;
  const manifest = JSON.parse(readFileSync(new URL('copy-manifest.json', h)));
  for (const e of manifest.entries.filter(e => e.adopt === 'template')) assert.ok(tasks.some(t => t.path === e.dest && t.tier === e.tier), e.dest);
  for (const t of tasks) if (t.check) assert.ok(existsSync(new URL(t.check, h)), t.check);
});
test('structured values ignore instructional metadata but flag actual draft inputs', t => {
  const path = 'docs/governance/identities.json';
  const cwd = fixture(t, [task(path)], { [path]: '{"_comment":"ADOPT: fill owners", "identities":[{"id":"alice"}]}' });
  assert.deepEqual(configurationTasks(cwd).pending, []);
  assert.deepEqual(computeStatus(cwd).unresolved, []);
  put(cwd, path, '{"status":"draft"}');
  assert.equal(computeStatus(cwd).adoptPending, true);
});
test('missing hooks, CI, backlog and contract inputs are actionable', t => {
  const paths = ['.claude/settings.json', '.github/workflows/ci.yml', 'docs/backlog.yaml', '.claude/hooks/spec-tripwire.sh'];
  const cwd = fixture(t, paths.map(path => task(path)));
  assert.deepEqual(configurationTasks(cwd).pending, paths.sort());
  assert.equal(computeStatus(cwd).adoptPending, true);
});
test('tier defers absent optional inputs but includes optional files already present', t => {
  const cwd = fixture(t, [task('institution/optional.json', { tier: 'full' })]);
  assert.equal(configurationTasks(cwd).tasks[0].state, 'deferred');
  put(cwd, 'institution/optional.json', '{"status":"draft"}');
  assert.equal(configurationTasks(cwd).tasks[0].state, 'needs-input');
});
test('invalid or deleted stamped registry cannot silently clear adoption pending', t => {
  const cwd = fixture(t, [task('input.json')]);
  put(cwd, REGISTRY, '{');
  assert.equal(computeStatus(cwd).adoptPending, true);
  rmSync(join(cwd, REGISTRY));
  assert.equal(computeStatus(cwd).adoptPending, true);
  assert.equal(configureCommand(['--json'], cwd, { write() {} }), 2);
});
test('old unstamped status stays available but reports its assessment gap', t => {
  const cwd = fixture(t, [task('input.json')]);
  rmSync(join(cwd, REGISTRY)); rmSync(join(cwd, '.loom/adoption.json'));
  assert.equal(computeStatus(cwd).configuration.available, false);
  assert.match(computeStatus(cwd).configuration.error, /not assessed/);
});
test('unsafe paths and unknown validators fail closed', t => {
  for (const value of [task('../outside.json'), task('input.json', { validator: 'unknown' })]) {
    const cwd = fixture(t, [value]);
    assert.ok(configurationTasks(cwd).error);
    assert.equal(computeStatus(cwd).adoptPending, true);
  }
});
test('demo brand remains pending', t => {
  const cwd = fixture(t, [task('brand.md', {validator:'brand-inputs'})], {'brand.md':'---\nstatus: demo\n---'});
  assert.equal(configurationTasks(cwd).tasks[0].state, 'needs-input');
});
test('ordinary TODO and TBD prose does not block configuration or adoption status', t => {
  const paths=['docs/backlog.yaml','CLAUDE.md','.claude/agents/reviewer.md','CODEOWNERS'];
  const cwd=fixture(t,paths.map(path=>task(path,{validator:'text-inputs'})));
  for(const path of paths)put(cwd,path,'Conventions: TODO comments are allowed. Backlog title: TBD.');
  assert.deepEqual(configurationTasks(cwd).pending,[]);
  assert.equal(computeStatus(cwd).adoptPending,false);
  put(cwd,'CLAUDE.md','ADOPT: supply project guidance');
  assert.ok(configurationTasks(cwd).pending.includes('CLAUDE.md'));
});
test('checks remain not-run until requested and failures or timeouts never pass', t => {
  const cwd = fixture(t, [task('a.json', {check:'scripts/validate.mjs'}), task('b.json', {check:'scripts/validate.mjs'})], {'a.json':'{"owner":"alice"}', 'b.json':'{"owner":"bob"}', 'scripts/validate.mjs':'// fixture'});
  assert.equal(configurationTasks(cwd).tasks[0].checkState, 'not-run');
  for (const result of [{status:1}, {status:null,error:new Error('timeout')}]) {
    let calls = 0;
    const report = configurationTasks(cwd, {run:true, spawn:()=> {calls++;return result;}});
    assert.equal(report.pending.length, 2);
    assert.equal(calls, 1, 'shared validator runs once');
  }
  assert.equal(configurationTasks(cwd, {run:true,spawn:()=>({status:0})}).tasks[0].checkState, 'passed');
});
const installer = new URL('../adopt.mjs', import.meta.url);
for (const tier of ['core', 'governed', 'full']) test(`fresh ${tier} exposes configure with owners and pending inputs`, {skip:!existsSync(installer)}, async t => {
  const cwd = mkdtempSync(join(tmpdir(), 'loom-config-install-'));
  t.after(()=>rmSync(cwd,{recursive:true,force:true}));
  const {install} = await import(installer.href); install(cwd,{tier});
  const result = spawnSync(process.execPath, ['scripts/loom.mjs','configure','--json'], {cwd,encoding:'utf8'});
  assert.equal(result.status,1,result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.tier,tier);assert.ok(report.pending.includes('CODEOWNERS'));
  assert.ok(report.tasks.every(t=>t.owner && t.action && t.completion));
  assert.equal(report.tasks.some(t=>t.state==='deferred'),tier!=='full');
});
