# UAE Bank Data Risk Taxonomy — Quick Reference

Version: 2.5.0

## Overview

| Domain | Categories | Risks | Key Regulations |
|--------|-----------|-------|-----------------|
| DR-1: Data Quality Risk | 6 | 11 | CPS, BCBS 239, MMS, PDPL |
| DR-2: Data Privacy, Protection & Security Risk | 9 | 15 | PDPL, CPS, CPS-AI, MMS |
| DR-3: Data Disclosure & Transparency Risk | 4 | 9 | CPS, PDPL, BCBS 239 |
| DR-4: Data Governance & Compliance Risk | 4 | 10 | CPS, PDPL, MMS, CPS-AI, BCBS 239 |

## DR-1: Data Quality Risk

### DR-1.1: Accuracy Risk
*Risk that data values do not correctly represent the real-world facts they describe*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-1.1-001 | Consumer Data Accuracy Risk | High | Very Low | CTRL-DQ-001, CTRL-DQ-002, CTRL-DQ-003, CTRL-DQ-004, CTRL-DQ-005, CTRL-DQ-010 | CPS-2.1.1.6, CPS-2.1.1.22, CPS-2.1.1.23, CPS-2.1.1.41 (+20) |
| DR-1.1-002 | Model Input Data Accuracy Risk | High | Very Low | CTRL-DG-016, CTRL-DQ-009, CTRL-DQ-010 | CPS-2.1.1.22, CPS-2.3.1.4, CPS-2.3.1.10, CPS-2.3.5.2 (+28) |
| DR-1.1-003 | Risk Data Aggregation Accuracy Risk | High | Very Low | CTRL-DQ-002, CTRL-DQ-003, CTRL-DQ-010, CTRL-DQ-011, CTRL-DQ-012 | BCBS239-P3-002, BCBS239-P3-003, BCBS239-P3-004, BCBS239-P3-008 (+5) |

### DR-1.2: Completeness Risk
*Risk that required data elements are missing or incomplete*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-1.2-001 | Consumer Record Completeness Risk | Medium | Very Low | CTRL-DQ-002, CTRL-DQ-003, CTRL-DQ-004, CTRL-DQ-010 | CPS-2.1.1.23, CPS-2.1.1.32, CPS-2.1.1.33, CPS-2.1.1.50 (+23) |
| DR-1.2-002 | Model Data Completeness Risk | Medium | Very Low | CTRL-DG-016, CTRL-DQ-009, CTRL-DQ-010 | MMS-4.1.2, MMS-4.4.1, MMS-4.6.8, MMS-4.9.1 (+7) |

### DR-1.3: Timeliness Risk
*Risk that data is not available when needed or does not reflect current state*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-1.3-001 | Data Currency Risk | High | Very Low | CTRL-DQ-003, CTRL-DQ-008, CTRL-DQ-010 | CPS-2.1.2.2, CPS-2.1.2.7, CPS-2.2.1.2, CPS-6.2.3.2 (+20) |
| DR-1.3-002 | Stress/Crisis Data Timeliness Risk | High | Very Low | CTRL-DQ-008, CTRL-DQ-013, CTRL-DQ-014 | BCBS239-P5-001, BCBS239-P5-002, BCBS239-P5-003, BCBS239-P6-001 (+4) |

### DR-1.4: Consistency Risk
*Risk that the same data differs across systems, reports, or time periods without valid reason*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-1.4-001 | Data Consistency Risk | Medium | Very Low | CTRL-DQ-002, CTRL-DQ-003, CTRL-DQ-005, CTRL-DQ-006 | MMS-4.9.1, MMS-4.11.1, MMS-5.2.3, MMS-5.4.1 (+6) |
| DR-1.4-002 | Cross-Entity Risk Data Integration Risk | High | Very Low | CTRL-DQ-005, CTRL-DQ-006, CTRL-DG-015, CTRL-DQ-015 | BCBS239-P1-006, BCBS239-P2-002, BCBS239-P2-003, BCBS239-P3-005 (+3) |

### DR-1.5: Validity Risk
*Risk that data does not conform to defined formats, ranges, or business rules*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-1.5-001 | Data Validity Risk | Low | Very Low | CTRL-DQ-001, CTRL-DQ-002, CTRL-DQ-004 | Implied by MMS-5.4.1 (data cleaning), General data governance requirements, BCBS239-P7-001, BCBS239-P7-002 (+2) |

### DR-1.6: Uniqueness Risk
*Risk that duplicate records exist, leading to over-counting or conflicting information*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-1.6-001 | Data Uniqueness Risk | Low | Very Low | CTRL-DQ-002, CTRL-DQ-005, CTRL-DQ-007 | Implied by MMS-5.4.1 (data cleaning), General data governance requirements |


## DR-2: Data Privacy, Protection & Security Risk

### DR-2.1: Consent Management Risk
*Risk that personal data is processed without valid, informed consent or beyond consented purposes*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-2.1-001 | Consent Acquisition Risk | Critical | Low | CTRL-DP-001, CTRL-DP-002 | CPS-2.1.1.46, CPS-2.1.3.14, CPS-6.1.1.5, CPS-6.1.3.2 (+7) |
| DR-2.1-002 | Consent Scope & Withdrawal Risk | High | Very Low | CTRL-DP-002, CTRL-DP-003 | PDPL-4, PDPL-6.1, PDPL-6.2, PDPL-14.1 (+2) |

### DR-2.2: Data Subject Rights Risk
*Risk that data subjects cannot exercise their rights (access, correction, erasure, portability, objection)*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-2.2-001 | Data Subject Rights Fulfillment Risk | High | Very Low | CTRL-DP-004, CTRL-DP-005, CTRL-DP-006 | CPS-2.1.1.50, CPS-6.1.3.6, CPS-6.1.7.1, PDPL-14.1 |

### DR-2.3: Processing Controls Risk
*Risk that data processing activities lack appropriate safeguards and controls*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-2.3-001 | Data Protection Framework Risk | High | Very Low | CTRL-DP-007, CTRL-DP-008 | CPS-3.1.2.1, CPS-6.1.1.6, CPS-6.1.1.8, CPS-6.1.2.2 (+12) |
| DR-2.3-002 | Technical Processing Controls Risk | Critical | Low | CTRL-DP-012, CTRL-DP-013, CTRL-DP-031 | CPS-3.1.2.1, CPS-6.1.1.6, CPS-6.1.1.8, CPS-6.1.3.1 (+12) |

### DR-2.4: Cross-Border Transfer Risk
*Risk that personal data is transferred across borders without adequate protection*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-2.4-001 | Cross-Border Data Transfer Risk | Critical | Low | CTRL-DP-007, CTRL-DP-014, CTRL-DP-015, CTRL-DP-016 | PDPL-7, PDPL-8, PDPL-13.1 |

### DR-2.5: Breach Management Risk
*Risk that data breaches are not detected, contained, or reported as required*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-2.5-001 | Breach Detection Risk | High | Very Low | CTRL-DP-017, CTRL-DP-018, CTRL-DP-021, CTRL-DP-027 | CPS-2.1.4.9, CPS-6.1.1.6, CPS-6.1.1.9, CPS-6.1.2.3 (+6) |
| DR-2.5-002 | Breach Response & Notification Risk | Critical | Medium | CTRL-DP-019, CTRL-DP-020, CTRL-DP-021 | CPS-6.2.1.11, CPS-6.2.2.3, CPS-6.2.3.2, CPS-6.2.3.4 (+6) |

### DR-2.6: Unauthorized Access Risk
*Risk that data is accessed by individuals without legitimate need or authorization*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-2.6-001 | Unauthorized Internal Access Risk | High | Very Low | CTRL-DP-008, CTRL-DP-009, CTRL-DP-010, CTRL-DP-011, CTRL-DP-029, CTRL-DP-031 | CPS-3.1.2.1, CPS-6.1.2.3, CPS-6.1.2.5, CPS-6.1.7.1 (+8) |
| DR-2.6-002 | Unauthorized External Access Risk | Critical | Low | CTRL-DP-012, CTRL-DP-013, CTRL-DP-017, CTRL-DP-019, CTRL-DP-023 | PDPL-8, PDPL-9.1, PDPL-9.2, PDPL-9.4 (+4) |

### DR-2.7: Data Leakage Risk
*Risk that data is unintentionally exposed or transmitted outside authorized boundaries*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-2.7-001 | Data Leakage Risk | High | Very Low | CTRL-DP-008, CTRL-DP-013, CTRL-DP-018, CTRL-DP-022, CTRL-DP-023 | MMS-4.4.5, MMS-4.11.4, MMS-5.3.1, MMS-5.3.3 (+1) |

### DR-2.8: Third-Party Data Risk
*Risk that third parties with access to data do not maintain adequate protection standards*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-2.8-001 | Third-Party Data Sharing Risk | Critical | Low | CTRL-DP-024, CTRL-DP-025, CTRL-DP-027 | CPS-2.1.1.18, CPS-2.1.1.37, CPS-2.1.3.10, CPS-2.1.3.25 (+14) |
| DR-2.8-002 | Third-Party Processor Compliance Risk | High | Low | CTRL-DP-024, CTRL-DP-025, CTRL-DP-026 | CPS-6.1.4.4, CPS-6.1.4.5, CPS-6.1.4.6, CPS-6.1.7.1 (+13) |

### DR-2.9: Data Misuse & Manipulation Risk
*Risk that data is used for unauthorized purposes or deliberately altered/tampered*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-2.9-001 | Internal Data Misuse Risk | High | Very Low | CTRL-DP-008, CTRL-DP-009, CTRL-DP-028, CTRL-DP-029 | CPS-2.1.1.39, CPS-2.1.2.12, CPS-3.1.2.1, CPS-6.1.1.7 (+8) |
| DR-2.9-002 | Data Manipulation & Tampering Risk | High | Very Low | CTRL-DP-011, CTRL-DP-017, CTRL-DP-029, CTRL-DP-030 | CPS-6.2.2.3, CPS-6.2.3.1, CPS-6.2.3.2, CPS-6.2.3.3 (+6) |


## DR-3: Data Disclosure & Transparency Risk

### DR-3.1: Disclosure Completeness Risk
*Risk that required information is not fully disclosed to consumers*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-3.1-001 | Product & Service Feature Disclosure Risk | High | Low | CTRL-DT-001, CTRL-DT-002 | CPS-2.1.1.11, CPS-2.1.1.12, CPS-2.1.1.13, CPS-2.1.1.14 (+15) |
| DR-3.1-002 | Financial Terms Disclosure Risk | Critical | Low | CTRL-DT-001, CTRL-DT-003 | CPS-2.1.1.11, CPS-2.1.1.12, CPS-2.1.1.13, CPS-2.1.1.22 (+13) |
| DR-3.1-003 | Product Risk Warning Disclosure Risk | High | Low | CTRL-DT-001, CTRL-DT-004 | CPS-2.1.1.22, CPS-2.1.1.23, CPS-2.1.1.26, CPS-2.1.2.12 (+12) |

### DR-3.2: Disclosure Accuracy Risk
*Risk that disclosed information contains errors or is misleading*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-3.2-001 | Misleading Disclosure Risk | Critical | Low | CTRL-DT-001, CTRL-DT-002, CTRL-DT-005 | CPS-2.1.1.8, CPS-2.3.1.4, CPS-AI-7.d, BCBS239-P9-001 |

### DR-3.3: Disclosure Accessibility Risk
*Risk that disclosures are not accessible to all consumers (language, format, channels)*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-3.3-001 | Language Accessibility Risk | High | Low | CTRL-DT-006 | CPS-2.1.1.2, CPS-2.1.1.5, CPS-2.1.1.22, CPS-2.1.1.48 (+7) |
| DR-3.3-002 | Format & Readability Risk | Medium | Low | CTRL-DT-007 | CPS-2.1.1.2, CPS-2.1.1.3, CPS-2.1.1.4, CPS-2.1.1.5 (+13) |
| DR-3.3-003 | Channel & Vulnerable Consumer Accessibility Risk | High | Low | CTRL-DT-008, CTRL-DT-009 | CPS-2.1.1.1, CPS-2.1.1.3, CPS-2.1.1.4, CPS-2.1.1.7 (+12) |

### DR-3.4: Disclosure Timeliness Risk
*Risk that disclosures are not provided at the required time or frequency*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-3.4-001 | Pre-Contractual Disclosure Timing Risk | High | Very Low | CTRL-DT-010, CTRL-DT-011 | CPS-2.1.1.19, CPS-2.1.1.20, CPS-2.1.1.23, CPS-2.1.1.27 (+8) |
| DR-3.4-002 | Ongoing Notification Timing Risk | Medium | Very Low | CTRL-DT-012, CTRL-DT-013 | CPS-2.1.1.22, CPS-2.1.1.50, CPS-2.1.2.6, CPS-2.1.3.10 (+19) |


## DR-4: Data Governance & Compliance Risk

### DR-4.1: Regulatory Compliance Risk
*Risk of non-compliance with data-related regulatory requirements*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-4.1-001 | Consumer Protection Regulatory Compliance Risk | High | Low | CTRL-DG-001, CTRL-DG-002 | CPS-2.1.1.1, CPS-2.1.1.6, CPS-2.1.1.10, CPS-2.1.1.22 (+35) |
| DR-4.1-002 | Data Protection Law Compliance Risk | Critical | Low | CTRL-DG-001, CTRL-DG-002 | PDPL-4, PDPL-5, PDPL-7, PDPL-8 (+12) |
| DR-4.1-003 | Model & AI Regulatory Compliance Risk | High | Low | CTRL-DG-001, CTRL-DG-002, CTRL-DG-016 | CPS-AI-2.a, CPS-AI-2.b, CPS-AI-2.d, CPS-AI-2.e (+14) |

### DR-4.2: Policy Adherence Risk
*Risk that internal data policies and standards are not followed*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-4.2-001 | Data Policy Implementation Risk | Medium | Low | CTRL-DG-003, CTRL-DG-004 | CPS-2.1.1.15, CPS-2.1.1.22, CPS-2.1.1.24, CPS-2.1.1.31 (+27) |
| DR-4.2-002 | Policy Monitoring & Enforcement Risk | Medium | Very Low | CTRL-DG-004, CTRL-DG-005, CTRL-DG-006 | CPS-6.1.1.1, CPS-6.1.1.6, CPS-6.1.1.9, CPS-6.1.2.1 (+19) |
| DR-4.2-003 | Risk Report Adequacy Risk | Medium | Low | CTRL-DG-014, CTRL-DG-017, CTRL-DG-018 | BCBS239-P7-001, BCBS239-P7-003, BCBS239-P7-004, BCBS239-P8-001 (+5) |

### DR-4.3: Records Management Risk
*Risk that data records are not retained, archived, or disposed of appropriately*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-4.3-001 | Documentation & Record Creation Risk | Medium | Very Low | CTRL-DG-007, CTRL-DG-015 | CPS-2.1.1.6, CPS-2.1.1.9, CPS-2.1.1.14, CPS-2.1.1.15 (+18) |
| DR-4.3-002 | Record Retention & Disposal Risk | Medium | Very Low | CTRL-DG-007, CTRL-DG-008, CTRL-DG-009, CTRL-DG-010 | CPS-6.1.1.10, CPS-6.1.2.2, CPS-6.1.3.4, CPS-6.1.4.3 (+16) |

### DR-4.4: Accountability Risk
*Risk that roles, responsibilities, and ownership for data are unclear or unassigned*

| Risk ID | Name | Inherent | Residual | Controls | Key Regs |
|---------|------|----------|----------|----------|----------|
| DR-4.4-001 | Data Ownership & Accountability Risk | Medium | Very Low | CTRL-DG-011, CTRL-DG-012, CTRL-DG-015 | CPS-2.1.1.41, CPS-3.1.1.1, CPS-3.1.2.1, CPS-3.1.2.3 (+28) |
| DR-4.4-002 | Data Governance Structure Risk | High | Low | CTRL-DG-012, CTRL-DG-013, CTRL-DG-014 | CPS-AI-7.a, MMS-4.1.2, MMS-4.2.2, MMS-4.2.3 (+22) |


## Controls Summary

| Control ID | Name | Type | Freq | Owner | Auto | Eff. | Pipeline Stage |
|-----------|------|------|------|-------|------|------|---------------|
| CTRL-DG-001 | Regulatory Change Monitoring | Detective | Weekly | 2nd Line | Semi-automated | 73% | post-deploy-monitored |
| CTRL-DG-002 | Compliance Self-Assessment | Detective | Semi-annual | 2nd Line | Manual | 50% | periodic-review |
| CTRL-DG-003 | Policy Review Cycle | Detective | Annual | 2nd Line | Manual | 50% | periodic-review |
| CTRL-DG-004 | Policy Training & Awareness | Preventive | Annual | 2nd Line | Semi-automated | 71% | pre-deploy |
| CTRL-DG-005 | Policy Compliance Monitoring | Detective | Monthly | 2nd Line | Semi-automated | 67% | post-deploy-monitored |
| CTRL-DG-006 | Policy Exception Management | Detective | As Required | 2nd Line | Semi-automated | 61% | post-deploy-monitored |
| CTRL-DG-007 | Records Inventory & Classification | Preventive | Annual | 1st Line | Semi-automated | 71% | pre-deploy |
| CTRL-DG-008 | Retention Schedule Enforcement | Preventive | Continuous | IT | Automated | 100% | pre-merge |
| CTRL-DG-009 | Secure Destruction Procedures | Corrective | Per Event | IT | Semi-automated | 50% | incident-response |
| CTRL-DG-010 | Legal Hold Management | Preventive | As Required | 2nd Line | Manual | 61% | approval-required |
| CTRL-DG-011 | Data Ownership Register | Preventive | Ongoing | 2nd Line | Manual | 79% | approval-required |
| CTRL-DG-012 | Data Stewardship Program | Preventive | Ongoing | 2nd Line | Manual | 79% | approval-required |
| CTRL-DG-013 | DPO Appointment & Reporting | Preventive | Ongoing | 2nd Line | Manual | 79% | approval-required |
| CTRL-DG-014 | Governance Committee Oversight | Detective | Bi-monthly | 2nd Line | Manual | 50% | periodic-review |
| CTRL-DG-015 | Data Catalogue Maintenance | Preventive | Ongoing | 2nd Line | Semi-automated | 89% | pre-deploy |
| CTRL-DG-016 | Model Data Governance | Preventive | Per Model | 2nd Line | Manual | 61% | approval-required |
| CTRL-DG-017 | Risk Report Validation & Sign-off | Preventive | Per Report | 2nd Line | Semi-automated | 71% | pre-deploy |
| CTRL-DG-018 | Periodic Report Relevance Assessment | Detective | Annual | 2nd Line | Manual | 50% | periodic-review |
| CTRL-DP-001 | Consent Collection Mechanism | Preventive | Per Transaction | 1st Line | Semi-automated | 71% | pre-deploy |
| CTRL-DP-002 | Consent Repository & Tracking | Preventive | Continuous | IT | Automated | 100% | pre-merge |
| CTRL-DP-003 | Consent Withdrawal Process | Corrective | As Required | 1st Line | Semi-automated | 50% | incident-response |
| CTRL-DP-004 | Data Subject Rights Request Intake | Preventive | As Required | 1st Line | Semi-automated | 71% | pre-deploy |
| CTRL-DP-005 | DSR Fulfillment Workflow | Corrective | As Required | 2nd Line | Semi-automated | 50% | incident-response |
| CTRL-DP-006 | DSR Response Time Monitoring | Detective | Daily | 2nd Line | Automated | 83% | post-deploy-automated |
| CTRL-DP-007 | Privacy Impact Assessment (PIA) | Preventive | Per Initiative | 2nd Line | Manual | 61% | approval-required |
| CTRL-DP-008 | Data Classification & Labelling | Preventive | Per Data Asset | 1st Line | Semi-automated | 71% | pre-deploy |
| CTRL-DP-009 | Role-Based Access Control (RBAC) | Preventive | Continuous | Information Security | Automated | 100% | pre-merge |
| CTRL-DP-010 | Access Review & Recertification | Detective | Quarterly | Information Security | Semi-automated | 67% | post-deploy-monitored |
| CTRL-DP-011 | Privileged Access Management (PAM) | Preventive | Continuous | Information Security | Automated | 100% | pre-merge |
| CTRL-DP-012 | Encryption at Rest | Preventive | Continuous | Information Security | Automated | 100% | pre-merge |
| CTRL-DP-013 | Encryption in Transit | Preventive | Continuous | Information Security | Automated | 100% | pre-merge |
| CTRL-DP-014 | Cross-Border Transfer Assessment | Preventive | Per Transfer | 2nd Line | Manual | 61% | approval-required |
| CTRL-DP-015 | Standard Contractual Clauses | Preventive | Per Contract | 2nd Line | Manual | 61% | approval-required |
| CTRL-DP-016 | Data Transfer Inventory | Detective | Quarterly | 2nd Line | Manual | 56% | periodic-review |
| CTRL-DP-017 | Security Event Monitoring (SIEM) | Detective | Continuous | Information Security | Automated | 89% | post-deploy-automated |
| CTRL-DP-018 | Data Breach Detection Rules | Detective | Continuous | Information Security | Automated | 89% | post-deploy-automated |
| CTRL-DP-019 | Incident Response Procedures | Corrective | As Required | 2nd Line | Manual | 40% | incident-response |
| CTRL-DP-020 | Breach Notification Process | Corrective | As Required | 2nd Line | Manual | 40% | incident-response |
| CTRL-DP-021 | Breach Register & Tracking | Detective | Ongoing | 2nd Line | Semi-automated | 79% | post-deploy-monitored |
| CTRL-DP-022 | Data Loss Prevention (DLP) | Preventive | Continuous | Information Security | Automated | 100% | pre-merge |
| CTRL-DP-023 | Endpoint Protection | Preventive | Continuous | Information Security | Automated | 100% | pre-merge |
| CTRL-DP-024 | Vendor Due Diligence | Preventive | Per Vendor | 2nd Line | Manual | 61% | approval-required |
| CTRL-DP-025 | Data Processing Agreements | Preventive | Per Contract | 2nd Line | Manual | 61% | approval-required |
| CTRL-DP-026 | Vendor Compliance Monitoring | Detective | Annual | 2nd Line | Manual | 50% | periodic-review |
| CTRL-DP-027 | Vendor Incident Notification | Detective | As Required | 2nd Line | Manual | 50% | periodic-review |
| CTRL-DP-028 | Purpose Limitation Controls | Preventive | Continuous | 1st Line | Semi-automated | 89% | pre-deploy |
| CTRL-DP-029 | Data Access Audit Logging | Detective | Continuous | IT | Automated | 89% | post-deploy-automated |
| CTRL-DP-030 | Data Integrity Controls | Detective | Continuous | IT | Automated | 89% | post-deploy-automated |
| CTRL-DP-031 | Synthetic Data Generation | Preventive | Per Project | IT | Semi-automated | 71% | pre-deploy |
| CTRL-DQ-001 | Data Entry Validation Rules | Preventive | Continuous | 1st Line | Automated | 100% | pre-merge |
| CTRL-DQ-002 | Data Quality Profiling | Detective | Weekly | 2nd Line | Automated | 83% | post-deploy-automated |
| CTRL-DQ-003 | Data Quality Dashboard & Monitoring | Detective | Continuous | 2nd Line | Automated | 89% | post-deploy-automated |
| CTRL-DQ-004 | Data Correction Workflow | Corrective | As Required | 1st Line | Semi-automated | 50% | incident-response |
| CTRL-DQ-005 | Master Data Governance | Preventive | Ongoing | 2nd Line | Manual | 79% | approval-required |
| CTRL-DQ-006 | Cross-System Data Reconciliation | Detective | Daily | IT | Automated | 83% | post-deploy-automated |
| CTRL-DQ-007 | Duplicate Detection & Merge | Detective | Weekly | IT | Automated | 83% | post-deploy-automated |
| CTRL-DQ-008 | Data Refresh & Currency Monitoring | Detective | Continuous | IT | Automated | 89% | post-deploy-automated |
| CTRL-DQ-009 | Model Input Data Validation | Preventive | Per Model Run | 1st Line | Automated | 82% | pre-merge |
| CTRL-DQ-010 | Data Quality Issue Escalation | Corrective | As Required | 2nd Line | Manual | 40% | incident-response |
| CTRL-DQ-011 | End-User Computing (EUC) Inventory & Controls | Detective | Quarterly | 2nd Line | Semi-automated | 67% | post-deploy-monitored |
| CTRL-DQ-012 | Risk Data-to-Source Reconciliation | Detective | Daily | IT | Automated | 83% | post-deploy-automated |
| CTRL-DQ-013 | Stress/Crisis Data Production Testing | Detective | Semi-annual | 2nd Line | Manual | 50% | periodic-review |
| CTRL-DQ-014 | Critical Risk Data SLA Monitoring | Detective | Continuous | IT | Automated | 89% | post-deploy-automated |
| CTRL-DQ-015 | Enterprise Data Taxonomy & Dictionary Management | Preventive | Ongoing | 2nd Line | Semi-automated | 79% | pre-deploy |
| CTRL-DT-001 | Disclosure Template Management | Preventive | Per Template | 2nd Line | Semi-automated | 71% | pre-deploy |
| CTRL-DT-002 | Disclosure Content Review | Detective | Per Disclosure | 2nd Line | Manual | 50% | periodic-review |
| CTRL-DT-003 | Fee & Charges Schedule Maintenance | Preventive | Per Change | 1st Line | Semi-automated | 71% | pre-deploy |
| CTRL-DT-004 | Risk Warning Templates | Preventive | Per Product | 2nd Line | Manual | 61% | approval-required |
| CTRL-DT-005 | Misleading Content Review | Detective | Per Communication | 2nd Line | Manual | 50% | periodic-review |
| CTRL-DT-006 | Arabic Translation & Localization | Preventive | Per Document | 1st Line | Manual | 61% | approval-required |
| CTRL-DT-007 | Plain Language Review | Detective | Per Document | 2nd Line | Manual | 50% | periodic-review |
| CTRL-DT-008 | Accessibility Compliance Review | Detective | Per Document | 2nd Line | Manual | 50% | periodic-review |
| CTRL-DT-009 | Multi-Channel Disclosure Consistency | Detective | Quarterly | 1st Line | Manual | 56% | periodic-review |
| CTRL-DT-010 | Pre-Contract Disclosure Checklist | Preventive | Per Transaction | 1st Line | Semi-automated | 71% | pre-deploy |
| CTRL-DT-011 | Cooling-Off Period Management | Preventive | Per Transaction | 1st Line | Semi-automated | 71% | pre-deploy |
| CTRL-DT-012 | Change Notification Scheduling | Preventive | Per Event | 1st Line | Automated | 82% | pre-merge |
| CTRL-DT-013 | Notification Delivery Confirmation | Detective | Per Notification | IT | Automated | 71% | post-deploy-automated |