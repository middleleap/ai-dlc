# Commercial and Pricing Model

**Version**: 1.0 | **Publication Date**: Oct 4, 2024 | **Classification**: Public

> **Verification note (8 June 2026):** The OF Confluence "Commercial and Pricing Model" page was edited on **2 June 2026**, but the document version label remains **1.0 (4 Oct 2024)** and the fee schedule below is unchanged. The Jun 2 edit appears non-substantive (no version bump). **If a Version 2.0 of the Commercial and Pricing Model is ever published, treat every figure below as stale and re-extract.**

## Table of Contents
1. [Key Principles](#key-principles)
2. [CBUAE Licensing Fees](#cbuae-licensing-fees)
3. [API Hub Fees (Nebras)](#api-hub-fees-nebras)
4. [Open Banking - Service Initiation](#open-banking---service-initiation)
5. [Open Banking - Data Sharing](#open-banking---data-sharing)
6. [Open Banking - Quotes](#open-banking---quotes)
7. [Open Insurance](#open-insurance)
8. [Open Foreign Exchange](#open-foreign-exchange)
9. [Billing and Settlement](#billing-and-settlement)

---

## Key Principles

**Regulatory Status**: This model is regulated by CBUAE and included in AlTareq Standards. **Breach = Breach of CBUAE Open Finance Regulations** subject to supervision, investigation, and enforcement.

**Key Rules:**
- Fees charged only for **technically successful** API calls
- Commissions paid only for **successful referrals** and incremental business
- All TPP-to-LFI and LFI-to-TPP fees are **inclusive of VAT**
- Invoicing/VAT payments handled by receiving party (not CBUAE/Nebras)
- Mutual onboarding is mandatory - Trust Framework provides due diligence support
- Nebras may require Direct Debit/VOD consents for collections
- Model reviewed annually by CBUAE with Nebras Board

**FX/Remittance Specific**: Executed rate MUST be within **50 pips** of quoted rate

**Insurance Specific**: Executed policy cost MUST be within **17.5%** of quoted premium (outside this range = invalid quote, no commissions)

---

## CBUAE Licensing Fees

### Supplemental License Fees (LFIs)
Charged by CBUAE directly to LFIs within mandated scope of Open Finance Regulation.

### TPP License Fees
Annual fees based on consented customer connections (NOT for deemed license holders):

| Customer Threshold | Annual Fee (AED) |
|--------------------|------------------|
| > 50,000 active connections | 20,000 |
| > 100,000 active connections | 100,000 |

*Calculated on annual average of active consented connections*

---

## API Hub Fees (Nebras)

Charged to TPPs based on API call consumption, invoiced and collected by Nebras.

### Standard API Fees

| API Type | Fee per Call |
|----------|--------------|
| Service Initiation (Payments) | **2.5 fils** |
| Balance Check (standalone) | **2.5 fils** |
| Balance Check (with payment within 2h) | **0.5 fils** |
| Confirmation of Payee (standalone) | **2.5 fils** |
| Confirmation of Payee (with payment within 2h) | **0.5 fils** |
| Bank Data Sharing (per 100 tx lines) | **2.5 fils** |
| Insurance Data Sharing | **2.5 fils** |

### Quotes API Fees (Tiered by Providers)

| Providers Returning Quotes | Fee |
|---------------------------|-----|
| Up to 4 entities | **5 fils** |
| Up to 10 entities | **7.5 fils** |
| Up to 25 entities | **10 fils** |
| More than 25 entities | **12.5 fils** |

---

## Open Banking - Service Initiation

### Retail & SME - TPP to LFI Fees

| Payment Type | Fee Structure |
|-------------|---------------|
| **Merchant Collections** | Year 1: **38 bps** (capped 50 AED/tx) |
| | Year 2: 35 bps |
| | Year 3: 32 bps |
| | Year 4: 29 bps |
| | Year 5: **25 bps** |
| | *First 200 AED/day per merchant: FREE* |
| **P2P / SME-to-SME** | **25 fils** per transaction |
| **Me-to-Me** | Year 1: **20 fils** |
| | Year 2: 18 fils |
| | Year 3: **17 fils** |
| **Bulk Payment (SME)** | **25 fils** per tx, capped **250 fils** per batch |
| **Large Value/Rent/Invoice** | **4 AED** per transaction |

### Retail & SME - End User to TPP Fees (Requested Caps)

| Payment Type | Requested Cap |
|-------------|---------------|
| Merchant Collections | Year 1: 63 bps → Year 5: 50 bps |
| P2P / SME-to-SME | 50 fils |
| Me-to-Me | 50 fils |
| Bulk Payment | 50 fils/tx, 500 fils/batch |
| Large Value/Rent/Invoice | 10 AED |

### Corporate - TPP to LFI Fees

| Payment Type | Fee Structure |
|-------------|---------------|
| **Merchant Collections** | Same as Retail (38 bps → 25 bps, max 50 AED) |
| **Corporate Payments (incl. Bulk)** | **250 fils** per individual transaction |
| **Large Value/Rent/Invoice** | **4 AED** per transaction |

### Corporate - End User to TPP Fees

| Payment Type | Cap |
|-------------|-----|
| Merchant Collections | 63 bps → 50 bps over 5 years |
| Corporate Payments (incl. Bulk) | **450 fils** per individual transaction |

**Important**: LFIs CANNOT impose additional charges for Open Finance API-initiated payments.

---

## Open Banking - Data Sharing

### Retail & SME - TPP to LFI Fees

| Data Type | Fee Structure |
|-----------|---------------|
| **Attended Call (Transactional)** | **FREE** up to 15 pages/customer/day |
| | LFI-determined pricing above 15 pages |
| **Unattended Call (Transactional)** | **FREE** up to 5 pages/customer/day |
| | LFI-determined pricing above 5 pages |
| **All Other Data APIs** | **FREE** |

*Page = 100 lines of transactional data, max 13 months span*

### Corporate - TPP to LFI Fees

| Data Type | Fee |
|-----------|-----|
| All Data APIs | **40 fils** per page |
| Confirmation of Payee | **FREE** |

**Important**: 
- LFIs CANNOT impose additional charges for data sharing
- End User to TPP fees for data sharing: NOT permitted (charged by API use)

---

## Open Banking - Quotes

### Retail - All Directions

| Direction | Fee |
|-----------|-----|
| TPP to LFI | **FREE** |
| LFI to TPP | **FREE** |
| End User to TPP | **FREE** |

---

## Open Insurance

### Data Sharing - Retail

| Direction | Fee |
|-----------|-----|
| TPP to LFI | **FREE** |
| End User to TPP | **FREE** |

*LFIs CANNOT impose additional charges*

### Quotes - Retail

**TPP to LFI**: FREE

**API Hub Fees for Insurance Quotes**: **12.5 fils** (maximum tier fee applies to insurance quote provision)

**LFI to TPP (Commissions)**: Default commissions apply absent bilateral agreements:

| Insurance Type | Commission |
|----------------|------------|
| Motor | **5%** |
| Travel | **15%** |
| Home | **15%** |
| Renters | **15%** |
| Life Assurance | **10%*** |
| Health | **5%**** |
| Involuntary Loss of Employment | **0%** |

**Life Assurance Note (*)**:
- Year 1 commission cannot exceed 10% × annual premiums × policy term years
- Single upfront payment = max 10% commission

**Health Insurance Note (**)**: 5% cap applies to employees earning < 4,000 AED/month (Dubai, Abu Dhabi, other Emirates)

**Insurance Quote Fee Note**: The API Hub fee for insurance quotes is **12.5 fils** per API call, charged to the TPP initiating the quote request.

**Commission Rules:**
- Not paid until 30 days after policy sale (cool-off/free-look periods pass)
- Clawback applies for life assurance cancellation within first 2 years
- No direct contractual relationship required (Nebras facilitates)
- Existing bilateral agreements must be maintained for 2 years after Open Insurance launch (Mar 2026)

**End User to TPP**: FREE

---

## Open Foreign Exchange

### Service Initiation - Retail & SME

| Direction | Fee |
|-----------|-----|
| TPP to LFI | **FREE** for Remittance, FX, Onboarding |

### FX Data & Quotes API Pricing

| Service | Fee |
|---------|-----|
| FX Data & Quotes API (TPP to LFI) | **FREE** |
| FX Quotes (per provider tier) | See Quotes API Fees section |

*FX quotes follow the same tiered fee structure as other quotes (5-12.5 fils depending on number of providers)*

### End User to TPP Caps

| Service | Cap |
|---------|-----|
| Remittance | **50 fils** per transaction |
| Foreign Exchange | **50 fils** per transaction |
| Onboarding | **FREE** |

*LFIs CAN charge end customers directly per product tariff. TPP fees are additional.*

### Data Sharing - Retail

| Direction | Fee |
|-----------|-----|
| TPP to LFI | **FREE** |
| End User to TPP | **FREE** |

---

## Billing and Settlement

- Nebras calculates and collects TPP-to-LFI and LFI-to-TPP fees
- Self-invoicing arrangements permitted between TPPs and LFIs
- Participants may be required to provide Direct Debit/VOD consents to Nebras
- All participants MUST comply with Nebras collection requirements

---

## Per-Endpoint Chargeability (API Hub Fees)

> Source: `https://nebras-open-finance.com/pricing/` and `https://nebras-open-finance.com/pricing/endpoints/` (77-endpoint table), verified 10 June 2026.

**Principle:** only endpoints that **pull data from an LFI** or **instruct a payment** attract the Nebras per-call fee. Consent raise/check, authentication, discovery, and reference-data lookups are free. Chargeable = 2.5 fils unless tiered; "disc." = 0.5 fils when paired with a payment within 2 hours.

| Category | Endpoints | Fee status |
|---|---|---|
| Consent & authorization | `POST /par`, `POST /token`, `GET`/`PATCH /account-access-consents[/{ConsentId}]`, `GET`/`PATCH /payment-consents[/{ConsentId}]`, `GET`/`PATCH /insurance-consents[/{ConsentId}]` | **FREE** |
| Bank data sharing | `GET /accounts`, `GET /accounts/{AccountId}`, `…/balances` (**disc.**), `…/beneficiaries`, `…/direct-debits`, `…/parties`, `…/product`, `…/scheduled-payments`, `…/standing-orders`, `…/statements`, `…/transactions`, `GET /parties` | **Chargeable** |
| Insurance data sharing | `GET /{sector}-insurance-policies[/{InsurancePolicyId}]` — all 7 sectors (motor/health/home/renters/travel/life/employment) | **Chargeable** |
| Payment initiation | `POST /payments` | **Chargeable** |
| Payment status | `GET /payments` (PaymentId from idempotency key), `GET /payments/{PaymentId}` | **FREE** |
| Refund account | `GET /payment-consents/{ConsentId}/refund` | **Chargeable** |
| Insurance quote creation | `POST /{sector}-insurance-quotes` | **Chargeable — tiered 5–12.5 fils** by number of LFIs returning quotes |
| Quote retrieval | `GET /{sector}-insurance-quotes/{QuoteId}` | **FREE** |
| Quote accept / policy create | `PATCH /{sector}-insurance-quotes/{QuoteId}` (accept/submit KYC), `POST /{sector}-insurance-policies` | **Chargeable — flat 2.5 fils** (tiered rate applies to the POST quote only) |
| Confirmation of Payee | `POST /confirmation` | **Chargeable** (**disc.**) |
| CoP discovery | `POST /discovery` | **FREE** |
| ATMs / products / leads | `GET /atms`, `GET /products`, `POST /leads` | **FREE** |
| Onboarding & directory | `POST /tpp-registration`, `GET /participants` | **FREE** |

**Paired-discount limit:** one payment discounts **only one Balance call AND one CoP call** to 0.5 fils (within 2 hours of the payment).

**Practical implications:** payment status polling is free; consent management is free; quote retrieval after creation is free; the balance check is the only discounted data call besides CoP confirmation.

**Other rules from the pricing page (10 Jun 2026):**
- Segment definitions: Corporate = turnover **> AED 100m/year**; Large Value / Rent / Invoice Collection = embedded payment link in a smart invoice or equivalent (e.g. rent, retail/SME invoices **above AED 5,000**).
- SME bulk: **no limit on the number of transactions in a batch** (the caps are 25 fils/tx and 250 fils/batch).
- Fee caps apply **whether the payment settles through Aani Core or an alternative rail**; LFIs MUST NOT impose additional end-user charges for OF-initiated payments.
- End-user pricing, LFI→TPP commissions and CBUAE license fees are governed elsewhere in the AlTareq Standards (covered above in this file).
- The page ships an interactive fee calculator (presets, year-stepped bps, 50-AED cap logic, free-threshold modelling) — a guide, not a quote.

## Per-LFI Data-Sharing Overage Rates (Machine-Readable)

> Source: `https://nebras-open-finance.com/pricing/lfi-rates/`, verified 10 June 2026.

- Above the free per-customer/per-day threshold (15 attended / 5 unattended pages), **each LFI sets its own per-call overage rate**, published machine-readably in the Open Finance directory.
- Read it from `GET https://data.directory.openfinance.ae/participants` (production) or `GET https://data.sandbox.directory.openfinance.ae/participants` (sandbox) — **no auth required**. Path: `participants[].AuthorisationServers[].ApiResources[]` where `ApiFamilyType === "account-information"` → `ApiMetadata.OverLimitFees` (string, AED per call, e.g. `"0.50"`). **A missing/empty value means the LFI charges nothing above the threshold.**
- One call returns the rate for every LFI; rates change rarely — daily caching is plenty.
- The same `/participants` payload exposes **per-LFI capability flags** (`ApiMetadata`: `AccountSubType[]`, plus per-payment-type support flags such as `SingleInstantPayment.Supported`, `FixedOnDemand`, `VariableOnDemand.{Single|Multiple|Open}BeneficiariesSupported`, `DelegatedAuthentication.*`) — a single directory endpoint answers both "what's live at which LFI" and "what does overage cost".

## CAAP Pricing

> Source: CAAP pricing page in the v2.1 LFI guide (`https://nebras-open-finance.com/tech/lfi-api-hub/v2.1/caap/`), verified 10 June 2026.

The CAAP pricing page is a **placeholder** — commercial terms are still being finalised between Nebras and LFIs. Use the Nebras Service Desk for indicative quotes.
