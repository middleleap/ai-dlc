// Tests for the floor fetcher (Factory Floor WS4 · D4.1). Node built-in runner.
//
// These run against RECORDED RESPONSE SHAPES, not a live workspace. That is a real limit and it
// is stated here rather than in a commit message: the shapes below are modelled on the documented
// API — paginated `results` with `has_more`/`next_cursor`, children fetched separately behind
// `has_children`, errors as `{ object: "error", status, code, message }` — and the first live call
// is where that modelling gets checked. What these tests DO prove is that the walk assembles,
// paginates, recurses and, above all, ABORTS correctly, because those are the paths a live smoke
// test is least likely to exercise and most likely to need.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_BLOCKS, fetchPage, titleOf, tryFetchPage } from './floor-fetch.mjs';
import { exportPage } from './floor-export.mjs';

const VERSION = '2026-03-11';

const rt = (s) => [{ type: 'text', plain_text: s, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false }, text: { content: s, link: null }, href: null }];
const para = (id, s, over = {}) => ({ object: 'block', id, type: 'paragraph', has_children: false, archived: false, in_trash: false, paragraph: { rich_text: rt(s), color: 'default' }, ...over });
const list = (results, over = {}) => ({ object: 'list', results, next_cursor: null, has_more: false, type: 'block', ...over });
const pageObj = (over = {}) => ({
  object: 'page', id: 'pg1', archived: false, in_trash: false,
  properties: { Tags: { type: 'multi_select', multi_select: [] }, Name: { type: 'title', title: rt('Problem statement — linked-accounts') } },
  ...over,
});

/** A `request` built from a routing table: path → body (or a function of the query). */
const requestFrom = (routes, { status = 200 } = {}) => async ({ path, query, headers }) => {
  assert.equal(headers['Notion-Version'], VERSION, 'every call must carry the pinned version');
  const r = routes[path];
  if (r === undefined) return { status: 404, body: { object: 'error', status: 404, code: 'object_not_found', message: 'not found' } };
  const body = typeof r === 'function' ? r(query || {}) : r;
  return { status: body?.object === 'error' ? body.status : status, body };
};

// --- the walk ------------------------------------------------------------------------------------

test('a page assembles into the shape the exporter consumes', async () => {
  const page = await fetchPage('pg1', {
    notionVersion: VERSION,
    request: requestFrom({
      '/v1/pages/pg1': pageObj(),
      '/v1/blocks/pg1/children': list([para('b1', 'first'), para('b2', 'second')]),
    }),
  });
  assert.equal(page.title, 'Problem statement — linked-accounts');
  assert.equal(page.has_more, false);
  assert.equal(page.blocks.length, 2);
  assert.equal(page.blocks_read, 2);
  // …and the whole point: it exports without the exporter knowing a vendor exists.
  const { markdown } = exportPage(page);
  assert.match(markdown, /# Problem statement/);
  assert.match(markdown, /first/);
});

test('pagination is followed to the end — the second page is not silently dropped', async () => {
  const page = await fetchPage('pg1', {
    notionVersion: VERSION,
    request: requestFrom({
      '/v1/pages/pg1': pageObj(),
      '/v1/blocks/pg1/children': (q) => (q.start_cursor
        ? list([para('b3', 'third')])
        : list([para('b1', 'first'), para('b2', 'second')], { has_more: true, next_cursor: 'cur1' })),
    }),
  });
  assert.deepEqual(page.blocks.map((b) => b.id), ['b1', 'b2', 'b3']);
  assert.equal(page.blocks_read, 3);
});

test('children are fetched separately and nested, because the API does not nest them', async () => {
  const page = await fetchPage('pg1', {
    notionVersion: VERSION,
    request: requestFrom({
      '/v1/pages/pg1': pageObj(),
      '/v1/blocks/pg1/children': list([{ ...para('b1', 'parent'), has_children: true }]),
      '/v1/blocks/b1/children': list([para('b1a', 'child')]),
    }),
  });
  assert.equal(page.blocks[0].children.length, 1);
  assert.match(exportPage(page).markdown, /parent[\s\S]*child/);
});

test('a table arrives with its rows as children, which is what the exporter reads', async () => {
  const row = (id, ...cells) => ({ object: 'block', id, type: 'table_row', has_children: false, table_row: { cells: cells.map(rt) } });
  const page = await fetchPage('pg1', {
    notionVersion: VERSION,
    request: requestFrom({
      '/v1/pages/pg1': pageObj(),
      '/v1/blocks/pg1/children': list([{ object: 'block', id: 't1', type: 'table', has_children: true, table: { table_width: 2, has_column_header: true } }]),
      '/v1/blocks/t1/children': list([row('r1', 'Element', 'Rating'), row('r2', 'residency', 'high')]),
    }),
  });
  const { markdown } = exportPage(page);
  assert.match(markdown, /\| Element \| Rating \|/);
  assert.match(markdown, /\| residency \| high \|/);
});

// --- the version pin is a governance decision, not a default -------------------------------------

test('no API version means no fetch — ADR-0001 is not decided by omission', async () => {
  const { page, findings } = await tryFetchPage('pg1', { request: async () => ({ status: 200, body: {} }) });
  assert.equal(page, null);
  assert.match(findings[0], /notionVersion/);
  assert.match(findings[0], /ADR-0001/);
});

test('every request carries the pinned version', async () => {
  // requestFrom asserts the header on each call; three calls, three assertions.
  await fetchPage('pg1', {
    notionVersion: VERSION,
    request: requestFrom({
      '/v1/pages/pg1': pageObj(),
      '/v1/blocks/pg1/children': list([{ ...para('b1', 'p'), has_children: true }]),
      '/v1/blocks/b1/children': list([para('b1a', 'c')]),
    }),
  });
});

// --- fails closed --------------------------------------------------------------------------------

test('a truncated walk aborts rather than returning a fragment', async () => {
  const { page, findings } = await tryFetchPage('pg1', {
    notionVersion: VERSION,
    request: requestFrom({
      '/v1/pages/pg1': pageObj(),
      // says there is more, gives no cursor — the rest is unreachable
      '/v1/blocks/pg1/children': list([para('b1', 'only the first page')], { has_more: true, next_cursor: null }),
    }),
  });
  assert.equal(page, null);
  assert.match(findings[0], /unreachable/);
  assert.match(findings[0], /rather than recording a fragment/);
});

test('an error part-way through the walk aborts the whole page', async () => {
  const { page, findings } = await tryFetchPage('pg1', {
    notionVersion: VERSION,
    request: requestFrom({
      '/v1/pages/pg1': pageObj(),
      '/v1/blocks/pg1/children': list([{ ...para('b1', 'parent'), has_children: true }]),
      // b1's children are simply not routed → 404 object_not_found
    }),
  });
  assert.equal(page, null);
  assert.match(findings[0], /object_not_found/);
});

test('each API error code is explained in the terms an operator needs', async () => {
  const cases = [
    [401, 'unauthorized', /token was rejected/],
    [403, 'restricted_resource', /share the page with the integration/],
    [404, 'object_not_found', /deliberately does not distinguish/],
    [429, 'rate_limited', /does not retry/],
    [400, 'validation_error', /malformed/],
  ];
  for (const [status, code, re] of cases) {
    const { findings } = await tryFetchPage('pg1', {
      notionVersion: VERSION,
      request: async () => ({ status, body: { object: 'error', status, code, message: 'x' } }),
    });
    assert.match(findings[0], re, `${code}: ${findings[0]}`);
  }
});

// A 403 and a 404 look the same from a status line and mean very different things about who did
// what wrong — the most common real-world confusion when wiring an integration for the first time.
test('restricted_resource and object_not_found do not read the same', async () => {
  const of = async (code, status) => (await tryFetchPage('pg1', {
    notionVersion: VERSION, request: async () => ({ status, body: { object: 'error', status, code, message: '' } }),
  })).findings[0];
  assert.notEqual(await of('restricted_resource', 403), await of('object_not_found', 404));
});

test('archived or trashed content is never frozen', async () => {
  const archivedPage = await tryFetchPage('pg1', {
    notionVersion: VERSION, request: requestFrom({ '/v1/pages/pg1': pageObj({ archived: true }) }),
  });
  assert.match(archivedPage.findings[0], /archived or in the trash/);

  const archivedBlock = await tryFetchPage('pg1', {
    notionVersion: VERSION,
    request: requestFrom({
      '/v1/pages/pg1': pageObj(),
      '/v1/blocks/pg1/children': list([para('b1', 'deleted', { in_trash: true })]),
    }),
  });
  assert.match(archivedBlock.findings[0], /must not be frozen from limbo/);
});

test('a transport failure is an abort, not an empty page', async () => {
  const { page, findings } = await tryFetchPage('pg1', {
    notionVersion: VERSION,
    request: async () => { throw new Error('ECONNRESET'); },
  });
  assert.equal(page, null);
  assert.match(findings[0], /ECONNRESET/);
  assert.match(findings[0], /cannot be assembled from a partial read/);
});

test('runaway nesting and runaway size are bounded', async () => {
  // every block claims a child, forever
  const deep = await tryFetchPage('pg1', {
    notionVersion: VERSION,
    request: async ({ path }) => ({
      status: 200,
      body: path.startsWith('/v1/pages')
        ? pageObj()
        : list([{ ...para(`b${Math.random()}`, 'deeper'), has_children: true }]),
    }),
  });
  assert.match(deep.findings[0], /nesting deeper than|blocks — a freeze is a document/);
});

test('a response with no results array is refused', async () => {
  const { findings } = await tryFetchPage('pg1', {
    notionVersion: VERSION,
    request: requestFrom({ '/v1/pages/pg1': pageObj(), '/v1/blocks/pg1/children': { object: 'list' } }),
  });
  assert.match(findings[0], /without `results`/);
});

test('the walker refuses to run without an injected request', async () => {
  const { findings } = await tryFetchPage('pg1', { notionVersion: VERSION });
  assert.match(findings[0], /no `request` function injected/);
});

// --- the title ------------------------------------------------------------------------------------

test('the title comes from whichever property is the title property', () => {
  assert.equal(titleOf(pageObj()), 'Problem statement — linked-accounts');
  assert.equal(titleOf({ properties: { Untitled: { type: 'title', title: [] } } }), '');
  assert.equal(titleOf({ properties: { Only: { type: 'rich_text', rich_text: rt('not a title') } } }), '');
  assert.equal(titleOf(null), '');
});

test('MAX_BLOCKS is a real bound, not decoration', () => {
  assert.ok(MAX_BLOCKS > 0 && Number.isFinite(MAX_BLOCKS));
});
