// The floor fetcher (Factory Floor WS4 · D4.1, the half that talks to a surface). It walks a
// collaboration-surface page and assembles the shape `core/floor-export.mjs` converts.
//
// THE SHAPE THE EXPORTER EXPECTS IS NOT THE SHAPE THE API RETURNS, and pretending otherwise is
// how a converter passes its tests and fails on real data. Notion's API returns blocks in
// PAGINATED lists, and a block's children come from a SEPARATE call — `has_children: true` tells
// you they exist, not what they are. The exporter takes children nested inline because that makes
// it a pure function over a complete tree. This module is what turns one into the other, and it
// is the only place in the harness that knows the vendor's request shape.
//
// STILL NO NETWORK CALL HERE. `request` is injected. That is not ceremony: it keeps the harness
// dependency-free and network-free per the adapter contract, it lets every failure mode below be
// tested against recorded responses rather than hoped about, and it means the token lives in the
// caller's closure and never passes through a module that could log it.
//
// FAILS CLOSED, for the same reason the exporter does. A partial walk is the dangerous outcome:
// it produces a page that looks whole, exports cleanly, passes the D-gates, and is missing
// whatever was on the second page of results. So every abort below throws, and nothing returns a
// tree it could not finish assembling.
//
// THE API VERSION IS A REQUIRED ARGUMENT, not a default. Which version to pin is an open decision
// (ADR-0001, still `proposed`), and a module that quietly defaulted would make that decision by
// omission — for every adopter, invisibly. An unresolved governance decision should be felt as a
// missing argument, not smoothed over.
import process from 'node:process';

export const BLOCKS_PATH = (id) => `/v1/blocks/${id}/children`;
export const PAGE_PATH = (id) => `/v1/pages/${id}`;

/** How deep a block tree may nest before we call it pathological rather than deep. */
export const MAX_DEPTH = 12;
/** How many blocks a single page may carry. A freeze is a document, not a database dump. */
export const MAX_BLOCKS = 5000;
/** Pagination page size. The API caps this at 100. */
export const PAGE_SIZE = 100;

class FetchError extends Error {
  constructor(reason, at) { super(reason); this.name = 'FetchError'; this.at = at; }
}
const abort = (reason, at) => { throw new FetchError(reason, at); };

/**
 * Classify a non-2xx response. The vendor returns `{ object: "error", status, code, message }`,
 * and the CODE is what an operator needs — "restricted_resource" and "object_not_found" look
 * identical from a status line but mean very different things about who did what wrong.
 */
function classify(res, at) {
  const code = res?.body?.code;
  const message = res?.body?.message || '';
  const named = {
    unauthorized: 'the integration token was rejected — it is missing, wrong, or revoked',
    restricted_resource: 'the token is valid but the integration has no access to this page — share the page with the integration',
    object_not_found: 'no such page, OR the integration cannot see it. The API deliberately does not distinguish the two, so check the share before assuming it is deleted',
    rate_limited: 'rate limited — retry after the interval the response names. This module does not retry: a freeze that silently waits is a freeze whose timing nobody can reason about',
    validation_error: 'the request was malformed — usually a bad id or an unsupported page size',
  }[code];
  abort(`${res?.status ?? '?'} ${code || 'error'}: ${named || message || 'the surface refused the request'}`, at);
}

/** One request, with the version pin and the standard checks. Returns the parsed body. */
async function call(request, path, { query, notionVersion, at }) {
  let res;
  try {
    res = await request({ method: 'GET', path, query, headers: { 'Notion-Version': notionVersion } });
  } catch (e) {
    abort(`the request failed before a response arrived (${e?.message || e}) — a freeze cannot be assembled from a partial read`, at);
  }
  if (!res || typeof res.status !== 'number') abort('the injected request returned no status — it must resolve to { status, body }', at);
  if (res.status < 200 || res.status >= 300) classify(res, at);
  if (!res.body || typeof res.body !== 'object') abort(`${res.status} with no JSON body`, at);
  return res.body;
}

/**
 * Every child block of `blockId`, following pagination to the end. Never returns a partial list:
 * if any page of results fails, the whole walk aborts.
 */
export async function fetchChildren(blockId, ctx, at = blockId) {
  const out = [];
  let cursor;
  let guard = 0;
  do {
    const body = await call(ctx.request, BLOCKS_PATH(blockId), {
      query: { page_size: PAGE_SIZE, ...(cursor ? { start_cursor: cursor } : {}) },
      notionVersion: ctx.notionVersion,
      at,
    });
    if (!Array.isArray(body.results)) abort('a block list came back without `results`', at);
    out.push(...body.results);
    cursor = body.has_more ? body.next_cursor : null;
    if (body.has_more && !body.next_cursor) {
      abort('the surface reported more results but returned no cursor — the rest of this page is unreachable, so the freeze aborts rather than recording a fragment', at);
    }
    // A cursor that never terminates would spin forever on a surface bug; bound it against the
    // page cap rather than trusting the other side to stop.
    if (++guard > Math.ceil(MAX_BLOCKS / PAGE_SIZE) + 1) abort('pagination did not terminate', at);
    if (ctx.count.n + out.length > MAX_BLOCKS) abort(`more than ${MAX_BLOCKS} blocks — a freeze is a document, not a database dump`, at);
  } while (cursor);
  ctx.count.n += out.length;
  return out;
}

/**
 * Assemble one block and, when it declares children, the subtree beneath it — so the exporter
 * receives the nested tree it expects. A block that says `has_children` and yields none is left
 * as an EMPTY array rather than undefined, because the exporter treats "declares children but
 * carries none" as a permission gap and aborts; that judgement belongs there, not here.
 */
async function assemble(block, ctx, depth, at) {
  if (depth > MAX_DEPTH) abort(`block nesting deeper than ${MAX_DEPTH} — refusing to walk further`, at);
  // Archived or trashed content is not the record. Freezing it would resurrect, into a governed
  // artifact, something a person deliberately removed from the page.
  if (block?.archived === true || block?.in_trash === true) {
    abort(`block ${block.id} is archived or in the trash — restore it or delete it, but it must not be frozen from limbo`, at);
  }
  if (block?.has_children === true) {
    block.children = await fetchChildren(block.id, ctx, `${at} › ${block.type}`);
    for (const [i, child] of block.children.entries()) {
      await assemble(child, ctx, depth + 1, `${at} › ${block.type}[${i}]`);
    }
  }
  return block;
}

/** The page's title, read from whichever property is the title property. */
export function titleOf(page) {
  const props = page?.properties || {};
  for (const key of Object.keys(props).sort()) {
    const p = props[key];
    if (p?.type === 'title' && Array.isArray(p.title)) {
      return p.title.map((t) => t?.plain_text ?? t?.text?.content ?? '').join('').trim();
    }
  }
  return '';
}

/**
 * Fetch a page and return it in the shape `exportPage()` consumes.
 *
 * ctx: {
 *   request,          — async ({method, path, query, headers}) => ({ status, body }). Holds the token.
 *   notionVersion,    — REQUIRED. The pinned API version (ADR-0001).
 *   frontmatter,      — optional, passed through to the exporter
 * }
 *
 * Returns { title, blocks, has_more: false, frontmatter } — `has_more` is always false because a
 * page that could not be read to the end throws rather than returning.
 */
export async function fetchPage(pageId, ctx) {
  const at = `page ${pageId}`;
  if (!pageId || typeof pageId !== 'string') abort('no page id', at);
  if (!ctx || typeof ctx.request !== 'function') abort('no `request` function injected — this module makes no network call of its own', at);
  if (typeof ctx.notionVersion !== 'string' || !ctx.notionVersion.trim()) {
    abort('no `notionVersion` — the API version pin is a governance decision (ADR-0001), and defaulting it here would make that decision by omission for every adopter', at);
  }

  const inner = { request: ctx.request, notionVersion: ctx.notionVersion, count: { n: 0 } };
  const page = await call(ctx.request, PAGE_PATH(pageId), { notionVersion: ctx.notionVersion, at });
  if (page.archived === true || page.in_trash === true) {
    abort('the page is archived or in the trash — a freeze records the working document, not a deleted one', at);
  }
  const blocks = await fetchChildren(pageId, inner, at);
  for (const [i, b] of blocks.entries()) await assemble(b, inner, 1, `${at} › block[${i}]`);

  return {
    title: titleOf(page),
    blocks,
    has_more: false, // an unfinished walk threw; reaching here means the tree is whole
    frontmatter: ctx.frontmatter,
    source: `notion:page/${pageId}`,
    blocks_read: inner.count.n,
  };
}

/** Fetch without throwing: `{ page, findings }`. `findings: []` ⇒ the tree is complete. */
export async function tryFetchPage(pageId, ctx) {
  try { return { page: await fetchPage(pageId, ctx), findings: [] }; } catch (e) {
    if (e.name !== 'FetchError') throw e;
    return { page: null, findings: [`${e.at}: ${e.message}`] };
  }
}

/**
 * A `request` implementation over global fetch — the ONE place a real network call is made, kept
 * out of `fetchPage` so the walk stays testable. The caller supplies the token; it is closed over
 * here and never passed to the walker.
 */
export function httpRequest({ token, baseUrl = 'https://api.notion.com' } = {}) {
  if (!token) throw new Error('httpRequest needs a Notion integration token');
  return async ({ method, path, query, headers }) => {
    const url = new URL(path, baseUrl);
    for (const [k, v] of Object.entries(query || {})) url.searchParams.set(k, String(v));
    const res = await fetch(url, {
      method,
      headers: { ...headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    let body = null;
    try { body = await res.json(); } catch { /* classified by status below */ }
    return { status: res.status, body };
  };
}

// CLI: fetch a page and print what would be frozen. Requires NOTION_TOKEN and an explicit version.
//   NOTION_TOKEN=… node core/floor-fetch.mjs <page-id> <notion-version>
if (process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) {
  const [pageId, version] = process.argv.slice(2);
  if (!pageId || !version) {
    process.stderr.write('usage: NOTION_TOKEN=… node core/floor-fetch.mjs <page-id> <notion-version>\n');
    process.exit(2);
  }
  const token = process.env.NOTION_TOKEN;
  if (!token) { process.stderr.write('NOTION_TOKEN is not set\n'); process.exit(2); }
  const { page, findings } = await tryFetchPage(pageId, { request: httpRequest({ token }), notionVersion: version });
  if (findings.length) {
    process.stderr.write(`\nFetch ABORTED — nothing is written.\n\n  - ${findings.join('\n  - ')}\n`);
    process.exit(1);
  }
  const { exportPage } = await import('./floor-export.mjs');
  const { markdown, digest } = exportPage(page, { slug: pageId });
  process.stdout.write(`${markdown}\n--- ${page.blocks_read} blocks read · digest ---\n${digest}\n`);
}
