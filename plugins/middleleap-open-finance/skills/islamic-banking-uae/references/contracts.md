# Islamic Contract Structures — and their data semantics

Each contract below notes: structure → typical UAE retail/SME use → cash-flow semantics → Open Finance representation. OF field names refer to Standards v2.1 (see `open-finance-intersection.md` for the verified field inventory).

## Sale-based financing

### Murabaha (cost-plus sale)
Bank buys the asset, then sells it to the customer at cost + disclosed markup, payable in instalments. The customer's obligation is a **sale receivable** — fixed at contract signing; it does not accrue like interest.
- UAE use: auto finance, personal finance, goods finance, covered cards (ADCB Islamic window uses Murabaha for these).
- Cash flows: fixed instalments of a known total sale price. Early settlement rebates are discretionary (ISSC-governed), not contractual.
- OF: `ShariaStructure: Murabaha`; price expressed via profit-rate structures (`AEProductProfitCalculationMethodProperties`); balances categorise as Principal/Profit (`AEBalanceCategory`); transactions as Repayments/Profit.

### Tawarruq (commodity Murabaha / monetisation)
Bank sells a commodity to the customer on deferred Murabaha terms; customer immediately sells it for spot cash. Delivers **cash liquidity** through trade contracts. Widely used for personal finance and Islamic credit-card structures; scholars treat it as a necessity tool, not an ideal (AAOIFI restricts organised Tawarruq).
- OF: `ShariaStructure: Tawarruq`; data semantics as Murabaha.

### Salam / Istisna (forward sale / manufacture)
Payment now (Salam) or in stages (Istisna) for future delivery of specified goods or construction. Istisna funds construction/manufacture; the bank is repaid on completion/sale. Contracts must be highly specified to avoid gharar.
- UAE use: project, construction, and (Istisna + forward Ijara) under-construction home finance.
- OF: **no enum value in v2.1** — represent via `IsShariaCompliant: true` + `ShariaInformation` free text; flag as a standards gap (see intersection doc).

## Lease-based financing

### Ijara (lease) and Service Ijara
Bank buys the asset and leases it to the customer for agreed rentals. **Ijara Muntahia Bittamleek** (lease ending in ownership) transfers title at the end via gift, token purchase, or separate sale. Service Ijara leases services/usufruct (e.g. education, medical packages).
- UAE use: home finance is predominantly Ijara at UAE windows including ADCB Islamic.
- Cash flows: **rentals**, not amortising principal+interest; variable-rental Ijara re-prices rent against a benchmark; ownership costs (major maintenance, takaful on asset) sit with the lessor in principle.
- OF: `ShariaStructure: Ijara` / `ServiceIjara`; balance category `Rental`; transaction type `LeaseRepayment`; end-of-term title transfer modelled natively via `OwnershipTransfer` (`Type: Gift | TokenPurchase | SeparateSaleContract`, `Method: EndOfLease | Buyouts`, `TransferOfOwnershipDate`).

## Partnership-based

### Musharaka (joint venture) and Diminishing Musharaka
Both parties contribute capital; profits shared per agreement, losses per capital share. **Diminishing Musharaka** is the home-finance variant: bank and customer co-own the property; the customer buys out the bank's share in scheduled increments while paying rent on the bank's remaining share.
- OF: `ShariaStructure: Musharaka`; Diminishing Musharaka is modelled natively — security `Type: OwnershipTransfer` with `Type: Gradual` and a required `BuyoutSchedule` (Frequency + BuyoutAmount).

### Mudarabah (investment agency partnership)
One party provides capital (rab al-mal), the other expertise (mudarib); profit shared per agreed ratio, financial loss borne by the capital provider. This is the **deposit-side workhorse**: savings/investment accounts are typically Mudarabah pools — customer is capital provider, bank is mudarib.
- Cash flows: **expected/indicative profit rates**, actual distribution from pool performance, smoothed via profit equalisation and investment risk reserves (CBUAE/HSA-governed). Never a guaranteed rate.
- OF: **no `ShariaStructure` enum value** (the enum covers financing structures). Deposit products carry `IsShariaCompliant: true` with profit semantics in `DepositRates` / profit-calculation properties; "periodic Hibah distribution" (gift-based reward on Qard-structured current accounts) is explicitly contemplated in charge/reward `Frequency` descriptions.

### Wakala (agency)
Bank invests customer funds as agent for a fee, with an anticipated profit rate; increasingly used for corporate deposits and treasury placements, and inside Takaful operations. No dedicated OF enum value — same handling as Mudarabah.

## Other instruments

### Qard Hasan (benevolent loan)
Interest-free loan; the only permissible loan-of-money form. Underpins Islamic **current accounts** (customer lends the bank the balance; bank guarantees repayment; no return, though discretionary Hibah gifts are possible).

### Sukuk (investment certificates)
Asset-backed certificates conveying proportional ownership in assets/usufruct/ventures; returns are profit or rent, not coupons. Relevant to Open Finance mainly as holdings visible in investment-data scopes and as halal-portfolio building blocks for TPP use cases; issuance mechanics are out of banking-data scope.

### Takaful (mutual insurance)
Participants contribute to a mutual pool (tabarru); an operator manages it under Wakala/Mudarabah hybrid. The compliant alternative to conventional insurance.
- OF: the Insurance Data Sharing standard carries a native `Takaful` boolean ("Indicates whether the policy is Sharia compliant"); Takaful policies also appear as an `AssetType` for financing security (`TakafulPolicy`), alongside `Rahn` (Islamic pledge).

## Quick contract → OF mapping table

| Contract | `ShariaStructure` value | Key data semantics |
|---|---|---|
| Murabaha | `Murabaha` | Sale receivable; Principal/Profit balances; fixed instalments |
| Tawarruq | `Tawarruq` | As Murabaha; cash-liquidity products |
| Ijara / Service Ijara | `Ijara` / `ServiceIjara` | Rental balances; `LeaseRepayment` txns; `OwnershipTransfer` at term |
| Musharaka / Diminishing | `Musharaka` | `OwnershipTransfer Type: Gradual` + `BuyoutSchedule` |
| Mudarabah / Wakala (deposits) | — (gap) | `IsShariaCompliant` + profit-rate/DepositRates semantics; no guaranteed return |
| Istisna / Salam | — (gap) | `IsShariaCompliant` + `ShariaInformation` free text |
| Qard Hasan (current a/c) | — | `IsShariaCompliant`; Hibah rewards via charge/reward metadata |
| Takaful | n/a (insurance std) | `Takaful: true` on policy; `TakafulPolicy` as security AssetType |
