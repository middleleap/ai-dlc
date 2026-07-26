import { readFileSync } from 'node:fs';
const S = new URL('.', import.meta.url).pathname;
const TOKEN = readFileSync(`${S}.notion-token`, 'utf8').trim();
const PARENT = '3a980b86-f190-8114-a4a7-fec8b248f4c5';   // Alpha Bank — Loom Factory Floor
const api = async (method, path, body) => {
  const r = await fetch(`https://api.notion.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`${r.status} ${j.code}: ${j.message}`);
  return j;
};
const rt = (s) => [{ type: 'text', text: { content: s } }];
// Numbered so ORDER can be verified — a pagination bug typically drops or reorders, and both are
// invisible unless the content says where it belongs.
const para = (n) => ({ object: 'block', type: 'paragraph', paragraph: { rich_text: rt(`block ${String(n).padStart(3, '0')} of 250`) } });
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

const paras = Array.from({ length: 250 }, (_, i) => para(i + 1));
const page = await api('POST', '/v1/pages', {
  parent: { type: 'page_id', page_id: PARENT },
  icon: { type: 'emoji', emoji: '📏' },
  properties: { title: { title: rt('Pagination test — 250 blocks + a 120-row table') } },
  children: paras.slice(0, 100),
});
console.log('page:', page.id);
for (const c of chunk(paras.slice(100), 100)) {
  await api('PATCH', `/v1/blocks/${page.id}/children`, { children: c });
  process.stdout.write(`  appended ${c.length} paragraphs\n`);
}

// A table whose ROWS also cross the 100-per-page boundary — table_row children come from their own
// paginated call, so this exercises pagination one level down as well.
const row = (n) => ({ object: 'block', type: 'table_row', table_row: { cells: [rt(`r${String(n).padStart(3, '0')}`), rt(`value ${n}`)] } });
const rows = Array.from({ length: 120 }, (_, i) => row(i + 1));
const [tbl] = (await api('PATCH', `/v1/blocks/${page.id}/children`, {
  children: [{ object: 'block', type: 'table', table: { table_width: 2, has_column_header: true, has_row_header: false, children: rows.slice(0, 100) } }],
})).results;
console.log('table:', tbl.id, '(100 rows)');
for (const c of chunk(rows.slice(100), 100)) {
  await api('PATCH', `/v1/blocks/${tbl.id}/children`, { children: c });
  process.stdout.write(`  appended ${c.length} table rows\n`);
}
console.log('\nPAGE_ID=' + page.id);
