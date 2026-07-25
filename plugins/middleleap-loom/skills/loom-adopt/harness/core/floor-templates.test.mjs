// Tests for floor-template generation and parity. Node built-in runner: `node --test`.
//
// The contract under test: a guided form on the collaboration surface is DERIVED from the git
// template, so a teammate is asked for exactly what the gate will check. Every test here is
// really the same question asked a different way — can the two drift without anyone noticing?
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SCHEMA_ID,
  diff,
  gatesNamed,
  generate,
  parseTemplate,
  sha256,
  toFloorDefinition,
} from './floor-templates.mjs';

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const TEMPLATE = [
  '---',
  'artifact: demo-artifact',
  'stage: define',
  'run: "<slug>"',
  '---',
  '',
  '# Demo artifact — <slug>',
  '',
  '> Define (converge). Gates D1 (framing) and D6.',
  '',
  '## A prose section',
  '',
  'Write something here.',
  '',
  '## A table section',
  '',
  '| Element | Rating |',
  '|---|---|',
  '| | |',
  '',
  '## A field section (D6)',
  '',
  '- **First field:**',
  '- **Second field:** Yes / No',
  '',
].join('\n');

// --- parsing ---------------------------------------------------------------------------------

test('a template declares its identity, its gates and one entry per section', () => {
  const p = parseTemplate(TEMPLATE, { source: 'x/demo.md' });
  assert.equal(p.artifact, 'demo-artifact');
  assert.equal(p.stage, 'define');
  assert.equal(p.title, 'Demo artifact');
  assert.deepEqual(p.gates, ['D1', 'D6']);
  assert.match(p.guidance, /^Define \(converge\)/);
  assert.deepEqual(p.sections.map((s) => s.kind), ['rich_text', 'table', 'fields']);
});

test('a table section carries its columns; a field section carries its field names', () => {
  const p = parseTemplate(TEMPLATE);
  assert.deepEqual(p.sections[1].columns, ['Element', 'Rating']);
  assert.deepEqual(p.sections[2].fields, ['First field', 'Second field']);
});

test('a gate named in a section heading is recorded against that section', () => {
  const p = parseTemplate(TEMPLATE);
  assert.deepEqual(p.sections[2].gates, ['D6']);
  assert.equal(p.sections[0].gates, undefined, 'a section naming no gate claims none');
});

test('gate ranges are expanded — D1–D8 is eight gates, not two', () => {
  assert.deepEqual(gatesNamed('Delivery-ready iff D1–D8 green'), ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8']);
  assert.deepEqual(gatesNamed('Gates D1 (framing), D3 (scope), D4'), ['D1', 'D3', 'D4']);
  assert.deepEqual(gatesNamed('no gates here'), []);
});

test('the guidance blockquote is found under the heading, not above it', () => {
  // A naive reader stops at the H1 and reports no guidance — which would silently strip the one
  // piece of help text a non-technical author most needs.
  assert.match(parseTemplate(TEMPLATE).guidance, /Gates D1 \(framing\) and D6/);
});

// --- the emitted definition -------------------------------------------------------------------

test('a born-on-the-floor definition carries the freeze/drift block; a routed one does not', () => {
  const parsed = parseTemplate(TEMPLATE, { source: 'x/demo.md' });
  const born = toFloorDefinition(parsed, { writeClass: 'born-on-the-floor' });
  const routed = toFloorDefinition(parsed, { writeClass: 'decision-routed' });
  const names = (d) => d.properties.map((p) => p.name);
  for (const p of ['Frozen at', 'Version', 'Drift']) assert.ok(names(born).includes(p), `born template needs ${p}`);
  for (const p of ['Frozen at', 'Version', 'Drift']) assert.ok(!names(routed).includes(p));
  assert.equal(born.schema, SCHEMA_ID);
});

test('the freeze block is read-only — an author never writes the record own state', () => {
  const d = toFloorDefinition(parseTemplate(TEMPLATE), { writeClass: 'born-on-the-floor' });
  for (const name of ['Frozen at', 'Version', 'Drift']) {
    assert.equal(d.properties.find((p) => p.name === name).read_only, true, `${name} must be read-only`);
  }
});

test('an unknown write class is refused rather than silently defaulted', () => {
  assert.throws(() => toFloorDefinition(parseTemplate(TEMPLATE), { writeClass: 'whatever' }), /unknown write class/);
});

// --- drift: the whole point --------------------------------------------------------------------

test('an edited template makes its definition stale, by digest alone', () => {
  const parsed = parseTemplate(TEMPLATE, { source: 'x/demo.md' });
  const stored = toFloorDefinition(parsed, { sourceDigest: sha256(TEMPLATE) });
  const edited = `${TEMPLATE}\nA trailing sentence that changes nothing structural.\n`;
  const fresh = toFloorDefinition(parseTemplate(edited, { source: 'x/demo.md' }), { sourceDigest: sha256(edited) });
  assert.ok(diff(stored, fresh).some((f) => /source_digest is stale/.test(f)));
});

test('a renamed section is caught and both lists are shown', () => {
  const stored = toFloorDefinition(parseTemplate(TEMPLATE, { source: 'x/demo.md' }));
  const renamed = TEMPLATE.replace('## A prose section', '## A renamed section');
  const fresh = toFloorDefinition(parseTemplate(renamed, { source: 'x/demo.md' }));
  const f = diff(stored, fresh);
  assert.ok(f.some((x) => /section list differs/.test(x)));
  assert.ok(f.some((x) => /A renamed section/.test(x)), 'the finding must show what it became');
});

test('a column added to a table is caught even though the section list is unchanged', () => {
  const stored = toFloorDefinition(parseTemplate(TEMPLATE, { source: 'x/demo.md' }));
  const widened = TEMPLATE.replace('| Element | Rating |', '| Element | Rating | Owner |').replace('|---|---|', '|---|---|---|');
  const fresh = toFloorDefinition(parseTemplate(widened, { source: 'x/demo.md' }));
  assert.ok(diff(stored, fresh).some((x) => /shape differs/.test(x) && /Owner/.test(x)));
});

test('a gate added to the template reaches the definition', () => {
  const stored = toFloorDefinition(parseTemplate(TEMPLATE, { source: 'x/demo.md' }));
  const fresh = toFloorDefinition(parseTemplate(TEMPLATE.replace('and D6.', 'and D6, and now D9.'), { source: 'x/demo.md' }));
  assert.ok(diff(stored, fresh).some((x) => /gates differ/.test(x)));
});

test('identical definitions produce no findings — the gate is not noisy', () => {
  const a = toFloorDefinition(parseTemplate(TEMPLATE, { source: 'x/demo.md' }), { sourceDigest: sha256(TEMPLATE) });
  const b = toFloorDefinition(parseTemplate(TEMPLATE, { source: 'x/demo.md' }), { sourceDigest: sha256(TEMPLATE) });
  assert.deepEqual(diff(a, b), []);
});

// --- the shipped pairs --------------------------------------------------------------------------

const FLOOR = `${HARNESS}/floor/templates`;
if (!existsSync(FLOOR)) {
  test('shipped floor templates (absent in this layout — skipped)', { skip: true }, () => {});
} else {
  test('every shipped definition regenerates identically from its git template', () => {
    const files = readdirSync(FLOOR).filter((n) => n.endsWith('.json'));
    assert.ok(files.length > 0, 'expected shipped pairs');
    for (const name of files) {
      const stored = JSON.parse(readFileSync(`${FLOOR}/${name}`, 'utf8'));
      assert.ok(existsSync(`${HARNESS}/${stored.source}`), `${name}: source ${stored.source} must exist`);
      const fresh = generate(`${HARNESS}/${stored.source}`, { source: stored.source, writeClass: stored.write_class });
      assert.deepEqual(diff(stored, fresh), [], `${name} has drifted from ${stored.source}`);
    }
  });

  test('the privacy template reaches the floor with its D6 shape intact', () => {
    // The data-governance artifact is the one a non-technical author most needs guiding through,
    // and the one whose gate is least forgiving — so its shape is pinned explicitly.
    const d = JSON.parse(readFileSync(`${FLOOR}/data-governance.json`, 'utf8'));
    assert.deepEqual(d.gates, ['D6']);
    assert.equal(d.write_class, 'born-on-the-floor');
    const risk = d.sections.find((s) => /Risk mapping/.test(s.name));
    assert.equal(risk.kind, 'table');
    for (const col of ['`DR-*` category', 'Mitigating `CTRL-*`']) {
      assert.ok(risk.columns.includes(col), `the register mapping needs the ${col} column`);
    }
  });
}
