// De-identification gate: no client's name in anything installable.
//
// Three of the Open Finance skills are canonical in the Claude.ai skills UI and imported here as
// whole-file overwrites (CLAUDE.md, provenance rules). A re-import can silently put a client's
// name back into the public marketplace. This scans every TRACKED text file under the scope in
// `.deidentify.json` (default `plugins/`) for the listed terms, case-insensitively, and fails on
// a hit unless the file is allowlisted with a reason. Like validate-marketplace.mjs it reads the
// git tree, so untracked strays are ignored and CI validates a clean checkout.
//
//   node scripts/deidentify-check.mjs            exit 0 clean · 1 hit · 2 config or allowlist problem
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function tracked(root, scope) {
  const out = execFileSync('git', ['-C', root, 'ls-files', '-z', '--', scope], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return out.split('\0').filter(Boolean);
}

const looksBinary = (buf) => buf.subarray(0, 8000).includes(0);

export function check({ root = resolve(here, '..'), configPath = '.deidentify.json' } = {}) {
  const findings = [];
  const cfgFile = join(root, configPath);
  if (!existsSync(cfgFile)) return { findings: [`${configPath} is missing`], code: 2, scanned: 0, allowed: 0, skippedBinary: 0 };
  let cfg;
  try { cfg = JSON.parse(readFileSync(cfgFile, 'utf8')); } catch (e) { return { findings: [`${configPath} is not valid JSON: ${e.message}`], code: 2, scanned: 0, allowed: 0, skippedBinary: 0 }; }
  const terms = Array.isArray(cfg.terms) ? cfg.terms.filter((t) => typeof t === 'string' && t.trim()) : [];
  if (!terms.length) return { findings: [`${configPath} lists no terms`], code: 2, scanned: 0, allowed: 0, skippedBinary: 0 };
  const scope = typeof cfg.scope === 'string' && cfg.scope ? cfg.scope : 'plugins';
  const re = new RegExp(terms.map(escapeRe).join('|'), 'i');
  const canonical = (s) => terms.find((term) => term.toLowerCase() === s.toLowerCase()) ?? s;

  // the allowlist: every entry needs a path and a reason, and must still be earning its place
  const allow = new Map();
  let configProblem = false;
  for (const a of Array.isArray(cfg.allow) ? cfg.allow : []) {
    if (!a || typeof a.path !== 'string') { findings.push(`allow entry without a path: ${JSON.stringify(a)}`); configProblem = true; continue; }
    if (typeof a.reason !== 'string' || !a.reason.trim()) { findings.push(`allow entry for ${a.path} has no reason — say why the name belongs there`); configProblem = true; }
    allow.set(a.path, { reason: a.reason, hit: false });
  }

  let files;
  try { files = tracked(root, scope); } catch { return { findings: [`${root} is not a git checkout — the gate reads the git tree`], code: 2, scanned: 0, allowed: 0, skippedBinary: 0 }; }

  let scanned = 0, skippedBinary = 0, allowed = 0;
  for (const rel of files) {
    const abs = join(root, rel);
    if (!existsSync(abs)) continue;                          // tracked but deleted in the working tree
    const buf = readFileSync(abs);
    if (looksBinary(buf)) { skippedBinary++; continue; }
    scanned++;
    const lines = buf.toString('utf8').split('\n');
    const hits = [];
    lines.forEach((line, i) => { const m = line.match(re); if (m) hits.push(`${rel}:${i + 1}: ${canonical(m[0])} — ${line.trim().slice(0, 100)}`); });
    if (!hits.length) continue;
    const entry = allow.get(rel);
    if (entry) { entry.hit = true; allowed++; continue; }
    findings.push(...hits);
  }
  for (const [path, entry] of allow) if (!entry.hit) { findings.push(`stale allow entry: ${path} no longer contains any listed term — remove it from ${configPath}`); configProblem = true; }

  const hit = findings.some((f) => !f.startsWith('stale allow') && !f.startsWith('allow entry'));
  const code = hit ? 1 : configProblem ? 2 : 0;
  return { findings, code, scanned, allowed, skippedBinary, scope, terms };
}

function main() {
  const r = check({});
  if (r.code === 0) { process.stdout.write(`De-identification gate — OK (${r.scanned} text files under ${r.scope}/ scanned for ${r.terms.length} terms; ${r.allowed} allowlisted with a reason; ${r.skippedBinary} binaries skipped)\n`); return 0; }
  process.stderr.write(`De-identification gate — ${r.code === 1 ? 'FAIL' : 'CONFIG'}\n`);
  for (const f of r.findings) process.stderr.write(`  - ${f}\n`);
  if (r.code === 1) process.stderr.write(`  → a client's name is in something installable. Replace it with the institution-seam idiom, or allowlist the file in .deidentify.json with a reason.\n`);
  return r.code;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exit(main());
