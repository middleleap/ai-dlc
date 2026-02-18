---
name: altareq-brand-guidelines
description: AlTareq brand implementation guidelines for UAE Open Finance. Use when designing or implementing Open Finance user interfaces, consent screens, payment buttons, progress indicators, or any customer-facing Open Finance journeys. Covers mandatory brand elements (logo, buttons, progress bar), CX requirements for LFIs and TPPs, allowable customizations, and screen certification requirements. Triggers on queries about AlTareq branding, Open Finance UI design, consent screen design, payment button styling, CX certification, or "Pay by bank using AlTareq" implementation.
---

# AlTareq Brand Guidelines

Implementation guide for AlTareq brand elements in UAE Open Finance user journeys.

## Quick Reference

| Aspect | Requirement |
|--------|-------------|
| Version | 1.0 (Oct 31, 2024) |
| Scope | All Open Finance user journeys |
| Applies To | LFIs and TPPs |
| Authority | CBUAE / Nebras |
| Assets | Figma files per journey type |

## Mandatory Brand Elements

### AlTareq Logo
- Must appear on all consent/authorization screens
- Follow exact design specifications from Standards
- No modifications to color, spacing, or proportions

### Progress Bar
- Three-step indicator: **Consent → Authorize → Complete**
- Must appear on all screens showing the logo
- Follow exact design from Standards

### AlTareq Buttons
Standard button text variants:
- "Pay by bank using AlTareq"
- "Pay using AlTareq"
- "Proceed using AlTareq"
- "Authorize using AlTareq"
- "Connect using AlTareq"
- "Share data using AlTareq"

**Requirements:**
- Exact design (color, spacing, font) per Standards
- Display on all applicable screens
- No modifications to button styling

## Journey Types

### Bank Service Initiation
- Single Instant Payments
- Future Dated Payments
- Recurring Payments (VRP/FRP)
- International Payments

### Bank Data Sharing
- Account Information
- Transaction History
- Balance Data

### Insurance Data Sharing
- Policy Information
- Claims Data

## CX Requirements

### General Requirements (Mandatory)

LFIs and TPPs **MUST**:

1. Include AlTareq logo and progress bar on all specified screens
2. Follow exact design specifications (color, spacing, font)
3. Include AlTareq buttons on all specified screens
4. Display all fields and data elements in the same order as Standards
5. Follow exact design for redirection screens
6. NOT introduce additional screens or steps not defined in Standards

### Allowable Variations

LFIs and TPPs **MAY**:

1. Use own name/logo/design/color in screen header
2. Use own fonts, colors, spacing for fields between progress bar and buttons
3. Make subtle field label changes (e.g., "Reference" instead of "Payment Reference")
4. Include supplemental information where explicitly allowed in Standards

## Screen Design Structure

```
┌─────────────────────────────────────┐
│  [LFI/TPP Header - Customizable]    │
├─────────────────────────────────────┤
│  [AlTareq Logo]                     │  ← Mandatory
│  [Progress Bar: Consent-Auth-Done]  │  ← Mandatory
├─────────────────────────────────────┤
│                                     │
│  [Data Fields - Order per Standards]│  ← Customizable styling
│  [Account/Payment Details]          │     but fixed order
│                                     │
├─────────────────────────────────────┤
│  [Pay by bank using AlTareq]        │  ← Mandatory button
└─────────────────────────────────────┘
```

## CX Certification Process

1. **Prepare Screens**: Capture all consent/auth screens per journey type
2. **Separate Templates**: One per brand/segment AND per interface (web/mobile)
3. **Language**: All screens must be in English
4. **Submit**: Via certification request template to Nebras
5. **Review**: Nebras validates against Standards
6. **Iterate**: Update and resubmit if required
7. **Certification**: Issued when all screens pass

**Note**: Pre-production screens accepted if warranted to match production exactly.

## Standards References

### User Experience Principles
- Section 9: Useful Elements in the User Journey
- Section 10: Unhelpful Elements in the User Journey
- Section 11: Other Rules for User Journeys

### Customer Experience Sections
Each journey type in Standards includes:
- Required screen layouts
- Field order and labels
- Button placement and styling
- Progress bar positioning

## Resources

### Official Sources
- [AlTareq Brand Guidelines PDF](https://openfinanceuae.atlassian.net/wiki/spaces/OF/pages/196116611)
- Figma Files per journey (linked from Confluence)
- Standards CX sections per journey type

### Support
- Nebras Support: support@nebrasopenfinance.ae

## Implementation Checklist

### Before Development
- [ ] Access Figma files for target journey
- [ ] Review Standards CX section for journey type
- [ ] Identify all required screens

### During Development
- [ ] Implement AlTareq logo per specifications
- [ ] Implement progress bar per specifications
- [ ] Implement buttons with exact styling
- [ ] Maintain field order from Standards
- [ ] Implement redirection screens per Standards

### Before Certification
- [ ] Capture all screen screenshots
- [ ] Verify English language on all screens
- [ ] Prepare separate templates per brand/interface
- [ ] Ensure pre-prod matches production

See `references/cx-requirements.md` for detailed screen specifications.
See `references/journey-screens.md` for journey-specific screen requirements.
