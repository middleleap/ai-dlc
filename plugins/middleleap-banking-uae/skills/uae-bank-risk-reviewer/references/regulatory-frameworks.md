# Regulatory Frameworks Reference

The bundled risk taxonomy is grounded in 5 frameworks: 4 UAE instruments (the CBUAE Consumer
Protection Regulation and Standards, the PDPL, the Model Management Standards, and the CBUAE
AI/ML Guidance Note — the last is non-binding guidance) plus BCBS 239, which is international.
Article and section numbers below were checked against the sources on 29 Sep 2026 (see
`verification-log.md`); PDPL items rest on an English translation, not the official gazette. This skill is focused on the UAE market — understanding the
scope and interplay of these frameworks is essential for accurate risk reviews of any
CBUAE-regulated institution.

## CPS — Consumer Protection Regulation (CBUAE Circular No. 8/2020) and Consumer Protection Standards (Notice 1158/2021)

**Scope**: How Licensed Financial Institutions (LFIs) must treat consumers across all channels (Standards 2.1.1.1: branches, telephone, mobile, internet and all other channels).

**Key areas** (Standards):
- Art. 2: Disclosure and Transparency (incl. 2.3 Responsible Advertising)
- Art. 3: Institutional Oversight — governance, product approval, regulatory reporting
- Art. 5: Business Conduct — fair treatment, conflicts, debt collection
- Art. 6: Protection of Consumer Data and Assets — data protection, consent, retention (6.1); fraud (6.2)
- Art. 7: Responsible Financing Practice — suitability, affordability
- Art. 8: Complaint Management and Complaint Resolution
- Digital-channel requirements are spread across the Standards (e.g. 2.1.1.1, 2.1.1.45); there is no dedicated technology article.

**Risk domains**: Primarily DR-3 (Disclosure) and DR-1 (Data Quality), also DR-2 (Privacy) and DR-4 (Compliance)

**Enforcement**: Regulation Art. 13 — supervisory action, sanctions and penalties, which may include fines and replacing or restricting the powers of Senior Management or Board members.

## PDPL — Personal Data Protection Law (Federal Decree-Law No. 45 of 2021)

**Scope**: UAE federal data protection law (issued 20 Sep 2021, in force 2 Jan 2022).

**Scope carve-out — read first (Art. 2(2))**: the PDPL does not apply to banking and credit
personal data that is subject to its own protective legislation, nor to free-zone entities under
their own data-protection law (DIFC, ADGM). For a CBUAE-regulated bank, the primary obligations
for banking data sit in the CBUAE framework (CPS Art. 6; Open Finance Regulation Art. 22 for
Open Finance data). Treat the PDPL as applying where the carve-out does not reach, and get a
legal view per use case.

**Key areas** (English translation; confirm against the official text before quoting):
- Art. 4: Lawful processing — consent by default, plus listed exceptions (public interest, contract, legal obligation, protecting the data subject's interests, legal claims, etc.); there is no general "legitimate interests" basis
- Art. 5: Processing controls — fairness, purpose limitation, minimisation, accuracy, security, storage limitation
- Art. 6: Consent conditions and withdrawal
- Art. 9: Breach reporting to the UAE Data Office "immediately upon becoming aware" — the period and procedure are left to the Executive Regulations; notify data subjects where the breach is prejudicial
- Arts. 13–18: Data subject rights — information, portability, correction/erasure, restriction, stop processing, automated processing
- Arts. 20–21: Security and data protection impact assessment
- Arts. 22–23: Cross-border transfer

**Risk domains**: Primarily DR-2 (Privacy, Protection & Security), also DR-1 (Data Quality) and DR-4 (Compliance)

**Enforcement**: UAE Data Office (Decree-Law 44/2021). Administrative penalties are to be set by Cabinet decision (Art. 26); the law fixes no amounts. As of Sep 2026 secondary sources report the Executive Regulations have not been issued, so the Art. 29 compliance period has not started — re-check before relying on this.

## MMS — Model Management Standards (CBUAE)

**Scope**: Mandatory model-management standards for all licensed banks in the UAE (MMS 2.1.1), covering all models used to support decision-making (2.4.1), including AI (Table 1). Issued with the Model Management Guidance (MMG).

**Key areas**:
- 4.4: Model inventory and grouping
- 4.5–4.6: Ownership, stakeholders and decision process
- 4.9–4.10: Model documentation and performance reporting
- §5: Data management (5.1–5.6)
- §6: Model development
- §9: Model performance monitoring
- §10: Independent validation

**Risk domains**: DR-1 (Data Quality for model inputs), DR-4 (Governance)

**When MMS applies**: Any time an AI/ML component makes or influences decisions in a regulated
process. This includes risk classifiers, AI components operating in autonomous mode, and any
model that processes regulated data. The key question: "Is there a model making or influencing a decision
about regulated activity?" If yes, MMS applies — to a licensed bank; for other LFIs use it as the reference standard.

## BCBS 239 — Principles for Effective Risk Data Aggregation and Risk Reporting

**Scope**: Basel Committee principles for how banks aggregate, manage, and report risk data.
Not a UAE regulation. BCBS applies it to G-SIBs and "strongly suggested" that national supervisors apply it to D-SIBs three years after designation. No CBUAE instrument adopting it was found (29 Sep 2026); treat it as good practice for CBUAE D-SIBs unless an institution-specific requirement says otherwise.

**Key areas**:
- Principle 3: Accuracy and Integrity — data must be accurate and reconciled
- Principle 4: Completeness — all material risk data must be captured
- Principle 5: Timeliness — data available when needed, especially in stress
- Principle 6: Adaptability — systems must be flexible to changing reporting needs
- Principles 7–11: Risk reporting — accuracy, comprehensiveness, clarity and usefulness, frequency, distribution (Principles 12–14 are supervisory: review, remedial action, home/host cooperation)

**Risk domains**: Primarily DR-1 (Data Quality), also DR-3 (Disclosure) and DR-4 (Governance)

**Application**: BCBS 239 is most relevant when reviewing data pipelines, aggregation logic,
reporting systems, and anything that feeds risk reporting to senior management or regulators.

## CPS-AI — CBUAE Guidance Note on Consumer Protection and Responsible Adoption and Use of AI/ML by LFIs (issued 11 Feb 2026)

**Scope**: Principles-based guidance ("should"); it supplements, and does not replace, the
Consumer Protection Regulation and Standards, the MMS and the PDPL. "CPS-AI" is this skill's label.

**Key areas**:
- 2.a–2.f: Governance and accountability — Board and senior-management accountability; AI inventory under the MMS
- 4.a–4.c: Transparency and explainability — disclose AI use; plain-language Arabic and English disclosures; opt-out for high-impact decisions
- 5.a–5.d: Data quality, privacy and security — accurate data with provenance and audit trails; privacy and security by design; robustness testing
- 7.a–7.d: Human oversight and consumer protection — human review, explanation and the right to challenge (7.c); no misleading AI marketing (7.d)

**Risk domains**: DR-1 (Data Quality for AI inputs), DR-2 (Privacy in AI processing), DR-4 (Governance)

**When CPS-AI applies**: Any AI component in a consumer-facing or regulatory-relevant context.
Overlaps with MMS but adds consumer protection lens. If the artifact involves AI that touches
consumer data or makes decisions affecting consumers, both MMS and CPS-AI apply.

## Framework Interaction Matrix

When reviewing an artifact, multiple frameworks typically apply simultaneously:

| Artifact Type | Primary Frameworks | Secondary |
|--------------|-------------------|-----------|
| API endpoint (data sharing) | CPS, PDPL | BCBS 239 |
| Payment initiation flow | CPS, PDPL | BCBS 239 |
| AI risk classifier | MMS, CPS-AI | CPS, PDPL |
| Consent management | PDPL, CPS | — |
| Data pipeline / aggregation | BCBS 239, CPS | PDPL |
| Disclosure / UI | CPS | PDPL |
| Model monitoring | MMS | CPS-AI |
| Incident response | PDPL (breach), CPS | BCBS 239 |
| Cross-border data flow | PDPL | CPS |
| Audit / evidence chain | BCBS 239 | CPS, MMS |

## Beyond-Taxonomy Risk Lenses

The data risk taxonomy (DR-1 through DR-4) covers data-specific risks comprehensively.
But a senior risk reviewer also assesses dimensions that sit outside the taxonomy.
These often produce the most valuable — and most differentiated — insights in a review.

### Execution & Feasibility Risk

Not in the taxonomy, but always material. Key questions:
- Is the timeline realistic for the scope? (e.g., 77 controls in 90 days)
- Does the team have the skills? Is there key-person dependency?
- What happens if delivery is partial? Does a half-implemented governance framework
  create a worse risk posture than no framework (false sense of security)?
- Are there hard external deadlines (regulatory go-live, audit dates) that create
  pressure to cut corners on the very governance being implemented?

An aggressive timeline on a governance initiative creates pressure to cut corners on
the very thing you're trying to govern. Flag this explicitly.

### Operational Resilience Risk

The artifact may strengthen compliance posture but create a single point of failure.
Key questions:
- What happens when this system/pipeline/service is unavailable?
- Is there a break-glass procedure that maintains auditability?
- What is the RTO/RPO?
- If the system is the sole enforcement mechanism, its BCP must be bank-grade.
- Does the current manual process, for all its latency, have resilience advantages
  that the new approach loses?

### Accountability & Liability Risk

When decisions move from humans to automation, the accountability chain must be
explicitly redefined. Key questions:
- If an automated or AI component makes an incorrect autonomous decision, who is the accountable executive?
- If an automated assessment incorrectly determines that a PIA/DPIA is not required,
  and a PDPL violation results, what is the liability framework?
- The current manual process has named individuals who sign off. Does the new approach
  establish an equivalent accountability chain?

This is not an argument against automation — it is an argument for defining the
accountability framework before the automation goes live.

### Regulatory & External Communications Risk

For novel approaches (especially AI in regulated contexts):
- Has the regulator been informed?
- For CBUAE-regulated Open Finance activity, is AI-driven risk classification
  something that should be briefed proactively?
- Is it better to present this as governance innovation than have it discovered
  during an examination?
- The AI Guidance Note has no prior-notification requirement; it expects AI conduct risk to be reported "to the board and regulators" (8.b) and encourages engaging the CBUAE — so the question is whether to brief proactively, not whether a filing is due.

### Second-Order & Systemic Risk

The most senior risk insight is often about how components interact:
- **Circular dependencies**: An AI component consumes the risk taxonomy, but is itself
  subject to model governance — who governs the governors?
- **Self-marking**: If an automated component generates policy code and the same pipeline
  validates it, that is not independent validation.
- **Emergent risks**: Two components may each be well-controlled individually but create
  an uncontrolled risk when they interact.
- **Feedback loops**: Does the system's output influence its own future inputs in a way
  that could amplify errors?
