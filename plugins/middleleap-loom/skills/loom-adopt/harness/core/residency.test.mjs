// Tests for the residency sign-off gate (WS0 · D0.1 · P1).
//
// Every identity below is from the shipped DEMO registry (dp-yusuf, risk-lena and friends are
// invented people the template uses to demonstrate shape). No real signatory appears here, and none
// may be added — a test suite is not a place to write a person's approval, even a fake one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BLOCKING_VERDICTS, REQUIRED_ROLES, VERDICTS, evaluate, isSigned, parseSignoff,
} from './residency.mjs';

const record = (dp, risk) => `
# A residency record

## 4 · Content classes

Prose that is not the table.

## 11 · Sign-off

| Role (registry) | Name | Registry identity | Decision | Date |
|---|---|---|---|---|
| \`data-protection\` | ${dp.name} | ${dp.id} | ${dp.decision} | ${dp.date} |
| \`risk-second-line\` | ${risk.name} | ${risk.id} | ${risk.decision} | ${risk.date} |

### The blocking statement

Prose after the table.
`;

const AWAIT = { name: '**AWAITING**', id: '**AWAITING**', decision: '**AWAITING** — approve / approve with conditions / refuse', date: '**AWAITING**' };
const YUSUF = { name: 'Yusuf', id: 'dp-yusuf', decision: 'approve', date: '2026-07-26' };
const LENA = { name: 'Lena', id: 'risk-lena', decision: 'approve with conditions', date: '2026-07-26' };

const REGISTRY = {
  groups: { builders: {}, 'second-line': {} },
  identities: [
    { id: 'dp-yusuf', kind: 'human', roles: ['data-protection'], groups: ['second-line'] },
    { id: 'risk-lena', kind: 'human', roles: ['risk-second-line'], groups: ['second-line'] },
    { id: 'eng-omar', kind: 'human', roles: ['engineering'], groups: ['builders'] },
    { id: 'both-sam', kind: 'human', roles: ['data-protection', 'risk-second-line'], groups: ['second-line'] },
    { id: 'dp-builder', kind: 'human', roles: ['data-protection'], groups: ['builders'] },
    { id: 'svc-bridge', kind: 'agent', roles: [], groups: ['builders'] },
  ],
};

const FLOOR = ['floor/approvals'];

// --- parsing ------------------------------------------------------------------------------------

test('the sign-off table is found and both rows parsed', () => {
  const p = parseSignoff(record(YUSUF, LENA));
  assert.equal(p.found, true);
  assert.deepEqual(p.rows.map((r) => r.role), REQUIRED_ROLES);
  assert.equal(p.rows[0].identity, 'dp-yusuf');
  assert.equal(p.rows[1].decision, 'approve with conditions');
});

test('parsing stops at the next section — prose after the table is not a row', () => {
  const p = parseSignoff(record(YUSUF, LENA));
  assert.equal(p.rows.length, 2);
});

test('a record with no sign-off rows is reported as such, not as unsigned', () => {
  const p = parseSignoff('# A record\n\n## 4 · Content classes\n\nnothing here\n');
  assert.equal(p.found, false);
  const f = evaluate({ record: '# A record\n\n## 4 · Content\n', registry: REGISTRY, floorArtifacts: FLOOR });
  assert.ok(f.some((x) => /no sign-off rows/.test(x)));
});

test('the sign-off rows are found by ROLE KEY, not by heading text', () => {
  // The shipped worked example heads its table "## 1 · The decision"; the live record heads its
  // "## 11 · Sign-off". Anchoring on the heading would read one and miss the other.
  const underAnyHeading = (h) => `## ${h}\n\n| Role | Name | Registry identity | Decision | Date |\n|---|---|---|---|---|\n| \`data-protection\` | Y | \`dp-yusuf\` | approve | 2026-07-26 |\n| \`risk-second-line\` | L | \`risk-lena\` | approve | 2026-07-26 |\n`;
  for (const h of ['11 · Sign-off', '1 · The decision', 'Anything At All']) {
    assert.equal(parseSignoff(underAnyHeading(h)).rows.length, 2, `heading ${JSON.stringify(h)} must not change parsing`);
  }
});

test('a prose table that merely MENTIONS the roles is not mistaken for a signature', () => {
  // §10's review-cadence table keys its rows on the trigger and names the roles in a later cell.
  const cadence = '| Trigger | Reviewers |\n|---|---|\n| Before each milestone | Data protection + risk-second-line |\n| Annually | data-protection and risk-second-line |\n';
  assert.deepEqual(parseSignoff(cadence).rows, []);
  assert.equal(parseSignoff(cadence).found, false);
});

// --- the ordinary states ------------------------------------------------------------------------

test('a drafted, unsigned record with no floor and nothing compiled is NOT a finding', () => {
  // The blocking statement blocks workspace construction and floor content — not drafting. A gate
  // that went red the moment a record was written would be red for the life of the programme.
  assert.deepEqual(evaluate({ record: record(AWAIT, AWAIT), registry: REGISTRY }), []);
  assert.equal(isSigned(parseSignoff(record(AWAIT, AWAIT))), false);
});

test('no record at all, no floor, nothing compiled — the gate is silent', () => {
  assert.deepEqual(evaluate({}), []);
});

test('a cleanly signed record passes, and approve-with-conditions counts as signed', () => {
  assert.deepEqual(evaluate({ record: record(YUSUF, LENA), registry: REGISTRY, floorArtifacts: FLOOR }), []);
  assert.equal(isSigned(parseSignoff(record(YUSUF, LENA))), true);
});

// --- the blocking statement, enforced -----------------------------------------------------------

test('an unsigned record blocks once a floor is in use', () => {
  const f = evaluate({ record: record(AWAIT, AWAIT), registry: REGISTRY, floorArtifacts: FLOOR });
  assert.equal(f.filter((x) => /AWAITING — unsigned/.test(x)).length, 2);
  assert.ok(f.some((x) => /floor is IN USE/.test(x)));
});

test('an unsigned record blocks once a plan compiles the capability', () => {
  const f = evaluate({ record: record(AWAIT, AWAIT), registry: REGISTRY, required: true });
  assert.equal(f.length, 2);
  assert.ok(f.every((x) => /compiled plan requires/.test(x)));
});

test('a floor in use with NO record at all names the blocking statement', () => {
  const f = evaluate({ registry: REGISTRY, floorArtifacts: FLOOR });
  assert.ok(f.some((x) => /no residency record/.test(x) && /floor is in use/.test(x)));
});

test('HALF a signature is no signature — one signed row does not unblock', () => {
  const f = evaluate({ record: record(YUSUF, AWAIT), registry: REGISTRY, floorArtifacts: FLOOR });
  assert.ok(f.some((x) => /risk-second-line: AWAITING/.test(x)));
  assert.ok(f.some((x) => /floor is IN USE/.test(x)));
  assert.equal(isSigned(parseSignoff(record(YUSUF, AWAIT))), false);
});

// --- an unsound signature is unsound whether or not anyone compiled it --------------------------

test('an AGENT cannot sign — even with no floor and nothing compiled', () => {
  const agent = { ...YUSUF, name: 'Bridge', id: 'svc-bridge' };
  const f = evaluate({ record: record(agent, LENA), registry: REGISTRY });
  assert.ok(f.some((x) => /is an AGENT/.test(x)), 'agents approve nothing, and least of all this');
});

test('a BUILDER cannot sign', () => {
  const builder = { ...YUSUF, name: 'Builder', id: 'dp-builder' };
  const f = evaluate({ record: record(builder, LENA), registry: REGISTRY });
  assert.ok(f.some((x) => /builders group/.test(x)));
});

test('one person cannot hold both signatures', () => {
  const sam = (d) => ({ name: 'Sam', id: 'both-sam', decision: d, date: '2026-07-26' });
  const f = evaluate({ record: record(sam('approve'), sam('approve')), registry: REGISTRY });
  assert.ok(f.some((x) => /signed as both/.test(x)),
    'roles-not-headcount is right almost everywhere in this method and wrong for a four-eyes record');
});

test('a signatory who does not hold the role is refused', () => {
  const omar = { name: 'Omar', id: 'eng-omar', decision: 'approve', date: '2026-07-26' };
  const f = evaluate({ record: record(omar, LENA), registry: REGISTRY });
  assert.ok(f.some((x) => /does not hold the role data-protection/.test(x)));
});

test('an identity that is not in the registry is refused', () => {
  const ghost = { name: 'Ghost', id: 'dp-nobody', decision: 'approve', date: '2026-07-26' };
  const f = evaluate({ record: record(ghost, LENA), registry: REGISTRY });
  assert.ok(f.some((x) => /not in the identity registry/.test(x)));
});

test('a signature with no registry to resolve against is not a signature', () => {
  const f = evaluate({ record: record(YUSUF, LENA), registry: null });
  assert.equal(f.filter((x) => /no identity registry to resolve it against/.test(x)).length, 2);
});

test('a note in the decision cell is not a decision', () => {
  const vague = { ...YUSUF, decision: 'looks fine to me' };
  const f = evaluate({ record: record(vague, LENA), registry: REGISTRY });
  assert.ok(f.some((x) => /is not one of/.test(x)));
});

test('an undated signature is refused — §10 requires re-review and cannot age it', () => {
  const undated = { ...YUSUF, date: 'last week' };
  const f = evaluate({ record: record(undated, LENA), registry: REGISTRY });
  assert.ok(f.some((x) => /not an ISO date/.test(x)));
});

// --- refusal is a signed outcome ----------------------------------------------------------------

test('a REFUSAL is recorded, blocks, and is reported as the gate working', () => {
  const no = { ...YUSUF, decision: 'refuse' };
  const f = evaluate({ record: record(no, LENA), registry: REGISTRY });
  assert.ok(f.some((x) => /REFUSED by dp-yusuf/.test(x)));
  assert.equal(isSigned(parseSignoff(record(no, LENA))), false);
  assert.ok(BLOCKING_VERDICTS.every((v) => VERDICTS.includes(v)), 'a blocking verdict must still be a valid verdict');
});
