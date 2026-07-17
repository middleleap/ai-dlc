# Risk Review Document Template

This is the structure for the output Word document. Every risk review must follow this format.
The document mirrors a typical bank's internal risk review process.

## Document Header

```
RISK REVIEW
[Artifact Name]
[Artifact Version/Date]

Reviewed by: Risk Review Agent (AI-Assisted)
Date: [Review Date]
Classification: CONFIDENTIAL
```

After the header, include an overall rating box (single-row table):

| OVERALL RATING | [ENDORSED / CONDITIONALLY ENDORSED / NOT ENDORSED] |

## Section 1: Executive Assessment

2-3 paragraphs covering:
- What the artifact proposes and its strategic significance
- The core thesis and whether it is sound
- Material risks that require mitigation (summarise, don't detail here)
- **Clear recommendation**: one of:
  - **Endorsed** — no material concerns, proceed as planned
  - **Conditionally Endorsed** — sound approach with conditions (state count: "N blocking, M required")
  - **Not Endorsed** — material concerns require fundamental rework before proceeding

End with a one-sentence summary: "My assessment: [Recommendation] — proceed with the N conditions detailed in Section 5."

## Section 2: What the Approach Gets Right

**Required opening paragraph** (adapt the wording, keep the spirit):

"This section is important because it establishes that this review is not opposition
to the initiative. From a risk perspective, several elements of [artifact name] are
genuinely superior to the current state."

Then for each strength:

### 2.X [Strength Title]

1-2 paragraphs explaining:
- What specifically is good about this element
- Why it represents an improvement over current state or alternatives
- Which risk domains it addresses well

Aim for 4-6 genuine strengths. Don't pad — each one should be defensible.

## Section 3: Material Risk Concerns

Preamble paragraph (adapt the wording):

"The following concerns are substantive. They do not invalidate the approach but they
represent risks that, if unmitigated, could result in regulatory exposure, operational
failure, or loss of audit confidence."

For each concern:

### 3.X [Concern Title]

**Severity: [CRITICAL / HIGH / MEDIUM-HIGH / MEDIUM / LOW]**

2-4 paragraphs covering:
- What the specific risk or gap is
- Which risk IDs from the taxonomy are implicated (e.g., "DR-2.1-001: Purpose-Specific Consent Risk")
- Which regulation clauses create the obligation (e.g., "PDPL Article 5 requires...")
- Which controls from the taxonomy should be applied but are missing or insufficient
- What the consequence of inaction would be (regulatory, operational, reputational)
- Where appropriate, use bullet points for specific sub-gaps

For the strongest insights, look for:
- **Circular dependencies**: A governs B, but B is required for A to function
- **Self-marking**: A component validates its own output
- **Accountability gaps**: Automated decisions with no named accountable person
- **Resilience blind spots**: What happens when this component is unavailable?
- **Timeline pressure on governance**: Rushing a governance initiative undermines its purpose

Order concerns by severity (CRITICAL first, then HIGH, etc.).

Target **7-10 concerns** for a substantial artifact. Ensure coverage across at
least 4 different risk dimensions (taxonomy domains + beyond-taxonomy lenses).

## Section 4: Areas Requiring Clarification

Preamble: "These are not objections but questions that need documented answers
before the approach is finalised."

**Use a table format** with Owner and Priority columns:

| # | Question | Owner | Priority |
|---|----------|-------|----------|
| RQ-01 | [Question about scope, ownership, or dependency] | [Team/Role] | Blocking / High / Medium |
| RQ-02 | [Question about technical detail or integration] | [Team/Role] | Blocking / High / Medium |
| ... | ... | ... | ... |

Target 5-10 genuine clarification questions. These should be questions where the
answer genuinely affects the risk assessment — not filler.

## Section 5: Conditions for Endorsement

Opening paragraph: "I am prepared to [endorse / conditionally endorse] the
[artifact name] subject to the following N conditions. Conditions C-01 through
C-XX are blocking and must be satisfied before [milestone]. Conditions C-XX
through C-YY must be addressed within 60 days of go-live."

### 5.1 Blocking Conditions (Before Go-Live)

**Use a 3-column table** with specific acceptance criteria:

| ID | Condition | Acceptance Criteria |
|----|-----------|---------------------|
| C-01 | [What must be done. Reference risk ID and regulation.] | [Measurable, verifiable criteria. An auditor could independently confirm this is met or not met.] |
| C-02 | ... | ... |

### 5.2 Required Conditions (Within 60 Days)

Same 3-column table format.

Target **10-14 total conditions** for a substantial artifact. Each blocking
condition should map to a HIGH or CRITICAL concern. Each required condition
should map to a MEDIUM-HIGH or MEDIUM concern.

## Section 6: Risk Assessment Summary

"Aggregate risk view of [artifact], assessed against the bank's standard risk dimensions:"

**Use a 4-column table** showing risk movement:

| Risk Dimension | Inherent Risk | Residual (with Conditions) | Trend |
|---------------|---------------|---------------------------|-------|
| Model Risk (AI Components) | HIGH | MEDIUM | Improving with C-01 to C-04 |
| Operational Risk | MEDIUM-HIGH | LOW-MEDIUM | Improving with C-06, C-09 |
| Regulatory Compliance | MEDIUM | LOW | Stable |
| Data Quality | MEDIUM | LOW | Improving |
| Privacy & Data Protection | HIGH | MEDIUM | Improving with C-05, C-07 |
| Third-Party Risk | MEDIUM | LOW | Stable |
| Timeline/Execution Risk | HIGH | MEDIUM | Dependent on resourcing |

The 4-column format with Trend is essential — it shows the Risk Committee that
conditions have a measurable effect and tells them where to focus attention.

Ratings: Low / Low-Medium / Medium / Medium-High / High / Critical

## Section 7: Conclusion and Recommendation

2-3 paragraphs:
- Restate the overall assessment (positive framing: "[Artifact] is the right direction")
- Summarise the key conditions and the most important principle
- State the key takeaway — often a sentence like: "My concerns are not about whether
  to proceed but how to proceed."
- Recommend specific next steps with milestones (e.g., "I recommend the Programme
  Sponsor endorses with conditions attached, and that the Risk Committee receives
  a formal update at [milestone]")

## Sign-Off Block

End the document with a dual sign-off table:

| Reviewer | Programme Sponsor |
|----------|-------------------|
| Risk Review Agent (AI-Assisted) | [Name] |
| Date: [Review Date] | Date: _______________ |
| Rating: [CONDITIONALLY ENDORSED] | Acknowledgement: _______________ |

This makes the review a governance artifact that can be filed and tracked.

## Formatting Notes for Document Generation

- Use professional fonts (Calibri or equivalent)
- Section headings: Heading 1 for main sections, Heading 2 for subsections
- Tables should be formatted with header row styling
- Severity ratings in Section 3 should be bold
- Classification marking on first page
- Page numbers in footer
- Keep the document between 10-20 pages depending on artifact complexity
- The overall rating box at the top should be visually prominent
