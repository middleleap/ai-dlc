# API Specifications Reference

## Table of Contents
1. [API Categories Overview](#api-categories-overview)
2. [Bank Data Sharing APIs](#bank-data-sharing-apis)
3. [Bank Service Initiation APIs](#bank-service-initiation-apis)
4. [Insurance Data Sharing APIs](#insurance-data-sharing-apis)
5. [Product and Metadata APIs](#product-and-metadata-apis)
6. [Consent Management APIs](#consent-management-apis)
7. [Common Rules and Guidelines](#common-rules-and-guidelines)
8. [Error Handling](#error-handling)

---

## API Categories Overview

### API Hub Component Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    TPP Application                       │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                    API Hub (Ozone)                       │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │ Authorization   │  │ Consent         │               │
│  │ Server          │  │ Manager         │               │
│  └─────────────────┘  └─────────────────┘               │
└────────────────────────┬────────────────────────────────┘
                         │ (Ozone Connect API)
┌────────────────────────▼────────────────────────────────┐
│                 LFI Core Systems                         │
└─────────────────────────────────────────────────────────┘
```

### API Families
| Family | Purpose | Consumer |
|--------|---------|----------|
| Bank Data Sharing | Account/transaction data | TPPs via API Hub |
| Bank Service Initiation | Payments, transfers | TPPs via API Hub |
| Insurance Data Sharing | Policy/claims data | TPPs via API Hub |
| Consent Manager | Consent lifecycle | LFIs from API Hub |
| Authorization Server | OAuth/OIDC flows | LFIs from API Hub |
| Ozone Connect | LFI integration | API Hub to LFIs |

---

## Bank Data Sharing APIs

### Accounts
```
GET /accounts
GET /accounts/{accountId}
GET /accounts/{accountId}/balances
```

**Supported Account Types**:
- Retail: Current, Savings
- SME: Current, Savings
- Corporate: Current, Savings

**Currency Support**: ALL available currencies

**Data Clusters**:
| Cluster | Permissions | Description |
|---------|-------------|-------------|
| Account Details | Basic, Detail | Account metadata |
| Balances | Basic, Detail | Current/available balances |
| Transactions | Basic, Detail | Transaction history |
| Beneficiaries | Basic | Saved payees |
| Direct Debits | Basic | DD mandates |
| Standing Orders | Basic | SO instructions |
| Scheduled Payments | Basic | Future payments |

### Transactions
```
GET /accounts/{accountId}/transactions
```

**Pagination**: 100 lines per page, max 13 months per call
**Charging**: Per 100 lines of transaction data

### Standing Orders and Direct Debits
```
GET /accounts/{accountId}/standing-orders
GET /accounts/{accountId}/direct-debits
```

### Customer Data
```
GET /customer
GET /accounts/{accountId}/customer
```

**Address Object Requirements (v1.2-errata1+)**:
- `formatted`: MANDATORY
- `streetAddress`, `locality`, `region`, `postalCode`, `country`: OPTIONAL

### Confirmation of Payee (CoP)
```
POST /customers/action/cop-query
```

**Purpose**: Verify beneficiary details before payment
**Name Object Requirements**:
- Personal Accounts: `fullName` MANDATORY; `firstName`, `lastName` OPTIONAL
- Business Accounts: Trade name mandatory

**Header**: `o3-caller-interaction-id` OPTIONAL (previously mandatory)

---

## Bank Service Initiation APIs

### Single Instant Payments (SIP)
```
POST /domestic-payments
GET /domestic-payments/{paymentId}
```

**Payment Rails**: ONLY via IPP (Instant Payment Platform)
**Currency**: AED only for domestic
**Amount Limits**:
- Minimum: 0.01 AED
- Maximum: Per Max-Inter-bank-Payment-Amount (intra-bank: no limit)

### Future Dated Payments
```
POST /domestic-scheduled-payments
GET /domestic-scheduled-payments/{paymentId}
```

### International Payments
```
POST /international-payments
GET /international-payments/{paymentId}
```

**Currency**: ALL available currencies
**Payment Rails**: All available rails per LFI BAU

### Recurring Payments
**Types**:
- Fixed Recurring (FRP)
- Variable Recurring (VRP)
- Fixed On-demand
- Variable On-demand
- Combined SIP with schedule

### Payment Refunds
```
GET /payment-consents/{consentId}/refund
```

**Response Codes**: Both 400 and 404 accepted

### Payment Status Model
```
┌─────────────┐
│   Pending   │ ←─ Initial state
│   (PDNG)    │
└──────┬──────┘
       │
   ┌───┴───┐
   ▼       ▼
┌──────┐ ┌─────────────────────────────┐
│Reject│ │ Accepted Settlement          │
│(RJCT)│ │ Completed Debtor (ACSC)     │
└──────┘ └─────────────┬───────────────┘
                       │
               ┌───────┴───────┐
               ▼               ▼
┌──────────────────┐  ┌────────────────────┐
│ Accepted Credit  │  │ Accepted Without   │
│ Settlement       │  │ Posting (ACWP)     │
│ Completed (ACCC) │  │                    │
└──────────────────┘  └────────────────────┘
```

---

## Insurance Data Sharing APIs

### Policy Information
```
GET /policies
GET /policies/{policyId}
```

**Covered Products**:
- Motor insurance
- Health insurance
- Property/House insurance
- Travel insurance
- Life insurance

### Claims Information
```
GET /claims
GET /policies/{policyId}/claims
```

### Pricing
- Data sharing: 2.5 fils per call
- Quote requests: 12.5 fils per call

---

## Product and Metadata APIs

### Products
```
GET /products
```

**Purpose**: Discover available financial products

### Leads
```
POST /leads
```

**Purpose**: Submit product interest/applications
**Schema**: Dynamic based on version (v6, v7, v8)

### ATM Locations
```
GET /atm
```

**Purpose**: ATM network information

---

## Consent Management APIs

### Consent Lifecycle
```
POST   /account-access-consents     (Create)
GET    /account-access-consents/{id} (Read)
DELETE /account-access-consents/{id} (Revoke)

POST   /payment-consents            (Create)
GET    /payment-consents/{id}       (Read)
```

### Consent Types
| Type | Use Case | Validity |
|------|----------|----------|
| Single Use | One-time payment | Single authorization |
| Long-lived | Recurring access | Up to 365 days |
| Account Access | Data sharing | Configurable |
| Payment | Service initiation | Per transaction |

### Consent Parameters
- **ExpirationDateTime**: Max authorization window
- **IsSingleAuthorization**: Enforce single authorizer
- **Permissions**: Data cluster access rights
- **Balance Check**: Optional permission for VRP

---

## Common Rules and Guidelines

### Risk Information Block
**Mandatory for all payment types**:
- Customer Present flag (Y/N)
- Creditor Contract with TPP Present flag
- Initiating Channel (Web/Mobile)

**Conditional fields**:
| Field | Merchant Payments | P2P | Self | Business |
|-------|-------------------|-----|------|----------|
| User Name | C (if onboarded) | C | C | C |
| Geo Location | C (if present) | C | C | C |
| Merchant Trading Name | M | N | N | N |
| Trade License | M | O | O | O |
| Verified by CoP | C | M | M | C |

### Payment References
**Debtor Reference** (internal tracking):
- TPP ID + Merchant ID + Creditor BIC (merchant payments)
- TPP ID + Creditor BIC (other payments)

**Creditor Reference** (remittance information):
- Optional, user-entered
- Transferred via payment rails

### Multi-User Authorization
- LFI checks IsSingleAuthorization flag
- If flag set but account requires multiple authorizers: reject
- Notify all authorizers of pending consent
- Update TPP on authorization progress

---

## Error Handling

### Standard HTTP Response Codes
| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 400 | Bad Request | Fix request parameters |
| 401 | Unauthorized | Re-authenticate |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Verify resource exists |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with backoff |

### Payment-Specific Rejection Codes
- IPP platform rejection codes
- AML/compliance rejection reasons
- Insufficient funds indicators

### Passthrough Errors
LFI original error responses pass through API Hub without modification to TPPs (per OF-3140).

---

## Related References

- **Standards Versions**: `standards-versions.md` - API differences between versions
- **LFI Integration**: `lfi-integration.md` - Ozone Connect implementation details
- **Testing**: `testing-certification.md` - API testing requirements
- **Pricing**: `pricing-model.md` - API call fees
