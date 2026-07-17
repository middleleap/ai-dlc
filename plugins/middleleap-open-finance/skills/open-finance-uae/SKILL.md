---
name: open-finance-uae
description: Expert guidance on UAE Open Finance regulatory requirements, Al Tareq platform integration, CBUAE compliance, and Standards versions (v1.0 through v2.1-final). Use when working on UAE Open Finance projects including TPP licensing, LFI obligations, API specifications (Bank Data Sharing, Bank Service Initiation, Insurance), consent management, security requirements (FAPI 2.0, mTLS, SCA), liability frameworks, and Nebras platform operations. Triggers on queries about CBUAE regulations, Al Tareq, Nebras, Open Finance UAE, TPP/LFI requirements, deemed licenses, standards versions, API differences, payment initiation, data sharing, and UAE financial services API compliance.
---

# UAE Open Finance Expert

Expert knowledge base for UAE's Open Finance ecosystem covering CBUAE regulations, Standards versions, Al Tareq platform requirements, implementation guidance, testing/certification, commercial model, and roadmap.

## Quick Reference

| Aspect | Detail |
|--------|--------|
| Regulation | CBUAE Circular C 03/2025 (10 July 2025) |
| Current Standards | **v2.1-final** (Jan 7, 2026 — final for implementation) |
| Previous Production | v2.0-final (Apr 2025) |
| Platform | Al Tareq (consumer brand) / Nebras (operator) |
| API Hub | Ozone-powered, centralized infrastructure |
| Mandatory | All licensed banks, insurance companies, insurance brokers |
| TPP Capital | AED 1,000,000 minimum |
| API Hub Capital | AED 20,000,000 minimum |
| Support | support@nebrasopenfinance.ae |

## Implementation Roadmap

### Current Timeline (2025-2026)

| Release | Date | Key Features |
|---------|------|--------------|
| Retail R1 | Sep 2025 | Consent, SIP, CoP, Balance, Customer |
| Retail R2 | Oct 2025 | Transactions, VRP, FRP, Refunds, Delegated SCA |
| Retail R3 + SME R3 | Dec 2025 | International Payments, SME Suite |
| SME R4 | Mar 2026 | Bulk Payments, International |
| Retail R4+ | Apr 2026 | Extended Data (Cards/Loans/Mortgages), v2.1 uplift |
| Corporate R5 | Sep 2026 | Full Corporate Suite |

See `references/implementation-roadmap.md` for detailed API Hub release calendar.

## Standards Versions

| Version | Date | Status | API Hub |
|---------|------|--------|---------|
| v1.2-final | Dec 2024 | Deprecated | v6 |
| v2.0-final | Apr 2025 | Previous Production | v7 |
| v2.1-rc1 | Oct 2025 | Superseded | v8 |
| v2.1-rc2 | Nov 2025 | Superseded | v8 |
| **v2.1-final** | **Jan 7, 2026** | **Current — Final for Implementation** | **v8** |

See `references/standards-versions.md` for full version comparison and migration guidance.

## Standards v2.1-final — Key Changes Summary

Published Jan 7, 2026. Based on v2.1-rc1 with all errata incorporated. Major changes:

### Authorization & Payments
- **PII Creditor properties split**: Separate Domestic and International payment Creditor properties
- **Domestic payments**: Only IBAN for `CreditorAccount.SchemeName`; `Creditor.Type` optional
- **International payments**: `ConfirmationOfPayeeResponse` removed from PII
- **ConsentSchedule**: Mandatory constraint from v2.1-rc2 removed (now optional)
- **Bulk/Batch File Upload**: Changed to Client Credentials grant (upload before consent auth)
- **Fast Track journey removed**: Payment authentication now required at consent authorization
- **Single Future-Dated Payments**: Must now be created as Fixed Defined Payment
- **CoP Partial Match**: New partial match indicator in addition to Yes/No
- **Consent end date**: `ExpirationDateTime` MUST NOT exceed 1 year from current date

### Multi-Payments
- Visual illustration of Multi-Payment types and Creditor options added
- Variable-defined Beneficiary (IAVDB): Beneficiary List shown under "Who you're paying"
- New section: Combined Payments to Different Creditors (6.3)
- Single Future-Dated Payments included as Fixed Defined Multi-Payment type
- New rule 5.8.2: Users can add creditor to trusted payees from Open Finance payments

### International Payments
- New limit: 15,000 AED for first-time payments via single TPP to new beneficiary per customer per LFI
- Max international payment limit applies within first 24 hours

### Payment Refunds
- New rule: LFI must return error (not account details) when refund requested on closed/suspended/restricted accounts

### Common Rules & Guidelines
- **A10.1**: Multi-Creditor consent: min 2, max 10 creditors
- **Debtor/Creditor Reference**: Revised Structured Reference guidelines
- **CRG-26.1.2**: Trusted Payee rule extended to International Payments
- **Rule 27**: Country codes must use three-letter codes
- **Rule 22** (new): Exception Handling guidance
- **Rule 26** (new): Adding Trusted Payee (Beneficiaries)
- **CRG-1.3.1/1.3.2**: LFI requirements for dormant/inactive accounts
- **Risk Block**: Authentication Channel & Device Info changed from Mandatory to Conditional

### Customer Data
- `ReadParty` permission: Updated for SME and Corporate accounts
- `FinanceRates`: Encryption support via JWE for lending rates
- New permission: `ReadProductLendingRates`
- New section: Beneficiaries Data Sharing (OFP vs LFI-created beneficiaries)
- Removed unsupported permissions: `ReadTransactionsCredits`, `ReadTransactionsDetail`, `ReadFXProducts`

### Insurance
- **Motor Insurance**: Vehicle engine details now returned; Edata/Auto-data recommended for vehicle specs
- **Insurance Quotes**: Max cover term limited to 1 year (except Life Insurance)
- **Life Insurance**: New optional riders (add-ons) section
- **TPP-led Policy Issuance**: New capability — TPPs can handle KYC, premium collection, policy document issuance
- **All Insurance Types**: `CountrySubDivision` required for Emirate in quote requests
- **Insurance Data Sharing**: Premium data encryption via JWE; new CX examples for data clusters
- **New Insurance CMI wireframes**: Revocation journey added for LFI consent management

### Consent Management
- TPP pause/reactivate: LFI notification requirements removed (LFI not notified when consent paused via TPP)
- LFI CMI: "Suspended" consent state added; sidebar menu removed from wireframes

### Webhooks
- ConsentSchedule mandatory constraint removed for Payment Initiation Consents
- New webhook event notification guidance and OpenAPI specification

### Unconsented Products Data
- Islamic Banking and Finance product support added (term "Loan" → "Finance")
- Unconsented product objects aligned with Consented product objects for consistency

### Operational
- API Performance table updated with v1.2 and v2.0 APIs
- `x-fapi-customer-ip-address` header now mandatory on GET /products and POST /leads

## API Categories

| Category | Purpose | Key APIs |
|----------|---------|----------|
| Bank Data Sharing | Account/transaction data | /accounts, /transactions, /cop-query |
| Bank Service Initiation | Payments | /domestic-payments, /international-payments |
| Insurance Data Sharing | Policy/claims | /policies, /claims |
| Insurance Quote Initiation | Quote & issuance | /quotes (motor, home, renters, travel, health, life, employment) |
| Product/Metadata | Discovery | /products, /leads, /atm |

See `references/api-specifications.md` for complete API reference.

## Certification Requirements

### LFI Certification Path
1. **Functional Testing**: Ozone Connect Test Suite + Postman Collection (100% pass)
2. **CX Certification**: Nebras validates consent/auth screens
3. **Penetration Testing**: No critical/high issues
4. **Stress Testing**: NFRs compliant with Standards
5. **Live Proving**: At least 2 TPPs test all endpoints

### TPP Certification Path
1. **FAPI Certification**: OIDF Relying Party for UAE FAPI 2.0 profile
2. **Functional Certification**: Nebras validates API call success
3. **CX Certification**: Nebras validates consent screens
4. **Penetration Testing**: No critical/high issues
5. **Live Proving**: At least 1 LFI test all endpoints

See `references/testing-certification.md` for complete framework.

## Commercial Model Quick Reference

### API Hub Fees (Nebras)
| API Type | Fee |
|----------|-----|
| Payment Initiation | 2.5 fils |
| Balance/CoP (with payment) | 0.5 fils |
| Data Sharing | 2.5 fils per 100 lines |
| Quotes | 5-12.5 fils (tiered) |

### Payment Fees (TPP to LFI)
| Type | Year 1 | Year 5 |
|------|--------|--------|
| Merchant Collections | 38 bps | 25 bps |
| P2P/SME | 25 fils | 25 fils |
| Corporate | 250 fils | 250 fils |

See `references/pricing-model.md` for complete commercial model.

## Reference Documentation

| Topic | Reference File |
|-------|----------------|
| Regulations | `references/cbuae-regulations.md` |
| Standards Versions | `references/standards-versions.md` |
| API Specifications | `references/api-specifications.md` |
| LFI Integration | `references/lfi-integration.md` |
| Technical Specs | `references/technical-specs.md` |
| **Implementation Roadmap** | `references/implementation-roadmap.md` |
| **Testing & Certification** | `references/testing-certification.md` |
| Liability Model | `references/liability-framework.md` |
| Commercial & Pricing | `references/pricing-model.md` |
| **AML & Fraud** | `references/aml-fraud-guidelines.md` |

## Key Liability Amounts (AED)

| Issue | Compensation |
|-------|--------------|
| Consent state failure | 500 |
| Consent revocation failure | 350 |
| SCA/Auth errors | 500 |
| Data breach | 750 |
| Execute within SLA failure | 200-350 |
| Consumer protection violation | 1,000 |
| Breaking change mismanagement | 5,000 |
| **Nebras max liability** | **5,000,000** |

See `references/liability-framework.md` for complete model.

## Key Implementation Notes

**Payment Rails**: Domestic payments MUST use IPP only. International uses all available LFI rails.

**Consent Types**: Single Use (one-time), Long-lived (recurring, max 365 days), with optional Balance Check permission.

**CoP (Confirmation of Payee)**: Required before payments. Now supports Partial match indicator (Yes/No/Partial). Name object: `fullName` mandatory for personal accounts.

**Risk Information Block**: Fraud prevention data including Customer Present flag, Creditor Contract flag, Channel, and merchant details. Authentication Channel & Device Info is now **Conditional** (was Mandatory in rc2).

**AML Reporting**: Suspicious activities reported via CBUAE AML GO portal.

**File Payments**: Bulk/Batch file upload now uses Client Credentials grant (can upload before consent authorization).

**Future-Dated Payments**: Single future-dated payments must be created as Fixed Defined Payments.

**Insurance Quotes**: All quote requests require `CountrySubDivision` for Emirate location. Max cover term 1 year (except Life).

**TPP-led Policy Issuance** (new in v2.1): TPPs can handle KYC document capture, premium payment, and policy document issuance for insurance quotes.

**Consent Expiration**: `ExpirationDateTime` MUST NOT exceed 1 year from the current date for payment consents.

## Common Queries

**Which Standards version?** Use **v2.1-final** (Jan 7, 2026) for all new implementations. v2.0-final remains valid for existing production systems pending migration.

**SOC 2 Exemption**: Banks as deemed-license TPPs can request exemption via CISO attestation (Emirates NBD precedent).

**API Hub Docs**: v6 for Standards v1.2, v7 for Standards v2.0, v8 for Standards v2.1.

**FAPI Certification**: TPPs pay OIDF directly (reduced for OIDF members). LFIs don't need individual certification — API Hub holds platform certification.

**v2.1-final vs v2.1-rc2**: v2.1-final is based on rc1 with all errata. Key differences from rc2: ConsentSchedule made optional again, PII Creditor split for domestic/international, Bulk file upload changed to Client Credentials, Fast Track journey removed.

**ConsentSchedule**: The mandatory constraint introduced in v2.1-rc2 has been removed in v2.1-final. ConsentSchedule and its child properties are now optional.

**Insurance TPP-led Issuance**: New in v2.1-final — TPPs can now complete the full policy issuance flow including KYC, premium collection, and document issuance.

## Confluence Resources

- [Open Finance UAE Space](https://openfinanceuae.atlassian.net/wiki/spaces/OF/overview)
- [Standards v2.1-final](https://openfinanceuae.atlassian.net/wiki/spaces/standardsv2dot1final/overview)
- [Standards Catalogue](https://openfinanceuae.atlassian.net/wiki/spaces/OF/pages/6258951)
- [API Hub Documentation](https://openfinanceuae.atlassian.net/wiki/spaces/OF/pages/6226005)
- [Testing Framework](https://openfinanceuae.atlassian.net/wiki/spaces/OF/pages/124583943)
- [Approved Use Cases](https://openfinanceuae.atlassian.net/wiki/spaces/OF/pages/120225803)
- [Limitation of Liability Model](https://openfinanceuae.atlassian.net/wiki/spaces/OF/pages/124944402)
- [Commercial and Pricing Model](https://openfinanceuae.atlassian.net/wiki/spaces/OF/pages/124846096)
- [AML and Fraud Guidelines](https://openfinanceuae.atlassian.net/wiki/spaces/OF/pages/124747798)

### v2.1-final Structure (Confluence Space: standardsv2dot1final)
```
Standards v2.1-final/
├── Common Components/
│   ├── API Security
│   ├── Consent Setup
│   ├── TPP Consent Management Interfaces
│   ├── LFI Consent Management Interfaces
│   ├── Authentication and Authorization
│   ├── Event Notifications over Webhooks (new guidance + OpenAPI)
│   └── Pushed Authorization Request
├── Banking/
│   ├── Bank Service Initiation
│   │   ├── Single Instant Payments
│   │   ├── Future Dated Payments (→ Fixed Defined)
│   │   ├── Multi-Payments (with Combined Creditor support)
│   │   ├── International Payments (15k AED first-time limit)
│   │   ├── Bulk and Batch Payments (Client Credentials upload)
│   │   ├── Payment Refunds (closed account error handling)
│   │   ├── Payments with Open Beneficiaries & Delegated Auth
│   │   └── FX & Remittance Quote & Service Initiation
│   ├── Bank Data Sharing
│   │   ├── Customer Data (ReadProductLendingRates, JWE encryption)
│   │   ├── Unconsented Products Data (Islamic Finance aligned)
│   │   └── Confirmation of Payee (Partial match support)
│   ├── Dynamic Account Opening
│   ├── Common Rules and Guidelines
│   ├── Limits and Constants
│   └── Payment Status Guidelines
├── Insurance/
│   ├── Insurance Data Sharing (JWE premium encryption)
│   ├── Insurance Quote Initiation (TPP-led issuance)
│   │   ├── Motor Insurance
│   │   ├── Home Insurance
│   │   ├── Renters Insurance
│   │   ├── Travel Insurance
│   │   ├── Health Insurance
│   │   ├── Life Insurance (optional riders)
│   │   └── Employment Insurance
│   └── Insurance Common Rules
├── Operational Requirements/
│   └── Availability, Performance and Usage Benchmarks
├── Release Notes
└── Future Functionality
```
