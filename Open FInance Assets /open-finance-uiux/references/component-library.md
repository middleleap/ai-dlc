# Component Library

Reusable UI components for building Al Tareq Open Finance screens. Each component includes HTML structure, CSS, and usage notes.

## Table of Contents

1. [Page Shell](#page-shell)
2. [Header Block](#header-block)
3. [Al Tareq Logo](#altareq-logo)
4. [Progress Bar](#progress-bar)
5. [Content Card](#content-card)
6. [Payment Details Grid](#payment-details-grid)
7. [Account Selector](#account-selector)
8. [Action Buttons](#action-buttons)
9. [Consent Footer](#consent-footer)
10. [Supplementary Info Alert](#supplementary-info-alert)
11. [Redirection Screen](#redirection-screen)
12. [Spinner](#spinner)
13. [Data Sharing Categories](#data-sharing-categories)

---

## Page Shell

The outer container that sets the page background and centers content.

```html
<div class="of-page">
  <div class="of-container">
    <!-- Header, Logo, Progress, Content, Buttons go here -->
  </div>
</div>
```

```css
.of-page {
  min-height: 100vh;
  background-color: var(--color-page-bg, #F0F2FA);
  display: flex;
  justify-content: center;
  padding: 24px;
}

.of-container {
  width: 100%;
  max-width: 720px;
}
```

---

## Header Block

Displays the LFI or TPP identity. This is the only fully customizable area — LFIs/TPPs can use their own logo, colors, and fonts.

```html
<div class="of-header">
  <div class="of-header__logo">
    <img src="lfi-logo.png" alt="LFI Logo" />
  </div>
  <span class="of-header__name">LFI Name</span>
</div>
```

```css
.of-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 0;
}

.of-header__logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: #E8EAF0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.of-header__logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.of-header__name {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary, #1A1D3B);
}
```

---

## Al Tareq Logo

The bilingual brand logo. Always centered. **MUST be inlined as SVG** (never use `<img>` tags or CSS text). Get the SVG code from `svg-assets.md`.

```html
<div class="of-altareq-logo">
  <!-- Paste inline SVG from svg-assets.md here -->
  <!-- Replace {P} with unique prefix (dl, cl, wl) -->
</div>
```

```css
.of-altareq-logo { text-align: center; margin: 12px 0 8px; }
.of-altareq-logo svg { height: 48px; width: auto; }
.of-altareq-logo--white svg { height: 36px; }
```

**Variants:**
- Light background: use **Dark Logo** SVG from `svg-assets.md`
- Dark/gradient background: use **White Logo** SVG from `svg-assets.md`
- Each instance needs a unique gradient ID prefix — see `svg-assets.md` for the prefix table

---

## Progress Bar

Three-step indicator: Consent → Authorize → Complete. Connected by a horizontal line.

```html
<div class="of-progress">
  <div class="of-progress__step of-progress__step--completed">
    <div class="of-progress__circle">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
        <polyline points="6,12 10,16 18,8"></polyline>
      </svg>
    </div>
    <span class="of-progress__label">Consent</span>
  </div>
  <div class="of-progress__line of-progress__line--active"></div>
  <div class="of-progress__step of-progress__step--active">
    <div class="of-progress__circle">2</div>
    <span class="of-progress__label">Authorize</span>
  </div>
  <div class="of-progress__line"></div>
  <div class="of-progress__step">
    <div class="of-progress__circle">3</div>
    <span class="of-progress__label">Complete</span>
  </div>
</div>
```

```css
.of-progress {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin: 16px 0 24px;
  gap: 0;
}

.of-progress__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 80px;
}

.of-progress__circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-progress-inactive, #D1D5E4);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

.of-progress__step--active .of-progress__circle {
  background: var(--color-text-primary, #1A1D3B);
}

.of-progress__step--completed .of-progress__circle {
  background: var(--color-text-primary, #1A1D3B);
}

.of-progress__step--completed .of-progress__circle svg {
  width: 16px;
  height: 16px;
}

.of-progress__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary, #6B7194);
}

.of-progress__step--active .of-progress__label,
.of-progress__step--completed .of-progress__label {
  color: var(--color-text-primary, #1A1D3B);
}

.of-progress__line {
  flex: 1;
  height: 3px;
  background: var(--color-progress-inactive, #D1D5E4);
  margin-top: 15px; /* center with circle */
  min-width: 60px;
}

.of-progress__line--active {
  background: linear-gradient(90deg, #015AD7, #00C8AF);
}
```

**States:** The progress bar appears on the LFI authorization screen. At this point, Consent (step 1) is completed (checkmark), Authorize (step 2) is active (filled number), and Complete (step 3) is inactive (gray number). The line between steps 1 and 2 uses the active gradient; the line between steps 2 and 3 is inactive gray.

---

## Content Card

White rounded card that wraps content sections (payment details, account selection, etc.).

```html
<div class="of-card">
  <h2 class="of-card__heading">Confirm Payment</h2>
  <p class="of-card__description">
    <strong>[TPP trading name]</strong> needs your permission to make the payment below:
  </p>
  <!-- Field grid, account selector, etc. -->
</div>
```

```css
.of-card {
  background: var(--color-card-bg, #FFFFFF);
  border-radius: var(--radius-card, 16px);
  padding: var(--space-card-padding, 24px);
  margin-bottom: var(--space-card-gap, 16px);
  box-shadow: var(--shadow-card, 0 2px 8px rgba(26, 29, 59, 0.06));
}

.of-card__heading {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary, #1A1D3B);
  margin: 0 0 12px;
}

.of-card__subheading {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary, #1A1D3B);
  margin: 20px 0 12px;
}

.of-card__description {
  font-size: 14px;
  color: var(--color-text-secondary, #6B7194);
  margin: 0 0 16px;
  line-height: 1.5;
}

.of-card__description strong {
  color: var(--color-text-primary, #1A1D3B);
}
```

---

## Payment Details Grid

Two-column layout displaying payment information as label-value pairs. Fields are arranged in rows with two pairs per row, separated by light horizontal lines.

```html
<div class="of-fields">
  <div class="of-fields__row">
    <div class="of-fields__cell">
      <span class="of-fields__label">Amount</span>
      <span class="of-fields__value">100 AED</span>
    </div>
    <div class="of-fields__cell">
      <span class="of-fields__label">Payee Name</span>
      <span class="of-fields__value">Merchant</span>
    </div>
  </div>
  <div class="of-fields__row">
    <div class="of-fields__cell">
      <span class="of-fields__label">Payee IBAN</span>
      <span class="of-fields__value">AE07 0331 2345 6789 0123 456</span>
    </div>
    <div class="of-fields__cell">
      <span class="of-fields__label">Payment Reference</span>
      <span class="of-fields__value">Order 123456</span>
    </div>
  </div>
</div>
```

```css
.of-fields {
  border-top: var(--border-field, 1px solid #E8EAF0);
}

.of-fields__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: var(--border-field, 1px solid #E8EAF0);
}

.of-fields__cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  min-height: 48px;
}

.of-fields__cell:first-child {
  border-right: var(--border-field, 1px solid #E8EAF0);
}

.of-fields__label {
  font-size: 13px;
  color: var(--color-text-secondary, #6B7194);
}

.of-fields__value {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary, #1A1D3B);
  text-align: right;
}

/* Single-column row (for fields that span full width like Payment Purpose) */
.of-fields__row--full {
  grid-template-columns: 1fr;
}

.of-fields__row--full .of-fields__cell:first-child {
  border-right: none;
}

/* Responsive: collapse to single column on mobile */
@media (max-width: 480px) {
  .of-fields__row {
    grid-template-columns: 1fr;
  }
  .of-fields__cell:first-child {
    border-right: none;
    border-bottom: var(--border-field, 1px solid #E8EAF0);
  }
}
```

---

## Account Selector

Horizontal row of account cards. One is selectable at a time (radio behavior). For data sharing screens, multiple accounts may be selectable (checkbox behavior).

```html
<div class="of-card">
  <h3 class="of-card__subheading">Please select the account to pay from</h3>
  <div class="of-accounts">
    <label class="of-account of-account--selected">
      <input type="radio" name="account" checked />
      <div class="of-account__content">
        <div class="of-account__header">
          <span class="of-account__type">Current Account</span>
          <span class="of-account__radio"></span>
        </div>
        <span class="of-account__iban">AE07 0331 2345 6123 4567 B90</span>
        <div class="of-account__row">
          <span class="of-account__label">Balance</span>
          <span class="of-account__amount">15,000 AED</span>
        </div>
        <div class="of-account__row">
          <span class="of-account__label">Overdraft</span>
          <span class="of-account__amount">1,500 AED</span>
        </div>
      </div>
    </label>

    <label class="of-account">
      <input type="radio" name="account" />
      <div class="of-account__content">
        <div class="of-account__header">
          <span class="of-account__type">Current Account</span>
          <span class="of-account__radio"></span>
        </div>
        <span class="of-account__iban">AE07 0331 2345 6123 4567 B90</span>
        <div class="of-account__row">
          <span class="of-account__label">Balance</span>
          <span class="of-account__amount">15,000</span>
        </div>
      </div>
    </label>
  </div>
</div>
```

```css
.of-accounts {
  display: flex;
  gap: 12px;
  overflow-x: auto;
}

.of-account {
  flex: 1;
  min-width: 200px;
  border: 1px solid var(--color-unselected-border, #E8EAF0);
  border-radius: var(--radius-account-card, 12px);
  padding: 16px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.of-account input { display: none; }

.of-account--selected,
.of-account:has(input:checked) {
  border: 2px solid var(--color-selected-border, #1A1D3B);
}

.of-account__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.of-account__type {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary, #1A1D3B);
}

.of-account__radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--color-progress-inactive, #D1D5E4);
}

.of-account--selected .of-account__radio,
.of-account:has(input:checked) .of-account__radio {
  border-color: var(--color-accent-blue, #015AD7);
  background: var(--color-accent-blue, #015AD7);
  box-shadow: inset 0 0 0 3px white;
}

.of-account__iban {
  font-size: 12px;
  color: var(--color-text-secondary, #6B7194);
  display: block;
  margin-bottom: 8px;
}

.of-account__row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
}

.of-account__label {
  font-size: 12px;
  color: var(--color-text-secondary, #6B7194);
}

.of-account__amount {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-primary, #1A1D3B);
}

@media (max-width: 480px) {
  .of-accounts { flex-direction: column; }
  .of-account { min-width: 100%; }
}
```

---

## Action Buttons

Always a pair: Cancel (outline) + Primary (gradient with Al Tareq mark). Centered at the bottom of the screen.

```html
<div class="of-actions">
  <button class="of-btn of-btn--cancel">Cancel</button>
  <button class="of-btn of-btn--primary">
    <img src="assets/logos/white-mark.svg" alt="" class="of-btn__icon" />
    Pay using Al Tareq
  </button>
</div>
```

```css
.of-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 24px 0;
}

.of-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 32px;
  border-radius: var(--radius-button, 28px);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
  min-width: 160px;
}

.of-btn:hover { opacity: 0.9; }

.of-btn--cancel {
  background: var(--color-card-bg, #FFFFFF);
  color: var(--color-text-primary, #1A1D3B);
  border: 1.5px solid var(--color-text-primary, #1A1D3B);
}

.of-btn--primary {
  background: var(--gradient-button, linear-gradient(90deg, #003366, #00B894));
  color: white;
  box-shadow: var(--shadow-button, 0 2px 4px rgba(0, 51, 102, 0.15));
}

.of-btn__icon {
  width: 20px;
  height: 20px;
}

@media (max-width: 480px) {
  .of-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
  .of-btn { width: 100%; min-width: auto; }
}
```

**Button Text Variants:**
| Journey | Button Text |
|---------|-------------|
| Payments (SIP, FDP, VRP, FRP, etc.) | "Pay using Al Tareq" |
| Data sharing authorization | "Authorize using Al Tareq" |
| Account connection | "Connect using Al Tareq" |
| Data sharing consent | "Share data using Al Tareq" |

---

## Consent Footer

Additional elements that appear below the main content but above the action buttons. These include balance check permission and trusted payee checkbox.

```html
<div class="of-consent-footer">
  <p class="of-consent-footer__text">
    <strong>[TPP trading name]</strong> will be able to check your balance before making a payment
  </p>
  <label class="of-consent-footer__checkbox">
    <input type="checkbox" checked />
    <span class="of-consent-footer__checkmark"></span>
    Add Merchant to my list of Trusted Payees
  </label>
</div>
```

```css
.of-consent-footer {
  background: var(--color-card-bg, #FFFFFF);
  border-radius: var(--radius-card, 16px);
  padding: var(--space-card-padding, 24px);
  margin-bottom: var(--space-card-gap, 16px);
}

.of-consent-footer__text {
  font-size: 14px;
  color: var(--color-text-secondary, #6B7194);
  margin: 0 0 12px;
}

.of-consent-footer__text strong {
  color: var(--color-text-primary, #1A1D3B);
}

.of-consent-footer__checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-primary, #1A1D3B);
  cursor: pointer;
}

.of-consent-footer__checkbox input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-accent-blue, #015AD7);
}
```

---

## Supplementary Info Alert

Warning banners for overdraft notices, duplicate payment alerts, or exchange rate notes. These appear within the content area, typically between the payment details and the action buttons.

### Overdraft Warning
```html
<div class="of-alert of-alert--warning">
  <div class="of-alert__icon">ⓘ</div>
  <div class="of-alert__content">
    <p>This payment will take your selected account into unarranged overdraft.</p>
    <p>To avoid interest charges and other overdraft fees, please repay the unarranged overdraft by the end of day.</p>
  </div>
</div>
```

### Duplicate Payment Alert
```html
<div class="of-alert of-alert--warning">
  <div class="of-alert__icon">ⓘ</div>
  <div class="of-alert__content">
    <p class="of-alert__title">Duplicate Payment Alert</p>
    <p>Our systems indicate that you have already made a payment of the same amount to this beneficiary in the last 24 hours.</p>
    <p>Please check and ensure that you are not making a duplicate payment that is not required.</p>
  </div>
</div>
```

### Exchange Rate Note
```html
<p class="of-note of-note--warning">
  *Exchange rate is valid for: 2:47
</p>
```

```css
.of-alert {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  margin: 16px 0;
}

.of-alert--warning {
  background: var(--color-warning-bg, #FFF5F3);
}

.of-alert__icon {
  color: var(--color-warning, #E74C3C);
  font-size: 18px;
  flex-shrink: 0;
}

.of-alert__content {
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-secondary, #6B7194);
}

.of-alert__title {
  font-weight: 600;
  color: var(--color-warning, #E74C3C);
  margin: 0 0 4px;
}

.of-alert__content p {
  margin: 0 0 4px;
}

.of-note--warning {
  font-size: 13px;
  color: var(--color-warning, #E74C3C);
  margin: 8px 0 0;
}
```

---

## Redirection Screen

Full-viewport gradient screen shown during TPP ↔ LFI transitions. Features animated spinner, status message, and "Powered by Al Tareq" footer.

```html
<div class="of-redirect">
  <div class="of-redirect__content">
    <div class="of-redirect__spinner">
      <img src="assets/spinner/Property 1=1.svg" alt="" />
    </div>
    <p class="of-redirect__message">
      We're redirecting you to <strong>YOUR LFI</strong><br>
      please keep this window open
    </p>
  </div>
  <div class="of-redirect__footer">
    <span class="of-redirect__powered">Powered by</span>
    <img src="assets/logos/white-logo.svg" alt="Al Tareq" class="of-redirect__logo" />
  </div>
</div>
```

**Variant for return to TPP:**
```html
<p class="of-redirect__message">
  We are securely transferring you back to<br>
  <strong>YOUR TPP</strong>
</p>
```

```css
.of-redirect {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #001B3D 0%, #003366 30%, #006B5A 70%, #00C8AF 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 200;
  color: white;
}

.of-redirect__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.of-redirect__spinner {
  width: 56px;
  height: 56px;
  animation: of-spin 1.2s linear infinite;
}

@keyframes of-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.of-redirect__message {
  font-size: 15px;
  text-align: center;
  line-height: 1.6;
  opacity: 0.9;
}

.of-redirect__message strong {
  font-weight: 700;
  opacity: 1;
}

.of-redirect__footer {
  position: absolute;
  bottom: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.of-redirect__powered {
  font-size: 12px;
  opacity: 0.7;
}

.of-redirect__logo {
  height: 32px;
  width: auto;
}
```

---

## Spinner

The Al Tareq spinner is a circular loading indicator with a gradient stroke. The Figma assets provide 4 rotation frames. In code, use a single SVG with CSS rotation animation.

```html
<div class="of-spinner">
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
    <circle cx="28" cy="28" r="24" stroke="#F5F5FD" stroke-width="8" />
    <circle cx="28" cy="28" r="24" stroke="url(#spinner-gradient)" stroke-width="8"
            stroke-dasharray="12 139" stroke-linecap="round" />
    <defs>
      <linearGradient id="spinner-gradient" x1="4" y1="28" x2="52" y2="28">
        <stop stop-color="#015AD7" />
        <stop offset="1" stop-color="#00C8AF" />
      </linearGradient>
    </defs>
  </svg>
</div>
```

```css
.of-spinner {
  animation: of-spin 1.2s linear infinite;
}
```

---

## Data Sharing Categories

Expandable list of data categories for data sharing consent screens. Each category has an icon, label, and expand chevron.

```html
<div class="of-card">
  <h3 class="of-card__subheading">Review the information you will be sharing</h3>
  <div class="of-data-categories">
    <button class="of-data-category">
      <span class="of-data-category__icon">👤</span>
      <span class="of-data-category__label">Your Account details</span>
      <span class="of-data-category__chevron">›</span>
    </button>
    <button class="of-data-category">
      <span class="of-data-category__icon">💳</span>
      <span class="of-data-category__label">Your Regular Payments</span>
      <span class="of-data-category__chevron">›</span>
    </button>
    <button class="of-data-category">
      <span class="of-data-category__icon">📊</span>
      <span class="of-data-category__label">Your Account Transactions</span>
      <span class="of-data-category__chevron">›</span>
    </button>
    <button class="of-data-category">
      <span class="of-data-category__icon">📄</span>
      <span class="of-data-category__label">Your Statements</span>
      <span class="of-data-category__chevron">›</span>
    </button>
    <button class="of-data-category">
      <span class="of-data-category__icon">⭐</span>
      <span class="of-data-category__label">Your Account Features and Benefits</span>
      <span class="of-data-category__chevron">›</span>
    </button>
    <button class="of-data-category">
      <span class="of-data-category__icon">📋</span>
      <span class="of-data-category__label">Contact and Party Details</span>
      <span class="of-data-category__chevron">›</span>
    </button>
  </div>
  <p class="of-data-expiry">
    <span class="of-data-expiry__icon">⏱</span>
    This permission will expire on:<br>
    <span class="of-data-expiry__date">01/03/2024</span>
  </p>
</div>
```

```css
.of-data-categories {
  display: flex;
  flex-direction: column;
}

.of-data-category {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border: none;
  border-bottom: 1px solid var(--color-card-border, #E8EAF0);
  background: transparent;
  cursor: pointer;
  text-align: left;
  width: 100%;
}

.of-data-category__icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.of-data-category__label {
  flex: 1;
  font-size: 14px;
  color: var(--color-text-primary, #1A1D3B);
}

.of-data-category__chevron {
  font-size: 20px;
  color: var(--color-text-secondary, #6B7194);
}

.of-data-expiry {
  margin: 16px 0 0;
  font-size: 13px;
  color: var(--color-text-secondary, #6B7194);
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.of-data-expiry__date {
  color: var(--color-text-link, #015AD7);
}
```

---

## Bulk Payment File Reference

For bulk/batch payment screens, a file reference indicator shows the submitted CSV file.

```html
<div class="of-file-ref">
  <span class="of-file-ref__icon">📎</span>
  <span class="of-file-ref__text">
    Check the list of payments within the submitted file<br>
    <strong>document-name.CSV</strong>
  </span>
</div>
```

```css
.of-file-ref {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 0;
  font-size: 13px;
  color: var(--color-text-secondary, #6B7194);
}

.of-file-ref strong {
  color: var(--color-text-primary, #1A1D3B);
}
```

---

## Completion Screen

The success/confirmation screen shown after a payment or authorization is completed. Includes a gradient success icon, title, subtitle, transaction details, and a return button.

```html
<div class="of-card" style="text-align: center; padding: 40px 24px;">
  <div class="of-success-icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
      <polyline points="6,12 10,16 18,8"></polyline>
    </svg>
  </div>
  <h2 class="of-success-title">Payment Successful</h2>
  <p class="of-success-subtitle">Your payment has been processed</p>
</div>

<!-- Transaction Details Card -->
<div class="of-card">
  <div class="of-fields">
    <div class="of-fields__row">
      <div class="of-fields__cell">
        <span class="of-fields__label">Amount</span>
        <span class="of-fields__value">250 AED</span>
      </div>
      <div class="of-fields__cell">
        <span class="of-fields__label">Payee Name</span>
        <span class="of-fields__value">Merchant</span>
      </div>
    </div>
    <div class="of-fields__row">
      <div class="of-fields__cell">
        <span class="of-fields__label">Transaction Ref</span>
        <span class="of-fields__value">TXN-OF2026021701</span>
      </div>
      <div class="of-fields__cell">
        <span class="of-fields__label">Date</span>
        <span class="of-fields__value">17 Feb 2026</span>
      </div>
    </div>
    <div class="of-fields__row of-fields__row--full">
      <div class="of-fields__cell">
        <span class="of-fields__label">From Account</span>
        <span class="of-fields__value">Current Account ****001</span>
      </div>
    </div>
  </div>
</div>

<!-- Return Button -->
<div class="of-actions">
  <button class="of-btn of-btn--cancel of-btn--return">
    Return to [TPP Name]
  </button>
</div>
```

```css
.of-success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #015AD7, #00C8AF);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.of-success-icon svg {
  width: 32px;
  height: 32px;
}

.of-success-title {
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary, #1A1D3B);
  margin-bottom: 8px;
}

.of-success-subtitle {
  text-align: center;
  font-size: 14px;
  color: var(--color-text-secondary, #6B7194);
  margin-bottom: 24px;
}

.of-btn--return {
  background: var(--color-card-bg, #FFFFFF);
  color: var(--color-text-primary, #1A1D3B);
  border: 1.5px solid var(--color-card-border, #E8EAF0);
  display: flex;
  margin: 0 auto;
}
```

**Title Variants by Journey Type:**

| Journey | Success Title | Success Subtitle |
|---------|--------------|-----------------|
| SIP | Payment Successful | Your payment has been processed |
| FDP | Payment Scheduled | Your future payment has been set up |
| VRP / FRP | Multi-Payment Set Up | Your recurring payment has been configured |
| FD-MULTI / VD-MULTI | Multi-Payment Set Up | Your payment schedule has been configured |
| IAVDB / EAVB | Multi-Payment Set Up | Your payment arrangement has been configured |
| VRP-OD | Multi-Payment Set Up | Your on-demand payment has been configured |
| COMBINED | Combined Payment Set Up | Your immediate and recurring payments have been configured |
| INTL | International Payment Successful | Your international payment has been processed |
| BULK | Batch Payment Submitted | Your bulk payment has been submitted for processing |
| DATA | Authorization Successful | Your data sharing permissions have been granted |

**Progress Bar on Completion:** All three steps show checkmarks (completed state), and both connecting lines use the active gradient.
