# middleleap-banking-uae

UAE banking expertise for CBUAE-regulated institutions — risk review, Islamic banking and New
Product Approval. General-purpose: each skill works on its own, with or without the Loom.

```
/plugin marketplace add middleleap/ai-dlc
/plugin install middleleap-banking-uae@middleleap-ai-dlc
```

## What's in it

| Skill | Description |
|-------|-------------|
| `uae-bank-risk-reviewer` | Virtual Head of Risk for a UAE bank — four modes (discovery landscape, backlog risk tagging, formal review, control-automation verification) against a 4-domain data risk taxonomy (77 controls, 45 risks) grounded in CBUAE CPS, PDPL, MMS, CPS-AI and BCBS 239 |
| `bank-risk-reviewer` | The same reviewer for a bank outside the UAE — keeps the taxonomy structure and maps the regulatory drivers to local equivalents (GDPR for PDPL, SR 11-7 / ECB guidance for MMS, local conduct rules for CPS) |
| `islamic-banking-uae` | Shariah-compliant finance — principles, contract structures (Murabaha, Ijara, Musharaka, Tawarruq, Sukuk, Takaful), CBUAE Shariah governance (HSA, ISSC, SCF), and the native Islamic fields in Open Finance Standards v2.1 |
| `npa-uae` | New Product Approval — the Business Proposition Form (33 fields with guidance; Word template in `assets/`), the CBUAE anchor behind each field, sign-off routing, the BAU assessments, and how the Loom turns the pack into the `PA1`/`PA2` receipts |

## The risk reviewers

Both reviewers read one shared framework, kept in `uae-bank-risk-reviewer/references/`: the
taxonomy quick reference, the regulatory frameworks guide and the formal review template. If the
institution has its own taxonomy, control register or earlier reviews, the reviewers prefer those
and use the bundled framework as the structural model.

`uae-bank-risk-reviewer` reviews against the same v2.5.0 data-risk taxonomy that the
`middleleap-loom` D6 gate reads mechanically as a mounted register: the gate checks referential
integrity, the skill supplies the Head-of-Risk judgement.

## New Product Approval scope

`npa-uae` applies to any change in what a customer is offered, pays, agrees to or experiences —
new products, amendments (pricing, eligibility, channels, segments), withdrawals, new third-party
arrangements, and Open Finance use cases in either the LFI or TPP role.

Both completed packs use **Meridian Trust**, the fictional bank that runs through the Loom demo
(`middleleap-loom-demo`):

- `npa-uae/references/example-cross-bank-money.md` — a PFM view built as a TPP, assembled from
  the `cross-bank-money` discovery run; the Loom demo mounts this file as its NPA pack.
- `npa-uae/references/example-connected-accounts.md` — the same form on the lending side.

For a real institution, keep the form and anchors and replace the examples with its own packs.

## Composes with

- `middleleap-loom` — the NPA is the content of the `PA1` (permission to develop) and `PA2`
  (permission to launch) receipts; the Loom installs this plugin as a dependency.
- `middleleap-open-finance-uae` — `open-finance-uae` for Open Finance obligations cited in an NPA
  pack or a risk review; `islamic-banking-uae` composes with it for Shariah-compliant products.
- `middleleap-loom-demo` — Meridian Trust's business case, assembled beside the NPA at the
  discovery → delivery gate.

## Provenance

The risk reviewers descend from a client-specific original; client names are removed and
`scripts/deidentify-check.mjs` keeps them out. See the provenance rules in the repository's
`CLAUDE.md` before re-importing any of these skills from the Claude.ai skills UI.
