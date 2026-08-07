---
artifact: data-governance
run: accounts-elsewhere
stage: define
---

# Data-governance feasibility — accounts-elsewhere

> Define (converge). Asked in discovery, not retrofitted in delivery. Gate D6.

## Data the direction would touch

| Data element (synthetic) | Classification | Subject | Purpose |
|---|---|---|---|
| Account balances at other LFIs | Confidential — customer financial | Retail customer | Display an aggregated position |
| Transaction narratives at other LFIs | Confidential — may embed third-party names | Retail customer + counterparties | Display recent activity |
| IsShariaCompliant / ShariaStructure | Product attribute, third-party asserted | The other LFI's product | Label a product Islamic or conventional |
| Balance categories incl. Interest / Profit | Product attribute, third-party asserted | The other LFI's product | Render a balance breakdown |

## Risk mapping (→ register)

| Data element | DR-\* category | Inherent rating | Regulatory driver(s) | Mitigating CTRL-\* |
|---|---|---|---|---|
| Balances / transactions at other LFIs | DR-1.1-001 | High | PDPL; CBUAE Consumer Protection; OF consent scope | CTRL-001, CTRL-014 |
| IsShariaCompliant (defaults false) | DR-2.3-004 | High | HSA resolutions; CBUAE Consumer Protection (fair presentation) | CTRL-031 (suppress-on-unpopulated) |
| Interest balance category rendered in an Islamic app | DR-2.3-005 | Medium | HSA; AAOIFI presentation standards | CTRL-032 (segregated rendering + disclaimer) |
| Transaction narratives naming third parties | DR-1.4-002 | Medium | PDPL (data minimisation) | CTRL-018 (no narrative persistence) |

## Residual-risk verdict (D6)

- **Residual rating after controls:** Medium — contingent on the ISSC position recorded below.
- **Acceptable for delivery?** No — not with these two elements in it. Both are Shariah questions, not engineering ones, and neither is this team's to answer: they are escalated to the ISSC as ADR-ALPHA-003. The direction without those two elements is acceptable at Medium residual; with them it is not acceptable until the ISSC determination is recorded, and no gate, agent, or engineering decision substitutes for it.
- **Conditions / watch-items carried into hand-off:** no persistence of third-party narratives; suppress rather than assert compliance where the flag is unpopulated.

## Uncovered risks

The Open Finance flag `IsShariaCompliant` defaults to `false`. An LFI that simply never populates it therefore reports every one of its products as non-compliant. If Alpha renders that verbatim, Alpha tells its own customer that a competitor's genuinely halal Murabaha is not halal — a false statement about a third party's Shariah standing, produced by a schema default and not by anyone's assertion. Suppression is the proposed control, but suppression is itself a presentation decision.

Second, aggregated conventional accounts carry an `Interest` balance category. Rendering a riba figure inside an Islamic bank's app is not a data question. Whether it is permissible, and under what framing, is an ISSC matter and is escalated as ADR-ALPHA-003.

Neither item is resolvable by the delivery team. Both are recorded here rather than deferred, because D6 asks what is UNCOVERED, and an unanswered Shariah question is uncovered.
