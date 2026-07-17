# Journey Generator

Quick-reference generation guide. For each journey type, this file specifies the exact screens, sections, fields, button text, and variants needed.

## How to Generate a Journey

When asked to build any Open Finance journey:

1. Identify the journey type from the table below
2. Look up its entry in this file for exact screen composition
3. Read `html-blueprint.md` for the HTML template structure
4. Read `svg-assets.md` for inline SVG code
5. Read `design-tokens.md` for CSS custom properties
6. Read `component-library.md` for component HTML/CSS
7. Assemble the screens using the blueprint, substituting the journey-specific content

## Screen Flow (All Journeys)

Every journey follows this 3-screen flow:
- **Screen 1: Authorization** — LFI authorization page (light bg, dark logo)
- **Screen 2: Redirect** — Gradient transition screen with spinner
- **Screen 3: Completion** — Success confirmation with transaction details

## Journey Type Quick Lookup

| ID | Journey Type | Screen Title | Permission Text | Button Text | Has Account Selector | Has Consent Footer | Has Payment Rules | Has Schedule | Has Beneficiary List |
|----|-------------|-------------|-----------------|-------------|---------------------|-------------------|-------------------|-------------|---------------------|
| SIP | Single Instant Payment | Confirm Payment | [TPP] needs your permission to make the payment below: | Pay using Al Tareq | Yes (radio) | No | No | No | No |
| FDP | Future Dated Payment | Confirm to set up payment | [TPP] needs your permission to setup the payment below: | Pay using Al Tareq | Yes (radio) | No | No | No | No |
| FD-MULTI | Fixed-Defined Multi-Payment | Confirm to setup Multi-Payment | [TPP] needs your permission to make payment(s) from your account within the payment rules below: | Pay using Al Tareq | No (pre-selected IBAN) | Yes | No | Yes (exact amounts) | No |
| VRP | Variable Recurring Payment | Confirm to setup Multi-Payment | [TPP] needs your permission to make payment(s) from your account within the payment rules below: | Pay using Al Tareq | No (pre-selected IBAN) | Yes | Yes | No | No |
| VD-MULTI | Variable-Defined Multi-Payment | Confirm to setup Multi-Payment | same as VRP | Pay using Al Tareq | No (pre-selected IBAN) | Yes | No | Yes (MAX amounts) | No |
| IAVDB | Variable-Defined Beneficiary | Confirm to setup Multi-Payment | same as VRP | Pay using Al Tareq | No (pre-selected IBAN) | Yes | Yes (simplified) | No | Yes |
| EAVB | Variable Beneficiary | Confirm to setup Multi-Payment | same as VRP | Pay using Al Tareq | No (pre-selected IBAN) | Yes | Yes (simplified) | No | No |
| VRP-OD | VRP On-Demand | Confirm to setup Multi-Payment | same as VRP | Pay using Al Tareq | No (pre-selected IBAN) | Yes | Yes (detailed) | No | No |
| COMBINED | Combined Payment | Confirm to setup Combined-Payment | same as VRP | Pay using Al Tareq | No (pre-selected IBAN) | Yes | Yes (with immediate) | No | No |
| INTL | International Payment | Confirm to setup payment | [TPP] needs your permission to setup the payment below: | Pay using Al Tareq | No (pre-selected IBAN) | No | No | No | No |
| BULK | Bulk/Batch Payment | Confirm to setup payment | Please check if the details below are correct. | Pay using Al Tareq | Yes (radio, includes Business Account) | No | No | No | No |
| DATA | Data Sharing | (no heading) | Select account(s) to share information with [TPP name] | Authorize using Al Tareq | Yes (checkbox multi-select) | No | No | No | No |

---

## SIP — Single Instant Payment

### Authorization Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: dl)
Progress Bar (Consent ✓ | Authorize active | Complete inactive)

Content Card:
  Heading: "Confirm Payment"
  Description: "[TPP] needs your permission to make the payment below:"

  Fields Grid (two-column):
    Row 1: Amount: [amount] AED | Payee Name: [payee]
    Row 2: Payee IBAN: [iban] | Payment Reference: [ref]
    Row 3 (full-width): Payment Purpose: [purpose]

Account Selector Card:
  Subheading: "Please select the account to pay from"
  Account cards (radio, 2-3 accounts):
    - Account Type (Primary/Secondary)
    - IBAN: ****[last4]
    - Available Balance: [amount] AED
    - Overdraft Limit: [amount] AED (if applicable)

Action Buttons:
  [Cancel] | [Pay using Al Tareq] (white mark SVG, prefix: bm)
```

### Completion Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: cl)
Progress Bar (all completed with checkmarks, lines all active)

Success Card (centered):
  Success icon (gradient circle with checkmark)
  Title: "Payment Successful"
  Subtitle: "Your [description] has been processed"

  Transaction Details Card:
    Fields Grid:
      Row 1: Amount: [amount] AED | Payee Name: [payee]
      Row 2: Transaction Ref: TXN-OF[timestamp] | Date: [date]
      Row 3 (full-width): From Account: [account type] ****[last3]

Return Button: [Return to [TPP]]
```

### SIP Variants

**SIP with pre-selected account + overdraft warning:**
- Remove Account Selector Card
- Add Payment Account section:
  - Label: "Payment Account"
  - Content: Payer IBAN: [iban]
- Add Supplementary Info Alert (warning type):
  - Icon: warning triangle
  - Title: "Overdraft Warning"
  - Body: "This payment will use your overdraft limit. You will be charged interest on the amount used."

**SIP with pre-selected account + duplicate payment alert:**
- Remove Account Selector Card
- Add Payment Account section with IBAN
- Add Supplementary Info Alert (warning type):
  - Title: "Duplicate Payment Alert"
  - Body: "A similar payment to [payee name] for [amount] AED was made on [date]. Please confirm this is not a duplicate."

**SIP merchant-facing (TPP as agent):**
- Permission text changes: "[TPP] needs your permission **on-behalf of [Merchant Name]** to make the payment below:"
- Remove Account Selector Card
- Add Payment Account section with IBAN

---

## FDP — Future Dated Payment

### Authorization Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: dl)
Progress Bar (Consent ✓ | Authorize active | Complete inactive)

Content Card:
  Heading: "Confirm to set up payment"
  Description: "[TPP] needs your permission to setup the payment below:"

  Fields Grid (two-column):
    Row 1: Amount: [amount] AED | Payee Name: [payee]
    Row 2: Payee IBAN: [iban] | Payment Reference: [ref]
    Row 3: Payment Date: [date] | Payment Purpose: [purpose]

Account Selector Card:
  Subheading: "Please select the account to pay from"
  Account cards (radio, 2-3 accounts):
    - Account Type
    - IBAN: ****[last4]
    - Available Balance: [amount] AED
    - Overdraft Limit: [amount] AED (if applicable)

Action Buttons:
  [Cancel] | [Pay using Al Tareq] (white mark SVG, prefix: bm)
```

### Completion Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: cl)
Progress Bar (all completed with checkmarks, lines all active)

Success Card (centered):
  Success icon (gradient circle with checkmark)
  Title: "Payment Scheduled"
  Subtitle: "Your payment has been scheduled for [date]"

  Transaction Details Card:
    Fields Grid:
      Row 1: Amount: [amount] AED | Payee Name: [payee]
      Row 2: Scheduled Date: [date] | Payment Reference: [ref]
      Row 3 (full-width): From Account: [account type] ****[last3]

Return Button: [Return to [TPP]]
```

---

## FD-MULTI — Fixed-Defined Multi-Payment

### Authorization Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: dl)
Progress Bar (Consent ✓ | Authorize active | Complete inactive)

Content Card:
  Heading: "Confirm to setup Multi-Payment"
  Description: "[TPP] needs your permission to make payment(s) from your account within the payment rules below:"

Payment Details Section:
  Fields Grid (two-column):
    Row 1: Payment to: [payee name] | Payee IBAN: [iban]
    Row 2: Payment Reference: [ref] | Payment Purpose: [purpose]
    Row 3 (full-width): Expiry Date: [date]

Payment Schedule Section:
  Table/Grid:
    Headers: Payment Date | Amount AED
    [Rows of scheduled payments with exact amounts]
    Total: [total amount] AED

Payment Account Section:
  Label: "Payment Account"
  Content: Payer IBAN: [iban]

Consent Footer Card:
  Checkboxes:
    ☐ "I confirm the balance will be checked before each payment is processed"
    ☐ "I trust this payee and want to save as trusted payee"

Action Buttons:
  [Cancel] | [Pay using Al Tareq] (white mark SVG, prefix: bm)
```

### Completion Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: cl)
Progress Bar (all completed with checkmarks, lines all active)

Success Card (centered):
  Success icon (gradient circle with checkmark)
  Title: "Multi-Payment Setup Confirmed"
  Subtitle: "Your payment schedule has been created"

  Transaction Details Card:
    Fields Grid:
      Row 1: Payment to: [payee name] | Total Amount: [total] AED
      Row 2: First Payment Date: [date] | Scheduled Payments: [count]
      Row 3 (full-width): From Account: [account type] ****[last3]

Return Button: [Return to [TPP]]
```

---

## VRP — Variable Recurring Payment

### Authorization Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: dl)
Progress Bar (Consent ✓ | Authorize active | Complete inactive)

Content Card:
  Heading: "Confirm to setup Multi-Payment"
  Description: "[TPP] needs your permission to make payment(s) from your account within the payment rules below:"

Payment Details Section:
  Fields Grid (two-column):
    Row 1: Payment to: [payee name] | Payee IBAN: [iban]
    Row 2: Payment Reference: [ref] | Payment Purpose: [purpose]

Payment Rules Section:
  Fields Grid (two-column):
    Row 1: Max per Payment: [amount] AED | First Payment Date: [date]
    Row 2: Payment repeats every: [frequency] | Stop payments on: [date]
    Row 3: Total number of payments: [count] | Total Value Allowed: [amount] AED

Payment Account Section:
  Label: "Payment Account"
  Content: Payer IBAN: [iban]

Consent Footer Card:
  Checkboxes:
    ☐ "I confirm the balance will be checked before each payment is processed"
    ☐ "I trust this payee and want to save as trusted payee"

Action Buttons:
  [Cancel] | [Pay using Al Tareq] (white mark SVG, prefix: bm)
```

### Completion Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: cl)
Progress Bar (all completed with checkmarks, lines all active)

Success Card (centered):
  Success icon (gradient circle with checkmark)
  Title: "Recurring Payment Setup Confirmed"
  Subtitle: "Your variable recurring payment has been activated"

  Transaction Details Card:
    Fields Grid:
      Row 1: Payment to: [payee name] | Max per Payment: [amount] AED
      Row 2: Frequency: [frequency] | Expiry Date: [date]
      Row 3 (full-width): From Account: [account type] ****[last3]

Return Button: [Return to [TPP]]
```

---

## VD-MULTI — Variable-Defined Multi-Payment

### Authorization Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: dl)
Progress Bar (Consent ✓ | Authorize active | Complete inactive)

Content Card:
  Heading: "Confirm to setup Multi-Payment"
  Description: "[TPP] needs your permission to make payment(s) from your account within the payment rules below:"

Payment Details Section:
  Fields Grid (two-column):
    Row 1: Payment to: [payee name] | Payee IBAN: [iban]
    Row 2: Payment Reference: [ref] | Payment Purpose: [purpose]
    Row 3 (full-width): Expiry Date: [date]

Payment Schedule Section:
  Table/Grid:
    Headers: Payment Date | MAX Amount AED
    [Rows of scheduled payments with maximum amounts, not fixed]
    Total Maximum: [total amount] AED

Payment Account Section:
  Label: "Payment Account"
  Content: Payer IBAN: [iban]

Consent Footer Card:
  Checkboxes:
    ☐ "I confirm the balance will be checked before each payment is processed"
    ☐ "I trust this payee and want to save as trusted payee"

Action Buttons:
  [Cancel] | [Pay using Al Tareq] (white mark SVG, prefix: bm)
```

### Completion Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: cl)
Progress Bar (all completed with checkmarks, lines all active)

Success Card (centered):
  Success icon (gradient circle with checkmark)
  Title: "Multi-Payment Setup Confirmed"
  Subtitle: "Your variable multi-payment schedule has been created"

  Transaction Details Card:
    Fields Grid:
      Row 1: Payment to: [payee name] | Total Max Amount: [total] AED
      Row 2: First Payment Date: [date] | Scheduled Payments: [count]
      Row 3 (full-width): From Account: [account type] ****[last3]

Return Button: [Return to [TPP]]
```

---

## IAVDB — Variable-Defined Beneficiary

### Authorization Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: dl)
Progress Bar (Consent ✓ | Authorize active | Complete inactive)

Content Card:
  Heading: "Confirm to setup Multi-Payment"
  Description: "[TPP] needs your permission to make payment(s) from your account within the payment rules below:"

Payment Rules Section:
  Fields Grid (two-column):
    Row 1: Max per MONTH: [amount] AED | Max per Payment: [amount] AED
    Row 2 (full-width): Expiry Date: [date]

Beneficiary List Section:
  Table/Grid:
    Headers: Payee Name | IBAN
    [Rows of pre-defined beneficiary accounts]
    [Multi-row, scrollable if needed]

Payment Account Section:
  Label: "Payment Account"
  Content: Payer IBAN: [iban]

Consent Footer Card:
  Checkboxes:
    ☐ "I confirm the balance will be checked before each payment is processed"
    ☐ "I trust these payees and want to save as trusted payees"

Action Buttons:
  [Cancel] | [Pay using Al Tareq] (white mark SVG, prefix: bm)
```

### Completion Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: cl)
Progress Bar (all completed with checkmarks, lines all active)

Success Card (centered):
  Success icon (gradient circle with checkmark)
  Title: "Multi-Beneficiary Setup Confirmed"
  Subtitle: "Your variable beneficiary account has been activated"

  Transaction Details Card:
    Fields Grid:
      Row 1: Beneficiaries: [count] accounts | Max per Payment: [amount] AED
      Row 2: Monthly Limit: [amount] AED | Expiry Date: [date]
      Row 3 (full-width): From Account: [account type] ****[last3]

Return Button: [Return to [TPP]]
```

---

## EAVB — Variable Beneficiary

### Authorization Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: dl)
Progress Bar (Consent ✓ | Authorize active | Complete inactive)

Content Card:
  Heading: "Confirm to setup Multi-Payment"
  Description: "[TPP] needs your permission to make payment(s) from your account within the payment rules below:"

Payment Rules Section:
  Fields Grid (two-column):
    Row 1: Max per MONTH: [amount] AED | Max per Payment: [amount] AED
    Row 2 (full-width): Expiry Date: [date]

Payment Account Section:
  Label: "Payment Account"
  Content: Payer IBAN: [iban]

Consent Footer Card:
  Checkboxes:
    ☐ "I confirm the balance will be checked before each payment is processed"
    ☐ "I understand payments can be made to any beneficiary within these limits"

Action Buttons:
  [Cancel] | [Pay using Al Tareq] (white mark SVG, prefix: bm)
```

### Completion Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: cl)
Progress Bar (all completed with checkmarks, lines all active)

Success Card (centered):
  Success icon (gradient circle with checkmark)
  Title: "Variable Beneficiary Setup Confirmed"
  Subtitle: "Your account is now ready for payments to any beneficiary"

  Transaction Details Card:
    Fields Grid:
      Row 1: Payment Type: Variable Beneficiary | Max per Payment: [amount] AED
      Row 2: Monthly Limit: [amount] AED | Expiry Date: [date]
      Row 3 (full-width): From Account: [account type] ****[last3]

Return Button: [Return to [TPP]]
```

---

## VRP-OD — VRP On-Demand

### Authorization Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: dl)
Progress Bar (Consent ✓ | Authorize active | Complete inactive)

Content Card:
  Heading: "Confirm to setup Multi-Payment"
  Description: "[TPP] needs your permission to make payment(s) from your account within the payment rules below:"

Payment Details Section:
  Fields Grid (two-column):
    Row 1: Payment to: [payee name] | Payee IBAN: [iban]
    Row 2: Payment Reference: [ref] | Payment Purpose: [purpose]

Payment Rules Section:
  Fields Grid (two-column):
    Row 1: First Payment Date: [date] | Expiry Date: [date]
    Row 2: Total Value Allowed: [amount] AED | Total Payments Allowed: [count]
    Row 3: Max per Payment: [amount] AED | Limits every: [period]
    Row 4: Max Value per [period]: [amount] AED | Max Payments per [period]: [count]

Payment Account Section:
  Label: "Payment Account"
  Content: Payer IBAN: [iban]

Consent Footer Card:
  Checkboxes:
    ☐ "I confirm the balance will be checked before each payment is processed"
    ☐ "I trust this payee and want to save as trusted payee"

Action Buttons:
  [Cancel] | [Pay using Al Tareq] (white mark SVG, prefix: bm)
```

### Completion Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: cl)
Progress Bar (all completed with checkmarks, lines all active)

Success Card (centered):
  Success icon (gradient circle with checkmark)
  Title: "On-Demand Recurring Payment Setup Confirmed"
  Subtitle: "Your on-demand payment authorization is now active"

  Transaction Details Card:
    Fields Grid:
      Row 1: Payment to: [payee name] | Max per Payment: [amount] AED
      Row 2: Total Value Limit: [amount] AED | Expiry Date: [date]
      Row 3 (full-width): From Account: [account type] ****[last3]

Return Button: [Return to [TPP]]
```

---

## COMBINED — Combined Payment

### Authorization Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: dl)
Progress Bar (Consent ✓ | Authorize active | Complete inactive)

Content Card:
  Heading: "Confirm to setup Combined-Payment"
  Description: "[TPP] needs your permission to make payment(s) from your account within the payment rules below:"

Payment Details Section:
  Fields Grid (two-column):
    Row 1: Payment to: [payee name] | Payee IBAN: [iban]
    Row 2: Payment Reference: [ref] | Payment Purpose: [purpose]

Payment Rules Section:
  Fields Grid (two-column):
    Row 1: Payment (Immediate): [amount] AED | First Recurring Date: [date]
    Row 2: Recurring Amount: [amount] AED | Frequency: [frequency]
    Row 3: Max per Recurring Payment: [amount] AED | Total Value Allowed: [amount] AED
    Row 4: Expiry Date: [date] | Total Payments Allowed: [count]

Payment Account Section:
  Label: "Payment Account"
  Content: Payer IBAN: [iban]

Consent Footer Card:
  Checkboxes:
    ☐ "I confirm the balance will be checked before each payment is processed"
    ☐ "I trust this payee and want to save as trusted payee"

Action Buttons:
  [Cancel] | [Pay using Al Tareq] (white mark SVG, prefix: bm)
```

### Completion Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: cl)
Progress Bar (all completed with checkmarks, lines all active)

Success Card (centered):
  Success icon (gradient circle with checkmark)
  Title: "Combined Payment Setup Confirmed"
  Subtitle: "Your immediate and recurring payments are now active"

  Transaction Details Card:
    Fields Grid:
      Row 1: Immediate Payment: [amount] AED | Recurring: [frequency]
      Row 2: Transaction Ref: TXN-OF[timestamp] | Expiry Date: [date]
      Row 3 (full-width): From Account: [account type] ****[last3]

Return Button: [Return to [TPP]]
```

---

## INTL — International Payment

### Authorization Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: dl)
Progress Bar (Consent ✓ | Authorize active | Complete inactive)

Content Card:
  Heading: "Confirm to setup payment"
  Description: "[TPP] needs your permission to setup the payment below:"

Payee Details Section:
  Fields Grid (two-column):
    Row 1: Payee Name: [name] | Payee Address: [address]
    Row 2: Payee IBAN: [iban] | Payee BIC: [bic]
    Row 3 (full-width): Payee Country: [country]

Payment Details Section:
  Fields Grid (two-column):
    Row 1: Amount (Foreign): [amount] [currency] | Exchange Rate: [rate]
    Row 2: Amount Converted: [amount] AED | Priority: [priority level]
    Row 3: Charges Model: [OUR/SHA/BEN] | Charges: [amount] AED
    Row 4: Total Amount: [total] AED | Payment Reference: [ref]
    Row 5: Payment Date: [date] | Payment Purpose: [purpose]

Payment Account Section:
  Label: "Payment Account"
  Content: Payer IBAN: [iban]

Exchange Rate Countdown:
  Note: "Exchange rate valid until [time]. Rate may change if not completed within this period."

Action Buttons:
  [Cancel] | [Pay using Al Tareq] (white mark SVG, prefix: bm)
```

### Completion Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: cl)
Progress Bar (all completed with checkmarks, lines all active)

Success Card (centered):
  Success icon (gradient circle with checkmark)
  Title: "International Payment Submitted"
  Subtitle: "Your international payment has been submitted for processing"

  Transaction Details Card:
    Fields Grid:
      Row 1: Payee Name: [name] | Foreign Amount: [amount] [currency]
      Row 2: Transaction Ref: TXN-OF[timestamp] | Total AED: [amount] AED
      Row 3: Date: [date] | Estimated Delivery: [date]
      Row 4 (full-width): From Account: [account type] ****[last3]

Return Button: [Return to [TPP]]
```

---

## BULK — Bulk/Batch Payment

### Authorization Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: dl)
Progress Bar (Consent ✓ | Authorize active | Complete inactive)

Content Card:
  Heading: "Confirm to setup payment"
  Description: "Please check if the details below are correct."

  Fields Grid (two-column):
    Row 1: Description: [description] | No. of Payees: [count]
    Row 2: Payment Reference: [ref] | Date to send: [date]

File Reference Section:
  Label: "Batch File"
  Content: [Link to CSV file] "download-batch.csv"
  Note: "Contains [count] payment records with total value: [amount] AED"

Account Selector Card:
  Subheading: "Please select the account to pay from"
  Account cards (radio, 2-3 accounts, may include Business Account):
    - Account Type (Primary/Secondary/Business)
    - IBAN: ****[last4]
    - Available Balance: [amount] AED
    - Overdraft Limit: [amount] AED (if applicable)

Action Buttons:
  [Cancel] | [Pay using Al Tareq] (white mark SVG, prefix: bm)
```

### Completion Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: cl)
Progress Bar (all completed with checkmarks, lines all active)

Success Card (centered):
  Success icon (gradient circle with checkmark)
  Title: "Batch Payment Submitted"
  Subtitle: "Your batch payment has been submitted for processing"

  Transaction Details Card:
    Fields Grid:
      Row 1: Total Payees: [count] | Total Amount: [amount] AED
      Row 2: Batch Reference: [ref] | Submission Date: [date]
      Row 3: Processing Status: Pending | Estimated Completion: [date]
      Row 4 (full-width): From Account: [account type] ****[last3]

Return Button: [Return to [TPP]]
```

---

## DATA — Data Sharing

### Authorization Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: dl)
Progress Bar (Consent ✓ | Authorize active | Complete inactive)

Content Section (no card):
  Instruction Text: "Select account(s) to share information with [TPP name]"

Account Selector Card:
  Subheading: "Select accounts"
  Account checkboxes (multi-select, 2-3 accounts):
    ☐ [Account Type] - IBAN: ****[last4] - Balance: [amount] AED
    ☐ [Account Type] - IBAN: ****[last4] - Balance: [amount] AED
    ☐ [Account Type] - IBAN: ****[last4] - Balance: [amount] AED

Data Categories Section:
  Instruction: "Data to be shared:"
  Expandable List (6 categories, initially collapsed):
    ▶ Account Information
    ▶ Transaction History
    ▶ Balances & Limits
    ▶ Account Statements
    ▶ Payment Instructions
    ▶ Account Metadata

Expiry Notice:
  Text: "This authorization will expire on [date]. You can revoke access at any time."

Action Buttons:
  [Cancel] | [Authorize using Al Tareq] (white mark SVG, prefix: bm)
```

### Completion Screen Composition

```
Header Block (LFI branding)
Al Tareq Logo (dark, prefix: cl)
Progress Bar (all completed with checkmarks, lines all active)

Success Card (centered):
  Success icon (gradient circle with checkmark)
  Title: "Authorization Successful"
  Subtitle: "[TPP name] can now access your account information"

  Authorization Details Card:
    Fields Grid:
      Row 1: Authorized Accounts: [count] | Authorization Date: [date]
      Row 2: Data Categories: [count] | Expiry Date: [date]
      Row 3 (full-width): Authorization Code: AUTH-OF[timestamp]

Return Button: [Return to [TPP]]
```

---

## Redirect Screen (All Journeys)

The Redirect screen appears as Screen 2 in all journeys. It is a full-viewport transition screen between Authorization and Completion.

### Redirect to LFI

```
Layout:
  Full-viewport gradient background (use gradient-secondary from design tokens)
  Centered container:

    Content (vertically centered):
      Text (line 1, centered, larger font):
        "We're redirecting you to"

      Text (line 2, centered, largest/bold font):
        "[LFI Name]"

      Text (line 3, centered, smaller font):
        "please keep this window open"

      Spinner:
        - CSS rotation animation (infinite)
        - Duration: 1.5s
        - Margin-top: 40px

      Footer (bottom of viewport, centered):
        Al Tareq Logo (white, prefix: wl)
        Text below logo: "Powered by Al Tareq"
        Font color: white
        Opacity: 0.9
```

### Redirect to TPP

```
Layout:
  Full-viewport gradient background (use gradient-secondary from design tokens)
  Centered container:

    Content (vertically centered):
      Text (line 1, centered, larger font):
        "We are securely transferring you back to"

      Text (line 2, centered, largest/bold font):
        "[TPP Name]"

      Spinner:
        - CSS rotation animation (infinite)
        - Duration: 1.5s
        - Margin-top: 40px

      Footer (bottom of viewport, centered):
        Al Tareq Logo (white, prefix: wl)
        Text below logo: "Powered by Al Tareq"
        Font color: white
        Opacity: 0.9
```

### Redirect Screen Timing & Behavior

- Auto-redirect after 5 seconds to the target URL
- Spinner should rotate continuously during wait
- Logo should be embedded as inline SVG
- Gradient background should use CSS gradient (not image)
- Text color: white (use design token `--color-text-on-gradient`)
- All text should be centered and readable on gradient background
- Viewport should be 100vh height to fill screen

---

## Common Component Reference

### Field Grid Patterns

**Two-Column Grid:**
- Row layout: Left column (50%) | Right column (50%)
- Gutter between columns: 24px
- Each field has Label + Value structure
- Responsive: At tablet/mobile, stack to single column

**Full-Width Field:**
- Label spans both columns (100%)
- Centered or left-aligned
- Same padding structure as two-column

### Account Selector Cards

**Radio Button Variant (SIP, FDP, BULK):**
```
[◯ Account Type - IBAN: ****1234 - Balance: 5,000 AED - Overdraft: 1,000 AED]
[◉ Account Type - IBAN: ****5678 - Balance: 12,000 AED - Overdraft: 2,000 AED] (selected)
[◯ Account Type - IBAN: ****9012 - Balance: 3,500 AED - Overdraft: 500 AED]
```

**Checkbox Variant (DATA):**
```
[☐ Account Type - IBAN: ****1234 - Balance: 5,000 AED]
[☑ Account Type - IBAN: ****5678 - Balance: 12,000 AED] (checked)
[☑ Account Type - IBAN: ****9012 - Balance: 3,500 AED] (checked)
```

### Consent Footer Card

Used in: FD-MULTI, VRP, VD-MULTI, IAVDB, EAVB, VRP-OD, COMBINED

**Standard Format:**
```
Card with light background:
  Checkbox 1: ☐ "[Standard consent text about balance checks]"
  Checkbox 2: ☐ "[Variant consent text - may be about trusted payees or understanding of rules]"

  Both unchecked by default
  User must check both to enable Pay button
```

### Supplementary Info Alerts

Used in: SIP variants

**Warning Type:**
- Background: light red/amber (use `--color-alert-warning-bg`)
- Border-left: 3px solid warning color
- Icon: warning triangle (24px)
- Title (bold): max 40 characters
- Body text: max 120 characters
- Margin-bottom: 24px (above buttons)

---

## SVG Logo Prefix Reference

| Prefix | Usage | Variant | Color |
|--------|-------|---------|-------|
| dl | Dark Logo | Used in Authorization screens (headers) | Dark/Black |
| cl | Completion Logo | Used in Completion screens (headers) | Dark/Black |
| bm | Button Mark | Used on "[Pay using Al Tareq]" button | White |
| wl | White Logo | Used on Redirect screens (footer) | White |

---

## Button States & Text

### Primary Action Button

- **Default State:** Background gradient (use `--gradient-primary`), white text
- **Hover State:** Opacity 0.9, cursor pointer
- **Active/Pressed State:** Slight scale down (0.98)
- **Disabled State:** Opacity 0.5, cursor not-allowed
- **Loading State:** Spinner inside button, text hidden or changed to "Processing..."

### Button Text Patterns by Journey Type

| Journey | Button Text | Icon |
|---------|------------|------|
| SIP, FDP, FD-MULTI, VRP, VD-MULTI, IAVDB, EAVB, VRP-OD, COMBINED, INTL, BULK | "Pay using Al Tareq" | White mark (bm) |
| DATA | "Authorize using Al Tareq" | White mark (bm) |

---

## Validation & Error States

### Field-Level Validation

- **Required Fields:** Show * (red asterisk) after label
- **Invalid Input:** Border color red, error message below field
- **Valid Input:** Border color green or neutral (on blur/focus-loss)

### Form-Level Validation

- **Missing Consent Checkboxes:** Show alert banner at top of card, disable primary button
- **No Account Selected:** Show alert banner, disable primary button
- **Amount Exceeds Limit:** Show inline warning alert, disable primary button

---

## Accessibility Requirements

- All form fields must have associated `<label>` elements
- Use `aria-label` for icon-only buttons (Cancel)
- Progress bar should use `aria-current="step"` for active step
- Modal dialogs should have `role="alertdialog"` and focus management
- Color should never be the only indicator (use icons + text for alerts)
- Keyboard navigation: Tab through fields, Enter to submit, Escape to cancel
- Screen reader: Announce field errors and validation states
