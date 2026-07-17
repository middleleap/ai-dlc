---
name: islamic-banking-uae
description: Expert guidance on Islamic banking (Shariah-compliant finance) with UAE regulatory focus and deep UAE Open Finance integration. Covers Shariah principles (riba, gharar, maisir), contract structures (Murabaha, Ijara, Musharaka, Mudarabah, Tawarruq, Istisna, Sukuk, Takaful), UAE Shariah governance (CBUAE Higher Shari'ah Authority, ISSC, Shariah Compliance Function, Islamic Windows, AAOIFI), and the native Islamic fields in Open Finance Standards v2.1 (ShariaStructure, IsShariaCompliant, profit rates, Diminishing Musharaka OwnershipTransfer, Takaful flags). Use whenever a query mentions Islamic banking, Shariah/Sharia, halal finance, profit rate, Murabaha, Ijara, Tawarruq, Takaful, Zakat, HSA, ISSC, Islamic windows, or AAOIFI — and for any Open Finance data-sharing, product, consent, or TPP task touching Islamic products even if "Islamic" isn't said (e.g. representing a covered card in the accounts API). Composes with the open-finance-uae skill.
---

# Islamic Banking UAE Expert

Expert knowledge base for Islamic (Shariah-compliant) banking: principles, contract structures, UAE Shariah governance, and — critically — how Islamic products surface in the UAE Open Finance ecosystem (Al Tareq / Nebras). Built as a companion to the **open-finance-uae** skill.

> **Last verified against sources: 13 July 2026.** OF spec fields verified directly against the errata-resolved v2.1 OpenAPI files in the Nebras `api-specs` repo on that date. UAE regulatory facts verified against the CBUAE Rulebook and CBUAE Islamic Finance pages.

## Quick Reference

| Aspect | Detail |
|--------|--------|
| Core prohibitions | Riba (interest), gharar (excessive uncertainty), maisir (speculation/gambling), haram sectors |
| Core requirements | Risk-sharing, materiality (real-asset linkage), no exploitation, ethical screening |
| UAE apex body | Higher Shari'ah Authority (HSA) at CBUAE — fatwas **binding** on all IFIs and ISSCs |
| Bank-level body | Internal Shari'ah Supervision Committee (ISSC) — min 5 members (3 with exemption), ≥⅓ Emirati, HSA-approved |
| Newest control | Shariah Compliance Function (SCF) Standard — issued 3 Apr 2024, compliance deadline Apr 2025 |
| Standards baseline | AAOIFI Shariah standards, adopted by the HSA; IFSB for prudential |
| Windows | CBUAE "Regulatory Requirements for FIs Housing an Islamic Window" standard applies (ADCB context) |
| OF Standards support | **Native** Islamic fields in v2.1: `ShariaStructure`, `IsShariaCompliant`, Profit balance/rate semantics, Diminishing Musharaka `OwnershipTransfer`, `Takaful` flag (insurance) |
| `ShariaStructure` enum | Ijara · ServiceIjara · Murabaha · Musharaka · Tawarruq (v2.1; **no** Mudarabah/Wakala/Istisna/Salam values) |

## Invariants (never violate these)

1. **Never call profit "interest."** Shariah-compliant products earn profit (from sale markup, rent, or partnership share) — the economic effect may resemble interest, but the legal contract and the correct terminology differ. In API payloads, UI copy, and documents, use profit rate / rental / markup as the contract dictates.
2. **The contract determines the data semantics.** A Murabaha "loan" is a receivable from a sale; an Ijara "mortgage" is a lease with rentals; a covered card is not a credit card in contract terms. Map to OF fields per the contract, not the conventional analogue (see `references/open-finance-intersection.md`).
3. **No guaranteed returns on participation deposits.** Mudarabah-based deposits pay expected profit smoothed via risk reserves, never a promised rate. Never describe or model them as fixed-rate deposits.
4. **HSA fatwas are binding.** Any product/feature question that lacks a clear answer in published standards escalates to the ISSC, and ISSC positions are subordinate to the HSA. Never present a Shariah ruling as settled without the governance trail.
5. **Fee income constraints are real.** Charges on Shariah-compliant products may be required to be donated to charity (e.g. late-payment charges) — the OF spec models this explicitly (`DonatedToCharity`). Never design revenue models that book such charges as income without ISSC sign-off.
6. **OpenAPI is the source of truth for OF fields** (inherited from open-finance-uae): never invent Islamic fields or enum values — the v2.1 support is documented in `references/open-finance-intersection.md` with exact schema names; re-verify with `fetch_spec.py` before quoting.
7. **Schools-of-thought caveat.** Shariah interpretation varies (Hanafi, Maliki, Shafi'i, Hanbali; and by jurisdiction). In the UAE, the HSA/AAOIFI position governs; flag jurisdictional variance when advising cross-border.

## When composing with open-finance-uae

- **Trigger both skills** for any task touching Islamic products in an Al Tareq / Nebras context (LFI data sharing, TPP use cases, product API, consent journeys, account opening).
- open-finance-uae owns: architecture, consent lifecycle, security, certification, pricing, liability, brand/CX.
- This skill owns: what the Islamic fields mean, which contract maps to which schema, Shariah governance sign-offs a feature needs, and Shariah-native use-case design.
- Field-level detail: always resolve errata first (`python3 scripts/fetch_spec.py` in open-finance-uae), then interpret via `references/open-finance-intersection.md`.

## Reference Routing — read these first

| If the task is... | Read |
|---|---|
| Explaining principles / prohibitions / "why" questions | `references/principles.md` |
| Product design, contract selection, cash-flow semantics | `references/contracts.md` |
| Governance, ISSC/HSA/SCF, windows, consumer protection duties | `references/uae-governance.md` |
| **Anything Open Finance** — field mapping, gaps, use cases, TPP governance | `references/open-finance-intersection.md` |
| Exact OF field/enum detail | open-finance-uae `scripts/fetch_spec.py` (errata-resolved), then interpret here |

## Keeping This Skill Current

- `ShariaStructure` enum values and Islamic field inventory: re-verify against the live spec whenever the OF standards version or errata level bumps (the open-finance-uae `check_current.py` flags this).
- HSA resolutions and new CBUAE Islamic standards: check the CBUAE Islamic Finance page and Rulebook.
- AAOIFI standard revisions: check aaoifi.com announcements.
