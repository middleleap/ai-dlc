# HTML Blueprint: AlTareq Open Finance Journey Prototypes

This document is the **single source of truth** for the HTML structure and styling of all AlTareq Open Finance journey prototypes. Use this blueprint to generate consistent, working prototypes for all journey types.

## Quick Start

1. **Copy the complete template** — `../assets/templates/consent-flow.html`
2. **Customize placeholders** as documented in the "How to Use This Blueprint" section
3. **Insert SVG assets** from svg-assets.md using the specified prefixes
4. **Add journey-specific content** using the component templates provided
5. **Test screen transitions** using the included JavaScript

---

## How to Use This Blueprint

### Step 1: Replace Page Metadata
- Replace `<!-- JOURNEY_TITLE -->` with the journey's display name (e.g., "Single Payment")
- Replace `<!-- LFI_NAME -->` with the LFI identifier (e.g., "Meridian Trust")
- Replace `<!-- TPP_NAME -->` with the TPP identifier (e.g., "PayBy")

### Step 2: Insert SVG Assets
All SVGs are stored in `svg-assets.md`. Insert them as raw SVG elements:
- **Dark Logo** (prefix: `dl`) → Insert in Authorization screen `.of-altareq-logo` div
- **Color Logo** (prefix: `cl`) → Insert in Completion screen `.of-altareq-logo` div
- **White Logo** (prefix: `wl`) → Insert in Redirect screen `.of-redirect__logo` div
- **White Mark** (prefix: `bm`) → Insert in button `.of-btn__mark` span

### Step 3: Configure Screen Content
- Replace `<!-- AUTHORIZATION_CONTENT -->` with journey-specific content blocks
- Replace `<!-- COMPLETION_DETAILS -->` with transaction result details
- Use the component templates below for structured content

### Step 4: Set Button Text
- **Most journeys**: Use "Pay using AlTareq"
- **Data Sharing (DATA)**: Use "Authorize using AlTareq"
- **VRP variants**: "Authorize using AlTareq"

### Step 5: Optional Sections
Enable/disable these based on journey requirements:
- Account selector (remove if account is pre-selected)
- Data sharing categories (DATA journey only)
- Payment schedule (FD-MULTI, VD-MULTI)
- Beneficiary list (IAVDB only)
- File reference (BULK only)
- Consent footer (multi-payment journeys)
- Supplementary alerts (SIP variants)

---

## Complete HTML Template

The complete template is `../assets/templates/consent-flow.html` (the complete AlTareq consent-flow page) — read that file and fill it in as described here. It is a real HTML file, so it can be opened in a browser as-is.

---

## Component Templates

Use these templates to build journey-specific content blocks. Replace placeholders with actual data.

### Single Payment Authorization Content
```html
<div class="of-card">
  <div class="of-card__heading">Payment Details</div>
  <div class="of-card__subheading">Single Payment Transfer</div>
  <div class="of-card__content">
    <div class="of-fields__row">
      <div class="of-fields__cell">
        <div class="of-fields__label">Amount</div>
        <div class="of-fields__value of-fields__value--accent">AED 1,500.00</div>
      </div>
      <div class="of-fields__cell">
        <div class="of-fields__label">Currency</div>
        <div class="of-fields__value">AED</div>
      </div>
    </div>
    <div class="of-fields__row--full">
      <div class="of-fields__cell">
        <div class="of-fields__label">Beneficiary</div>
        <div class="of-fields__value">John Doe</div>
      </div>
    </div>
    <div class="of-fields__row--full">
      <div class="of-fields__cell">
        <div class="of-fields__label">Beneficiary IBAN</div>
        <div class="of-fields__value">AE070331234567890123456</div>
      </div>
    </div>
    <div class="of-fields__row--full">
      <div class="of-fields__cell">
        <div class="of-fields__label">Payment Reference</div>
        <div class="of-fields__value">Invoice #2024-001</div>
      </div>
    </div>
  </div>
</div>

<div class="of-card">
  <div class="of-card__heading">Select Payment Account</div>
  <div class="of-card__subheading">Choose the account to debit</div>
  <div class="of-accounts">
    <div class="of-account-item">
      <input type="radio" id="account-1" name="payment-account" value="account-1" class="of-account-radio" />
      <label for="account-1" class="of-account-label">
        <div class="of-account-info">
          <div class="of-account-bank">Meridian Trust</div>
          <div class="of-account-number">AE07 0331 1234 5678</div>
          <div class="of-account-balance">Balance: AED 25,000.00</div>
        </div>
      </label>
    </div>
    <div class="of-account-item">
      <input type="radio" id="account-2" name="payment-account" value="account-2" class="of-account-radio" />
      <label for="account-2" class="of-account-label">
        <div class="of-account-info">
          <div class="of-account-bank">Meridian Trust</div>
          <div class="of-account-number">AE07 0331 9876 5432</div>
          <div class="of-account-balance">Balance: AED 12,500.00</div>
        </div>
      </label>
    </div>
  </div>
</div>
```

### Multi-Payment with Schedule Template
```html
<div class="of-card">
  <div class="of-card__heading">Payment Schedule</div>
  <div class="of-card__subheading">Fixed installments over 12 months</div>
  <div class="of-schedule">
    <div class="of-schedule__header">
      <div class="of-schedule__header-cell">Due Date</div>
      <div class="of-schedule__header-cell" style="text-align: right;">Amount</div>
    </div>
    <div class="of-schedule__row">
      <div class="of-schedule__date">15 Mar 2024</div>
      <div class="of-schedule__amount">AED 1,000.00</div>
    </div>
    <div class="of-schedule__row">
      <div class="of-schedule__date">15 Apr 2024</div>
      <div class="of-schedule__amount">AED 1,000.00</div>
    </div>
    <div class="of-schedule__row">
      <div class="of-schedule__date">15 May 2024</div>
      <div class="of-schedule__amount">AED 1,000.00</div>
    </div>
  </div>
</div>

<div class="of-card">
  <div class="of-card__heading">Select Payment Account</div>
  <div class="of-accounts">
    <!-- Account selector radio buttons -->
  </div>
</div>

<div class="of-consent-footer">
  <div class="of-consent-item">
    <div class="of-consent-icon">✓</div>
    <span>Balance will be verified before each payment</span>
  </div>
  <div class="of-consent-item">
    <div class="of-consent-icon">✓</div>
    <span>Payment will be retried once if it fails</span>
  </div>
  <div class="of-consent-checkbox-wrapper">
    <input type="checkbox" id="trusted-payee" class="of-consent-checkbox" />
    <label for="trusted-payee" class="of-consent-label">Mark as trusted payee for future payments</label>
  </div>
</div>
```

### Data Sharing Authorization Content
```html
<div class="of-card">
  <div class="of-card__heading">Select Accounts to Share</div>
  <div class="of-card__subheading">Choose which accounts <!-- TPP_NAME --> can access</div>
  <div class="of-accounts">
    <div class="of-account-item">
      <input type="checkbox" id="account-data-1" name="data-accounts" value="account-1" class="of-account-checkbox" />
      <label for="account-data-1" class="of-account-label">
        <div class="of-account-info">
          <div class="of-account-bank">Meridian Trust Savings</div>
          <div class="of-account-number">AE07 0331 1234 5678</div>
          <div class="of-account-balance">Balance: AED 25,000.00</div>
        </div>
      </label>
    </div>
    <div class="of-account-item">
      <input type="checkbox" id="account-data-2" name="data-accounts" value="account-2" class="of-account-checkbox" />
      <label for="account-data-2" class="of-account-label">
        <div class="of-account-info">
          <div class="of-account-bank">Meridian Trust Current</div>
          <div class="of-account-number">AE07 0331 9876 5432</div>
          <div class="of-account-balance">Balance: AED 12,500.00</div>
        </div>
      </label>
    </div>
  </div>
</div>

<div class="of-card">
  <div class="of-card__heading">Data Categories</div>
  <div class="of-card__subheading">Select what data to share</div>
  <div class="of-categories">
    <div class="of-category">
      <div class="of-category__header">
        <div class="of-category__title">Account Information</div>
        <div class="of-category__toggle">▼</div>
      </div>
      <div class="of-category__content">
        <div class="of-category__items">
          <div class="of-category__item">Account holder name</div>
          <div class="of-category__item">Account number</div>
          <div class="of-category__item">Account type</div>
          <div class="of-category__item">Account status</div>
        </div>
      </div>
    </div>
    <div class="of-category">
      <div class="of-category__header">
        <div class="of-category__title">Transaction History</div>
        <div class="of-category__toggle">▼</div>
      </div>
      <div class="of-category__content">
        <div class="of-category__items">
          <div class="of-category__item">Transaction date</div>
          <div class="of-category__item">Transaction amount</div>
          <div class="of-category__item">Transaction type</div>
          <div class="of-category__item">Merchant name</div>
        </div>
      </div>
    </div>
    <div class="of-category">
      <div class="of-category__header">
        <div class="of-category__title">Balance Information</div>
        <div class="of-category__toggle">▼</div>
      </div>
      <div class="of-category__content">
        <div class="of-category__items">
          <div class="of-category__item">Current balance</div>
          <div class="of-category__item">Available balance</div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### VRP Authorization Content
```html
<div class="of-card">
  <div class="of-card__heading">Variable Recurring Payment</div>
  <div class="of-card__subheading">Set up a recurring payment arrangement</div>
  <div class="of-card__content">
    <div class="of-fields__row">
      <div class="of-fields__cell">
        <div class="of-fields__label">Beneficiary</div>
        <div class="of-fields__value">Utility Provider Co.</div>
      </div>
      <div class="of-fields__cell">
        <div class="of-fields__label">Maximum Amount</div>
        <div class="of-fields__value of-fields__value--accent">AED 500.00</div>
      </div>
    </div>
    <div class="of-fields__row--full">
      <div class="of-fields__cell">
        <div class="of-fields__label">Purpose</div>
        <div class="of-fields__value">Monthly utility bills</div>
      </div>
    </div>
  </div>
</div>

<div class="of-rules">
  <div class="of-rules__title">Payment Rules</div>
  <div class="of-rules__list">
    <div class="of-rules__item">
      <div class="of-rules__marker"></div>
      <span>Payments will not exceed AED 500.00 per transaction</span>
    </div>
    <div class="of-rules__item">
      <div class="of-rules__marker"></div>
      <span>Valid for 12 months from authorization date</span>
    </div>
    <div class="of-rules__item">
      <div class="of-rules__marker"></div>
      <span>You can revoke this authorization at any time</span>
    </div>
    <div class="of-rules__item">
      <div class="of-rules__marker"></div>
      <span>Account balance will be verified before each payment</span>
    </div>
  </div>
</div>

<div class="of-card">
  <div class="of-card__heading">Select Payment Account</div>
  <div class="of-accounts">
    <!-- Account selector -->
  </div>
</div>
```

### IAVDB (Beneficiary) Authorization Content
```html
<div class="of-card">
  <div class="of-card__heading">Add New Beneficiary</div>
  <div class="of-card__subheading">Register a beneficiary for future payments</div>
  <div class="of-card__content">
    <div class="of-fields__row--full">
      <div class="of-fields__cell">
        <div class="of-fields__label">Beneficiary Name</div>
        <div class="of-fields__value">Sarah Johnson</div>
      </div>
    </div>
    <div class="of-fields__row--full">
      <div class="of-fields__cell">
        <div class="of-fields__label">Beneficiary IBAN</div>
        <div class="of-fields__value">AE070331234567890123456</div>
      </div>
    </div>
    <div class="of-fields__row">
      <div class="of-fields__cell">
        <div class="of-fields__label">Bank Country</div>
        <div class="of-fields__value">United Arab Emirates</div>
      </div>
      <div class="of-fields__cell">
        <div class="of-fields__label">Currency</div>
        <div class="of-fields__value">AED</div>
      </div>
    </div>
  </div>
</div>

<div class="of-card">
  <div class="of-card__heading">Your Beneficiaries</div>
  <div class="of-card__subheading">Currently registered beneficiaries</div>
  <div class="of-beneficiaries">
    <div class="of-beneficiary">
      <div class="of-beneficiary__icon">MJ</div>
      <div class="of-beneficiary__info">
        <div class="of-beneficiary__name">Mohammad Jaber</div>
        <div class="of-beneficiary__account">AE07 0331 5555 6666</div>
      </div>
    </div>
  </div>
</div>

<div class="of-card">
  <div class="of-card__heading">Select Payment Account</div>
  <div class="of-accounts">
    <!-- Account selector -->
  </div>
</div>
```

### BULK (File Upload) Authorization Content
```html
<div class="of-card">
  <div class="of-card__heading">Bulk Payment File</div>
  <div class="of-card__subheading">Multiple payments from a file</div>
  <div class="of-file-reference">
    <div class="of-file-reference__icon">📄</div>
    <div class="of-file-reference__info">
      <div class="of-file-reference__name">payments-2024-03.csv</div>
      <div class="of-file-reference__details">256 payments • 1.2 MB • Uploaded 2 hours ago</div>
    </div>
  </div>
</div>

<div class="of-card">
  <div class="of-card__heading">File Summary</div>
  <div class="of-card__content">
    <div class="of-fields__row">
      <div class="of-fields__cell">
        <div class="of-fields__label">Total Transactions</div>
        <div class="of-fields__value">256</div>
      </div>
      <div class="of-fields__cell">
        <div class="of-fields__label">Total Amount</div>
        <div class="of-fields__value of-fields__value--accent">AED 125,450.00</div>
      </div>
    </div>
    <div class="of-fields__row">
      <div class="of-fields__cell">
        <div class="of-fields__label">Currency</div>
        <div class="of-fields__value">AED</div>
      </div>
      <div class="of-fields__cell">
        <div class="of-fields__label">Status</div>
        <div class="of-fields__value">Ready for processing</div>
      </div>
    </div>
  </div>
</div>

<div class="of-card">
  <div class="of-card__heading">Select Payment Account</div>
  <div class="of-accounts">
    <!-- Account selector -->
  </div>
</div>
```

### SIP (Standing Instruction) with Supplementary Alert
```html
<div class="of-alert of-alert--warning">
  <div class="of-alert__icon">!</div>
  <div class="of-alert__content">
    <div class="of-alert__title">Overdraft Protection Active</div>
    <div class="of-alert__description">
      This payment may trigger overdraft protection. Your bank may charge an overdraft fee if insufficient funds are available.
    </div>
  </div>
</div>

<div class="of-card">
  <div class="of-card__heading">Standing Instruction</div>
  <div class="of-card__subheading">Monthly recurring payment</div>
  <div class="of-card__content">
    <div class="of-fields__row">
      <div class="of-fields__cell">
        <div class="of-fields__label">Amount</div>
        <div class="of-fields__value of-fields__value--accent">AED 2,000.00</div>
      </div>
      <div class="of-fields__cell">
        <div class="of-fields__label">Frequency</div>
        <div class="of-fields__value">Monthly</div>
      </div>
    </div>
    <div class="of-fields__row">
      <div class="of-fields__cell">
        <div class="of-fields__label">Start Date</div>
        <div class="of-fields__value">01 Apr 2024</div>
      </div>
      <div class="of-fields__cell">
        <div class="of-fields__label">End Date</div>
        <div class="of-fields__value">31 Mar 2025</div>
      </div>
    </div>
    <div class="of-fields__row--full">
      <div class="of-fields__cell">
        <div class="of-fields__label">Beneficiary</div>
        <div class="of-fields__value">Rent Payment - Building 5</div>
      </div>
    </div>
  </div>
</div>

<div class="of-card">
  <div class="of-card__heading">Select Payment Account</div>
  <div class="of-accounts">
    <!-- Account selector -->
  </div>
</div>
```

### Payment Account (Pre-selected) Template
```html
<div class="of-card">
  <div class="of-card__heading">Payment Account</div>
  <div class="of-card__subheading">Funds will be deducted from</div>
  <div class="of-card__content">
    <div class="of-fields__row--full">
      <div class="of-fields__cell">
        <div class="of-fields__label">Account</div>
        <div class="of-fields__value">Meridian Trust Checking (AE07 0331 1234 5678)</div>
      </div>
    </div>
    <div class="of-fields__row--full">
      <div class="of-fields__cell">
        <div class="of-fields__label">Available Balance</div>
        <div class="of-fields__value of-fields__value--accent">AED 25,000.00</div>
      </div>
    </div>
  </div>
</div>
```

### Completion Details Template
```html
<div class="of-card">
  <div class="of-card__heading">Transaction Summary</div>
  <div class="of-card__content">
    <div class="of-fields__row">
      <div class="of-fields__cell">
        <div class="of-fields__label">Status</div>
        <div class="of-fields__value">Successfully Authorized</div>
      </div>
      <div class="of-fields__cell">
        <div class="of-fields__label">Timestamp</div>
        <div class="of-fields__value">15 Mar 2024, 2:30 PM</div>
      </div>
    </div>
    <div class="of-fields__row--full">
      <div class="of-fields__cell">
        <div class="of-fields__label">Reference ID</div>
        <div class="of-fields__value">RFR-2024-001234567890</div>
      </div>
    </div>
  </div>
</div>

<div class="of-card">
  <div class="of-card__heading">What Happens Next</div>
  <div class="of-card__content">
    <div class="of-consent-item">
      <div class="of-consent-icon">✓</div>
      <span>The payment authorization has been confirmed</span>
    </div>
    <div class="of-consent-item">
      <div class="of-consent-icon">✓</div>
      <span>You will receive a confirmation email shortly</span>
    </div>
    <div class="of-consent-item">
      <div class="of-consent-icon">✓</div>
      <span>Processing typically takes 1-2 business days</span>
    </div>
  </div>
</div>
```

---

## Implementation Notes

### Screen Transition Flow
1. User sees **Authorization screen** with journey-specific content
2. User selects account (if applicable) and clicks primary action button
3. **Redirect screen** displays with spinner for 3 seconds (server processes authorization)
4. **Completion screen** shows success confirmation with transaction details
5. User clicks "Done" to close the journey

### CSS Custom Properties
All colors, gradients, spacing, and typography are managed through CSS custom properties in the `:root` selector. To customize a journey's appearance, override these variables:

```css
:root {
  --color-page-bg: #F0F2FA;
  --color-accent-blue: #015AD7;
  /* ... etc ... */
}
```

### SVG Asset Integration
All SVG assets must be inserted as raw SVG elements (not img tags) to enable filtering/styling. For white logos on the redirect screen, use `filter: brightness(0) invert(1);` in CSS.

### Responsive Design
The blueprint includes media queries for screens ≤480px. Adjust padding, font sizes, and grid layouts for mobile viewports.

### Button Text Configuration
- **Most journeys**: "Pay using AlTareq"
- **DATA, VRP, VRP-OD**: "Authorize using AlTareq"
- Check the journey specification for the correct text

### JavaScript Functionality
- `showScreen(screenId)` — Switch between screens
- `showRedirect()` — Trigger redirect flow with 3-second delay
- `closeWindow()` — Close journey (placeholder for real implementation)
- `onAccountSelected(accountId)` — Handle account selection
- `toggleCategory(categoryElement)` — Toggle data sharing category visibility

---

## File Structure Reference

This blueprint references SVG assets from `svg-assets.md` using these prefixes:
- **dl** — Dark Logo (for Authorization and Completion screens)
- **cl** — Color Logo (for Completion screen alternative)
- **wl** — White Logo (for Redirect screen)
- **bm** — Button Mark/Icon (for primary button)

Ensure all SVG prefixes match the asset document exactly.

---

## Testing Checklist

- [ ] All three screens display correctly
- [ ] Progress bar updates through screen transitions
- [ ] Account selector radio buttons work as expected
- [ ] Category toggles expand/collapse
- [ ] Redirect screen appears for 3 seconds before completion
- [ ] All placeholder comments are replaced with actual content
- [ ] SVG assets render without distortion
- [ ] Responsive design works on mobile (480px viewport)
- [ ] Button colors and gradients match the specifications
- [ ] Text colors meet WCAG contrast requirements
- [ ] All journey-specific content is properly integrated

---

## Version History

- **v1.0** (2024-03-15) — Initial blueprint created with all core components, styles, and templates for AlTareq Open Finance journeys.
