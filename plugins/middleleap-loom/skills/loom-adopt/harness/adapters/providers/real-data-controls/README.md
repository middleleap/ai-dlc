# Role: `real-data-controls` (control `REAL-PII-SURFACE`)

**This role exists for the day the repository stops being synthetic.**

Everything else in this bundle assumes synthetic data. `.claude/hooks/pii-guard.sh` blocks PII-shaped
literals at the keystroke, the fixture conventions have a synthetic marker per shape, and
`REAL-PII-SURFACE` is graded **`absent`** in the control catalog — because the harness genuinely ships
nothing for the real-data case, and saying so is the honest state.

That grade stays honest exactly as long as the estate is synthetic. The moment a workload points at
production data, `absent` stops reading as *"out of scope, by design"* and starts reading as
*"unowned"* — about the surface that has just become the most important one in the repository. Nothing
in the tree changes on that day. No gate fires. The posture is inherited **by silence**.

This role turns that transition into a **recorded choice**: name the key custody, name the
encryption or tokenisation boundary, name the access log, and evidence a denial.

## What the harness can and cannot see

**It cannot see a read.** The harness reads JSON records; it does not watch production. It encrypts
nothing, rotates nothing, and cannot tell an authorised read from a compromised identity's read —
both appear in the log as authorised, which is the whole difficulty of this control.

What it *can* do is refuse to let the move to real data happen without a named component, an owner
and a log — and read the denial the platform recorded when the negative probe was run. That is a much
smaller claim than "customer data is protected", and it is the true one.

Two properties are therefore non-negotiable for any provider here:

1. **The evidence is asserted by the platform that holds the data** — the key manager, the vault, the
   database audit log — and never by the application or the agent reading through it. A workload that
   reports on its own access is describing its intentions.
2. **A negative probe.** An unauthorised read must be *denied* and the denial must be *observable* in
   that log. An allow-only log proves traffic, never protection.

## The two shapes

| | `kms-field-encryption` | `vault-tokenisation` |
|---|---|---|
| Where the real value lives | in the institution's own stores, encrypted at field level | in a token vault only; the estate holds surrogates |
| What reading it costs | holding a decrypt grant | an individually authorised, individually logged detokenisation call |
| Blast radius | the grant list — any workload with a grant reads plaintext, and the log calls it authorised | the detokenisation endpoint, plus whatever was never tokenised |
| Migration cost | low: schemas, joins and readers survive; it is a key-management project | high: joins, uniqueness, format validation and analytics are reworked against surrogates |
| The quiet failure | an over-broad grant that looks identical to correct use | a store that was never tokenised, or a grant widened to make a report run |

Neither is safer in the abstract. Each one's failure is the thing its `role_fit.limitation` names, and
that is the sentence to read before choosing. Institutions commonly end up with both — tokenisation at
the edges, field encryption in the systems of record — in which case record the primary choice and say
so, rather than selecting one and leaving the other undeclared.

## To adopt

Record the choice in `docs/governance/provider-selection.json`, copy the chosen declaration to
`docs/governance/adapters/`, point it at your key manager or vault, and wire the fetch that fills
`activation_evidence`. Selecting is not installing, and installing is not activating — an adapter with
placeholder `activation_evidence` is reported as *selected, not active*, which is the honest resting
state, never a green control.

**Dormant until required.** `real_data_controls` compiles only from a profile that requires it — the
intended home is a regulated-institution profile at the high tier, where real customer data is in
scope. A repository working on synthetic fixtures never meets this role; `PS-R06` arms it the moment a
plan names the capability, and not before.
