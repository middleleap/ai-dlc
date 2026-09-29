#!/usr/bin/env node
// Reproduce .github/workflows/validate.yml locally by running each step's own `run:` block, in
// its `working-directory`, in order — read from the workflow itself so this cannot drift from CI.
// `uses:` steps (checkout, setup-node) are skipped: you already have the checkout and a Node.
// Runner variables default to a scratch dir. Usage: node scripts/ci/local.mjs [--list] [--from <n>]
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { spawnSync, execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const WORKFLOW = join(root, '.github/workflows/validate.yml');

/** The steps of the single job, as { name, cwd, run }. A step starts at any `- key:` item at
 *  6 spaces; its keys sit at 8. Only keys the runner honours are accepted — `name`, `id`,
 *  `uses`, `with` (its block is skipped), `working-directory` and `run` (one line, or a `|`
 *  literal block at 10). `if:`, `env:`, `shell:`, `continue-on-error:` and the rest would change
 *  what the step does on CI, so meeting one is an error rather than a silent local difference.
 *  Comment and blank lines are ignored. */
const KNOWN = new Set(['name', 'id', 'uses', 'with', 'working-directory', 'run']);
export function parseSteps(text) {
  const lines = text.split('\n'); const steps = []; let cur = null;
  const key = (cur, k, v, i) => {
    if (!KNOWN.has(k)) throw new Error(`step "${cur.name ?? '?'}" uses "${k}:" (line ${i + 1}) — not understood by scripts/ci/local.mjs, which cannot run locally what CI would do differently; teach it the key`);
    if (k === 'name') cur.name = v.trim();
    else if (k === 'uses') cur.uses = true;
    else if (k === 'working-directory') cur.cwd = v.trim();
    else if (k === 'run') {
      if (/^[|>]/.test(v.trim()) && v.trim() !== '|') throw new Error(`step "${cur.name}" has no run: this parser understands (block style ${v.trim()})`);
      cur.run = v.trim() === '|' ? null : v.trim(); cur.block = v.trim() === '|';
    }
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*(#.*)?$/.test(l)) continue;
    let m;
    if ((m = /^      - ([A-Za-z][\w-]*):(.*)$/.exec(l))) {
      cur = { name: null, uses: false, cwd: '.', run: undefined }; steps.push(cur); key(cur, m[1], m[2], i); continue;
    }
    if (!cur) continue;
    if ((m = /^        ([A-Za-z][\w-]*):(.*)$/.exec(l))) {
      key(cur, m[1], m[2], i);
      if (m[1] === 'with') while (i + 1 < lines.length && (/^          /.test(lines[i + 1]) || /^\s*(#.*)?$/.test(lines[i + 1]))) i++;
      if (cur.block) {
        const body = [];
        while (i + 1 < lines.length && (lines[i + 1].startsWith('          ') || lines[i + 1].trim() === '')) body.push(lines[++i].slice(10));
        while (body.length && body.at(-1).trim() === '') body.pop();
        cur.run = body.join('\n'); cur.block = false;
      }
      continue;
    }
    if (/^      \S/.test(l) || /^    \S/.test(l)) { cur = null; continue; }   // left the steps list
  }
  for (const s of steps) { if (s.name == null) s.name = s.uses ? 'uses step' : '(unnamed)'; delete s.block; }
  for (const s of steps) if (!s.uses && (s.run == null || s.run === '')) throw new Error(`step "${s.name}" has no run: this parser understands`);
  return steps.filter((s) => !s.uses);
}

/** Command-line options. `--from <n>` must be a step number; anything else is an error. */
export function parseArgs(args) {
  const out = { list: args.includes('--list'), from: 1 };
  const i = args.indexOf('--from');
  if (i >= 0) {
    const n = Number(args[i + 1]);
    if (!Number.isInteger(n) || n < 1) throw new Error('--from needs a step number (see --list)');
    out.from = n;
  }
  return out;
}

/** The environment every step runs in. RUNNER_TEMP is kept if given, so `--from` can resume in
 *  the scratch dir an earlier run left (later steps reuse the dry-run's tree there); GITHUB_ENV
 *  always lives inside it. */
export function runnerEnv(base, freshTemp) {
  const RUNNER_TEMP = base.RUNNER_TEMP || freshTemp;
  return { ...base, RUNNER_TEMP, GITHUB_ENV: base.GITHUB_ENV || join(RUNNER_TEMP, 'github-env'), CI: 'true' };
}

export function failureHint(n, name, runnerTemp) {
  return `local CI: step ${n} failed — ${name}\nre-run from it, in the same scratch dir: RUNNER_TEMP=${runnerTemp} node scripts/ci/local.mjs --from ${n}`;
}

function main() {
  const steps = parseSteps(readFileSync(WORKFLOW, 'utf8'));
  const { list, from } = parseArgs(process.argv.slice(2));
  if (list) { steps.forEach((s, i) => console.log(`${i + 1}. ${s.name}  [${s.cwd}]`)); return 0; }
  const temp = mkdtempSync(join(tmpdir(), 'ci-local-'));
  const env = runnerEnv(process.env, temp);
  // Actions always sets these; the harness names a record's runner from them (PR6 refuses a record
  // with no runner). Default them from the checkout. GITHUB_ACTIONS stays unset, so no OIDC is sought.
  const git = (...a) => { try { return execFileSync('git', a, { cwd: root, encoding: 'utf8' }).trim(); } catch { return ''; } };
  const remote = git('remote', 'get-url', 'origin').replace(/\.git$/, '').replace(/^.*github\.com[:/]/, '');
  env.GITHUB_REPOSITORY ||= remote || 'local/checkout';
  env.GITHUB_REF ||= `refs/heads/${git('rev-parse', '--abbrev-ref', 'HEAD') || 'local'}`;
  env.GITHUB_SHA ||= git('rev-parse', 'HEAD');
  writeFileSync(env.GITHUB_ENV, '', { flag: 'a' });
  // CI runs on ubuntu. Off Linux, shim the two GNU-isms the steps use (`sed -i <script>` with no
  // backup suffix, and `sha256sum`), and skip only a step that downloads a Linux-only binary.
  const linux = process.platform === 'linux';
  if (!linux) {
    const shim = join(temp, 'gnu-shims'); mkdirSync(shim);
    writeFileSync(join(shim, 'sed'), '#!/usr/bin/env bash\nargs=(); for a in "$@"; do if [ "$a" = "-i" ]; then args+=("-i" ""); else args+=("$a"); fi; done\nexec /usr/bin/sed "${args[@]}"\n');
    writeFileSync(join(shim, 'sha256sum'), '#!/usr/bin/env bash\nargs=(); for a in "$@"; do [ "$a" = "--check" ] && a=-c; args+=("$a"); done\nexec shasum -a 256 "${args[@]}"\n');
    chmodSync(join(shim, 'sed'), 0o755); chmodSync(join(shim, 'sha256sum'), 0o755);
    env.PATH = `${shim}:${env.PATH}`;
  }
  const skipped = [];
  for (const [i, s] of steps.entries()) {
    if (i + 1 < from) continue;
    // Variables a step appends to $GITHUB_ENV are visible to every later step, as on Actions.
    const exported = readFileSync(env.GITHUB_ENV, 'utf8').split('\n').filter((l) => /^[A-Za-z_]\w*=/.test(l));
    for (const kv of exported) { const k = kv.slice(0, kv.indexOf('=')); env[k] = kv.slice(k.length + 1); }
    console.log(`\n== ${i + 1}/${steps.length} ${s.name}`);
    if (!linux && /linux_amd64/.test(s.run)) { console.log(`   skipped: downloads a Linux-only binary (runs on CI)`); skipped.push(s.name); continue; }
    const r = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', s.run], { cwd: join(root, s.cwd), env, stdio: 'inherit' });
    if (r.status !== 0) { console.error(`\n${failureHint(i + 1, s.name, env.RUNNER_TEMP)} (exit ${r.status})`); return r.status || 1; }
  }
  console.log(`\nlocal CI: all steps passed${skipped.length ? ` (${skipped.length} Linux-only step skipped: ${skipped.join('; ')})` : ''}`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try { process.exit(main()); } catch (e) { console.error(`local CI: ${e.message}`); process.exit(2); }
}
