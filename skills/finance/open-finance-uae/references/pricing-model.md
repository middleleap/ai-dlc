# Commercial and Pricing Model

**Version**: 1.0 | **Publication Date**: Oct 4, 2024 | **Classification**: Public

## Table of Contents
1. [Key Principles](#key-principles)
2. [CBUAE Licensing Fees](#cbuae-licensing-fees)
3. [API Hub Fees (Nebras)](#api-hub-fees-nebras)
4. [Open Banking - Service Initiation](#open-banking---service-initiation)
5. [Open Banking - Data Sharing](#open-banking---data-sharing)
6. [Open Banking - Quotes](#open-banking---quotes)
7. [Open Insurance](#open-insurance)
8. [Open Foreign Exchange](#open-foreign-exchange)

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
