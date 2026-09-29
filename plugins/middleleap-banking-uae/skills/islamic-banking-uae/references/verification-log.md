# Verification log — islamic-banking-uae

| Date | Pass | Source | Result |
|---|---|---|---|
| 13 Jul 2026 | Full inventory | errata-resolved v2.1 OpenAPI (Nebras `api-specs`, errata2) | Baseline inventory in `open-finance-intersection.md` |
| 29 Sep 2026 | Re-verification after errata3 | `fetch_spec.py` resolved files: `uae-account-information` (errata2 — still the latest for that file), `uae-product` (base), `uae-insurance` (errata3), `uae-authorization-endpoints` (errata3) | Unchanged: `ShariaStructure` enum (5 values), `AEShariaFlag` default `false`, `Profit`/`Rental` balance categories, `LeaseRepayment`, `ProfitCalculationMethod`, `DonatedToCharity`, Hibah frequency, `SupplementaryInformation`, `OwnershipTransfer` (incl. `TokenPurchase`, `SeparateSaleContract`, `EndOfLease`), `TakafulPolicy`/`Rahn` asset types, `IslamicCalendar`; product `IsShariaCompliant` filter, `AlternativeBrandName`, `ShariaInformation`; insurance `Takaful` flag. Changed: insurance section now resolves to errata3 (was errata1). Added: `ReadProductFinanceRates` permission row (errata3 §5). v2.2-rc1 not inspected. |
