# Routine-change lane — worked example (HG-0013)

A conforming routine change and the standing envelope that authorizes it. Shows the deck's
approval-inheritance model end to end: the second line authorizes a class once; a conforming
change inherits it and auto-merges; anything outside re-evaluates to the normal lane.

## Files

- `routine-envelope.json` — the standing authorization (mounts at `docs/governance/routine-envelope.json`),
  owned by a second-line human, expiring, scoped to docs + lockfiles, capped at 40 diff lines.
- `routine-claim.json` — what one PR asserts (mounts at `docs/governance/routine-claim.json`).
  In CI the changed paths and line count are re-derived from the real git diff, so the claim
  cannot understate what it touched.

## Verify

```bash
# from a repo where these are mounted at their docs/governance/ paths, with an identity
# registry present and origin/main reachable:
node scripts/routine-change-check.mjs --base origin/main
# → change fits the second-line envelope; auto-merge authorized. OK
```

## What makes it fail (the RE-EVALUATE fallback)

Change any one of these and the gate routes the PR back to human merge — a fallback, not a
failure:

- a changed path outside `path_allow`, or under `path_deny`, or under the absolute floor
  (control plane, `specs/`/`spec/`, auth, migrations — the floor is code and beats the envelope);
- a class the envelope does not list, or one outside the known routine set;
- a diff over `max_diff_lines`;
- a `required_green_gates` entry not recorded green;
- an expired envelope, or an owner who is not a second-line human.

The adversarial checklist in `governance/runbooks/pilot-playbook.md` maps the out-of-envelope
claim to this gate as a CI-proven rejection.
