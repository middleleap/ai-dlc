import { readFileSync } from 'node:fs';
const H = '/home/user/ai-dlc/plugins/middleleap-loom/skills/loom-adopt/harness';
const { fetchPage, httpRequest, PAGE_SIZE } = await import(`${H}/core/floor-fetch.mjs`);
const { exportPage } = await import(`${H}/core/floor-export.mjs`);
const S = new URL('.', import.meta.url).pathname;
const PAGE = '3a980b86-f190-81d3-842a-ef8a2eac65f0';

// wrap the real transport so every call — and every cursor — is visible
const inner = httpRequest({ token: readFileSync(`${S}.notion-token`, 'utf8').trim() });
const calls = [];
const request = async (opts) => {
  const res = await inner(opts);
  calls.push({ path: opts.path, cursor: opts.query?.start_cursor ? 'yes' : 'no', got: res.body?.results?.length ?? '-', more: res.body?.has_more ?? '-' });
  return res;
};

const t0 = Date.now();
const page = await fetchPage(PAGE, { request, notionVersion: '2022-06-28' });
const ms = Date.now() - t0;

console.log(`PAGE_SIZE          : ${PAGE_SIZE}`);
console.log(`wall clock         : ${ms} ms`);
console.log(`API calls          : ${calls.length}`);
for (const c of calls) console.log(`   ${c.path.padEnd(52)} cursor=${c.cursor.padEnd(3)} results=${String(c.got).padEnd(3)} has_more=${c.more}`);

console.log(`\nblocks_read        : ${page.blocks_read}`);
console.log(`top-level blocks   : ${page.blocks.length}`);
const paras = page.blocks.filter((b) => b.type === 'paragraph');
const table = page.blocks.find((b) => b.type === 'table');
console.log(`paragraphs         : ${paras.length}   (expected 250)`);
console.log(`table rows         : ${table?.children?.length}   (expected 120)`);

// ── the two failures pagination actually produces: dropped, and reordered ──────────────────────
const nums = paras.map((b) => Number(/block (\d+) of 250/.exec(b.paragraph.rich_text[0].plain_text)?.[1]));
const missing = Array.from({ length: 250 }, (_, i) => i + 1).filter((n) => !nums.includes(n));
const ordered = nums.every((n, i) => n === i + 1);
console.log(`\nnone dropped       : ${missing.length === 0 ? 'PASS' : `FAIL — missing ${missing.slice(0, 8).join(',')}…`}`);
console.log(`order preserved    : ${ordered ? 'PASS' : 'FAIL — reordered across a page boundary'}`);
console.log(`  first / last     : ${nums[0]} … ${nums[nums.length - 1]}`);
console.log(`  across boundary  : …${nums.slice(98, 102).join(', ')}…   (100→101 is where page 1 ends)`);

const rows = table.children.map((r) => Number(/r(\d+)/.exec(r.table_row.cells[0][0].plain_text)?.[1]));
console.log(`table rows ordered : ${rows.every((n, i) => n === i + 1) ? 'PASS' : 'FAIL'}   ${rows[0]} … ${rows[rows.length - 1]}`);
console.log(`  across boundary  : …${rows.slice(98, 102).join(', ')}…`);

const { markdown, digest } = exportPage(page, { slug: 'pagination-test' });
console.log(`\nexports            : ${markdown.split('\n').length} lines, digest ${digest.slice(0, 26)}…`);
console.log(`markdown intact    : ${markdown.includes('block 001 of 250') && markdown.includes('block 250 of 250') && markdown.includes('| r120 | value 120 |') ? 'PASS — first, last and the final table row all present' : 'FAIL'}`);
