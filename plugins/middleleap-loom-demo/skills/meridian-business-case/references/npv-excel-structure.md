# NPV & Project Costs Excel Template

Template: `assets/Project_Costs_Template.xlsx` (TMP-CIC-003 V1.0)

## Contents
- [Sheet 1: NPV & IRR Calcs](#sheet-1-npv--irr-calcs) — main financial model
- [Sheet 2: Fin Benefits Assumptions](#sheet-2-fin-benefits-assumptions-calcs)
- [Sheet 3: Definitions](#sheet-3-definitions)

**IMPORTANT:** Grey cells contain formulas — never overwrite them. Only populate INPUT rows.

## Sheet 1: NPV & IRR Calcs

All values in **millions of the reporting currency**. 6-year projection (current year + 5 years).

### Structure

**Legend:** ✏️ = INPUT (populate these) | 🔒 = FORMULA (do not overwrite)

```
Row  | Content                                           | Type
-----|---------------------------------------------------|--------
A1   | Project IRR & NPV Calculation                     | Header
A2   | Particulars / Parameters / Year columns (C-H)     | Headers
     |                                                   |
     | === BENEFITS (Cash Inflows) ===                   |
A3   | Revenues from Products / Services                 | 🔒 Subtotal
A4-6 | Line Item 1-3                                     | ✏️ INPUT
A7   | Cost Savings                                      | 🔒 Subtotal
A8-10| Line Item 1-3                                     | ✏️ INPUT
A11  | Other Benefits                                    | 🔒 Subtotal
A12-14| Line Item 1-3                                    | ✏️ INPUT
A15  | Total Benefits (Cash Inflows)                     | 🔒 FORMULA
     |                                                   |
     | === COSTS (Cash Outflows) ===                     |
A16  | Project Capital Costs (CapEx)                     | 🔒 Subtotal
A17  | Software Application Cost                         | ✏️ INPUT
A18  | Software Implementation Cost                      | ✏️ INPUT
A19  | Professional Consultancy Services                 | ✏️ INPUT
A20  | Temp Staff Cost (12 months IT Team, one-time)     | ✏️ INPUT
A21  | IT Infrastructure (Dedicated Servers)             | ✏️ INPUT
A22  | IT Infrastructure (Shared Server/Storage/DB)      | ✏️ INPUT
A23  | Other Costs                                       | ✏️ INPUT
A24  | Contingency @ 10%                                 | ✏️ INPUT (calculate: 10% of sum of A17:A23)
A25  | Indirect Tax @ 5%                                 | ✏️ INPUT (calculate: 5% of sum of A17:A24)
A26  | Project Operating Costs (OpEx, recurring P&L)     | 🔒 Subtotal
A27-35| OpEx line items                                  | ✏️ INPUT
A36  | Indirect Tax @ 5%                                 | ✏️ INPUT (calculate: 5% of sum of A27:A35)
A37  | Total Costs (Cash Outflows)                       | 🔒 FORMULA
     |                                                   |
     | === FINANCIAL METRICS ===                         |
A38  | Net Cash Inflow / Outflow                         | 🔒 FORMULA
A39  | Internal Rate of Return (IRR)                     | 🔒 FORMULA
A40  | NPV @ 100% of Project Capital Cost                | 🔒 FORMULA (13% discount)
     |                                                   |
     | === SENSITIVITY (130% Capital Cost) ===           |
A41  | Project Capital Costs @ 130%                      | 🔒 FORMULA
A42  | Project Operating Costs                           | 🔒 Reference
A43  | Total Cash Outflows (Costs)                       | 🔒 FORMULA
A44  | Net Cash Inflow / (Outflow)                       | 🔒 FORMULA
A45  | NPV @ 130% of Project Capital Cost                | 🔒 FORMULA (13% discount)
A46  | Payback Year (PBY) / Payback Period (PBP)         | 🔒 FORMULA
     |                                                   |
     | === SUMMARY ===                                   |
A47  | Capital costs                                     | 🔒 Reference
A48  | Net Operating Revenues                            | 🔒 Reference
A49  | Note: Grey cells contain formulas                 | Info
```

### Payback Year Formula

The PBY formula checks cumulative net operating revenues (row 48) against total capital costs
(cell C47), returning the year in which cumulative benefits exceed capital investment. If not
recovered within the projection period, it returns "Over 5 Yrs".

### Key Parameters

These are the model defaults. Confirm each against the institution's current finance policy before
submission — they are the most likely thing to differ between banks.

| Parameter | Default | Where |
|-----------|---------|-------|
| Discount rate (hurdle rate) | 13% | Cells B40 and B45 |
| Contingency | 10% of capital costs | Row 24 |
| Indirect tax (VAT/GST) | 5% on all costs including contingency | Rows 25 and 36 |
| Sensitivity test | NPV recalculated at 130% of capital costs | Rows 41-45 |
| Projection period | Current year + 5 years | Columns C-H |
| Approval requirement | NPV must be positive | Rows 40 and 45 |

### OpEx Line Items (A27-A35)

Generic starting set — replace with the project's actual recurring cost lines:

- Data protection / immutable storage
- Security monitoring & compliance tooling
- Network and connectivity costs
- Training & Recruitment
- Restructuring Costs
- Advertising & Marketing
- Travel & Daily Allowances
- Professional Consultancy Services
- Other Costs

## Sheet 2: Fin Benefits Assumptions Calcs

Revenue and savings assumptions supporting the benefits figures in Sheet 1. Every benefit claimed
in Sheet 1 must have a documented assumption here — this is a common rejection point.

## Sheet 3: Definitions

Reference definitions for:

| Term | Definition |
|------|-----------|
| Development Costs (Non-Capitalisable) | Research, analysis, pre-project costs, RFI/RFP, business case development |
| Development Costs (Capitalisable) | Software procurement/development, implementation, hardware, infrastructure |
| Operating Costs | Ongoing maintenance, licence/AMC, increased business costs |
| Total Costs | Inception to implementation, cashflow basis, separated into CapEx/DevEx/OpEx |
| NPV | Current value of future net cash flows at a predetermined discount rate. Must be positive for approval |
| IRR | Project efficiency/quality indicator. Must exceed the hurdle rate to add value |
| Depreciation | Software: after completion (moved from WIP). Hardware: from purchase date |
| Reporting Currency | Thousands in the Definitions sheet; Sheet 1 values are entered in millions |
