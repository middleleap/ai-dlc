# middleleap-open-finance

UAE Open Finance domain expertise for the CBUAE / Al Tareq / Nebras ecosystem.

```
/plugin marketplace add middleleap/ai-dlc
/plugin install middleleap-open-finance@middleleap-ai-dlc
```

## What's in it

| Skill | Description |
|-------|-------------|
| `open-finance-uae` | The canon — CBUAE regulation, Standards versions and errata tracking, API specifications, certification paths, liability model, pricing, AlTareq brand and CX requirements, plus scripts that check whether the skill's version claims are still current |
| `islamic-banking-uae` | Shariah-compliant finance — principles, contract structures (Murabaha, Ijara, Musharaka, Tawarruq, Sukuk, Takaful), CBUAE Shariah governance (HSA, ISSC, SCF), and the native Islamic fields in Open Finance Standards v2.1. Composes with `open-finance-uae` |
| `uae-bank-risk-reviewer` | Virtual Head of Risk for a UAE bank — four modes (discovery landscape, backlog risk tagging, formal review, pipeline-enforcement verification) against a 4-domain taxonomy (77 controls, 45 risks) grounded in CBUAE CPS, PDPL, MMS, CPS-AI, and BCBS 239 |
| `open-finance-uiux` | Value-proposition prototyper — generates solution decks and interactive journey mockups |

The former standalone `altareq-brand-guidelines` skill is merged into `open-finance-uae`
(`references/altareq-*.md`) — one install now carries the whole domain.

`uae-bank-risk-reviewer` reviews against the same v2.5.0 data-risk taxonomy that the
`middleleap-loom` plugin's D6 gate reads mechanically as a mounted register: the gate checks
referential integrity, this skill supplies the Head-of-Risk judgement. Adopt both and the
taxonomy is enforced twice — by machine at the gate, by reasoning in review.

Once installed, skills are namespaced to the plugin: `/middleleap-open-finance:open-finance-uae`.

## Orientation

- **AlTareq** is the consumer-facing Open Finance brand ("Al Tareq" appears in some CBUAE
  prose; the brand and app spelling is AlTareq); **Nebras** is the platform operator.
- **CBUAE** is the Central Bank of the UAE — the regulator.
- **TPP** = Third Party Provider; **LFI** = Licensed Financial Institution.
- The **API Hub** is the Ozone-powered centralised infrastructure for Open Finance APIs.
- Standards canon at last verification (13 Jul 2026): **v2.1-final + errata3**, API Hub **v8**.
  Don't trust that line — run `python3 skills/open-finance-uae/scripts/check_current.py`,
  which exists precisely because hardcoded version claims rot quietly.

## Accuracy

These skills carry specific regulatory figures, dates, and AED amounts. When editing, treat
those as load-bearing: check them against the Standards rather than paraphrasing, and record
corrections in `skills/open-finance-uae/references/verification-log.md` — it is the audit
trail for the skill's factual claims.
