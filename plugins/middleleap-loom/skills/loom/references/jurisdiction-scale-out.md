# Jurisdiction scale-out — a new market is data, not code

The Loom was proven in one market. The question every second market asks is: *how much of the
harness has to be rewritten?* The answer this file asserts, and then walks seam by seam, is
**none of it**. Entering a new market is six files of data and zero lines of gate logic. No gate
branches on a market name, no compiler knows a regulator, and nothing in the machinery has a
country in it.

That is a design property, not a coincidence. The moment one market's authorities are hard-coded
into a generic profile or a gate's regex, every other market forks it — and a forked control set
is two control sets that drift.

## The six seams

| # | Seam | What you write | What reads it |
|---|---|---|---|
| i | **Jurisdiction profile** | `profiles/jurisdictions/<market>.json` from `jurisdiction.template.json` | the policy compiler → every compiled control plan |
| ii | **PII shapes** | rows in `hooks/pii-patterns.json` | the pre-write PII guard hook |
| iii | **Regulatory vocabulary** | `reg-drivers.json` beside the data-risk register | discovery gate **D6** (Data-governance feasibility) |
| iv | **Brand & language** | `lang` / `dir` + type tokens in the brand profile, or a per-market brand file | the renderers, via `--brand` |
| v | **Identities & cadence** | rows + a quorum in `docs/governance/identities.json`; rows in `approval-sla.json` | the identity registry gates, approval-status |
| vi | **Data-contract gaps** | `DR-*` rows in the data-risk register | D6 and the register's own gates |

### i. The jurisdiction profile — where local authority vocabulary lives

Copy `profiles/jurisdictions/jurisdiction.template.json`, name it for the market, replace every
`ADOPT:` string, and add it to the change envelope. It composes with the product profiles; it does
not replace them.

The load-bearing rule is the split. **Generic duties live in the product profile; the local
authority's vocabulary lives in the jurisdiction profile.** The Islamic conditional is the sharpest
instance: the *duties* of an Islamic product — an approved structure, bound rulings, continuous
compliance monitoring, a third line that is never outsourced, purification of non-permissible
income — are the same in every market, and live in `profiles/products/islamic-product.json`. What
varies is which body's rulings bind, which school of thought is followed, which external standards
are adopted as a baseline, whether a national higher authority exists at all, and what it is
called. All of that is per-market **data**.

So schools-of-thought and binding-authority variance never becomes a hardcoded global rule set —
which is the only way it could ever have been wrong for everyone at once. The harness carries the
section *names* an approver fills; it adjudicates between no authorities and rules on nothing.

### ii. PII shapes — the market's identifiers

Add one row per identifier shape the market uses — national ID, IBAN, passport, tax number — with
the market's `jurisdiction` code, the normalised regex, and the **synthetic allowance** your
fixtures use. A row whose `allow` is `null` and whose shape your own fixtures legitimately carry
will block your own test data: give the fixtures a synthetic marker rather than loosening the row.
The guard denies when the pattern file is missing or unparseable, so this file is part of the
control, not a lookup beside it.

### iii. Regulatory vocabulary — so D6 recognises the market's regulator

D6 asks whether the data-governance document is grounded in something a regulator wrote. The
built-in expression knows only the abbreviations the harness ships with; a document citing a new
market's statutes, a standard-setter's standards, or a religious-law authority's pronouncements
would fail as "cites no regulatory driver" — a false negative about a document that was entirely
citation. Mount the market's terms as a flat array of literals in `reg-drivers.json` beside the
register. Two properties hold by construction: the built-in check runs **first**, so a mount can
only ever *add* ways to pass, and mounted terms are escaped literals, so nothing in an
adopter-owned file can widen into a wildcard.

### iv. Brand, language and direction

`lang` and `dir` are brand front-matter with a per-artifact override, and the renderers emit them.
Right-to-left is a value change, not a fork: the stylesheets are direction-agnostic, so there is no
mirrored twin to keep in step. Add the market's type tokens under the same token *names*, or keep a
per-market brand file and select it with the existing `--brand` flag. Gate ids do not change with
direction — `D7` is `D7`.

### v. Identities, quorum and approval cadence

Add the market's approvers to the identity registry with their roles; where a **body** decides
rather than an individual, add a `quorum` entry for that role so a single signature cannot stand in
for a committee. Identities that sit outside the institution are declared `external: true` with a
`reconciliation_source`, because an approver the HR feed has never heard of is not an error — it is
an external appointment, and pretending otherwise is how registries get quietly loosened. Then add
`approval-sla.json` rows so the queue is visible: a body that sits monthly has a cadence, not a
desk, and a target that reflects that is worth measuring against.

### vi. Data-contract gaps — the register is the system of record

Where the market's data standard cannot express something the institution actually does, the gap
goes in the data-risk register as a `DR-*` row with its compensating control. That is the seam's
whole job: a named gap with an owner beats an unnamed workaround in code.

## The Open Finance v2.1 Islamic-field gaps — worked, and named honestly

The UAE Open Finance Standards v2.1 carry native Islamic fields, and they are **partial**. Three
gaps are documented facts about the data contract:

- **No deposit-side structure.** `ShariaStructure` is exactly `{Ijara, ServiceIjara, Murabaha,
  Musharaka, Tawarruq}` — a financing-side enum. Mudarabah and Wakala, the structures behind
  profit-sharing investment accounts, have no value in it.
- **No manufacturing contracts.** Istisna and Salam likewise have no value.
- **The compliance flag defaults to FALSE.** `IsShariaCompliant` unset reads as "not compliant" —
  absence rendered as an answer.

These are **data-contract gaps whose system of record is the data-risk register**, not defects to
be papered over. Three consequences follow, and the third is the one that matters:

1. Open a `DR-*` row per gap, stating what cannot be represented, who is exposed, and the
   compensating control (an out-of-band disclosure, a product-level statement, a consent-screen
   note) — plus who owns re-testing it when the Standards move.
2. Populate the flag deliberately at the source. A default that nobody set is not a determination,
   and a downstream consumer cannot tell the difference.
3. **Never invent enum values.** A locally-minted `Mudarabah` value interoperates with nothing,
   fails conformance, and converts a known, owned, disclosed gap into a silent divergence that
   looks like a field. The register is where a gap is allowed to live; the wire format is not.

## A caution about regulatory content

Everything a market profile asserts — which authority binds, which standards are adopted, which
disclosures are mandated, which notification clock runs — is **adopter research**. It is checked
against the primary source, dated, and re-checked when the source moves. **Never fill a market
profile in from memory, and never let an agent do it**: the shape of a plausible regulation is
exactly what a model produces best and exactly what an approver cannot audit. The template ships
`ADOPT:` placeholders for this reason. A placeholder left in place is not a control; it is a
control-shaped hole, and it is at least visible. An invented citation is neither.

## Honest limits

- **Zero code is a claim about the harness, not about the work.** Six data seams still need
  research, drafting, approval and maintenance. What scale-out avoids is a *fork of the machinery*.
- **The harness never rules on local law or local religious law.** It composes the profile the
  institution's approvers wrote and checks that the records they require exist.
- **Nothing here observes the market.** Cadences, feeds and screening that keep a market profile
  current are the institution's runtime; the gates read the records those produce.

See `governance.md` (the HG catalog), `discovery-harness.md` (D6 and the register seam),
`continuous-assurance.md` (domain streams — a market's own confirmation cadence), and
`../../loom-adopt/harness/governance/runbooks/ai-incident-runbook.md` (where a market's
notification duties are honoured).
