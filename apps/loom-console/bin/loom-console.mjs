#!/usr/bin/env node
// loom-console — a read-only oversight console over any Loom installation.
//
//   loom-console data  --repo <path> [--out <file>] [--now <ISO>] [--pretty]   the loom.console/v1 JSON
//   loom-console build --repo <path> --out <dir> [--now <ISO>]                 a static site
//   loom-console serve --repo <path> [--port 4317]                             local, read-only, 127.0.0.1
//   loom-console demo  [--out <dir> | --serve] [--port 4317]                   the Meridian Trust demo
//
// It reads; it never writes into the installation, holds no credential, and has no approve button.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { consoleData } from '../src/data.mjs';
import { buildSite } from '../src/build.mjs';
import { createConsoleServer } from '../src/serve.mjs';
import { meridianInstallation } from '../src/demo.mjs';

const [cmd, ...args] = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const now = opt('--now') ? Date.parse(opt('--now')) : Date.now();
const die = (m) => { process.stderr.write(m + '\n'); process.exit(2); };
const listen = (repo, port) => {
  const srv = createConsoleServer(repo);
  srv.listen(Number(port), '127.0.0.1', () => process.stderr.write(`Loom console on http://127.0.0.1:${port}  (read-only · ${repo})\n`));
};

try {
  if (cmd === 'data') {
    const repo = opt('--repo') || die('data needs --repo <path to a Loom installation>');
    const data = await consoleData(resolve(repo), { now });
    const text = JSON.stringify(data, null, args.includes('--pretty') ? 2 : 0) + '\n';
    const out = opt('--out');
    if (out) { mkdirSync(dirname(resolve(out)), { recursive: true }); writeFileSync(out, text); process.stderr.write(`console data → ${out} (${data.runs.length} runs)\n`); } else process.stdout.write(text);
  } else if (cmd === 'build') {
    const repo = opt('--repo') || die('build needs --repo <path>');
    const out = opt('--out') || die('build needs --out <dir>');
    const r = await buildSite(resolve(repo), resolve(out), { now });
    process.stderr.write(`console site → ${r.out} (${r.runs} runs, ${r.artifacts} wireframes)\n`);
  } else if (cmd === 'serve') {
    listen(resolve(opt('--repo') || die('serve needs --repo <path>')), opt('--port', '4317'));
  } else if (cmd === 'demo') {
    const repo = await meridianInstallation();
    process.stderr.write(`Meridian Trust demo installation → ${repo}\n`);
    if (opt('--out')) { const r = await buildSite(repo, resolve(opt('--out')), { now }); process.stderr.write(`console site → ${r.out}\n`); }
    else listen(repo, opt('--port', '4317'));
  } else {
    process.stdout.write('usage: loom-console <data|build|serve|demo> [--repo <path>] [--out <path>] [--port 4317] [--now <ISO>]\n');
    process.exit(cmd ? 2 : 0);
  }
} catch (e) { die(`loom-console: ${e.message}`); }
