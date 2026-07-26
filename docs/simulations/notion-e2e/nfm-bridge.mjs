// SIMULATION SCAFFOLDING — NOT part of the shipped harness, and deliberately not committed to it.
//
// The Loom's real transport is core/floor-fetch.mjs, which walks the vendor's REST API and
// assembles the block tree. That path cannot run from this container: api.notion.com is denied by
// the environment's egress policy, and the proxy README is explicit that a 403 is an organisation
// policy denial to be reported, not routed around.
//
// The MCP connector is a different, sanctioned path — but it returns Notion-flavored MARKDOWN,
// not raw block JSON. This module converts that back into the block tree `core/floor-export.mjs`
// consumes, so the rest of the chain (export → digest → stamp → gate) runs against genuinely live
// content instead of a fixture.
//
// WHAT THIS DOES NOT PROVE. It does not exercise floor-fetch.mjs: no pagination, no separate
// children call, no error classification. And its fidelity is lower than the API's by construction
// — NFM has already lost whatever the serializer chose not to represent. A digest produced through
// here is NOT the digest the shipped path would produce for the same page, which is exactly why
// this stays out of the bundle: two adapters producing two digests for one page is a governance
// problem, not a convenience.
const RT = (text, ann = {}, href = null) => ({
  type: 'text',
  plain_text: text,
  text: { content: text, link: href ? { url: href } : null },
  href,
  annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, ...ann },
});

/** NFM escapes these outside code spans; unescape so the exporter re-escapes from the raw text. */
const unescape = (s) => s.replace(/\\([\\*~`$[\]<>{}|^])/g, '$1');

/**
 * Inline NFM → rich_text runs. Order matters: code spans are literal (no escapes inside), so they
 * are taken before anything else can claim their contents.
 */
export function inlineToRichText(src, base = {}) {
  const out = [];
  let buf = '';
  const flush = () => { if (buf) { out.push(RT(unescape(buf), base)); buf = ''; } };
  let i = 0;
  while (i < src.length) {
    const rest = src.slice(i);
    if (src[i] === '\\' && i + 1 < src.length) { buf += src[i] + src[i + 1]; i += 2; continue; }
    let m;
    if ((m = /^`([^`]+)`/.exec(rest))) {                       // code — literal, never unescaped
      flush(); out.push(RT(m[1], { ...base, code: true })); i += m[0].length; continue;
    }
    if ((m = /^\[([^\]]+)\]\(([^)]+)\)/.exec(rest))) {         // link
      flush(); out.push(...inlineToRichText(m[1], base).map((r) => ({ ...r, href: m[2], text: { ...r.text, link: { url: m[2] } } }))); i += m[0].length; continue;
    }
    if ((m = /^\*\*([\s\S]+?)\*\*/.exec(rest))) {              // bold before italic — ** would match *
      flush(); out.push(...inlineToRichText(m[1], { ...base, bold: true })); i += m[0].length; continue;
    }
    if ((m = /^~~([\s\S]+?)~~/.exec(rest))) {
      flush(); out.push(...inlineToRichText(m[1], { ...base, strikethrough: true })); i += m[0].length; continue;
    }
    if ((m = /^\*([^*]+)\*/.exec(rest))) {
      flush(); out.push(...inlineToRichText(m[1], { ...base, italic: true })); i += m[0].length; continue;
    }
    buf += src[i]; i += 1;
  }
  flush();
  return out.length ? out : [RT('', base)];
}

const blk = (type, body, over = {}) => ({ object: 'block', id: `nfm-${type}-${Math.random().toString(36).slice(2, 8)}`, type, [type]: body, has_children: false, archived: false, in_trash: false, ...over });

/** Notion-flavored Markdown → the block tree `exportPage()` consumes. */
export function nfmToBlocks(nfm) {
  const lines = nfm.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) { i += 1; continue; }

    if (/^<table\b/.test(t)) {                                  // table → table + table_row children
      const rows = [];
      let width = 0;
      i += 1;
      while (i < lines.length && !/^<\/table>/.test(lines[i].trim())) {
        if (/^<tr\b/.test(lines[i].trim())) {
          const cells = [];
          i += 1;
          while (i < lines.length && !/^<\/tr>/.test(lines[i].trim())) {
            const c = /^<td[^>]*>([\s\S]*)<\/td>$/.exec(lines[i].trim());
            if (c) cells.push(inlineToRichText(c[1]));
            i += 1;
          }
          width = Math.max(width, cells.length);
          rows.push(blk('table_row', { cells }));
        }
        i += 1;
      }
      i += 1;
      blocks.push(blk('table', { table_width: width, has_column_header: /header-row="true"/.test(t), has_row_header: false }, { has_children: true, children: rows }));
      continue;
    }

    if (/^<callout\b/.test(t)) {                                // callout → rich_text from its body
      const icon = /icon="([^"]*)"/.exec(t)?.[1] || null;
      const body = [];
      i += 1;
      while (i < lines.length && !/^<\/callout>/.test(lines[i].trim())) { body.push(lines[i].trim()); i += 1; }
      i += 1;
      blocks.push(blk('callout', { rich_text: inlineToRichText(body.join(' ').trim()), icon: icon ? { type: 'emoji', emoji: icon } : null, color: 'default' }));
      continue;
    }

    if (/^```/.test(t)) {                                       // fenced code — contents are literal
      const lang = t.slice(3).trim();
      const body = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) { body.push(lines[i]); i += 1; }
      i += 1;
      blocks.push(blk('code', { rich_text: [RT(body.join('\n'))], language: lang || 'plain text' }));
      continue;
    }

    // Blocks the freeze must refuse — surfaced faithfully so the gate, not this bridge, rejects them
    if (/^<synced_block\b/.test(t)) {
      const kids = [];
      i += 1;
      while (i < lines.length && !/^<\/synced_block>/.test(lines[i].trim())) { kids.push(blk('paragraph', { rich_text: inlineToRichText(lines[i].trim()) })); i += 1; }
      i += 1;
      blocks.push(blk('synced_block', { synced_from: null }, { has_children: kids.length > 0, children: kids }));
      continue;
    }
    if (/^<page\b/.test(t)) {
      blocks.push(blk('child_page', { title: /<page[^>]*>([\s\S]*?)<\/page>/.exec(t)?.[1] || '' }));
      i += 1; continue;
    }

    let m;
    if ((m = /^(#{1,3})\s+(.*)$/.exec(t))) {
      blocks.push(blk(`heading_${m[1].length}`, { rich_text: inlineToRichText(m[2]), color: 'default', is_toggleable: false }));
    } else if (/^---+$/.test(t)) {
      blocks.push(blk('divider', {}));
    } else if ((m = /^>\s?(.*)$/.exec(t))) {
      blocks.push(blk('quote', { rich_text: inlineToRichText(m[1]), color: 'default' }));
    } else if ((m = /^-\s+\[([ x])\]\s+(.*)$/.exec(t))) {
      blocks.push(blk('to_do', { rich_text: inlineToRichText(m[2]), checked: m[1] === 'x', color: 'default' }));
    } else if ((m = /^[-*]\s+(.*)$/.exec(t))) {
      blocks.push(blk('bulleted_list_item', { rich_text: inlineToRichText(m[1]), color: 'default' }));
    } else if ((m = /^\d+\.\s+(.*)$/.exec(t))) {
      blocks.push(blk('numbered_list_item', { rich_text: inlineToRichText(m[1]), color: 'default' }));
    } else {
      blocks.push(blk('paragraph', { rich_text: inlineToRichText(t), color: 'default' }));
    }
    i += 1;
  }
  return blocks;
}
