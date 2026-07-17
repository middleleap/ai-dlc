# Islamic Banking × UAE Open Finance

The composition doc. Read alongside the **open-finance-uae** skill (architecture, consent, security, certification live there).

## Regulatory position: one framework, no Islamic track

The Open Finance Regulation's LFI definition expressly includes institutions carrying on all or part of their business per Islamic Shari'ah. Islamic banks and windows are **mandatory participants** in Al Tareq like everyone else — same API Hub mediation, same consent model, same certification. There is no separate Islamic rail; the Shariah dimension lives in (a) the data fields, (b) the governance obligations that follow the product into TPP journeys, and (c) TPP-side Shariah governance for Islamic institutions acting as TPPs.

## Native Islamic fields in Standards v2.1 — verified inventory

Verified 13 July 2026 directly against errata-resolved OpenAPI files in `Nebras-Open-Finance/api-specs` (`dist/standards/`). Re-verify with open-finance-uae `fetch_spec.py` before quoting — enum values can change with versions/errata.

### Bank Data Sharing (uae-account-information, v2.1-errata2)

| Field / schema | Content |
|---|---|
| `AEProduct.ShariaStructure` | enum: `Ijara`, `ServiceIjara`, `Murabaha`, `Musharaka`, `Tawarruq` — "Islamic finance contract or structure type applied to a product when confirmed as Sharia-compliant" |
| `IsShariaCompliant` (`AEShariaFlag`) | boolean, **default `false`** — on account/product objects |
| `AEBalanceCategory` | includes `Profit` and `Rental` alongside Principal/Interest/FeesAndCharges/PastDue |
| Transaction / credit-line types | include `Profit` and `LeaseRepayment` |
| `AEProductProfitCalculationMethodProperties` | `ProfitCalculationMethod` — profit twin of the interest-calculation schema; descriptions note "including Islamic calculation methods" and "Islamic profit distribution" frequency |
| Charges: `DonatedToCharity` | boolean — "charge will be donated to charity when the product is Sharia compliant" (late-payment purification, natively modelled) |
| Charges/rewards `Frequency` | free text explicitly contemplating "periodic **Hibah** distribution" |
| `SupplementaryInformation` | "such as Sharia compliance notes or reward history" |
| Security `Type` | `Collateral` \| `OwnershipTransfer` — the latter "when the asset is owned by the bank and will be transferred to the customer under Islamic finance structures" |
| `OwnershipTransfer` object | `TransferOfOwnershipDate`; `Type`: `Gift` \| `TokenPurchase` \| `Gradual` \| `SeparateSaleContract`; `Method`: `EndOfLease` \| `Buyouts`; `TokenPurchaseAmount`; `BuyoutSchedule` (Frequency + BuyoutAmount) — "Applies to **Diminishing Musharaka**... Required when Type is Gradual" |
| Security `AssetType` | includes `TakafulPolicy` and `Rahn` (Islamic pledge) alongside Property/Vehicle/etc. |
| `AEPartyCalendarType` | `IslamicCalendar` \| `GregorianCalendar` for identity-document dates (both YYYY-MM-DD) |

### Product / Open Data API (uae-product, v2.1)

| Field | Content |
|---|---|
| `IsShariaCompliant` | boolean product attribute **and a query filter parameter** ("Filter by Sharia compliance") — TPP comparison engines can filter halal products natively |
| `ShariaStructure` | same 5-value enum as above |
| `AlternativeBrandName` | "If the product is Shari'a Compliant, alternative brand name to sell the product" (window sub-brands, e.g. ADCB Islamic product names) |
| `ShariaInformation` | free-text Sharia compliance description |
| Account feature enums | include `IslamicBanking` and `IslamicFinance` |

### Insurance Data Sharing (uae-insurance, v2.1-errata1)

| Field | Content |
|---|---|
| `Takaful` | boolean — "Indicates whether the policy is Sharia compliant"; `Takaful` also appears in policy-type enum lists |

### Gaps (as of v2.1)

1. **No deposit-side structure enum** — `ShariaStructure` covers financing contracts only. Mudarabah/Wakala deposits are represented via `IsShariaCompliant` + profit-rate/DepositRates semantics, with no machine-readable contract type. Consequence: a TPP cannot distinguish a Mudarabah savings pool from a Wakala placement from the payload; expected-vs-guaranteed-return nuance must ride in product literature.
2. **No `Istisna`/`Salam` enum values** — under-construction finance has no structure tag; use `IsShariaCompliant` + `ShariaInformation`.
3. **`IsShariaCompliant` defaults to `false`** — an LFI that doesn't populate it silently misclassifies its Islamic products. For a window, an unpopulated flag is a data-quality and (arguably) a segregation-evidence defect. Make it a mandatory mapping in Ozone Connect implementations.
4. **No Sukuk/holdings semantics in banking scope** — halal-portfolio use cases must wait for/lean on investment-data phases.
5. **Profit-rate encryption**: `FinanceRates` supports JWE (`AEJwe`) — the partial-encryption regime (see open-finance-uae `technical-specs.md`) applies equally to profit rates; treat profit rates as the sensitive-rate class.

## LFI-side implementation guidance (ADCB Islamic window)

1. **Mapping table first**: every window product → contract type → `ShariaStructure` value (or documented gap) → balance/transaction category conventions (Profit vs Interest, Rental vs Repayment). This is an ISSC-reviewable artefact — the API representation is a Shariah-compliance statement.
2. **Never emit `Interest` categories on Islamic products.** Balance categories, transaction types, and rate schemas must use the Profit/Rental variants; mixed emissions are both a data-quality defect and a Shariah-presentation problem.
3. **Populate `DonatedToCharity`** on late-payment/penalty charges per ISSC treatment.
4. **`AlternativeBrandName` + `ShariaInformation`** carry the window's product branding and the consumer-education content that Article 11 requires — treat them as compliance fields, not marketing free text.
5. **Diminishing Musharaka / Ijara home finance**: implement the full `OwnershipTransfer` object — this is the one place the standard encodes contract mechanics in structured form; getting it right differentiates data quality vs peers.
6. **Consent screens / CX**: AlTareq CX standards (see altareq-brand references in open-finance-uae) apply unchanged; window-specific wording must still satisfy Article 11 disclosure duties inside quote-generation and dynamic-account-opening journeys.

## TPP-side: Shariah-native use cases

Consent-driven aggregation unlocks use cases that are distinctly Islamic:

- **Zakat automation** — compute zakatable wealth (nisab thresholds, haul periods) across aggregated accounts; the killer app of Islamic PFM. Needs balances + holdings scopes; calendar handling benefits from `IslamicCalendar` awareness (Zakat year is lunar).
- **Halal product filtering/comparison** — the Product API's `IsShariaCompliant` filter makes Shariah-screened comparison engines a first-class, standards-native use case.
- **Halal portfolio construction** — aggregate holdings, screen against AAOIFI criteria, recommend Sukuk/halal equities (constrained by gap 4 until investment data lands).
- **Waqf / Sadaqah rails** — recurring charitable flows map cleanly onto multi-payment consent types (FixedPeriodicSchedule etc. — see open-finance-uae payments rules).
- **Genuine risk-sharing finance** — real-time account visibility over a financed venture makes Musharaka/Mudarabah monitoring practical, letting exposures be structured as true PLS rather than synthetic debt (the industry's standing critique). SME data-sharing scopes are the enabler.
- **Inheritance/wills (Wasiyya/Faraid) planning** — aggregated asset registers feeding Shariah-distribution calculators.

## TPP-side: Shariah governance questions (for Islamic institutions as TPPs)

ADIB became the first UAE bank licensed as a TPP under AlTareq (April 2026), positioning explicitly around personalised Islamic finance from aggregated data — the competitive benchmark. If an Islamic institution (or window) operates as TPP, resolve with the ISSC **before build**:

1. **Scope of ISSC oversight over TPP services** — advisory/aggregation services are activities of the institution; window ISSC oversight extends to them.
2. **Displaying conventional products** — can a Shariah-compliant PFM aggregate and display the customer's interest-bearing accounts? (Generally yes as factual reporting; advising the customer *into* conventional products is the line — recommendation logic needs Shariah screening.)
3. **Payment initiation** is contract-neutral (transferring money is not riba), but initiating payments *for* haram purposes via merchant categories may need policy treatment.
4. **Quote generation / account opening for conventional products** through an Islamic TPP front-end — likely impermissible to actively distribute; confirm with ISSC.
5. **Monetisation** — referral/interchange-like income streams need the same halal-income screening as any fee line.

## Composition rules recap

- Architecture, consent lifecycle, certification, liability, pricing → **open-finance-uae**.
- Contract semantics, field meaning, governance sign-offs, use-case Shariah design → **this skill**.
- Exact field truth → `fetch_spec.py` (errata-resolved), interpreted through the inventory above.
