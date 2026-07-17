# AML and Fraud Guidelines

**Version**: 1.1 | **Publication Date**: Jun 29, 2024 | **Classification**: Public

**Note**: These guidelines are provisional and subject to change.

## Table of Contents
1. [LFI Responsibilities](#lfi-responsibilities)
2. [TPP Responsibilities](#tpp-responsibilities)
3. [Risk Information Block](#risk-information-block)
4. [Reporting Requirements](#reporting-requirements)

---

## LFI Responsibilities

LFIs must follow their established protocols to manage AML/fraud for Open Finance transactions.

### Key Principles
- Manage AML and fraud for Open Finance transactions **same as other transactions**
- **Develop real-time fraud/AML capabilities** for all transactions including TPP-initiated
- **No need for additional Open Finance-specific procedures**
- **Utilize and analyze risk indicators** provided by TPPs

### AML/Fraud Monitoring and Prevention

LFIs must:
- Monitor transactions for risk indicators
- Utilize risk indicators from TPPs
- Educate customers on fraud prevention

### AML/Fraud Detection Process

LFIs must:
- Identify suspicious transactions
- Verify activities, including step-up authentication
- Collect supporting documentation

### AML/Fraud Response

LFIs must:
- Conduct investigations
- Decide on resolution options
- Report to authorities

---

## TPP Responsibilities

TPPs must follow robust authentication processes and report risky activities.

### Customer Authentication

TPPs must:
- Ensure **robust customer authentication** in compliance with Open Finance standards
- Apply to services where TPP is responsible for authentication (e.g., delegated SCA)
- **Prevent Fraud** via TPP app access by making it secure with MFA/biometric access

### Suspicious Transactions Monitoring

TPPs must:
- **Monitor transactions** and identify potential fraud risks
- **Report any suspicious activities** via the AML GO portal of CBUAE

### Risk Indicators

TPPs must:
- **Accurately populate risk indicators** defined in the Open Finance Standards
- Provide risk indicators **to LFIs** for payment decisioning

---

## Risk Information Block

The Risk Information Block is mandatory for fraud prevention in payment initiation requests.

### Required Fields

| Field | Description | Values |
|-------|-------------|--------|
| **CustomerPresent** | Whether customer is actively present | true/false |
| **CreditorContract** | Whether creditor has a contract with TPP | true/false |
| **Channel** | Initiation channel | Web, Mobile, Voice, Other |
| **MerchantCategory** | MCC code for merchant classification | ISO 18245 codes |
| **MerchantCategoryCode** | Detailed merchant category | Standard MCC |
| **PaymentContext** | Context of payment | EcommerceGoods, EcommerceServices, BillPayment, P2P, etc. |
| **DeliveryAddress** | Where goods/services delivered | Address object |

### Best Practices

1. **Always populate completely**: Incomplete Risk Blocks may result in payment rejection or liability shift
2. **Real-time updates**: Update customer presence flag in real-time
3. **Accurate MCC codes**: Use correct merchant category codes for proper risk assessment
4. **Document context**: Provide accurate payment context for LFI fraud models

---

## Reporting Requirements

### CBUAE AML GO Portal
All suspicious activity reports must be submitted via the CBUAE AML GO portal.

### Report Types
- Suspicious Transaction Reports (STRs)
- Large Transaction Reports (LTRs)
- Cross-border Transaction Reports

### Timelines
- Immediate notification for critical suspicious activity
- Within 24 hours for standard suspicious activity
- Monthly reports for aggregate data

---

## Liability Implications

### TPP Liability
TPP is liable if:
- Fails to accurately populate Risk Information Block
- Fails to implement MFA/biometric access controls
- Fails to monitor for suspicious transactions
- Fails to report suspicious activity

**Compensation**: 500 AED for VRP/Delegated SCA fraud due to TPP failure

### LFI Liability
LFI is liable if:
- Fails to implement real-time fraud monitoring
- Fails to utilize TPP-provided risk indicators
- Fails to flag alerts despite suspicious patterns

**Compensation**: 250 AED for fraud monitoring failure
