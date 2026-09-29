# Open Finance App Context Blueprint

## Overview

This document provides HTML templates for embedding the Open Finance (AlTareq) authorization flow within different application contexts. The AlTareq flow (Authorization → Redirect → Completion) is the mandatory consent flow, but in a real product, this flow is triggered FROM within an app. These templates show the "before" and "after" screens that wrap around the AlTareq flow.

**Context:** UAE Open Finance
**Flow:** AlTareq-mandated consent flow triggered from app context
**Design System:** AlTareq design tokens for flow screens + custom styling for app shells

---

## Design Tokens (AlTareq)

```css
/* AlTareq Colors */
--altareq-bg: #F0F2FA;
--altareq-card: #FFFFFF;
--altareq-text-primary: #1A1D3B;
--altareq-button-gradient: linear-gradient(90deg, #003366, #00B894);
--altareq-progress-gradient: linear-gradient(90deg, #015AD7, #00C8AF);
--altareq-border: #E5E8F0;
--altareq-success: #00B894;
--altareq-warning: #FF9F43;

/* App Context Colors (Neutral/Customizable) */
--app-bg: #FFFFFF;
--app-nav: #F8F9FA;
--app-text: #1A1D3B;
--app-accent: #0066CC;
--app-border: #E0E4E8;
```

---

## Section 1: App Chrome Templates

### A. Mobile Banking App Shell

HTML structure for an iPhone-style banking app interface:

```html
<!-- Mobile Banking App Shell -->
<div class="app-shell banking-app">
  <!-- Status Bar (iOS style) -->
  <div class="status-bar">
    <span class="time">9:41</span>
    <div class="status-icons">
      <span>📶</span>
      <span>📡</span>
      <span>🔋</span>
    </div>
  </div>

  <!-- App Header -->
  <div class="app-header banking">
    <div class="header-left">
      <svg class="bank-logo" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#0066CC"/>
        <text x="20" y="25" text-anchor="middle" fill="white" font-size="20" font-weight="bold">{{BANK_LOGO}}</text>
      </svg>
    </div>
    <div class="header-center">
      <h1>{{BANK_NAME}}</h1>
    </div>
    <div class="header-right">
      <button class="icon-btn">🔔</button>
      <button class="icon-btn avatar">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%230066CC'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='20'%3EAB%3C/text%3E%3C/svg%3E" alt="Profile">
      </button>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="app-content">
    <!-- Content will be injected here -->
    {{SCREEN_CONTENT}}
  </div>

  <!-- Bottom Navigation -->
  <nav class="bottom-nav">
    <button class="nav-item active">
      <span class="nav-icon">🏠</span>
      <span class="nav-label">Home</span>
    </button>
    <button class="nav-item">
      <span class="nav-icon">💸</span>
      <span class="nav-label">Payments</span>
    </button>
    <button class="nav-item">
      <span class="nav-icon">💳</span>
      <span class="nav-label">Cards</span>
    </button>
    <button class="nav-item">
      <span class="nav-icon">⋯</span>
      <span class="nav-label">More</span>
    </button>
  </nav>
</div>

<style>
.banking-app {
  width: 375px;
  height: 812px;
  margin: 0 auto;
  border: 12px solid #000;
  border-radius: 50px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  background: white;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.status-bar {
  height: 44px;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid var(--app-border);
}

.status-icons {
  display: flex;
  gap: 4px;
}

.app-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid var(--app-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 12px;
}

.app-header.banking h1 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: var(--app-text);
}

.bank-logo {
  width: 40px;
  height: 40px;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: var(--app-nav);
}

.icon-btn.avatar img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 60px;
}

.bottom-nav {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 60px;
  background: white;
  border-top: 1px solid var(--app-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0;
  margin: 0;
  list-style: none;
}

.nav-item {
  flex: 1;
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  color: #999;
  font-size: 12px;
  height: 100%;
  transition: color 0.2s;
}

.nav-item.active {
  color: var(--app-accent);
}

.nav-icon {
  font-size: 24px;
}

.nav-label {
  font-size: 11px;
}
</style>
```

### B. E-Commerce Checkout Shell

HTML structure for desktop e-commerce checkout:

The complete template is `../assets/templates/app-shells/ecommerce-checkout.html` (the e-commerce checkout shell) — read that file and fill it in as described here. It is a real HTML file, so it can be opened in a browser as-is.

### C. Fintech/Partner App Shell

HTML structure for a minimal fintech app:

```html
<!-- Fintech/Partner App Shell -->
<div class="app-shell fintech-app">
  <!-- Status Bar -->
  <div class="status-bar">
    <span class="time">9:41</span>
    <div class="status-icons">
      <span>📶</span>
      <span>📡</span>
      <span>🔋</span>
    </div>
  </div>

  <!-- App Header -->
  <div class="fintech-header">
    <button class="back-btn">←</button>
    <h1>{{APP_NAME}}</h1>
    <div class="header-spacer"></div>
  </div>

  <!-- Main Content Area -->
  <div class="fintech-content">
    <!-- Content will be injected here -->
    {{SCREEN_CONTENT}}
  </div>

  <!-- Bottom Tab Bar -->
  <nav class="fintech-tabs">
    <button class="tab-item active">
      <span class="tab-icon">🏠</span>
      <span class="tab-label">Home</span>
    </button>
    <button class="tab-item">
      <span class="tab-icon">💰</span>
      <span class="tab-label">Accounts</span>
    </button>
    <button class="tab-item">
      <span class="tab-icon">🔔</span>
      <span class="tab-label">Alerts</span>
    </button>
    <button class="tab-item">
      <span class="tab-icon">⚙️</span>
      <span class="tab-label">Settings</span>
    </button>
  </nav>
</div>

<style>
.fintech-app {
  width: 375px;
  height: 812px;
  margin: 0 auto;
  border: 12px solid #000;
  border-radius: 50px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  background: white;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.fintech-header {
  height: 56px;
  background: white;
  border-bottom: 1px solid var(--app-border);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 12px;
}

.back-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: var(--app-nav);
}

.fintech-header h1 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: var(--app-text);
  flex: 1;
}

.header-spacer {
  width: 40px;
}

.fintech-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 60px;
}

.fintech-tabs {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 60px;
  background: white;
  border-top: 1px solid var(--app-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0;
  margin: 0;
  list-style: none;
}

.tab-item {
  flex: 1;
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  color: #999;
  font-size: 11px;
  height: 100%;
  transition: color 0.2s;
}

.tab-item.active {
  color: var(--app-accent);
}

.tab-icon {
  font-size: 24px;
}
</style>
```

### D. Government Portal Shell

HTML structure for a government service portal:

```html
<!-- Government Portal Shell -->
<div class="app-shell gov-portal">
  <!-- Header Bar -->
  <header class="gov-header">
    <div class="header-top">
      <div class="gov-emblem">
        <svg viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="24" fill="#007749" stroke="#fff" stroke-width="2"/>
          <text x="25" y="30" text-anchor="middle" fill="white" font-size="28" font-weight="bold">🇦🇪</text>
        </svg>
      </div>
      <div class="header-text">
        <h1>{{GOV_ENTITY_NAME}}</h1>
        <p>Federal Government Portal</p>
      </div>
    </div>
    <nav class="gov-nav">
      <a href="#">Home</a>
      <a href="#">Services</a>
      <a href="#">About</a>
      <a href="#">Contact</a>
    </nav>
  </header>

  <!-- Main Content -->
  <div class="gov-container">
    <!-- Breadcrumb -->
    <nav class="gov-breadcrumb">
      <a href="#">Home</a>
      <span class="separator">/</span>
      <a href="#">{{SERVICE_CATEGORY}}</a>
      <span class="separator">/</span>
      <span class="current">{{SERVICE_NAME}}</span>
    </nav>

    <!-- Service Title & Description -->
    <div class="service-header">
      <h2>{{SERVICE_NAME}}</h2>
      <p>{{SERVICE_DESCRIPTION}}</p>
    </div>

    <!-- Content Area -->
    <div class="gov-content">
      <!-- Content will be injected here -->
      {{SCREEN_CONTENT}}
    </div>
  </div>

  <!-- Footer -->
  <footer class="gov-footer">
    <div class="footer-content">
      <div class="footer-column">
        <h4>Government Services</h4>
        <ul>
          <li><a href="#">Service 1</a></li>
          <li><a href="#">Service 2</a></li>
          <li><a href="#">Service 3</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <h4>Information</h4>
        <ul>
          <li><a href="#">FAQ</a></li>
          <li><a href="#">Privacy Policy</a></li>
          <li><a href="#">Terms of Use</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <h4>Contact</h4>
        <p>Email: {{SUPPORT_EMAIL}}</p>
        <p>Phone: {{SUPPORT_PHONE}}</p>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; {{YEAR}} {{GOV_ENTITY_NAME}}. All rights reserved.</p>
    </div>
  </footer>
</div>

<style>
.gov-portal {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  background: #FAFAFA;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.gov-header {
  background: white;
  border-bottom: 3px solid #007749;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-top {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 40px;
  background: linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%);
}

.gov-emblem {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.gov-emblem svg {
  width: 100%;
  height: 100%;
}

.header-text h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #007749;
}

.header-text p {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #666;
}

.gov-nav {
  display: flex;
  gap: 24px;
  padding: 0 40px 16px;
  background: white;
}

.gov-nav a {
  color: #333;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding-bottom: 8px;
  border-bottom: 2px solid transparent;
  transition: border-color 0.2s;
}

.gov-nav a:hover {
  border-bottom-color: #007749;
}

.gov-container {
  padding: 40px;
  min-height: 400px;
}

.gov-breadcrumb {
  margin-bottom: 24px;
  font-size: 13px;
  color: #666;
}

.gov-breadcrumb a {
  color: #0066CC;
  text-decoration: none;
}

.gov-breadcrumb a:hover {
  text-decoration: underline;
}

.gov-breadcrumb .current {
  color: #333;
  font-weight: 600;
}

.separator {
  margin: 0 8px;
}

.service-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #E0E4E8;
}

.service-header h2 {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 700;
  color: #1A1D3B;
}

.service-header p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.gov-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid #E0E4E8;
}

.gov-footer {
  background: #2C3E50;
  color: white;
  padding: 40px;
  margin-top: 60px;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  margin-bottom: 32px;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.footer-column h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
}

.footer-column ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.footer-column li {
  margin-bottom: 8px;
}

.footer-column a {
  color: #AAA;
  text-decoration: none;
  font-size: 13px;
  transition: color 0.2s;
}

.footer-column a:hover {
  color: white;
}

.footer-column p {
  margin: 0;
  font-size: 13px;
  color: #AAA;
}

.footer-bottom {
  border-top: 1px solid #444;
  padding-top: 20px;
  text-align: center;
  font-size: 12px;
  color: #999;
}
</style>
```

---

## Section 2: Pre-Flow Screens

### Banking App: Payment Form

Screen shown before user enters AlTareq flow in banking context:

```html
<!-- Banking App: Pre-Flow Payment Screen -->
<div class="screen-content banking-pre-flow">
  <div class="payment-form">
    <h2>Send Money</h2>

    <div class="form-section">
      <label>Recipient</label>
      <input type="text" placeholder="{{RECIPIENT_NAME}}" disabled value="{{RECIPIENT_NAME}}">
    </div>

    <div class="form-section">
      <label>Amount (AED)</label>
      <div class="amount-input">
        <input type="number" placeholder="0.00" value="{{AMOUNT}}" disabled>
        <span class="currency">AED</span>
      </div>
    </div>

    <div class="form-section">
      <label>Payment Reference</label>
      <input type="text" placeholder="{{REFERENCE}}" disabled value="{{REFERENCE}}">
    </div>

    <div class="fee-summary">
      <div class="fee-item">
        <span>Amount</span>
        <span>AED {{AMOUNT}}</span>
      </div>
      <div class="fee-item">
        <span>Transfer Fee</span>
        <span>AED {{FEE}}</span>
      </div>
      <div class="fee-divider"></div>
      <div class="fee-total">
        <strong>Total</strong>
        <strong>AED {{TOTAL}}</strong>
      </div>
    </div>

    <button class="btn-primary btn-altareq" onclick="transitionToAlTareq()">
      <span>Pay with AlTareq</span>
      <span class="btn-icon">→</span>
    </button>

    <button class="btn-secondary">Cancel</button>
  </div>
</div>

<style>
.banking-pre-flow .payment-form {
  max-width: 100%;
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.banking-pre-flow h2 {
  margin: 0 0 24px 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--app-text);
}

.form-section {
  margin-bottom: 16px;
}

.form-section label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text);
  margin-bottom: 8px;
}

.form-section input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.amount-input {
  position: relative;
  display: flex;
  align-items: center;
}

.amount-input input {
  flex: 1;
}

.amount-input .currency {
  position: absolute;
  right: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #999;
}

.fee-summary {
  background: #F8F9FA;
  border-radius: 8px;
  padding: 12px;
  margin: 20px 0;
  font-size: 13px;
}

.fee-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #666;
}

.fee-divider {
  height: 1px;
  background: var(--app-border);
  margin: 8px 0;
}

.fee-total {
  display: flex;
  justify-content: space-between;
  color: var(--app-text);
  font-weight: 600;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: var(--app-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.2s;
  margin-bottom: 12px;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary.btn-altareq {
  background: linear-gradient(135deg, #0066CC 0%, #0052A3 100%);
}

.btn-secondary {
  width: 100%;
  padding: 12px;
  background: transparent;
  color: var(--app-accent);
  border: 1px solid var(--app-accent);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--app-accent);
  color: white;
}

.btn-icon {
  display: inline-block;
}
</style>
```

### E-Commerce: Payment Method Selection

Screen showing payment method options with AlTareq highlighted:

```html
<!-- E-Commerce: Pre-Flow Payment Method Selection -->
<div class="screen-content ecommerce-pre-flow">
  <div class="payment-methods">
    <h3>Select Payment Method</h3>

    <div class="method-option">
      <label class="method-label">
        <input type="radio" name="payment" value="credit-card" disabled>
        <span class="method-content">
          <span class="method-name">💳 Credit/Debit Card</span>
          <span class="method-desc">Visa, Mastercard, American Express</span>
        </span>
      </label>
    </div>

    <div class="method-option featured">
      <label class="method-label">
        <input type="radio" name="payment" value="altareq" checked>
        <span class="method-content">
          <span class="method-name">
            🏦 Pay by Bank
            <span class="badge">Secure</span>
          </span>
          <span class="method-desc">Fast, secure payment using Open Finance</span>
        </span>
        <span class="altareq-logo">AlTareq</span>
      </label>
    </div>

    <div class="method-option">
      <label class="method-label">
        <input type="radio" name="payment" value="wallet" disabled>
        <span class="method-content">
          <span class="method-name">📱 Digital Wallet</span>
          <span class="method-desc">Apple Pay, Google Pay</span>
        </span>
      </label>
    </div>

    <button class="btn-primary btn-continue" onclick="transitionToAlTareq()">
      Continue to Payment
    </button>
  </div>
</div>

<style>
.ecommerce-pre-flow .payment-methods {
  max-width: 500px;
}

.ecommerce-pre-flow h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text);
}

.method-option {
  margin-bottom: 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.method-option:hover {
  border-color: var(--app-accent);
  box-shadow: 0 2px 8px rgba(0, 102, 204, 0.1);
}

.method-option.featured {
  border: 2px solid var(--app-accent);
  background: #F0F6FF;
}

.method-label {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  gap: 12px;
}

.method-label input[type="radio"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
}

.method-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.method-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge {
  background: #00B894;
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.method-desc {
  font-size: 12px;
  color: #999;
}

.altareq-logo {
  display: none;
}

.method-option.featured .altareq-logo {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #0066CC;
  white-space: nowrap;
}

.btn-continue {
  width: 100%;
  margin-top: 24px;
}
</style>
```

### Fintech: Fund Account Action

Screen for action initiation in fintech context:

```html
<!-- Fintech: Pre-Flow Fund Account Screen -->
<div class="screen-content fintech-pre-flow">
  <div class="action-card">
    <div class="action-header">
      <h2>Fund Your Account</h2>
      <p>Add money to your {{APP_NAME}} wallet</p>
    </div>

    <div class="action-form">
      <div class="form-section">
        <label>Amount (AED)</label>
        <div class="amount-input">
          <span class="currency">AED</span>
          <input type="number" placeholder="0.00" value="{{AMOUNT}}">
        </div>
      </div>

      <div class="form-section">
        <label>Source</label>
        <select disabled>
          <option selected>Bank Account</option>
        </select>
      </div>

      <div class="amount-preview">
        <div class="preview-row">
          <span>Amount</span>
          <strong>AED {{AMOUNT}}</strong>
        </div>
        <div class="preview-row">
          <span>Processing Fee</span>
          <strong>Free</strong>
        </div>
      </div>

      <button class="btn-primary btn-large" onclick="transitionToAlTareq()">
        Continue with AlTareq
      </button>

      <div class="info-box">
        <span class="info-icon">ℹ️</span>
        <p>Your account will be funded securely using your bank's Open Finance service.</p>
      </div>
    </div>
  </div>
</div>

<style>
.fintech-pre-flow {
  padding: 20px;
  background: #F8F9FA;
  min-height: 100%;
}

.action-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.action-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--app-border);
}

.action-header h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--app-text);
}

.action-header p {
  margin: 0;
  font-size: 13px;
  color: #999;
}

.action-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text);
  margin-bottom: 8px;
}

.form-section input,
.form-section select {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.amount-input {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  overflow: hidden;
}

.amount-input .currency {
  padding: 12px 12px;
  background: #F8F9FA;
  border-right: 1px solid var(--app-border);
  font-weight: 600;
  color: #999;
  font-size: 13px;
}

.amount-input input {
  flex: 1;
  border: none;
  padding: 12px;
}

.amount-preview {
  background: #F8F9FA;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  color: #666;
}

.preview-row:last-child {
  margin-bottom: 0;
}

.btn-large {
  padding: 16px;
  margin-top: 8px;
}

.info-box {
  display: flex;
  gap: 12px;
  background: #E3F2FD;
  border-left: 4px solid #0066CC;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #1565C0;
}

.info-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.info-box p {
  margin: 0;
}
</style>
```

### Government: Fee Summary & Payment

Screen for government service fee payment:

```html
<!-- Government: Pre-Flow Fee Summary Screen -->
<div class="screen-content gov-pre-flow">
  <div class="fee-summary-container">
    <h3>Service Fee</h3>

    <div class="fee-breakdown">
      <div class="fee-row">
        <span>Service: {{SERVICE_NAME}}</span>
        <span>AED {{SERVICE_FEE}}</span>
      </div>
      <div class="fee-row">
        <span>Processing Fee</span>
        <span>AED {{PROCESSING_FEE}}</span>
      </div>
      <div class="fee-divider"></div>
      <div class="fee-row total">
        <strong>Total Amount Due</strong>
        <strong>AED {{TOTAL_FEE}}</strong>
      </div>
    </div>

    <div class="payment-info">
      <p><strong>Reference Number:</strong> {{REFERENCE_NUMBER}}</p>
      <p><strong>Due Date:</strong> {{DUE_DATE}}</p>
    </div>

    <button class="btn-primary btn-gov" onclick="transitionToAlTareq()">
      Pay Now Using AlTareq
    </button>

    <div class="payment-methods-alt">
      <p>Other payment methods:</p>
      <button class="btn-alt-method">Credit Card</button>
      <button class="btn-alt-method">Bank Transfer</button>
    </div>
  </div>
</div>

<style>
.gov-pre-flow {
  max-width: 500px;
}

.fee-summary-container {
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--app-border);
}

.fee-summary-container h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text);
}

.fee-breakdown {
  background: #F8F9FA;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 20px;
  font-size: 13px;
}

.fee-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #666;
}

.fee-row.total {
  color: var(--app-text);
  font-weight: 600;
}

.fee-divider {
  height: 1px;
  background: var(--app-border);
  margin: 8px 0;
}

.payment-info {
  background: #F0F8FF;
  border-left: 4px solid #007749;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.payment-info p {
  margin: 6px 0;
  font-size: 13px;
  color: #333;
}

.btn-gov {
  background: linear-gradient(135deg, #007749, #009B6D);
  margin-bottom: 16px;
}

.payment-methods-alt {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid var(--app-border);
}

.payment-methods-alt p {
  font-size: 12px;
  color: #999;
  margin: 0 0 12px 0;
}

.btn-alt-method {
  display: inline-block;
  padding: 8px 16px;
  margin: 0 6px;
  background: transparent;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-alt-method:hover {
  border-color: #007749;
  color: #007749;
}
</style>
```

---

## Section 3: Post-Flow Screens

### Banking App: Payment Confirmation

Confirmation screen after AlTareq completion:

```html
<!-- Banking App: Post-Flow Confirmation Screen -->
<div class="screen-content banking-post-flow">
  <div class="success-container">
    <div class="success-icon">✓</div>
    <h2>Payment Sent Successfully</h2>

    <div class="confirmation-details">
      <div class="detail-row">
        <span class="label">Recipient</span>
        <span class="value">{{RECIPIENT_NAME}}</span>
      </div>
      <div class="detail-row">
        <span class="label">Amount</span>
        <span class="value">AED {{AMOUNT}}</span>
      </div>
      <div class="detail-row">
        <span class="label">Date & Time</span>
        <span class="value">{{TIMESTAMP}}</span>
      </div>
      <div class="detail-row">
        <span class="label">Reference</span>
        <span class="value reference">{{TXN_REFERENCE}}</span>
      </div>
    </div>

    <div class="action-buttons">
      <button class="btn-primary">View Transaction</button>
      <button class="btn-secondary">Back to Home</button>
    </div>

    <div class="receipt-download">
      <button class="btn-link">📥 Download Receipt</button>
    </div>
  </div>

  <!-- Transaction History Preview -->
  <div class="history-preview">
    <h3>Recent Transactions</h3>
    <div class="transaction-item recent">
      <div class="txn-info">
        <span class="txn-name">{{RECIPIENT_NAME}}</span>
        <span class="txn-date">Today at {{TIME}}</span>
      </div>
      <span class="txn-amount success">+AED {{AMOUNT}}</span>
    </div>
    <div class="transaction-item">
      <div class="txn-info">
        <span class="txn-name">{{PREVIOUS_RECIPIENT}}</span>
        <span class="txn-date">Yesterday</span>
      </div>
      <span class="txn-amount">-AED {{PREV_AMOUNT}}</span>
    </div>
  </div>
</div>

<style>
.banking-post-flow {
  padding: 20px;
  background: #F8F9FA;
}

.success-container {
  background: white;
  border-radius: 12px;
  padding: 32px 20px;
  text-align: center;
  border: 1px solid var(--app-border);
  margin-bottom: 20px;
}

.success-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #E8F5E9;
  color: #00B894;
  font-size: 48px;
  margin-bottom: 16px;
}

.banking-post-flow h2 {
  margin: 0 0 24px 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--app-text);
}

.confirmation-details {
  background: #F8F9FA;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid var(--app-border);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row .label {
  color: #999;
}

.detail-row .value {
  color: var(--app-text);
  font-weight: 600;
}

.detail-row .reference {
  font-family: 'Courier New', monospace;
  font-size: 11px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.btn-link {
  background: none;
  border: none;
  color: var(--app-accent);
  text-decoration: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.history-preview {
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--app-border);
}

.history-preview h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text);
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--app-border);
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-item.recent {
  background: #F0F6FF;
  margin: -8px;
  padding: 12px 8px;
  border-radius: 6px;
  border: 1px solid #E3F2FD;
}

.txn-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.txn-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text);
}

.txn-date {
  font-size: 11px;
  color: #999;
}

.txn-amount {
  font-weight: 700;
  font-size: 13px;
  color: #E74C3C;
}

.txn-amount.success {
  color: #00B894;
}
</style>
```

### E-Commerce: Order Confirmation

Order confirmation page after AlTareq completion:

```html
<!-- E-Commerce: Post-Flow Order Confirmation -->
<div class="screen-content ecommerce-post-flow">
  <div class="confirmation-card">
    <div class="confirmation-header">
      <div class="order-status-icon">✓</div>
      <h2>Thank You for Your Order!</h2>
      <p>Your order has been confirmed and payment processed successfully.</p>
    </div>

    <div class="order-details">
      <div class="detail-section">
        <h4>Order Number</h4>
        <code class="order-number">{{ORDER_NUMBER}}</code>
      </div>

      <div class="detail-section">
        <h4>Order Summary</h4>
        <div class="summary-box">
          <div class="summary-row">
            <span>{{PRODUCT_1_NAME}}</span>
            <span>AED {{PRODUCT_1_PRICE}}</span>
          </div>
          <div class="summary-row">
            <span>{{PRODUCT_2_NAME}}</span>
            <span>AED {{PRODUCT_2_PRICE}}</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-row total">
            <strong>Total Paid</strong>
            <strong>AED {{ORDER_TOTAL}}</strong>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Delivery Information</h4>
        <p>
          <strong>Address:</strong> {{DELIVERY_ADDRESS}}<br>
          <strong>Estimated Delivery:</strong> {{ESTIMATED_DELIVERY}}<br>
          <strong>Tracking:</strong> Available in your order history
        </p>
      </div>

      <div class="detail-section">
        <h4>Payment Method</h4>
        <p>
          <span class="payment-badge">Bank Transfer via AlTareq</span>
        </p>
      </div>
    </div>

    <div class="action-buttons">
      <button class="btn-primary">Continue Shopping</button>
      <button class="btn-secondary">View Orders</button>
    </div>

    <div class="email-confirmation">
      <p>A confirmation email has been sent to {{EMAIL}}</p>
      <button class="btn-link">📧 Resend Confirmation</button>
    </div>
  </div>
</div>

<style>
.ecommerce-post-flow {
  padding: 40px 20px;
  background: #F8F9FA;
  min-height: 400px;
}

.confirmation-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid var(--app-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.confirmation-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--app-border);
}

.order-status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #E8F5E9;
  color: #00B894;
  font-size: 48px;
  margin-bottom: 16px;
}

.confirmation-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--app-text);
}

.confirmation-header p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.order-details {
  margin-bottom: 24px;
}

.detail-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--app-border);
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.order-number {
  display: inline-block;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: 700;
  color: #0066CC;
  padding: 8px 12px;
  background: #F0F6FF;
  border-radius: 6px;
  letter-spacing: 2px;
}

.summary-box {
  background: #F8F9FA;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  color: #666;
}

.summary-row.total {
  color: var(--app-text);
  font-weight: 600;
  margin-top: 4px;
}

.summary-divider {
  height: 1px;
  background: var(--app-border);
  margin: 8px 0;
}

.detail-section p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #666;
}

.payment-badge {
  display: inline-block;
  background: #E8F5E9;
  color: #00B894;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.action-buttons .btn-primary,
.action-buttons .btn-secondary {
  flex: 1;
}

.email-confirmation {
  text-align: center;
  padding: 12px;
  background: #F0F8FF;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
}

.email-confirmation p {
  margin: 0 0 8px 0;
}
</style>
```

### Fintech: Updated Balance

Account status after funding via AlTareq:

```html
<!-- Fintech: Post-Flow Updated Balance -->
<div class="screen-content fintech-post-flow">
  <div class="success-banner">
    <span class="banner-icon">✓</span>
    <h2>Funding Complete!</h2>
    <p>Your account has been successfully funded.</p>
  </div>

  <div class="account-overview">
    <div class="balance-card">
      <h3>Available Balance</h3>
      <div class="balance-amount">AED {{NEW_BALANCE}}</div>
      <p class="balance-note">Updated just now</p>
    </div>

    <div class="transaction-card">
      <h3>Latest Transaction</h3>
      <div class="txn-detail">
        <div class="txn-header">
          <span class="txn-title">Account Funding</span>
          <span class="txn-status success">+AED {{FUNDED_AMOUNT}}</span>
        </div>
        <div class="txn-meta">
          <span>Date: {{TRANSACTION_DATE}}</span>
          <span>ID: {{TXN_ID}}</span>
        </div>
        <div class="txn-method">
          <span class="method-badge">AlTareq</span>
        </div>
      </div>
    </div>
  </div>

  <div class="quick-actions">
    <h3>What's Next?</h3>
    <button class="action-btn">📤 Send Money</button>
    <button class="action-btn">💳 Request Money</button>
    <button class="action-btn">📊 View Statements</button>
  </div>
</div>

<style>
.fintech-post-flow {
  padding: 20px;
  background: #F8F9FA;
  min-height: 100%;
}

.success-banner {
  background: linear-gradient(135deg, #E8F5E9 0%, #F0F8F4 100%);
  border-left: 4px solid #00B894;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
}

.banner-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  color: #00B894;
  font-size: 24px;
  margin-bottom: 8px;
}

.success-banner h2 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 700;
  color: #1A1D3B;
}

.success-banner p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.account-overview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.balance-card,
.transaction-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--app-border);
}

.balance-card h3,
.transaction-card h3 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.balance-amount {
  font-size: 32px;
  font-weight: 700;
  color: var(--app-accent);
  margin-bottom: 4px;
}

.balance-note {
  margin: 0;
  font-size: 12px;
  color: #00B894;
}

.txn-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.txn-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.txn-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text);
}

.txn-status {
  font-size: 14px;
  font-weight: 700;
  color: #E74C3C;
}

.txn-status.success {
  color: #00B894;
}

.txn-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.txn-method {
  display: flex;
  gap: 8px;
}

.method-badge {
  display: inline-block;
  background: #F0F6FF;
  color: #0066CC;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.quick-actions h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text);
}

.action-btn {
  display: block;
  width: 100%;
  padding: 14px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--app-accent);
  color: white;
  border-color: var(--app-accent);
}
</style>
```

### Government: Receipt & Confirmation

Government service confirmation with receipt:

```html
<!-- Government: Post-Flow Receipt & Confirmation -->
<div class="screen-content gov-post-flow">
  <div class="receipt-container">
    <div class="receipt-header">
      <div class="receipt-icon">✓</div>
      <h2>Payment Successful</h2>
      <p>Your service fee has been received and processed.</p>
    </div>

    <div class="receipt-details">
      <div class="receipt-row">
        <span>Service Name</span>
        <strong>{{SERVICE_NAME}}</strong>
      </div>
      <div class="receipt-row">
        <span>Service Fee</span>
        <strong>AED {{SERVICE_FEE}}</strong>
      </div>
      <div class="receipt-row">
        <span>Processing Fee</span>
        <strong>AED {{PROCESSING_FEE}}</strong>
      </div>
      <div class="receipt-row">
        <span>Payment Date</span>
        <strong>{{PAYMENT_DATE}}</strong>
      </div>
      <div class="receipt-divider"></div>
      <div class="receipt-row total">
        <strong>Amount Paid</strong>
        <strong>AED {{TOTAL_PAID}}</strong>
      </div>
    </div>

    <div class="reference-box">
      <h4>Reference Information</h4>
      <div class="reference-item">
        <label>Receipt Number</label>
        <code>{{RECEIPT_NUMBER}}</code>
      </div>
      <div class="reference-item">
        <label>Transaction ID</label>
        <code>{{TXN_ID}}</code>
      </div>
      <div class="reference-item">
        <label>Application Reference</label>
        <code>{{APP_REFERENCE}}</code>
      </div>
    </div>

    <div class="action-section">
      <button class="btn-primary btn-download">📥 Download Receipt</button>
      <button class="btn-secondary">Return to Services</button>
    </div>

    <div class="email-note">
      <p>A receipt copy has been sent to {{EMAIL}}</p>
    </div>
  </div>
</div>

<style>
.gov-post-flow {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.receipt-container {
  background: white;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  overflow: hidden;
}

.receipt-header {
  background: linear-gradient(135deg, #F0F8FF 0%, #E8F5FF 100%);
  border-bottom: 2px solid #007749;
  padding: 32px 20px;
  text-align: center;
}

.receipt-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: white;
  color: #007749;
  font-size: 32px;
  margin-bottom: 12px;
}

.receipt-header h2 {
  margin: 0 0 4px 0;
  font-size: 22px;
  font-weight: 700;
  color: #007749;
}

.receipt-header p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.receipt-details {
  padding: 20px;
  background: #FAFAFA;
  border-bottom: 1px solid var(--app-border);
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid var(--app-border);
}

.receipt-row:last-child {
  border-bottom: none;
}

.receipt-row span {
  color: #666;
}

.receipt-row strong {
  color: var(--app-text);
  font-weight: 600;
}

.receipt-row.total {
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--app-border);
  font-size: 14px;
}

.receipt-row.total span,
.receipt-row.total strong {
  color: #007749;
  font-weight: 700;
}

.receipt-divider {
  height: 1px;
  background: var(--app-border);
  margin: 8px 0;
}

.reference-box {
  padding: 20px;
  background: white;
  border-bottom: 1px solid var(--app-border);
}

.reference-box h4 {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.reference-item {
  margin-bottom: 12px;
  padding: 8px;
  background: #F8F9FA;
  border-radius: 4px;
}

.reference-item:last-child {
  margin-bottom: 0;
}

.reference-item label {
  display: block;
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 4px;
}

.reference-item code {
  display: block;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: 700;
  color: #0066CC;
  word-break: break-all;
}

.action-section {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-download {
  background: linear-gradient(135deg, #007749, #009B6D);
}

.email-note {
  padding: 0 20px 20px 20px;
  text-align: center;
  font-size: 12px;
  color: #999;
}

.email-note p {
  margin: 0;
}
</style>
```

---

## Section 4: Complete Interactive Flow Template

A complete, self-contained HTML file that demonstrates the entire flow from app context → AlTareq → app result:

The complete template is `../assets/templates/app-flow.html` (the complete 7-screen interactive flow template) — read that file and fill it in as described here. It is a real HTML file, so it can be opened in a browser as-is.

---

## Placeholder Reference

All customizable text is marked with `{{PLACEHOLDER}}` format. Here's the complete list:

### Banking App Placeholders
- `{{BANK_NAME}}` - Name of the banking institution
- `{{BANK_LOGO}}` - Bank logo text/initials
- `{{RECIPIENT_NAME}}` - Name of payment recipient
- `{{AMOUNT}}` - Transaction amount (e.g., "500.00")
- `{{FEE}}` - Transfer fee amount
- `{{TOTAL}}` - Total transaction amount
- `{{REFERENCE}}` - Payment reference/memo
- `{{TIMESTAMP}}` - Date and time of transaction
- `{{TXN_REFERENCE}}` - Transaction reference number
- `{{TXN_ID}}` - Transaction ID
- `{{DATE_TIME}}` - Current date and time
- `{{TIME}}` - Time of transaction
- `{{PREVIOUS_RECIPIENT}}` - Previous transaction recipient
- `{{PREV_AMOUNT}}` - Previous transaction amount
- `{{REFERENCE_ID}}` - AlTareq reference ID

### E-Commerce Placeholders
- `{{STORE_URL}}` - Store domain URL
- `{{STORE_NAME}}` - Store/merchant name
- `{{STORE_INITIALS}}` - Store logo initials
- `{{CART_COUNT}}` - Number of items in cart
- `{{PRODUCT_1_NAME}}` - First product name
- `{{PRODUCT_1_PRICE}}` - First product price
- `{{PRODUCT_2_NAME}}` - Second product name
- `{{PRODUCT_2_PRICE}}` - Second product price
- `{{ORDER_TOTAL}}` - Order total amount
- `{{ORDER_NUMBER}}` - Order confirmation number
- `{{DELIVERY_ADDRESS}}` - Shipping address
- `{{ESTIMATED_DELIVERY}}` - Estimated delivery date
- `{{YEAR}}` - Current year
- `{{EMAIL}}` - Customer email address

### Fintech Placeholders
- `{{APP_NAME}}` - Fintech application name
- `{{FUNDED_AMOUNT}}` - Amount added to account
- `{{NEW_BALANCE}}` - Updated account balance
- `{{TRANSACTION_DATE}}` - Date of funding transaction
- `{{TXN_ID}}` - Transaction ID

### Government Portal Placeholders
- `{{GOV_ENTITY_NAME}}` - Government agency/entity name
- `{{SERVICE_CATEGORY}}` - Service category
- `{{SERVICE_NAME}}` - Specific service name
- `{{SERVICE_DESCRIPTION}}` - Service description
- `{{SERVICE_FEE}}` - Service fee amount
- `{{PROCESSING_FEE}}` - Processing fee amount
- `{{TOTAL_FEE}}` - Total fee due
- `{{REFERENCE_NUMBER}}` - Service reference number
- `{{DUE_DATE}}` - Payment due date
- `{{RECEIPT_NUMBER}}` - Payment receipt number
- `{{PAYMENT_DATE}}` - Date payment was made
- `{{APP_REFERENCE}}` - Application reference ID
- `{{SUPPORT_EMAIL}}` - Support email address
- `{{SUPPORT_PHONE}}` - Support phone number

---

## Implementation Notes

1. **Self-Contained**: All code is contained in a single HTML file with embedded CSS and minimal JavaScript. No external dependencies required except optionally Google Fonts for Inter font.

2. **Device Frames**: Mobile frames are 375px × 812px (iPhone dimensions) with realistic device chrome. Desktop frames are max 1200px width.

3. **AlTareq Design System**: The AlTareq flow screens (screens 3–5 in the complete demo) use exact design tokens:
   - Background: `#F0F2FA`
   - Cards: `#FFFFFF`
   - Text: `#1A1D3B`
   - Button gradient: `linear-gradient(90deg, #003366, #00B894)`
   - Progress gradient: `linear-gradient(90deg, #015AD7, #00C8AF)`

4. **App Context Styling**: Surrounding app shells use neutral, customizable styling. In production, replace with your actual brand colors and components.

5. **Interactive Demo**: The complete flow template (Section 4) includes working navigation. Click "Next" or use direct screen navigation buttons to walk through the entire journey.

6. **Responsive**: Device frames adapt to smaller screens, maintaining aspect ratio.

7. **Customization**: Replace all `{{PLACEHOLDER}}` text with actual data for your specific use case. The structure remains consistent across all contexts.
