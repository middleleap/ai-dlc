// The product-substance gate (Loom 2.0-rc.46 · Shari'ah workstream) — control SHARIAH-SUBSTANCE,
// and the SECOND reader of the `shariah_governance` capability. shariah-governance-check reads the
// GOVERNANCE records: who sits on the committee, what they decided, whether a structure in the
// engineering tree cites a live decision. Every one of those can be immaculate while the product
// the code actually emits is a conventional one wearing an Islamic label. This gate reads the other
// end: the data contracts and fixtures, where the structure stops being a claim and becomes bytes.
//
// It exists because that is where the failure is silent. Nobody writes `riba: true`. What happens
// is an Islamic account inheriting a conventional balance model and shipping an `InterestRate`
// nobody looked at; a product object with no `IsShariaCompliant` at all, which the Standard DEFAULTS
// TO FALSE, so silence misstates the product to every downstream reader; a Mudarabah deposit
// modelled with a guaranteed rate because the conventional savings fixture was the nearest thing to
// copy. Each of those is a one-line diff, reviewed by people reading governance JSON in another
// directory, and none of them trips a governance control.
//
// WHAT IT RULES ON: NOTHING. This gate makes NO Shari'ah determination and must never appear to.
// It checks that data conforms to structures ALREADY APPROVED by the Shari'ah committee and to an
// enum the published Standard already fixes. SCHOLARS DECIDE SHARI'AH. Whether a Murabaha is
// genuine, whether an ownership sequence is real, whether a rebate may be granted at all — those
// are the committee's, and a version of this gate that appeared to answer them would be a defect.
// The most this plane ever claims is STRUCTURE-CONFORMANT, never "Shari'ah-compliant".
//
// AND IT READS FILES, NOT PRODUCTION. It parses JSON fixtures and specs in the repository. It never
// watches a ledger, never sees a posted transaction, and cannot tell a fixture that reflects the
// running system from one that reflects an intention. A surface nobody declared is UNCHECKED here,
// not clean; a YAML spec is UNREAD here, not clean.
//
// The surfaces are ADOPTER-DECLARED, in docs/governance/shariah-surfaces.json:
//
//   { "fixture_globs": ["tests/fixtures/islamic/**/*.json"],
//     "spec_paths":    ["specs/accounts.json"],
//     "content_roots": ["docs/products/islamic"],
//     "rules":         { … extensions to the shipped patterns … } }
//
// Declaring them is the institution's act, not the harness's guess: no generic heuristic can tell
// an Islamic fixture tree from a conventional one, and a gate that guessed would either miss the
// tree that matters or fail a bank that has no Islamic product at all.
//
// WHAT IT REFUSES, in the order each one ends badly:
//
//   SE-R00  a compiled plan requires `shariah_governance` and no surfaces config is mounted — the
//           route says an Islamic product is in flight and nothing says where its data lives
//   SE-R01  RIBA IN THE SHAPE. Inside a subtree declaring IsShariaCompliant:true, a populated key
//           matching /Interest/ or a category value Interest/PastDueInterest. The permitted shapes
//           are the Profit and Rental variants the Standard already carries
//   SE-R02  a product object with IsShariaCompliant ABSENT. The Standard defaults it FALSE, so an
//           unstated flag is not a neutral omission — it is an assertion, and the wrong one
//   SE-R03  a ShariaStructure outside the enum {Ijara, ServiceIjara, Murabaha, Musharaka, Tawarruq}.
//           Mudarabah, Wakala, Istisna and Salam are a DOCUMENTED GAP in the published Standard, not
//           an oversight in this file: THE GATE NEVER INVENTS AN ENUM VALUE, and the route for a
//           structure the enum cannot express is a spec change, not a local extension
//   SE-R04  OwnershipTransfer.Type "Gradual" with no BuyoutSchedule — diminishing ownership whose
//           steps nobody wrote down is gharar in the one place the Standard gives you to remove it
//   SE-R05  a CONTRACTUAL rebate (ibra') on a Murabaha. Early-settlement rebate is the committee's
//           DISCRETION; written as a contractual term, an auto-computed formula or a schema-
//           guaranteed amount, it becomes a term of the contract — which is the discretion abolished
//   SE-R06  a GUARANTEED return on a participatory (Mudarabah/Wakala) deposit structure. Those
//           returns are EXPECTED, never guaranteed; a guarantee turns an investment account into a
//           deposit with a fixed return, which is the substance the structure exists not to have
//   SE-R07  interest/APR terminology in declared customer-facing PROSE. A CI backstop for the
//           pre-write hook, which is the fast path; this is what catches the write that bypassed it
//
// R05/R06 (and the rest) match on PATTERNS shipped here and EXTENDED by the config's `rules` block.
// Extension is data, never a fork. A declared list is UNIONED with the shipped one and can only
// widen it: a config that could narrow a control would be an exception the adopter granted
// themselves, and exceptions live in the exception register where somebody signs for them.
//
// MANDATORY-WHEN-COMPILED. INERT — nothing read, nothing said — for any repository whose plans do
// not compile `shariah_governance` and which mounts no config. A conventional adopter must never
// be failed by a Shari'ah control, and this gate ships in the same bundle they install.
//
// Lane: pr. Run from the repo root: `node scripts/shariah-emission-check.mjs` (exit 1 on a finding).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { aggregateRequirements, capabilityRequired } from '../core/compiled-requirements.mjs';
import { globMatch } from '../core/change-patterns.mjs';

export const CAPABILITY = 'shariah_governance';
export const CONFIG_LOCATIONS = ['docs/governance/shariah-surfaces.json', 'shariah-surfaces.json'];

/**
 * The enum EXACTLY as the published Open Finance Standard fixes it. This list is a QUOTATION, not a
 * design choice, and nothing in this repository may add to it: the moment a harness invents a sixth
 * value, two institutions emit different bytes for the same structure and the enum has stopped
 * being an interoperability contract. A structure it cannot express routes to a spec change.
 */
export const SHARIA_STRUCTURE_ENUM = ['Ijara', 'ServiceIjara', 'Murabaha', 'Musharaka', 'Tawarruq'];
/** Structures the Standard does not yet carry — named so SE-R03 can say WHY, rather than "invalid". */
export const DOCUMENTED_ENUM_GAP = ['Mudarabah', 'Mudaraba', 'Wakala', 'Wakalah', 'Istisna', "Istisna'a", 'Salam'];
/** Directories no surface scan ever descends into, whatever a glob says. */
export const SKIP_DIRS = new Set(['node_modules', '.git']);

/**
 * The shipped patterns. Every array here is a FLOOR: the config may add to it and may not remove
 * from it (see mergeRules). Scalars are matched case-insensitively unless the comment says otherwise.
 */
export const DEFAULT_RULES = {
  // SE-R01 — the two category values the Standard uses for interest, and the key shape.
  interest_values: ['Interest', 'PastDueInterest'],
  interest_key_patterns: ['interest'],
  // SE-R02 — what makes an object a PRODUCT rather than an arbitrary node.
  product_marker_keys: ['ProductType', 'ProductSubType', 'ProductId', 'ProductName', 'ProductIdentifier', 'product_type', 'product_id'],
  // SE-R05/R06 — where an adopter records the structure, since only ShariaStructure is standardised.
  structure_fields: ['ShariaStructure', 'structure', 'structure_type', 'product_structure', 'deposit_structure', 'account_structure', 'contract_type', 'contract', 'islamic_structure'],
  murabaha_values: ['murabaha'],
  // The participatory deposit structures. SE-R03 proves they CANNOT ride ShariaStructure — the enum
  // has no value for them — so they are matched on the adopter's own fields, which is why this list
  // is the one an adopter most often extends.
  participatory_values: ['mudarabah', 'mudaraba', 'wakala', 'wakalah'],
  // SE-R05 — the rebate itself, the marks that make it contractual, and the shape that passes.
  rebate_key_patterns: ['ibra', 'rebate', 'early[_ -]?settlement[_ -]?(discount|benefit|rebate)'],
  rebate_formula_keys: ['formula', 'auto_compute', 'auto_computed', 'computation', 'calculation_formula', 'calculation'],
  rebate_amount_keys: ['amount', 'value', 'rate', 'percentage'],
  rebate_decision_ref_patterns: ['(issc|ruling|decision|approval|fatwa)[_ ]?ref'],
  // SE-R06 — the guarantee, and the expectation that is the permitted shape.
  guaranteed_return_key_patterns: ['guaranteed[_ ]?(return|profit|rate)'],
  return_basis_keys: ['return_basis', 'ReturnBasis', 'profit_basis', 'ProfitBasis'],
  guaranteed_return_values: ['guaranteed'],
  expected_return_key_patterns: ['expected[_ ]?(return|profit|rate)'],
  // SE-R07 — prose. An ALL-CAPS term is matched case-sensitively so "Apr 2026" is not an APR.
  prose_terms: ['interest', 'interest rate', 'interest-bearing', 'accrued interest', 'compound interest', 'APR', 'APY', 'annual percentage rate'],
  prose_allow_phrases: ['in the interest of', 'in the best interest', 'in the best interests', 'best interests of', 'interests of the customer', 'conflict of interest', 'conflicts of interest', 'vested interest', 'interest group'],
  prose_extensions: ['.md', '.mdx', '.txt'],
};

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const firstPath = (locs, cwd) => locs.map((p) => join(cwd, p)).find(existsSync) || null;
const lower = (v) => (typeof v === 'string' ? v.toLowerCase() : '');

/**
 * Populated, for SE-R01. A key that is PRESENT and EMPTY is a modelling smell, not riba: the field
 * carries nothing, so nothing was charged under it. It is reported as a notice rather than failed,
 * and the distinction is deliberate — `false`, `0`, `null` and `""` are the four ways a conventional
 * model leaves its interest field behind when a product is copied.
 */
export const populated = (v) => {
  if (v === null || v === undefined || v === false) return false;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return true;
};

/**
 * Shipped patterns UNIONED with the adopter's. Widening only — see the header. An unknown key in
 * `rules` is a FINDING and not a silent no-op: a typo in a rule name would otherwise read as a
 * configured control while configuring nothing, which is the worst outcome available here.
 */
export function mergeRules(overrides = null) {
  const findings = [];
  const rules = {};
  for (const [k, v] of Object.entries(DEFAULT_RULES)) rules[k] = [...v];
  if (overrides === null || overrides === undefined) return { rules, findings };
  if (!isObject(overrides)) {
    findings.push('SE-R00: `rules` must be an object of pattern lists — a rules block that is not one configures nothing while looking configured');
    return { rules, findings };
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (!Object.hasOwn(rules, k)) {
      findings.push(`SE-R00: rules.${k} is not a rule this gate reads — a mistyped rule name silently configures nothing, so it is refused rather than ignored (known: ${Object.keys(DEFAULT_RULES).join(', ')})`);
      continue;
    }
    if (!Array.isArray(v) || v.some((s) => typeof s !== 'string')) {
      findings.push(`SE-R00: rules.${k} must be an array of strings`);
      continue;
    }
    // Union, never replace. The shipped floor stays in the set whatever the config says.
    rules[k] = [...new Set([...rules[k], ...v])];
  }
  return { rules, findings };
}

/**
 * A key reduced to space-separated words: `IbraPolicy`, `ibra_policy` and `ibra-policy` all become
 * `ibra policy`. Two reasons. Patterns then match on WORDS — /ibra/ against the raw key would fire
 * on `library`, and an adopter who found that out would (rightly) stop trusting the gate. And a
 * shipped key name covers the casing conventions an adopter actually uses without them declaring
 * three spellings of it. The Standard's OWN keys (IsShariaCompliant, ShariaStructure,
 * OwnershipTransfer, BuyoutSchedule) are matched EXACTLY everywhere — those are a quotation.
 */
export const normalizeKey = (k) => String(k)
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_\-.]+/g, ' ')
  .toLowerCase()
  .trim();

/** Compile a pattern list to word-anchored, case-insensitive RegExps. A bad pattern is a finding. */
function compile(patterns, label, findings) {
  const out = [];
  for (const p of patterns) {
    try { out.push(new RegExp(`\\b(?:${p})\\b`, 'i')); }
    catch (e) { findings.push(`SE-R00: rules.${label} contains ${JSON.stringify(p)}, which is not a valid pattern (${e.message}) — an uncompilable rule checks nothing`); }
  }
  return out;
}
/** Does any pattern match this key, read as words? */
const keyMatches = (regexes, key) => { const n = normalizeKey(key); return regexes.some((r) => r.test(n)); };
/** The object's own key equal (as words) to one of `names`, or undefined. */
const findKey = (node, names, keep = () => true) => {
  const wanted = new Set(names.map(normalizeKey));
  return Object.keys(node).find((k) => wanted.has(normalizeKey(k)) && keep(node[k]));
};

/**
 * Does this object declare ANY of the structure fields with a value naming `needles`? Every
 * declared field is read, not the first one found: an object carrying both `contract_type` and
 * `product_structure` would otherwise have its structure decided by JSON key order.
 */
function structureIs(node, rules, needles) {
  const wanted = new Set(rules.structure_fields.map(normalizeKey));
  return Object.entries(node).some(([k, v]) =>
    wanted.has(normalizeKey(k)) && typeof v === 'string' && needles.some((n) => lower(v).includes(n)));
}

/**
 * SE-R05 — how a rebate is represented, reduced to one reason or null.
 *
 * The DEFECT: ibra' is an act of the Shari'ah committee's discretion at the moment of early
 * settlement. Written into the contract — as a flag, a formula, or a schema that guarantees an
 * amount — it stops being discretion and becomes a term the customer is owed, which is exactly the
 * determination this harness may not make on the committee's behalf. The passing shape is
 * `{ discretionary: true, issc_decision_ref: "SR-…" }`: discretion, plus the decision that granted it.
 */
export function rebateDefect(value, rules, refPatterns) {
  if (value === null || value === undefined || value === false) return null; // nothing represented
  if (!isObject(value)) {
    return typeof value === 'number' || /^-?\d+(\.\d+)?%?$/.test(String(value).trim())
      ? 'it is a bare amount — an amount the schema guarantees is a term of the contract, not a discretion exercised'
      : 'it is a bare value, not a declared representation — the passing shape is an object declaring `discretionary: true` and the decision that granted it';
  }
  if (value.contractual === true) return 'it declares `contractual: true`';
  if (value.guaranteed === true) return 'it declares `guaranteed: true`';
  if (value.discretionary === false) return 'it declares `discretionary: false`';
  const formula = findKey(value, rules.rebate_formula_keys, populated);
  if (formula) return `it carries \`${formula}\`, an auto-computation — a rebate a system computes on its own is a rebate nobody decided`;
  if (value.required === true) return 'it declares `required: true` — a schema-guaranteed rebate';
  if (Array.isArray(value.required)) {
    const wanted = new Set(rules.rebate_amount_keys.map(normalizeKey));
    if (value.required.some((r) => wanted.has(normalizeKey(r)))) return `its schema requires ${JSON.stringify(value.required)} — a schema-guaranteed amount`;
  }
  if (value.discretionary !== true) return 'it does not declare `discretionary: true`';
  // ONE reason per rebate, so the caller names the path once. The last one is the shape that is
  // right in every respect but traceability, which is the near-miss most likely to be shipped.
  if (!Object.keys(value).some((k) => keyMatches(refPatterns, k) && populated(value[k]))) {
    return 'it declares discretion but names no approving decision — a discretion nobody can trace to the committee that exercised it is an assertion';
  }
  return null;
}

/**
 * Findings and notices over already-parsed surfaces.
 *
 * `documents` is [{ label, doc }] — the fixtures and specs the config declared, parsed. `prose` is
 * [{ label, text }] — the declared content roots' files. Both are passed in so this function is
 * pure: the tests exercise every rule without a filesystem, and run() does the reading.
 */
export function evaluate({ documents = [], prose = [], rules: overrides = null } = {}) {
  const { rules, findings } = mergeRules(overrides);
  const notices = [];
  const interestKeys = compile(rules.interest_key_patterns, 'interest_key_patterns', findings);
  const rebateKeys = compile(rules.rebate_key_patterns, 'rebate_key_patterns', findings);
  const refPatterns = compile(rules.rebate_decision_ref_patterns, 'rebate_decision_ref_patterns', findings);
  const guaranteedKeys = compile(rules.guaranteed_return_key_patterns, 'guaranteed_return_key_patterns', findings);
  const expectedKeys = compile(rules.expected_return_key_patterns, 'expected_return_key_patterns', findings);
  const interestValues = new Set(rules.interest_values);
  const enumSet = new Set(SHARIA_STRUCTURE_ENUM);

  for (const { label, doc } of documents) {
    const at = (path) => `${label}${path ? ` → ${path}` : ''}`;

    const walk = (node, path, key, ctx) => {
      if (typeof node === 'string') {
        // SE-R01 (values). Reached through arrays too, which is where category enums actually sit.
        if (ctx.islamic && interestValues.has(node)) {
          findings.push(`SE-R01: ${at(path)} is ${JSON.stringify(node)} inside a subtree declaring IsShariaCompliant:true — an interest category on a Shari'ah-compliant product is riba in the shape of the data. The permitted categories on these products are the Profit and Rental variants`);
        }
        return;
      }
      if (Array.isArray(node)) { node.forEach((v, i) => walk(v, `${path}[${i}]`, key, ctx)); return; }
      if (!isObject(node)) return;

      const next = {
        islamic: ctx.islamic || node.IsShariaCompliant === true,
        flagged: ctx.flagged || Object.hasOwn(node, 'IsShariaCompliant'),
        murabaha: ctx.murabaha || structureIs(node, rules, rules.murabaha_values),
        participatory: ctx.participatory || structureIs(node, rules, rules.participatory_values),
      };

      /* ── SE-R01 — keys, inside the Islamic subtree ────────────────────────────────────── */
      if (next.islamic) {
        for (const [k, v] of Object.entries(node)) {
          if (!keyMatches(interestKeys, k)) continue;
          const where = `${at(path ? `${path}.${k}` : k)}`;
          if (populated(v)) {
            findings.push(`SE-R01: ${where} carries ${JSON.stringify(v)} inside a subtree declaring IsShariaCompliant:true — an interest-named field with a value in it is the conventional model that was copied, still charging. The permitted shapes are the Profit and Rental variants`);
          } else {
            notices.push(`${where} is an interest-named field on a Shari'ah-compliant subtree, present but empty (${JSON.stringify(v)}) — nothing is charged under it, and it should not be modelled here at all`);
          }
        }
      }

      /* ── SE-R02 — the flag the Standard defaults to FALSE ─────────────────────────────── */
      const isProduct = Boolean(findKey(node, rules.product_marker_keys)) || Object.hasOwn(node, 'ShariaStructure');
      if (isProduct && !next.flagged) {
        findings.push(`SE-R02: ${at(path)} is a product object on a declared Islamic surface with no IsShariaCompliant — the Standard DEFAULTS IT FALSE, so an absent flag is not silence, it is an assertion that this product is conventional, made to every downstream reader. State it, either way`);
      }

      /* ── SE-R03 — the enum is a quotation ─────────────────────────────────────────────── */
      if (Object.hasOwn(node, 'ShariaStructure')) {
        const v = node.ShariaStructure;
        const where = at(path ? `${path}.ShariaStructure` : 'ShariaStructure');
        if (typeof v !== 'string' || !enumSet.has(v)) {
          const gap = typeof v === 'string' && DOCUMENTED_ENUM_GAP.some((g) => g.toLowerCase() === v.toLowerCase());
          findings.push(gap
            ? `SE-R03: ${where} is ${JSON.stringify(v)}, which the Standard's ShariaStructure enum does not carry. This is a DOCUMENTED GAP in the published Standard (${DOCUMENTED_ENUM_GAP.join(', ')} have no enum value), not a value to add locally — a locally invented enum value is interoperable with nobody. Route it as a spec change and model the structure in your own field until the Standard carries it. The enum is exactly {${SHARIA_STRUCTURE_ENUM.join(', ')}}`
            : `SE-R03: ${where} is ${JSON.stringify(v)}, which is not one of {${SHARIA_STRUCTURE_ENUM.join(', ')}} — this gate never invents an enum value, and a consumer reading this field will not recognise one either`);
        }
      }

      /* ── SE-R04 — diminishing ownership with no steps ─────────────────────────────────── */
      if (key === 'OwnershipTransfer' && node.Type === 'Gradual' && !populated(node.BuyoutSchedule)) {
        findings.push(`SE-R04: ${at(path)} is OwnershipTransfer.Type "Gradual" with no BuyoutSchedule (${JSON.stringify(node.BuyoutSchedule)}) — gradual ownership transfer whose steps are not written down leaves what each party owns, and when, undetermined. The Standard makes BuyoutSchedule required for exactly this reason`);
      }

      /* ── SE-R05 — the rebate that stopped being a discretion ──────────────────────────── */
      if (next.murabaha) {
        for (const [k, v] of Object.entries(node)) {
          if (!keyMatches(rebateKeys, k)) continue;
          const reason = rebateDefect(v, rules, refPatterns);
          if (reason) {
            findings.push(`SE-R05: ${at(path ? `${path}.${k}` : k)} is a rebate (ibra') on a Murabaha and ${reason}. Early-settlement rebate is the Shari'ah committee's DISCRETION at the time of settlement, never a term of the contract — the passing shape is \`discretionary: true\` plus a reference to the decision that approved it. Whether any rebate may be granted at all is the committee's to say, not this gate's`);
          }
        }
      }

      /* ── SE-R06 — the guarantee on a participatory structure ──────────────────────────── */
      if (next.participatory) {
        const guaranteedKey = Object.keys(node).find((k) => keyMatches(guaranteedKeys, k) && populated(node[k]));
        const basisKey = findKey(node, rules.return_basis_keys, (v) => rules.guaranteed_return_values.includes(lower(v)));
        if (guaranteedKey || basisKey) {
          const what = guaranteedKey ? `\`${guaranteedKey}\` = ${JSON.stringify(node[guaranteedKey])}` : `\`${basisKey}\` = ${JSON.stringify(node[basisKey])}`;
          findings.push(`SE-R06: ${at(path)} models a participatory (Mudarabah/Wakala) structure and carries ${what} — returns on these structures are EXPECTED, never guaranteed. A guaranteed return makes the investment account a deposit with a fixed return, which is the substance the structure exists not to have. The permitted shape is an expected rate, smoothed through the reserves the profit-distribution record accounts for`);
        } else if (!Object.keys(node).some((k) => keyMatches(expectedKeys, k))) {
          // Not a finding: plenty of participatory nodes carry no rate at all. Said out loud so
          // "nothing checked the rate here" and "the rate checked out" do not look the same.
          notices.push(`${at(path)} models a participatory structure and states neither a guaranteed nor an expected rate — nothing here has been checked against a rate; the expected-rate shape is what this gate can read`);
        }
      }

      for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k, k, next);
    };

    walk(doc, '', null, { islamic: false, flagged: false, murabaha: false, participatory: false });
  }

  findings.push(...scanProse(prose, rules));
  return { findings, notices };
}

/**
 * Strip everything that is not prose, line by line (line count preserved so a finding can cite a
 * line). A mapping document that legitimately cites `InterestRate` as a field of the Standard it is
 * mapping AWAY from is the commonest honest use of the word, and a gate that failed it would be
 * turned off within a week. So: fenced blocks, backticked spans, URLs, PascalCase/camelCase and
 * snake_case identifiers all go. What remains is somebody addressing a customer.
 */
export function stripNonProse(text) {
  let fenced = false;
  return String(text).split('\n').map((line) => {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; return ''; }
    if (fenced) return '';
    return line
      .replace(/`[^`]*`/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/\b[A-Z]?[a-z][a-z0-9]*(?:[A-Z][A-Za-z0-9]*)+\b/g, ' ') // InterestRate, isShariaCompliant
      .replace(/\b[a-z0-9]+(?:_[a-z0-9]+)+\b/g, ' ');                  // interest_rate
  });
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** ALL-CAPS terms match case-sensitively; everything else does not. "Apr 2026" is not an APR. */
function termPattern(term) {
  const caps = term === term.toUpperCase() && /[A-Z]/.test(term);
  return new RegExp(`(?<![\\w-])${escapeRe(term).replace(/\\?\s+/g, '\\s+')}(?![\\w-])`, caps ? '' : 'i');
}

/** SE-R07 — the CI backstop for the pre-write hook. Findings only; the hook is the fast path. */
export function scanProse(files = [], rules = DEFAULT_RULES) {
  const findings = [];
  const patterns = rules.prose_terms.map((t) => ({ term: t, re: termPattern(t) }));
  const allow = rules.prose_allow_phrases.map((p) => new RegExp(escapeRe(p).replace(/\\?\s+/g, '\\s+'), 'gi'));
  for (const { label, text } of files) {
    stripNonProse(text).forEach((raw, i) => {
      let line = raw;
      for (const a of allow) line = line.replace(a, ' ');
      const hits = patterns.filter(({ re }) => re.test(line)).map(({ term }) => term);
      // Only the longest hit per line: "interest rate" and "interest" are one occurrence, not two.
      if (!hits.length) return;
      const longest = hits.sort((a, b) => b.length - a.length)[0];
      findings.push(`SE-R07: ${label}:${i + 1} says "${longest}" in prose — this is customer-facing copy on a declared Islamic surface, where the return is a PROFIT or a RENTAL and never interest. Backtick it if you are citing a field name of a standard, or rewrite it`);
    });
  }
  return findings;
}

/* ── loading the declared surfaces ──────────────────────────────────────────────────────────── */

const listFiles = (dir, out = [], base = dir) => {
  for (const name of readdirSync(dir).sort()) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) listFiles(full, out, base);
    else if (st.isFile()) out.push(full);
  }
  return out;
};

/** The literal prefix of a glob — where the walk starts, so a `**` never means "read the repo". */
export function globBase(glob) {
  const out = [];
  for (const part of String(glob).split('/')) {
    if (/[*?]/.test(part)) break;
    out.push(part);
  }
  return out.join('/');
}

/**
 * Resolve the declared surfaces to files. Returns { documents, prose, findings, notices }.
 *
 * A declared path that does not exist is a FINDING: a surface pointing at nothing is a control
 * aimed at nothing, and it is the typo class this gate is most likely to die of. A glob matching
 * nothing is a NOTICE — an empty fixture set is a legitimate state on the day the config lands.
 */
export function resolveSurfaces(cwd, config) {
  const findings = [];
  const notices = [];
  const documents = [];
  const prose = [];
  const rel = (p) => p.slice(cwd.length + 1);
  const outside = (p) => typeof p !== 'string' || p.startsWith('/') || p.split('/').includes('..');
  const exts = new Set((config?.rules?.prose_extensions || []).concat(DEFAULT_RULES.prose_extensions));

  const readInto = (full, label) => {
    const doc = readJson(full);
    if (doc === null) findings.push(`SE-R00: declared surface ${label} is not readable JSON — an unparseable surface is an unchecked one, and a gate that skipped it would report it as checked`);
    else documents.push({ label, doc });
  };

  for (const glob of config?.fixture_globs || []) {
    if (outside(glob)) { findings.push(`SE-R00: fixture_globs entry ${JSON.stringify(glob)} points outside the repository — a surface this repository does not contain is not this repository's surface`); continue; }
    const baseRel = globBase(glob);
    const base = join(cwd, baseRel);
    if (!existsSync(base)) { notices.push(`fixture_globs ${JSON.stringify(glob)} matched no files (${baseRel || '.'} does not exist) — nothing was read for it`); continue; }
    const files = statSync(base).isDirectory() ? listFiles(base) : [base];
    const matched = files.filter((f) => globMatch(glob, rel(f)));
    if (!matched.length) { notices.push(`fixture_globs ${JSON.stringify(glob)} matched no files — nothing was read for it`); continue; }
    for (const f of matched) readInto(f, rel(f));
  }

  for (const spec of config?.spec_paths || []) {
    if (outside(spec)) { findings.push(`SE-R00: spec_paths entry ${JSON.stringify(spec)} points outside the repository`); continue; }
    const full = join(cwd, spec);
    if (!existsSync(full)) { findings.push(`SE-R00: spec_paths declares ${JSON.stringify(spec)} and it does not exist — a declared surface pointing at nothing is a control aimed at nothing`); continue; }
    const files = statSync(full).isDirectory() ? listFiles(full) : [full];
    for (const f of files) {
      const e = extname(f).toLowerCase();
      // The harness parses JSON. A YAML OpenAPI document is UNREAD here, and saying so is the whole
      // difference between a gap and a false assurance.
      if (e === '.yaml' || e === '.yml') { notices.push(`${rel(f)} is YAML — this gate parses JSON only, so that spec is UNREAD here, not clean. Emit the resolved JSON alongside it if you want it covered`); continue; }
      if (e !== '.json') continue;
      readInto(f, rel(f));
    }
  }

  for (const root of config?.content_roots || []) {
    if (outside(root)) { findings.push(`SE-R00: content_roots entry ${JSON.stringify(root)} points outside the repository`); continue; }
    const full = join(cwd, root);
    if (!existsSync(full)) { findings.push(`SE-R00: content_roots declares ${JSON.stringify(root)} and it does not exist — declared customer-facing copy that is not there is unchecked copy`); continue; }
    const files = statSync(full).isDirectory() ? listFiles(full) : [full];
    for (const f of files) {
      if (!exts.has(extname(f).toLowerCase())) continue;
      prose.push({ label: rel(f), text: readFileSync(f, 'utf8') });
    }
  }
  return { documents, prose, findings, notices };
}

/** The change_ids whose compiled plans require the capability — so a finding can name WHO asked. */
export const requiringChanges = (agg) =>
  (agg?.changes || []).filter((c) => c.capabilities?.[CAPABILITY]?.required).map((c) => c.change_id);

export function run(cwd = process.cwd(), { agg = null } = {}) {
  const aggregate = agg || aggregateRequirements(cwd);
  const required = capabilityRequired(aggregate, CAPABILITY);
  const path = firstPath(CONFIG_LOCATIONS, cwd);

  if (!path) {
    // INERT. No Islamic product in flight and no declared surfaces: nothing is read and nothing is
    // said. This silence is the whole reason a conventional adopter can carry this gate at all.
    if (!required) return { inert: true, required: false, present: false, documents: 0, prose: 0, findings: [], notices: [] };
    const asked = requiringChanges(aggregate).join(', ') || 'unknown change';
    return {
      inert: false, required, present: false, documents: 0, prose: 0, notices: [],
      findings: [`SE-R00: a compiled plan requires the ${CAPABILITY} capability [${asked}] and there is no ${CONFIG_LOCATIONS[0]} — the route says an Islamic product is in flight and nothing in this repository declares WHERE its data contracts, fixtures and customer copy live, so no substance check has anything to read. Declaring the surfaces is the institution's act: the harness cannot tell an Islamic fixture tree from a conventional one, and guessing would either miss the tree that matters or fail a bank that has no Islamic product`],
    };
  }

  const config = readJson(path);
  if (!config) {
    return { inert: false, required, present: true, documents: 0, prose: 0, notices: [], findings: [`SE-R00: ${CONFIG_LOCATIONS[0]} is not valid JSON — an unreadable surfaces declaration is an absent one`] };
  }
  const surfaces = resolveSurfaces(cwd, config);
  const { findings, notices } = evaluate({ documents: surfaces.documents, prose: surfaces.prose, rules: config.rules ?? null });
  return {
    inert: false, required, present: true,
    documents: surfaces.documents.length,
    prose: surfaces.prose.length,
    findings: [...surfaces.findings, ...findings],
    notices: [...surfaces.notices, ...notices],
  };
}

// CLI (skipped when imported by the test suite).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { inert, findings, notices, documents, prose } = run();
  for (const n of notices) process.stdout.write(`NOTICE: ${n}\n`);
  if (findings.length) {
    process.stderr.write('\nShari\'ah product-substance gate — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nThis gate checks that DATA conforms to structures the Shari\'ah committee already approved\nand to an enum the Standard already fixes. It rules on no Shari\'ah question — scholars decide\nShari\'ah — and it reads files, never production.\nSee docs/governance/shariah-surfaces.json and scripts/shariah-governance-check.mjs.\n');
    process.exit(1);
  }
  if (inert) {
    process.stdout.write(`Shari'ah product-substance gate — inert (no ${CONFIG_LOCATIONS[0]}; no compiled plan requires ${CAPABILITY}; nothing read)\n`);
    process.exit(0);
  }
  process.stdout.write(`Shari'ah product-substance gate — OK (${documents} document${documents === 1 ? '' : 's'}, ${prose} prose file${prose === 1 ? '' : 's'} read${notices.length ? `, ${notices.length} notice(s)` : ''}; structure-conformant is the most this says)\n`);
}
