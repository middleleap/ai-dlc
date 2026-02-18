# HTML Blueprint: Al Tareq Open Finance Journey Prototypes

This document is the **single source of truth** for the HTML structure and styling of all Al Tareq Open Finance journey prototypes. Use this blueprint to generate consistent, working prototypes for all journey types.

## Quick Start

1. **Copy the Complete Template** below
2. **Customize placeholders** as documented in the "How to Use This Blueprint" section
3. **Insert SVG assets** from svg-assets.md using the specified prefixes
4. **Add journey-specific content** using the component templates provided
5. **Test screen transitions** using the included JavaScript

---

## How to Use This Blueprint

### Step 1: Replace Page Metadata
- Replace `<!-- JOURNEY_TITLE -->` with the journey's display name (e.g., "Single Payment")
- Replace `<!-- LFI_NAME -->` with the LFI identifier (e.g., "ADCB")
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
- **Most journeys**: Use "Pay using Al Tareq"
- **Data Sharing (DATA)**: Use "Authorize using Al Tareq"
- **VRP variants**: "Authorize using Al Tareq"

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

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><!-- JOURNEY_TITLE --> | Al Tareq Open Finance</title>

  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

  <style>
    /* ===== CSS CUSTOM PROPERTIES ===== */
    :root {
      --color-page-bg: #F0F2FA;
      --color-card-bg: #FFFFFF;
      --color-card-border: #E8EAF0;
      --color-text-primary: #1A1D3B;
      --color-text-secondary: #6B7194;
      --color-text-link: #015AD7;
      --color-accent-blue: #015AD7;
      --color-accent-teal: #00C8AF;
      --color-warning: #E74C3C;
      --color-warning-bg: #FFF5F3;
      --color-selected-border: #1A1D3B;
      --color-progress-inactive: #D1D5E4;
      --gradient-button: linear-gradient(90deg, #003366 0%, #00B894 100%);
      --gradient-progress: linear-gradient(90deg, #015AD7 0%, #00C8AF 100%);
      --gradient-redirect: linear-gradient(135deg, #001B3D 0%, #003366 30%, #006B5A 70%, #00C8AF 100%);
      --radius-card: 16px;
      --radius-button: 28px;
      --radius-account-card: 12px;
      --shadow-card: 0 2px 8px rgba(26, 29, 59, 0.06);
      --shadow-button: 0 2px 4px rgba(0, 51, 102, 0.15);
    }

    /* ===== GLOBAL STYLES ===== */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: var(--color-page-bg);
      color: var(--color-text-primary);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* ===== SCREEN MANAGEMENT ===== */
    .screen {
      display: none;
      width: 100%;
      min-height: 100vh;
    }

    .screen.active {
      display: flex;
      flex-direction: column;
    }

    /* ===== PAGE SHELL ===== */
    .of-page {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      background-color: var(--color-page-bg);
      padding: 32px 24px;
    }

    .of-container {
      max-width: 600px;
      width: 100%;
      margin: 0 auto;
    }

    /* ===== HEADER BLOCK ===== */
    .of-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
      padding: 12px 16px;
      background-color: var(--color-card-bg);
      border: 1px solid var(--color-card-border);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-card);
    }

    .of-header__logo {
      width: 40px;
      height: 40px;
      min-width: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #015AD7, #00C8AF);
      border-radius: 8px;
      color: white;
      font-weight: 700;
      font-size: 14px;
    }

    .of-header__name {
      font-weight: 600;
      font-size: 16px;
      color: var(--color-text-primary);
    }

    /* ===== ALTAREQ LOGO ===== */
    .of-altareq-logo {
      display: flex;
      justify-content: center;
      margin-bottom: 32px;
      height: 80px;
    }

    .of-altareq-logo svg {
      max-height: 100%;
      width: auto;
    }

    .of-altareq-logo--white svg {
      filter: brightness(0) invert(1);
    }

    /* ===== PROGRESS BAR ===== */
    .of-progress {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
      justify-content: center;
    }

    .of-progress__step {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .of-progress__dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: white;
      background-color: var(--color-progress-inactive);
      transition: all 0.3s ease;
    }

    .of-progress__dot.complete {
      background: var(--gradient-progress);
    }

    .of-progress__dot.active {
      background: var(--gradient-progress);
      box-shadow: 0 0 0 8px rgba(1, 90, 215, 0.1);
    }

    .of-progress__label {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-secondary);
      text-align: center;
      min-width: 60px;
    }

    .of-progress__label.complete {
      color: var(--color-text-primary);
      font-weight: 600;
    }

    .of-progress__label.active {
      color: var(--color-accent-blue);
      font-weight: 600;
    }

    .of-progress__connector {
      width: 12px;
      height: 2px;
      background-color: var(--color-progress-inactive);
      transition: all 0.3s ease;
    }

    .of-progress__connector.active {
      background: var(--gradient-progress);
    }

    /* ===== CONTENT CARD ===== */
    .of-card {
      background-color: var(--color-card-bg);
      border: 1px solid var(--color-card-border);
      border-radius: var(--radius-card);
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: var(--shadow-card);
      transition: all 0.2s ease;
    }

    .of-card:hover {
      box-shadow: 0 4px 16px rgba(26, 29, 59, 0.1);
    }

    .of-card__heading {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 8px;
    }

    .of-card__subheading {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-secondary);
      margin-bottom: 16px;
    }

    .of-card__description {
      font-size: 13px;
      line-height: 1.6;
      color: var(--color-text-secondary);
      margin-bottom: 12px;
    }

    .of-card__content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* ===== FIELDS GRID ===== */
    .of-fields {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .of-fields__row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .of-fields__row--full {
      grid-template-columns: 1fr;
    }

    .of-fields__cell {
      display: flex;
      flex-direction: column;
    }

    .of-fields__label {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .of-fields__value {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
      word-break: break-word;
    }

    .of-fields__value--accent {
      color: var(--color-accent-blue);
      font-weight: 600;
    }

    /* ===== ACCOUNT SELECTOR (RADIO) ===== */
    .of-accounts {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .of-account-item {
      position: relative;
      cursor: pointer;
    }

    .of-account-radio {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
      cursor: pointer;
    }

    .of-account-label {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background-color: var(--color-card-bg);
      border: 2px solid var(--color-card-border);
      border-radius: var(--radius-account-card);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .of-account-radio:checked + .of-account-label {
      background-color: rgba(1, 90, 215, 0.05);
      border-color: var(--color-selected-border);
    }

    .of-account-radio:checked + .of-account-label::before {
      content: '';
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--gradient-progress);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .of-account-radio:not(:checked) + .of-account-label::before {
      content: '';
      width: 18px;
      height: 18px;
      border: 2px solid var(--color-progress-inactive);
      border-radius: 50%;
      flex-shrink: 0;
    }

    .of-account-info {
      flex: 1;
    }

    .of-account-bank {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .of-account-number {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      font-family: 'Courier New', monospace;
    }

    .of-account-balance {
      font-size: 12px;
      color: var(--color-text-secondary);
      margin-top: 4px;
    }

    /* ===== ACCOUNT SELECTOR (CHECKBOX - DATA SHARING) ===== */
    .of-account-checkbox {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
      cursor: pointer;
    }

    .of-account-checkbox:checked + .of-account-label {
      background-color: rgba(1, 90, 215, 0.05);
      border-color: var(--color-selected-border);
    }

    .of-account-checkbox:checked + .of-account-label::before {
      content: '✓';
      width: 18px;
      height: 18px;
      background: var(--gradient-progress);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
      flex-shrink: 0;
    }

    .of-account-checkbox:not(:checked) + .of-account-label::before {
      content: '';
      width: 18px;
      height: 18px;
      border: 2px solid var(--color-progress-inactive);
      border-radius: 4px;
      flex-shrink: 0;
    }

    /* ===== DATA SHARING CATEGORIES ===== */
    .of-categories {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 16px 0;
    }

    .of-category {
      background-color: var(--color-card-bg);
      border: 1px solid var(--color-card-border);
      border-radius: var(--radius-card);
      overflow: hidden;
    }

    .of-category__header {
      padding: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: background-color 0.2s ease;
    }

    .of-category__header:hover {
      background-color: rgba(1, 90, 215, 0.02);
    }

    .of-category__title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .of-category__toggle {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary);
      font-size: 12px;
      transition: transform 0.2s ease;
    }

    .of-category__toggle.open {
      transform: rotate(180deg);
    }

    .of-category__content {
      display: none;
      padding: 16px;
      background-color: rgba(240, 242, 250, 0.5);
      border-top: 1px solid var(--color-card-border);
    }

    .of-category__content.open {
      display: block;
    }

    .of-category__items {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .of-category__item {
      font-size: 13px;
      color: var(--color-text-secondary);
      padding: 8px 0;
      border-bottom: 1px solid var(--color-card-border);
    }

    .of-category__item:last-child {
      border-bottom: none;
    }

    /* ===== ACTION BUTTONS ===== */
    .of-actions {
      display: flex;
      gap: 12px;
      margin-top: 32px;
    }

    .of-btn {
      flex: 1;
      padding: 14px 24px;
      border: none;
      border-radius: var(--radius-button);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .of-btn--cancel {
      background-color: var(--color-card-bg);
      color: var(--color-text-primary);
      border: 1px solid var(--color-card-border);
      box-shadow: var(--shadow-button);
    }

    .of-btn--cancel:hover {
      background-color: rgba(26, 29, 59, 0.05);
      border-color: var(--color-text-primary);
    }

    .of-btn--cancel:active {
      background-color: rgba(26, 29, 59, 0.1);
      transform: scale(0.98);
    }

    .of-btn--primary {
      background: var(--gradient-button);
      color: white;
      box-shadow: var(--shadow-button);
    }

    .of-btn--primary:hover {
      box-shadow: 0 4px 12px rgba(0, 51, 102, 0.25);
    }

    .of-btn--primary:active {
      transform: scale(0.98);
    }

    .of-btn__mark {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .of-btn__mark svg {
      width: 100%;
      height: 100%;
      filter: brightness(0) invert(1);
    }

    /* ===== SUPPLEMENTARY INFO ALERT ===== */
    .of-alert {
      background-color: var(--color-warning-bg);
      border: 1px solid rgba(231, 76, 60, 0.2);
      border-radius: var(--radius-card);
      padding: 16px;
      margin-bottom: 20px;
      display: flex;
      gap: 12px;
    }

    .of-alert--warning {
      background-color: var(--color-warning-bg);
      border-color: rgba(231, 76, 60, 0.2);
    }

    .of-alert__icon {
      width: 24px;
      height: 24px;
      min-width: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: rgba(231, 76, 60, 0.1);
      color: var(--color-warning);
      font-size: 14px;
      font-weight: bold;
    }

    .of-alert__content {
      flex: 1;
    }

    .of-alert__title {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-warning);
      margin-bottom: 4px;
    }

    .of-alert__description {
      font-size: 12px;
      color: var(--color-text-secondary);
      line-height: 1.5;
    }

    /* ===== CONSENT FOOTER ===== */
    .of-consent-footer {
      background-color: var(--color-card-bg);
      border: 1px solid var(--color-card-border);
      border-radius: var(--radius-card);
      padding: 16px;
      margin-bottom: 20px;
    }

    .of-consent-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      font-size: 13px;
      color: var(--color-text-secondary);
      line-height: 1.5;
    }

    .of-consent-item:not(:last-child) {
      border-bottom: 1px solid var(--color-card-border);
    }

    .of-consent-icon {
      width: 20px;
      height: 20px;
      min-width: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: var(--gradient-progress);
      color: white;
      font-size: 11px;
      font-weight: bold;
    }

    .of-consent-checkbox-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 0;
    }

    .of-consent-checkbox {
      width: 20px;
      height: 20px;
      min-width: 20px;
      cursor: pointer;
      accent-color: var(--color-accent-blue);
    }

    .of-consent-label {
      font-size: 13px;
      color: var(--color-text-secondary);
      cursor: pointer;
      flex: 1;
    }

    /* ===== REDIRECT SCREEN ===== */
    .of-redirect {
      width: 100%;
      height: 100vh;
      background: var(--gradient-redirect);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
      overflow: hidden;
    }

    .of-redirect__content {
      text-align: center;
      z-index: 10;
    }

    .of-redirect__logo {
      margin-bottom: 48px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .of-redirect__logo svg {
      max-height: 100%;
      width: auto;
      filter: brightness(0) invert(1);
    }

    .of-redirect__spinner {
      margin-bottom: 48px;
    }

    .of-redirect__title {
      font-size: 28px;
      font-weight: 700;
      color: white;
      margin-bottom: 12px;
    }

    .of-redirect__subtitle {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 12px;
    }

    .of-redirect__info {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
    }

    /* ===== SPINNER ===== */
    .of-spinner {
      width: 56px;
      height: 56px;
      border: 3px solid rgba(255, 255, 255, 0.2);
      border-top-color: white;
      border-radius: 50%;
      animation: of-spin 1s linear infinite;
    }

    @keyframes of-spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* ===== COMPLETION SCREEN ===== */
    .of-completion {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 24px;
    }

    .of-success-icon {
      width: 80px;
      height: 80px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(1, 90, 215, 0.1), rgba(0, 200, 175, 0.1));
      border-radius: 50%;
      position: relative;
    }

    .of-success-icon::before {
      content: '✓';
      font-size: 48px;
      color: var(--color-accent-blue);
      font-weight: bold;
    }

    .of-success-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: 8px;
    }

    .of-success-subtitle {
      font-size: 14px;
      color: var(--color-text-secondary);
      margin-bottom: 32px;
    }

    /* ===== PAYMENT SCHEDULE GRID ===== */
    .of-schedule {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 16px 0;
    }

    .of-schedule__header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 2px solid var(--color-card-border);
      margin-bottom: 8px;
    }

    .of-schedule__header-cell {
      font-size: 11px;
      font-weight: 700;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .of-schedule__row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding: 12px;
      background-color: rgba(240, 242, 250, 0.5);
      border-radius: 8px;
      border-left: 3px solid var(--color-accent-blue);
    }

    .of-schedule__date {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .of-schedule__amount {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-accent-blue);
      text-align: right;
    }

    /* ===== BENEFICIARY LIST ===== */
    .of-beneficiaries {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 16px 0;
    }

    .of-beneficiary {
      background-color: var(--color-card-bg);
      border: 1px solid var(--color-card-border);
      border-radius: var(--radius-account-card);
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .of-beneficiary__icon {
      width: 40px;
      height: 40px;
      min-width: 40px;
      background: linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-teal));
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 14px;
    }

    .of-beneficiary__info {
      flex: 1;
    }

    .of-beneficiary__name {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .of-beneficiary__account {
      font-size: 12px;
      color: var(--color-text-secondary);
      font-family: 'Courier New', monospace;
    }

    /* ===== FILE REFERENCE ===== */
    .of-file-reference {
      background-color: var(--color-card-bg);
      border: 2px dashed var(--color-card-border);
      border-radius: var(--radius-card);
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .of-file-reference__icon {
      width: 48px;
      height: 48px;
      min-width: 48px;
      background: rgba(1, 90, 215, 0.1);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-accent-blue);
      font-size: 24px;
    }

    .of-file-reference__info {
      flex: 1;
    }

    .of-file-reference__name {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 4px;
      word-break: break-word;
    }

    .of-file-reference__details {
      font-size: 12px;
      color: var(--color-text-secondary);
    }

    /* ===== PAYMENT RULES ===== */
    .of-rules {
      background-color: var(--color-card-bg);
      border: 1px solid var(--color-card-border);
      border-radius: var(--radius-card);
      padding: 20px;
      margin-bottom: 20px;
    }

    .of-rules__title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 16px;
    }

    .of-rules__list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .of-rules__item {
      display: flex;
      gap: 12px;
      font-size: 13px;
      color: var(--color-text-secondary);
      line-height: 1.5;
    }

    .of-rules__marker {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--color-accent-blue);
      margin-top: 6px;
      flex-shrink: 0;
    }

    /* ===== RESPONSIVE DESIGN ===== */
    @media (max-width: 480px) {
      .of-page {
        padding: 20px 16px;
      }

      .of-card {
        padding: 16px;
        margin-bottom: 16px;
      }

      .of-card__heading {
        font-size: 13px;
      }

      .of-fields__row {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .of-progress {
        gap: 8px;
      }

      .of-progress__step {
        gap: 6px;
      }

      .of-progress__connector {
        width: 8px;
      }

      .of-actions {
        gap: 8px;
      }

      .of-btn {
        padding: 12px 16px;
        font-size: 13px;
      }

      .of-header {
        margin-bottom: 24px;
      }

      .of-altareq-logo {
        margin-bottom: 24px;
        height: 60px;
      }

      .of-redirect__title {
        font-size: 24px;
      }

      .of-redirect__subtitle {
        font-size: 14px;
      }

      .of-success-title {
        font-size: 20px;
      }
    }
  </style>
</head>

<body>
  <!-- ===== SCREEN 1: AUTHORIZATION ===== -->
  <div id="screen-authorize" class="screen active">
    <div class="of-page">
      <div class="of-container">
        <!-- LFI HEADER -->
        <div class="of-header">
          <div class="of-header__logo"><!-- LFI_ABBREV --></div>
          <span class="of-header__name"><!-- LFI_NAME --></span>
        </div>

        <!-- AL TAREQ LOGO -->
        <div class="of-altareq-logo">
          <!-- INSERT DARK LOGO SVG (prefix: dl) -->
        </div>

        <!-- PROGRESS BAR -->
        <div class="of-progress">
          <div class="of-progress__step">
            <div class="of-progress__dot complete">✓</div>
            <div class="of-progress__label complete">Consent</div>
          </div>
          <div class="of-progress__connector active"></div>
          <div class="of-progress__step">
            <div class="of-progress__dot active">2</div>
            <div class="of-progress__label active">Authorize</div>
          </div>
          <div class="of-progress__connector"></div>
          <div class="of-progress__step">
            <div class="of-progress__dot">3</div>
            <div class="of-progress__label">Complete</div>
          </div>
        </div>

        <!-- ====== JOURNEY-SPECIFIC CONTENT START ====== -->
        <!-- AUTHORIZATION_CONTENT -->
        <!-- ====== JOURNEY-SPECIFIC CONTENT END ====== -->

        <!-- ACTION BUTTONS -->
        <div class="of-actions">
          <button class="of-btn of-btn--cancel" onclick="showScreen('screen-authorize')">Cancel</button>
          <button class="of-btn of-btn--primary" onclick="showRedirect()">
            <span class="of-btn__mark"><!-- INSERT WHITE MARK SVG (prefix: bm) --></span>
            <!-- BUTTON_TEXT -->
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ===== SCREEN 2: REDIRECT ===== -->
  <div id="screen-redirect" class="screen">
    <div class="of-redirect">
      <div class="of-redirect__content">
        <div class="of-redirect__logo">
          <!-- INSERT WHITE LOGO SVG (prefix: wl) -->
        </div>
        <div class="of-redirect__spinner">
          <div class="of-spinner"></div>
        </div>
        <h2 class="of-redirect__title">Connecting to <!-- LFI_NAME --></h2>
        <p class="of-redirect__subtitle">Please wait while we redirect you to <!-- TPP_NAME --></p>
        <p class="of-redirect__info">This may take a few seconds. Please do not close this window.</p>
      </div>
    </div>
  </div>

  <!-- ===== SCREEN 3: COMPLETION ===== -->
  <div id="screen-completion" class="screen">
    <div class="of-page">
      <div class="of-container">
        <!-- LFI HEADER -->
        <div class="of-header">
          <div class="of-header__logo"><!-- LFI_ABBREV --></div>
          <span class="of-header__name"><!-- LFI_NAME --></span>
        </div>

        <!-- AL TAREQ LOGO -->
        <div class="of-altareq-logo">
          <!-- INSERT COLOR LOGO SVG (prefix: cl) -->
        </div>

        <!-- PROGRESS BAR -->
        <div class="of-progress">
          <div class="of-progress__step">
            <div class="of-progress__dot complete">✓</div>
            <div class="of-progress__label complete">Consent</div>
          </div>
          <div class="of-progress__connector active"></div>
          <div class="of-progress__step">
            <div class="of-progress__dot complete">✓</div>
            <div class="of-progress__label complete">Authorize</div>
          </div>
          <div class="of-progress__connector active"></div>
          <div class="of-progress__step">
            <div class="of-progress__dot active">3</div>
            <div class="of-progress__label active">Complete</div>
          </div>
        </div>

        <!-- SUCCESS INDICATOR -->
        <div class="of-completion">
          <div class="of-success-icon"></div>
          <h2 class="of-success-title"><!-- COMPLETION_TITLE --></h2>
          <p class="of-success-subtitle"><!-- COMPLETION_SUBTITLE --></p>
        </div>

        <!-- ====== JOURNEY-SPECIFIC COMPLETION DETAILS START ====== -->
        <!-- COMPLETION_DETAILS -->
        <!-- ====== JOURNEY-SPECIFIC COMPLETION DETAILS END ====== -->

        <!-- ACTION BUTTON -->
        <div class="of-actions">
          <button class="of-btn of-btn--primary" onclick="closeWindow()">Done</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    /**
     * Screen Management
     * Controls visibility of authorization, redirect, and completion screens
     */
    function showScreen(screenId) {
      const screens = document.querySelectorAll('.screen');
      screens.forEach((screen) => {
        screen.classList.remove('active');
      });
      const targetScreen = document.getElementById(screenId);
      if (targetScreen) {
        targetScreen.classList.add('active');
      }
    }

    /**
     * Redirect Flow
     * Shows redirect screen, simulates server processing, then shows completion
     */
    function showRedirect() {
      showScreen('screen-redirect');

      // Simulate processing for 3 seconds before showing completion
      setTimeout(() => {
        showScreen('screen-completion');
      }, 3000);
    }

    /**
     * Close Window
     * Simulates closing the journey (in real app, would post message or redirect)
     */
    function closeWindow() {
      alert('Journey completed. In a real implementation, this would close the window or redirect.');
    }

    /**
     * Account Selection Handler
     * Called when user selects a payment account
     */
    function onAccountSelected(accountId) {
      console.log('Account selected:', accountId);
      // Store selected account, update UI, etc.
    }

    /**
     * Category Toggle Handler
     * Toggles visibility of data sharing categories
     */
    function toggleCategory(categoryElement) {
      const header = categoryElement.querySelector('.of-category__header');
      const content = categoryElement.querySelector('.of-category__content');
      const toggle = categoryElement.querySelector('.of-category__toggle');

      if (content.classList.contains('open')) {
        content.classList.remove('open');
        toggle.classList.remove('open');
      } else {
        content.classList.add('open');
        toggle.classList.add('open');
      }
    }

    /**
     * Initialize Event Listeners
     */
    document.addEventListener('DOMContentLoaded', () => {
      // Category toggle listeners
      const categoryHeaders = document.querySelectorAll('.of-category__header');
      categoryHeaders.forEach((header) => {
        header.addEventListener('click', () => {
          toggleCategory(header.closest('.of-category'));
        });
      });

      // Account radio listeners
      const accountRadios = document.querySelectorAll('.of-account-radio');
      accountRadios.forEach((radio) => {
        radio.addEventListener('change', (e) => {
          if (e.target.checked) {
            onAccountSelected(e.target.value);
          }
        });
      });
    });
  </script>
</body>
</html>
```

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
          <div class="of-account-bank">ADCB</div>
          <div class="of-account-number">AE07 0331 1234 5678</div>
          <div class="of-account-balance">Balance: AED 25,000.00</div>
        </div>
      </label>
    </div>
    <div class="of-account-item">
      <input type="radio" id="account-2" name="payment-account" value="account-2" class="of-account-radio" />
      <label for="account-2" class="of-account-label">
        <div class="of-account-info">
          <div class="of-account-bank">ADCB</div>
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
          <div class="of-account-bank">ADCB Savings</div>
          <div class="of-account-number">AE07 0331 1234 5678</div>
          <div class="of-account-balance">Balance: AED 25,000.00</div>
        </div>
      </label>
    </div>
    <div class="of-account-item">
      <input type="checkbox" id="account-data-2" name="data-accounts" value="account-2" class="of-account-checkbox" />
      <label for="account-data-2" class="of-account-label">
        <div class="of-account-info">
          <div class="of-account-bank">ADCB Current</div>
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
        <div class="of-fields__value">ADCB Checking (AE07 0331 1234 5678)</div>
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
- **Most journeys**: "Pay using Al Tareq"
- **DATA, VRP, VRP-OD**: "Authorize using Al Tareq"
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

- **v1.0** (2024-03-15) — Initial blueprint created with all core components, styles, and templates for Al Tareq Open Finance journeys.
