// The end-to-end simulation: live Notion content → deterministic export → freeze → CI gate.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { nfmToBlocks } from './nfm-bridge.mjs';

const H = '/home/user/ai-dlc/plugins/middleleap-loom/skills/loom-adopt/harness';
const { exportPage, tryExport, freezeStamp } = await import(`${H}/core/floor-export.mjs`);

const HERE = new URL('.', import.meta.url).pathname;
const RUN = `${HERE}layout`;
const SLUG = 'accounts-elsewhere-live';
const say = (s = '') => process.stdout.write(`${s}\n`);
const rule = (t) => say(`\n${'─'.repeat(78)}\n${t}\n${'─'.repeat(78)}`);

// ── 1 · what came off the live floor ───────────────────────────────────────────────────────────
rule('1 · LIVE FLOOR  — fetched from the Notion workspace "Middleleap" via the MCP connector');
const nfm = readFileSync(`${HERE}live-data-governance.nfm`, 'utf8');
const blocks = nfmToBlocks(nfm);
const counts = blocks.reduce((a, b) => ({ ...a, [b.type]: (a[b.type] || 0) + 1 }), {});
say(`  page      : Data-governance feasibility — accounts-elsewhere`);
say(`  bytes     : ${nfm.length}`);
say(`  blocks    : ${blocks.length}  →  ${Object.entries(counts).map(([k, v]) => `${k}×${v}`).join('  ')}`);
say(`  table rows: ${blocks.filter((b) => b.type === 'table').map((b) => b.children.length).join(', ')}`);

// ── 2 · the shipped exporter, unchanged ────────────────────────────────────────────────────────
rule('2 · EXPORT  — core/floor-export.mjs, the shipped module, no arguments bent for this run');
const page = {
  title: 'Data-governance feasibility — accounts-elsewhere',
  blocks,
  has_more: false,
  frontmatter: { artifact: 'data-governance', run: SLUG, stage: 'define' },
};
const { markdown, digest } = exportPage(page, { slug: SLUG });
say(`  markdown  : ${markdown.length} bytes, ${markdown.split('\n').length} lines`);
say(`  digest    : ${digest}`);

// determinism is the whole property — same tree twice must be the same bytes
const again = exportPage({ ...page, blocks: nfmToBlocks(nfm) }, { slug: SLUG });
say(`  re-export : ${again.digest === digest ? 'IDENTICAL — deterministic' : 'DIFFERENT — BUG'}`);

// ── 3 · freeze into the record ─────────────────────────────────────────────────────────────────
rule('3 · FREEZE  — the artifact and the stamp that vouches for exactly these bytes');
rmSync(RUN, { recursive: true, force: true });
mkdirSync(`${RUN}/discovery/runs/${SLUG}/.freeze`, { recursive: true });
for (const d of ['scripts', 'core']) mkdirSync(`${RUN}/${d}`, { recursive: true });
cpSync(`${H}/scripts/freeze-stamp-check.mjs`, `${RUN}/scripts/freeze-stamp-check.mjs`);
cpSync(`${H}/core/floor-export.mjs`, `${RUN}/core/floor-export.mjs`);

const stamp = freezeStamp({
  slug: SLUG,
  file: 'data-governance.md',
  digest,
  source: 'notion:page/3a980b86-f190-81ca-8611-e73e46293060',
  exportedAt: '2026-07-26T06:20:00Z',
  exportedBy: 'svc-floor-freezer',
});
writeFileSync(`${RUN}/discovery/runs/${SLUG}/data-governance.md`, markdown);
writeFileSync(`${RUN}/discovery/runs/${SLUG}/.freeze/data-governance.json`, `${JSON.stringify(stamp, null, 2)}\n`);
say(`  wrote     : discovery/runs/${SLUG}/data-governance.md`);
say(`  stamp     : source=${stamp.source}`);
say(`              digest=${stamp.digest}`);

// ── 4 · the gate, exactly as CI runs it ────────────────────────────────────────────────────────
const gate = () => {
  try { return { ok: true, out: execFileSync('node', ['scripts/freeze-stamp-check.mjs'], { cwd: RUN, encoding: 'utf8' }) }; } catch (e) {
    return { ok: false, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
};
rule('4 · GATE  — scripts/freeze-stamp-check.mjs, the same command CI runs');
const clean = gate();
say(`  exit      : ${clean.ok ? '0 — PASS' : 'non-zero — FAIL'}`);
say(`  ${clean.out.trim().split('\n').join('\n  ')}`);

// ── 5 · the attack the gate exists for ─────────────────────────────────────────────────────────
rule('5 · TAMPER  — the quiet edit: downgrade the residual rating in the frozen file');
const f = `${RUN}/discovery/runs/${SLUG}/data-governance.md`;
const before = readFileSync(f, 'utf8');
const after = before.replace('after controls:** Medium', 'after controls:** Low');
if (after === before) throw new Error('the tamper changed nothing — a passing gate here would prove nothing');
writeFileSync(f, after);
say(`  edit      : "Medium" → "Low" on line ${before.split('\n').findIndex((l) => l.includes('Residual rating')) + 1}, 1 word, 3 bytes`);
const tampered = gate();
say(`  exit      : ${tampered.ok ? '0 — PASS (BUG: the edit went unnoticed)' : 'non-zero — REFUSED'}`);
say(`  ${tampered.out.trim().split('\n').slice(0, 6).join('\n  ')}`);

// ── 6 · the page built to be un-freezable ──────────────────────────────────────────────────────
rule('6 · REFUSAL  — the second live page, which carries a synced block and a child page');
const scratchNfm = [
  'This page exists to be **rejected**.',
  '---',
  '<synced_block url="https://app.notion.com/p/…#77e34c2a">',
  '\tThis text is owned by another page. The freeze cannot vouch for it.',
  '</synced_block>',
  '<page url="https://app.notion.com/p/ab0c31bb">Nested page the freeze must not swallow</page>',
].join('\n');
const scratch = tryExport({ title: 'Scratch — blocks the freeze must refuse', blocks: nfmToBlocks(scratchNfm), has_more: false }, { slug: 'scratch' });
say(`  exported  : ${scratch.markdown ? 'YES — BUG' : 'no — refused, nothing written'}`);
say(`  reason    : ${scratch.findings[0].replace(/\s+/g, ' ').slice(0, 130)}…`);

rule('RESULT — derived from what actually happened above, not asserted');
const checks = [
  ['export is deterministic', again.digest === digest],
  ['gate passes on the frozen bytes', clean.ok],
  ['gate REFUSES the one-word tamper', !tampered.ok],
  ['un-freezable page is refused', scratch.markdown === null],
];
for (const [name, ok] of checks) say(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
say(`\n  ${checks.every(([, ok]) => ok) ? 'ALL GREEN' : 'NOT GREEN — see above'}`);
say(`  frozen digest: ${digest}`);
say('');
say('  The one substituted link: transport. core/floor-fetch.mjs (the REST walker) could not run —');
say('  api.notion.com is denied by this environment\'s egress policy. Everything downstream of the');
say('  fetch is the shipped code, unmodified, running on content authored in a real workspace.');
