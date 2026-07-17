# Regulatory Frameworks Reference

The bundled risk taxonomy is grounded in 5 regulatory frameworks: 4 UAE frameworks (CPS,
PDPL, MMS, CPS-AI) plus BCBS 239, which is international but expected by CBUAE for
systemically important banks. This skill is focused on the UAE market — understanding the
scope and interplay of these frameworks is essential for accurate risk reviews of any
CBUAE-regulated institution.

## CPS — Consumer Protection Standards (CBUAE Circular No. 8-2020)

**Scope**: How Licensed Financial Institutions (LFIs) must treat consumers across all channels.

**Key areas**:
- Art. 2: Disclosure and Transparency — governs what information must be provided, when, and how clearly
- Art. 3: Business Conduct — fair treatment, suitability, complaints handling
- Art. 6: Data Protection — consumer data handling obligations (overlaps with PDPL)
- Art. 8: Technology and Digital Channels — requirements for digital banking services

**Risk domains**: Primarily DR-3 (Disclosure) and DR-1 (Data Quality), also DR-2 (Privacy) and DR-4 (Compliance)

**Enforcement**: CBUAE has direct enforcement powers including fines and license conditions.

## PDPL — Personal Data Protection Law (Federal Decree-Law No. 45 of 2021)

**Scope**: UAE's comprehensive data protection legislation governing processing of personal data.

**Key areas**:
- Art. 5: Lawful basis for processing (consent, contract, legal obligation, vital interests, public interest, legitimate interests)
- Art. 9-11: Data subject rights (access, rectification, erasure, portability, objection)
- Art. 12-13: Data quality and accuracy obligations
- Art. 20: Data breach notification (72-hour window to UAE Data Office)
- Art. 22-23: Cross-border transfer restrictions

**Risk domains**: Primarily DR-2 (Privacy, Protection & Security), also DR-1 (Data Quality) and DR-4 (Compliance)

**Enforcement**: UAE Data Office; fines up to AED 2 million for violations.

## MMS — Model Management Standards (CBUAE)

**Scope**: Governance requirements for models used in regulated financial services, including AI/ML.

**Key areas**:
- 4.1: Model inventory and registration requirements
- 4.4-4.6: Model development, validation, and documentation
- 4.9-4.10: Model monitoring and performance tracking
- 5.1-5.6: Independent model validation requirements

**Risk domains**: DR-1 (Data Quality for model inputs), DR-4 (Governance)

**When MMS applies**: Any time an AI/ML component makes or influences decisions in a regulated
process. This includes risk classifiers, AI components operating in autonomous mode, and any
model that processes regulated data. The key question: "Is there a model making or influencing a decision
about regulated activity?" If yes, MMS applies.

## BCBS 239 — Principles for Effective Risk Data Aggregation and Risk Reporting

**Scope**: Basel Committee principles for how banks aggregate, manage, and report risk data.
Not a UAE regulation per se, but CBUAE expects alignment for systemically important banks.

**Key areas**:
- Principle 3: Accuracy and Integrity — data must be accurate and reconciled
- Principle 4: Completeness — all material risk data must be captured
- Principle 5: Timeliness — data available when needed, especially in stress
- Principle 6: Adaptability — systems must be flexible to changing reporting needs
- Principles 7-12: Risk reporting accuracy, comprehensiveness, clarity, frequency, distribution, and review

**Risk domains**: Primarily DR-1 (Data Quality), also DR-3 (Disclosure) and DR-4 (Governance)

**Application**: BCBS 239 is most relevant when reviewing data pipelines, aggregation logic,
reporting systems, and anything that feeds risk reporting to senior management or regulators.

## CPS-AI — AI Guidance (CBUAE)

**Scope**: CBUAE supplementary guidance on use of AI in regulated financial services.
Extends CPS requirements specifically to AI/ML use cases.

**Key areas**:
- 4.b: AI systems must ensure accuracy and reliability of outputs
- 5.a: Transparency requirements — AI decisions must be explainable
- 7.c: Accountability for AI-driven decisions in consumer-facing contexts

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
- Does CPS-AI guidance require notification for AI use in specific contexts?

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
