# P1 decision worksheet — the twelve open items, each with a proposal to react to

**Companion to** [`notion-floor-p1-reviewer-brief.md`](notion-floor-p1-reviewer-brief.md) (what you
are signing) and [`notion-floor-p1-vendor-questionnaire.md`](notion-floor-p1-vendor-questionnaire.md)
(what the vendor must answer). The record itself is
[`notion-floor-residency-review.md`](notion-floor-residency-review.md).

## What this is, and what it is not

The record carries twelve **AWAITING:** items — human decisions that do not exist yet. Today a
signatory meets them as twelve blank pages. This worksheet turns each one into something to
**react to**: a proposal with its reasoning, or an explicit statement that no defensible default
exists and what the answer must therefore contain.

**This document decides nothing.** It is written by the drafter, who is a builder and cannot sign.
Every proposal here is a proposal in exactly the sense §9's risk ratings are: *"the drafter's
proposals, carrying no authority."* Accepting all twelve does not constitute signing §11 — the
signature is a separate act, by two different people holding the named registry roles.

**Why it is a separate file.** The record's `AWAITING` markers are load-bearing: they are what
makes the gate visibly shut. Writing proposals into them would replace twelve honest blanks with
twelve things that read like answers. So the record stays untouched and the proposals live here.

**How to use it.** For each item: accept, amend, or reject. An accepted proposal is written into
the record **by the signatory, in their own words**, replacing that `AWAITING`. A rejected one
leaves the `AWAITING` standing. Four items below have no proposal by design; those need an answer
composed by the function that owns them.

---

## A · Items with a proposal the drafter will defend

### A1 · Retention for the projected classes — §7.3, record line 280

> **AWAITING:** confirmation that "current state only, history not retained on the floor" is the
> correct retention basis for backlog, changes, control plans, MI, signals and registry.

**Proposal: confirm as written.** These classes are *derived*. Git holds the record; the floor
holds a re-projectable view. Retaining their history on the floor therefore adds a second,
lower-controlled copy of an audit trail that already exists in a higher-controlled place — pure
exposure for no evidential gain. If the floor's history is ever needed, it is reconstructable from
git; if git's history is gone, the floor's copy is not the thing that saves you.

**Consequence if accepted:** the projector may overwrite rather than append, and the retention row
stops being an open question for six of the seven classes.

### A2 · Leaver attribution, and how P6 records a retired subject — §7.5, record line 305

> **AWAITING:** whether floor attribution is retained (audit traceability) or anonymised at
> deprovisioning (data minimisation), and how the P6 mapping records a retired subject so the
> extended PA gate keeps resolving historic approvals.

**Proposal: retain attribution; retire the mapping without deleting the pivot.** Two halves.

*Attribution* — retain. Floor approval-page entries are supporting material to a decision whose
record is in git, and the git record names the person on a legal/regulatory-obligation basis (§7.4).
Anonymising the floor copy while the git copy stays named does not minimise anything; it only makes
the two disagree, and a governance record that disagrees with its own supporting material is worse
than one that is merely verbose.

*The mapping* — the P6 entry must be marked `retired` while **preserving `sub`**, the immutable IdP
subject. This is not a preference, it is a correctness requirement: `product-approval-check`
resolves historic approvals through the mapping, so deleting the pivot retroactively invalidates
every approval that person ever gave. A retired-but-resolvable entry keeps history verifiable while
carrying no live capability.

**Consequence if accepted:** one flag on the mapping schema, and deprovisioning gets a documented
step. **Note this is the one item here with a code consequence** — if the ruling goes the other way
(anonymise), the extended PA gate needs a redesign, not a config change, and that should be known
before WS1 rather than discovered at the first leaver.

### A3 · The two reference-plus-status downgrades — §4.1, record line 161

> **AWAITING:** confirmation from risk-second-line that the CBUAE-notification-rationale and
> credit-risk-limit-changes downgrades are correct, and that no further section needs downgrading.

**Proposal: confirm both, and scrutinise `data-and-models` next.** The two downgrades are the right
call for the stated reason — supervisory-sensitive rationale and limit changes have no audience on
a collaboration surface, and their absence costs the floor nothing it was useful for.

Where the drafter would look next is **`data-and-models`**, currently *Summary*: `personal_data`
boolean plus category **names**. Category names are exactly the input R6's aggregation risk feeds
on — "biometric", "location", "health" across several changes sketches a roadmap. The drafter did
not downgrade it because doing so would strip the field a reader most needs to ask a sensible
question. That trade-off is risk-second-line's to make, not the drafter's, and it is the section
most likely to deserve a third fidelity tier rather than a binary.

### A4 · Re-review cadence — §10, record line 423

> **AWAITING:** confirmation that annual is the correct floor; some cloud registers require
> semi-annual review for material arrangements.

**Proposal: make it conditional on Q15, not a fixed interval.** Semi-annual if the vendor's answer
to questionnaire Q15 makes this a material outsourcing arrangement; annual otherwise. Writing a
flat "annual" now means either over-reviewing a non-material arrangement or under-reviewing a
material one, and which it is depends on an answer nobody has yet. The seven event-driven triggers
in §10 do the real work in either case; the interval is only the floor beneath them.

### A5 · Information-security's platform assessment — §3, record line 89

> **AWAITING:** confirmation from information-security that a platform assessment is in scope for
> them and scheduled before WS1.

**Proposal: treat this as a routing confirmation, and record a refusal as a condition.** This is
not a judgment call — it is a question about someone else's work plan, and the only wrong outcome is
leaving it unasked. The one thing worth stating in advance: if information-security says a platform
assessment is *not* in scope for them, that answer belongs in §11 as an attached condition, not in a
mailbox. An unowned assessment is materially different from a scheduled one, and the record should
say which it is.

### A6 · DLP capability on the egress path — §6, record line 243

> **AWAITING:** information-security agreement on which existing DLP capabilities apply to this
> egress path, and whether any can be placed inline.

**Proposal: accept "none" as a valid answer, and hold R8 at *declared, not active* until one is
inline.** The brief already says an answer of "none" is a finding rather than a blank; the worksheet
adds the consequence. The pre-egress filter is adopter-side wiring that no bundled gate can see —
that is R8. Until a named capability sits inline and its liveness is observed the way platform
activation is observed (live probe, bypass-tested, independently signed), the filter must stay
labelled *declared, not active*. "We intend to add one" does not change the label; an observation
does.

### A7 · Subject-access responses spanning git and the floor — §7.4, record line 298

> **AWAITING:** data-protection ruling on who assembles a subject-access response that now spans
> git and the floor, and within what timetable.

**Proposal: existing owner, existing clock, new extract step.** Whoever assembles subject-access
responses today keeps assembling them; the floor becomes one more source they must query, and the
programme owner owes them a documented extract procedure. The timetable should be the institution's
existing statutory clock, **not** a new one negotiated for this programme — a bespoke timetable for
one system is how a system ends up outside the process.

What genuinely needs deciding, and is not the drafter's to decide, is the **split answer**: floor
content is generally erasable, git governance records are generally not (§7.4). The response has to
explain that split to a data subject in terms they can act on. That wording is data protection's.

---

## B · Items with no defensible default — what the answer must contain

For these four the drafter declines to propose. Not because they are hard, but because a plausible
default would anchor a decision that carries legal or institutional consequence, and a confident
wrong default is worse than a blank. What is offered instead is the shape the answer must have.

### B1 · Consent wording for interview notes — §7.2, record line 265

Consent wording is operative legal text; drafting it here would put words in data protection's
mouth and they would be quoted. **What it must cover:** that notes are recorded and held in an
external processor; which region; that participants are pseudonymised to `P-01`-style ids with role
and segment only; the retention period once B2 is settled; and the withdrawal route, including what
withdrawal means for a note already cited into a research log.

### B2 · Lawful basis for interview notes in an external service — §7.2, record line 266

A PDPL basis selection is a legal determination and the record says plainly that nothing in it is a
legal opinion. **What the answer must resolve:** the basis itself; whether it differs across staff,
customers, and third parties — the record flags that it may, and the three populations genuinely
differ in expectation and in the leverage the institution has over them; and if the basis is one
requiring a balancing assessment, where that assessment lives. This is the item most likely to
change catalog C's template rather than merely annotate it, so it is worth answering early.

### B3 · The breach path — §9.1, record line 405

**What the answer must be:** an *existing* incident route, named. Not a new one. A teammate who has
just realised prohibited content reached the floor needs three facts on the onboarding page — who to
tell, how, and what not to do first (do not delete it; deletion in a SaaS destroys the evidence of
scope while not achieving erasure, per §7.4). A programme-specific breach path is a second process
that will be followed less well than the first one.

### B4 · Whether policy requires signatures beyond the two — §11, record line 437

P1 names two, and the record deliberately declines to widen or narrow that set; the drafter must
decline likewise. One clarification that may prevent a false third signature: if
information-security scopes the platform assessment under A5, that produces its **own artifact with
its own sign-off** — it is not a third signature on this record. Distinguishing those two keeps the
count honest.

---

## C · What is not in this worksheet

- **§9's risk ratings** (record line 392) are already marked as the drafter's proposals. They need
  ratifying by risk-second-line, and **R4 is explicitly unratable today** — it depends on
  questionnaire Q7/Q8. A rating supplied for R4 before those answers arrive would be invented.
- **INSTITUTION-SPECIFIC** items — consent-record location, floor-native note retention, approval-page
  thread retention, and the institution's position on the erasure/audit tension — are not
  `AWAITING` decisions with missing answers. They are questions the Loom cannot answer at all, and
  no proposal from the drafter would be worth reading.
- **VENDOR-QUESTION** items belong to the questionnaire, not here.

## D · Where this leaves the gate

Unchanged, and deliberately. Twelve accepted proposals plus two signatures unblocks WS1. Twelve
accepted proposals alone unblocks nothing: §11 stays `AWAITING`, and the blocking statement stands —
no workspace scaffold, no token issued, no content of any class on any floor surface. What this
worksheet buys is a cheaper review, not a shorter one.
