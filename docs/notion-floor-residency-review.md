# Residency review record — the Factory Floor

**Status:** **DRAFT — not approved. Nothing in this record is in force.** · **Deliverable:** Decision D0.1
(WS0), prerequisite **P1** of `docs/notion-floor-plan.md` · **Drafted:** 2026-07-25 ·
**Owner:** AWAITING — programme owner to be named, must resolve to a registry identity ·
**Approvers required:** data-protection + risk-second-line (see §11) · **Companions:**
`docs/notion-floor-plan.md` · `docs/research/notion-software-factory-collaboration-2026-07.md` ·
`plugins/middleleap-loom/skills/loom/references/governance.md`.

> **To review or send this:** two working instruments accompany this record and are not part of
> it — `docs/notion-floor-p1-reviewer-brief.md` (what the two signatories are and are not being
> asked to accept, and where the drafter thinks they should push back) and
> `docs/notion-floor-p1-vendor-questionnaire.md` (§8's vendor questions in sendable form, with
> the two institution-specific ones separated out so they are not sent by mistake). Answers come
> back **into this record**, which is the thing that gets signed.
>
> **To see what "signed" looks like:** `docs/notion-floor-residency-review-example.md` is a
> **specimen** — a filled-in P1 with fictional signatories, showing ratings a signatory *changed*,
> a risk left honestly unrated, and the conditions an approval normally carries. It approves
> nothing and does not unblock WS1. **This** record is the gate, and its §11 is still `AWAITING`.

This record states, class by class, what content of a governed Loom repository may be projected
into or authored on a SaaS workspace ("the floor"), at what fidelity, and what must never leave
git. It exists because HG-0011 makes residency a decision an institution takes deliberately, and
because the plan makes this record the gate on everything else: until it is signed, no workspace
is built, no token is issued, and WS1 onward do not start. It is written to be refused as easily
as approved — every point that needs an institution's own answer is marked, and no answer is
invented.

## 0 · How to read the markers

| Marker | Meaning |
|---|---|
| **AWAITING:** | A human decision or signature that does not exist yet. Never fill one in on someone's behalf |
| **INSTITUTION-SPECIFIC:** | The Loom cannot answer this; the adopting institution's own policy, contracts, or register decides |
| **VENDOR-QUESTION:** | A fact about the SaaS vendor that must be established from the contract or the vendor's assurance pack — not from this document, and not from memory |

Nothing here is a legal opinion, a DPIA, an outsourcing assessment, or a vendor security
assessment. It is an input to all four. Where the institution already holds an approved cloud
assessment for this vendor at the required data classification, this record should adopt it by
reference rather than restate it — **INSTITUTION-SPECIFIC:** does such an assessment exist, and
at what classification tier?

## 1 · Purpose and the rule it serves

**HG-0011** names the gap plainly: *agent LLM traffic and execution not residency-controlled*,
and its decision is an onshore model gateway, pre-egress DLP, and attested sandbox execution
where residency rules apply. The Factory Floor puts a second residency question next to the
first. The gateway question is *where the model runs*. The floor question is *what content is
allowed to reach a third party at all* — because once workspace content sits in the vendor's
service, the vendor's own AI features (Custom Agents, Workers, connectors, enterprise search)
may process it through model providers that are not the institution's gateway. The
content-class table in §4 is the answer to that second question, and it is the only reason
floor-keeper agents can be contemplated at all: they may only ever operate over content that is
already safe to be outside the gateway.

Two further expectations frame the review for a CBUAE-regulated LFI:

- **PDPL.** The floor processes personal data from the first day — of staff, contractors, and
  any external interviewee whose notes live there. Lawful basis, purpose limitation,
  minimisation, retention, cross-border transfer conditions, and data-subject rights all apply.
  **INSTITUTION-SPECIFIC:** the lawful basis for each processing purpose, and whether this
  processing is already covered by an existing record of processing.
- **CBUAE expectations on outsourcing, cloud, and third-party risk.** Placing governance
  workflow — approvals, risk ratings, control plans — in an external service may constitute
  material outsourcing. The product passport already carries the two fields that force the
  question (`third-parties.new_outsourcing`, `cbuae-notification-assessment`).
  **INSTITUTION-SPECIFIC:** does this arrangement meet the institution's materiality threshold,
  and does it require notification or no-objection before WS1?

**Honest note on enforcement of record.** HG-0011 sits in the catalog's *organisational
decisions* bucket: the bundle ships no repo-side gate for it. The one automated control that
exists — `harness/hooks/pii-guard.sh` — is a `PreToolUse` hook that guards what an agent
*writes into* the repository. It never sees a projector's outbound payload. The pre-egress
filter of §6 is therefore new machinery, adopter-side, and not enforced by any harness gate.
An HG id with no enforcement behind it is a label, not a control; this record must not be read
as supplying one.

## 2 · Scope

**In scope:** every content class the plan projects from git into the floor, and every class it
authors on the floor (catalogs A, B, C and the scaffolding of §6c of the research). Both
directions: projection (git → floor, `svc-floor-projector`) and authoring (keyboard → floor,
frozen back by `svc-floor-freezer`).

**Out of scope, and deliberately so:** the residency of the coding agent's own LLM traffic (that
is the gateway half of HG-0011, decided elsewhere); the harness's execution sandbox (HG-0011,
HG-0012); and the security assessment of the vendor's platform, which is the
information-security function's deliverable, not this one. **AWAITING:** confirmation from
information-security that a platform assessment is in scope for them and scheduled before WS1.

**The three questions that classify any content** (from the research §6, restated as residency
questions):

1. Does a gate read it? Then git holds the copy of record, and the floor may hold at most a
   projection of it.
2. Does its authoring benefit from multiplayer? Then it may be born on the floor — and its
   *template*, not a filter, is the control that keeps it clean.
3. Does it identify a person, a customer, an account, or a live incident? Then it does not
   project, at any fidelity, without an explicit line in §4 or §5 saying so.

## 3 · Default posture (proposed)

Carried from P1 and proposed for adoption as written:

1. **References and status, never personal data** — where "personal data" means customer
   personal data always, and staff personal data beyond what workspace membership inherently
   discloses (§8).
2. **Passport fields project as summaries**, never as the passport file.
3. **Deny by default.** A field with no entry in §4 does not project. Unknown is *withheld*,
   never *passed through*.
4. **Withholding is visible.** A record the filter withholds is shown on the floor as
   *withheld — filter hit*, never omitted silently. Silence must never be mistaken for
   coverage, on the floor least of all.

## 4 · Content classes — the projection and authoring table

Fidelity is a **ceiling**, not a target: *full text* · *summary* (a bounded, schema-fixed
rendering, never verbatim free text) · *reference + status* (identifiers, states, digests,
dates, role names) · *never*. For projected classes the ceiling binds the projector. For
floor-authored classes it binds the template and the author, because no automated control
stands between a keyboard and the floor (§6).

| Content class | Direction | Fidelity ceiling | Rationale | Residual risk |
|---|---|---|---|---|
| Backlog items (`docs/backlog.yaml`) | Projected | Reference + status; item title verbatim | The board needs id, title, state, `discovery:` link, waist-gate result — nothing else | Titles derived from complaints or incidents can carry customer detail; a filter matches shapes, not names |
| Change envelope + state (`change-envelope.json`) | Projected | Reference + status | Change id, tier, materiality, current state. The classifier's narrative summarises; it never projects verbatim | An unannounced regulated change becomes visible workspace-wide before it is announced — a timing exposure, not a data one |
| Release-hold status (`release-hold.json`) | Projected | Reference + status, view-only | Go/no-go must be visible; no write path exists or may exist | A view-only card that reads as authority. The non-authoritative label is load-bearing |
| Control plan (compiled) | Projected | Summary | The evidence-carried-in rule needs gate ids, evidence kinds, required approver roles, `plan_hash` | Publishes the institution's control map to everyone with teamspace access |
| Product-passport sections | Projected | Per §4.1 — summary, some reference + status | The richest multi-human artifact and the reason the floor exists; P1's default is summaries | Aggregation: one page describes a regulated change end to end |
| Decision-log entries (`decision-log.json`) | Projected | Summary + link | Teammates should see what the agent decided and why. Entry id, timestamp, type, one-line summary; the hash chain stays in git | Agent rationale quotes files, errors, and fixtures. Free text is the leakiest shape there is |
| Problem statement (D1), synthesis (D5) | Authored on the floor | Full text | Born here; multiplayer drafting is the point. The D-gates run on the frozen export, unchanged | Nothing filters the keyboard. Template discipline is the only control |
| Research log (D2) | Authored on the floor | Full text, pseudonymised | Signals carry stable ids; the template already demands `[synthetic]` tagging and zero real PII | Highest-pressure class in the whole catalog: verbatim customer quotes want to live here |
| Data-governance artifact (D6) | Authored on the floor | Full text, **categories only** | Data elements are categories, never values; `DR-*`/`CTRL-*` ids resolve against the mounted register | The *uncovered risks* section is an inventory of unmitigated exposure. **INSTITUTION-SPECIFIC:** may it project at all? |
| Stakeholder reactions (D9) | Authored on the floor | Full text | The reaction is a human moment; comments carry their author by construction | Attributed opinion is staff personal data under PDPL, in a SaaS, permanently |
| Meeting, workshop, interview notes | Floor-native, permanent | Full text, pseudonymised, consent recorded | Catalog C: these never freeze into git; the research log cites them by id | External participants' data in a SaaS. Consent text and lawful basis do not yet exist (§8) |
| Identity registry entries | Projected | Reference + status | Role → workspace member as a people-property: display name and role, nothing more | The roster is a "who can approve what" map — a targeting aid for social engineering |
| Sealed-evidence rollups (MI) | Projected | Reference + status | Counts, verdicts, bundle digest, dates. Payloads stay in git | Aggregate control metrics readable as weakness signals. Rated low |
| Operations signals | Projected | Reference + status | Signal id, type, severity, route, state. **The narrative does not project** | The class most likely to breach this record: triage pressure pushes detail onto the board |
| BrainKit / institutional context | Projected | Reference + status (title, version, digest) | The corpus is the institution's own policy; a digest proves currency without publishing it | **INSTITUTION-SPECIFIC:** full-text projection needs explicit approval and is not sought here |
| Code, API contracts, tests, CI, gates, hooks, `identities.json` subject ids, keys, tokens | — | **Never** | Control plane (HG-0002). Nothing about it is improved by projecting it | — |

### 4.1 · Product-passport sections, field by field

The passport is the one artifact where "summary" needs spelling out. Sections are those shipped
in `harness/change-example/product-passport.json`.

| Section | Fidelity ceiling | What that means concretely |
|---|---|---|
| `classification` | Summary | `materiality`, `new_or_changed`, and a bounded summary of `summary` |
| `target-market` | Summary | Included/excluded segments as categories; `foreseeable_harm` summarised, never a case narrative |
| `inherent-risks` | Reference + status | The four ratings and the assessor's registry identity |
| `regulatory-obligations` | Summary | Regime names verbatim; `notes` summarised |
| `ownership` | Reference | Registry identities of product owner and accountable executive |
| `data-and-models` | Summary | `personal_data` boolean and category **names** only. Never sample values, never the model manifest's contents |
| `third-parties` | Summary | Dependency names and `new_outsourcing` boolean |
| `cbuae-notification-assessment` | **Reference + status** | Decision and assessor only. The rationale is supervisory-sensitive and stays in git |
| `credit-risk-appetite` | **Reference + status** | `within_appetite` and assessor only. `limit_changes` never projects |
| `pa1` / `pa2` | Reference + status | Role, decision, timestamp, registry identity. The attestation envelope stays in git, always |

**AWAITING:** confirmation from risk-second-line that the two *reference + status* downgrades
(CBUAE notification rationale, credit-risk limit changes) are correct, and that no further
section needs downgrading.

## 5 · Prohibited outright — no fidelity, no exception, no approval path in this record

The following must never reach the floor by projection, by authoring, by attachment, by paste,
by screenshot, or by connector:

- **Customer personal data of any kind** — names, contact details, addresses, dates of birth,
  device identifiers, or any value that identifies a natural person who is a customer or
  prospect.
- **Emirates ID numbers, IBANs, card PANs, account numbers, customer reference numbers**,
  and any other direct financial identifier — real or realistic.
- **Real transaction data**, balances, holdings, statement extracts, or any extract taken from
  a production system, in any volume, including "just one row to illustrate".
- **Special-category and inference-heavy data** — health, biometric, religious affiliation
  (note that Islamic-product holdings can carry that inference), AML/CTF case detail,
  PEP/sanctions screening results, and the content or existence of suspicious-activity
  reporting, which carries its own disclosure prohibition.
- **Credentials and secrets** — integration tokens, API keys, certificates and private keys
  (mTLS included), connection strings, seeds, recovery codes, vault paths with material.
- **Unredacted incident detail** — customer-identifying incident narrative, forensic artefacts,
  raw log extracts, stack traces or payload captures.
- **Supervisory and legal material** — CBUAE correspondence, examination findings, privileged
  advice, and anything under an internal investigation or litigation hold.
- **Individual staff conduct or performance content** about a named person.
- **Anything `hooks/pii-guard.sh` would block in the repository** — Emirates-ID-shaped literals
  (`784` + 12 digits, separator-insensitive) and real-shaped UAE IBANs (`AE` + 21 digits whose
  bank code is not `000`).

**The pii-guard patterns are the floor of this list, not the ceiling.** The hook knows exactly
two shapes, in one jurisdiction. Every other item above is unenforced by any automated control
that exists today.

## 6 · Pre-egress filtering (plan deliverable D0.4)

### 6.1 · What must be automatically enforced before content leaves git

The projector must not be a general-purpose copier with a blocklist bolted on. The design
delivered under D0.4 must enforce, at minimum:

1. **An explicit field allow-list, deny by default.** The projector emits only field paths
   named in §4/§4.1. An unrecognised field is withheld, never passed through. A schema change
   upstream produces a withheld field and a signal, not a silent new disclosure.
2. **Fidelity enforcement, not just field selection.** A field marked *summary* is rendered
   through a bounded, schema-fixed transform; a field marked *reference + status* emits
   identifiers and states only. Free text never reaches the floor verbatim by default.
3. **Pattern denial over every outbound payload.** The `pii-guard` patterns, plus whatever the
   institution's DLP contributes, run on the rendered payload — after transformation, not
   before, so a summary cannot smuggle what the source contained.
4. **Fail closed, and fail visibly.** A pattern hit withholds the whole record and marks it
   *withheld — filter hit* on the floor, with a signal raised. Partial emission is forbidden:
   a half-projected record reads as complete.
5. **No attachments, no binaries, no evidence payloads.** Evidence projects as digest plus
   status. Screenshots and files never project.
6. **A withheld-log committed to git.** Every cycle records what was withheld and why. This is
   the only artifact by which the filter's operation can later be reviewed, and it is the
   evidence base for §9's sampling.
7. **Determinism and replay.** The same input produces the same payload, so a diff between
   cycles is a real change and not filter noise.

### 6.2 · The honest statement

**A filter is a control, not a guarantee**, and this one is weaker than its placement suggests:

- **It is directional.** It governs git → floor. It has no visibility into what a person types
  into a Notion page, pastes into a comment, or drags in as an attachment. Every
  floor-authored class in §4 — the discovery drafts, the research log, D9 reactions, interview
  notes — sits entirely outside its reach. For those, the control is the template's built-in
  discipline plus a human reading before freeze. That is a real gap, not a residual detail.
- **It matches shapes, not meaning.** An Emirates ID has a shape. A customer's name in a
  free-text finding does not. Against structured identifiers the filter is preventive; against
  unstructured disclosure it is close to useless, and no amount of pattern tuning changes that.
- **It is adopter-side wiring.** Per the adapter contract, sync machinery lives outside the
  harness core, so no gate in the bundle can assert the filter is present, current, or
  correctly configured. Its liveness must be observed the way platform activation is observed —
  a live probe, bypass-tested, signed by the independent observer of P4 — or it is *declared,
  not active*, and must be labelled so.
- **It cannot recall.** Once content reaches the vendor, deletion is a request, not an
  operation (§7, §8).

**AWAITING:** information-security agreement on which of the institution's existing DLP
capabilities apply to this egress path, and whether any of them can be placed inline.

## 7 · Data subjects, consent, retention, and leavers

### 7.1 · Whose personal data the floor holds by construction

Independently of any content decision, the workspace holds: member names and work contact
details, IdP subject identifiers through the P6 mapping, comment and edit authorship, page
history, presence, approval timestamps, and agent-interaction transcripts. This is inherent to
the product. "Never personal data" therefore means *never customer personal data, and never
staff personal data beyond membership and authorship* — it cannot mean literally none, and this
record will not pretend otherwise. **INSTITUTION-SPECIFIC:** this processing must appear in the
institution's processing record with a named purpose and lawful basis before WS1.

### 7.2 · Interview and meeting notes

Catalog C's interview-note template carries PII discipline as a built-in: pseudonymous
participant ids (`P-01`), role and segment only, no direct identifiers, and a consent property
that must be set before the note can be cited into a research log. Three things are missing and
cannot be written here:

- **AWAITING:** the consent wording participants are given, supplied by data protection.
- **AWAITING:** the lawful basis for recording and retaining interview notes in an external
  service, and whether that basis differs for staff, customers, and third parties.
- **INSTITUTION-SPECIFIC:** where the consent record itself lives. It is personal data; storing
  it beside the note keeps it findable and puts it in the same jurisdiction as the note.

Until all three exist, catalog C's interview template must not be used to record a real
interview with an external participant.

### 7.3 · Retention

No content class on the floor has a retention period today. Required before WS1:

| Class | Proposed basis | Needs |
|---|---|---|
| Projected classes (backlog, changes, control plans, MI, signals, registry) | Derived — deletable and re-projectable at will | A short retention (proposed: current state only, history not retained on the floor). **AWAITING:** confirmation |
| Floor-native notes (catalog C) | Deletion is destructive; these are cited evidence | A retention period tied to the discovery run's own retention. **INSTITUTION-SPECIFIC** |
| Approval pages and their comment threads | Supporting material to a decision whose record is in git | **INSTITUTION-SPECIFIC:** retained as supporting audit material, or purged once the envelope merges? |
| Agent interaction transcripts (floor-keepers) | Vendor-side by construction | **VENDOR-QUESTION:** are they retained, for how long, and are they deletable? |

### 7.4 · Deletion, erasure, and the immutable record

Two of this programme's commitments pull in opposite directions and the tension must be stated,
not discovered later:

- The git record is **deliberately immutable and tamper-evident** (HG-0003). Approver names and
  timestamps in merged governance files are part of the audit record and are retained on a
  legal/regulatory-obligation basis. **An erasure request cannot be honoured by rewriting the
  record.**
- Floor content is **not** the record and generally can be deleted — but "deleted" in a SaaS
  means trash, then workspace restore windows, then backups, then sub-processor copies (§8).

**INSTITUTION-SPECIFIC:** the institution's position on this tension, written down, before the
first data-subject request rather than during it. **AWAITING:** data-protection ruling on who
assembles a subject-access response that now spans git and the floor, and within what timetable.

### 7.5 · Leavers

When a person leaves, deprovisioning removes their access. It does not remove their authorship:
comments, page history, and approval-page entries remain attributed. The registry entry is
retired; merged git records naming them stay. **AWAITING:** data-protection decision on whether
floor attribution is retained (audit traceability) or anonymised at deprovisioning (data
minimisation), and how the P6 mapping records a retired subject so the extended PA gate keeps
resolving historic approvals correctly.

## 8 · Questions the institution must answer about the vendor

These are questions, not findings. **No contractual, regional, or assurance fact about the
vendor is asserted anywhere in this record.** Each must be answered from the executed contract,
the DPA, or the vendor's current assurance pack, with the source and date recorded beside the
answer.

**Location and processing**

1. **VENDOR-QUESTION:** In which jurisdictions is workspace content stored at rest under the
   contracted tier? Is a region the institution accepts available, and is it contractual or
   best-effort?
2. **VENDOR-QUESTION:** Where is content *processed*, including by AI features — Custom Agents,
   Workers, connectors, enterprise search? Which model providers see page content, in which
   jurisdictions, under what terms?
3. **VENDOR-QUESTION:** Where do Workers execute, and where do webhook payloads transit?
4. **VENDOR-QUESTION:** Is workspace content used to train or improve models, by the vendor or
   any model provider? Can that be disabled contractually at the contracted tier, and is the
   setting auditable?

**Sub-processors**

5. **VENDOR-QUESTION:** What is the current sub-processor list, with locations and functions?
6. **VENDOR-QUESTION:** What notice is given before a sub-processor is added or changed, and
   does the institution have a right to object — with what consequence if it does?

**Retention, deletion, termination**

7. **VENDOR-QUESTION:** What happens on deletion — trash period, workspace restore window,
   backup retention, log retention? What is the maximum elapsed time to complete erasure across
   all copies?
8. **VENDOR-QUESTION:** On termination, what is returned, in what format, on what timetable —
   and what is deleted, with what evidence of deletion?

**Assurance and access**

9. **VENDOR-QUESTION:** What audit rights exist, and which recognised assurance reports are
   available and current (SOC 2 Type II, ISO 27001, ISO 27018, ISO 42001, penetration-test
   summaries)?
10. **VENDOR-QUESTION:** Under what conditions can vendor personnel access workspace content?
    Is there an approval or lockbox mechanism, and is such access logged and visible to the
    institution?
11. **VENDOR-QUESTION:** Encryption at rest and in transit — and is customer-managed key
    material available at the contracted tier?
12. **VENDOR-QUESTION:** How are third-country legal-process requests for content handled, and
    is the institution notified where lawful?
13. **VENDOR-QUESTION:** What is the contractual breach-notification timetable, and does it meet
    the institution's own regulatory notification obligations?

**Institutional**

14. **INSTITUTION-SPECIFIC:** Is this vendor already on the approved-vendor list, at what
    classification tier, and does the intended content class table fit inside that approval?
15. **INSTITUTION-SPECIFIC:** Does this arrangement meet the materiality threshold for
    outsourcing, and does it require regulatory notification or no-objection before WS1?

**Identity** — added after the identity-mapping specification (`notion-floor-identity-mapping.md`
§6, drift class D-C) surfaced it; it is not a residency question, but it is a vendor question and
it belongs in one list.

16. **VENDOR-QUESTION:** Does the vendor document a **person-id reassignment policy**? Can a
    workspace person UUID ever be reissued to a different human — after deprovisioning and
    re-provisioning, a domain migration, or an account merge? If ids are never reused, drift
    class D-C is bounded and reconciliation is a periodic check. **If there is no documented
    policy the risk is unbounded**, reconciliation becomes the only defence, and its cadence —
    an operational cost — has to be set against that.

## 9 · Residual risks proposed for acceptance

Proposed, not accepted — acceptance is what the signatures in §10 would confer.

| # | Risk | Why it cannot be engineered away | Proposed compensating controls | Proposed rating |
|---|---|---|---|---|
| R1 | Unstructured disclosure — a person types customer detail into a floor page or comment | No filter stands between a keyboard and the floor (§6.2) | Template discipline; PII banner on every catalog-A/C template; a second reader before freeze; quarterly sampling (§9.1) | **Medium-high** |
| R2 | Vendor-side AI processing of floor content outside the institution's model gateway | Inherent to using the vendor's AI features; direct tension with HG-0011 | The §4 ceiling — floor-keepers only ever see content already cleared to leave the gateway; answers to §8 Q2/Q4 may force features off | **Medium**, pending §8 |
| R3 | Over-broad workspace visibility | Page and database grants are not property-level protection; a grant is coarse | Teamspace scoping; approval fields held in databases where agents hold no grant at all (plan D6.3); least-privilege membership review | **Medium** |
| R4 | Retention and erasure uncertainty | Unanswerable until §8 Q7/Q8 are answered | Keep floor-native content minimal; prefer derived, re-projectable content | **Open — unratable today** |
| R5 | Staff personal data in a SaaS, permanently attributed | Inherent to the product (§7.1) | Processing record entry; leaver decision (§7.5); minimisation of what is written about people | **Medium** |
| R6 | Aggregation — many innocuous references become a readable picture of an unannounced regulated change | The board's usefulness *is* aggregation | Access scoping; the timing question raised with the change owner before projecting a material change | **Medium** |
| R7 | Identity-mapping drift across Notion ↔ IdP ↔ registry | Three systems, three lifecycles | P6 owns the mapping; the extended PA gate rejects unmapped subjects; deprovisioning reconciliation | **Medium** |
| R8 | The filter is unobservable to the harness | Adopter-side wiring, outside every bundled gate | Withheld-log in git; activation-style observation signed by the independent observer; *declared, not active* labelling until then | **Medium** |

**AWAITING:** risk-second-line ratings — the ratings above are the drafter's proposals and carry
no authority.

### 9.1 · Evidence that this record is being followed

Approval of a paper posture proves nothing about practice. Proposed, and required for the record
to remain credible past M1:

- **Quarterly sampling** of floor content against §5, by a reviewer outside the builder group,
  with the sample size, method, and findings recorded in git.
- **Withheld-log review** each milestone: every filter hit read, and any hit that indicates
  attempted disclosure of a §5 class escalated as an operations signal.
- **A named breach path**: what a teammate does the moment they realise prohibited content
  reached the floor. **AWAITING:** the institution's incident route, named in the floor's own
  onboarding page.

## 10 · Review cadence

This record is versioned in git and changes only by pull request under second-line CODEOWNERS,
with a second human at the merge (HG-0001). It must be re-reviewed:

| Trigger | Reviewers |
|---|---|
| Before each milestone M1–M5 — each milestone changes which classes are live | Data protection + risk-second-line |
| Any new content class, or any fidelity increase for an existing class | Data protection + risk-second-line |
| Any change to the pre-egress allow-list or the filter's transforms | Data protection + information-security |
| Any vendor change to region, sub-processors, AI features, or retention (§8) | Data protection + information-security |
| Any confirmed filter hit indicating a §5 class reached the floor | Risk-second-line, as an operations signal |
| Change in PDPL or CBUAE cloud/outsourcing expectations | Data protection + compliance |
| Otherwise, annually at minimum | Data protection + risk-second-line |

**AWAITING:** confirmation that annual is the correct floor for this institution; some cloud
registers require semi-annual review for material arrangements.

## 11 · Sign-off

P1 requires data-protection and risk-second-line approval, as a signed record in git. Each
signatory must resolve to a registry identity in `harness/governance/identities.json` holding
the named role; the merge is subject to the four-eyes rule, and builders may not sign.

| Role (registry) | Name | Registry identity | Decision | Date |
|---|---|---|---|---|
| `data-protection` | **AWAITING** | **AWAITING** | **AWAITING** — approve / approve with conditions / refuse | **AWAITING** |
| `risk-second-line` | **AWAITING** | **AWAITING** | **AWAITING** — approve / approve with conditions / refuse | **AWAITING** |

**AWAITING:** confirmation of whether the institution's own policy requires additional
signatures on a record of this kind — information-security, legal, compliance, or the
accountable executive. P1 names two; this record does not presume to widen or narrow that set.

**Conditions attached by signatories** — to be filled by the signatories themselves, not by the
drafter:

> **AWAITING:** conditions, if any.

### The blocking statement

**Until both required signatures are recorded above and this record is merged, WS1 onward remain
blocked.** Within WS0 that means specifically:

- **D0.3 workspace scaffold must not be built.** No teamspace, no databases, no dashboards — no
  workspace construction of any kind.
- **P3's integration token must not be issued or vaulted**, and no service identity may be
  granted workspace access.
- **No content of any class may be projected, pasted, or authored on any floor surface**,
  including for demonstration or evaluation purposes.
- Only the paper deliverables may proceed: **D0.2** (registry and issuer entries), **D0.4**
  (threat model, identity mapping, capability matrix, filter design), and **D0.5** (the API
  compatibility ADR).

An unsigned record is not a soft start. The plan states that P1 gates everything; this document
is that gate, and it is currently shut.
