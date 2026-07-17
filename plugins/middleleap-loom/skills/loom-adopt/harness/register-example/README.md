# Data-risk register — the D6 seam

This is a **minimal example register**, shipped so a fresh Loom adoption sees gate D6 pass
end-to-end before the real register is mounted. It is one complete chain:

```
regulation driver → DR-1 (domain) → DR-1.1 (category) → DR-1.1-001 (risk statement)
                                        → CTRL-001 (control) → residual verdict
```

## The contract

The harness machinery reads **shape, not content**. Mount your organisation's register by
replacing these files with your own records behind the same fields:

| File | Key fields |
|---|---|
| `risk-taxonomy.json` | `risk_domain_id` (DR-d), `risk_category_id` (DR-d.c), names, definition |
| `risk-statements.json` | `risk_id` (DR-d.c-NNN), `regulatory_drivers[]`, `inherent_rating`, `control_ids[]`, `residual_rating` |
| `controls.json` | `control_id` (CTRL-*), `control_type`, `control_owner`, `risk_ids[]`, `automation_level`, `effectiveness_score` |
| `residual-risk.json` | per-risk inherent → control-effectiveness → residual computation |

Gate D6 checks that a discovery run's `data-governance.md` cites at least one `DR-*` category
and one regulatory driver, and that every cited `DR-*`/`CTRL-*` id resolves here. The
`data-governance-reviewer` agent then applies the judgement the mechanical gate cannot:
do the cited controls actually cover the cited risks, and is the residual verdict sound?

A run that mounts no register still passes D1–D5 and D8–D9 — D6 degrades gracefully
(`gates/registers.mjs` returns null). Mount the register when data-governance feasibility
becomes a first-class question, which in a regulated organisation is immediately.
