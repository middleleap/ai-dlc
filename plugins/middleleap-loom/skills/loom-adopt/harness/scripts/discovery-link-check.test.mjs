// Tests for the HG-0007 waist gate. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseItems, isItemStart, checkItems, FEATURE } from './discovery-link-check.mjs';

// A resolver whose behaviour is table-driven per slug.
const resolver = (map) => (slug) => (slug in map ? map[slug] : { handoffMissing: true });
const GREEN = null; // resolveRun returns null when a run is gate-green

test('parseItems slices block items and skips milestones', () => {
  const yaml = [
    'milestones:',
    '  - name: M1',
    '    items:',
    '      - id: STORY-1',
    '        status: pending',
    '        title: a',
    '      - id: STORY-2',
    '        status: done',
  ].join('\n');
  const items = parseItems(yaml);
  assert.equal(items.length, 2, 'two items, milestone header excluded');
  assert.match(items[0], /STORY-1/);
  assert.match(items[0], /title: a/); // owns its deeper-indented lines
  assert.ok(!items[0].includes('STORY-2'), 'a sibling ends the block');
});

test('parseItems handles inline flow items', () => {
  const items = parseItems('- { id: STORY-9, status: pending }\n- name: not-an-item');
  assert.equal(items.length, 1);
  assert.match(items[0], /STORY-9/);
});

test('isItemStart accepts item lines, rejects milestones', () => {
  assert.ok(isItemStart('  - id: STORY-1'));
  assert.ok(isItemStart('- { id: STORY-1 }'));
  assert.ok(!isItemStart('  - name: M1'));
  assert.ok(!isItemStart('    title: x'));
});

test('a pending feature with no discovery link fails (HG-0007)', () => {
  const f = checkItems('- id: STORY-1\n  status: pending', resolver({}));
  assert.equal(f.length, 1);
  assert.match(f[0], /pending feature with no 'discovery/);
});

test('discovery_exempt:true lets a pending feature through', () => {
  assert.deepEqual(checkItems('- id: STORY-1\n  status: pending\n  discovery_exempt: true', resolver({})), []);
});

test('a linked, gate-green run passes', () => {
  assert.deepEqual(checkItems('- id: STORY-1\n  status: pending\n  discovery: revoke-latency', resolver({ 'revoke-latency': GREEN })), []);
});

test('a linked run with a missing hand-off fails', () => {
  const f = checkItems('- id: STORY-1\n  status: pending\n  discovery: ghost', resolver({ ghost: { handoffMissing: true } }));
  assert.match(f[0], /no hand-off/);
});

test('a linked run failing its gates fails, naming the gates', () => {
  const f = checkItems('- id: STORY-1\n  status: pending\n  discovery: leaky', resolver({ leaky: { failedGates: ['D6', 'D9'] } }));
  assert.match(f[0], /not gate-green \(failing: D6, D9\)/);
});

test('non-feature ids are not waist-gated', () => {
  assert.deepEqual(checkItems('- id: INFRA-3\n  status: pending', resolver({})), []);
});

test('an un-statused stub is grandfathered (only explicit pending triggers)', () => {
  assert.deepEqual(checkItems('- id: STORY-1\n  title: someday', resolver({})), []);
});

test('in-flight / shipped items are grandfathered', () => {
  assert.deepEqual(checkItems('- id: STORY-1\n  status: done\n- id: STORY-2\n  status: in-progress', resolver({})), []);
});

test('the FEATURE convention matches STORY-<n> only', () => {
  assert.ok(FEATURE.test('STORY-42') && !FEATURE.test('INFRA-1') && !FEATURE.test('STORY-x'));
});
