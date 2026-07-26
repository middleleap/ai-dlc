// The `loom` adoption CLI (Loom 2.0-rc.14 · WS5) — a thin dispatcher over the adoption state
// machine. Adoption is five stages; each subcommand advances or reports one:
//
//   loom adopt                     install the machinery (adopt.mjs, idempotent)
//   loom configure                 list what is still adopt-pending (unresolved markers to fill)
//   loom verify                    run the bundled gates → mechanically-validated
//   loom activate --platform …     observe the live platform → platform-activated (WS2)
//   loom attest-adoption           sign the adoption report (fails while anything is adopt-pending)
//   loom status                    the five-stage matrix + unresolved inventory (machine or human)
//
// Run from the adopted repo root: `node scripts/loom.mjs <command> [args]`.
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const node = (script, args = []) => spawnSync(process.execPath, [resolve(HERE, script), ...args], { stdio: 'inherit' }).status ?? 1;

export const COMMANDS = {
  adopt: (args) => node('adopt.mjs', args),
  status: (args) => node('adoption-status.mjs', args),
  'attest-adoption': (args) => node('adoption-attest.mjs', args),
  configure: () => {
    process.stdout.write('Configuration — resolve every adopt-pending item below, then re-run `loom verify`.\n');
    return node('adoption-status.mjs', []);
  },
  verify: () => {
    // The mechanically-validated stage: the state-of-record gates must be green.
    let rc = 0;
    for (const g of ['control-catalog-check.mjs', 'control-plane-check.mjs', 'guardrail-policy-check.mjs']) rc |= node(g, []);
    process.stdout.write('\nverify ran the state-of-record gates; run the full CI workflow (.github/workflows/ci.yml) for every gate.\n');
    return rc ? 1 : 0;
  },
  activate: (args) => {
    process.stdout.write('Activation — observe the live platform and record signed evidence, then verify it:\n');
    return node('platform-activation-check.mjs', args.filter((a) => a !== '--platform' && !a.startsWith('github')));
  },
};

// CLI (skipped when imported by the test suite).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, ...args] = process.argv.slice(2);
  if (!cmd || !COMMANDS[cmd]) {
    process.stderr.write(`usage: loom <${Object.keys(COMMANDS).join('|')}> [args]\n`);
    process.exit(cmd ? 2 : 0);
  }
  process.exit(COMMANDS[cmd](args));
}
