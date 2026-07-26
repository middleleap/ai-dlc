# ADR-0001 — Notion API version: pin 2025-09-03 or adopt 2026-03-11

**Status:** proposed · **Date:** 2026-07-25 · **Deciders:** `solution-architect` ·
`enterprise-architect` · `platform-admin` — **AWAITING:** assignment to named registry identities
· **Programme:** Factory Floor (`docs/notion-floor-plan.md`)
**Companions:** plan §3 P3 · §4 WS0 · D0.5 · §7 open decision 4 ·
`docs/research/notion-software-factory-collaboration-2026-07.md` §2.2 and §8 ·
`docs/notion-floor-threat-model.md` (the seam's identities and gaps).

This record decides which dated Notion REST API version the Factory Floor's sync services build
against, and how that pin is permitted to change afterwards. It decides nothing about where those
services run (ADR-0002), nothing about either MCP variant, and nothing a Loom gate reads — the
harness core learns no vendor API, and every D-gate, the waist gate and both PA gates stay
file-based and offline.

## Context

Prerequisite P3 marks this ADR **due immediately** and places it in WS0 as D0.5, to be decided
**before WS1** rather than at some future version. The forcing facts are three.

**The pin in v1 of the plan is `2025-09-03`.** That version introduced the data-source model — a
database became a container of one or more data sources, each with its own schema, and page
creation now parents to a `data_source_id`. It is a breaking change from database-centric
addressing, and it is the reason a version was named in the plan at all.

**The external review reports the current dated version is already `2026-03-11`.** So the plan's
pin is not "current"; it is at least one dated release behind before a single line of the seam
exists. The choice in front of the deciders is therefore not *whether to absorb the data-source
break* — every candidate version sits at or after it — but **which post-break contract to build
on**.

**Nothing is built.** WS1's projection is the first code that will speak to Notion. The migration
surface of a version change is at its floor today and rises monotonically with each workstream:

| If the pin changes… | Migration surface | Sharpest hazard |
|---|---|---|
| **Today** (nothing built) | a configuration value in a service that does not exist | none |
| After **WS1** (projection live) | the projector's client, every projected schema, every data-source id held on the floor | a stale board during cutover; G4's 10-minute freshness measure at risk |
| After **WS4** (freeze live) | + the exporter's block handling and the Notion-flavored Markdown it emits | a changed export digest for *unchanged* content — freeze stamps stop reproducing and D4.1's determinism claim needs re-proving |
| After **WS5** (decisions routed) | + the workspace / page / data-source ids bound into every D2.4 envelope | envelopes bound to addressing that no longer resolves |

### The blocking AWAITING is now answered, at primary source

This record previously said the release list between `2025-09-03` and `2026-03-11` had not been
verified, and should not be decided until it was. **It has been, on 26 Jul 2026, by asking the live
API rather than reading about it.** A request carrying a deliberately invalid version is rejected
with the complete accepted set enumerated in the error:

```
Notion-Version header failed validation: Notion-Version header should be
"2021-05-11", "2021-05-13", "2021-08-16", "2022-02-22", "2022-06-28",
"2025-09-03", or "2026-03-11"
```

Three facts follow, and each moves an option:

**There is no release between `2025-09-03` and `2026-03-11`. They are adjacent.** So
"current-minus-one" resolves unambiguously to `2025-09-03` — Option C *is* Option A with a policy
attached, exactly as suspected below but could not be confirmed.

**Seven versions exist and every one is still accepted, including `2021-05-11`.** Five years of
dated versions, none withdrawn. "Old but supported" was called an assumption in this record; it is
now an observation. That materially lowers Option A's stated risk — but see the next fact, which
raises a different one.

**The export digest is stable across every currently-relevant version.** The same live page,
fetched and exported under `2022-06-28`, `2025-09-03` and `2026-03-11`, yields
`sha256:2755e000…` in all three — byte-identical, 4157 bytes. The migration hazard this record
worried about most, *"a changed export digest for unchanged content"*, **does not materialise
anywhere in the range a decision could reasonably land**. Freeze stamps reproduce across the pin.

### And a defect the verification found

The two 2021 versions do **not** produce that digest — they produced a different one, over 1619
bytes instead of 4157, with the same 36 blocks in the same order.

The cause is a rename: the block payload key was **`text`** before `2022-06-28` and **`rich_text`**
from it. The exporter reads `rich_text`, and `richText()` answered `''` for an absent field — so
under an older pin every block arrived intact and exported **empty**, the page exported *cleanly*,
nothing aborted, and the freeze recorded a stable digest over almost no content.

That is the failure mode this programme exists to prevent, reached by a configuration value rather
than an attack. `richText()` and `plain()` now **abort when the field is absent** and name the
version rename as the likely cause; an empty *array* still exports fine, because an empty paragraph
is a real thing an author can write. Three regression tests cover it. A misconfigured pin is now a
failed build instead of a hollow record.

**This raises the stakes of the decision below rather than settling it.** A pin is not merely a
compatibility setting; it is an input to what a frozen artifact *contains*.

A second gap is procedural. The deciding roles named above — `solution-architect` and
`enterprise-architect` — **do not yet exist in `identities.template.json`**; WS2 · D2.3 adds them.
Until they do, this ADR has no registry-resolvable decider, and that is a gap, not a formality.

## Options considered

### Option A — Pin `2025-09-03`

- **What it is:** every request from all four seam identities sends `Notion-Version: 2025-09-03`.
  The plan's v1 value is kept; the data-source addressing model is adopted; nothing later is.
- **Costs:** none today. The cost is deferred, and it is the whole cost: the first upgrade becomes
  a live migration of a running seam instead of a greenfield choice, priced at whichever row of the
  table above the programme has reached by then.
- **Risks:** the version is two dated releases old at first commit, and ages further with every
  week of build. Fixes, hardening and API surfaces published after that date are unavailable —
  including, potentially, ones the seam needs (per-property permissions and richer export fidelity
  are both plausible; neither is verified). Notion's support window for superseded dated versions
  is not documented in anything read for this record, so "old but supported" is an assumption, not
  a fact. Choosing the older contract also means the exporter's determinism (D4.1) is proven
  against a contract already scheduled for replacement.

### Option B — Adopt the current dated version, `2026-03-11`

- **What it is:** the seam pins `2026-03-11` from its first commit; the pin is held in one place in
  the sync service's configuration, asserted on every request, and asserted again by a startup
  check that fails closed when the configured value and the built value disagree. A mixed-version
  seam — the projector on one version, the freezer on another — is a defect, not a deployment
  option.
- **Costs:** reading the intervening changelog and designing against it (the AWAITING above);
  accepting that the seam is built on a contract the wider ecosystem has had months rather than
  years to shake out; and taking the *first* upgrade decision at Notion's next dated release rather
  than deferring it.
- **Risks:** unknown-content risk is the real one — this record cannot yet say what `2026-03-11`
  changed. A newer version has fewer third-party bug reports behind it. And it could itself be
  superseded soon after WS1 ships, which would put the programme back at the same question with a
  larger migration surface — the same exposure Option A carries, only later.

### Option C — Pin current-minus-one, with a standing upgrade cadence

- **What it is:** deliberately trail the newest dated release by one, on the theory that the newest
  version's early defects are discovered by other people; a standing cadence (quarterly, or one
  release after each publication) moves the pin forward on a schedule rather than on an incident.
- **Costs:** the cadence needs a named owner, a calendar slot, and its own change record; a
  deliberately-behind pin must be re-justified at every audit; and the seam is knowingly running a
  contract its own team has decided is not the best available.
- **Risks:** the definition is unstable. "Current-minus-one" is undefined when two dated versions
  ship close together, and **today it may resolve to `2025-09-03` itself** — the intervening
  release list is exactly what has not been verified. In that case Option C is Option A wearing a
  policy hat, with added process. It also institutionalises lag: the programme would never be
  current, by design, which is a poor position to hold in front of a second-line reviewer asking
  why a known-superseded contract is in use.

## Decision

**Recommended: Option B — adopt `2026-03-11`, the current dated version, now.**

The argument is timing, not preference. Every option eventually pays the same migration; the only
variable the programme still controls is *how much surface exists when it pays*. Today that surface
is a configuration value in an unwritten service. After WS4 it includes the exporter, and a version
change that alters Notion-flavored Markdown export changes the export digest for content nobody
edited — which invalidates freeze stamps, forces re-freezes, and puts D4.1's determinism claim back
in the queue for re-proof. Deliberately starting one or two versions behind buys nothing except the
certainty of paying more later. Option C's discipline is real but its definition is not: until the
release list between the two dates is verified, "current-minus-one" cannot be evaluated, and if it
resolves to `2025-09-03` the option is indistinguishable from A.

**The standing rule that accompanies this decision:** the pin is **reviewed at every dated Notion
release** — review is automatic, upgrade is not — and **changing it requires a superseding upgrade
ADR** that names the breaking changes absorbed, the migration surface at that moment, and the
re-proof owed (at minimum the exporter determinism fixture and the capability probes). A pin moved
by a configuration commit alone is a control failure of the same family the plan's honesty rule
exists to prevent.

**Scope, stated plainly.** This decision governs the **REST API only**. Neither MCP variant is a
dependency of the Factory Floor: the **hosted MCP is OAuth-bound and human-present, therefore not
headless**, which disqualifies it for the projector, freezer and bridge; the **self-hosted MCP
carries sunset risk** that the research flags directly. If either later becomes a dependency, that
is a separate ADR, not an amendment to this one.

### What the verification changed about this recommendation

**The recommendation stands, and is now stronger and cheaper than when it was written.** The
verification removed the reason this record was blocked, and removed the cost that made Option B
feel like a gamble:

- The unknown-content risk named under Option B is **largely discharged for our purposes**: the
  export digest is identical under `2022-06-28`, `2025-09-03` and `2026-03-11`, so adopting the
  current version costs no re-proof of D4.1's determinism claim. That was the sharpest cost in the
  table above and it is now measured at zero for this range.
- **Option C is eliminated,** not on judgement but on definition: with the two versions adjacent,
  current-minus-one is `2025-09-03` and Option C collapses into Option A.
- Option A's *risk* is lower than stated — nothing has ever been withdrawn — but its *benefit* is
  also now visibly nil. It buys ecosystem maturity the digest evidence shows we do not need, in
  exchange for starting one version behind.

**A floor comes with it.** Whatever is pinned, it must be **`2022-06-28` or later**. Below that the
`text`/`rich_text` rename means the exporter aborts — correctly, now — so the older versions are not
a conservative choice but a broken one. That floor should be asserted by the same startup check that
asserts the pin.

**One correction to the record's own history:** every live call made during the Alpha walkthrough
used `2022-06-28`, chosen at a command line before this ADR was decided. It worked, and the digest
evidence shows it produced the same bytes `2026-03-11` would have. That is luck, not process — a
pin was set by whoever typed first, which is exactly what this ADR exists to stop. It is recorded
here rather than tidied away.

Status stays **proposed** — the recommendation is now unblocked and evidence-backed, but the
deciders named at the top are still `AWAITING` assignment to registry identities, and a decision
recorded without a decider is the thing this method refuses everywhere else.

## Consequences

**What becomes true.** WS1's projection is written against data-source addressing on the current
contract from its first line. All four seam identities share one pinned version, asserted at
startup and failing closed on mismatch. No migration is scheduled into the M1–M3 window. The
version pin becomes a named, reviewable configuration fact with an owner, rather than a value
buried in a client library's default.

**What becomes harder.** The programme cannot cite ecosystem maturity for its chosen version, and
any behaviour that differs from the `2025-09-03` documentation must be re-read at primary source
rather than assumed. The first upgrade question arrives at Notion's next dated release — sooner
than under A or C — and the standing rule means it must be answered rather than ignored. The
exporter's determinism fixture (D4.1) becomes version-sensitive evidence: it proves determinism
*under this pin*, and says nothing about the next one.

**What must be revisited, and when.**

- **At every dated Notion release** — review the pin; record the review even when the answer is
  "no change". A review that leaves no record did not happen.
- **On any breaking-change notice** touching data sources, comments, blocks, or Markdown export —
  immediately, because the export digest and the D2.4 envelope's address fields both depend on it.
- **On confirmation of the self-hosted MCP sunset** — this ADR does not change, but the fact is
  recorded here so a future reader does not mistake silence for the MCP being in scope.
- **When the pinned version enters a deprecation window** — an upgrade ADR is due before the window
  closes, not after.

## Compliance notes

| Control / gate | How this decision leaves it |
|---|---|
| **HG-0002** (immutable control plane) | Untouched by construction: the pin is adopter-side sync-service configuration, and the harness core learns no vendor API (the adapter contract). **But** if the sync service is ruled a Loom-governed component — the open question at threat-model gap **G-8** — the pin becomes a governed configuration change under that component's change management, and the standing rule above becomes its enforcement |
| **HG-0004** (least-privilege identity, vaulted secrets) | The pin is per-integration-token configuration; all four identities carry the same value. A mixed-version seam is a defect, and the startup check that fails closed is its enforcement of record |
| **HG-0011** (residency) | Unchanged. Protocol version does not decide what crosses the seam; the P1 residency record governs content. One dependency does exist: the automated pre-egress filter (D0.4 part 2) is written against payload shapes, so it must be re-checked against any version that changes them |
| **HG-0003** (tamper-evident evidence) | Indirect but real: the freeze stamp records an export digest (D4.1). A version change that alters export output breaks digest reproducibility for unchanged content — which is why the upgrade ADR must name the re-proof owed |
| **Gate set / CODEOWNERS** | No gate reads the Notion API. D1–D9, `discovery-link-check`, `product-approval-check` and the doc-integrity checks are file-based and offline. Goal **G2**'s diff-empty requirement is unaffected by this decision |
| **Regulatory (CBUAE, PDPL)** | No obligation attaches to an API version number as such. The vendor assessment of Notion — third-party/outsourcing risk, residency, retention — sits in the residency review and the third-party risk track, not here. **AWAITING:** confirmation from risk-second-line that no separate change notification is expected for a version pin |

Nothing in this record activates a control. The version pin is a build-time fact; the seam's
controls are the extended PA gate, the freeze digest, the capability probes and the observer's
activation evidence, none of which this decision creates or strengthens.
