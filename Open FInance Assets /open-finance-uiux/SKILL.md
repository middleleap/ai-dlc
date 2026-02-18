---
name: open-finance-uiux
description: Rapidly prototype Open Finance value propositions with solution presentations and interactive mockups. Use this skill when prototyping payment or data sharing use cases within retail banking apps, e-commerce, fintech partners, government portals, or any channel. Generates two deliverables per value proposition — (1) a polished HTML slide deck presenting the business case, and (2) an interactive HTML prototype showing the end-to-end user journey embedded in the app context. Triggers on queries about Open Finance prototyping, value propositions, use case demos, payment journey mockups, data sharing demos, solution presentations, pitch decks, Al Tareq journey design, or any request to build/prototype an Open Finance solution.
---

# Open Finance Value Proposition Prototyper

This skill rapidly generates complete Open Finance value proposition packages — each comprising a **solution presentation** (HTML slide deck) and an **interactive prototype** (clickable HTML demo) — for any use case across payments, data sharing, or combined journeys within the UAE's Al Tareq Open Finance platform.

## What This Skill Produces

For any given use case, this skill generates up to three deliverables:

| Deliverable | Format | Purpose |
|-------------|--------|---------|
| **Solution Presentation** | HTML slide deck (9 slides) | Pitch the value proposition to stakeholders, banks, or partners |
| **Interactive Prototype** | HTML clickable flow | Demo the end-to-end user journey (app → Al Tareq → app) |
| **Al Tareq Journey Only** | HTML 3-screen flow | CX-certification-ready consent screens only |

## Generation Workflow

### Step 1: Identify the Use Case

Map the user's request to a value proposition. Check `references/value-propositions.md` for 24 ready-made entries covering:

**Payment Use Cases:** E-Commerce Pay by Bank, Bill Payment, Rent, Subscriptions, BNPL/Installments, Salary Advance, P2P Transfers, Government Fees, Insurance Premiums, Investment Top-Up, International Remittance, Payroll, Charity/Zakat, Education Fees, Healthcare

**Data Sharing Use Cases:** Account Aggregation, Credit Scoring, Personal Finance Management, Mortgage Application, Business Accounting, Loan Application, Bank Switching

**Combined Use Cases:** Embedded Finance for SMEs, Telecom Top-Up + Auto-Refill

If the user's idea doesn't match an existing entry, create a new one following the same structure.

### Step 2: Determine the Channel Context

Where will this solution live? Map to one of:

| Context | Description | App Shell |
|---------|-------------|-----------|
| **Retail Banking App** | Bank's own mobile/web app | Mobile banking shell |
| **E-Commerce / Merchant** | Online store checkout | Desktop checkout shell |
| **Fintech App** | Standalone fintech service | Minimal mobile shell |
| **Government Portal** | Public sector service | Desktop gov portal shell |
| **Telecom / Utility** | Telco or utility provider | Mobile or desktop shell |
| **Insurance** | Insurance provider portal | Desktop/mobile shell |
| **Wealth / Investment** | Investment platform | Mobile app shell |
| **Payroll / HR** | HR/payroll platform | Desktop dashboard shell |
| **Lending** | Lending/credit platform | Mobile or desktop shell |

### Step 3: Identify the Journey Type(s)

Map the use case to Open Finance journey type(s):

| ID | Journey Type | Common Triggers |
|----|-------------|-----------------|
| SIP | Single Instant Payment | "payment", "pay", "top-up", "bill payment" |
| FDP | Future Dated Payment | "scheduled payment", "pay later" |
| FD-MULTI | Fixed-Defined Multi-Payment | "installments", "fixed schedule" |
| VRP | Variable Recurring Payment | "recurring", "subscription", "VRP" |
| VD-MULTI | Variable-Defined Multi-Payment | "variable installments" |
| IAVDB | Variable-Defined Beneficiary | "multiple beneficiaries" |
| EAVB | Variable Beneficiary | "open beneficiary" |
| VRP-OD | VRP On-Demand | "on-demand recurring" |
| COMBINED | Combined Payment | "first payment + subscription" |
| INTL | International Payment | "cross-border", "foreign currency" |
| BULK | Bulk/Batch Payment | "bulk", "payroll", "batch" |
| DATA | Data Sharing | "account information", "share data" |

### Step 4: Read the Reference Files

Read these files IN ORDER based on what you're generating:

**For ALL outputs:**
1. **`references/value-propositions.md`** — Get the value proposition entry (problem, solution, benefits, scenario, headline, KPIs)

**For Solution Presentation:**
2. **`references/presentation-blueprint.md`** — Complete HTML slide deck template with all CSS/JS

**For Interactive Prototype (with app context):**
3. **`references/app-context-blueprint.md`** — App shell templates, pre-flow screens, post-flow screens, and the complete 7-screen flow template

**For Al Tareq Journey screens (used within the prototype):**
4. **`references/journey-generator.md`** — Journey type composition specs
5. **`references/html-blueprint.md`** — Al Tareq consent flow HTML template
6. **`references/svg-assets.md`** — Inline SVG code for Al Tareq logos (use `{P}` prefix system)
7. **`references/design-tokens.md`** — CSS custom properties
8. **`references/component-library.md`** — Component HTML/CSS patterns
9. **`references/screen-catalog.md`** — Detailed field-by-field specs

### Step 5: Generate the Presentation

Using `presentation-blueprint.md` as the template:

1. Replace all `{{PLACEHOLDER}}` values with content from the value proposition entry
2. Set the title slide headline from the "Presentation Headline" field
3. Populate problem statement, solution overview, benefits, and KPIs
4. Build the user journey slide to show the end-to-end flow
5. Set the demo link slide to reference the prototype filename
6. Add realistic UAE sample data (use real brand names from the scenario)
7. Save as `[use-case-slug]-presentation.html`

### Step 6: Generate the Interactive Prototype

Using `app-context-blueprint.md` for the app shell and `html-blueprint.md` for the Al Tareq flow:

1. Select the appropriate app shell (Banking, E-Commerce, Fintech, Government)
2. Build the pre-flow screen (the app screen before Al Tareq kicks in)
3. Build the Al Tareq 3-screen flow (Authorization → Redirect → Completion) using `journey-generator.md` specs
4. Build the post-flow screen (the app screen after returning from Al Tareq)
5. Wire up navigation: Pre-flow → Transition → Auth → Redirect → Completion → Transition → Post-flow
6. Inline all Al Tareq SVGs with unique gradient ID prefixes
7. Add realistic sample data matching the scenario
8. Save as `[use-case-slug]-prototype.html`

### Step 7: Verify Quality

**Presentation checks:**
- [ ] All slides populated with real content (no remaining `{{PLACEHOLDER}}` text)
- [ ] Keyboard navigation works (arrow keys)
- [ ] Progress dots update correctly
- [ ] Al Tareq brand colors used consistently
- [ ] KPIs have realistic target values

**Prototype checks:**
- [ ] All 7 screens navigate correctly
- [ ] App shell looks realistic for the chosen context
- [ ] Al Tareq flow screens pass CX certification rules (see below)
- [ ] Pre-flow and post-flow screens are contextually appropriate
- [ ] Transitions feel natural

**Al Tareq CX Certification (within prototype):**
- [ ] Al Tareq logo uses actual inline SVG (not CSS text)
- [ ] Progress bar shows correct states per screen
- [ ] All mandatory fields present in correct order
- [ ] Button text exact: "Pay using Al Tareq" or "Authorize using Al Tareq"
- [ ] Al Tareq mark (◉) inside primary button as inline SVG
- [ ] Cancel button paired with primary action
- [ ] Gradient IDs unique across all inline SVGs

## Quick-Start Examples

**Example 1: "Prototype a subscription payment for Careem Plus"**
→ Value prop: #4 Subscription Management
→ Channel: Fintech App
→ Journey: VRP
→ Generates: `careem-subscription-presentation.html` + `careem-subscription-prototype.html`

**Example 2: "Show how Noon could do pay-by-bank at checkout"**
→ Value prop: #1 E-Commerce Pay by Bank
→ Channel: E-Commerce / Merchant
→ Journey: SIP
→ Generates: `noon-paybybank-presentation.html` + `noon-paybybank-prototype.html`

**Example 3: "Demo account aggregation for a PFM app"**
→ Value prop: #16 Account Aggregation + #18 Personal Finance Management
→ Channel: Fintech App
→ Journey: DATA
→ Generates: `pfm-aggregation-presentation.html` + `pfm-aggregation-prototype.html`

**Example 4: "Pitch DEWA bill payment via Open Finance"**
→ Value prop: #2 Bill Payment Consolidation
→ Channel: Telecom / Utility
→ Journey: SIP
→ Generates: `dewa-billpay-presentation.html` + `dewa-billpay-prototype.html`

## Output Naming Convention

Files are saved to the user's workspace folder:
- `[slug]-presentation.html` — The slide deck
- `[slug]-prototype.html` — The interactive demo
- `[slug]-journey.html` — Al Tareq flow only (if requested separately)

## Critical Quality Rules

### Brand Name Spelling
The platform name is **"Al Tareq"** (two words, space between "Al" and "Tareq"). NEVER write "Al Tareq" as one word. This applies to:
- Button text: "Pay using Al Tareq" / "Authorize using Al Tareq"
- Payment option labels: "Pay by Bank using Al Tareq"
- All descriptive text and slide content

### SVG Logo Rules

**CRITICAL**: Never use CSS-rendered text, gradient boxes, or placeholder divs for the Al Tareq logo. ALWAYS inline the actual SVG from `references/svg-assets.md`. This applies EVERYWHERE the logo appears — including:
- Al Tareq consent flow screens (Authorization, Redirect, Completion)
- App context screens (e.g., checkout page payment option showing the Al Tareq logo)
- Presentation slides (if logo is shown)

Each SVG has internal gradient `<defs>` with IDs. Use unique prefixes to avoid collisions:

| Logo Instance | Prefix | IDs |
|--------------|--------|-----|
| Dark logo (Auth screen) | `dl` | `dl0`–`dl4` |
| Dark logo (Complete screen) | `cl` | `cl0`–`cl4` |
| White logo (Redirect) | `wl` | `wl0`–`wl4` |
| White mark (Button) | `bm` | `bm0`–`bm3` |
| Dark logo (App context, e.g., checkout) | `nl` | `nl0`–`nl4` |

### Progress Bar Implementation
The 3-step progress bar (Consent → Authorize → Complete) must use:
- `position: relative` on each `.progress-step`
- Connecting lines positioned with `top: 18px` (center of indicator), NOT `bottom`
- `left: calc(50% + 18px)` and `width: calc(100% - 36px)` for proper spanning
- Gradient background on completed/active lines, inactive color on pending
- `z-index: 2` on indicators, `z-index: 1` on lines

## Key Design Tokens

| Token | Value |
|-------|-------|
| Page background | `#F0F2FA` |
| Card background | `#FFFFFF` |
| Primary text | `#1A1D3B` |
| Secondary text | `#6B7194` |
| Button gradient | `linear-gradient(90deg, #003366, #00B894)` |
| Progress gradient | `linear-gradient(90deg, #015AD7, #00C8AF)` |
| Redirect gradient | `linear-gradient(135deg, #001B3D, #003366, #006B5A, #00C8AF)` |
| Card radius | `16px` |
| Button radius | `28px` (pill) |
| Max content width | `720px` |

## Related Skills

- `altareq-brand-guidelines` — Brand rules and CX certification process
- `open-finance-uae` — Regulatory requirements, API specs, Standards versions
