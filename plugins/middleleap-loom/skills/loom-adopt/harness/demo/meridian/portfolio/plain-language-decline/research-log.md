---
artifact: research-log
stage: discover
design_profile: discovery/brand/design.md
run: "plain-language-decline"
---

# Research log — plain-language-decline

> Discover (diverge). Cited by `synthesis.md` and `problem-statement.md` (D2, D5). **All signals
> are `[synthetic]`** — Meridian Trust is fictional. Zero real PII.

## Stakeholders consulted

| Stakeholder (role, synthetic) | Scope of input | Date |
|---|---|---|
| Head of conduct `[synthetic]` | The complaints measure and what "explainable" must mean | 2026-09-01 |
| Complaints lead `[synthetic]` | What declined customers say when they complain | 2026-09-02 |
| Retail credit risk `[synthetic]` | What drives a decline, and what may be disclosed | 2026-09-03 |
| Model risk management `[synthetic]` | What the scoring model can and cannot explain about a single decision | 2026-09-04 |
| Retail lending operations `[synthetic]` | How the decline letter is produced today | 2026-09-05 |
| Declined applicants, panel of ten `[synthetic]` | Reading today's letter aloud | 2026-09-08 |

## Signals

| Signal id | Source | Observation | Type (pain/need/constraint/quote) | Confidence |
|---|---|---|---|---|
| S-001 | Complaints MI, 2 quarters `[synthetic]` | "Unexplained decision" is the largest complaint category for retail lending and rose last quarter | pain | high |
| S-002 | Complaints MI, 2 quarters `[synthetic]` | Most of those complaints follow a personal-loan decline letter, not a card or overdraft decision | pain | high |
| S-003 | Declined applicant panel `[synthetic]` | "It says my application does not meet the bank's criteria. Which criteria? I have a salary and no debts." | quote | high |
| S-004 | Retail lending operations `[synthetic]` | The letter is one template for every decline; the reason field the scoring decision produces is not used | pain | high |
| S-005 | Retail credit risk `[synthetic]` | Most personal-loan declines come from one of four reasons: debt-burden ratio, length of employment, a recent missed payment, or an unverified income | constraint | high |
| S-006 | Model risk management `[synthetic]` | The scoring model records the top contributing factors for each decision, but they are model features, not reasons a customer would recognise | constraint | high |
| S-007 | Declined applicant panel `[synthetic]` | Seven of ten applicants said they would reapply later if told what would change the answer | need | medium |
| S-008 | Complaints lead `[synthetic]` | Complainants who are told the reason on the phone rarely escalate further | quote | medium |
| S-009 | Retail credit risk `[synthetic]` | Some reasons cannot be disclosed in detail (a fraud indicator, a credit-bureau flag the bureau has not released) | constraint | high |
| S-010 | Declined applicant panel `[synthetic]` | Applicants read only the first sentence of the letter before calling | need | medium |
| S-011 | Model risk management `[synthetic]` | Any reason shown to a customer becomes a claim about the model that model validation must be able to stand behind | constraint | high |
| S-012 | Head of conduct `[synthetic]` | "Explainable means the customer can tell us, in their words, why we said no and what they could do." | quote | medium |

## Evidence index

| File | Backs signal(s) | Notes |
|---|---|---|
| (none filed) | — | Synthetic run: the signals above are the evidence record |
