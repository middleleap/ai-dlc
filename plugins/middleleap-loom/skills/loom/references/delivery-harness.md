# Delivery harness — canon

The **delivery** half of the Loom. It turns an agreed problem (the PRD, arriving through the
discovery hand-off and the Develop phase) into working software on rails: every change is
specification-first, quality-gated, and human-merged; nothing ships without clearing the gates;
and no real customer data ever touches the system. Compliance and auditability are properties
of the line — not a scramble before an audit.

## The canon (ground truth, in priority order)

| Artifact | Role |
|---|---|
| `CLAUDE.md` | Binding build conventions — the rules the agent may never trade away |
| The PRD | Requirements + acceptance criteria, milestone order |
| The API contract (e.g. `specs/openapi.yaml`) | Ground truth for every endpoint. If the spec is wrong, the spec changes first — via a spec-only PR (`spec-change` skill), never mid-feature |
| `docs/backlog.yaml` | The work queue: items with `status`, `depends_on`, and (for features) a `discovery:` link |

## The autonomous loop, end to end

One `next-story` invocation = one backlog item, end to end. The human audits the build log;
only the merge is human.

```
① PICK      the first eligible pending item — the waist gate rejects any feature
            without a gate-green discovery hand-off
② ISOLATE   one story per branch (feature/<ID>-<slug>), one story per session;
            concurrent loops use git worktrees
③ SPEC-FIRST add/read the contract path → generate types → write contract +
            acceptance tests → SHOW THEM RED before implementing
④ IMPLEMENT to green — against interfaces, never concrete adapters; synthetic
            data only; audit/lineage emission in the same change, never retrofit
⑤ REVIEW    dispatch the local reviewer agents on the diff:
            hard-stop-reviewer → VERDICT: PASS required
            contract-conformance-reviewer → VERDICT: CONFORMANT required
⑥ PR        open it, cite the story ID, wait for CI gates — then STOP.
            A human merges (four-eyes). The loop never merges its own work.
⑦ DEPLOY    auto-deploy on merge to a live demo; a smoke suite runs against the
            LIVE url and fails the deploy if broken
⑧ EVIDENCE  on release: re-run the gates at the released commit and seal the
            evidence bundle (test results, reviewer verdicts, lineage proof,
            agent build-provenance) into the repository — as a hash-chained
            evidence manifest the evidence-seal gate (HG-0003) verifies is
            complete and tamper-evident
```

Mid-iteration, the loop never asks the user anything: a decision a human must make becomes a
`blocked` backlog item with a reason, and the loop moves to the next eligible item. Escalation
is by notification at iteration end — a PR ready for merge, a milestone done, a queue empty but
for blocked items, or an item parked after failing its gates twice.

## The quality-gate pattern (CI)

A failed gate blocks merge. The gate set scales with the project, but the pattern is fixed —
each gate answers one question, mechanically:

| Gate | Question |
|---|---|
| **Q1** build + unit | Does it compile and pass its own tests? Generated artifacts committed and in sync? |
| **Q1b** test integrity | Did any test get weakened to reach green? (Diff against the merge base; count net assertions. This is the anti-reward-hacking gate.) |
| **Q2** static + SAST | Lint, types, security static analysis |
| **Q2b** doc integrity | Do current-state docs still point at files that exist? |
| **Q3** integration + contract | Does it work against real local stores and honour the contract end to end? |
| **Q4** security + dependencies | Dependency audit, secrets scan |
| **Q4.5** lineage | Does every data store emit the lineage the regulator expects? |
| **Q5** production approval | A human, at release time — evidenced, not implied |

The discovery gates (D1–D9) and the waist gate run in the same CI, so a broken discovery run
or an untraced feature item blocks merge exactly like a failing test.

Q2 (SAST) and Q4 (dependency audit, image + secrets scan) name *roles*, not vendors. For
concrete fills — SCA, SAST, container and IaC scanning, hardened base images — see
`supply-chain-security.md`.

## The guardrail hooks (enforced every session, every edit)

The loop's discipline is not left to the agent's restraint. Pre-write hooks block the failure
modes that matter most, at the moment they would happen:

- **pii-guard** — blocks PII-shaped literals (jurisdiction-specific patterns; the bundled
  instance ships UAE shapes) in any written content. Synthetic data only, everywhere.
- **spec-tripwire** — blocks edits to the API contract on a feature branch. The contract
  changes via its own spec-only PR (`spec-change` skill), reviewed by a human.
- **test-tripwire** — blocks test-disabling edits (`it.skip`/`.only`/`.fails`, commented-out
  assertions) on working branches. A red bar goes green by fixing the code, never by weakening
  the test; a genuine test defect is fixed in the open on a dedicated `-testfix-` branch.
  Defense in depth with CI gate Q1b: hook here, gate there.

## The merge policy — propose, never dispose

The single most important rule: **the agent authors and verifies; a human merges.** AI
reviewing AI is not four-eyes for a regulated production change. The enforcement of record is
branch protection (required review from a CODEOWNERS group the agent isn't in, required
checks, no bypass) — the skills and reviewer agents honour the rule so the loop doesn't depend
on restraint, but the platform control is what makes it non-bypassable. See the governance
catalog (`governance.md`), HG-0001 and HG-0002.

**The one calibrated exception — the routine lane (HG-0013).** The dark boundary is the PR,
but a lint fix and an auth rewrite should not cost the reviewer the same attention. A **routine
change** — a narrow, pre-named class (dependency patch, lint fix, doc fix), inside a
second-line-owned, expiring **routine envelope**, under a diff cap, with every required gate
green — may auto-merge. The human approval already happened, once, per envelope, and a routine
change *inherits* it instead of being individually reviewed (`routine-change-check`,
`routine-envelope.json`). An **absolute floor in code** keeps the control plane, the API
contract, auth, and migrations out of the lane no matter how the envelope is configured, and
anything that does not fit re-evaluates to the normal human-merge lane. Approval moves from
per-change to per-envelope; it never disappears. This is graduated autonomy, not a hole in
four-eyes.

## Red flags (the loop is drifting)

- A test shown green that was never shown red
- A spec edit inside a feature diff
- "We'll add audit/lineage after the demo"
- The agent merging anything, including "just this once"
- A feature item building without a `discovery:` link and without an explicit, reasoned exemption
- Merge throughput per reviewer climbing while review depth stays invisible — comprehension
  debt accruing behind a green board (the gate passed; did anyone read it?)
