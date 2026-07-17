# Limitation of Liability Framework

> Regenerated from public sources 9 Jun 2026 (original file lost) — provenance & full verification history: `verification-log.md`. Cross-check time-sensitive figures against the community hub / OF Confluence before relying on them.

Sources: CBUAE Open Finance Regulation C 3/2025 Article 21 (verified on rulebook.centralbank.ae) for the statutory liability baseline; the **Limitation of Liability Model** on the OF Confluence space ([page 124944402](https://openfinanceuae.atlassian.net/wiki/spaces/OF/pages/124944402/Limitation+of+Liability+Model), document **Version 2.1**, page last updated 6 Jan 2026 — anonymously readable, re-verified 10 Jun 2026) for the compensation schedule.

## Table of Contents
1. [Two Layers of Liability](#two-layers-of-liability)
2. [Statutory Baseline — Regulation Article 21](#statutory-baseline--regulation-article-21)
3. [Compensation Table (Limitation of Liability Model)](#compensation-table-limitation-of-liability-model)
4. [Liability Cascade](#liability-cascade)
5. [Nebras Liability Cap](#nebras-liability-cap)
6. [Dispute Process](#dispute-process)
7. [Insurance and Indemnity Expectations](#insurance-and-indemnity-expectations)
8. [Interaction with Certification Status](#interaction-with-certification-status)
9. [Practical Guidance](#practical-guidance)

---

## Two Layers of Liability

| Layer | Instrument | Nature |
|-------|-----------|--------|
| Statutory | OF Regulation C 3/2025, Article 21 (+ Articles 20, 34, 35) | Open-ended liability of providers to Users for unauthorised/defective transactions and data breaches; CBUAE sanctions on top |
| Scheme | **Limitation of Liability Model** (OF Confluence, part of the Al Tareq Standards) | Standardised per-incident compensation amounts, allocation rules between Nebras / LFI / TPP, and caps — the operational "who pays what" layer |

The Limitation of Liability Model compensates users for performance issues and security breaches **in addition to** protections under UAE law; it does not displace statutory or consumer-protection remedies.

## Statutory Baseline — Regulation Article 21

Verified text of Article 21 (C 3/2025):

1. An **Open Finance Provider is liable to the User** for loss/damage from unauthorised access to or loss of that User's data held by the provider.
2. A **Service Initiation Provider (TPP) is liable to the User** for non-execution or late/defective execution of a transaction — including failures of authorisation, authentication, accurate recording, or secure communication.
3. **Burden of proof sits with the Service Initiation Provider**: in a dispute it must prove, with evidence, that the transaction was correctly processed.
4. The **Service Owner (LFI) is liable to the User** for non-execution or late/defective execution **unless** the loss resulted from the Service Initiation Provider's act or omission under 21(2).
5. Security breaches causing illegal/unauthorised/accidental access, alteration, destruction, disclosure or loss of personal data expose the provider to **CBUAE administrative and financial sanctions** on top of civil liability.

Related: Article 2(8) — liability can never be transferred to a Technical Service Provider; Article 20 — 60 days' notice of T&C changes and free-exit rights.

## Compensation Table (Limitation of Liability Model)

Standardised compensation amounts per incident, in AED — **all values below verified 10 Jun 2026 against the Limitation of Liability Model (OF Confluence, doc Version 2.1)**:

| Failure / Issue | Compensation (AED) | Typically liable party |
|-----------------|--------------------|------------------------|
| Consent state failure (TPP fails to maintain an up-to-date consent state) | **500** | Party serving the wrong consent state |
| Consent revocation failure (requested via TPP channel or via LFI channel) | **350** (each scenario) | Party that failed to propagate/honour revocation |
| SCA / authentication errors (fraudulent or erroneous LFI authentication) | **500** | Party operating the failed auth step |
| Data breach (security breach of LFI or TPP — cyber or physical; data transmitted outside the ecosystem; uncontrolled app access) | **750** | Party from whose environment the data was breached |
| Failure to execute within SLA | **tiered: 350 (within 12 hrs) / 250 (next 6 hrs) / 200 (next 6 hrs)** | LFI (execution) or TPP (late initiation) per Article 21(2)/(4) split |
| Consumer protection violation | **1,000** | Violating participant |
| Failure to manage deprecation / endpoint updates | **2,500** | Party mismanaging the deprecation |
| Breaking change mismanagement by LFI (change-management rules breached, e.g. no 30-day notice / no dual running) | **5,000** | Party introducing the unmanaged breaking change |
| Failure to prevent fraudulent/improper/unauthorised use (LFI or TPP) | **10,000** | Negligent party |
| International payment to a new beneficiary over the AED 15,000 / 48-hour limit | **1,000** + direct losses | TPP (limit is per customer, per TPP, per bank, for 48h after beneficiary creation) |
| **Nebras liability cap** (centralized API Hub / Trust Framework failure) | **Maximum of 5,000,000 of direct losses *per claim*** | Nebras — see below |

Notes:
- Amounts are per-incident redress estimates used to settle inter-participant disputes quickly; they do not cap a User's statutory claim for actual loss under Article 21.
- The model addresses defined dispute scenarios across sections (Consent, Security, Data, Payments/Exchange, Quotation), identifies the liable and responsible parties, and states the extent of redress as "Direct Losses & Open Finance Compensation" plus the AED amount.
- **Correction vs earlier baseline:** the Nebras cap is stated **per claim**, not as an aggregate; and the SLA-failure compensation is tiered 350/250/200 by delay (the earlier "200–350" shorthand was directionally right).

## Liability Cascade

Allocation follows the **locus of failure**, with the customer-facing party paying first and recovering up the chain:

| Step | Principle |
|------|-----------|
| 1. Customer is made whole first | The participant with the customer relationship (usually the LFI for account/payment failures; the TPP for app-level failures) compensates the User without waiting for inter-participant allocation |
| 2. Failure attribution | Logs, consent records and the API Hub audit trail establish where the failure occurred (TPP request, API Hub routing/consent state, LFI execution, CAAP authentication) |
| 3. Recovery | The paying party recovers from the party at fault per the model's scenario tables; burden of proof on the Service Initiation Provider for execution disputes (Article 21(3)) |
| 4. Nebras layer | Failures inside the API Hub / Trust Framework / CAAP are Nebras's responsibility, subject to the AED 5,000,000 per-claim cap |
| 5. No pass-through to TSPs | Liability cannot be contractually shifted to technical service providers (Article 2(8)) — participants own their vendors' failures |

**Delegated SCA:** where a TPP performs delegated authentication (v1.2+ Standards), liability for authentication failures shifts to the TPP for those flows — the liability framework is explicitly aligned to the delegated-authentication model (see `standards-versions.md`).

## Nebras Liability Cap

- Verified 10 Jun 2026 (Limitation of Liability Model, doc v2.1): for "Centralized API hub and / or Trust Framework failure" Nebras's extent of redress is a **"Maximum of 5 million of direct losses per claim"** — i.e. AED 5,000,000 **per claim**, not an aggregate annual cap.
- Mirrors the Regulation's professional-indemnity floor (AED 5,000,000 single claim) for Open Finance Providers — the ecosystem is engineered so each layer carries roughly equivalent worst-case cover.
- Beyond the cap, losses rest where they fall, subject to statutory claims and CBUAE supervisory intervention.

## Dispute Process

| Stage | What happens |
|-------|--------------|
| 1. User complaint | User raises the issue with the relevant **LFI or TPP** (the party they interact with). Standard consumer-protection complaint SLAs apply |
| 2. Bilateral resolution | LFI and TPP attempt resolution using shared evidence (consent records, API Hub logs, payment status history) |
| 3. Nebras review | Inter-participant disputes that cannot be settled bilaterally are **reviewed and determined by Nebras** using the Limitation of Liability Model scenario tables (Service Desk / dispute-resolution tooling in the Common Infrastructural Services) |
| 4. CBUAE escalation | Unresolved or systemic disputes escalate to the **CBUAE**; the regulator may also impose sanctions independently (Article 34) |

Evidence expectations: participants must retain consent and transaction records for **at least 5 years** (Article 13) and surrender them promptly — record-keeping failures effectively concede disputes given the Article 21(3) burden of proof.

## Insurance and Indemnity Expectations

| Participant | Requirement |
|-------------|-------------|
| Licensed TPP (Open Finance Provider) | Professional indemnity insurance: **AED 5,000,000 per single claim**; aggregate the higher of AED 5,000,000 or 50% of annual OF income; must cover unauthorised transactions, data loss/breaches, cyber risk, and delayed/incorrect initiations (Article 9, verified) |
| Deemed-licence participant (bank/insurer) | Covered by existing prudential/insurance arrangements; CBUAE may require equivalent cover (verify against source) |
| API Hub (Nebras) | Guarantees or PII "if and to the extent required by the Central Bank" (Article 24(6), verified) |

## Interaction with Certification Status

- Compensation amounts assume participants are **certified** (functional, CX, security, live-proving — see `testing-certification.md`). Operating outside certified configurations weakens a participant's position in attribution disputes.
- **Breaking change mismanagement (AED 5,000 per incident)** is the liability teeth behind the change-management rules: 30-day notice for breaking changes and mandatory dual running during transitions. The community-hub **Version Management Policy** (verified, updated Apr 2026) confines breaking changes to major versions (≥18-month cadence) for capabilities declared Live — breaching these stability guarantees is what the model prices at 5,000.
- CX certification ties to consent-state liabilities: an LFI whose consent screens were certified, and which serves consent states per the Standards, can rebut consent state failure claims; deviation from certified screens removes that defence.
- Certificate/key hygiene (rotation per the Jun 2026 certificate-rotation guidance) is treated as part of the secure-communication duty under Article 21(2) — expired-certificate outages are SLA failures (AED 200–350) attributable to the negligent party.

## Practical Guidance

1. **Log everything against the consent.** Attribution drives allocation; the party with the weakest evidence pays.
2. **Treat the table as the floor, not the ceiling.** Statutory liability to the User for actual loss is uncapped for participants; only Nebras has the AED 5,000,000 per-claim cap.
3. **Model the AED 5,000 breaking-change exposure per affected counterparty** when planning version migrations — dual running is cheaper.
4. **Verify amounts before committing them to a business case** — the compensation schedule lives on the OF Confluence Limitation of Liability Model page (anonymously readable) and may have been revised after the skill's last verification (10 June 2026, doc Version 2.1).
