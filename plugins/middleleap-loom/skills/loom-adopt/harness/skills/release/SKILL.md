---
name: release
description: Use to take a merged commit through delivery steps ⑦ DEPLOY and ⑧ EVIDENCE — promote, smoke-test the live target, re-run every gate AT the released commit, assemble and seal the hash-chained evidence bundle, and stop for the human production authorization. Never authorizes production itself. Use after a human has merged, never as part of a build iteration.
---

# Release — deploy, then seal the record

> **Identifiers.** Gate ids (`D1`–`D9`, `Q1`–`Q5`) and run-level ids (`S-001` signal,
> `T-1` theme, `H1` hypothesis) are expanded in `discovery/GLOSSARY.md`.

One invocation = one release, end to end. This skill exists because `evidence-seal-check`,
`decision-log-check`, `assurance-cycle-check` and `product-eval-check` all judge artifacts that
nothing else in the harness produces. A gate guarding an artifact with no author is a gate that
can only ever pass on something hand-written.

The governing rule is the delivery harness's, unchanged: **the loop assembles; a human
authorizes.** This skill will build the complete, verifiable case for a production release and
then stop. It never sets a production state, never releases the second-line hold, and never
signs an approval.

> **Not a build iteration.** `next-story` ends at the pull request. This skill starts *after* a
> human has merged. If you find yourself here with unmerged work, stop — you are in the wrong
> skill.

## 1. Fix the commit

Resolve the exact commit being released and use it for everything that follows. Not `HEAD`, not
the branch tip — the commit.

```bash
RELEASE_COMMIT=$(git rev-parse HEAD)          # or the tag being promoted
git worktree add /tmp/release-verify "$RELEASE_COMMIT"
cd /tmp/release-verify                        # EVERY gate below runs here, not in your checkout
```

Every gate result, every artifact and the manifest's `release_commit` field must refer to this
one commit. **An evidence bundle assembled at a different commit than the one that shipped is
the failure this whole step exists to prevent** — it is how a release comes to be described by
evidence from a version nobody ran.

## 2. Promote to pre-production, and smoke

Follow the project's promotion path — dev → staging → prod. **This skill goes as far as
staging.** The production hop is step 8, and it happens only after a human returns the
authorization, because the second-line hold exists to stop exactly that hop.
<!-- ADOPT: name your pre-production promotion command and environment -->

1. Deploy the released commit to the **pre-production** target.
2. Run the smoke suite **against that live URL**, not against a local build.
   <!-- ADOPT: name your smoke command and the pre-production URL -->
3. A failing smoke suite **fails the deploy**. Execute the rehearsed rollback (R3), record it in
   the build log, and end the release. Do not seal a bundle for a deployment that did not stand
   up.

## 3. Re-run every gate at the released commit

In the clean worktree, run the full gate set — not a summary of the last CI run, not a link to a
green badge. Re-run them.

```bash
node core/gate-runner.mjs --lane release --out /tmp/release-gates.json
```

The release lane runs more than the PR lane by design. Any gate the runner skips must appear in
`/tmp/release-gates.json` with its reason; **a skip with no reason is a stop**, not a note.

Capture each gate's raw output as a file. These are the artifacts, not your summary of them.

## 4. Assemble the bundle — nine required types

The seal gate requires nine artifact types and verifies each **semantically**, not merely for
presence. They are fixed in the gate's `REQUIRED_TYPES` — read them from there, and if this
table ever disagrees with the gate, the gate is right:

| Type | What it must contain |
|---|---|
| `tests` | The full suite's results. Any `failed` above zero fails the seal |
| `reviews` | `hard-stop-reviewer` PASS and `contract-conformance-reviewer` CONFORMANT for every change in the release. A non-PASS verdict fails the seal |
| `lineage` | Proof each data store emitted the lineage the register expects (Q4.5) |
| `model-provenance` | The model and prompt versions that authored the change, with the eval report cited by `ref` + `sha256` |
| `control-plane` | The control-plane integrity result at this commit |
| `sast` | The SAST report. An error-level result fails the seal |
| `sbom` | The software bill of materials for what actually shipped |
| `dependency-audit` | The dependency scan. A critical vulnerability fails the seal |
| `provenance` | Build provenance for the artifacts themselves |

The **token ledger** seals into the same bundle but is not one of the nine: it is telemetry, and
it must never become a pass/fail input. Copy the artifacts back into the repository checkout's
`docs/governance/evidence/` — the worktree is for running gates, not for holding the record.

Set `release_commit` in the manifest to the commit from step 1. Then hash-chain the manifest and
run its gate:

```bash
node scripts/evidence-seal-check.mjs
```

A gate failure here is **never** resolved by editing an artifact. Fix what the artifact is
reporting, re-run step 3, and reassemble. Editing a sealed artifact to make a gate green is the
precise behaviour negative test 1 in the pipeline exists to catch, and doing it by hand is worse
than doing it by accident.

## 5. Close the record the other gates read

Four artifacts must be current at the released commit. None of them is optional, and none of
them is yours to invent.

- **Decision log** (`decision-log-check`) — the append-only hash chain must be contiguous and
  cover the iterations in this release. Capture is harness wiring; if entries are missing, the
  release does not proceed on a partial chain. <!-- ADOPT: point at your capture wiring -->
- **Product eval** (`product-eval-check`) — the release must link its discovery hand-off and
  carry a fresh eval, bound to this commit, scoring **every** D1 success measure. A regression
  blocks. The measure set itself is authored in discovery via the `govern` skill; here you run
  the rig and record what it returns. You do not author its result.
  <!-- ADOPT: name your eval rig command -->
- **Assurance cycle** (`assurance-cycle-check`) — the current cycle record must cover all six
  lifecycle steps, be signed, and carry no open, overdue finding.
- **Operations signal log** (`operations-signal-check`) — once anything in this release holds a
  production state, an empty log fails. Silence after launch is not a clean sheet.

## 6. Build the authorization case — and stop

Compound production authorization requires **all** of the following. Assemble the evidence for
each, verify each, and present them together:

1. **PA2** approved, with every section the product profile compiles as required, each approval
   resolving to a human registry identity holding that role.
2. **R1–R6 readiness green** for every declared service — BCP/DR, rollback, kill switch,
   capacity, third-party continuity, reconciliation — each inside its freshness window.
3. **The second-line release hold, RELEASED by a second-line human.** Missing hold = HELD. Fail
   closed.
4. **Anchored, issuer-verified evidence** at high and critical tiers. Where a platform mechanism
   is not yet wired, it reports `UNVERIFIED-HERE` — carry that through to the notification
   verbatim. Do not present an unwired anchor as a verified one.

Then **STOP**. Notify the accountable owner that the release is assembled and what remains:
which of the four is outstanding, and who holds it.

## 7. The hard stops

The loop assembles the case. It does not:

- set `current_state` to any production value;
- release the second-line hold, or sign as a second-line identity;
- issue, alter or re-date any approval, attestation or readiness record;
- sign or confirm an assurance-cycle record — that signature is a second-line human's;
- author an eval result, a drill outcome, or a risk classification.

Every one of those is a human act performed by a named identity the agent is not. The gates
already refuse each of them; this skill refuses them one step earlier, so the refusal is a rule
rather than a rejection.

## 8. Promote to production — only on a returned authorization

When, and only when, a human returns all four conditions met:

1. The **human** performs or triggers the production promotion. If your platform requires an
   agent-run command, it runs under the promotion identity, not the build agent's, and against a
   ticket that references the authorization.
   <!-- ADOPT: name your production promotion path and who is entitled to run it -->
2. Re-run the smoke suite against production.
3. A failure here executes the rehearsed rollback (R3) and reopens the release.

If any of the four is outstanding, this step does not begin. There is no partial promotion, and
"we will get the hold signed after" is the failure mode the hold was built for.

## 9. Record

Append to `docs/build-log.md`: the released commit, the deploy target, the smoke result, the
gate-run summary including every recorded skip and its reason, the nine artifact types with
their hashes, and the authorization state — which of the four conditions are met, which are
outstanding, and who holds each outstanding one.

## Red flags — stop and re-read this skill

- Assembling evidence at `HEAD` rather than at the released commit
- Editing any artifact to turn a gate green
- Reusing the last CI run's results instead of re-running the gates at the released commit
- Presenting an `UNVERIFIED-HERE` anchor as verified
- Setting a production state, releasing the hold, or signing anything
- Sealing a bundle for a deployment whose smoke suite failed
- Proceeding on a decision-log chain with gaps in it
