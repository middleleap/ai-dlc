# Runtime assurance examples (Loom 2.0 §10, 2.0-rc)

Two artifacts that govern the harness **while it runs**, delivered at 2.0-rc after being
named `absent` in 1.12 rather than shipped as schema-only gestures.

## `assurance-cycle.json` — a signed continuous-assurance cycle record

Continuous assurance is the six-step lifecycle (Watch → Assess → Check → Test → Evidence →
Confirm) that re-runs on a schedule and on events. Each run leaves a **signed** record with
an unresolved-findings register. Mount cycle records under
`docs/governance/assurance-cycles/<cycle-id>.json`; `scripts/assurance-cycle-check.mjs`
verifies:

- all six lifecycle steps are present and resolved;
- the record is signed (real ed25519 over its canonical hash, via `core/attestations.mjs`)
  by a registered issuer, and `confirmed_by` resolves to a **second-line human** — an agent
  runs the cycle, a human confirms it;
- every finding has an owner (a registry identity), a due date and a status; an **open and
  overdue** finding blocks.

This example is signed by the bundled `demo-anchor-signer` issuer (its private key is not
shipped — regenerate your own; see `governance/attestation-issuers.template.json`).

## `decision-log.json` — the replayable decision log

The agent is a model; an examiner asks "what did it do, and why?" This is an **append-only
hash chain** of the agent's decisions on a change — each seal is
`sha256(prev | canonical entry)`, so editing, reordering or dropping a decision breaks the
chain. Mount it at `docs/governance/decision-log.json`;
`scripts/decision-log-check.mjs` verifies chain integrity, contiguous sequence numbers, and
that every entry is reconstructable (actor = an agent identity, decision, rationale, the
inputs it saw, the tools it used, a timestamp).

**Capture — writing entries as the agent works — is the adopter's harness wiring.** The gate
enforces that whatever is captured is intact, contiguous and replayable; it cannot make an
agent that does not emit a log emit one. That honest seam is why the control grades
*mechanically validated* (the integrity check ships) and not *platform enforced* (capture is
yours to wire), per the five-state model.
