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

/** The steps of the single job, as { name, cwd, run }. Handles exactly the shapes this workflow
 *  uses: `- name:` / `- uses:` items at 6 spaces, `working-directory:` and `run:` at 8, and a
 *  `run: |` literal block indented 10. Anything else is an error, not a silent skip. */
export function parseSteps(text) {
  const lines = text.split('\n'); const steps = []; let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    let m;
    if ((m = /^      - (name|uses): (.*)$/.exec(l))) { cur = { name: m[1] === 'name' ? m[2] : `uses ${m[2]}`, uses: m[1] === 'uses', cwd: '.', run: null }; steps.push(cur); continue; }
    if (!cur) continue;
    if ((m = /^        uses: /.exec(l))) { cur.uses = true; continue; }
    if ((m = /^        working-directory: (.*)$/.exec(l))) { cur.cwd = m[1].trim(); continue; }
    if ((m = /^        run: \|\s*$/.exec(l))) {
      const body = [];
      while (i + 1 < lines.length && (lines[i + 1].startsWith('          ') || lines[i + 1].trim() === '')) body.push(lines[++i].slice(10));
      while (body.length && body.at(-1).trim() === '') body.pop();
      cur.run = body.join('\n'); continue;
    }
    if ((m = /^        run: (.+)$/.exec(l))) { if (/^[|>]/.test(m[1])) throw new Error(`step "${cur.name}" has no run: this parser understands (block style ${m[1]})`); cur.run = m[1]; continue; }
  }
  for (const s of steps) if (!s.uses && s.run == null) throw new Error(`step "${s.name}" has no run: this parser understands`);
  return steps.filter((s) => !s.uses);
}

function main() {
  const steps = parseSteps(readFileSync(WORKFLOW, 'utf8'));
  const args = process.argv.slice(2);
  if (args.includes('--list')) { steps.forEach((s, i) => console.log(`${i + 1}. ${s.name}  [${s.cwd}]`)); return 0; }
  const from = Number(args[args.indexOf('--from') + 1] || 1);
  const temp = mkdtempSync(join(tmpdir(), 'ci-local-'));
  const env = { ...process.env, RUNNER_TEMP: process.env.RUNNER_TEMP || temp, GITHUB_ENV: process.env.GITHUB_ENV || join(temp, 'github-env'), CI: 'true' };
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
    if (r.status !== 0) { console.error(`\nlocal CI: step ${i + 1} failed (exit ${r.status}) — ${s.name}\nre-run from it with: node scripts/ci/local.mjs --from ${i + 1}`); return r.status || 1; }
  }
  console.log(`\nlocal CI: all steps passed${skipped.length ? ` (${skipped.length} Linux-only step skipped: ${skipped.join('; ')})` : ''}`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main());
