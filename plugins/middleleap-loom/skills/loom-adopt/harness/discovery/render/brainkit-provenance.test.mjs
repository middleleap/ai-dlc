// rc.8 WS8: rendered artifacts carry verifiable BrainKit provenance when the D7 brand seam is a
// compatibility projection — and carry NONE (unchanged output) when it is a plain brand, so
// existing D7 behavior is backward compatible. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTokens, brainkitProvenance } from './tokens.mjs';
import { renderDocument, renderDeck } from './render.mjs';
import { renderOffice } from './render-office.mjs';

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEMO = resolve(HARNESS, 'discovery/brand/design.md');           // a plain brand, no BrainKit
const PROJECTION = resolve(HARNESS, 'brainkit-example/discovery/brand/design.md'); // a BrainKit projection
// Read from the sealed example rather than pinned: a reseal (a new strategic intent, say) must not
// need a test edit to stay green, and the assertions below still bind the render to the live seal.
const MANIFEST = resolve(HARNESS, 'brainkit-example/institution/brainkit/manifest.json');
const SEALED = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { package_digest: '', version: '' };
const DIGEST = SEALED.package_digest;
const VERSION = SEALED.version;

test('a plain brand seam yields NO BrainKit provenance (backward compatible)', () => {
  const brand = parseTokens(DEMO);
  assert.equal(brand.brainkit, null);
  assert.equal(brainkitProvenance(brand.brainkit), '');
  const html = renderDocument({ title: 'X', sections: [] }, brand);
  assert.ok(!html.includes('brainkit-id'), 'no BrainKit meta on a plain brand');
  const docx = renderOffice('docx', { title: 'X', sections: [] }, brand);
  assert.ok(!docx.includes('brainkit:'), 'no BrainKit provenance in docx props on a plain brand');
});

if (!existsSync(PROJECTION)) {
  test('BrainKit projection render (example bundle-only — skipped in an adopted layout)', { skip: true }, () => {});
} else {
  test('a BrainKit projection stamps id/version/digest into HTML metadata', () => {
    const brand = parseTokens(PROJECTION);
    assert.equal(brand.brainkit.id, 'meridian-trust-brainkit');
    const html = renderDocument({ title: 'X', sections: [] }, brand);
    assert.ok(html.includes('<meta name="brainkit-id" content="meridian-trust-brainkit"'));
    assert.ok(html.includes(`<meta name="brainkit-digest" content="${DIGEST}"`));
    const deck = renderDeck({ title: 'X', slides: [] }, brand);
    assert.ok(deck.includes(`brainkit-version" content="${VERSION}"`));
  });

  test('a BrainKit projection stamps provenance into DOCX/PPTX/XLSX core properties', () => {
    const brand = parseTokens(PROJECTION);
    const want = `brainkit:meridian-trust-brainkit@${VERSION} ${DIGEST}`;
    for (const fmt of ['docx', 'pptx', 'xlsx']) {
      const buf = renderOffice(fmt, { title: 'X', columns: ['a'], rows: [['b']], sections: [], slides: [] }, brand);
      assert.ok(buf.includes(want), `${fmt} core props must carry BrainKit provenance`);
    }
  });
}
