# Shariah Principles for Banking

## Sources of law

Islamic banking operates under Shariah commercial law — **fiqh al-muamalat** (jurisprudence of transactions) — derived from the Quran and the Sunnah (practice of the Prophet), elaborated through scholarly consensus (ijma) and analogy (qiyas). In the UAE, the operative interpretation is whatever the CBUAE Higher Shari'ah Authority rules, with AAOIFI Shariah standards as the adopted baseline (see `uae-governance.md`).

## The prohibitions

### Riba (interest / usury)
Money may not earn money by itself. Any predetermined, guaranteed return on a loan of money is riba, regardless of rate. This is the defining prohibition: the entire product architecture of Islamic banking exists to deliver financing and deposit economics **without** a loan-plus-interest contract. Returns must instead come from:
- **Trade** — buying an asset and selling it at a markup (Murabaha, Tawarruq)
- **Leasing** — owning an asset and charging rent (Ijara)
- **Partnership** — sharing profit and loss from a venture (Musharaka, Mudarabah)

Practical implication: "interest rate" fields, interest accruals, and interest-bearing account semantics do not apply to Islamic products. The economic price of Islamic financing is expressed as **profit rate**, **markup**, or **rental**.

### Gharar (excessive uncertainty)
Contracts must not contain material uncertainty about subject matter, price, or delivery. All financial transactions require **materiality** — a direct link to a real underlying economic transaction or asset. Consequences:
- Options and most derivatives are impermissible.
- Contract terms (asset, price, schedule) must be fully specified at signing — forward-style contracts (Salam, Istisna) are permitted only with detailed specification precisely to eliminate gharar.
- Conventional insurance is considered to embed gharar (and maisir); the compliant alternative is **Takaful** (mutual risk pooling).

### Maisir (gambling / speculation)
Gain from pure chance or zero-sum speculation is prohibited. Together with gharar, this rules out speculative trading structures and lottery-like features (prize accounts require careful structuring).

### Haram sectors
Financing may not flow to prohibited activities: alcohol, pork, gambling, conventional financial services (interest-based), adult entertainment, and (per most screens) weapons and tobacco. Islamic institutions and halal investment products apply **sector screening** plus **financial-ratio screening** (e.g. limits on a company's conventional debt and interest income) — AAOIFI publishes the reference screens.

## The positive requirements

1. **Risk-sharing** — return must be justified by risk borne. The financier takes asset risk (trade/lease) or venture risk (partnership); risk/return terms must reflect genuine distribution between the parties, not a synthetic guaranteed return.
2. **Materiality / asset backing** — every transaction ties to a real asset or productive activity. This is why Islamic finance is often described as inherently linked to the real economy.
3. **No exploitation** — fairness, transparency, and full disclosure between parties; no party may be exploited. This surfaces in UAE consumer-protection duties (contract-consequence disclosure — see `uae-governance.md`).
4. **Social outcomes** — per the CBUAE's framing, transactions harmful to individuals, society, or the environment are invalid. Charitable instruments (Zakat, Waqf, Sadaqah, Qard Hasan) are integral to the system, and penalty income is typically purified by donation to charity.

## Common misconceptions to correct

- "Islamic banking just renames interest." Wrong at the legal-contract level: the bank actually takes title/asset risk (however briefly) and the customer's obligation arises from a sale, lease, or partnership — with materially different default, early-settlement, and liability treatment. (The critique that some products economically replicate conventional ones is real and debated — acknowledge it honestly — but the contract mechanics still drive the data, accounting, and legal semantics.)
- "Islamic products are only for Muslims." No — they are open to all customers; several markets see significant non-Muslim uptake on ethical/pricing grounds.
- "Deposits earn interest under another name." Participation deposits pay **profit shares** that can vary; guaranteed-return framing is prohibited (banks use profit-equalisation/risk reserves to smooth payouts, per CBUAE/HSA guidance).
- "One global standard exists." It does not: interpretation varies by school and jurisdiction. Anchor UAE answers to HSA/AAOIFI; flag variance for cross-border work.
