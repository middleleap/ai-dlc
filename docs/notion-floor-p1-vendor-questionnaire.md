# P1 vendor questionnaire — the Factory Floor collaboration surface

**Status:** ready to send · **Source of record:** `docs/notion-floor-residency-review.md` §8 ·
**Blocks:** P1 sign-off, and therefore WS1 onward (see that record's blocking statement).

## What this is, and why it is separate from the review

The residency review asserts **no contractual, regional, or assurance fact about the vendor
anywhere**. That was deliberate: a review that guessed at a vendor's posture would be worse than
no review, because it would read as diligence while being fiction. So the review carries fourteen
open questions instead, and this document is those questions extracted into a form that can
actually be sent.

**Each answer must be recorded with its source and date** — the executed contract, the DPA, or
the vendor's current assurance pack. "Their sales engineer said so on a call" is not a source. An
answer without a source is an unanswered question that looks answered, which is the failure mode
this whole programme is written against.

## Before you send: two of the sixteen are not for the vendor

The review numbers sixteen questions. **Q14 and Q15 are marked INSTITUTION-SPECIFIC** — they are
answered by your own vendor-management and outsourcing functions, not by Notion. Sending them
would be a small embarrassment and would tell the vendor more about your internal posture than
you get back. They are reproduced at the end, separately, for the people who *do* own them.

**So: fourteen questions go to the vendor. Two stay inside.**

---

## Part A — for the vendor

> **Context for the vendor, if you want to include it:** we are evaluating Notion as a
> collaboration surface for a regulated software-delivery process at a CBUAE-regulated
> institution. Authoritative records remain in our own systems; the workspace holds drafts,
> references and status. We need documented answers to the following before we can proceed to a
> workspace build. Please cite the contract clause, DPA section, or assurance report and its date
> beside each answer.

### A1 · Location and processing

| # | Question | Answer | Source | Date |
|---|---|---|---|---|
| 1 | In which jurisdictions is workspace content stored **at rest** under our contracted tier? Is a region we accept available, and is that **contractual or best-effort**? | | | |
| 2 | Where is content **processed**, including by AI features — Custom Agents, Workers, connectors, enterprise search? Which **model providers** see page content, in which jurisdictions, under what terms? | | | |
| 3 | Where do **Workers execute**, and where do **webhook payloads transit**? | | | |
| 4 | Is workspace content used to **train or improve models**, by you or any model provider? Can that be disabled **contractually** at our tier, and is the setting **auditable** by us? | | | |

*Why we ask 2 and 4 together:* an AI feature that processes page content is an egress path that
our own model gateway never sees. If the answer to 4 is "disabled by setting, not by contract,"
that is a materially different control than "contractually prohibited."

### A2 · Sub-processors

| # | Question | Answer | Source | Date |
|---|---|---|---|---|
| 5 | Current **sub-processor list**, with locations and functions | | | |
| 6 | What **notice** precedes adding or changing a sub-processor, and do we have a **right to object** — with what consequence if we exercise it? | | | |

*Why 6 matters more than it looks:* a right to object with no consequence except termination is
not a right to object. We need to know which it is before we build on it.

### A3 · Retention, deletion, termination

| # | Question | Answer | Source | Date |
|---|---|---|---|---|
| 7 | What happens on **deletion** — trash period, workspace restore window, backup retention, log retention? **Maximum elapsed time to complete erasure across all copies?** | | | |
| 8 | On **termination**: what is returned, in what format, on what timetable — and what is deleted, with **what evidence of deletion**? | | | |

*Why 7 is rated open in our register:* until it is answered we cannot rate retention and erasure
risk at all. It is one of two questions that currently make a residual **unratable** rather than
merely uncomfortable.

### A4 · Assurance and access

| # | Question | Answer | Source | Date |
|---|---|---|---|---|
| 9 | What **audit rights** exist, and which recognised assurance reports are available and **current** — SOC 2 Type II, ISO 27001, ISO 27018, ISO 42001, penetration-test summaries? | | | |
| 10 | Under what conditions can **vendor personnel access** workspace content? Is there an approval or **lockbox** mechanism, and is such access **logged and visible to us**? | | | |
| 11 | **Encryption** at rest and in transit — and is **customer-managed key material** available at our tier? | | | |
| 12 | How are **third-country legal-process requests** for content handled, and are we notified where lawful? | | | |
| 13 | Contractual **breach-notification timetable** — and does it meet our own regulatory notification obligations? | | | |

### A5 · Identity

Added to the record as §8 Q16 after the identity-mapping specification
(`docs/notion-floor-identity-mapping.md` §6, drift class D-C) surfaced it. It is the sharpest
question on this page:

| # | Question | Answer | Source | Date |
|---|---|---|---|---|
| 16 | **Do you document a person-id reassignment policy?** Specifically: can a workspace person UUID ever be reissued to a different human — after deprovisioning and re-provisioning, a domain migration, or an account merge? | | | |

*Why this one is disproportionately important:* our identity map pivots on the immutable identity-
provider subject precisely because the workspace person id may not be stable. If you confirm ids
are never reused, drift class D-C is bounded and our reconciliation is a periodic check. **If you
have no documented policy, the risk is unbounded** and reconciliation becomes the only defence —
which changes the cadence we must run it at, and therefore the operational cost of the whole
integration.

---

## Part B — for us, not the vendor

| # | Question | Owner | Answer | Date |
|---|---|---|---|---|
| 14 | Is Notion already on the **approved-vendor list**, at what classification tier, and does our intended content-class table fit **inside** that approval? | vendor management | | |
| 15 | Does this arrangement meet the **materiality threshold for outsourcing**, and does it require **regulatory notification or no-objection before WS1**? | compliance / regulatory affairs | | |

**Q15 is the one that can move the whole timeline.** If this arrangement is material outsourcing
requiring CBUAE notification or no-objection, the gating item is not our workspace build — it is a
regulatory clock that starts when someone files, and nothing in the plan shortens it. Answer this
early even if everything else waits.

---

## Recording the answers

Answers belong **back in the review record**, not in this file: `notion-floor-residency-review.md`
§8, replacing each `VENDOR-QUESTION:` marker with the answer, source and date. This document is a
working instrument; the review is the record that gets signed.

Two answers feed directly into risk ratings that are currently blank:

- **Q7 / Q8 → R4** (retention and erasure), presently rated *Open — unratable today*.
- **Q2 / Q4 → R2** (vendor-side AI processing), presently *Medium, pending §8*. If content is
  used for training and cannot be contractually disabled, the honest response is to turn the AI
  features off rather than to accept the risk — the review says so, and that decision is the
  second line's, not the drafter's.
