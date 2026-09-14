---
artifact: data-governance
stage: define
design_profile: discovery/brand/design.md
run: "cross-bank-money-stopped"
---

# Data-governance feasibility — cross-bank-money-stopped

> Define (converge). Asked in discovery, not retrofitted in delivery. Gate D6: every `DR-*`,
> `CTRL-*` and `OB-*` id below resolves in the mounted registers; the obligations are cited by
> id, never paraphrased from memory. This is where the Open Finance regime enters the run — as
> obligations with owners.

## Data the direction would touch

| Data element (synthetic) | Classification | Subject | Purpose |
|---|---|---|---|
| Account balances at other banks | Personal, financial | The consenting customer | Consolidated "what I have" view |
| Card and loan due dates and amounts at other banks | Personal, financial | The consenting customer | Consolidated "what I owe, and when" view |
| Consent record: scope, purpose, expiry, revocation state | Personal (control data) | The consenting customer | The authority under which the above is received and shown |
| Meridian's own account data | Personal, financial | The customer | Already held; joined to the view |
| Payment instruction to another bank (H3 only) | Personal, financial, transactional | The customer | **Not in this direction** — held for a later run under its own obligations |

## Risk mapping (→ register)

| Data element | `DR-*` category | Inherent rating | Obligation(s) | Mitigating `CTRL-*` |
|---|---|---|---|---|
| Received balances, due dates, amounts | DR-3.1 (DR-3.1-001) | High | OB-AE-OFR-CONSENT-001, OB-AE-PDPL-DATA-001 | CTRL-003 |
| Received data in any non-production artifact, prototype or fixture | DR-1.1 (DR-1.1-001) | High | OB-AE-PDPL-DATA-001 | CTRL-001 |
| The data-recipient journey depending on the national platform and other participants | DR-4.1 (DR-4.1-001) | High | OB-AE-OFR-PART-001, OB-AE-OFS-CERT-001, OB-AE-CBUAE-RES-001 | CTRL-004 |
| Payment instruction (H3, not in this direction) | DR-2.1 (DR-2.1-001) | High | OB-AE-MTPOL-PSI-001 | CTRL-002 — cited so the boundary is on record: this run does not authorise it |

## Residual-risk verdict (gate D6)

- **Residual rating after controls:** Medium for the consolidated view (DR-3.1-001, DR-4.1-001 with CTRL-003 and CTRL-004); Low for non-production data (DR-1.1-001 with CTRL-001). Not assessed for payment initiation, which is out of this direction.
- **Acceptable for delivery?** Conditional — the consolidated-view direction may proceed to a synthetic prototype now, and to delivery only when: (1) the receiving-consent journey has a named owner; (2) certification evidence for the data-recipient role exists before any pilot exposure; (3) the platform dependency is on the outsourcing register; (4) H3 is explicitly excluded from the hand-off.
- **Conditions / watch-items carried into hand-off:** the four conditions above, and that every obligation cited here is verified against the current Regulation and Standards by its owner before the register is treated as more than a demo fixture.

## Uncovered risks

- Liability allocation between Meridian, the other bank and the platform for a wrong balance shown to the customer: no `CTRL-*` covers it yet. Named here as a gap; it does not block a synthetic prototype and must be answered before pilot.
