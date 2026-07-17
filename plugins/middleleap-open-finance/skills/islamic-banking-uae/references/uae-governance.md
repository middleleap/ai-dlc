# UAE Shariah Governance and Regulation

## Legal foundations

- **Federal Law No. 6 of 1985** — one of the earliest Islamic banking laws globally; first introduced the concept of a Higher Shari'ah Authority.
- **Decretal Federal Law No. 14 of 2018 (Central Bank Law), Article 17** — establishes the **Higher Shari'ah Authority (HSA)** at the CBUAE: 5–7 members with expertise in the jurisprudence of Islamic financial transactions. HSA operational since 2018 (constituted under Cabinet Resolution 102/2016).
- The Central Bank Law's LFI definition expressly covers institutions carrying on all or part of their business per Islamic Shari'ah — Islamic banks and windows sit inside the same licensing perimeter as conventional banks (and, by the same drafting, inside the Open Finance Regulation's LFI definition).

## Higher Shari'ah Authority (HSA)

- Determines the rules, standards, and general principles for Shariah-compliant business; supervises the ISSCs of licensed IFIs; approves Islamic monetary tools; opines on regulations affecting Islamic institutions.
- **Fatwas and opinions are legally binding** on ISSCs and on all LFIs conducting Shariah-compliant business (Central Bank Law).
- Has adopted **AAOIFI Shariah standards** as the reference baseline; since 2018 has contributed to 17 standards/guidance notes and issued ~985 rulings and directives (CBUAE, 2024 figures).
- IFIs bear the HSA's operating costs pro rata.

## Internal Shari'ah Supervision Committee (ISSC)

Per the CBUAE **Shari'ah Governance Standard for IFIs**:
- Every IFI must comply with Shariah in **all** goals, activities, operations, and conduct, with governance controls proportionate to size/complexity.
- ISSC: minimum **5 members** (CBUAE may permit 3 for small/simple institutions), **≥ one-third Emirati**, appointed by the general assembly on Board nomination **after HSA approval**. Membership caps: ≤3 ISSCs in-UAE, ≤15 total worldwide per scholar (one member per ISSC may exceed the in-UAE cap).
- Three lines of defence: Islamic business → **Internal Shari'ah Control** → **Internal Shari'ah Audit** (may not be outsourced; external assistance only with CBUAE approval), with Board-level involvement (Risk & Compliance, Audit committees).
- Foreign-branch IFIs may run equivalent arrangements subject to CBUAE approval.

## Shariah Compliance Function (SCF) Standard

- Issued **3 April 2024**; full compliance required within one year (**April 2025**). Applies to all UAE banks/FIs conducting all or part of business under Shariah — i.e. including windows.
- Mandates a dedicated SCF continuously monitoring compliance with HSA resolutions, fatwas, regulations, and standards, across planning, execution, reporting, monitoring, and governance pillars.

## Islamic Windows (ADCB-relevant)

- CBUAE publishes a dedicated standard: **"Regulatory Requirements for Financial Institutions Housing an Islamic Window."** Windows (like ADCB Islamic Banking) must maintain segregation of Islamic funds/activities, their own ISSC oversight, and separate reporting for the Islamic business — conventional and Islamic balance sheets must not commingle.
- Practical consequence for data platforms: window products must be identifiable and segregable in systems of record — which aligns directly with the OF `IsShariaCompliant` / `ShariaStructure` fields (an accurate flag is a segregation-evidence asset, not just an API nicety).

## Consumer protection — Article 11 (Consumer Protection Standards)

CBUAE Consumer Protection Regulation/Standards, Article 11 (Shari'ah Compliance for Financial Services) requires IFIs to:
- Ensure Board/senior-management monitoring of full Shariah compliance for all Islamic products; ISSC accountable for compliance **and fairness** of products.
- Operate fair, ISSC-overseen **profit-distribution mechanisms** between shareholders and investment accountholders.
- **Educate consumers** on conventional-vs-Islamic differences and the contracts underlying each product.
- **Disclose the legal consequences** of the financing contracts and the consumer's choices.
- Provide **Shariah certificates** and access to internal Shariah functions when consumers doubt compliance.
- Ensure charity-on-default obligations are not abused as income.

These duties attach to the product wherever it is sold — including inside a **TPP-mediated Open Finance journey** (quote generation, dynamic account opening). See `open-finance-intersection.md`.

## International standards bodies

- **AAOIFI** (Bahrain) — Shariah, accounting, auditing, governance standards; HSA-adopted in the UAE. Islamic-specific accounting treatments (e.g. Ijara, Murabaha recognition) follow AAOIFI FAS where applied.
- **IFSB** (Kuala Lumpur) — prudential/supervisory standards (the Islamic Basel analogue).
- **CIBAFI** — industry body; with IFSB and AAOIFI, co-signatory of the sustainable Islamic finance roadmap launched at CBUAE.

## Governance checklist for any new Islamic feature/product (incl. OF use cases)

1. Which contract(s) does the feature rely on? (`contracts.md`)
2. Does an HSA resolution or AAOIFI standard already cover it? If not → ISSC review required.
3. Consumer disclosures per Article 11 prepared (contract type, legal consequences, certificate access)?
4. Charge/penalty treatment defined (charity purification where required)?
5. Window segregation preserved (data, funds, reporting)?
6. SCF monitoring hooks defined for ongoing compliance evidence?
