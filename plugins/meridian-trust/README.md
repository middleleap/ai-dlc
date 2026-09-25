# meridian-trust

**Meridian Trust** is a fictional CBUAE-regulated bank — the demo institution the Loom runs
against. This plugin is its *institution pack*: the bank-specific context (the Loom's "pattern")
that the method's harnesses draw on, kept separate from the method itself.

```
/plugin marketplace add middleleap/ai-dlc
/plugin install meridian-trust@middleleap-ai-dlc
```

Nothing here describes a real institution. Names, governance bodies, templates and figures are
invented stand-ins built to a realistic structure.

## What's in it

| Skill | Description |
|-------|-------------|
| `meridian-brand-guidelines` | Meridian's brand for decks, documents, web and product UI — Meridian Blue + Inter with defined colour roles (Midnight depth, the cyan Meridian line, one amber note, status colours), typography, slide layout, logos (`assets/logos/`), icon system, CSS variables. The Loom's Meridian brand profile is its token projection |
| `meridian-business-case` | Meridian's two-stage capital approval — the one-page ISB pre-screening proposal and the CIC detailed business case, with the NPV/cost model (`assets/Project_Costs_Template.xlsx`), slide templates, sign-off roster and validation checklist |

## How it fits the Loom

| Loom moment | What this pack supplies |
|---|---|
| Discovery — prototype (D8) | `meridian-brand-guidelines`, so the prototype looks like the bank's product rather than a generic one |
| Define — business case (5c) | `meridian-business-case` assembles the investment case: ISB proposal, CIC case, NPV at 100% and 130% of capex |
| Discovery → delivery gate | The CIC decision with the capex breakdown and the full sign-offs — a business-plan approval, not just a spec lock |
| Product approval (PA1 / PA2) | Pairs with `npa-uae` (plugin `middleleap-npa-uae`), whose worked examples are Meridian's NPA packs |

Install alongside `middleleap-loom` and `middleleap-npa-uae` for the full demo. The Loom's own
scenario data — portfolio, discovery runs, NPA decision — lives in
`middleleap-loom` → `skills/loom-adopt/harness/demo/meridian/`.

## Retargeting to a real institution

This pack is the template for a client's own. Copy the plugin, rename it, and:

- **Brand:** replace the palette, font names, logos in `assets/logos/` and the CSS variables.
- **Business case:** rename the two governance bodies (ISB / CIC), swap the system cluster list in
  `references/business-case-slides.md`, set the reporting currency, and confirm the finance
  parameters (discount rate, contingency, tax). Use the institution's own approved templates if it
  has them.

The Loom stays unchanged; only the pack is swapped.
