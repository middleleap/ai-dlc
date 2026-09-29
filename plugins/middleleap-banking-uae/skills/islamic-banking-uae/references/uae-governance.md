# UAE Shariah Governance and Regulation

## Legal foundations

- **Federal Law No. 6 of 1985** — one of the earliest Islamic banking laws globally; first introduced the concept of a Higher Shari'ah Authority. Annulled by Decretal Federal Law No. 14 of 2018 (Art. 154).
- **Federal Decree-Law No. 6 of 2025** regarding the Central Bank, Regulation of Financial Institutions and Activities, and Insurance Business (in force 16 Sep 2025; it repealed Decretal Federal Law No. 14 of 2018, whose Art. 17 previously housed the HSA), **Article 24** — establishes the **Higher Shari'ah Authority (HSA)** attached to the CBUAE: 5–7 members with knowledge and experience in the jurisprudence of Islamic financial transactions, appointed for renewable three-year terms. HSA established by Cabinet Resolution No. 102/5/1 of 8 May 2016; operational since 2018. Standards issued under the 2018 law remain in force until replaced (FDL 6/2025 Art. 183).
- The LFI definition in FDL 6/2025 (Art. 1) expressly covers institutions carrying on all or part of their business per Islamic Shari'ah — Islamic banks and windows sit inside the same licensing perimeter as conventional banks (and, by the same drafting, inside the Open Finance Regulation's LFI definition).

## Higher Shari'ah Authority (HSA)

- Determines the rules, standards, and general principles for Shariah-compliant business; supervises the ISSCs of licensed IFIs; approves Islamic monetary tools; opines on regulations affecting Islamic institutions.
- **Resolutions and fatwas are legally binding** on ISSCs and on all Islamic Financial Institutions (FDL 6/2025 Art. 24(8)); ISSC–Board disagreements on Shari'ah compliance are referred to the HSA, whose opinion is binding and final (Art. 75(6)).
- Adopted **AAOIFI Shari'ah standards** as binding minimum requirements on ISSCs from 1 Sep 2018 (HSA Resolution 18/3/2018), including future AAOIFI amendments; since 2018 has contributed to 17 standards/guidance notes and issued 985 rulings and directives (CBUAE, 2024 figures).
- Islamic Financial Institutions bear all of the HSA's expenses, per the HSA charter approved by the CBUAE (FDL 6/2025 Art. 24(4)).

## Internal Shari'ah Supervision Committee (ISSC)

Per the CBUAE **Shari'ah Governance Standard for IFIs**:
- Every IFI must comply with Shariah in **all** goals, activities, operations, and conduct, with governance controls proportionate to size/complexity.
- ISSC: minimum **5 members** (CBUAE may permit 3 for small/simple institutions), **≥ one-third Emirati**, appointed by the general assembly on Board nomination **after HSA approval**. Membership caps per scholar: ≤3 ISSCs inside the UAE and ≤15 ISSCs (or equivalent) inside and outside the UAE; only one member of an IFI's ISSC may exceed the 15-membership cap; memberships within one group count as one; the HSA may exempt UAE nationals from these caps.
- Three lines of defence: Islamic business → **Internal Shari'ah Control** (houses the SCF; must not be outsourced) → **Internal Shari'ah Audit** (may not be outsourced; external assistance only with CBUAE approval), with Board-level oversight via the Board Risk Committee (Shari'ah non-compliance risk) and the Board Audit Committee. FDL 6/2025 Art. 75(7) requires both divisions, with heads appointed by the Board after ISSC and HSA approval. External Shari'ah audit has its own CBUAE standard (in force 29 Nov 2024).
- Foreign-branch IFIs may run equivalent arrangements subject to CBUAE approval.

## Shariah Compliance Function (SCF) Standard

- Issued **3 April 2024** (per industry commentary; the Rulebook shows it effective 3 Apr 2025); Article 12 requires full compliance within one year of issuance (**April 2025**). Applies to all CBUAE-licensed IFIs conducting all or part of business under Shariah — i.e. including windows.
- Mandates a Shari'ah Compliance Function within internal Shari'ah control (second line) that continuously monitors compliance with HSA resolutions, fatwas, regulations and standards, reviewing before and during execution. Review stages: ISSC- and Board-approved annual plan → planning and scoping → field review → issues and actions → reports → progress monitoring.

## Islamic Windows

- CBUAE **"Standard Re. Regulatory Requirements for Financial Institutions Housing an Islamic Window"** (in force 26 Oct 2020). Windows must comply with the Shari'ah Governance Standard (ISSC, control, audit), appoint a CBUAE-approved Head of Islamic Window, ring-fence Shari'ah-compliant assets and liabilities in an ALM framework with **separate product codes mapped to specific GL accounts**, report separate LCR/NSFR/ELAR and a separate Islamic Bank Return Form (iBRF), report window results separately to management and the Board, and must not transfer Shari'ah-compliant assets to the conventional side.
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

- **AAOIFI** (Bahrain) — Shariah, accounting, auditing, governance standards; its **Shari'ah standards** are HSA-adopted as binding minimums in the UAE (Resolution 18/3/2018). Whether AAOIFI FAS applies to a given institution's accounting is institution-specific — verify; do not assume.
- **IFSB** (Kuala Lumpur) — prudential/supervisory standards (the Islamic Basel analogue).
- **CIBAFI** — industry body; with IFSB and AAOIFI, co-signatory of the sustainable Islamic finance roadmap launched at CBUAE.

## Governance checklist for any new Islamic feature/product (incl. OF use cases)

1. Which contract(s) does the feature rely on? (`contracts.md`)
2. Does an HSA resolution or AAOIFI standard already cover it? If not → ISSC review required.
3. Consumer disclosures per Article 11 prepared (contract type, legal consequences, certificate access)?
4. Charge/penalty treatment defined (charity purification where required)?
5. Window segregation preserved (data, funds, reporting)?
6. SCF monitoring hooks defined for ongoing compliance evidence?
