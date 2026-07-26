# Residency review record — **WORKED EXAMPLE**

> ## ⚠️ THIS IS A SPECIMEN. IT APPROVES NOTHING.
>
> It exists to show an adopter what a **completed** P1 looks like, because the live record
> (`notion-floor-residency-review.md`) is a draft in which every human decision is an `AWAITING`
> placeholder — which tells you the shape of the questions but not the shape of an answer.
>
> **The signatories below are fictional.** They are the shipped example registry's identities, used
> so the roles resolve when you read them, not because anyone signed anything. **No content class
> is authorised by this file. No workspace may be built on it. WS1 remains blocked.** The gate is
> the live record, and the live record is still shut.

**Status:** ILLUSTRATIVE · **Recorded:** 2026-07-26 by **@michartmann**, repository owner, *for the
method* · **Companion:** the live record it models, `docs/notion-floor-residency-review.md` ·
**Programme:** Factory Floor (`docs/notion-floor-plan.md`).

---

## Scope of this record — what it does and does not confer

Written in the style of `docs/adrs/0005-human-assertion-mechanism.md`, because the same three
misreadings are available here and each one would be worse.

**It confers nothing.** Not permission to build a workspace, not permission to issue a token, not
permission to project a single line of content. P1 gates the programme through the *live* record,
which still carries two `AWAITING` signatures. Filling this specimen in does not fill those.

**It is not an institution's decision.** A residency approval is made by an institution's own
data-protection and risk functions over that institution's own data, contract and jurisdiction.
This repository is a method and a harness; it holds no customer data and has no CBUAE licence. The
repository owner can decide what the *method* says a signed P1 looks like. He cannot decide what an
adopting bank may send to a vendor, and this file does not pretend otherwise.

**It is not a template to copy signatures from.** Copy the *shape* — the ratings-with-reasons, the
conditions, the record of what the signatories changed. Copying the names would be the governance
equivalent of the demo trust anchor the harness now refuses outright: a credential that means
nothing, sitting where something meaningful should be.

**What it is for.** Three things the draft cannot demonstrate: that a signatory is expected to
**change** the drafter's ratings rather than accept them; that some risks are honestly **unratable**
at signing time and there is a correct way to record that; and that "approve" in a regulated
context normally means "approve **with conditions**, and here they are."

---

## 1 · The decision

| Role (registry) | Name | Registry identity | Decision | Date |
|---|---|---|---|---|
| `data-protection` | Yusuf *(illustrative)* | `dp-yusuf` | **Approve with conditions** | 2026-07-26 |
| `risk-second-line` | Lena *(illustrative)* | `risk-lena` | **Approve with conditions** | 2026-07-26 |

Both identities resolve in `governance/identities.template.json`, hold the named role, and are in
`second-line` — **neither is in `builders`**, which the record requires and which is the one part
of the sign-off a reader can verify mechanically today.

They are **two different people**. One person holding both roles satisfies "roles, not headcount"
across most of this method, but not for a two-signature record whose entire purpose is a second
pair of eyes. A specimen showing one name twice would teach the wrong lesson.

**Additional signatures:** none required under the illustrative institution's policy. The live
record carries an `AWAITING` on exactly this point — P1 names two, and an institution whose policy
demands information-security, legal, compliance or the accountable executive adds them there.

## 2 · Residual risks — **as rated by the signatories**

The drafter's proposals carried no authority. Two ratings changed, and the changes are the point.

| # | Risk | Drafter proposed | **Signatories set** | Why |
|---|---|---|---|---|
| R1 | Unstructured disclosure — a person types customer detail into a floor page or comment | Medium-high | **Medium-high** | Accepted. The compensating control is a human reading before freeze, and condition C1 below is what stops that being an aspiration |
| R2 | Vendor-side AI processing of floor content outside the model gateway | Medium, pending §8 | **High** ⬆ | **Escalated.** "Medium" rested on the §4 content ceiling holding. The ceiling governs what *we* send; it says nothing about what the vendor's features do with it once there, and Q2/Q4 are unanswered. An unanswered question about processing location is not a medium risk, it is an unmeasured one — and C2 follows from that |
| R3 | Over-broad workspace visibility | Medium | **Medium** | Accepted |
| R4 | Retention and erasure uncertainty | Open — unratable | **Open — unratable** | **Deliberately left unrated.** Q7/Q8 are unanswered, so any number here would be invented. Recording "Open" is the honest act; C3 makes it a pre-condition rather than an open-ended tolerance |
| R5 | Staff personal data in a SaaS, permanently attributed | Medium | **Medium** | Accepted |
| R6 | Aggregation — many innocuous references become a readable picture | Medium | **Medium** | Accepted, with C4 |
| R7 | Identity-mapping drift across Notion ↔ IdP ↔ registry | Medium | **Medium** | Accepted. The P6 gate now enforces the join and refuses a disabled subject, which is why this did not escalate |
| R8 | The pre-egress filter is unobservable to the harness | Medium | **Medium** | Accepted, with C5 |

**On R4 being left unrated.** A signatory is allowed to say "I cannot rate this yet." What a
signatory may not do is rate it anyway so the table looks complete. The live record's own reviewer
brief puts it plainly: *what is not defensible is rating R4 today.* An adopter reading a specimen
where every cell carries a number would learn to produce a tidy table; this one is meant to teach
the opposite.

## 3 · Conditions attached by the signatories

Written by the signatories, not the drafter — which is why they name obligations the draft does
not contain.

| # | Condition | Blocks |
|---|---|---|
| **C1** | The pre-freeze reader is **named and rostered** before the first freeze. R1's primary control is a human step with no gate behind it; an unnamed reader is an aspiration, not a control | first freeze (WS4) |
| **C2** | Vendor Q2 and Q4 answered **in writing, with a source and date**, before any AI feature is enabled on the workspace. If content is used for training and that cannot be disabled *contractually*, the features are turned **off** — R2 is not accepted at High on the basis that we will decide later | any AI feature |
| **C3** | Vendor Q7 and Q8 answered before **WS1**. R4 is re-rated at that point by `risk-second-line`, and a rating is recorded whatever the answer is | WS1 |
| **C4** | Before a **material** change is projected, the timing question is raised with the change owner. Aggregation risk is not about any one field; it is about a board that becomes readable | each material change |
| **C5** | The pre-egress filter runs **labelled `declared, not active`** until an independent observer signs a bypass-tested observation of it. No exception, and no "it is obviously working" | filter reliance |
| **C6** | Q15 (material outsourcing) answered before the workspace is **budgeted**, not before it is built. If notification or no-objection is required, that clock governs the programme and everyone should know early | P2 |

**Not conditions, deliberately.** The signatories were asked to rule on decision routing (WS5) and
on the harness's own controls. Both were **declined as out of scope**: WS5 needs an independent
second-line review of its own workstream design, and the gates are separately reviewable. A
signature that quietly widened to cover them would be worth less, not more.

## 4 · What this signature does **not** approve

Reproduced from the reviewer's brief because a completed record should carry its own limits:

- **Not decision routing.** WS5 stays production-blocked.
- **Not the vendor's approval status.** Q14 is vendor management's call.
- **Not the harness controls.** This governs *what content goes out*, not *how decisions come back*.
- **Not a workspace build** beyond WS1 read-only projection, and only once C3 and C6 are met.

## 5 · How an adopter uses this

1. Send Part A of `notion-floor-p1-vendor-questionnaire.md` to the vendor; answer Part B internally.
2. Record each answer **back into the live record's §8** with its source and date.
3. Give both signatories `notion-floor-p1-reviewer-brief.md`, then the live record.
4. They set the ratings, write the conditions, and sign **§11 of the live record** — not a copy of
   this file.
5. Merge under four-eyes. That merge, and only that merge, unblocks WS1.

**A gate you may want.** Nothing mechanically verifies that P1's signatories resolve to registry
identities holding the named roles and outside `builders` — it is asserted in prose here and
checked by eye. That is a real gap between what this record claims and what the harness enforces,
and it is the same species of gap the programme exists to close. It is not built.

---

**Companions:** the live record (`notion-floor-residency-review.md`) · the reviewer's brief
(`notion-floor-p1-reviewer-brief.md`) · the vendor questionnaire
(`notion-floor-p1-vendor-questionnaire.md`) · the plan (`notion-floor-plan.md`).
