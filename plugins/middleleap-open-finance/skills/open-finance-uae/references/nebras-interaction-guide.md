# Nebras Interaction Guide — Service Desk, Onboarding Ops, Disputes, Billing, Notifications, Change Management

> Source: **Nebras Interaction Guide for LFIs and TPPs, Version 5.0 (June 2026)** — the operational
> interaction rulebook published on the OF Confluence page "Nebras Interaction Guide"
> (page 232751177; page states "the below version has now been replaced with v5"; v4/v3/v1.2/v1.0
> PDFs remain attached for history). Extracted 17 Aug 2026. The guide is branded "Powered by
> Unitey" and self-describes as NOT replacing regulatory obligations, contractual agreements, or
> technical standards — those remain authoritative. Re-check the Confluence page for a v6 before
> relying on SLA figures.

This file covers how participants **interact with Nebras** (tickets, SLAs, money movement,
notices). Platform/API operational policy (availability, response-time, data-quality,
deprecation) is separate — see `operational-policies.md`. Do not conflate the two P1–P4
taxonomies: this file's priorities are **Service Desk ticket priorities**; the P1/P2/P3 in
`operational-policies.md` are **Ozone Connect incident severities** for LFI platform incidents.

## Table of Contents
1. [Contacts & Channels](#contacts--channels)
2. [Nebras Support Portal (Jira)](#nebras-support-portal-jira)
3. [Service Desk SLAs](#service-desk-slas)
4. [Incident Priorities (P1–P4)](#incident-priorities-p1p4)
5. [Fraud Incidents](#fraud-incidents)
6. [Onboarding Operations](#onboarding-operations)
7. [Disputes](#disputes)
8. [Billing & Invoicing Operations](#billing--invoicing-operations)
9. [Notifications & Notice Periods](#notifications--notice-periods)
10. [Change Management (CMR/CAB)](#change-management-cmrcab)

---

## Contacts & Channels

| Channel | Detail |
|---|---|
| **Nebras Support Portal** (primary) | Jira Service Management customer portal — the primary interaction channel unless otherwise specified. Request types: Onboarding to the OF Platform, User Access Management, Service Request, Certification, Incident, Dispute, Change Management Request, Feature Request |
| General support email | `support@nebrasopenfinance.ae` (acknowledgement emails come from `supportnotifications@nebrasopenfinance.ae`) |
| Escalations / out-of-hours | `escalations@nebrasopenfinance.ae` — include case summary, initial resolution received, original case number |
| Billing queries | `billing@nebrasopenfinance.ae` |
| **24/7 emergency telephone (incidents)** | **+971 4 328 2979** |
| General support hours | Monday–Friday, 9:00 AM – 6:00 PM (timezone not stated in the guide; assume UAE) |
| Retail-customer dispute escalation | **Sanadak** (Emirates authority for consumer protection, sanadak.gov.ae) — non-commercial customers only, after LFI/TPP + Nebras outcome |

Mandatory fields on any request: organisation name + type (LFI/TPP), request/issue type, summary,
detailed description (incl. prior case references), operating environment (production/sandbox),
priority (Urgent/High/Medium/Low), attachments (logs, screenshots). For API issues always include
the `x-fapi-interaction-id` (see `technical-specs.md` §Traceability).

## Nebras Support Portal (Jira)

- Access: **PBCs and PTCs** of LFIs/TPPs; requires prior onboarding to the **Trust Framework
  Sandbox** — portal sign-in is **SSO via the Trust Framework Sandbox** (AlTareq-branded login,
  then a data-sharing consent screen). SBC (Secondary Business Contact) is a **sandbox-only**
  read-only role, recommended if a user only needs portal access.
- Every submission auto-generates a ticket (`OF-xxxx`) with email acknowledgement (10-min SLA)
  and a "View request" link.
- **Ticket sharing:** share with a single participant (email/DL — read-only) or with the whole
  organisation (PBCs, PTCs & STCs from sandbox). Adding people to the organisation participant
  list requires a Revoke/Grant Access request via the portal.

## Service Desk SLAs

General service-desk stages (calendar days; also used for billing queries):

| Stage | Target |
|---|---|
| Submit an issue | Within **30 days of occurrence** (applies to requests, incidents, disputes, billing) |
| First response (acknowledgement) | **10 minutes** (automated, with ticket reference) |
| Final response | **10 days** |
| Respondent review & escalation | **15 days** |

Onboarding-specific SLA: first response 10 min · PBC/PTC onboarding to platform **5 days** ·
system-admin access enablement **5 days** · respond review & escalation **5 days** — all subject
to complete prerequisite info (PBC/PTC FIT form), CBUAE licence validation, and Docusign
completion by PBC/PTC + legal representative.

## Incident Priorities (P1–P4)

Reporting: portal, `support@nebrasopenfinance.ae`, or (critical) the 24/7 line; out-of-hours via
`escalations@nebrasopenfinance.ae`. Resolution timeframes "vary from 6 hours to 11 business days
depending on priority". Canonical SLA table (§9.4 of the guide):

| Priority | Definition (impact on OFTF users / API calls) | Respond | Resolve |
|---|---|---|---|
| **P1 Critical** | 90–100% users affected / 90–100% API failure; complete outage, major data breach, system-wide fraud, regulatory violation | Instantly, within **2 h** | **4 h** |
| **P2 High** | 50–90% affected; core-system outage/partial, data loss, security breach | Immediately, within **3 h** | **6 h** |
| **P3 Medium** | 20–50%; slowdowns, data-display errors, minor security alerts | Within **10 h** | **3 business days** |
| **P4 Low** | 0–20%; minor/cosmetic, navigation queries | Acknowledge within **3 business days** | **11 business days** |

Incident classes named in the guide: systemic fraud · platform outage (5xx) · authentication
errors (401/403) · functionality not working · invalid data format (response ≠ Swagger) · empty
payloads from OFTF endpoints. _Note: the guide's own workflow chart (p.13) shows slightly
different per-priority figures (P1 4h, P2 6h, P3 2bd, P4 10bd — resolution only); treat the §9.4
table above as canonical and confirm with Nebras where it matters._

## Fraud Incidents

- **Systemic fraud** (coordinated, ecosystem-destabilising) → designated **P1**; Nebras
  management investigates immediately and may impose holds or temporary revocations on affected
  participants, as mandated by CBUAE regulations.
- **Individual fraud incident** involving an LFI/TPP customer → the LFI/TPP MUST report it to the
  Nebras Helpdesk; Nebras Operations escalates as a **P2** case. Primary responsibility for
  resolution lies with the LFI/TPP; an **operational pause** (temporary suspension of the affected
  customer's operations) may be required under CBUAE regulations until resolved.
- Suspicious-activity reporting to CBUAE (AML GO portal) is separate — see
  `aml-fraud-guidelines.md`.

## Onboarding Operations

Operational layer on top of the 9-step journey in `lfi-integration.md` (Trust Framework detail
there). Key v5.0 additions:

- **Sandbox request** to `support@nebrasopenfinance.ae` with: TF Sandbox Onboarding Form; licence
  docs (LFI: valid CBUAE licence; TPP: CBUAE OF licence, or LoI/business-proposal copy + evidence
  of licence application); **CCO nomination/approval of the PBC** (nomination email or signed
  letter attached). Ticket reference marks the official start.
- Flow: nominated user registers in the AlTareq TF Sandbox → signs docs via **Docusign** →
  Nebras Operations verifies against the Open Finance Platform Agreement / CBUAE records → **PBC
  is promoted to Organization Admin** → Org Admin registers the others (PBCs, PTCs, STCs, SBCs,
  additional admins). Roles: Org Admin (full), PBC (contacts, non-technical), PTC (all technical
  resources), STC (data providers/endpoints/certs but not applications+certificates), SBC
  (sandbox-only read-only).
- **Timeliness:** PBC + legal representative must sign the Individual AND Organizational T&Cs via
  Docusign **within 30 days** of receiving the request.
- **Production onboarding**: ticket via the portal, same pattern; PBC details must match sandbox
  (or a new PBC nomination by the CCO included); verified against Nebras T&Cs + CBUAE records.
- **LFI acting as TPP in production** (self-testing, or holding BDSP/BSIP roles): sign the
  Self-testing Acknowledgment; assigning BDSP ("Banking Data Service Provider") or BSIP ("Banking
  System Integration Provider" — the guide's expansions) roles requires a **TPP Self-Certification
  / Self-Attestation** declaring regulatory, security, compliance and operational readiness;
  document shared by Nebras Management.
- Certification prerequisites for production: see `testing-certification.md` — the guide's
  certification tables match it (single OIDF FAPI certification held by the API Hub, renewed per
  major Standards version — LFIs never FAPI-certify; TPP FAPI RP per version; functional + CX
  certification validated/issued by Nebras; evidence submitted via the portal "Certification
  Evidence" ticket).

## Disputes

Scope: transactions, fraud, data inaccuracies, product issues. Mandatory dispute fields:
initiator (username, summary, org name/type, segment type), dispute (interaction id, PSU ID, date,
reason, evidence), transaction (optional: payment id, amount, type, status, merchant id,
discrepancy).

**Dispute SLA (calendar days):** submit within **30 days** of occurrence/awareness → LFI/TPP
review **5 days** → Nebras team review & escalation **10 days** → respondent review & customer
update **15 days**.

**Resolution timelines (inter-participant):** respondent must respond within **3 business days**
of Nebras raising it; LFI/TPP must provide a formal resolution within **15 business days** of
submission; either side may **appeal the Nebras verdict within 3 business days**; final decision
(Nebras or CBUAE) must be implemented within **3 business days** (or a clarified implementation
plan provided). No response from the respondent in time ⇒ dispute may be resolved in the
complainant's favour. Escalated inter-bank complaints run as **high-priority (P2)** cases.
Failure to adhere ⇒ supervisory actions in conjunction with CBUAE.

**Channel split (payments settled through Aani Core, initiated via Open Finance/AlTareq):**
- **Aani settlement / Aani system issues** → raise with **Al Etihad Payments (AEP)** via the Aani
  dispute process.
- **AlTareq (Open Finance) API issues** / anything preventing an OF service or transaction from
  completing → raise with **Nebras**.
- Payments NOT initiated through Open Finance cannot be disputed with Nebras.
- Compensation may be payable per the **Limitation of Liability model** (see
  `liability-framework.md`) after an upheld decision by Nebras or CBUAE — but **direct losses are
  never compensated twice** (Aani scheme dispute vs AlTareq OF dispute).

**Who raises what:** retail customers go to their LFI/TPP (which resolves internally; LFIs/TPPs
approach Nebras only for disputes against each other); unhappy retail customers may escalate to
**Sanadak** (non-commercial customers only); **corporate customers may contact Nebras directly**
(`support@nebrasopenfinance.ae`).

## Billing & Invoicing Operations

Commercial rates live in `pricing-model.md` (doc v1.0). The guide adds the operational cycle:

| Stage | Timing |
|---|---|
| Data retrieval (previous month, 1st–30th) | 3rd of each month |
| Invoice & Collection Memo distribution (to PBCs) | **On or before the 5th** (next business day if weekend/holiday) |
| DDA (Direct Debit Authority) presented via Nebras sponsoring bank | **10th** |
| Collection window | until the **30th** |
| LFI→TPP fee / commission settlements (Nebras transfers from sponsoring bank) | **30th – 5th of following month** |

- **Documents:** TPPs receive the **Nebras Tax Invoice** (API Hub fees + transaction-based fees +
  VAT + due date); LFIs receive the **Collection Memo / LFI Statement of Fee** (TPP-by-TPP usage
  owed to the LFI per the Commercial & Pricing Model). Sent electronically via
  `billing@nebrasopenfinance.ae`; supporting per-service call-count data provided; physical copies
  on request. Not received by the 5th (bounce/wrong address) ⇒ participant's responsibility to
  raise it with billing.
- **Charge classes:** API Hub fees (TPP→Nebras); LFI charges (TPP→LFI); TPP fees (LFI→TPP —
  insurance commissions for successfully purchased policies); **Service Fee** (payable to Nebras
  for facilitating brokerage-fee collection — insurance only).
- **Payment method:** **direct debit is required/primary** for TPP invoice settlement (other
  options under review). **Net settlement** applies where an LFI also operates as a TPP (amounts
  payable to the LFI netted against fees it owes).
- **Insurance commissions:** collection memos generated per **bilateral agreements if available,
  else default commission model** (`pricing-model.md` §Open Insurance). **Clawback for cancelled
  policies:** LFI raises a Service Desk ticket notifying Nebras + the TPP; Nebras validates
  against predefined conditions and approves/denies; TPP independently processes and settles the
  refund.
- **Late payment:** penalties as additional fees on the invoice; reminders precede penalties;
  continued delay ⇒ service suspension or further action per platform T&Cs.
- Billing queries: same SLA as service desk (30-day window, 10-min first response, 10-day final
  response, 15-day escalation review); include invoice number, interaction id, timestamps,
  LFI/TPP names, transaction details (+ quote id/policy fields for insurance).

## Notifications & Notice Periods

Platform→participant notices (email from support@, per the platform release policy):

| Event | Advance notice |
|---|---|
| Scheduled downtime / planned maintenance | **48 hours** (typical) |
| Release schedule updates (TF + Ozone API users) | **15 days** |
| Regular patch-management updates | **15 days** |
| New version releases | **30-day heads-up** |

- **Status pages:** sandbox `status.sandbox.directory.openfinance.ae` · production
  `status.directory.openfinance.ae`.
- Downtime notices state affected services/APIs, expected duration, and required TPP actions;
  emergency contact (24/7 line + support email) remains available during planned downtime.
- **LFI→TPP:** LFIs notify planned maintenance via the Jira change process (or email while the
  form is being adopted); Nebras broadcasts approved downtime to impacted TPPs (PBC/PTC) via
  email + a **centralized change calendar**, aiming at **10 calendar days'** advance notice for
  TPP-impacting maintenance. TPPs are responsible for informing **their end users**.
- (LFI-side planned-maintenance duties toward Nebras — ≥72 h notice, 02:00–05:00 GST windows,
  availability accounting — are in `operational-policies.md`.)

## Change Management (CMR/CAB)

LFI-initiated platform-affecting changes go through a **Change Management Request (CMR)** on the
portal — raised **≥30 days before the targeted date**:

| Stage | Nebras target |
|---|---|
| Acknowledgement | 1 business day |
| Completeness validation (L2 review) | 3 business days (SLA pauses while awaiting LFI info) |
| Technical assessment (if applicable; impact classification **C1–C4**) | 5 business days from L2 completion |
| CAB decision | **CAB meets monthly on the 15th** (or next working day); validated tickets should reach technical assessment ~8 business days before the 15th, else next cycle; ad-hoc review via CAB Chair if escalated |
| Formal decision communication | 1 business day after CAB |
| Implementation scheduling | Within 2 business days of approval; **earliest implementation = 30 calendar days after CAB approval** for LFI-driven changes (CAB-Chair exception possible) |
| Emergency/exception requests | Initial response/decision within **24 h** (Technical Lead + CAB Chair); PIR mandatory |
| Post-Implementation Review (PIR) | Within **30 calendar days** of implementation; LFI submits monitoring evidence before closure |

- CMR required fields: initiator, type (Vendor/LFI/Internal), implementation date/window,
  description, business justification, impact analysis (scope per entity, exact API Hub tenant
  count, downstream members, users/customers affected, environments), priority P1–P4, testing
  plan/evidence, rollback plan, monitoring plan, supporting docs, **LFI accountability
  acknowledgement** (LFI remains accountable for incidents/customer harm from LFI-initiated
  changes), impact classification C1–C4.
- LFIs **cannot vote on their own change** at CAB; TPPs don't engage with CAB directly — Nebras
  communicates approved schedules. Rejected changes: reasons + remediation within 1 business day;
  resubmit or seek CAB-Chair exception.
- This is the interaction-level process behind the **30-day breaking-change notice + mandatory
  dual running** rule in SKILL.md / `operational-policies.md` (§4 deprecation policy).

## Related References

- `technical-specs.md` — x-fapi-interaction-id rules (required in tickets)
- `operational-policies.md` — platform incident severities, availability/maintenance duties
- `liability-framework.md` — liability amounts the dispute process applies
- `pricing-model.md` — the fee schedule the billing cycle collects
- `testing-certification.md` — certification evidence flow the portal tickets carry
- `lfi-integration.md` — Trust Framework onboarding mechanics (forms, certs, 9-step journey)
