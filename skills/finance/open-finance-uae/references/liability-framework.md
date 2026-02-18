# Limitation of Liability Model

**Version**: 2.1 | **Publication Date**: Nov 25, 2025 | **Classification**: Public

## Table of Contents
1. [Core Principles](#core-principles)
2. [General / Consent / Authentication Issues](#general-consent-authentication-issues)
3. [Security Incidents](#security-incidents)
4. [Data Issues](#data-issues)
5. [Payments / Exchange Issues](#payments-exchange-issues)
6. [Indirect and Consequential Losses](#indirect-and-consequential-losses)

---

## Core Principles

### Duty of Care
Each participant is responsible and accountable for their assigned or voluntary tasks, whether manual, automated, system-based, technical, or operational.

**Open Finance TPPs and LFIs have a duty of care to their Customers to ensure:**
- Secured systems/processes
- Reliable services
- Clear and accurate information
- Accurate transaction execution

### Breach of Duty
In case of breaches, parties may be liable for direct losses suffered by Users. For example, if a service provider fails to implement adequate security measures and a User's account is hacked, they may be liable for direct losses.

### Data Protection and Privacy
Service providers are responsible for protecting privacy and security of User data. Failure may result in liability for direct losses from compromised or improperly transmitted data.

### Payment of Compensation
All participants MUST pay Open Finance Compensation and direct losses from the liable party to the affected party **as soon as a dispute verdict has been reached**.

**Important Notes:**
- Indirect and consequential losses are NOT compensated under Open Finance standards
- Legal protections under UAE legislation remain in place
- Does not supersede Aani scheme rules and disputes mechanisms
- Nebras max liability: **5 million AED per claim**

---

## General / Consent / Authentication Issues

| Issue | Liable Party | OF Compensation (AED) |
|-------|--------------|----------------------|
| Activity without valid consent | LFI | Case specific |
| TPP failure to maintain consent state causing user detriment | TPP | **500** |
| Failure to revoke consent (via TPP channel) | TPP | **350** |
| Consumer Protection obligations not followed | LFI/TPP | **1,000** |
| Failure to revoke consent (via LFI channel) | LFI | **350** |
| Fraudulent/erroneous LFI authentication | LFI | **500** |
| Inaccurate consent articulation to User | TPP | **350** |
| TPP failure to execute request within SLA | TPP | **350** (12h+), **250** (6h+), **200** (<6h) |
| LFI failure to execute request within SLA | LFI | **350** (12h+), **250** (6h+), **200** (<6h) |
| TPP failure to execute request accurately | TPP | **250** |
| LFI failure to execute request accurately | LFI | **250** |
| LFI data mapping failure causing TPP loss of long-lived consent | LFI | **5,000** |
| Misrepresented service offering by TPP | TPP | **1,000** |
| TPP failure to manage deprecation/endpoint updates | TPP | **2,500** |
| LFI failure to manage breaking changes/deprecation | LFI | **5,000** |
| TPP failure to send required notifications | TPP | **150** |
| API Hub/Trust Framework failure | Nebras | Max **5M** direct losses |
| Incorrect categorization causing invalid pricing (TPP) | TPP | **1,000** |
| Incorrect categorization causing invalid pricing (LFI) | LFI | **1,000** |

---

## Security Incidents

| Issue | Liable Party | OF Compensation (AED) |
|-------|--------------|----------------------|
| LFI security breach (cyber/physical) | LFI | **750** |
| TPP security breach (cyber/physical) | TPP | **750** |
| Data transmitted outside ecosystem by LFI | LFI | **750** |
| Data transmitted outside ecosystem by TPP | TPP | **750** |
| TPP fails to ensure controlled access (MFA) | TPP | **750** |

---

## Data Issues

| Issue | Liable Party | OF Compensation (AED) |
|-------|--------------|----------------------|
| Misuse/loss of data by TPP | TPP | **750** |
| Inaccurate data processing/analysis by TPP | TPP | **500** |
| LFI data shared outside consent | LFI | **750** |
| Data transmitted incorrectly/mis-mapped by LFI | LFI | **500** |
| Inaccurate data in LFI mastered data | LFI | **500** |
| User-submitted error for incorrect onboarding | User | N/A |
| TPP-submitted error for incorrect onboarding | TPP | **350** |
| Inaccurate User-contributed data from LFI | LFI (to User) | Direct losses only |
| Misrepresentation of OF data by TPP | TPP | **500** |
| TPP fails to attempt CoP for new beneficiary | TPP | **250** |
| TPP fails to attempt CoP/KYC for merchant onboarding | TPP | **500** |

---

## Payments / Exchange Issues

| Issue | Liable Party | OF Compensation (AED) |
|-------|--------------|----------------------|
| Incorrect beneficiary details (User supplied/approved) | User | N/A |
| Incorrect beneficiary details (TPP supplied) | TPP | **350** |
| Incorrect beneficiary details (LFI supplied/proxy resolution) | LFI | **350** |
| TPP payment request mismatch to User intention | TPP | **350** |
| Fraudulent VRP/Delegated SCA payment by TPP | TPP | **500** |
| LFI fraud monitoring failure for VRP/Delegated SCA | LFI | **250** |
| Payment initiated outside consent scope | TPP | **350** |
| Fraudulent payment requests (including RTP) via TPP | TPP | **500** |
| LFI failure to execute payment within SLA | LFI | Case specific |

---

## Indirect and Consequential Losses

### Indirect Losses
Losses that are a secondary result of an issue but not the immediate consequence.

**Not compensated** under Open Finance standards but legal protections under UAE legislation remain.

### Consequential Losses
Losses that flow from a breach but are not direct (e.g., lost business opportunities, reputational damage).

**Not compensated** under Open Finance standards but legal protections under UAE legislation remain.

### Tortious Losses
Losses arising from civil wrongs outside of contract.

**Not compensated** under Open Finance standards but legal protections under UAE legislation remain.

---

## Key Requirements

### TPP Obligations
1. Ensure robust customer authentication (including delegated SCA)
2. Prevent fraud via secure app access with MFA/biometrics
3. Monitor transactions and identify fraud risks
4. Report suspicious activities via CBUAE AML GO portal
5. Accurately populate Risk Information Block for LFI payment decisioning
6. Issue Key Facts Statements for each Open Finance service

### LFI Obligations
1. Manage AML and fraud for Open Finance transactions same as other transactions
2. Develop real-time fraud/AML capabilities for all transactions
3. Utilize and analyze risk indicators provided by TPPs
4. No additional Open Finance-specific procedures required

### Deprecation and Change Management
- LFIs must provide adequate notice of API deprecation/retirement
- TPPs must update services to supported API versions after deprecation notices
- Breaking changes must be managed with appropriate notification
