# Journey-Specific Screen Requirements

## Bank Service Initiation Journeys

### Single Instant Payment (SIP)

**Flow:** TPP → Consent → LFI Auth → Payment Execution → Confirmation → TPP

#### Screen 1: Payment Initiation (TPP)
```
┌─────────────────────────────────────┐
│  [TPP Header/Branding]              │
├─────────────────────────────────────┤
│  [AlTareq Logo]                     │
│  ○ Consent ─── ○ Authorize ─── ○ Complete
├─────────────────────────────────────┤
│  You are paying:                    │
│  ┌─────────────────────────────────┐│
│  │ Amount: AED 500.00              ││
│  │ To: Merchant Name               ││
│  │ Reference: INV-12345            ││
│  └─────────────────────────────────┘│
│                                     │
│  Select account to pay from:        │
│  ○ Current Account ****1234         │
│  ○ Savings Account ****5678         │
│                                     │
│  ┌─────────────────────────────────┐│
│  │   Pay by bank using AlTareq    ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

#### Screen 2: Redirection to LFI
```
┌─────────────────────────────────────┐
│  Redirecting to your bank...        │
│  [Bank Logo] [AlTareq Logo]         │
│  [Loading indicator]                │
└─────────────────────────────────────┘
```

#### Screen 3: LFI Authorization
```
┌─────────────────────────────────────┐
│  [Bank Header/Branding]             │
├─────────────────────────────────────┤
│  [AlTareq Logo]                     │
│  ○ Consent ─── ● Authorize ─── ○ Complete
├─────────────────────────────────────┤
│  Confirm payment:                   │
│  Amount: AED 500.00                 │
│  To: Merchant Name                  │
│  From: Current Account ****1234     │
│  Reference: INV-12345               │
│                                     │
│  [Authentication Method]            │
│  - UAE Pass / Biometric / PIN       │
│                                     │
│  ┌─────────────────────────────────┐│
│  │   Authorize using AlTareq      ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

#### Screen 4: Confirmation
```
┌─────────────────────────────────────┐
│  [Bank Header/Branding]             │
├─────────────────────────────────────┤
│  [AlTareq Logo]                     │
│  ○ Consent ─── ○ Authorize ─── ● Complete
├─────────────────────────────────────┤
│  ✓ Payment Successful               │
│                                     │
│  Amount: AED 500.00                 │
│  To: Merchant Name                  │
│  Reference: TXN-ABC123456           │
│  Date: 01 Jan 2026                  │
│                                     │
│  ┌─────────────────────────────────┐│
│  │   Return to [TPP Name]         ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

### Variable Recurring Payment (VRP)

**Flow:** TPP → Consent Setup → LFI Auth → Consent Active → TPP

#### Screen 1: VRP Consent Setup (TPP)
```
┌─────────────────────────────────────┐
│  [TPP Header/Branding]              │
├─────────────────────────────────────┤
│  [AlTareq Logo]                     │
│  ● Consent ─── ○ Authorize ─── ○ Complete
├─────────────────────────────────────┤
│  Set up recurring payments to:      │
│  [Merchant Name]                    │
│                                     │
│  Payment limits:                    │
│  Max per payment: AED 1,000.00      │
│  Max per day: AED 2,000.00          │
│  Max per month: AED 10,000.00       │
│                                     │
│  Valid until: 01 Jan 2027           │
│                                     │
│  Select account:                    │
│  ○ Current Account ****1234         │
│                                     │
│  ┌─────────────────────────────────┐│
│  │   Authorize using AlTareq      ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

### Future Dated Payment

#### Screen 1: Scheduled Payment Setup
```
┌─────────────────────────────────────┐
│  [TPP Header/Branding]              │
├─────────────────────────────────────┤
│  [AlTareq Logo]                     │
│  ● Consent ─── ○ Authorize ─── ○ Complete
├─────────────────────────────────────┤
│  Schedule a payment:                │
│                                     │
│  Amount: AED 1,500.00               │
│  To: Landlord Name                  │
│  IBAN: AE12 3456 7890 1234 5678 901 │
│  Payment Date: 15 Jan 2026          │
│  Reference: RENT-JAN-2026           │
│                                     │
│  Pay from:                          │
│  ○ Current Account ****1234         │
│                                     │
│  ┌─────────────────────────────────┐│
│  │   Pay using AlTareq            ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## Bank Data Sharing Journeys

### Account Information Access

**Flow:** TPP → Consent → LFI Auth → Access Granted → TPP

#### Screen 1: Data Sharing Consent (TPP)
```
┌─────────────────────────────────────┐
│  [TPP Header/Branding]              │
├─────────────────────────────────────┤
│  [AlTareq Logo]                     │
│  ● Consent ─── ○ Authorize ─── ○ Complete
├─────────────────────────────────────┤
│  [TPP Name] is requesting access to:│
│                                     │
│  ☑ Account details                  │
│  ☑ Account balances                 │
│  ☑ Transaction history (90 days)    │
│                                     │
│  Purpose: Personal finance          │
│           management                │
│                                     │
│  Access valid for: 90 days          │
│                                     │
│  Select accounts to share:          │
│  ☑ Current Account ****1234         │
│  ☑ Savings Account ****5678         │
│  ☐ Joint Account ****9012           │
│                                     │
│  ┌─────────────────────────────────┐│
│  │   Connect using AlTareq        ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

#### Screen 2: LFI Authorization
```
┌─────────────────────────────────────┐
│  [Bank Header/Branding]             │
├─────────────────────────────────────┤
│  [AlTareq Logo]                     │
│  ○ Consent ─── ● Authorize ─── ○ Complete
├─────────────────────────────────────┤
│  Authorize data sharing:            │
│                                     │
│  [TPP Name] will receive:           │
│  • Account details                  │
│  • Account balances                 │
│  • Transaction history              │
│                                     │
│  For accounts:                      │
│  • Current Account ****1234         │
│  • Savings Account ****5678         │
│                                     │
│  Valid until: 01 Apr 2026           │
│                                     │
│  [Authentication Method]            │
│                                     │
│  ┌─────────────────────────────────┐│
│  │   Authorize using AlTareq      ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## Insurance Data Sharing Journeys

### Policy Information Access

#### Screen 1: Insurance Data Consent
```
┌─────────────────────────────────────┐
│  [TPP Header/Branding]              │
├─────────────────────────────────────┤
│  [AlTareq Logo]                     │
│  ● Consent ─── ○ Authorize ─── ○ Complete
├─────────────────────────────────────┤
│  [TPP Name] is requesting access to:│
│                                     │
│  ☑ Policy details                   │
│  ☑ Coverage information             │
│  ☑ Claims history                   │
│                                     │
│  Purpose: Insurance comparison      │
│                                     │
│  Access valid for: 30 days          │
│                                     │
│  Select policies to share:          │
│  ☑ Motor Insurance - POL-12345      │
│  ☑ Home Insurance - POL-67890       │
│                                     │
│  ┌─────────────────────────────────┐│
│  │   Share data using AlTareq     ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## Error Screen Templates

### Authentication Failed
```
┌─────────────────────────────────────┐
│  [Bank Header/Branding]             │
├─────────────────────────────────────┤
│  [AlTareq Logo]                     │
│  ○ Consent ─── ✗ Authorize ─── ○ Complete
├─────────────────────────────────────┤
│  ✗ Authentication Failed            │
│                                     │
│  We couldn't verify your identity.  │
│  Error code: AUTH-001               │
│                                     │
│  ┌─────────────────────────────────┐│
│  │   Try Again                    ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │   Cancel                       ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Consent Declined
```
┌─────────────────────────────────────┐
│  [Bank Header/Branding]             │
├─────────────────────────────────────┤
│  [AlTareq Logo]                     │
│  ○ Consent ─── ✗ Authorize ─── ○ Complete
├─────────────────────────────────────┤
│  Consent Declined                   │
│                                     │
│  You chose not to proceed with      │
│  this request.                      │
│                                     │
│  ┌─────────────────────────────────┐│
│  │   Return to [TPP Name]         ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## Progress Bar States

### Visual States
```
Inactive:  ○ (hollow circle, muted color)
Active:    ● (filled circle, primary color)
Complete:  ✓ (checkmark, success color)
Error:     ✗ (x mark, error color)
```

### Step Combinations
| Journey State | Consent | Authorize | Complete |
|---------------|---------|-----------|----------|
| At Consent    | ●       | ○         | ○        |
| At Auth       | ✓       | ●         | ○        |
| Success       | ✓       | ✓         | ●        |
| Auth Failed   | ✓       | ✗         | ○        |
| Declined      | ✗       | ○         | ○        |

---

## Mobile-Specific Considerations

### Touch Targets
- Minimum button height: 48px
- Minimum touch target: 44x44px
- Adequate spacing between interactive elements

### Responsive Layout
- Full-width buttons on mobile
- Scrollable content for long forms
- Fixed header with AlTareq branding

### App-to-App Redirects
- Deep linking to bank apps where available
- Fallback to mobile web
- Clear return path to originating app
