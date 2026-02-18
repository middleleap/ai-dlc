# Screen Catalog

Complete field-by-field specifications for every Al Tareq Open Finance journey screen. Use this to build pixel-accurate screens for each journey type.

## Table of Contents

1. [Single Instant Payment (SIP)](#single-instant-payment-sip)
2. [Future Dated Payment (FDP)](#future-dated-payment-fdp)
3. [Multi-Payment: Fixed-Defined Consent](#multi-payment-fixed-defined)
4. [Multi-Payment: Variable Recurring (VRP)](#multi-payment-variable-recurring-vrp)
5. [Multi-Payment: Variable-Defined Consent](#multi-payment-variable-defined)
6. [Multi-Payment: Variable-Defined Beneficiary (IAVDB)](#multi-payment-variable-defined-beneficiary-iavdb)
7. [Multi-Payment: Variable Beneficiary (EAVB)](#multi-payment-variable-beneficiary-eavb)
8. [Multi-Payment: VRP On-Demand](#multi-payment-vrp-on-demand)
9. [Multi-Payment: Combined Payment](#multi-payment-combined)
10. [International Payment](#international-payment)
11. [Bulk and Batch Payment](#bulk-and-batch-payment)
12. [Data Sharing Consent](#data-sharing-consent)
13. [Redirection Screens](#redirection-screens)
14. [SIP Variants](#sip-variants)

---

## Single Instant Payment (SIP)

**Screen title:** "Confirm Payment"
**Permission text:** "[TPP trading name] needs your permission to make the payment below:"
**Button text:** "Pay using Al Tareq"

### Field Grid (two-column layout)

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | Amount: `100 AED` | Payee Name: `Merchant` |
| 2 | Payee IBAN: `AE07 0331 2345 6789 0123 456` | Payment Reference: `Order 123456` |
| 3 (full width) | Payment Purpose: `Goods Bought` | |

### Account Selection Section

**Heading:** "Please select the account to pay from"

Displays 2+ account cards side by side:
- Account type (Current Account / Savings Account)
- IBAN number
- Balance amount (with "AED" suffix)
- Overdraft amount (optional, only if applicable)

### Components Used
1. Header Block
2. Al Tareq Logo
3. Progress Bar (Consent ✓, Authorize active, Complete inactive)
4. Content Card with heading + permission text
5. Payment Details Grid
6. Account Selector Card (separate card below)
7. Action Buttons (Cancel + Pay using Al Tareq)

---

## Future Dated Payment (FDP)

**Screen title:** "Confirm to set up payment"
**Permission text:** "[TPP trading name] needs your permission to setup the payment below:"
**Button text:** "Pay using Al Tareq"

### Field Grid

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | Amount: `100 AED` | Payee Name: `Merchant` |
| 2 | Payee IBAN: `AE07 0331 2345 6789 0123 456` | Payment Reference: `Order 123456` |
| 3 | Payment Date: `25/2/2024` | Payment Purpose: `Goods Bought` |

### Account Selection Section

Same as SIP — "Please select the account to pay from" with account cards.

### Differences from SIP
- Title says "set up payment" instead of just "Confirm Payment"
- Permission text says "setup the payment" instead of "make the payment"
- Includes "Payment Date" field showing the future date
- Account selector is identical to SIP

---

## Multi-Payment: Fixed-Defined

**Screen title:** "Confirm to setup Multi-Payment"
**Permission text:** "[TPP trading name] needs your permission to make payment(s) from your account within the payment rules below:"
**Button text:** "Pay using Al Tareq"

### Field Grid — Payment Details

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | Payment to: `Merchant` | Payee IBAN: `AE07 0331 2345 6789 0123 456` |
| 2 | Payment Reference: `MY REFERENCE` | Payment Purpose: `Good bought` |
| 3 (full width) | Expiry Date: `1/12/2024` | |

### Payment Schedule Section

**Subheading:** "Payment Schedule"

Grid showing scheduled payment dates and amounts:

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | Date: `1/8/2024` | Date: `15/9/2024` |
|   | Amount: `10,000 AED` | Amount: `9,000 AED` |
| 2 | Date: `1/12/2024` | |
|   | Amount: `8,500 AED` | |

Note: amounts shown in teal/accent color.

### Payment Account Section

**Subheading:** "Payment Account"
- Payer IBAN: `AE04 0231 2345 6789 0123 322`

### Consent Footer

Balance check permission + Trusted Payees checkbox.

---

## Multi-Payment: Variable Recurring (VRP)

**Screen title:** "Confirm to setup Multi-Payment"
**Permission text:** "[TPP trading name] needs your permission to make payment(s) from your account within the payment rules below:"
**Button text:** "Pay using Al Tareq"

### Field Grid — Payment Details

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | Payment to: `Merchant Ltd` | Payee IBAN: `AE07 0331 2345 6789 0123 456` |
| 2 | Payment Reference: `MY REFERENCE` | Payment Purpose: `Good bought` |

### Payment Rules Section

**Subheading:** "Payment Rules"

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | Max per Payment: `500 AED` | First Payment Date: `5/8/2024` |
| 2 | Payment repeats every: `WEEK` | Stop payments on: `30/12/2024` |
| 3 | Total number of payments allowed: `22` | Total Value Allowed: `11,000 AED` |

### Payment Account Section

Payer IBAN: `AE04 0231 2345 6789 0123 322`

### Consent Footer

Balance check permission + Trusted Payees checkbox.

---

## Multi-Payment: Variable-Defined

**Screen title:** "Confirm to setup Multi-Payment"
**Permission text:** Same as VRP.
**Button text:** "Pay using Al Tareq"

### Field Grid — Payment Details

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | Payment to: `Merchant` | Payee IBAN: `AE07 0331 2345 6789 0123 456` |
| 2 | Payment Reference: `MY REFERENCE` | Payment Purpose: `Good bought` |
| 3 (full width) | Expiry Date: `1/12/2024` | |

### Payment Schedule Section

**Subheading:** "Payment Schedule"

Shows scheduled dates with **MAX** amounts (unlike Fixed-Defined which shows exact amounts):

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | Date: `1/8/2024` | Date: `15/9/2024` |
|   | MAX Amount: `10,000 AED` | MAX Amount: `9,000 AED` |
| 2 | Date: `1/12/2024` | |
|   | MAX Amount: `8,500 AED` | |

### Differences from Fixed-Defined
- Field labels say "MAX Amount" instead of "Amount"
- Amounts represent maximums, not exact figures

### Payment Account + Consent Footer

Same as Fixed-Defined.

---

## Multi-Payment: Variable-Defined Beneficiary (IAVDB)

**Screen title:** "Confirm to setup Multi-Payment"
**Permission text:** "[TPP trading name] needs your permission to make payment(s) from your account within the payment rules below:"
**Button text:** "Pay using Al Tareq"

### Payment Rules Section

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | Max per MONTH: `10,000 AED` | Max per Payment: `1,000 AED` |
| 2 (full width) | Expiry Date: `01/03/2024` | |

### Beneficiary List Section

**Subheading:** "Beneficiary List"

Displays multiple beneficiaries in a two-column grid:

| Left Column | Right Column |
|-------------|--------------|
| Payee name: `A` | Payee name: `B` |
| IBAN: `AE04 0231 2345 6789 0123 322` | IBAN: `AE04 0221 2345 6789 0123 323` |
| Payee name: `C` | |
| IBAN: `AE04 0231 2345 6789 0123 324` | |

### Payment Account + Consent Footer

Same pattern.

---

## Multi-Payment: Variable Beneficiary (EAVB)

**Screen title:** "Confirm to setup Multi-Payment"
**Permission text:** Same.
**Button text:** "Pay using Al Tareq"

This is the simplest multi-payment variant — no fixed beneficiaries.

### Payment Rules Section

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | Max per MONTH: `10,000 AED` | Max per Payment: `1,000 AED` |
| 2 (full width) | Expiry date: `01/03/2024` | |

### Payment Account + Consent Footer

Same pattern.

### Key Difference
- No beneficiary list
- No payee details in the header fields
- Only payment rules and account

---

## Multi-Payment: VRP On-Demand

**Screen title:** "Confirm to setup Multi-Payment"
**Permission text:** Same.
**Button text:** "Pay using Al Tareq"

The most detailed payment rules variant.

### Field Grid — Payment Details

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | Payment to: `Merchant Ltd` | Payee IBAN: `AE07 0331 2345 6789 0123 456` |
| 2 | Payment Reference: `MY REFERENCE` | Payment Purpose: `Good bought` |

### Payment Rules Section

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | First Payment Date: `Merchant Ltd` | Expiry Date: `3/12/2024` |
| 2 | Total Value allowed: `100,000 AED` | Total Number of Payments allowed: `Good bought` |
| 3 | Max per Payment: `MY REFERENCE` | Limits every: `MONTH` |
| 4 | Max Value per MONTH: `10,000 AED` | Max Payments per MONTH: `100` |

### Payment Account + Consent Footer

Same pattern.

---

## Multi-Payment: Combined

**Screen title:** "Confirm to setup Combined-Payment"
**Permission text:** Same.
**Button text:** "Pay using Al Tareq"

Combines an immediate one-time payment with recurring payment rules.

### Field Grid — Payment Details

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | Payee Name: `MERCHANT` | IBAN: `AE07 0331 2345 6789 0123 456` |
| 2 | Payment Reference: `MY REFERENCE` | Payment Purpose: `Good bought` |

### Payment Rules Section

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | Payment (Immediate): `5,000 AED` | Max per MONTH: `10,000 AED` |
| 2 | Max per Payment: `1,000 AED` | Expiry date: `01/03/2024` |

### Payment Account + Consent Footer

Same pattern.

---

## International Payment

**Screen title:** "Confirm to setup payment"
**Permission text:** "[TPP trading name] needs your permission to setup the payment below:"
**Button text:** "Pay using Al Tareq"

The most field-heavy screen with beneficiary address, BIC, exchange rate, and charges.

### Payee Details Section

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | Payee Name: `Merchant Ltd` | Payee Address: `12 Example Road Example City Example Region PO1 2ST UK` |
| 2 | Payee IBAN: `AE04 0231 2345 6789 0123 322` | BIC Number: `BANKGB22XXX` |
| 3 (full width) | Country: `United Kingdom` | |

### Payment Details Section

**Subheading:** "Payment Details"

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | Amount: `411.31 GBP` | *Exchange rate (actual): `1 AED = 0.2153 GBP` |
| 2 | Amount converted: `1910.40 AED` | Priority: `High` |
| 3 | Charges Model: `Shared` | Charges: `15.00 AED` |
| 4 | Total Amount: `1,925.00 AED` | Payment Reference: `MY Reference` |
| 5 | Payment Date: `Today` | Payment Purpose: `PurchaseSaleOfGoods` |

### Exchange Rate Note

Below the payment details grid:
```
*Exchange rate is valid for: 2:47
```
Shown in warning/red color as a countdown.

### Payment Account Section

Payer IBAN shown.

---

## Bulk and Batch Payment

**Screen title:** "Confirm to setup payment"
**Permission text:** "Please check if the details below are correct."
**Button text:** "Pay using Al Tareq"

### Field Grid

| Row | Left Column | Right Column |
|-----|-------------|--------------|
| 1 | Description: `Merchant Ltd` | No. of Payees: `10` |
| 2 | Payment Reference: `MY REFERENCE` | Date to send: `14/05/2024` |

### Account Selection Section

Same as SIP but shows Business Account as an option alongside Current Account and Other.

### File Reference Section

Below account selection:
```
Check the list of payments within the submitted file
📎 document-name.CSV
```

### Key Differences
- Permission text is different ("Please check if details below are correct")
- Includes "No. of Payees" field
- Has "Date to send" instead of payment date
- Shows file reference for the bulk payment CSV
- Account selector includes Business Account type

---

## Data Sharing Consent

**Screen title:** None (no explicit heading card)
**Instruction text:** "Select account(s) to share information with [Al Tareq Financial Technology Limited]"
**Button text:** "Authorize using Al Tareq"

### Account Selection (Multi-Select)

Uses **checkboxes** instead of radio buttons — multiple accounts can be selected:

3 account cards displayed horizontally with:
- Account type (Current Account)
- IBAN
- Balance
- Overdraft

Selected account has filled checkbox (blue); unselected has empty checkbox.

### Data Categories Section

**Subheading:** "Review the information you will be sharing"

Expandable category list with icon + label + chevron:
1. Your Account details
2. Your Regular Payments
3. Your Account Transactions
4. Your Statements
5. Your Account Features and Benefits
6. Contact and Party Details

### Expiry Notice

"This permission will expire on: 01/03/2024"

### Components Used
1. Header Block
2. Al Tareq Logo
3. Progress Bar (Consent ✓, Authorize active, Complete inactive)
4. Account Selector (multi-select with checkboxes)
5. Data Categories List
6. Expiry Notice
7. Action Buttons (Cancel + Authorize using Al Tareq)

---

## Redirection Screens

Two redirection screens used during TPP ↔ LFI transitions.

### Redirect to LFI

**Message:** "We're redirecting you to **YOUR LFI**<br>please keep this window open"
**Footer:** "Powered by" + white Al Tareq logo

### Redirect to TPP

**Message:** "We are securely transferring you back to<br>**YOUR TPP**"
**Footer:** "Powered by" + white Al Tareq logo

### Visual Design
- Full-viewport gradient background (navy → teal)
- Centered animated spinner
- White text
- White Al Tareq logo at bottom

---

## SIP Variants

### Standard SIP
As described above with account selector.

### SIP — User provides bank details at TPP & LFI provides Supplementary Info

**Differences from standard:**
- No account selector — payer IBAN is pre-selected and shown in a "Payment account" section
- Includes **overdraft warning alert** below the payment account

**Payment Account section:**
- Label: "Payment account"
- IBAN: `AE07 0331 2345 6789 0123 456`

**Supplementary Info:**
Overdraft warning alert (orange/red background):
"This payment will take your selected account into unarranged overdraft. To avoid interest charges and other overdraft fees, please repay the unarranged overdraft by the end of day."

### SIP — User selects account at TPP & LFI provides Supplementary Info

**Differences:**
- No account selector — IBAN pre-selected
- Includes **duplicate payment alert**

**Supplementary Info:**
Duplicate payment alert:
Title: "Duplicate Payment Alert"
Body: "Our systems indicate that you have already made a payment of the same amount to this beneficiary in the last 24 hours. Please check and ensure that you are not making a duplicate payment that is not required."

### SIP — Merchant is user-facing entity using TPP

**Differences:**
- Permission text: "[TPP trading name] needs your permission **on-behalf of [Merchant]** to make the payment below:"
- "on-behalf of [Merchant]" is shown in bold
- No account selector — IBAN pre-selected in "Payment account" section
- No supplementary info alerts
- Same field layout as standard SIP otherwise

---

## FDP Variant

### FDP — User selects account at TPP & LFI provides Supplementary Info

**Differences from standard FDP:**
- No account selector — payer IBAN pre-selected in "Payment account" section
- No supplementary info alerts shown in the wireframe
- Otherwise identical field layout to standard FDP
