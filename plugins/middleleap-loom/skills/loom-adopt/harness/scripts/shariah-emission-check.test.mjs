// Tests for the Shari'ah product-substance gate. Node built-in runner: `node --test`.
//
// Every rule is tested BOTH WAYS — the emission it exists to catch, and the shape that must pass —
// because a rule tested only on its failure is a rule that might fail everything. Two of these
// tests matter more than the rest:
//
//   the INERT test          a repository whose plans never compile `shariah_governance` and which
//                           mounts no surfaces config must see nothing from this file, ever. A
//                           control that fires on somebody it does not govern is how a governance
//                           bundle stops being installable.
//   the FALSE-POSITIVE test a mapping document that cites `InterestRate` in backticks, or the word
//                           "interests" in "in the best interests of the customer", must pass. The
//                           prose backstop is the rule most likely to be switched off in anger.
//
// Worked names are fictional throughout (Alpha Islamic Bank, Meridian Trust).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  CAPABILITY,
  DEFAULT_RULES,
  SHARIA_STRUCTURE_ENUM,
  evaluate,
  globBase,
  mergeRules,
  normalizeKey,
  populated,
  rebateDefect,
  requiringChanges,
  resolveSurfaces,
  run,
  scanProse,
  stripNonProse,
} from './shariah-emission-check.mjs';

/* ── fixtures ─────────────────────────────────────────────────────────────────────────────── */

const doc = (body) => [{ label: 'fixtures/islamic/account.json', doc: body }];
const check = (body, over = {}) => evaluate({ documents: doc(body), ...over });
const has = (findings, rule) => findings.some((f) => f.startsWith(`${rule}:`));
const only = (findings, rule) => findings.length > 0 && findings.every((f) => f.startsWith(`${rule}:`));

/** A structure-conformant Murabaha product, as an adopter would actually write one. */
const MURABAHA = {
  ProductType: 'IslamicPersonalFinance',
  ProductName: 'Alpha Islamic Bank — Murabaha Auto',
  IsShariaCompliant: true,
  ShariaStructure: 'Murabaha',
  ProfitRate: { Type: 'Fixed', Rate: '4.25' },
  Balance: [{ Type: 'Profit', Amount: { Amount: '120.00', Currency: 'AED' } }],
  ibra: { discretionary: true, issc_decision_ref: 'SR-0007' },
};

/** A diminishing Musharaka, the other shape the Standard carries first-class. */
const MUSHARAKA = {
  ProductType: 'IslamicHomeFinance',
  IsShariaCompliant: true,
  ShariaStructure: 'Musharaka',
  OwnershipTransfer: { Type: 'Gradual', BuyoutSchedule: [{ Period: '2026-01', Units: 12 }] },
};

/** A Mudarabah investment account: no enum value exists for it, so it rides the adopter's field. */
const MUDARABAH = {
  ProductType: 'IslamicInvestmentAccount',
  IsShariaCompliant: true,
  deposit_structure: 'Mudarabah',
  ExpectedProfitRate: '3.10',
};

/* ── the shapes that must pass ────────────────────────────────────────────────────────────── */

test('a structure-conformant Murabaha, Musharaka and Mudarabah all pass clean', () => {
  for (const body of [MURABAHA, MUSHARAKA, MUDARABAH]) {
    const { findings, notices } = check(body);
    assert.deepEqual(findings, [], findings.join('\n'));
    assert.deepEqual(notices, [], notices.join('\n'));
  }
});

test('no documents at all is silent — nothing read, nothing said', () => {
  assert.deepEqual(evaluate({}), { findings: [], notices: [] });
});

/* ── SE-R01 — riba in the shape ───────────────────────────────────────────────────────────── */

test('SE-R01: a populated interest-named key inside an IsShariaCompliant:true subtree', () => {
  for (const [key, value] of [['InterestRate', 4.5], ['interest_rate', '4.5'], ['AccruedInterest', { Amount: '3.00' }], ['PastDueInterestAmount', '12']]) {
    const { findings } = check({ ...MURABAHA, [key]: value });
    assert.ok(has(findings, 'SE-R01'), `${key}: ${findings.join('\n')}`);
    assert.match(findings.find((f) => f.startsWith('SE-R01')), /Profit and Rental variants/);
  }
});

test('SE-R01: the two interest CATEGORY values, wherever they sit — including inside arrays', () => {
  const withCategory = { ...MURABAHA, Balance: [{ Type: 'Interest', Amount: { Amount: '9.00' } }] };
  assert.ok(check(withCategory).findings.some((f) => /SE-R01:.*Balance\[0\]\.Type is "Interest"/.test(f)));

  const pastDue = { ...MURABAHA, Transaction: { CreditDebitIndicator: 'PastDueInterest' } };
  assert.ok(check(pastDue).findings.some((f) => /SE-R01:.*Transaction\.CreditDebitIndicator is "PastDueInterest"/.test(f)));
});

test('SE-R01: an interest field present but EMPTY is a notice, not a finding — nothing is charged under it', () => {
  for (const empty of [null, '', 0, false, []]) {
    const { findings, notices } = check({ ...MURABAHA, InterestRate: empty });
    assert.deepEqual(findings, [], `${JSON.stringify(empty)}: ${findings.join('\n')}`);
    assert.equal(notices.length, 1);
    assert.match(notices[0], /present but empty/);
  }
  assert.deepEqual([populated(0), populated(false), populated(''), populated([]), populated({}), populated(null)], [false, false, false, false, false, false]);
  assert.deepEqual([populated(1), populated('x'), populated([1]), populated({ a: 1 })], [true, true, true, true]);
});

test('SE-R01 says nothing about a CONVENTIONAL product in the same file — the subtree is the scope', () => {
  const mixed = { Islamic: MURABAHA, Conventional: { ProductType: 'Savings', IsShariaCompliant: false, InterestRate: 4.5 } };
  const { findings, notices } = check(mixed);
  assert.deepEqual(findings, [], findings.join('\n'));
  assert.deepEqual(notices, []);
});

/* ── SE-R02 — the flag the Standard defaults to FALSE ─────────────────────────────────────── */

test('SE-R02: a product object with IsShariaCompliant absent misstates the product', () => {
  const { IsShariaCompliant, ...silent } = MURABAHA;
  const { findings } = check(silent);
  assert.ok(has(findings, 'SE-R02'), findings.join('\n'));
  assert.match(findings.find((f) => f.startsWith('SE-R02')), /DEFAULTS IT FALSE/);
});

test('SE-R02: an explicit false is a statement and passes; an inherited flag covers nested product nodes', () => {
  const { IsShariaCompliant, ...bare } = MURABAHA;
  assert.deepEqual(check({ ...bare, IsShariaCompliant: false }).findings, []);
  const nested = { IsShariaCompliant: true, Sub: { ProductId: 'P-1' } };
  assert.deepEqual(check(nested).findings, [], 'a declared ancestor states the flag for its subtree');
});

test('SE-R02 does not fire on nodes that are not products', () => {
  assert.deepEqual(check({ Meta: { TotalPages: 1 }, Links: { Self: '/accounts' } }).findings, []);
});

/* ── SE-R03 — the enum is a quotation, never an invention ─────────────────────────────────── */

test('SE-R03: every enum value passes, and the enum is exactly the five the Standard carries', () => {
  assert.deepEqual(SHARIA_STRUCTURE_ENUM, ['Ijara', 'ServiceIjara', 'Murabaha', 'Musharaka', 'Tawarruq']);
  for (const v of SHARIA_STRUCTURE_ENUM) {
    const { findings } = check({ ProductType: 'X', IsShariaCompliant: true, ShariaStructure: v });
    assert.deepEqual(findings, [], `${v}: ${findings.join('\n')}`);
  }
});

test('SE-R03: the DOCUMENTED GAP structures name the gap and route to a spec change', () => {
  for (const v of ['Mudarabah', 'Wakala', 'Istisna', 'Salam']) {
    const { findings } = check({ ProductType: 'X', IsShariaCompliant: true, ShariaStructure: v });
    assert.ok(has(findings, 'SE-R03'), `${v}: ${findings.join('\n')}`);
    const f = findings.find((x) => x.startsWith('SE-R03'));
    assert.match(f, /DOCUMENTED GAP/);
    assert.match(f, /spec change/);
    assert.match(f, /interoperable with nobody/);
  }
});

test('SE-R03: a value that is not a structure at all, and a non-string', () => {
  for (const v of ['Halal', '', 'murabaha', 42, null]) {
    const { findings } = check({ ProductType: 'X', IsShariaCompliant: true, ShariaStructure: v });
    assert.ok(has(findings, 'SE-R03'), `${JSON.stringify(v)}: ${findings.join('\n')}`);
  }
});

/* ── SE-R04 — diminishing ownership with no steps ─────────────────────────────────────────── */

test('SE-R04: Gradual with no BuyoutSchedule, in every empty shape', () => {
  for (const schedule of [undefined, null, [], '', {}]) {
    const body = { ...MUSHARAKA, OwnershipTransfer: { Type: 'Gradual', BuyoutSchedule: schedule } };
    const { findings } = check(body);
    assert.ok(has(findings, 'SE-R04'), `${JSON.stringify(schedule)}: ${findings.join('\n')}`);
  }
});

test('SE-R04: a non-Gradual transfer needs no schedule, and an array of transfers is read', () => {
  assert.deepEqual(check({ ...MUSHARAKA, OwnershipTransfer: { Type: 'Immediate' } }).findings, []);
  const many = { ...MUSHARAKA, OwnershipTransfer: [{ Type: 'Immediate' }, { Type: 'Gradual' }] };
  assert.ok(check(many).findings.some((f) => /SE-R04:.*OwnershipTransfer\[1\]/.test(f)), 'each element is read');
});

/* ── SE-R05 — the rebate that stopped being a discretion ──────────────────────────────────── */

const murabahaWith = (rebate, key = 'ibra') => ({ ...MURABAHA, [key]: rebate });

test('SE-R05: a contractual rebate, in each of the shapes it is written in', () => {
  const cases = [
    [{ contractual: true, amount: '100' }, /contractual: true/],
    [{ guaranteed: true }, /guaranteed: true/],
    [{ discretionary: false }, /discretionary: false/],
    [{ formula: 'outstanding * 0.5' }, /auto-computation/],
    [{ auto_compute: true }, /auto-computation/],
    [{ required: true }, /schema-guaranteed rebate/],
    [{ type: 'object', required: ['amount'] }, /schema-guaranteed amount/],
    [250, /bare amount/],
    ['12.5%', /bare amount/],
    [true, /bare value/],
  ];
  for (const [rebate, re] of cases) {
    const { findings } = check(murabahaWith(rebate));
    assert.ok(has(findings, 'SE-R05'), `${JSON.stringify(rebate)}: ${findings.join('\n')}`);
    assert.match(findings.find((f) => f.startsWith('SE-R05')), re);
  }
});

test('SE-R05: discretion with no approving decision is an assertion; with one, it passes', () => {
  const bare = check(murabahaWith({ discretionary: true })).findings;
  assert.ok(bare.some((f) => /SE-R05:.*names no approving decision/.test(f)), bare.join('\n'));
  for (const ref of [{ issc_decision_ref: 'SR-0007' }, { ruling_ref: 'SR-0007' }, { ApprovalRef: 'SR-0007' }]) {
    assert.deepEqual(check(murabahaWith({ discretionary: true, ...ref })).findings, [], JSON.stringify(ref));
  }
});

test('SE-R05: the rebate key is matched on WORDS — `library` is not an ibra', () => {
  assert.deepEqual(check({ ...MURABAHA, library: { size: 3 } }).findings, [], 'library must not read as ibra');
  for (const key of ['Ibra', 'ibra_amount', 'early_settlement_discount', 'RebatePolicy']) {
    const { findings } = check(murabahaWith(500, key));
    assert.ok(has(findings, 'SE-R05'), `${key}: ${findings.join('\n')}`);
  }
});

test('SE-R05 is scoped to Murabaha — the same field on an Ijara is not this rule\'s business', () => {
  const ijara = { ProductType: 'X', IsShariaCompliant: true, ShariaStructure: 'Ijara', rebate: 250 };
  assert.deepEqual(check(ijara).findings, [], 'SE-R05 rules on Murabaha ibra, not on every discount anywhere');
});

test('SE-R05: the Murabaha scope is INHERITED by descendants', () => {
  const nested = { ...MURABAHA, Settlement: { early_settlement_rebate: { contractual: true } } };
  assert.ok(check(nested).findings.some((f) => /SE-R05:.*Settlement\.early_settlement_rebate/.test(f)));
});

test('rebateDefect returns exactly one reason, and null for the passing shape', () => {
  const rules = mergeRules().rules;
  const refs = [/\b(?:(issc|ruling|decision|approval|fatwa)[_ ]?ref)\b/i];
  assert.equal(rebateDefect(null, rules, refs), null, 'nothing represented is nothing to refuse');
  assert.equal(rebateDefect({ discretionary: true, issc_decision_ref: 'SR-1' }, rules, refs), null);
  assert.match(rebateDefect({ contractual: true }, rules, refs), /contractual/);
});

/* ── SE-R06 — the guarantee on a participatory structure ──────────────────────────────────── */

test('SE-R06: a guaranteed return on a Mudarabah or Wakala structure', () => {
  const cases = [
    { GuaranteedReturn: '3.10' },
    { guaranteed_profit_rate: '3.10' },
    { return_basis: 'guaranteed' },
    { ReturnBasis: 'Guaranteed' },
  ];
  for (const over of cases) {
    const { findings } = check({ ...MUDARABAH, ...over });
    assert.ok(has(findings, 'SE-R06'), `${JSON.stringify(over)}: ${findings.join('\n')}`);
    assert.match(findings.find((f) => f.startsWith('SE-R06')), /EXPECTED, never guaranteed/);
  }
  const wakala = { ProductType: 'X', IsShariaCompliant: true, product_structure: 'Wakala', GuaranteedRate: '2.9' };
  assert.ok(has(check(wakala).findings, 'SE-R06'));
});

test('SE-R06: an expected rate is the permitted shape and passes', () => {
  for (const key of ['ExpectedProfitRate', 'expected_return_rate', 'ExpectedRate']) {
    const { ExpectedProfitRate, ...bare } = MUDARABAH;
    const { findings, notices } = check({ ...bare, [key]: '3.10' });
    assert.deepEqual(findings, [], `${key}: ${findings.join('\n')}`);
    assert.deepEqual(notices, []);
  }
});

test('SE-R06: a participatory node stating NO rate at all is a notice — unchecked, not clean', () => {
  const { ExpectedProfitRate, ...bare } = MUDARABAH;
  const { findings, notices } = check(bare);
  assert.deepEqual(findings, []);
  assert.equal(notices.length, 1);
  assert.match(notices[0], /neither a guaranteed nor an expected rate/);
});

test('SE-R06 does not fire on a non-participatory product carrying a guaranteed rate', () => {
  // A conventional deposit is not this gate's business; only the declared participatory structures are.
  const conventional = { ProductType: 'Savings', IsShariaCompliant: false, GuaranteedRate: '3.0' };
  assert.deepEqual(check(conventional).findings, []);
});

/* ── SE-R07 — the prose backstop ──────────────────────────────────────────────────────────── */

const prose = (text, label = 'docs/products/islamic/summary.md') => evaluate({ prose: [{ label, text }] });

test('SE-R07: interest and APR terminology in customer-facing prose', () => {
  for (const line of [
    'Your account earns interest every month.',
    'The interest rate is reviewed quarterly.',
    'Representative APR 4.9%.',
    'This is an interest-bearing account.',
    'The annual percentage rate applies from day one.',
  ]) {
    const { findings } = prose(line);
    assert.ok(has(findings, 'SE-R07'), `${line}: ${findings.join('\n')}`);
    assert.match(findings[0], /summary\.md:1/);
  }
});

test('SE-R07: the profit and rental vocabulary passes', () => {
  const clean = 'Your account earns an expected profit rate, distributed monthly. Rental is payable under the Ijara.';
  assert.deepEqual(prose(clean).findings, []);
});

test('SE-R07: a mapping document citing the Standard\'s own field names is NOT a finding', () => {
  const mapping = [
    'The conventional `InterestRate` field maps to `ProfitRate` on Islamic products.',
    'We never emit InterestRate or PastDueInterest on these accounts.',
    'See https://example.invalid/specs/interest-rates for the conventional model.',
    'The `interest_rate` column is not populated.',
    '```json',
    '{ "InterestRate": 4.5 }',
    '```',
  ].join('\n');
  assert.deepEqual(prose(mapping).findings, [], 'a document mapping AWAY from interest must not be failed for saying so');
});

test('SE-R07: "in the best interests of the customer" is not an interest rate', () => {
  for (const line of ['We act in the best interests of the customer.', 'Any conflict of interest is disclosed.', 'Renewals begin in Apr 2026.']) {
    assert.deepEqual(prose(line).findings, [], line);
  }
});

test('SE-R07: one occurrence per line, reported as the longest term that matched', () => {
  const { findings } = prose('The interest rate and the interest are the same thing.');
  assert.equal(findings.length, 1);
  assert.match(findings[0], /says "interest rate"/);
});

test('stripNonProse removes code, identifiers and URLs while preserving line numbers', () => {
  const lines = stripNonProse('a `InterestRate` b\n```\nInterest\n```\nInterestRate isShariaCompliant interest_rate https://x/interest\nplain interest');
  assert.equal(lines.length, 6);
  assert.equal(lines[1], '', 'fence lines are blanked');
  assert.equal(lines[2], '', 'fenced content is blanked');
  assert.ok(!/Interest/i.test(lines[0]) && !/Interest/i.test(lines[4]), lines.join('|'));
  assert.match(lines[5], /interest/);
});

test('scanProse is silent on an empty set', () => {
  assert.deepEqual(scanProse([]), []);
  assert.deepEqual(scanProse(), []);
});

/* ── rules: extension is data, and it may only WIDEN ──────────────────────────────────────── */

test('a declared rule EXTENDS the shipped floor and cannot narrow it', () => {
  const { rules, findings } = mergeRules({ participatory_values: ['sukuk-linked'] });
  assert.deepEqual(findings, []);
  assert.ok(rules.participatory_values.includes('sukuk-linked'));
  for (const shipped of DEFAULT_RULES.participatory_values) assert.ok(rules.participatory_values.includes(shipped), `${shipped} survived`);
});

test('an adopter-declared participatory value and rebate key are honoured end to end', () => {
  const body = { ProductType: 'X', IsShariaCompliant: true, account_structure: 'Qard-Investment', GuaranteedReturn: '2.0' };
  assert.deepEqual(check(body).findings, [], 'unknown structure: silent by default');
  const { findings } = check(body, { rules: { participatory_values: ['qard-investment'] } });
  assert.ok(has(findings, 'SE-R06'), findings.join('\n'));
});

test('a mistyped rule name is refused, never silently ignored', () => {
  const { findings } = mergeRules({ participatory_value: ['mudarabah'] });
  assert.equal(findings.length, 1);
  assert.match(findings[0], /SE-R00: rules\.participatory_value is not a rule this gate reads/);
});

test('a rules block that is not an object, and a rule that is not a list of strings', () => {
  assert.match(mergeRules('all of them').findings[0], /must be an object of pattern lists/);
  assert.match(mergeRules({ murabaha_values: 'murabaha' }).findings[0], /must be an array of strings/);
});

test('an uncompilable pattern is a finding — an uncompilable rule checks nothing', () => {
  const { findings } = check(MURABAHA, { rules: { rebate_key_patterns: ['ibra(' ] } });
  assert.ok(findings.some((f) => /SE-R00: rules\.rebate_key_patterns contains "ibra\(", which is not a valid pattern/.test(f)), findings.join('\n'));
});

test('normalizeKey reads a key as words, whatever the casing convention', () => {
  assert.equal(normalizeKey('IsShariaCompliant'), 'is sharia compliant');
  assert.equal(normalizeKey('early_settlement-rebate'), 'early settlement rebate');
  assert.equal(normalizeKey('library'), 'library');
});

/* ── resolving the declared surfaces ──────────────────────────────────────────────────────── */

const tmp = () => mkdtempSync(join(tmpdir(), 'shariah-emission-'));
const clean = (d) => rmSync(d, { recursive: true, force: true });
const put = (dir, rel, body) => {
  const p = join(dir, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, typeof body === 'string' ? body : JSON.stringify(body));
};

test('globBase stops at the first wildcard, so `**` never means "read the repository"', () => {
  assert.equal(globBase('tests/fixtures/islamic/**/*.json'), 'tests/fixtures/islamic');
  assert.equal(globBase('specs/accounts.json'), 'specs/accounts.json');
  assert.equal(globBase('**/*.json'), '');
});

test('resolveSurfaces reads globs, spec files, prose roots — and refuses a path outside the repo', () => {
  const dir = tmp();
  try {
    put(dir, 'tests/fixtures/islamic/account.json', MURABAHA);
    put(dir, 'tests/fixtures/islamic/deep/other.json', MUDARABAH);
    put(dir, 'tests/fixtures/conventional/savings.json', { InterestRate: 4.5 });
    put(dir, 'specs/accounts.json', MUSHARAKA);
    put(dir, 'docs/products/islamic/summary.md', 'Profit, not interest-bearing.');
    put(dir, 'docs/products/islamic/logo.png', 'not prose');
    const r = resolveSurfaces(dir, {
      fixture_globs: ['tests/fixtures/islamic/**/*.json', 'tests/fixtures/none/*.json'],
      spec_paths: ['specs/accounts.json'],
      content_roots: ['docs/products/islamic'],
    });
    assert.deepEqual(r.documents.map((d) => d.label).sort(), ['specs/accounts.json', 'tests/fixtures/islamic/account.json', 'tests/fixtures/islamic/deep/other.json']);
    assert.deepEqual(r.prose.map((p) => p.label), ['docs/products/islamic/summary.md']);
    assert.deepEqual(r.findings, []);
    assert.equal(r.notices.length, 1);
    assert.match(r.notices[0], /matched no files/);

    const outside = resolveSurfaces(dir, { spec_paths: ['../elsewhere/spec.json'], content_roots: ['/etc'] });
    assert.equal(outside.findings.length, 2);
    for (const f of outside.findings) assert.match(f, /points outside the repository/);
  } finally { clean(dir); }
});

test('resolveSurfaces: a declared path that does not exist is a FINDING; unreadable JSON is too', () => {
  const dir = tmp();
  try {
    put(dir, 'specs/broken.json', '{ not json');
    const r = resolveSurfaces(dir, { spec_paths: ['specs/broken.json', 'specs/missing.json'], content_roots: ['docs/gone'] });
    assert.ok(r.findings.some((f) => /specs\/broken\.json is not readable JSON/.test(f)), r.findings.join('\n'));
    assert.ok(r.findings.some((f) => /spec_paths declares "specs\/missing\.json" and it does not exist/.test(f)));
    assert.ok(r.findings.some((f) => /content_roots declares "docs\/gone" and it does not exist/.test(f)));
  } finally { clean(dir); }
});

test('resolveSurfaces: a YAML spec is UNREAD here, not clean — and it says so', () => {
  const dir = tmp();
  try {
    put(dir, 'specs/accounts.yaml', 'openapi: 3.0.0');
    const r = resolveSurfaces(dir, { spec_paths: ['specs'] });
    assert.deepEqual(r.documents, []);
    assert.equal(r.notices.length, 1);
    assert.match(r.notices[0], /parses JSON only, so that spec is UNREAD here, not clean/);
  } finally { clean(dir); }
});

/* ── run(): mandatory-when-compiled, end to end off a real tree ───────────────────────────── */

function repo({ requires = true, config = null, state = 'in-delivery' } = {}) {
  const dir = tmp();
  const base = 'docs/governance/changes/CHG-ALPHA-0011';
  put(dir, `${base}/change-envelope.json`, { change_id: 'CHG-ALPHA-0011', current_state: state, control_plan: 'control-plan.json' });
  put(dir, `${base}/control-plan.json`, {
    required_gates: [], required_evidence: [],
    required_capabilities: requires ? { [CAPABILITY]: { required: true } } : {},
  });
  if (config) put(dir, 'docs/governance/shariah-surfaces.json', config);
  return dir;
}

test('run() is INERT for an adopter whose plans never compile the capability and who declares no surfaces', () => {
  const dir = repo({ requires: false });
  try {
    put(dir, 'tests/fixtures/x.json', { InterestRate: 4.5, IsShariaCompliant: true });
    const r = run(dir);
    assert.equal(r.inert, true);
    assert.equal(r.required, false);
    assert.deepEqual(r.findings, [], 'a generic adopter must never be failed by a Shari\'ah control');
    assert.deepEqual(r.notices, []);
  } finally { clean(dir); }
});

test('run() stays inert for a change requiring some OTHER capability', () => {
  const dir = tmp();
  try {
    const base = 'docs/governance/changes/CHG-MERIDIAN-0002';
    put(dir, `${base}/change-envelope.json`, { change_id: 'CHG-MERIDIAN-0002', current_state: 'in-delivery', control_plan: 'control-plan.json' });
    put(dir, `${base}/control-plan.json`, { required_capabilities: { exposure_control: { required: true } } });
    assert.equal(run(dir).inert, true);
  } finally { clean(dir); }
});

test('run() FAILS, naming the change, once a plan compiles the capability and no config is mounted', () => {
  const dir = repo();
  try {
    const r = run(dir);
    assert.equal(r.inert, false);
    assert.equal(r.required, true);
    assert.equal(r.present, false);
    assert.equal(r.findings.length, 1);
    assert.match(r.findings[0], /SE-R00: a compiled plan requires the shariah_governance capability \[CHG-ALPHA-0011\]/);
    assert.match(r.findings[0], /docs\/governance\/shariah-surfaces\.json/);
  } finally { clean(dir); }
});

test('run() passes on a declared, conformant tree', () => {
  const dir = repo({ config: { fixture_globs: ['tests/fixtures/islamic/**/*.json'], content_roots: ['docs/products/islamic'] } });
  try {
    put(dir, 'tests/fixtures/islamic/murabaha.json', MURABAHA);
    put(dir, 'docs/products/islamic/summary.md', 'You pay a profit rate, fixed for the term.');
    const r = run(dir);
    assert.deepEqual(r.findings, [], r.findings.join('\n'));
    assert.deepEqual(r.notices, []);
    assert.equal(r.documents, 1);
    assert.equal(r.prose, 1);
  } finally { clean(dir); }
});

test('run() catches the emission end to end, in the fixture and in the copy', () => {
  const dir = repo({ config: { fixture_globs: ['tests/fixtures/islamic/**/*.json'], content_roots: ['docs/products/islamic'] } });
  try {
    put(dir, 'tests/fixtures/islamic/murabaha.json', { ...MURABAHA, InterestRate: 4.5, ibra: { contractual: true } });
    put(dir, 'docs/products/islamic/summary.md', 'Your interest rate is fixed for the term.');
    const r = run(dir);
    for (const rule of ['SE-R01', 'SE-R05', 'SE-R07']) assert.ok(has(r.findings, rule), `${rule}: ${r.findings.join('\n')}`);
  } finally { clean(dir); }
});

test('run() evaluates a mounted config even where no plan compiles the capability — the adopter declared it', () => {
  const dir = repo({ requires: false, config: { fixture_globs: ['tests/fixtures/islamic/*.json'] } });
  try {
    put(dir, 'tests/fixtures/islamic/murabaha.json', { ...MURABAHA, ShariaStructure: 'Wakala' });
    const r = run(dir);
    assert.equal(r.inert, false);
    assert.equal(r.required, false);
    assert.ok(only(r.findings, 'SE-R03'), r.findings.join('\n'));
  } finally { clean(dir); }
});

test('run() refuses an unreadable surfaces config', () => {
  const dir = repo();
  try {
    put(dir, 'docs/governance/shariah-surfaces.json', '{ not json');
    const r = run(dir);
    assert.equal(r.findings.length, 1);
    assert.match(r.findings[0], /is not valid JSON — an unreadable surfaces declaration is an absent one/);
  } finally { clean(dir); }
});

test('run() honours a config `rules` block', () => {
  const dir = repo({ config: { fixture_globs: ['tests/fixtures/islamic/*.json'], rules: { participatory_values: ['qard-investment'] } } });
  try {
    put(dir, 'tests/fixtures/islamic/qard.json', { ProductType: 'X', IsShariaCompliant: true, account_structure: 'Qard-Investment', GuaranteedReturn: '2.0' });
    assert.ok(has(run(dir).findings, 'SE-R06'), 'the declared value is read from the mounted config');
  } finally { clean(dir); }
});

test('requiringChanges names only the changes that asked for the capability', () => {
  const agg = { changes: [
    { change_id: 'CHG-ALPHA-0011', capabilities: { [CAPABILITY]: { required: true } } },
    { change_id: 'CHG-MERIDIAN-0002', capabilities: { exposure_control: { required: true } } },
  ] };
  assert.deepEqual(requiringChanges(agg), ['CHG-ALPHA-0011']);
});
