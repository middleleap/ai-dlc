# Testing and Certification Framework

## Table of Contents
1. [Overview](#overview)
2. [Requirements Summary](#requirements-summary)
3. [Exit Criteria](#exit-criteria)
4. [LFI Testing and Certification](#lfi-testing-and-certification)
5. [TPP Testing and Certification](#tpp-testing-and-certification)
6. [Production Proving](#production-proving)
7. [Fees and Support](#fees-and-support)

---

## Overview

The Testing and Certification Framework ensures LFIs and TPPs provide Open Finance solutions in strict conformance with Standards.

**Objectives:**
- **LFIs**: Ensure consistent APIs to remove complexity for TPPs
- **TPPs**: Ensure correct API consumption to reduce complaints/disputes

**Key Principles:**
- Pre-Production Environment MUST mirror Production Environment (same architecture, network, software, CX)
- Separate certifications required for each brand/application
- Penetration testing required using reputable third party with FAPI/OAuth 2.0 expertise
- Retesting required for: new Standards versions, material changes, or at Nebras discretion

---

## Requirements Summary

### All Participants Must:
1. Conduct testing and obtain certifications prior to go-live for each Standards version
2. Warrant Pre-Production mirrors Production
3. Obtain separate certifications per brand/application
4. Use reputable independent third party for penetration testing

### LFIs Must:
1. Conduct Functional Testing (Ozone Connect Test Suite + Postman Collection) in Pre-Production AND Production
2. Submit and obtain CX Certification before Pre-Production exit
3. Perform penetration and stress testing (meet all NFRs)
4. Engage TPPs for Live Proving before go-live

### TPPs Must:
1. Obtain FAPI, Functional, and CX Certifications using production app connected to API Hub Sandbox
2. Perform penetration testing before go-live
3. Engage at least one LFI to test relevant endpoints in Production

---

## Exit Criteria

### Internal Development → API Hub Sandbox/Pre-Production
**LFI:**
- SIT complete (self-assertion)

**TPP:**
- SIT complete (self-assertion)

### API Hub Sandbox/Pre-Production → Production
**LFI (Pre-Production):**
- Ozone Connect Test Suite 100% passed
- Postman Collection 100% passed
- CX Certification by Nebras

**TPP (Sandbox):**
- FAPI Certification by OIDF
- Functional Certification by Nebras
- CX Certification by Nebras

### API Hub Production → Live Proving
**LFI:**
- Tests 100% passed (both suites)
- CX changes re-certified
- Penetration testing (no critical/high issues)
- Stress testing NFRs compliant with Standards

**TPP:**
- FAPI/Functional/CX changes re-certified
- Penetration testing (no critical/high issues)

### Live Proving → Soft Launch
**LFI:**
- CX changes re-certified
- All endpoints tested by at least 2 TPPs
- No significant open issues
- Acceptable performance and error rates

**TPP:**
- FAPI/Functional/CX changes re-certified
- All relevant endpoints tested with at least 1 LFI
- Complete Risk Block population

---

## LFI Testing and Certification

### LFI FAPI Certification
**Status**: NOT REQUIRED for individual LFIs

The API Hub (OFP) obtains a single FAPI Certification from OIDF and renews it for each major Standards version. Because the OFP enforces the UAE FAPI 2.0 security profile on behalf of LFIs, individual LFIs do not need FAPI certifications.

### LFI Functional Testing
**Certifying Body**: N/A (self-testing with Nebras validation)

**Process:**
1. Run tests in Pre-Production using:
   - **API Hub Testing Tool** (Ozone Connect Test Suite) - tests integration with API Hub
   - **Postman Collection** - tests end-to-end as TPP
2. Pass 100% of tests for relevant endpoints
3. Submit evidence to Nebras
4. Receive Nebras acceptance to exit Pre-Production
5. Rerun both test suites in Production before go-live

**Test Results Submission:**
- Submit HTML report per endpoint when all relevant tests pass
- State supported segments (Retail, SME, Corporate)
- State supported account subtypes
- No failed/skipped tests due to unresolved issues
- Use Regular Expressions to skip postponed endpoints (avoid Failure status)
- Provide justification table for any unavoidable failures/skips

**Justification Table Format:**
| # | API | Test Case | Scenario | Status | Justification |
|---|-----|-----------|----------|--------|---------------|
| 1 | Get by AccountId | AIS_AA001 | Happy Path - CurrentAccount | Skipped | Not supporting SME |

### LFI Customer Experience (CX) Certification
**Certifying Body**: Nebras

LFIs must ensure all authentication, authorization, and consent management screens conform to CX requirements in Standards.

**Process:**
1. Complete certification request template
2. Use separate template for each brand/segment and each interface (web/mobile)
3. Paste relevant screen grabs on each tab
4. All screens in English language
5. Screens can be from Pre-Production (must warrant match to Production)
6. Nebras validates against Standards requirements
7. Update and resubmit if required
8. CX Certification issued when all screens pass

**Required Screens:**
- Consent setup screens
- Authentication screens
- Authorization screens
- Consent dashboard
- All per use case

### LFI Live Proving
**Prerequisites:**
- Penetration Testing complete (no critical/high issues)
- Stress Testing complete (NFRs compliant with Standards at agreed volumes)
- Evidence submitted to Nebras

**Process:**
1. Engage with at least one TPP
2. TPP tests all endpoints in LFI Production
3. Use test user accounts OR volunteer users (staff, friends, family)
4. Provide evidence to Nebras
5. Conduct immediately after each new Production deployment

---

## TPP Testing and Certification

### TPP FAPI Certification
**Certifying Body**: OpenID Foundation (OIDF)

TPPs MUST obtain Relying Party (RP) certification for UAE FAPI 2.0 profile for each application.

**Process:**
1. Run RP tests for UAE FAPI 2 profile in OIDF Conformance Suite
2. Pass all tests
3. Request certification from OIDF: https://openid.net/how-to-certify-your-implementation/
4. Inform Nebras immediately on receipt
5. Certification is exit criteria from API Hub Sandbox

**Resources:**
- [How to run conformance tests](https://openid.net/certification/fapi_rp_testing/)
- [OIDF Conformance Suite](https://www.certification.openid.net/login.html)
- [Conformance Suite Repository](https://gitlab.com/openid/conformance-suite/)

**Important:** All test data (including keys) will be visible in ecosystem and subject to audit. Revoke certificates used in production testing.

**Fees:** See [OIDF fee table](https://openid.net/certification/fees/). Significantly reduced for OIDF members.

### TPP Functional Certification
**Certifying Body**: Nebras

**Process:**
1. Access API Hub Sandbox
2. Execute API calls for each relevant endpoint
3. Submit certification request template
4. Separate template per application
5. Complete relevant tabs (Bank Data, Bank Service Initiation, Insurance Data)
6. Nebras validates successful API calls
7. Retry if required
8. Certification issued when all relevant APIs successful
9. Exit criteria from API Hub Sandbox

### TPP Customer Experience (CX) Certification
**Certifying Body**: Nebras

**Process:**
1. Ensure consent screens conform to CX requirements in Standards
2. Submit certification request template
3. Submit screens for web AND mobile if both supported
4. All screens in English language
5. Nebras validates against Standards
6. Update and resubmit if required
7. Certification issued when all screens pass
8. Exit criteria from API Hub Sandbox

### TPP Live Proving
**Prerequisites:**
- Penetration Testing complete (no critical/high issues)
- Evidence submitted to Nebras

**Process:**
1. Engage with at least one LFI (buddying process via Nebras)
2. Test all relevant endpoints in LFI Production
3. Use volunteer users/accounts/policies established in advance
4. Notify LFI of test users before commencing
5. LFI may provide test accounts
6. Provide evidence to Nebras
7. Conduct prior to go-live, for new app versions, or new Standards

---

## Production Proving

### Buddying Phase
Nebras administers pairing of TPPs and LFIs.

**TPP Responsibility:**
- Validate connectivity to LFI system
- Check authentication protocols
- Ensure services accessible in production
- Test endpoints for correct request/response

**LFI Responsibility:**
- Confirm handling of TPP requests
- Verify proper data field mapping
- Confirm correct response format
- Ensure data quality (accuracy, timeliness, completeness)

### Confirmation and Validation

**Data Quality Assurance:**
- Both parties assess data exchange quality
- Data must be accurate, complete, timely
- TPP tests data usability for intended purposes

**Test Scenarios:**
- Verify data consistency
- Include error scenarios (missing data, failed requests)
- Cover all use cases

**Certification Comparison:**
- Compare system behavior with functional certification results
- Raise anomalies as tickets at service desk
- Compare published CX with actual experience

### Data Quality Verification

TPPs must evaluate:
- **Completeness**: All relevant fields populated correctly
- **Accuracy**: Data matches expected values, no discrepancies
- **Timeliness**: Data within expected timeframes, real-time where applicable
- **Usability**: Data effectively usable in business processes

---

## Fees and Support

### Certification Fees

| Certification | Responsible | Cost | Paid To |
|---------------|-------------|------|---------|
| LFI FAPI | N/A | N/A | N/A |
| LFI Functional | LFI | Covered by OFP | Nebras |
| LFI CX | LFI | Covered by OFP | Nebras |
| TPP FAPI | TPP | See OIDF table | OIDF |
| TPP Functional | TPP | Covered by OFP | Nebras |
| TPP CX | TPP | Covered by OFP | Nebras |

### Support Contacts

**Nebras Support:** support@nebrasopenfinance.ae

**OIDF Support:**
- General: certificate@oidf.org
- Bug reports: https://gitlab.com/openid/conformance-suite/-/issues/new

---

## Retesting Requirements

LFIs and TPPs must retest and renew certification:
1. Every new Standards version implementation
2. Every material change to infrastructure/applications
3. If requested by Nebras

### Ongoing Monitoring

Nebras monitors and may enforce action for:
- Changes that invalidate previous certifications
- Pre-Production/Production environment mismatch
- Failure to retest/renew when required
