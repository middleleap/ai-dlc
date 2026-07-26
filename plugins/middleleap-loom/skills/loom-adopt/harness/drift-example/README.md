# The drift worked example (Factory Floor WS4 · D4.2)

`observe.mjs` generates a drift observation for the bundled `freeze-example/`, so
`scripts/drift-check.mjs` compares a real digest against a real freeze stamp instead of reporting
that nothing has been observed. Without it the gate passes **vacuously** on every push — the same
hole `freeze-stamp-check` had before a real frozen artifact was staged beside it.

```
node drift-example/observe.mjs              # in sync with the freeze stamp
node drift-example/observe.mjs --drifted     # the page has moved on since the freeze
```

## What the gate says in each state

| Staged | Output |
|---|---|
| nothing | `nothing frozen from a floor page has been observed` — vacuous |
| in-sync observation | `OK (1 watched page, 0 drifted, 1 observation, 0 claims judged)` |
| drifted observation | `DRIFTED since <instant> — …` and `1 drifted` |

CI stages **both**, in that order, and asserts the transition: an in-sync observation must report `0
drifted`, and a drifted one must report `1 drifted`. That way a regression in drift detection fails
the dry-run rather than waiting to be noticed in a unit test someone might delete.

## Why it is generated rather than committed

An observation carries the instant a page was looked at, and the gate refuses one older than
`OBSERVATION_MAX_AGE_DAYS` (7) wherever a plan compiles the `freeze_drift` capability. A committed,
statically-dated observation would pass for a week and then fail every build for a reason unrelated
to the change under review — so somebody would delete it, and the gate would go back to passing
vacuously. Generating it keeps it perpetually fresh. `validate.yml` generates the
platform-activation observation for exactly the same reason.

## What this does NOT demonstrate

**Nobody looked at anything.** A real watcher fetches the live page, exports it through
`core/floor-export.mjs`, and hashes *that* — `core/floor-drift.mjs` exports `observe()` taking an
injected reader for it. Here the digest is copied from the freeze stamp, or mutated for `--drifted`.
So this exercises the gate and demonstrates the shape; it is not evidence about a page.

**The blocking path is not exercised here.** `0 claims judged` in the output above is honest: drift
blocks *new claims* dated at or after the drift was observed, and there is no approval record in the
bundle citing this frozen artifact's digest. That asymmetry — a merged record survives drift forever,
a new claim against a drifted page is refused — is covered by `core/floor-drift.test.mjs`, including
a test that deletes `Date.now` outright to prove the verdict cannot depend on when the check runs.
Wiring a citing record into the dry-run would strengthen it further and is not done.

**The observer is `padmin-zoe`, not the freezer.** An observation signed by the identity that wrote
the freeze is self-corroboration and `driftState()` refuses to count it (`DR-F06`). Using the
freezer here would produce a green gate that proved nothing, which is the failure mode this whole
directory exists to close.

---

**Companions:** `../freeze-example/` (the artifact being watched) · `../core/floor-drift.mjs` (read
its header first) · `../scripts/drift-check.mjs`.
