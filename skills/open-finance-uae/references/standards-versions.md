# UAE Open Finance Standards Versions

## Table of Contents
1. [Version History Overview](#version-history-overview)
2. [Standards v1.0-final](#standards-v10-final)
3. [Standards v1.1-final](#standards-v11-final)
4. [Standards v1.2-final](#standards-v12-final)
5. [Standards v2.0-final](#standards-v20-final)
6. [Standards v2.1-final](#standards-v21-final)
7. [Key Differences Between Versions](#key-differences-between-versions)
8. [Implementation Guidance](#implementation-guidance)

---

## Version History Overview

| Version | Publication Date | Status | Key Focus |
|---------|------------------|--------|-----------|
| v1.0-final | Aug 2, 2024 | Deprecated | Initial framework |
| v1.1-final | Nov 1, 2024 | Deprecated | Errata fixes from v1.0 |
| v1.2-final | Dec 20, 2024 | Deprecated | Enhanced features |
| v2.0-final | Apr 4, 2025 | Previous Production | Major uplift |
| v2.1-rc1 | Oct 3, 2025 | Superseded | Release candidate |
| v2.1-rc2 | Nov 21, 2025 | Superseded | Second release candidate |
| **v2.1-final** | **Jan 7, 2026** | **Current — Final for Implementation** | **Final v2.1 with all errata** |

**Important**: v2.1-final is the current implementation target. Based on v2.1-rc1 with all errata incorporated. Previous versions should not be used for new implementations.

---

## Standards v1.0-final

**Publication**: August 2, 2024  
**Status**: DEPRECATED - Do not use for new implementations

### Structure
```
Common Components/
├── API Security
├── User Experience Principles
├── Consent Setup
├── Consent Management Interfaces
├── Authentication and Authorization
│   ├── Authentication by LFI
│   ├── Centralized Authentication and Authorization (CAAP)
│   └── Strong Customer Authentication Guidelines
├── Event Notifications
└── Pushed Authorization Request Endpoint

Banking/
├── Bank Service Initiation
│   ├── Single Instant Payments
│   ├── Future Dated Payments
│   ├── Multi-Payments (Recurring)
│   └── International Payments
├── Bank Data Sharing
│   ├── Customer Data
│   ├── Account Information
│   └── Transaction History
├── Common Rules and Guidelines
└── Limits and Constants

Insurance/
├── Insurance Data Sharing
└── Insurance Common Rules

Operational Guidelines/
└── Availability, Performance, Usage Benchmarks
```

### Key Features Introduced
- FAPI 2.0 security profile for UAE
- Two authentication approaches: Redirection and Decoupled
- Consent management via CAAP or LFI
- IPP (Instant Payment Platform) as mandatory for domestic payments
- Payment status model (Pending, Rejected, ACSC, ACCC/ACWP, ACWC)
- Risk Information Block for fraud prevention
- Multi-user authorization flows

---

## Standards v1.1-final

**Publication**: November 1, 2024  
**Status**: DEPRECATED - Do not use for new implementations

### Changes from v1.0
- All errata from v1.0 incorporated
- Registration Framework additions
- Trust Framework integration details
- OIDC Federation support specifications
- Enhanced client registration requirements

### Registration Framework Additions
- Entity Identifier equals Client Identifier
- Trust Chain validation requirements
- Automatic registration via OIDC Federation
- mtls_endpoint_aliases requirements per RFC 8705

---

## Standards v1.2-final

**Publication**: December 20, 2024  
**Status**: DEPRECATED

### Key Enhancements
1. **Strong Customer Authentication Guidelines** - Detailed SCA implementation guidance
2. **Payments with Delegated Authentication** - TPP-managed SCA for certain flows
3. **Customer Data** - Enhanced data sharing specifications
4. **Data Clusters and Permissions** - Granular permission model

### SCA Guidelines Additions
- FIDO2/Webauthn support specifications
- OpenID for Verifiable Credentials (OID4VC) guidance
- Secure Payment Confirmation (SPC) support
- Dynamic linking requirements
- Possession/Knowledge/Inherence factor definitions

### Payments with Delegated Authentication
- Long-lived consent with TPP-managed SCA
- Balance Check permission as consent extension
- Liability framework alignment
- Device binding requirements (NFC, biometrics)

### Errata Updates (v1.2-final-errata1)
- Address objects: `formatted` mandatory; `streetAddress`, `locality`, `region`, `postalCode`, `country` optional
- Name objects in /cop-query: `fullName` mandatory for personal accounts; `firstName`, `lastName` optional

---

## Standards v2.0-final

**Publication**: April 4, 2025  
**Status**: Previous Production - Still valid for existing systems pending migration

### Major Changes from v1.x
1. **Comprehensive API restructuring**
2. **Enhanced consent management**
3. **Improved payment flows**
4. **International payments enhancements**
5. **Confirmation of Payee (CoP) specifications**
6. **Product data and leads APIs**

### API Categories

See `api-specifications.md` for complete API reference.

**v2.0+ New APIs:**
- POST /customers/action/cop-query (Confirmation of Payee)
- GET /payment-consents/{consentId}/refund (Refunds)
- GET /products (Product Discovery)
- POST /leads (Lead Submission)
- GET /atm (ATM Locations)

### Consent Types
- **Single Use Consent**: One-time authorization
- **Long-lived Consent**: Ongoing access with defined validity
- **Payment Consent**: Service initiation authorization
- **Account Access Consent**: Data sharing authorization

---

## Standards v2.1-final

**Publication**: January 7, 2026  
**Status**: Current — Final version for implementation  
**Classification**: PUBLIC  
**Confluence Space**: `standardsv2dot1final`  
**Based on**: v2.1-rc1 with all errata incorporated

### Major Changes from v2.0 and Release Candidates

#### Authorization APIs
- **PII Creditor split**: Separate properties for Domestic and International Payments
  - Domestic: Only IBAN for `CreditorAccount.SchemeName`; `Creditor.Type` optional
  - International: `ConfirmationOfPayeeResponse` removed
- **ConsentSchedule**: Mandatory constraint from v2.1-rc2 **removed** (now optional)

#### Payments
- PII changes reflected in Bank Service Initiation API
- **Bulk/Batch File Upload**: Changed to Client Credentials grant type (upload before consent authorization)
- ConsentSchedule mandatory constraint removed
- **Fast Track journey removed** (payment auth now required at consent authorization)
- **Single future-dated payments** must be created as Fixed Defined Payments
- Consent end date: `ExpirationDateTime` MUST NOT exceed 1 year from current date

#### Multi-Payments
- Visual illustration of Multi-Payment types and Creditor options
- Wireframes grouped by Multi-Payment type; "Select payment method" removed
- Variable-defined Beneficiary (IAVDB): Beneficiary List under "Who you're paying"
- Variable Beneficiary (EAVB): "Add Merchant to Trusted Payees" removed from LFI UI
- New Section 6.3: Combined Payments to Different Creditors
- Single Future-Dated Payments now a Fixed Defined Multi-Payment type
- New rule 5.8.2: User can add creditor to trusted payees from Open Finance payments

#### International Payments
- Payment limit: 15,000 AED for first-time payments through a single TPP to new beneficiary, per customer, per LFI
- Limit ID 12.1: Max payment applies within first 24 hours

#### Payment Refunds
- New rule: LFI must return error (not account details) when debtor account is closed/suspended/credit-restricted

#### Confirmation of Payee
- **Partial match indicator** added (in addition to Yes/No)
- Discovery operation properties renamed for clarity

#### Common Rules and Guidelines
- **A10.1**: Multi-Creditor consent limits: min 2, max 10 creditors
- **Debtor/Creditor Reference**: Revised Structured Reference guidelines
- **CRG-26.1.2**: Trusted Payee rule extended to International Payments
- **Rule 27** (new): Three-letter country codes required
- **Rule 22** (new): Exception Handling guidance for incomplete journeys
- **Rule 26** (new): Adding Trusted Payee (Beneficiaries)
- **CRG-1.3.1/1.3.2** (new): LFI requirements for dormant/inactive accounts
- **CRG-1.7**: Rule wording updated
- **Risk Block (Rule 9)**: Authentication Channel & Device Info changed from Mandatory to Conditional

#### Limits and Constants
- Limit A2: 30-day consent authorisation limit removed
- New Limit A12.1: Max International Payment for first-time to new beneficiary
- Constant B1: Revised Scheduled Payments Time Window
- New entries A22, A23, A24, A25 added
- New Section D: Payment Purpose Codes (Aani + International Remittances)

#### Customer Data
- `ReadParty` permission: Updated guidance for SME and Corporate accounts
- `FinanceRates`: JWE encryption support for lending rates
- New permission: `ReadProductLendingRates`
- New Section 4.2: Data Sharing Access to Product Lending Rates
- New Section 4.3: Beneficiaries Data Sharing (OFP vs LFI-created)
- Removed unsupported permissions: `ReadTransactionsCredits`, `ReadTransactionsDetail`, `ReadFXProducts`

#### Unconsented Products Data
- Islamic Banking and Finance support (term "Loan" → "Finance")
- Unconsented product objects aligned with Consented product objects

#### Consent Management
- **TPP CMI**: LFI notification requirements removed for pause/reactivate (LFI not notified when consent paused via TPP)
- **LFI CMI**: "Suspended" consent state added to ID4; sidebar menu removed from wireframes
- New Insurance Data Sharing consent management wireframes
- New Insurance consent revocation journey (LFI CMI Section 3.1.3)

#### Webhooks
- ConsentSchedule mandatory constraint removed
- New event notification guidance pages and OpenAPI specification

#### Insurance
- **Motor Insurance**: Vehicle engine details returned; Edata/Auto-data recommended for vehicle specs
- **Insurance Quotes**: Max cover term 1 year (except Life Insurance)
- **Life Insurance**: New optional riders (add-ons) section
- **TPP-led Policy Issuance** (new): TPPs can handle KYC, premium collection, policy document issuance
- **All Insurance Types**: `CountrySubDivision` required for Emirate location in quote requests
- **Insurance Data Sharing**: Premium data JWE encryption; new CX examples for data clusters
- Quote Application Status states updated for TPP-led issuance
- New CX wireframes for Employment Insurance

#### Dynamic Account Opening
- State model aligned with API description (Rule 5)
- Updated CX screens for User Data Sharing and Account Opening

#### FX & Remittance
- Quote lifecycle status model updated
- Multiple new CX screen variations (FX-only, Remittance-only, user account selection, dynamic account opening variations)
- Rule 4.3 updated for quote generation

#### Operational Requirements
- API Performance table updated with v1.2 and v2.0 APIs
- `x-fapi-customer-ip-address` header mandatory on GET /products and POST /leads
- `FullName` added to personal Claims object in Bank Data OpenAPI
- `ExtendedPurpose` definition clarified for international payments

### v2.1-final Confluence Structure
```
Standards v2.1-final (space: standardsv2dot1final)/
├── Common Components
├── Banking
├── Insurance
├── Operational Requirements
├── Release Notes
└── Future Functionality
```

---

## Key Differences Between Versions

### Authentication Evolution
| Aspect | v1.0 | v1.2 | v2.0+ | v2.1-final |
|--------|------|------|-------|------------|
| SCA Guidelines | Basic | Enhanced with FIDO2 | Full specification | Payment auth at consent |
| Delegated Auth | Not available | Introduced | Refined | Fast Track removed |
| CAAP | Basic spec | Enhanced | Production-ready | Production-ready |
| Device binding | Not specified | Defined | Required | Required |

### API Differences
| API | v1.x | v2.0+ | v2.1-final |
|-----|------|-------|------------|
| CoP | Limited | Full specification | + Partial match |
| Payment Refund | N/A | GET /payment-consents/{consentId}/refund | + Closed account handling |
| Products | N/A | GET /products | + mandatory x-fapi-customer-ip-address |
| Leads | N/A | POST /leads | + mandatory x-fapi-customer-ip-address |
| ATM | N/A | GET /atm | GET /atm |
| Bulk/Batch Upload | N/A | Auth Code grant | Client Credentials grant |
| Insurance Issuance | N/A | LFI-led only | + TPP-led issuance |

### Consent Management
| Feature | v1.0 | v1.2 | v2.0+ | v2.1-final |
|---------|------|------|-------|------------|
| Consent Groups | Basic | Enhanced | Full support | Full support |
| Balance Check | N/A | Introduced | Standard | Standard |
| Event notifications | Basic | Enhanced | Comprehensive | + Webhook OpenAPI |
| ConsentSchedule | N/A | N/A | N/A | Optional |
| Max expiration | N/A | N/A | N/A | 1 year |
| Suspended state | N/A | N/A | N/A | Supported in LFI CMI |

---

## Implementation Guidance

### Which Version to Implement?

**New LFI Implementations**: Use Standards **v2.1-final**

**New TPP Implementations**: Use Standards **v2.1-final**

**Existing v2.0 Implementations**: Plan migration to v2.1-final; review Release Notes for all changes

**Existing v1.x Implementations**: Plan migration to v2.1-final (significant changes)

### Version-Specific API Hub Documentation
| Standards Version | API Hub Docs | Publication |
|-------------------|--------------|-------------|
| v1.0 | v1, v2 | Jun-Jul 2024 |
| v1.1 | v3 | Aug 2024 |
| v1.2 | v4, v5 | Sep-Nov 2024 |
| v2.0 | v6, v7 | Jan-Apr 2025 |
| v2.1 | **v8** | **Jul 4, 2025** |

### API Hub v8 New Features
- Bank Open Data OpenAPI
- Bank Product Data OpenAPI
- User Operations OpenAPI
- CAAP sequence diagrams (User Registration, Consent Authorization)
- AlTareq CAAP Integration Guide
- Bank Data Sharing: API Hub v8 to Standards v2.1 Response Data Mapping
- Separate Banking and Insurance Testing Tools

### Certification Requirements
- LFIs: CX certification screens per version
- TPPs: FAPI 2.0 RP certification
- Both: Renewal with each major standards version

### Migration Considerations (v2.0 → v2.1-final)
1. **PII Creditor properties**: Update Domestic/International payment handling for split Creditor properties
2. **ConsentSchedule**: If you implemented mandatory ConsentSchedule from rc2, it's now optional
3. **Bulk/Batch uploads**: Migrate from Auth Code to Client Credentials grant for file uploads
4. **Fast Track removal**: Ensure payment authentication at consent authorization
5. **Future-dated payments**: Convert to Fixed Defined Payment type
6. **CoP partial match**: Implement handling for new Partial match indicator
7. **Risk Block conditionality**: Update Authentication Channel/Device Info from mandatory to conditional
8. **Insurance quotes**: Add `CountrySubDivision` to all quote requests
9. **Removed permissions**: Remove `ReadTransactionsCredits`, `ReadTransactionsDetail`, `ReadFXProducts`
10. **New permissions**: Implement `ReadProductLendingRates`
11. **Country codes**: Ensure three-letter country codes throughout
12. **International payment limit**: Implement 15,000 AED first-time beneficiary limit
13. **Webhook OpenAPI**: Integrate new event notification specification
14. Test in sandbox against v2.1-final schemas
15. Obtain updated certifications
16. Coordinate with Nebras for production cutover
