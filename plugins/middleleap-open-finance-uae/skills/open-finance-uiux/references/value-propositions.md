# Open Finance Value Propositions Catalog
## Al Tareq Platform (CBUAE Regulated)

---

## 1. Catalog Overview

This reference document maps **business use cases to Open Finance journey types** with ready-made value proposition frameworks designed for rapid prototyping and presentation generation.

Each entry is self-contained and structured to enable immediate:
- Presentation slide generation
- Interactive prototype creation
- User testing scenario development
- Stakeholder communication materials

**Context**: This catalog focuses on UAE Open Finance implementations via the Al Tareq platform (Central Bank of the UAE regulated), covering both **Payment Initiation Services (SIP)** and **Account Information Services (AIS/Data Sharing)**.

---

## 2. Channel Contexts

The following deployment contexts shape how Open Finance features are presented and positioned:

### Retail Banking App
Bank's own mobile or web application offering Open Finance features directly to customers. Examples: account aggregation across other banks, easy payments to other bank customers, viewing linked accounts in one dashboard.
- **Primary users**: Bank account holders
- **Value focus**: Convenience, control, aggregation
- **Integration type**: Bank-to-customer direct

### E-Commerce / Merchant
Online retailers, marketplaces, and shopping platforms using Open Finance for seamless checkout. Examples: "Pay by Bank" button at checkout, faster transaction completion, reduced cart abandonment.
- **Primary users**: Shoppers, online retailers
- **Value focus**: Speed, security, conversion
- **Integration type**: Merchant → Aggregator → Bank

### Fintech App
Standalone fintech applications offering specialized services powered by Open Finance. Examples: budgeting apps, investment platforms, remittance services, salary advance platforms.
- **Primary users**: Digital-first customers, niche segments
- **Value focus**: Innovation, convenience, feature parity
- **Integration type**: Aggregator-native services

### Telecom / Utility
Telecom companies (du, Etisalat) and utility providers (DEWA, DAMAN) using Open Finance for recurring bill payments and top-ups.
- **Primary users**: Subscribers, bill payers
- **Value focus**: One-click payments, auto-refill, bill consolidation
- **Integration type**: Biller → Aggregator → Bank

### Government / Public Sector
Government portals using Open Finance for fee payments, fines, licensing, visa applications, and public services.
- **Primary users**: Citizens, residents, businesses
- **Value focus**: Accessibility, transparency, speed
- **Integration type**: eGovernment → Aggregator → Bank

### Insurance
Insurance companies using Open Finance for premium payments, claims settlement, and policy data access.
- **Primary users**: Policyholders, brokers
- **Value focus**: Automatic payments, claims speed, affordability data
- **Integration type**: Insurer → Aggregator → Bank

### Wealth / Investment
Investment platforms, robo-advisors, and trading platforms using Open Finance for funding accounts and viewing linked account data.
- **Primary users**: Investors, traders, retail wealth managers
- **Value focus**: Real-time funding, data-driven investing, portfolio views
- **Integration type**: Broker/Platform → Aggregator → Bank

### Payroll / HR
HR platforms and payroll providers using Open Finance for salary disbursement, expense reimbursement, and employee financial wellness.
- **Primary users**: SMEs, employees, HR departments
- **Value focus**: Real-time salary, flexibility, visibility
- **Integration type**: Employer/Platform → Aggregator → Employee's Bank

### Lending
Lending platforms, credit unions, and BNPL providers using Open Finance for income verification and loan disbursement/repayment.
- **Primary users**: Loan applicants, borrowers
- **Value focus**: Faster approvals, fair pricing, real income data
- **Integration type**: Lender → Aggregator → Applicant's Bank

---

## 3. Value Proposition Entries

---

### 1. E-Commerce Pay by Bank (SIP)

**Journey Type(s)**: Single Immediate Payment (SIP)

**Channel Context**: E-Commerce / Merchant

**Problem Statement**
Online checkout typically requires card entry (friction, security concerns, declined transactions). Customers using debit cards face OTP fatigue; international cards incur fees. Merchants struggle with cart abandonment and payment processing costs.

**Value Proposition**
Open Finance enables "Pay by Bank" at checkout—customers authenticate with their own bank and authorize payment directly from their account. This eliminates card friction, reduces payment failures, and provides merchants with real-time settlement. Customers benefit from their bank's protection, no card data exposure, and a faster checkout experience.

**Key Benefits**
- **For Customer**: 30% faster checkout, one-click approval, no card data exposure, bank-level security
- **For Merchant**: Reduced cart abandonment by 15-25%, lower payment fees, faster settlement (same/next-day)
- **For Bank**: New revenue stream (interchange), increased transaction volume, customer engagement touchpoint
- **For Ecosystem**: Reduced card dependency, improved financial inclusion

**Sample Scenario**
A customer shopping on **Noon.com** during the Dubai Shopping Festival sees "Pay by Bank" option at checkout. They select it, are redirected to their ADCB app, authorize the AED 599 purchase, and the payment completes in 10 seconds. Noon receives confirmation immediately; ADCB earns interchange; the customer avoids card fees and feels secure.

**Presentation Headline**
"Checkout in Seconds, Protected by Your Bank"

**KPIs**
- Checkout completion time (baseline vs. Open Finance)
- Payment success rate (% authorized payments that don't fail)
- Cart abandonment rate reduction
- Customer adoption rate (% of transactions via Open Finance)

---

### 2. Bill Payment Consolidation (SIP)

**Journey Type(s)**: Single Immediate Payment (SIP)

**Channel Context**: Fintech App / Aggregator Portal

**Problem Statement**
UAE residents juggle multiple utility and telecom bills (DEWA, Salik, du, Etisalat, water). Each biller has a separate payment portal or app, requiring multiple logins, card entries, and reminders. Customers often miss due dates or overpay due to manual processing.

**Value Proposition**
A dedicated bill aggregator app (powered by Open Finance) lets customers view all bills in one dashboard, set up auto-payments, and manually pay any bill with a single click. Open Finance handles the payment instruction to the customer's bank, eliminating redundant data entry and reducing late payments.

**Key Benefits**
- **For Customer**: One dashboard for all bills, automatic payment scheduling, no missed due dates, AED 200+ annual savings on late fees
- **For Aggregator**: Recurring transaction volume, subscription fees, customer lifetime value
- **For Billers**: Improved payment collection rates (95%+ vs. 75%), reduced admin overhead
- **For Banks**: Cross-selling opportunities, customer engagement

**Sample Scenario**
A Dubai family subscribes to a bill consolidation app. They link their FAB current account once. The app pulls DEWA (AED 450), Salik (AED 120), du (AED 180), and water (AED 50) bills. They authorize a recurring monthly payment of AED 800 via Open Finance. Every month, the payment executes automatically without further action.

**Presentation Headline**
"All Your Bills, One App, Automatic Payments"

**KPIs**
- User retention (monthly active users)
- Payment success rate
- Average bills consolidated per user
- Reduction in late payments for linked billers

---

### 3. Rent Payment (SIP/FDP)

**Journey Type(s)**: Single Immediate Payment (SIP) or Fixed Duration Payments (FDP for short-term leases)

**Channel Context**: Real Estate / Property Management Platform

**Problem Statement**
Rent collection is fragmented—landlords use bank transfers, cash, or checks; tenants make manual payments via multiple channels. Property managers spend hours chasing payments and reconciling accounts. Rent is often paid late, causing friction in landlord-tenant relationships.

**Value Proposition**
A property management platform (e.g., Bayut, Dubizzle integration, or direct PM software) allows tenants to authorize recurring or scheduled rent payments via Open Finance. Landlords receive instant settlement and full payment visibility. Property managers get automated collection, reducing admin burden by 80%.

**Key Benefits**
- **For Tenant**: Transparent payment history, one-click monthly payments, rent receipt generation, no landlord chasing
- **For Landlord**: Guaranteed on-time payments, instant settlement, rental history for refinancing, reduced disputes
- **For Property Manager**: Automated collection, zero reconciliation, compliance reporting
- **For Banks**: Recurring transaction volume, customer data insights

**Sample Scenario**
A tenant in a Dubai Marina apartment uses a property management app. During lease signup, they authorize Open Finance payments of AED 8,500 (rent) + AED 500 (service charge) every 1st of the month to their landlord's account. Every month, the payment auto-executes from their Emirates NBD account. The property manager sees real-time payment status; the landlord receives settlement within 1 hour.

**Presentation Headline**
"Rent Sorted. Every Month. Automatically."

**KPIs**
- Payment on-time rate (% of rent paid by due date)
- Average collection cycle time (days)
- Property manager time savings (hours/month)
- Tenant satisfaction score

---

### 4. Subscription Management (VRP)

**Journey Type(s)**: Variable Recurring Payments (VRP)

**Channel Context**: Fintech App / Lifestyle Platform

**Problem Statement**
Customers subscribe to multiple recurring services (Careem Plus, gym memberships, streaming apps, meal plans) via credit/debit cards. Charges vary monthly (Careem Plus: AED 29.99; gym: AED 150; streaming: AED 50). Customers forget subscriptions are active, accumulating unwanted charges. Card data is stored across multiple merchants, creating security risk.

**Value Proposition**
Open Finance enables a "subscription hub" app where customers see all subscriptions in one place, authorize payments up-front with variable amounts, and can pause/cancel with one click. VRP allows merchants to charge variable amounts (gym package upgrades, usage-based streaming costs) without storing card data. Customers regain control; merchants reduce churn through transparency.

**Key Benefits**
- **For Customer**: Single view of all subscriptions, easy pause/cancel, no forgotten charges, no card data spread across merchants
- **For Merchant**: Reduced churn (VRP flexibility), lower payment failures, no PCI compliance burden
- **For Subscription Hub App**: High engagement, subscription data monetization opportunities (insights for merchants)
- **For Banks**: Recurring transaction stability, customer engagement data

**Sample Scenario**
A Dubai professional uses a subscription management app. They link their ADIB account and authenticate with Open Finance. The app shows their active subscriptions: Careem Plus (AED 29.99/month), Fitness First (AED 150/month), Netflix (AED 55/month), and HelloFresh (AED 280/month). They authorize Careem Plus to be charged variably between AED 29.99–AED 49.99 depending on bundle. Each month, all charges execute via Open Finance. If they pause Fitness First, the authorization is suspended instantly.

**Presentation Headline**
"Every Subscription in Your Control"

**KPIs**
- Subscription visibility rate (% of customer subscriptions captured in app)
- Churn reduction vs. card-based subscriptions
- Payment success rate for variable charges
- Customer satisfaction with cancellation process

---

### 5. BNPL / Installment Plans (FD-MULTI)

**Journey Type(s)**: Fixed Duration Multi-Payment (FD-MULTI)

**Channel Context**: E-Commerce / Fintech / Lending Platform

**Problem Statement**
High-value purchases (AED 2,000+ electronics, furniture, appliances) deter price-sensitive customers. Credit cards are expensive (25–30% APR); traditional installment loans require lengthy approval. BNPL companies (currently credit-dependent) lack access to bank account data for affordability assessment.

**Value Proposition**
Open Finance enables true BNPL: a customer makes a purchase, authorizes a series of 3–12 fixed installments via Open Finance (e.g., 4 × AED 500 on 1st of each month), and the platform uses transaction data to assess affordability in real-time. The merchant receives full payment upfront; installments execute automatically. No credit card needed; real-income-based approval.

**Key Benefits**
- **For Customer**: Spread large purchases, lower APR (~0–2%), instant affordability check, flexible duration
- **For Merchant**: Full payment upfront, higher conversion on big-ticket items, lower default risk
- **For BNPL Platform**: Reduced credit losses (transaction-data-based underwriting), higher volume, lower CAC
- **For Banks**: Installment transaction fees, customer data, cross-sell opportunities

**Sample Scenario**
A customer browses **Sharaf DG** for a AED 2,000 laptop. At checkout, they select "Split into 4 payments." A BNPL fintech (powered by transaction data from Open Finance) approves them for 4 × AED 500. The customer authorizes via their FAB account; Sharaf receives AED 2,000 immediately; FAB executes 4 installments on the 1st of each month. If the customer's account goes low, FAB sends a gentle reminder; no failed payment scenario.

**Presentation Headline**
"Big Purchases, Small Payments, No Interest"

**KPIs**
- Conversion lift on big-ticket items (% increase in orders)
- Approval rate (% of applicants approved)
- Default rate (% of installments not executed)
- Average order value for BNPL vs. card

---

### 6. Salary Advance (SIP + DATA)

**Journey Type(s)**: Single Immediate Payment (SIP) + Data Sharing (AIS)

**Channel Context**: Fintech App / HR Platform

**Problem Statement**
Employees face unexpected expenses between paydays and default to payday loans (100–300% APR) or credit cards. Employers lack real-time visibility into payroll obligations and employee financial stress. Traditional salary advances require HR approval and manual processing.

**Value Proposition**
A fintech app (e.g., Mashreq's Salary Days) uses Open Finance to securely access salary history and verify income in real-time. Employees can request an advance (e.g., AED 500 of their upcoming AED 5,000 salary) and receive it instantly via SIP. The app uses salary data to set safe advance limits; the employer sees aggregate data to improve financial wellness programs. Employees avoid predatory lending.

**Key Benefits**
- **For Employee**: Instant access to earned wages, 0–2% APR vs. 200%+ payday loans, financial peace of mind
- **For Employer**: Improved employee satisfaction, reduced financial stress, compliance with labor law, salary data insights
- **For Fintech**: Recurring user base, low default risk (backed by salary), high retention
- **For Banks**: Wage transaction visibility, cross-selling opportunities

**Sample Scenario**
A warehouse worker in Jebel Ali earns AED 3,500/month and faces an unexpected car repair (AED 800). On the 20th of the month, they open their employer's HR app (or a standalone fintech app) and request a AED 800 advance. The app uses Open Finance to pull their salary history from their ENBD account, verifies they've earned AED 2,500+ YTD, and approves the advance. AED 800 is credited instantly via SIP. On payday (1st of next month), AED 800 is deducted from their salary automatically.

**Presentation Headline**
"Earned Wages, Instant Access"

**KPIs**
- Advance approval rate (% of requests approved)
- Time to funds (median seconds)
- Employee retention lift
- Default rate on advances

---

### 7. Peer-to-Peer Transfers (SIP)

**Journey Type(s)**: Single Immediate Payment (SIP)

**Channel Context**: Fintech App / Social App

**Problem Statement**
Friends splitting bills (restaurant, hotel, concert) rely on cash, Venmo (not available in UAE), or manual bank transfers (requires IBAN, slow). Group expenses (group travel, shared apartment) involve awkward reminders and manual tracking. Young users prefer app-based, frictionless money movement.

**Value Proposition**
Open Finance enables peer-to-peer transfer apps where users link their bank account once, then send/request money to/from friends by name or phone number. Payments are instant (via SIP), real-time, and require no card data or IBAN entry. Bill-splitting becomes frictionless; group expense tracking is built-in.

**Key Benefits**
- **For User**: Send money instantly by name, no IBAN needed, split bills with one click, real-time notifications
- **For Platform**: Recurring active users, in-app engagement, potential for savings/investment features
- **For Banks**: Lower ATM usage, account stickiness, customer behavior data
- **For Ecosystem**: Reduced cash circulation, improved financial inclusion

**Sample Scenario**
Five friends go to dinner at Nusr-Et in Dubai. The bill is AED 850. One friend opens a P2P app (powered by Open Finance), selects the group, and instantly splits the bill. Each friend receives a notification to approve their AED 170 share. Each swipes approve; all four payments execute instantly to the payee's account. No awkward cash exchanges, no follow-up texts asking "did you pay yet?"

**Presentation Headline**
"Split. Send. Settled. Instantly."

**KPIs**
- Monthly active users
- Monthly transaction volume
- Average transaction size
- User retention rate

---

### 8. Government Fee Payment (SIP)

**Journey Type(s)**: Single Immediate Payment (SIP)

**Channel Context**: Government / Public Sector Portal

**Problem Statement**
Citizens pay government fees (traffic fines, visa application fees, business licensing, professional exams) via fragmented channels (RTA portal, GDRFA website, individual government entity portals). Each requires separate login, separate payment form, and often crashes during peak hours. Payment processing is slow (3–5 business days).

**Value Proposition**
A unified government e-services portal (integrating RTA, GDRFA, DED, MOEU, etc.) allows citizens to pay all fees via Open Finance in one place. Payments are instant, receipts are digital, and citizens receive immediate confirmation. Government agencies reduce payment processing overhead and improve financial tracking. Citizens avoid multiple logins and multiple trips.

**Key Benefits**
- **For Citizen**: One login for all fees, instant payment, digital receipt, transparent fee structure
- **For Government Agency**: Real-time payment confirmation, reduced manual processing, audit trail, improved collection rates
- **For Government Fintech**: Citizen engagement, data transparency, cost savings
- **For Banks**: Government transaction volume, customer lifecycle data

**Sample Scenario**
A UAE resident receives a traffic fine (AED 400) from RTA. They log into the official UAE e-services portal with Emirates ID and find the fine in their dashboard. They click "Pay Fine" and are offered Open Finance as a payment option. They authenticate with their FAB account, authorize the AED 400 payment, and receive a digital receipt and SMS confirmation within seconds. The fine is marked as paid in the RTA system instantly.

**Presentation Headline**
"Government Fees. Paid. Instantly. Anywhere."

**KPIs**
- Payment success rate
- Time to payment processing
- Citizen satisfaction score
- Reduction in manual processing hours

---

### 9. Insurance Premium Payment (VRP/FDP)

**Journey Type(s)**: Variable Recurring Payments (VRP) or Fixed Duration Payments (FDP)

**Channel Context**: Insurance Company / Fintech / Aggregator

**Problem Statement**
Insurance customers pay premiums via credit card (charged a 2–4% fee) or bank transfer (requires manual entry every month). Premium amounts vary seasonally or based on policy changes. Customers forget to pay; claims are denied due to lapsed policies. Insurers spend significant resources on payment collection and policy reinstatement.

**Value Proposition**
Open Finance enables insurance companies to set up VRP authorizations for variable premium amounts (auto insurance premium rises during summer; health insurance changes with family size). Customers authorize once; premiums execute monthly. If premium changes, the new amount is authorized automatically (within limits). Customers never lapse; insurers save on collection costs and improve claims payout speed.

**Key Benefits**
- **For Policyholder**: No expired policies, automated payments, transparent premium changes, faster claims (due to active status)
- **For Insurer**: 99%+ collection rate, reduced admin, faster claims processing, customer lifetime value increase
- **For Insurer Fintech Platform**: Recurring revenue, policy data monetization
- **For Banks**: Recurring transaction volume, insurance customer data

**Sample Scenario**
A customer purchases auto insurance from **AXA** (AED 1,200/year). During enrollment, AXA offers "Auto Payments via Bank." The customer authorizes via Open Finance with their ADCB account. Monthly, AED 100 is debited automatically. When the customer adds a second vehicle in July, the monthly premium increases to AED 150. AXA updates the VRP authorization; in August, AED 150 is debited. No customer action needed; no payment failure risk.

**Presentation Headline**
"Insurance Premiums You'll Never Miss"

**KPIs**
- Policy lapse rate reduction
- Premium collection rate (% of policies with auto-payments)
- Average premium collection cycle
- Claims processing speed (days from claim to payout)

---

### 10. Investment Top-Up (VRP/SIP)

**Journey Type(s)**: Variable Recurring Payments (VRP) or Single Immediate Payment (SIP)

**Channel Context**: Wealth / Investment Platform / Brokerage

**Problem Statement**
Retail investors (via robo-advisors, micro-investing apps) struggle with regular contribution discipline. They manually top up investment accounts via bank transfer or card, incurring friction and fees. Investment platforms cannot guarantee monthly contributions, limiting portfolio growth projections. Young investors lose momentum after initial investment.

**Value Proposition**
Investment platforms use Open Finance to enable automated, recurring contributions (VRP for variable amounts; SIP for fixed amounts). Customers authorize once (e.g., "Invest AED 500/month") and the platform ensures disciplined investing. Variable amounts allow flexibility during market downturns or bonus months. Platforms improve customer acquisition and retention; customers build wealth through automation.

**Key Benefits**
- **For Investor**: Disciplined investing, lower average cost, no manual transfers, higher long-term returns
- **For Investment Platform**: Improved customer lifetime value, higher AUM, better retention, regulatory engagement data
- **For Banks**: Investment account linkage, wealth customer data, cross-sell opportunities
- **For Ecosystem**: Improved financial literacy, increased equity market participation

**Sample Scenario**
A Dubai professional (age 28) opens a robo-advisor account with AED 5,000. The app recommends a diversified portfolio. To improve returns through regular investing, the professional authorizes Open Finance for AED 1,000/month. Every 1st of the month, AED 1,000 is automatically pulled from their FAB account and invested in the portfolio. Over 5 years, they accumulate AED 65,000 invested and benefit from compound growth and rupiah-averaging.

**Presentation Headline**
"Automate Your Path to Wealth"

**KPIs**
- Monthly active investors
- Average contribution size
- Contribution completion rate (% of authorized contributions that execute)
- Customer lifetime value (AUM per investor)

---

### 11. International Remittance (INTL)

**Journey Type(s)**: International Payment (INTL-SIP)

**Channel Context**: Fintech / Remittance App

**Problem Statement**
UAE has 8+ million migrants sending remittances home (India, Philippines, Pakistan, Egypt). Traditional remittance fees are 5–8% of the amount. Customers wait 2–5 business days for delivery; exchange rates are opaque. Informal channels (hawala) bypass this but create compliance risks. Families in home countries lack visibility into transfer status.

**Value Proposition**
Open Finance enables frictionless international remittances: a customer in the UAE authorizes an open finance payment from their UAE bank account, which is routed through the aggregator to a receiving bank partner in the destination country. The aggregator uses real-time exchange rates and charges 2–3% fee (vs. 5–8% traditional). Funds arrive same-day; both sender and receiver have full visibility. Families stay connected; money moves faster and cheaper.

**Key Benefits**
- **For Sender (UAE Migrant)**: Transparent fees (2–3%), real-time exchange rates, instant delivery, no middleman
- **For Receiver (Home Country Family)**: Faster receipt (same-day vs. 5 days), visible tracking, no cash pickup hassle
- **For Remittance App**: High transaction volume, recurring users, data monetization (migration patterns)
- **For Banks (Both Sides)**: Transaction fees, inbound/outbound flow data, customer financial behavior

**Sample Scenario**
A Filipino domestic worker in Abu Dhabi sends AED 1,000 home every month. Instead of using traditional Western Union (AED 70 fee), they use a fintech remittance app powered by Open Finance. They authorize the payment from their ENBD account; the app shows: AED 1,000 = PHP 15,200 (at real-time rate), fee = AED 25 (2.5%). They confirm; within seconds, the money is routed to their family's account in the Philippines (via a BDO partner bank). Their mother receives an SMS confirming the deposit.

**Presentation Headline**
"Send Money Home. Fast. Cheap. Real Rate."

**KPIs**
- Average remittance amount
- Transaction completion rate
- Fee savings vs. traditional remittance
- Time to delivery (seconds/minutes)
- Customer base growth

---

### 12. Payroll Disbursement (BULK/BATCH)

**Journey Type(s)**: Bulk / Batch Payments (BULK)

**Channel Context**: Payroll / HR Platform / SME Accounting

**Problem Statement**
SMEs and mid-size companies process payroll manually: HR exports employee bank details into a spreadsheet, banks import into batch payment file, money moves 1–2 days later. Errors occur (wrong employee, wrong amount); employee questions arise; compliance reporting is tedious. Larger corporations use expensive enterprise payroll systems. SMEs are underserved.

**Value Proposition**
Open Finance enables a simple payroll platform: HR enters employee salaries (or syncs from payroll software), selects "Pay Now," and all employees receive salary via Open Finance Bulk Payments. Payments execute same-day; no CSV import/export; no batch file errors. Employees receive money instantly; compliance reporting is automatic. SMEs compete with larger companies on employee satisfaction without enterprise cost.

**Key Benefits**
- **For SME/HR**: One-click payroll, same-day payments, zero file errors, automatic compliance reporting (tax, labor law)
- **For Employee**: Same-day salary (vs. next-day), no account transfer friction, financial confidence
- **For Payroll Platform**: Recurring SME customer base, high engagement, compliance data monetization
- **For Banks**: Payroll flow data, employee relationship insights, cross-sell opportunities

**Sample Scenario**
A UAE-based logistics startup (50 employees) uses a payroll app integrated with Open Finance. On the last day of the month, the HR manager syncs employee rosters from their ERP system. The payroll app calculates salaries, deductions, and net amounts. The HR manager clicks "Approve & Disburse." All 50 salary payments execute instantly from the company's ADIB account to each employee's personal account. Every employee receives a salary deposit SMS within 5 minutes. Compliance reports for Ministry of Labor are auto-generated.

**Presentation Headline**
"Payroll in One Click. Employees Paid Today."

**KPIs**
- Payroll processing time (hours)
- Number of employees per payroll run
- Payment success rate (% of employees paid successfully)
- Employee satisfaction score
- Compliance audit readiness

---

### 13. Charity / Zakat Donations (SIP/VRP)

**Journey Type(s)**: Single Immediate Payment (SIP) or Variable Recurring Payments (VRP)

**Channel Context**: Fintech / Islamic Finance / Charity Platform

**Problem Statement**
UAE has strong Islamic giving culture (Zakat, Sadaqah, Waqf) but donation channels are fragmented: mosques (cash), NGOs (website forms), and informal networks. Donors lack transparency into fund usage; organizations struggle with collection and compliance. Youth prefer digital giving but find current options cumbersome.

**Value Proposition**
Open Finance enables a digital charity platform where donors authorize recurring Zakat/Sadaqah via VRP (e.g., "AED 100/month") or immediate donations via SIP. Donors see real-time fund allocation and impact reports. Charities receive instant funds and compliance-ready records. The platform simplifies Islamic giving, increases donation frequency, and improves transparency.

**Key Benefits**
- **For Donor**: One-click recurring Zakat, transparent impact, tax-deductible records, community recognition
- **For Charity**: Recurring revenue stream, instant settlement, compliance documentation, donor retention
- **For Charity Platform**: High user engagement, donor database, impact monetization, regulatory praise
- **For Banks**: Charitable giving data, social impact positioning, customer satisfaction scores

**Sample Scenario**
A Dubai professional (age 45) earns AED 150,000/year and calculates their annual Zakat (AED 5,000). Instead of collecting cash or writing a check, they use an Islamic charity fintech app. They link their FAB account and authorize 12 monthly Zakat contributions of AED 417 via Open Finance VRP. Each month, AED 417 is auto-deducted and distributed to verified orphanages, food banks, and education programs. The app shows the donor exactly which beneficiaries received their Zakat. At year-end, the app generates a tax-deductible receipt.

**Presentation Headline**
"Your Zakat, Automated. Transparent. Impactful."

**KPIs**
- Monthly active donors
- Recurring donation rate (VRP vs. one-time SIP)
- Total funds disbursed
- Beneficiary satisfaction score
- Donor retention rate

---

### 14. Education Fee Payment (FDP/FD-MULTI)

**Journey Type(s)**: Fixed Duration Multi-Payment (FD-MULTI) or Fixed Duration Payments (FDP)

**Channel Context**: School / University / EdTech Platform

**Problem Statement**
Parents pay school/university tuition via multiple methods (credit card, check, bank transfer). Annual fees (AED 20,000–100,000+) create payment friction; some parents default mid-year, causing student enrollment suspension. Schools manually track payments and send payment reminders. International students struggle with upfront lump-sum payments.

**Value Proposition**
Schools integrate Open Finance to offer semester or monthly installment plans. A parent authorizes 3–12 fixed payments (e.g., AED 8,000 × 12 months for annual AED 96,000 tuition). Payments execute automatically; schools receive real-time settlement. Default risk is near-zero (backed by bank authorization). Parents manage large expenses without upfront lump-sum burden; students never face mid-year suspension.

**Key Benefits**
- **For Parent**: Spread tuition across 12 months, lower upfront cost burden, no late payment risk, transparent schedule
- **For School**: Higher enrollment conversion, zero default risk, real-time cash flow, reduced admin
- **For EdTech Platform**: Recurring student/family cohorts, tuition data insights, expansion opportunities
- **For Banks**: Education expense data, long-term customer lifecycle tracking, cross-sell to families

**Sample Scenario**
A family enrolls their child in a premium Dubai school (American, British, Indian curriculum) with annual tuition of AED 60,000. The school offers two payment options: (1) full payment upfront (AED 60,000), or (2) 12 monthly installments via Open Finance (AED 5,000/month). The parent chooses installments, authorizes via their ENBD account, and Open Finance executes AED 5,000 on the 1st of each month. The school sees real-time payments in their treasury system. By mid-year, the family has paid AED 30,000 without friction.

**Presentation Headline**
"Education Fees Made Affordable. Installment by Installment."

**KPIs**
- Enrollment conversion rate (students opting for installment plans)
- Payment on-time rate
- Student retention (mid-year suspension reduction)
- Average tuition collected per student
- Administrative burden reduction (hours/month)

---

### 15. Healthcare Payment (SIP/FDP)

**Journey Type(s)**: Single Immediate Payment (SIP) or Fixed Duration Payments (FDP)

**Channel Context**: Hospital / Clinic / Health Fintech Platform

**Problem Statement**
Healthcare is expensive in the UAE (even with insurance, out-of-pocket costs can be AED 5,000–20,000+ per procedure). Patients delay treatment due to upfront payment friction. Hospitals spend resources on payment follow-up; uninsured patients default. Medical tourism (India, Turkey) offers alternative prices but requires upfront international transfers.

**Value Proposition**
Hospitals and health platforms integrate Open Finance to offer flexible payment: patients pay consultation/procedure costs instantly via SIP or spread over 3–12 months via FDP. Uninsured patients can use BNPL-style installments. Hospitals receive full settlement upfront, reducing bad debt. Patients access care without financial barriers; health outcomes improve.

**Key Benefits**
- **For Patient**: Affordable healthcare access, instant payment (no waiting for card), installment options for large procedures, transparent pricing
- **For Hospital**: Full upfront payment, zero bad debt, improved patient satisfaction, faster treatment initiation
- **For Health Fintech**: Patient data, recurring engagement, affordability insights, insurance optimization opportunities
- **For Banks**: Healthcare expense data, health-seeking behavior, cross-sell to health insurance

**Sample Scenario**
A patient in Abu Dhabi needs an orthopedic surgery (knee replacement) costing AED 18,000. The hospital's patient portal (integrated with Open Finance) allows the patient to: (1) pay AED 18,000 immediately via SIP, or (2) pay AED 1,500/month for 12 months via FDP. The patient chooses installments, authorizes via their ADIB account, and Open Finance locks in the payment schedule. The hospital receives AED 18,000 immediately via an BNPL partner; the patient's AED 1,500 monthly payments execute automatically. Surgery is scheduled immediately (not delayed for payment).

**Presentation Headline**
"Your Health. Paid Your Way."

**KPIs**
- Treatment initiation time (days from diagnosis to surgery)
- Patient acquisition (% of patients opting for installment plans)
- Bad debt reduction
- Payment success rate
- Patient satisfaction score

---

### 16. Account Aggregation (DATA)

**Journey Type(s)**: Data Sharing (AIS)

**Channel Context**: Fintech App / Aggregator Portal

**Problem Statement**
UAE customers (especially expats) often hold accounts at multiple banks (ADCB, ENBD, FAB, Emirates NBD, ADIB) due to different employer relationships, salary splitting, or investment diversification. They lack a unified view of net worth, liquidity, and spending patterns. Switching banks is difficult; customers never see better offers elsewhere.

**Value Proposition**
Open Finance Data Sharing enables an account aggregation app where customers link all their bank accounts once and see a unified dashboard: total balances, transaction history across all accounts, spending patterns, and tailored offers. No account switching required; customers gain control and visibility. Fintech platforms see cross-bank financial behavior and can recommend services. Banks see aggregate account data to prevent customer migration.

**Key Benefits**
- **For Customer**: One financial dashboard, unified net worth view, cross-bank transaction analysis, better financial decisions
- **For Aggregator App**: High engagement, customer financial data for monetization, switching prevention
- **For Banks**: Account data transparency (to prevent switching), cross-sell insights, financial wellness positioning
- **For Ecosystem**: Reduced account fragmentation, improved financial inclusion

**Sample Scenario**
An expat professional in Dubai holds accounts at ENBD (salary deposit), ADCB (personal savings), and FAB (investment account). Using an account aggregation app powered by Open Finance, they link all three. The app shows: ENBD (AED 15,000 checking), ADCB (AED 125,000 savings), FAB (AED 200,000 investments) = AED 340,000 net worth. They see spending across all accounts merged; investment returns tracked. Each bank also sees the linkage data and starts targeting them with better rates or investment products.

**Presentation Headline**
"All Your Money. One View."

**KPIs**
- Number of accounts aggregated per user
- Monthly active users
- Cross-bank transaction visibility
- Customer engagement time per session
- Monetization per user (ad/data/referral revenue)

---

### 17. Credit Scoring / Affordability (DATA)

**Journey Type(s)**: Data Sharing (AIS)

**Channel Context**: Fintech / Lending Platform

**Problem Statement**
Traditional credit scoring (CBUAE bureaus, Experian) relies on formal debt history. Millions of UAE residents (new immigrants, gig workers, small business owners) lack traditional credit history. Lenders cannot assess true affordability; they deny loans based on incomplete data or rely on cash/gold collateral (inefficient, regressive).

**Value Proposition**
Open Finance Data Sharing enables alternative credit scoring: fintech lenders request (with customer consent) 6–12 months of transaction data from the customer's bank. Using AI/ML models, they assess real income patterns, expense stability, and affordability without traditional credit history. Customers get fair lending decisions based on actual financial behavior; lenders expand addressable market and reduce credit losses.

**Key Benefits**
- **For Borrower**: Fair credit assessment (no historical discrimination), faster approval (no bureau delays), competitive rates
- **For Fintech Lender**: Expanded addressable market (5M+ unbanked), AI-driven underwriting, lower credit losses
- **For Financial Inclusion**: Millions of underbanked residents gain credit access, improved economic opportunity
- **For Ecosystem**: Reduced cash economy, improved financial formality

**Sample Scenario**
A freelance architect in the UAE (3 years self-employed, no traditional credit history) applies for a AED 50,000 personal loan from a fintech lender. The lender requests Open Finance access to 12 months of transaction data from their ENBD account. The data shows: average monthly income AED 8,000, consistent monthly expenses AED 4,000, 98% on-time payment to suppliers and utilities. The lender's AI model assesses affordability and approves AED 50,000 at 4.5% APR (vs. 15%+ via traditional lender). Loan is disbursed within 24 hours.

**Presentation Headline**
"Fair Credit. Built on Your Real Income."

**KPIs**
- Loan approval rate (% of applicants approved)
- Average loan size
- Credit loss rate (% of defaults)
- Speed to disbursement (hours)
- Customer base expansion (underbanked vs. traditional)

---

### 18. Personal Finance Management (DATA)

**Journey Type(s)**: Data Sharing (AIS)

**Channel Context**: Fintech App / Financial Wellness Platform

**Problem Statement**
Most UAE residents (especially younger professionals and expats) lack financial literacy and tools to manage spending, save, and invest. Credit cards encourage overspending; savings rates are low. Personal finance apps exist (Mint, YNAB) but are US-focused and require manual transaction entry. Residents lack visibility into their financial health.

**Value Proposition**
Open Finance enables a personal finance app that auto-imports all transaction data from customers' bank accounts, categorizes spending (rent, food, transport, entertainment), identifies savings leaks, and recommends optimizations. Customers get AI-powered insights without manual entry. Apps provide goal-setting (save AED 50,000 for wedding), budgeting, and investment recommendations. Fintech platforms build customer loyalty and gather financial behavior data.

**Key Benefits**
- **For Customer**: Automated spending visibility, savings goals, personalized recommendations, improved financial health
- **For Fintech**: High engagement, financial behavior data, upsell to savings/investment products, customer lifetime value
- **For Banks**: Savings/investment opportunities visibility, customer wellness positioning, data-driven upsells
- **For Ecosystem**: Improved financial literacy, higher savings rates, better investment participation

**Sample Scenario**
A 28-year-old employee in Dubai uses a personal finance app powered by Open Finance. They link their ADCB current account. The app auto-imports 12 months of transactions and categorizes spending: Rent (AED 3,000/month), Food (AED 1,500/month), Transport (AED 300/month via Uber), Subscriptions (AED 400/month for Gym + Streaming), Entertainment (AED 1,200/month). The app identifies opportunity: "You spend AED 1,200/month on subscriptions and entertainment. If you reduce by 30%, you save AED 360/month (AED 4,320/year)." It recommends goal: "Save AED 50,000 for wedding in 12 months (AED 4,167/month needed). Possible if you cut entertainment and cancel unused gym." The app tracks progress monthly.

**Presentation Headline**
"Your Money, Explained. Your Goals, Achieved."

**KPIs**
- Monthly active users
- Average transaction visibility (# of transactions imported/month)
- Goal completion rate (% of customers who achieve savings goals)
- Savings rate improvement (AED saved/month vs. pre-app)
- Customer engagement (days active/month)

---

### 19. Mortgage Application (DATA)

**Journey Type(s)**: Data Sharing (AIS)

**Channel Context**: Bank / Real Estate Fintech

**Problem Statement**
UAE mortgage applications require extensive manual documentation: salary letters, bank statements (6–12 months), employment contracts, tax returns. Customers visit bank branches multiple times; processing takes 4–6 weeks. Banks manually verify income and spend significant resources on documentation review. Many applicants are rejected due to incomplete/unverifiable income documentation (self-employed, commission-based, gig workers).

**Value Proposition**
Open Finance enables instant mortgage application: customers authorize one-time sharing of 12 months of transaction data from their primary bank account. Banks' AI systems instantly verify income, assess debt-to-income ratio, and pre-approve mortgage amounts. Processing time drops from 4–6 weeks to 3–5 days. Self-employed and commission-based earners can prove income via transaction patterns. Customers never visit branch for documentation; everything is digital.

**Key Benefits**
- **For Borrower**: Instant pre-approval, no branch visits, same-day documentation, expanded approval eligibility (self-employed)
- **For Bank/Lender**: 90% reduction in processing time, reduced fraud risk, expanded lending market, improved customer satisfaction
- **For Real Estate Market**: Faster closings, increased transaction velocity, higher buyer confidence
- **For Financial Inclusion**: Self-employed and gig workers gain mortgage access

**Sample Scenario**
A 35-year-old Dubai real estate agent (self-employed, highly variable income) wants to buy a AED 1.5M apartment. Traditionally, banks require 2 years of tax returns and business statements (difficult for self-employed). Instead, they apply for a mortgage via a digital bank. They authorize Open Finance sharing of 24 months of transaction data from their ENBD account. The bank's AI analysis shows: average monthly income AED 25,000, predictable monthly expenses AED 12,000, strong payment history (99% on-time to DEWA, Salik, etc.). Within 48 hours, the bank pre-approves a AED 1.2M mortgage. The applicant is amazed—no branch visits, no paperwork, instant decision.

**Presentation Headline**
"Mortgage Pre-Approved. Before You Find the Home."

**KPIs**
- Application-to-approval time (days)
- Approval rate
- Self-employed applicant approval rate
- Time savings vs. traditional application
- Customer satisfaction score

---

### 20. Business Accounting Integration (DATA)

**Journey Type(s)**: Data Sharing (AIS)

**Channel Context**: B2B SaaS / Accounting Software

**Problem Statement**
SME business owners and accountants manually import bank statements into accounting software (Xero, QuickBooks, SAP Concur). This is time-consuming (2–5 hours/week), error-prone (transaction miscategorization), and delays financial reporting. Real-time accounting visibility is nearly impossible. Accountants spend 30% of time on data entry instead of value-add advisory.

**Value Proposition**
Accounting software (Xero, QuickBooks) integrates Open Finance to auto-sync bank transactions daily. All business bank accounts (primary, payroll, expense) sync automatically without manual export/import. Transactions are auto-categorized by AI. Real-time P&L and cash flow dashboards are available anytime. Accountants focus on advisory; business owners have real-time financial visibility. SME financial operations become efficient and data-driven.

**Key Benefits**
- **For Business Owner**: Real-time financials, instant cash flow visibility, reduced accounting fees, better decision-making
- **For Accountant**: 30% time savings on data entry, more time for advisory, better client relationships, scalability
- **For Accounting SaaS**: Sticky product differentiation, higher customer retention, competitive advantage
- **For Banks**: Real-time B2B transaction data, SME financial health insights, credit risk assessment

**Sample Scenario**
An SME in Dubai (food import business) with 15 employees uses Xero for accounting. They link their primary business account (ADIB) to Xero via Open Finance. Every morning, Xero automatically syncs overnight transactions: supplier payments, customer invoices, employee reimbursements. The owner logs into Xero and sees: Cash balance (AED 750,000), Monthly revenue (AED 1.2M), Monthly expenses (AED 950,000), Gross margin (21%). No manual statement import. The accountant spends 4 hours/month (vs. 20 hours/month manually) and uses freed time to advise on cost optimization, tax planning, and growth strategy.

**Presentation Headline**
"Accounting That Works for You. Not the Other Way Around."

**KPIs**
- SME active users
- Transaction sync frequency (daily, real-time)
- Accountant time savings (hours/month)
- Financial reporting accuracy improvement
- Customer retention rate

---

### 21. Loan Application (DATA + SIP)

**Journey Type(s)**: Data Sharing (AIS) + Single Immediate Payment (SIP)

**Channel Context**: Lending Platform / Fintech / Bank

**Problem Statement**
Personal loan applicants face long approval cycles (1–2 weeks) and limited loan amounts due to traditional income verification. Lenders rely on salary letters (easily forged) and credit bureaus (incomplete data). Customers with good transaction history but weak credit bureau scores are rejected. Loan disbursement requires another trip to the bank or manual transfer authorization.

**Value Proposition**
Open Finance enables end-to-end digital lending: applicants authorize Data Sharing (transaction history for affordability check) and SIP (loan disbursement). Lenders assess real income/expense patterns from 6–12 months of bank data. Approval happens within hours. Once approved, loan is disbursed immediately via Open Finance SIP (not another visit or manual transfer). Customers get fast access to capital; lenders reduce fraud and credit losses.

**Key Benefits**
- **For Borrower**: Instant approval (hours, not weeks), fair assessment (transaction-based), instant disbursement, lower rates
- **For Lender**: Reduced credit losses (real income data), faster disbursement, higher volume, AI-driven underwriting
- **For Financial Inclusion**: Faster credit access, expanded credit availability to underbanked
- **For Banks**: Lending transaction data, customer relationship deepening

**Sample Scenario**
A small business owner needs AED 100,000 working capital for inventory. They apply via a fintech lender's app. The app requests two permissions: (1) access to 12 months of transaction data (affordability check), (2) ability to disburse funds via their ENBD account (SIP). Within 2 hours, the lender's AI assesses the data: average monthly revenue AED 80,000, monthly expenses AED 55,000, existing debt servicing is on-time. The system approves AED 100,000 at 3.5% interest. The approval notification is sent; the applicant clicks "Accept Terms"; the full AED 100,000 is transferred to their ENBD account via Open Finance SIP within seconds. No branch visit, no waiting, no paperwork.

**Presentation Headline**
"Loans Approved and Funded in Hours"

**KPIs**
- Application-to-disbursement time (hours)
- Approval rate
- Credit loss rate (% of defaults)
- Average loan size
- Customer satisfaction score

---

### 22. Switching Service (DATA)

**Journey Type(s)**: Data Sharing (AIS)

**Channel Context**: Bank / Fintech / Switching Service

**Problem Statement**
UAE customers are "sticky" to their original bank due to switching friction: must visit branch, manually update all recurring bills and salary redirects, and worry about delays. Banks know this and don't compete on rates. Customers miss better offers (higher savings rates, lower loan rates) at competing banks. Market concentration limits competition and consumer choice.

**Value Proposition**
Open Finance enables a switching service: customers authorize sharing of their account data (recurring payments, salary deposits) from their old bank. A switching platform automatically identifies all recurring commitments and guides the customer to set up equivalent payments at the new bank. Data is used to pre-populate new bank applications. Switching is seamless; customers gain better rates and choice. Banks must compete; market becomes more competitive.

**Key Benefits**
- **For Customer**: Easy switching, better rates elsewhere, no manual updates, complete switching plan
- **For New Bank**: Higher customer acquisition, competitive differentiation, lower onboarding friction
- **For Switching Platform**: High-value service, customer acquisition, data insights
- **For Market**: Increased competition, better consumer rates, improved market efficiency

**Sample Scenario**
A customer at ENBD notices **Abu Dhabi Commercial Bank (ADCB)** offers 3.5% on savings (vs. ENBD's 2.5%). They're tempted but switching seems hard: salary redirect, bills (DEWA, du, Etisalat, gym membership) are on auto-pay, and they worry about delays. They use an Open Finance switching service. They link their ENBD account; the platform identifies: salary deposit (AED 8,500, 1st of month), DEWA bill (AED 450, 2nd), du bill (AED 150, 3rd), gym (AED 150, 10th). The platform shows a switching plan: "3-day process. Your salary will redirect to ADCB on 1st March. Your bills will auto-pay from ADCB starting 2nd March." They approve; the platform automates the redirects (via Open Finance), and by 2nd March, they're fully switched to ADCB. They gain AED 100+/year in extra interest with zero hassle.

**Presentation Headline**
"Switch Banks in One Click. Keep Everything Else the Same."

**KPIs**
- Switching completion rate (% of initiated switches that complete)
- Time to full switch (days)
- Customer acquisition cost for new bank
- Recurring payment transition success rate
- Customer satisfaction score

---

### 23. Embedded Finance for SMEs (COMBINED)

**Journey Type(s)**: Single Immediate Payment (SIP) + Variable Recurring Payments (VRP)

**Channel Context**: B2B SaaS / SME Platform

**Problem Statement**
SMEs struggle with vendor payment management: invoices arrive via email, manual PO matching, payment is via bank transfer or check. Cash flow forecasting is difficult; vendor relationships suffer due to late payments. B2B SaaS platforms (invoicing, expense management, procurement) lack integrated payment solutions; customers must leave the platform to pay vendors.

**Value Proposition**
B2B SaaS embeds Open Finance to enable one-click vendor payments: when an invoice is approved in the platform, the user clicks "Pay Now" (SIP) and funds are sent to the vendor's bank immediately. Recurring vendor payments (retainers, subscriptions) can be set up as VRP. The platform has real-time visibility into cash flow and payment status. Vendors prefer (faster payment = better terms). SME cash flow management becomes seamless and data-driven.

**Key Benefits**
- **For SME User**: One-click payment from invoice (no leaving platform), improved vendor relationships (faster payment), better cash flow visibility
- **For SME Vendor**: Faster payment (improved cash flow), reduced payment chasing, better pricing due to reliability
- **For SaaS Platform**: Sticky product, payment fee revenue, embedded fintech differentiation, customer data
- **For Banks**: B2B transaction volume, SME cash flow data, supply chain insights

**Sample Scenario**
A Dubai marketing agency (20 staff) uses a SaaS platform for invoicing and expense management. They receive an invoice from a designer vendor (AED 5,000 for a branding project). The agency's operations manager logs into the SaaS platform, approves the invoice, and clicks "Pay Now via Bank." The system shows the vendor's bank account (verified). The manager authorizes (via Open Finance) a AED 5,000 SIP payment from their ADIB account. The vendor receives the payment within seconds. The SaaS platform logs the transaction in the agency's accounting module automatically. The designer vendor, impressed by instant payment, offers 5% volume discount next quarter.

**Presentation Headline**
"Vendor Payments in Your Workflow. No Context Switching."

**KPIs**
- Payment transaction volume (# payments/month)
- Average payment size
- Vendor satisfaction score
- Invoice-to-payment time (hours reduction)
- Platform engagement increase (% of users using embedded payments)

---

### 24. Telecom Top-Up + Auto-Refill (COMBINED)

**Journey Type(s)**: Single Immediate Payment (SIP) + Variable Recurring Payments (VRP)

**Channel Context**: Telecom Provider (du, Etisalat) / Fintech

**Problem Statement**
Prepaid telecom users (millions in UAE) manually purchase top-ups via ATM, retail shops, or telecom store. When balance runs low, service is suspended; customers are frustrated. Postpaid users set up bill payment but don't enjoy flexibility. Telecom providers lose revenue during service suspension periods and face churn.

**Value Proposition**
Telecom providers offer open finance-enabled top-up: customers can purchase top-ups instantly via SIP (one-click in-app) or set up auto-refill via VRP (automatic top-up when balance falls below threshold). Customers never run out of balance; telecom providers see improved customer satisfaction and revenue stability. Auto-refill is a recurring revenue stream and a stickiness mechanism.

**Key Benefits**
- **For Customer**: Never run out of balance, one-click top-up (no ATM visit), flexible auto-refill, better service experience
- **For Telecom**: Reduced service suspension incidents, improved NPS, recurring revenue from auto-refill, customer stickiness
- **For Banks**: Telecom customer transaction data, mobile behavior insights, churn prevention opportunities
- **For Ecosystem**: Better mobile service availability, reduced customer frustration

**Sample Scenario**
A du prepaid customer (typically uses AED 30–50/month) downloads the du app. They link their ENBD account via Open Finance. They set up auto-refill: "When balance falls below AED 10, automatically top up with AED 50." One evening, while abroad, their balance hits AED 8. Du's system detects this, sends a notification: "Auto-Refill Activated. AED 50 added to your account," and executes a SIP payment from their ENBD account. The customer's service continues without interruption. At month-end, they have 3 auto-refill charges (AED 150 total) and one manual top-up (AED 30) = AED 180 total spend vs. usual AED 50/month. du generates 3.6x ARPU; the customer loves not worrying about balance.

**Presentation Headline**
"Always Connected. Always Topped Up."

**KPIs**
- Auto-refill adoption rate (% of prepaid customers)
- Service suspension incidents (reduction)
- Average revenue per user (ARPU) lift
- Customer satisfaction (NPS) improvement
- Churn reduction

---

## 4. Usage Guidelines for Rapid Prototyping

Each entry above is designed to be **self-contained and modular**. To generate a presentation or prototype quickly:

### For Presentation Generation
1. **Select an entry** (e.g., "E-Commerce Pay by Bank")
2. **Copy the "Presentation Headline"** as the slide title
3. **Use "Problem Statement" and "Value Proposition"** for the narrative
4. **Build a diagram** using "Journey Type(s)" and "Channel Context"
5. **Create customer benefits** from the "Key Benefits" section
6. **Add the "Sample Scenario"** as a case study slide
7. **Include KPIs** for a metrics/success slide

### For Prototype / User Flow Design
1. **Select an entry** and note its "Journey Type(s)"
2. **Map the flow**: user → initiate (app button) → authenticate (bank app) → authorize (payment/data) → confirm → complete
3. **Use "Sample Scenario"** to create realistic user personas and journeys
4. **Build wireframes** for each step: initiation screen → bank redirect → confirmation → receipt
5. **Define CTA buttons**, error states, and success messages from the narrative

### For Stakeholder Communication
1. **Use the "Channel Context"** to explain deployment environment
2. **Lead with the "Presentation Headline"** for immediate clarity
3. **Provide "Sample Scenario"** for concrete, relatable examples
4. **Reference "Key Benefits"** for each stakeholder (customer, business, bank, ecosystem)
5. **Close with "KPIs"** to align on success metrics

---

## 5. Journey Type Reference

For quick lookup, the Open Finance journey types referenced in this catalog:

| Journey ID | Full Name | Use Case Type | Characteristics |
|---|---|---|---|
| **SIP** | Single Immediate Payment | Payment | One-off, instant payment; customer initiates |
| **FDP** | Fixed Duration Payments | Payment | Fixed amount, fixed duration (e.g., 3 months); auto-executes |
| **FD-MULTI** | Fixed Duration Multi-Payment | Payment | Variable number of fixed installments; scheduled |
| **VRP** | Variable Recurring Payments | Payment | Recurring, variable amount; customer sets limit; auto-executes |
| **BULK** | Bulk / Batch Payments | Payment (B2B) | Multiple payments in one transaction; employer/SME payroll |
| **INTL** | International Payment | Payment | Cross-border payment; multiple currency conversion |
| **DATA** | Data Sharing / AIS | Information | Account Information Service; 6–12 months transaction history |
| **COMBINED** | Multi-Journey | Payment + Information | Combines multiple journey types (e.g., DATA + SIP) |

---

## 6. Revision & Extension Notes

This catalog should be updated as:
- New use cases emerge in the UAE Open Finance market
- Al Tareq platform capabilities expand
- Customer demand shifts (seasonal, regulatory, competitive)
- New channel contexts become relevant (e.g., Gaming, Real Estate MarTech)

**Last Updated**: 2026-02-17
**Version**: 1.0
**Maintained By**: Open Finance Product & Marketing Team

---

## 7. Contact & Resources

For questions about specific value propositions or to propose new use cases:
- Slack: #open-finance-ux
- Email: open-finance@altareq.ae
- Internal Wiki: [Confluence Link]
- CBUAE Regulations: [Regulatory Reference]

---

*This document is proprietary to Al Tareq and confidential. Distribution is restricted to authorized team members only.*
