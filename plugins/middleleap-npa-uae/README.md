# middleleap-npa-uae

New Product Approval (NPA) for a CBUAE-regulated bank — a standalone, domain-neutral skill.

```
/plugin marketplace add middleleap/ai-dlc
/plugin install middleleap-npa-uae@middleleap-ai-dlc
```

## What's in it

| Skill | Description |
|-------|-------------|
| `npa-uae` | The Business Proposition Form (33 fields with guidance; Word template in `assets/`), the CBUAE anchor behind each field, sign-off routing, the BAU assessments, and how the Loom assembles the pack in discovery, turns it into the `PA1`/`PA2` receipts, compiles approval conditions into controls and schedules the post-implementation review |

## Scope

The skill applies to any change in what a customer is offered, pays, agrees to or experiences —
new products, amendments (pricing, eligibility, channels, segments), withdrawals, new third-party
arrangements, and Open Finance use cases in either the LFI or TPP role. It is not tied to Open
Finance; it moved out of `middleleap-open-finance` (2.5.0) for that reason.

## Worked examples

Both completed packs use **Meridian Trust**, the fictional bank that runs through the Loom demo
(`middleleap-loom`, `harness/demo/meridian`, and the `meridian-trust` plugin):

- `references/example-cross-bank-money.md` — a PFM view built as a TPP, assembled from the
  `cross-bank-money` discovery run; the Loom demo mounts this file as its NPA pack.
- `references/example-connected-accounts.md` — the same form on the lending side.

For a real institution, keep the form and anchors and replace the examples with its own packs.

## Composes with

- `middleleap-loom` — the NPA is the content of the `PA1` (permission to develop) and `PA2`
  (permission to launch) receipts; the Loom demo expects this plugin beside it.
- `middleleap-open-finance` — `open-finance-uae` for Open Finance obligations cited in the pack,
  `uae-bank-risk-reviewer` for the Section 5 risk answers.
- `meridian-trust` — the demo institution's business-case pack, assembled beside the NPA at the
  discovery → delivery gate.
