# LFI Integration Requirements

## Table of Contents
1. [API Hub Documentation Versions](#api-hub-documentation-versions)
2. [LFI Integration Architecture](#lfi-integration-architecture)
3. [Ozone Connect API Implementation](#ozone-connect-api-implementation)
4. [LFI Responsibilities](#lfi-responsibilities)
5. [Integration Process](#integration-process)
6. [Testing and Certification](#testing-and-certification)
7. [Admin Portal and Reporting](#admin-portal-and-reporting)

---

## API Hub Documentation Versions

### Version History

| API Hub Docs | Publication | Standards Alignment | Status |
|--------------|-------------|---------------------|--------|
| v1 | Jun 2024 | v1.0 initial | Deprecated |
| v2 | Jul 2024 | v1.0 | Deprecated |
| v3 | Aug 2024 | v1.1 | Deprecated |
| v4 | Sep 2024 | v1.2 + RC2 | Production |
| v5 | Nov 2024 | v1.2 | Production |
| v6 | Jan 2025 | v2.0 + errata | Production |
| **v8** | **Jul 4, 2025** | **v2.1** | **Latest** |

### API Hub v8 Structure (Latest)

```
LFI Integration/
├── Integration Overview
├── API Hub Domains & DNS
├── Keys, CSRs & Certificates
├── Application Layer Authentication
├── JWT Authorization
├── Ozone API Hub Specifications
│   ├── Authorization Server OpenAPI
│   ├── Consent Manager OpenAPI
│   ├── Consent Event & Actions OpenAPI
│   ├── Bank Data Sharing OpenAPI
│   ├── Bank Open Data OpenAPI          ← NEW in v8
│   ├── Bank Service Initiation OpenAPI
│   ├── Insurance OpenAPI
│   ├── Health Checks OpenAPI
│   ├── Bank Product Data OpenAPI       ← NEW in v8
│   └── User Operations OpenAPI         ← NEW in v8
├── Sequence Diagrams
│   ├── Bank Data Sharing
│   ├── Bank Service Initiation - Single Immediate Payment
│   ├── Bank Service Initiation - Payment Refund
│   ├── Bank Service Initiation - Multi-Authorization Journey
│   ├── Insurance Data Sharing
│   ├── CAAP - User Registration        ← NEW in v8
│   └── CAAP - Consent Authorization    ← NEW in v8
├── Questionnaires and Configuration Guides
└── Implementation Guides
    ├── Consent Manager API Guide
    ├── Authorisation Server API Guide
    ├── Ozone Connect Implementation Guide
    └── AlTareq CAAP Integration Guide  ← NEW in v8

TPP Onboarding/
├── TPP Onboarding API Guide
└── TPP Onboarding OpenAPI

User Guides/
├── Admin Portal User Guide
├── Insurance Testing Tool User Guide
├── Banking Testing Tool User Guide
├── Bank Data Sharing: API Hub v8 to Standards v2.1 Response Data Mapping  ← NEW
├── LFI Consent Management Interface Guide
└── Payment Personal Identifiable Information Guide

API Hub Reporting/
├── LFI Reports
├── TPP Reports
└── API Hub Reports & Datasets
```

---

## LFI Integration Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          TPP Layer                               │
│  TPP Mobile/Web App → Initiates consent, receives access token  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                     API Hub (Ozone)                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │ Authorization  │  │ Consent        │  │ Resource       │    │
│  │ Server         │  │ Manager        │  │ Server         │    │
│  │ (Ozone-built)  │  │ (Ozone-built)  │  │ (Ozone-built)  │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                  │
│  • FAPI 2.0 enforcement                                         │
│  • OFTF integration (licensed TPPs only)                        │
│  • Consent management (single source of truth)                  │
│  • API Gateway per LFI (Pre-Prod + Prod)                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │ mTLS (OFTF certificates)
┌──────────────────────────────▼──────────────────────────────────┐
│                     LFI Layer                                    │
│  ┌────────────────┐  ┌────────────────┐                         │
│  │ Ozone Connect  │  │ Consent Auth   │                         │
│  │ API            │  │ Screens        │                         │
│  │ (LFI-built)    │  │ (LFI-built)    │                         │
│  └───────┬────────┘  └───────┬────────┘                         │
│          │                   │                                   │
│  ┌───────▼───────────────────▼────────┐                         │
│  │       Core Banking Systems          │                         │
│  └─────────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### What Ozone Provides (API Hub)
- Authorization Server and Consent Manager
- FAPI 2.0 certified infrastructure
- OFTF integration for TPP validation
- Single industry sandbox with synthetic data
- Dedicated Pre-Production and Production gateways per LFI
- Standard compliance enforcement
- Consent as single source of truth
- Reporting and analytics

### What LFI Must Build
- **Ozone Connect API**: Data Sharing and Service Initiation endpoints
- **Consent Authorization Screens**: Mobile and/or web app integration
- **Core Banking Integration**: Connect Ozone Connect to internal systems
- **Health Check Endpoints**: For monitoring

---

## Ozone Connect API Implementation

### API Categories LFI Must Implement

#### Bank Data Sharing (Ozone Connect)
```
GET /accounts
GET /accounts/{accountId}
GET /accounts/{accountId}/balances
GET /accounts/{accountId}/transactions
GET /accounts/{accountId}/standing-orders
GET /accounts/{accountId}/direct-debits
GET /accounts/{accountId}/beneficiaries
GET /accounts/{accountId}/scheduled-payments
GET /customer
GET /accounts/{accountId}/customer
POST /customers/action/cop-query
GET /statements
GET /accounts/{accountId}/statements
GET /accounts/{accountId}/statements/{statementId}
GET /accounts/{accountId}/statements/{statementId}/transactions
```

#### Bank Service Initiation (Ozone Connect)
```
GET /payments/{paymentId}
POST /payments
GET /payment-consents/{consentId}/refund
```

#### Insurance Data Sharing (Ozone Connect)
```
GET /policies
GET /policies/{policyId}
GET /claims
GET /policies/{policyId}/claims
```

#### Bank Product Data (v8+)
```
GET /products
POST /leads
```

#### Health Checks
```
GET /health
```

#### Consent Events (LFI → API Hub)
```
POST /consent/event/{operation}
PATCH /consent/event/{operation}
```

### Response Data Mapping (v8)
API Hub v8 includes detailed response data mapping guides:
- Accounts Endpoints
- Balances Endpoint
- Transactions Endpoint
- Beneficiaries Endpoint
- Direct Debits Endpoint
- Scheduled Payments Endpoint
- Standing Orders Endpoint
- Customers (Parties) Endpoints
- Statements Endpoint
- Products Endpoint

---

## LFI Responsibilities

### Infrastructure
- [ ] Pre-Production environment deployment
- [ ] Production environment deployment
- [ ] mTLS connectivity (bidirectional with API Hub)
- [ ] Certificates via OFTF
- [ ] Domain names and well-known endpoints

### Development
- [ ] Ozone Connect API integrated with Core Banking
- [ ] Consent Authorization screens (mobile/web)
- [ ] SCA (Strong Customer Authentication) implementation
- [ ] Health check endpoints
- [ ] Event notification handlers

### Security
- [ ] mTLS certificate management
- [ ] JWT authorization implementation
- [ ] Application layer authentication
- [ ] FAPI 2.0 profile compliance (via API Hub)

### Compliance
- [ ] CX certification for consent screens
- [ ] Functional testing via Testing Tool
- [ ] Penetration testing
- [ ] Stress testing (NFR compliance)

---

## Integration Process

### Phase 1: Onboarding
1. KYC/KYB with Mercury (Primary Business Contact)
2. OFTF registration
3. Sign Participation Document
4. Receive OFTF Sandbox access

### Phase 2: Pre-Requisites
Complete questionnaires:
- Pre-Requisites Questionnaire
- Application Layer Authentication Questionnaire
- Environment Configuration (Pre-Prod + Prod)

### Phase 3: Development
1. Build Ozone Connect API
2. Build Consent Authorization screens
3. Integrate with Core Banking
4. Use Testing Tool for validation

### Phase 4: Integration Testing
1. Establish mTLS connectivity (Pre-Production)
2. Test bidirectional communication:
   - LFI → Consent Manager / Authorization Server
   - API Hub → LFI Ozone Connect
3. Functional testing with Postman Collection
4. Testing Tool execution

### Phase 5: Certification
1. CX Certification (screen screenshots)
2. Testing Tool reports (all relevant test cases)
3. Penetration testing
4. Sign-off

### Phase 6: Production
1. Deploy to Production
2. Establish Production mTLS connectivity
3. Functional testing
4. Penetration testing
5. Production sign-off
6. Live Proving with TPPs ("buddying")

---

## Testing and Certification

For complete testing and certification requirements, see `testing-certification.md`.

### Quick Reference

**Testing Tool Execution:**
```bash
docker run --user root --rm -it \
  -v "$(pwd)/logs:/usr/o3/tr-ozone-connect/logs" \
  -v "$(pwd)/config:/usr/o3/tr-ozone-connect/config" \
  public.ecr.aws/g5c5c6i0/tr-image/tr-ozone-connect:cbuae-ais-pis \
  yarn tr-ozone-connect \
  --formatter terse \
  --loglevel-runner info \
  --config /usr/o3/tr-ozone-connect/config/config.yaml \
  --out /usr/o3/tr-ozone-connect/logs/test_logs.json
```

**Test Suite Categories:**
- AIS: Account Information Service
- PIS: Payment Initiation Service
- INS: Insurance
- COPQ: Confirmation of Payee
- PRO: Products
- DSCA: Delegated SCA

---

## Admin Portal and Reporting

### Admin Portal Features
- Bank configuration management
- Dashboard with KPIs
- Consent management
- Outage management
- Audit logs (v6+)
- CBUAE Reports download (v6+)

### LFI Reports
- API call volumes
- Response times (min/max/avg)
- Availability metrics
- Consent lifecycle data
- Consent state distribution
- Revocation statistics

### Datasets
- API Log (raw per-call data)
- Daily roll-up consolidations
- Insurance API statistics
- Payment API statistics
- Consent state reports

### Availability Monitoring
- Ozone Connect uptime tracking
- Planned/unplanned downtime reporting
- LFI-specific performance metrics
