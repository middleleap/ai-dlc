---
name: institution-intake
description: Run the institutional intake — the guided Q&A that sets an institution's scene BEFORE any problem is run through the Loom. Interviews the accountable roles (brand, architecture, technology, risk, data protection, finance, operations) block by block and sorts every answer into SOURCED (a document backs it → source-register skeleton), CLAIMED (a person said it → gap register with an owner) or UNKNOWN (→ escalation), so brainkit-init has approved sources to draft from and the owners have a review agenda. Covers identity and brand, terminology, architecture, technology policy and radar (no-fly zones, trials), decision rights, strategic intents, the investment and business-case process, and how the institution will work the Loom. Never invents policy, never approves, never treats an answer as an approved source. Use when an institution is starting with the Loom, a repository is about to adopt the BrainKit with no sources gathered, or someone asks what the institution needs to prepare.
---

# Institutional intake — setting the scene before the first problem

> **Identifiers.** Gate ids (`D1`–`D9`, `Q1`–`Q5`) and run-level ids are expanded in
> `../loom/references/glossary.md`. BrainKit concepts are in `../loom/references/brainkit.md` —
> read it first, because everything this skill produces is an input to it.

A harness alone is generic. What makes the Loom produce *this* institution's software is context,
and most of that context exists before the first discovery run in the heads of a dozen people and
in documents nobody has listed. This skill gets it out, **without turning conversation into
policy**. You interview; you sort what you heard into what is backed by a document, what is a
claim, and what nobody knows; you hand the result to `brainkit-init` and to the accountable owners.

```
institution-intake ──► source-register skeleton + gap register + intake record
                  ──► brainkit-init (drafts the BrainKit from the SOURCED answers)
                  ──► accountable owners review the gaps, approve, seal
                  ──► the first discovery run reads an approved BrainKit
```

`assess.mjs` tells you where a **repository** stands. This skill tells you where the
**institution** stands. Neither is a control; both are honest inventories.

## Absolute rules

1. **An answer is not a source.** The BrainKit's first rule is that every section grounds in an
   *approved institutional source*. A person telling you the brand colour, however senior, is a
   claim until you have the brand guideline it comes from. Every answer therefore gets exactly one
   disposition, and only the first one reaches a BrainKit section:

   | Disposition | Means | Goes to |
   |---|---|---|
   | **SOURCED** | The interviewee named a document, register or signed decision that states it | `source-register.json` skeleton (kind, reference, `approved_by` as a *role* until a human confirms) |
   | **CLAIMED** | Stated from experience or memory; no document exists or none was named | Gap register, with the role who would own writing it down |
   | **UNKNOWN** | Nobody interviewed could say | Gap register, flagged for escalation through `governance.md` |

2. **Never invent, never fill in.** If a block yields nothing, the block is empty and the gap
   register says so. A plausible default is exactly the thing this skill exists to keep out.
3. **Never approve.** You do not set anything to `approved`, do not name approvers, and do not
   describe the intake record as authoritative. It has `authority: none`, like every floor artifact.
4. **Roles, not names.** The intake record is a floor-class artifact about how an institution works,
   and it will be read for years. Interviewees appear as roles (`R-03 · head of architecture`).
   Names live only in the identity registry, which is the institution's to maintain.
5. **Ask for the document, not the answer.** "Where is that written down?" is the most useful
   sentence in the whole interview. If it is not written down, you have found a gap, which is the
   second most useful outcome.

## 0. Start from the questionnaire, interview only the gaps

Most of the intake does not need you in the room. `intake/questionnaire.html` (installed at the
full tier; in the bundle, `loom-adopt/harness/intake/`) is the same nine blocks as a form each
role opens **locally in a browser** and answers on their own time. Every question carries the
second field — *where is this written down?* — so the form computes the disposition the way you
would: an answer with a reference is SOURCED, without one CLAIMED, blank is UNKNOWN. A pre-fill
pack (`intake/prefill/<pack>.json`, e.g. `uae-bank`) suggests answers from the bundle's profiles;
the form says beside every suggestion that confirming it does **not** make it sourced. Answers
save in the respondent's browser and export as `intake-record.json`.

1. Send each role the file and the block letter that is theirs. Roles, never names, in the
   "answering as" field.
2. Collect the exports. Place the merged record at `institution/intake/intake-record.json`
   (the form's **Import** button merges a second person's export into the first).
3. `node scripts/intake-check.mjs` — shape only: the schema id, `authority: none`, dispositions
   that agree with their content, roles not names, and whether the record answers the current
   question bank. **It judges nothing about the institution.**
4. Read the record. Every CLAIMED and UNKNOWN answer is your interview agenda; every SOURCED
   answer is a source-register entry waiting for a human to confirm `approved_by`. Interview only
   the gaps, in the blocks below.

The question bank is `intake/questions.json`; the HTML is generated from it
(`node intake/build-questionnaire.mjs`) and `intake-check` fails when they disagree. Add or reword
a question there, never in the HTML, and rebuild.

## Who to interview

One person per role is enough for a first pass; a role nobody holds is itself a finding.

| Role | Blocks they answer | Why them |
|---|---|---|
| Head of brand / communications | A | Owns the design language and the tone the D7 seam projects |
| Head of architecture | C, D | Owns principles, constraints, material-change triggers and the technology policy |
| CTO office / platform lead | D | Knows what is actually being trialled, and where the resolver points |
| Risk, second line | E, G | Owns decision rights over risk, and the data-risk register |
| Data protection officer | G, I | Owns the residency position and the PII rules the floor depends on |
| Head of strategy / product | F, H | Owns the strategic intents and the investment process |
| Finance / investment committee secretary | H | Knows the thresholds, the hurdle rate, the stages, and who signs |
| Operations / service management | I | Knows what "live" costs, and who is paged |
| The would-be Loom facilitator | I | The one technical person who will run the machine |

## The blocks

Run one block per session where you can. Each block lists the questions, and the BrainKit home
for a SOURCED answer. Where no home exists yet, the block says so, and the answer goes to the gap
register with the proposed home named — that is honest state, not a bug in the interview.

### A · Identity and brand → `identity/design.md`

- Is there a brand guideline? Where does it live, who owns it, when was it last approved?
- Colour tokens, typography, logo rules, spacing — as tokens, or only as pictures in a PDF?
- Tone of voice rules? A word list of what the institution never says about itself?
- Which output media must look institutional: documents, decks, spreadsheets, web, wireframes?
- Is there a right-to-left or multi-language requirement (`lang`/`dir`)?
- Who signs off a new template today, and how long does it take?

### B · Terminology → `terminology.md`

- Is there a glossary? A data dictionary? A regulatory vocabulary the institution has adopted?
- Which words are contested internally (two departments, two meanings)? List them; a contested
  term is a CLAIMED until one side's document wins.
- Which product and customer terms are legally defined and must not be paraphrased?

### C · Architecture principles → `architecture.md`

- Are there written architecture principles? An architecture review board with a charter?
- Binding constraints: data residency, integration patterns, hosting posture, identity provider.
- What makes a change "architecture-material" here — what fires a review? (This becomes the
  `architecture_material` trigger in the institution profile.)
- Which reference architectures or patterns are mandated, and where are they?

### D · Technology policy and radar → `technology-policy.json`

- The **no-fly zone**: technologies that must not be introduced, and the approved rationale.
  Forbidden without a written reason is a CLAIMED.
- The **allowed** set: the standard language, runtime, data platform, cloud, and the document
  that says so.
- The **consult** set: what needs whose sign-off before use.
- Standards the institution has adopted (internal or external), by reference.
- The **registry**: is there a curated package mirror or hardened-libraries supplier? Does the
  resolver fall back to the public index? Who owns the resolver config? (These are the
  `registry.*` fields; an unenforced registry is the honest answer if that is the case.)
- The **radar**: what is being *assessed*, *trialled*, *adopted*, *held*, and by whom — each
  with a date it was decided and a date it is re-decided (`review_by`, or `exit_by` for a hold).
  These are the `radar.entries` of `technology-policy.json`. A ring with no owner or no source is
  a CLAIMED; a "we're looking at it" with no review date is not on the radar yet.

### E · Decision rights → `governance.md` and the identity registry

- Who decides: product scope, architecture, risk acceptance, data-protection questions,
  brand exceptions, technology exceptions, release to production?
- Where is that written — a delegated-authorities matrix, committee terms of reference?
- How does a decision escalate when authority is unclear?
- Who are the humans behind the roles the Loom needs in `docs/governance/identities.json`:
  product owner, engineering, risk second line, compliance, legal, operations, data protection,
  accountable executive, institutional-context owner? A role with no human is a gap.
- Who is the **second human** who merges what the facilitator proposes? It is never the
  facilitator.

### F · Strategic intents → `strategy.md`

- What are the institution's stated strategic intents for the next planning horizon, and where
  are they written (strategy paper, board pack, OKRs)?
- For each, a stable id (`SI-01`, `SI-02`, …), one sentence, the owner role, and the measure the
  institution already uses to track it.
- Which intents are explicitly *not* being pursued this cycle? (A problem that serves a parked
  intent should know it.)

**Honest state:** `strategy.md` is canonical from BrainKit schema 1.1 (2.2.0), so a SOURCED
intent has a home and `brainkit-check` will refuse an approved package that omits the section.
What is still true: **no gate reads `SI-*`**. A problem statement or business case citing an
intent is prose the decision authority reads, not a mechanical check.

### G · Regulated context → *pointers only*

- Which regulators, which regimes, which jurisdictions? Point at the data-risk register
  (`docs/governance/data-risk-register/`) and the obligations register; **do not** copy content.
- Does a register exist at all? Who owns it? When was it last reconciled against the regulation?
- Is there a jurisdiction profile per market, or one market only?

### H · Investment and the business case → the `business-case.md` template's `ADOPT` markers

- Who approves funding for change, at what thresholds? One stage or two (pre-screen, full case)?
- What financial method is mandated: hurdle rate, horizon, NPV / IRR / payback, currency?
- Which benefit categories does finance recognise, and which does it refuse (e.g. "avoided risk"
  without a quantified exposure)?
- How are benefits tracked after launch today, and by whom? Does anyone ever go back?
- Which **non-build costs** does the institution routinely under-count: organisational change,
  training, legal and contractual work (NDAs, outsourcing notifications, vendor onboarding),
  control-function time, operations and run, decommissioning?
- Is there an existing business-case template? If so it is a SOURCED answer and the Loom's
  template is filled *from* it, never the other way round.

### I · Working the Loom → the residency record, the floor, the facilitator

- Where may institutional and personal data live? Is a collaboration workspace already approved
  for it? Who — data protection and risk second line, two different people, neither a builder —
  would sign the residency record?
- Which workspace tool would a Factory Floor project into, if any?
- Who is the facilitator? Do they have Claude Code and the plugin today?
- What is the institution's PII rule for interview notes and meeting notes? (If there is none,
  the floor's catalog-C banner is the rule until one is written, and that is a gap.)

## Outputs

Write all three; hand the first two to `brainkit-init`. Where a questionnaire record exists, the
first two are largely derived from it — the record's SOURCED answers become source-register rows,
its CLAIMED and UNKNOWN answers become gap-register rows — and you add only what the gap interviews
surfaced.

1. **`institution/brainkit/source-register.json` skeleton.** One entry per SOURCED answer: `id`,
   `title`, `kind` (`policy` · `standard` · `decision` · `brand` · `register-pointer`),
   `reference`, and `approved_by` left as `ADOPT: <role>` until a human confirms in writing.
   If the file already exists, **reconcile, do not overwrite** — append and mark provenance.
2. **`institution/intake/gap-register.md`.** Every CLAIMED and UNKNOWN answer: the block, the
   claim as stated, the owning role, the disposition, and the proposed home (a BrainKit section,
   a proposed new field, or "institution's own document to write"). This is the owners' review
   agenda before they approve anything.
3. **`institution/intake/intake-record.md`.** Front-matter `authority: none`, the date, the roles
   interviewed (`R-nn`), and per block the answers with their dispositions. It is a record of
   what was said, not of what is true. No names. No customer detail.

Then **report exactly**: how many answers were SOURCED, CLAIMED, UNKNOWN; which roles were not
available; which blocks are empty; and the sentence *"nothing in this intake is approved"*. Hand
off to `brainkit-init` with the source-register skeleton, and to the accountable owners with the
gap register.

## What this skill is not

- **Not the BrainKit.** It produces inputs. `brainkit-init` drafts; owners approve; `brainkit-check`
  enforces. Nothing this skill writes is read by any gate.
- **Not a maturity assessment.** It does not score the institution. An institution with forty
  gaps and honest owners is in better shape than one with none and a confident interviewee.
- **Not a substitute for the documents.** If the interview surfaces that the brand guideline is
  a 2019 PDF nobody can find, the output is a gap that says so, and the first task is to find or
  re-approve it — not to transcribe the interviewee's memory of it into `identity/design.md`.
