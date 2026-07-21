# Operations-signal — a worked adopter example (Meridian Trust)

This is a **worked example** of the operations-signal seam: a realistic, triaged, traceable log
of production signals for the DEMO entity *Meridian Trust*, shipped so an adopter can see the
**Run → Discovery loop close** end to end before wiring their own operation. It is synthetic and
non-production. The gate `scripts/operations-signal-check.mjs` verifies it stays green.

Run it:

```bash
cd operations-example && node ../scripts/operations-signal-check.mjs
# → Operations → Discovery feedback gate — OK
```

## What it demonstrates

The double diamond is a **loop**. Shipped software runs, and Run produces signals — incidents,
SLO breaches, drift, CVEs, regulatory change, materialised risk. Discovery is evidence-gated
(D2), so an operational signal is just a signal. The one rule the gate enforces: a signal must be
**triaged** (given a route) and **traceable** (the route resolves to real follow-up). Nothing
falls on the floor.

The seven signals cover all four routes, one per way a signal re-enters the loop:

| Signal | Type | Route | Traces to | The claim |
|---|---|---|---|---|
| OPS-2411 | incident | **spec-fix** | `PR-482` | the build is wrong, the problem is fine → Delivery |
| OPS-2436 | drift | **spec-fix** | `PR-490` | a bounded patch, no problem change → Delivery |
| OPS-2418 | cve | **register** | `DR-1.1-001` | the risk position moved → Continuous Assurance |
| OPS-2430 | regulatory | **register** | `DR-1.1` | an errata tightened a control → the register |
| OPS-2440 | risk-materialised | **register** | `DR-1.1-001` | an inherent risk materialised → the register |
| OPS-2423 | customer-signal | **discovery** | `status: triaging` | the *problem* may be wrong → Discovery reopens |
| OPS-2425 | slo-breach | **accepted** | a justification | a conscious no-op, closed with a reason |

The register routes cite `DR-1.1` / `DR-1.1-001` — the real ids in `register-example/`, so the
loop back to the D6 register resolves. The discovery-routed signal is `status: triaging`: it is
being scoped into a discovery run but the run does not exist yet. When it does, replace the
status with `link: <run-slug>` and the waist gate takes over from there.

## The traceability rules (what the gate checks per route)

- **spec-fix** → `link` a PR / spec-change (it stays in Delivery)
- **register** → cite a `DR-*` risk in `link` (Continuous Assurance updates the residual position)
- **discovery** → `link` a discovery run slug, or `status: triaging` while it is being scoped
- **accepted** → a `justification` (a conscious no-op is still a decision)
- any `high`/`critical` signal → an `evidence_ref`, so a reviewer can reconstruct it

## Mounting your own

Replace these signals with yours behind the same shape (see
`../governance/operations-signal.template.json` for the minimal stub, and
`../../loom/references/operations.md` for the method). Point your operation's outputs — the
incident tracker, the SLO monitor, the scanner feeds, `change-watch` — at this log so every
signal lands here, triaged and traceable.

**Honest limit.** This example is the feedback *machinery* — the discipline that a signal, once
produced, is routed and traceable. It does not detect incidents, watch SLOs, or read production.
The operation that *produces* the signals — SRE, observability, incident management — is the
adopter's, described in `../governance/runbooks/security-testing-and-resilience-runbook.md`.
