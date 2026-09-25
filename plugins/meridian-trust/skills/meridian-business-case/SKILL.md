---
name: meridian-business-case
description: "Build Meridian Trust CIC (Capital Investment Committee) business cases and ISB (Investment Screening Board) project proposals. Use when creating, editing, or discussing bank business cases, project proposals, CIC submissions, ISB pre-screening documents, NPV/IRR calculations, or project cost breakdowns. Triggers on mentions of CIC, ISB proposal, business case, project proposal, NPV calculation, cost breakdown, sign-off tracking, or project funding approval in a banking context. Covers both Stage 1 (one-page pre-screening) and Stage 2 (Detailed Business Case with supporting Excel financials). Also use when the user needs help understanding the capital approval process, stakeholder sign-off requirements, or financial modeling for bank projects."
---

# Meridian Trust Business Case Skill

Meridian Trust uses a two-stage approval process for project funding:

1. **ISB Proposal** (Stage 1) — One-page pre-screening for the Investment Screening Board
2. **CIC Detailed Business Case** (Stage 2) — Full justification for the Capital Investment Committee

> **Adapting this skill:** Meridian Trust is a fictional institution and the governance names below
> are generic stand-ins. To retarget to a real bank, rename the two governance bodies (ISB / CIC),
> swap the system cluster list in `references/business-case-slides.md`, set the reporting currency,
> and confirm the finance parameters (discount rate, contingency, tax). Everything else — the
> workflows, slide structures, validation checks — transfers unchanged.

## Decision Routing

Determine the task type and follow the appropriate path:

- **"Create a Stage 1 / ISB proposal"** → Follow [ISB Proposal Workflow](#isb-proposal-workflow)
- **"Create a business case" / "CIC submission"** → Follow [CIC Business Case Workflow](#cic-business-case-workflow)
- **"Help with NPV / costs"** → Follow [NPV/Financial Workflow](#npvfinancial-workflow)
- **"Review / check my business case"** → Follow [Review Workflow](#review-workflow)
- **"Explain the process" / "What approvals do I need?"** → Read `references/approval-process.md`

## Templates

**Bundled assets** — template files are in the `assets/` directory of this skill:

| Template | Skill Asset Path | ID |
|----------|-----------------|----|
| Stage 1 ISB Proposal | `assets/Stage1_Proposal_Template.pptx` | TMP-CIC-002 V1.0 |
| CIC Business Case | `assets/Business_Case_Template.pptx` | TMP-CIC-001 V1.0 |
| Project Costs Excel | `assets/Project_Costs_Template.xlsx` | TMP-CIC-003 V1.0 |

If the institution has its own approved template files, use those instead — the bundled ones are
generic equivalents built to the same structure.

`<this-skill>` in the commands below is the directory this `SKILL.md` lives in, wherever the
plugin is installed; copy templates into the working directory before editing them.

## In the Loom

In a Loom discovery run, the business case is the investment case assembled at *Define — business
case (5c)*, and the discovery → delivery gate is its approval: ISB pre-screening, then the CIC
decision with the capex breakdown and the full sign-off roster. For a customer-facing product
change the `npa-uae` skill (plugin `middleleap-npa-uae`) assembles the New Product Approval pack
beside it, citing the same financial model in its section 1.2. The Meridian portfolio in the Loom
demo (`middleleap-loom` → `loom-adopt/harness/demo/meridian/`) is the worked scenario.

## ISB Proposal Workflow

1. Read `references/proposal-slides.md` for exact slide structure
2. Read `references/approval-process.md` for process context
3. Gather project information from user (see [Gathering Information](#gathering-information))
4. Copy the Stage 1 template from this skill's assets to the working directory:
   `cp <this-skill>/assets/Stage1_Proposal_Template.pptx ./`
5. Use the **pptx skill** editing workflow (unpack → modify → repack) with the
   **meridian-brand-guidelines skill**
6. Focus on the one-page pre-screening slide (Slide 2) — the core deliverable
7. Verify content addresses all ISB challenge questions (documented in the reference file)
8. Run the [Validation Checklist](#validation-checklist)

## CIC Business Case Workflow

1. Read `references/business-case-slides.md` for exact slide structure
2. Read `references/npv-excel-structure.md` for the financial model
3. Read `references/approval-process.md` for approval requirements
4. Gather project information from user (see [Gathering Information](#gathering-information))
5. Copy the Excel template and populate it **first** (NPV drives the business case):
   `cp <this-skill>/assets/Project_Costs_Template.xlsx ./`
6. Copy the PPTX template and populate slides using the Excel data:
   `cp <this-skill>/assets/Business_Case_Template.pptx ./`
7. Use the **pptx skill** editing workflow with the **meridian-brand-guidelines skill**
8. Ensure ALL mandatory sign-off rows are present (BH, IT, Procurement, Finance, ISB)
9. Run the [Validation Checklist](#validation-checklist)

## NPV/Financial Workflow

1. Read `references/npv-excel-structure.md` for the model structure
2. Copy the Excel template to the working directory:
   `cp <this-skill>/assets/Project_Costs_Template.xlsx ./`
3. Populate with project cost and benefit data
4. Key parameters (defaults — confirm against current finance policy): **13% discount rate**,
   **10% contingency**, **5% indirect tax**, **5-year projection**
5. Calculate NPV at both **100% and 130%** of capital costs
6. Verify NPV is **positive** (required for approval)

## Review Workflow

Use when the user provides an existing business case or proposal for review:

1. Read the relevant reference file (`references/business-case-slides.md` or
   `references/proposal-slides.md`)
2. Extract content from the uploaded PPTX using `python -m markitdown`
3. If Excel is included, extract with openpyxl and verify formulas are intact
4. Run the [Validation Checklist](#validation-checklist) against extracted content
5. Report findings as: **Critical** (will cause rejection), **Warning** (weak but present),
   **OK** (passes)
6. For each Critical/Warning item, provide a specific fix with example text

## Gathering Information

Collect information in batches of 2-3 questions. Start with the essentials, then iterate:

**Batch 1 — Identity & rationale:**
- Project name, department, sponsor
- Category: Regulatory & Risk / KSOR / Strategic / Efficiency
- Background: What problem? Why now?
- Included in Annual Project Plan: Yes / No

**Batch 2 — Scope & money:**
- Scope: What is delivered? What is excluded?
- CapEx: Software, implementation, professional services, infrastructure
- OpEx: Annual recurring costs

**Batch 3 — Benefits & timeline:**
- Financial benefits: Revenue, cost savings, cost avoidance (with currency figures)
- Non-financial benefits: TAT reduction, compliance, customer experience
- Benefits assumptions: Document the basis for each benefit claim
- Timeline: Start, end, key phases

**Batch 4 — Governance & risk:**
- KPIs with baselines AND targets (mandatory)
- Risks, assumptions, constraints, dependencies + mitigations
- Team: Sponsor, accountable exec, PM, stakeholders

**Batch 5 — Technical (if needed):**
- System impact: RAG for Core Banking, Payments Hub, Cash Management, Origination & Onboarding,
  Digital Channels
- DR requirements: Unavailability impact at 4hr, 8hr, 12hr, 7-day
- Build vs Buy decision and rationale (primarily for Stage 1 ISB proposals)

If the user provides partial information, populate what is available and mark remaining fields as
`[TBD - requires input]`. Do not block progress on missing non-critical fields.

## Validation Checklist

Before declaring a business case complete, verify:

| Check | Requirement |
|-------|-------------|
| **KPIs** | Every KPI has Baseline, Target, Metric, and Periodicity |
| **Financials** | All costs in the reporting currency, indirect tax applied, contingency on CapEx |
| **IT Infrastructure** | Shared IT costs separated from project-specific costs (EP Value excludes shared IT) |
| **NPV** | Calculated at 100% AND 130% capital cost; result is positive |
| **Benefits assumptions** | Sheet 2 of the Excel populated — every benefit claim has documented assumptions |
| **Sign-offs** | BH, IT, Procurement, Finance, ISB rows present |
| **Sign-offs (conditional)** | Compliance (if regulatory) and Corporate Services (if property/fit-out) |
| **Category** | Exactly one selected: Regulatory & Risk, KSOR, Strategic, Efficiency |
| **Annual Project Plan** | "Included in Annual Project Plan" field answered Yes or No |
| **System RAG** | Impact rated for each critical system cluster |
| **DR** | Unavailability impact rated at 4hr, 8hr, 12hr, 7-day (scale 1-4) |
| **Benefits matrix** | 2×2 grid populated: Quantifiable/Non-Quantifiable × Financial/Non-Financial |
| **Scope exclusions** | Both in-scope AND exclusions documented |
| **Impact of not doing** | Section completed with specific consequences |
| **No placeholders** | No DD-MM-YYYY, CCY 0.00, or blank mandatory fields remain |