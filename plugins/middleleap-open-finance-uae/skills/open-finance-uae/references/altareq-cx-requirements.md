# Customer Experience (CX) Requirements

## Overview

CX certification ensures all Open Finance screens meet AlTareq brand standards and provide consistent user experience across the ecosystem.

## Screen Categories

### 1. Consent Screens
Displayed when user initiates Open Finance connection.

**Required Elements:**
- AlTareq logo (top section)
- Progress bar showing "Consent" as active step
- TPP identification (name, logo)
- Clear description of requested access
- Data/permissions being requested
- Consent duration/validity period
- Account selection (where applicable)
- "Proceed using AlTareq" or equivalent button

### 2. Authorization Screens
Displayed during authentication with LFI.

**Required Elements:**
- AlTareq logo
- Progress bar showing "Authorize" as active step
- LFI identification
- Transaction/consent summary
- Authentication method (UAE Pass, bank credentials, biometric)
- "Authorize using AlTareq" button

### 3. Confirmation Screens
Displayed after successful authorization.

**Required Elements:**
- AlTareq logo
- Progress bar showing "Complete" as active step
- Success confirmation message
- Transaction/consent reference
- Summary of what was authorized
- Next steps or return to TPP

### 4. Redirection Screens
Displayed during TPP ↔ LFI transitions.

**Required Elements:**
- Clear indication of redirection
- Source and destination identification
- Loading/progress indicator
- AlTareq branding where specified

## Payment-Specific Screens

### Single Instant Payment (SIP)

**Consent Screen Fields (Order Mandatory):**
1. Payment amount
2. Beneficiary name
3. Beneficiary account/IBAN
4. Payment reference (optional)
5. Source account selection

**Button Text:** "Pay by bank using AlTareq"

### Variable Recurring Payment (VRP)

**Consent Screen Fields:**
1. Maximum payment amount
2. Maximum frequency
3. Maximum total value
4. Beneficiary details
5. Consent validity period
6. Source account selection

**Button Text:** "Authorize using AlTareq"

### Future Dated Payment

**Consent Screen Fields:**
1. Payment amount
2. Scheduled date
3. Beneficiary details
4. Payment reference
5. Source account selection

**Button Text:** "Pay using AlTareq"

## Data Sharing Screens

### Account Information Access

**Consent Screen Fields:**
1. Data types requested (accounts, balances, transactions)
2. Access duration
3. Account selection
4. TPP purpose statement

**Button Text:** "Connect using AlTareq" or "Share data using AlTareq"

### Insurance Data Sharing

**Consent Screen Fields:**
1. Policy types to share
2. Data categories (policies, claims)
3. Access duration
4. Insurer identification

**Button Text:** "Share data using AlTareq"

## Field Label Standards

### Preferred Labels
| Standard Label | Acceptable Variations |
|----------------|----------------------|
| Payment Reference | Reference |
| Beneficiary Name | Recipient Name, Payee Name |
| Source Account | Pay From, Debit Account |
| Payment Amount | Amount |
| Scheduled Date | Payment Date |

### Labels That Must Not Change
- AlTareq (brand name)
- IBAN format labels
- Regulatory disclosure text

## Typography & Spacing

### AlTareq Elements (Fixed)
- Logo: Exact specifications from Figma
- Progress bar: Fixed font, colors, spacing
- Buttons: Fixed font, colors, border-radius, padding

### Customizable Areas
- Header section (LFI/TPP branding)
- Field labels (within variation guidelines)
- Field input styling
- Spacing between custom fields

## Color Usage

### AlTareq Brand Colors (Do Not Modify)
- Primary brand color in logo
- Button colors per specification
- Progress bar active/inactive states

### Customizable Colors
- Header background
- Field backgrounds
- Custom section backgrounds
- LFI/TPP accent colors

## Accessibility Requirements

### Mandatory
- Minimum contrast ratios for text
- Touch targets minimum 44x44px
- Screen reader compatibility
- RTL support for Arabic

### Bilingual Support
- Arabic and English required
- RTL layout for Arabic
- Consistent element positioning across languages

## Error Screens

### Required Error Information
- Clear error message
- Error code (where applicable)
- Recovery action (retry, contact support)
- AlTareq branding maintained

### Error Types
- Authentication failure
- Consent declined
- Technical error
- Timeout

## Certification Submission

### Required Screenshots
Per journey type, capture:
1. Initial consent screen
2. Account/policy selection (if applicable)
3. Authorization screen
4. Confirmation screen
5. Any intermediate screens
6. Error screens

### Template Requirements
- One template per brand/segment
- One template per interface (web/mobile)
- All screens in English
- Clear, high-resolution captures
- Full screen captures (not cropped)

### Submission Checklist
- [ ] All mandatory elements present
- [ ] Correct field order
- [ ] AlTareq elements unmodified
- [ ] Button text matches specification
- [ ] Progress bar reflects current step
- [ ] English language throughout
