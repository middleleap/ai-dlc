# Implementation Roadmap

## Table of Contents
1. [Plan Overview](#plan-overview)
2. [Tier 1 Bank Release Schedule](#tier-1-bank-release-schedule)
3. [API Hub Release Calendar 2025](#api-hub-release-calendar-2025)
4. [Feature Backlog](#feature-backlog)

---

## Plan Overview

CBUAE Open Finance is implemented in phased releases across 2025-2026. Standards and central platforms were established in 2024.

**Key Implementation Targets:**
- Standards v1.2-final + errata1 → API Hub v6 (current production)
- Standards v2.0-final + errata → API Hub v7 (current)
- Standards v2.1-final → API Hub v8 (Apr 2026)

---

## Tier 1 Bank Release Schedule

### Retail - R1 (September 2025)
**Standards**: v1.2 / v1.2-errata-1 | **Connect**: v6

Core capabilities:
- Consent Management
- Single Instant Payments
- Confirmation of Payee
- Balance Data
- Customer Data

**R1+ Product Quotes** (same timeline):
- Current Accounts
- Savings Accounts
- Credit Cards
- Loans
- Mortgages

### Retail - R2 (October 2025)
**Standards**: v1.2 / v1.2-errata-1 | **Connect**: v6

Enhanced capabilities:
- Transactional Data
- Variable Recurring Payments (VRP)
- Fixed Recurring Payments (FRP)
- Refunds
- Future Dated Payments
- Request to Pay
- Delegated SCA

### Retail - R3 / SME - R3 (December 2025)
**Standards**: v1.2 / v1.2-errata-1 | **Connect**: v6

**Retail R3:**
- International Payments
- Extended Transactional Data

**SME R3:**
- Consent Management
- Single Instant Payments
- Customer Data
- Confirmation of Payee
- Balance Data
- Transactional Data
- Fixed Recurring Payments
- Variable Recurring Payments
- Delegated SCA

### SME - R4 (March 2026)
**Standards**: v1.2 / v1.2-errata-1 | **Connect**: v6

- Future Dated Payments
- Bulk / Batch Payments
- International Payments

### Retail - R4+ (April 2026)
**Standards**: v2.1 | **Connect**: v8

Extended Data Sharing:
- Credit Cards
- Loans
- Mortgages
- ATM Locations

**Breaking Change**: All Retail and SME implementations uplift to v2.1 standards.

### Corporate - R5 (September 2026)
**Standards**: v2.1 | **Connect**: v8

Full corporate suite:
- Consent Management
- Corporate Data (Customer, Product, Transactional)
- Corporate Payments (All Single, Recurring, Variable, International, Future Dated, Delegated and Bulk)
- Confirmation of Payee

---

## API Hub Release Calendar 2025

### Release 2025.26 - Insurance & AlTareq Consent Management
**Deployment Dates:**
- Sandbox: Jul 7, 2025
- Pre-production: Jul 7, 2025+
- Production: Jul 14, 2025+

| Feature | Standards | API Hub Spec |
|---------|-----------|--------------|
| CAAP support for v1.2 Banking | v1.2-final | v6 |
| Insurance data sharing (7 types) | v2.0-final | v7 |

### Release 2025.29 - Insurance Data, Service Initiation
**Deployment Dates:**
- Sandbox: Jul 23, 2025
- Pre-production: Jul 28, 2025+
- Production: Aug 4, 2025+

| Feature | Standards | API Hub Spec |
|---------|-----------|--------------|
| CoP - Standardized name objects | v1.2-errata1 | v6 (1.2.3) |
| Address revision for Parties/Customers | v1.2-errata1 | v6 (1.2.3) |
| Business/Corporate customer data | v1.2-errata1 | v6 (1.2.3) |
| CAAP support for Insurance | v2.0-final | v7 |
| Insurance schema changes | v2.0-errata2 | v7 (v2.0.4) |
| Address changes (all Insurance APIs) | v2.0-errata1 | v7 (v2.0.4) |
| Quote response changes | v2.0-errata1 | v7 (v2.0.4) |
| application/jwt support | v2.0-errata1 | N/A |

### Release 2025.35 - Service Initiation, Data Changes & ATM
**Deployment Dates:**
- Sandbox: Sep 3, 2025
- Pre-production: Sep 8, 2025+
- Production: Sep 15, 2025+

| Feature | Standards | API Hub Spec |
|---------|-----------|--------------|
| Loans, Credit Cards & Mortgages | v2.1-final | v8 |
| IsPrimaryInstrument field | v2.1-final | v8 |
| IsSecured product field | v2.1-final | v8 |
| Extended Health Quotation | v2.1-final | v8 |
| ATM location API | v2.0-final | v7 |
| CoP partial match indicator | v2.0-errata1 | Standards only |
| Aani error codes alignment | v2.0-errata1 | v7 (v2.0.3) |
| ISO 20022 address alignment | v2.0-errata1 | v7 (v2.0.4) |
| Products lending rates | v2.0-errata1 | v7 (v2.0.4) |

### Release 2025.44 - Exchange House & Account Opening
**Deployment Dates:**
- Sandbox: Nov 5, 2025
- Pre-production: Nov 10, 2025+
- Production: Nov 17, 2025+

| Feature | Standards | API Hub Spec |
|---------|-----------|--------------|
| FX data & Quotes | v2.1-final | v8 |
| Dynamic Account Opening | v2.1-final | v8 |

### Release 2025.47 - Exchange House CAAP
**Deployment Dates:**
- Sandbox: Dec 2025 (TBC)

| Feature | Standards | API Hub Spec |
|---------|-----------|--------------|
| CAAP support for Exchange Houses | v2.1-final | v8 |

---

## Feature Backlog

**Not Yet Scheduled:**
- Combined Consents
- Expanded Webhook Event Notification

---

## Documentation Versions

### Open Finance Platform Documentation

| Document | Version | Date | Status |
|----------|---------|------|--------|
| Trust Framework Docs | v8 | Aug 28, 2025 | Preview |
| API Hub Docs | v8 | Jul 7, 2025 | Preview |
| API Hub Docs | v7 | May 2, 2025 | Current |

### Historical Versions

| Trust Framework | API Hub | Date |
|-----------------|---------|------|
| v7 | v7 | Aug 2025 |
| v6 | v6 | Dec 2024 |
| v5 | v5 | Nov 2024 |
| v4 | v4 | Sep 2024 |

---

## Related Resources

- [Nebras Interaction Guide](https://openfinanceuae.atlassian.net/wiki/spaces/OF/pages/232751177)
- [Onboarding Process](https://openfinanceuae.atlassian.net/wiki/spaces/OF/pages/50790460)
- [API Hub Sandbox User Guide](https://openfinanceuae.atlassian.net/wiki/spaces/OF/pages/195788812)
- [AlTareq Consent Mobile App User Guide](https://openfinanceuae.atlassian.net/wiki/spaces/OF/pages/365035521)
- [CAAP Integration Guide](https://openfinanceuae.atlassian.net/wiki/spaces/OF/pages/455278830)
