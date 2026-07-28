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

### 1b. Enumerate what is in the release — write the train

The step nobody was told to take, and its absence is why adopters drift into releasing one story
at a time. **Say in writing which governed changes this release carries**, before you seal
anything:

```bash
mkdir -p docs/governance/release-trains
cat > docs/governance/release-trains/TRAIN-$(date +%Y-W%V).json <<JSON
{
  "train_id": "TRAIN-$(date +%Y-W%V)",
  "release_commit": "$RELEASE_COMMIT",
  "changes": ["CHG-…", "CHG-…"],
  "bundle": "docs/governance/evidence/manifest.json",
  "sealed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "released_by": "<the second-line identity releasing this train>"
}
JSON
```

**Per-change PA2 is untouched** — every change in the list still carries its own permission to
launch, given by its own approvers, and no train grants one. What the train does is let the
release-*level* acts be taken once: this enumeration, one sealed bundle, one anchor, one
second-line release decision. `scripts/evidence-seal-check.mjs` then derives the required
evidence from **the changes actually shipping** rather than from every change in the repository,
and `scripts/release-attestation-check.mjs` proves the train, the subject and the manifest all
name the same commit.

A change belongs to at most one train, one commit has at most one train, every named change must
exist under `docs/governance/changes/`, and `released_by` must be a second-line human. If any of
that is wrong the gates fall back to the repository-wide union — more evidence, never less.

Releasing a single change? Write a train with one entry, or skip this step entirely; nothing here
is mandatory. The cost of skipping it is that you cannot later answer "what was in that release?"
from the repository, which is the question every incident starts with.

## 2. Promote to pre-production, and smoke

**Read the ladder; do not invent it.** The promotion path is declared in
`docs/governance/environments.json` and validated by `scripts/environments-check.mjs` — one entry
per environment with its purpose, its data classification, the identity entitled to promote into
it, what it promotes *from*, and its URL. Until rc.39 those three facts lived in `ADOPT` comments
here, which meant nothing could check them and no deployment record could cite them.

```bash
node -e '
  const e = require("./docs/governance/environments.json").environments;
  const sources = new Set(e.map((x) => x.promotion_source).filter(Boolean));
  const prod = e.find((x) => !sources.has(x.id));               // nothing promotes out of it
  const pre  = e.find((x) => x.id === prod.promotion_source);   // …and what feeds it
  console.log(JSON.stringify({ pre, prod }, null, 2));
'
```

**This skill goes as far as the pre-production rung** — the one whose `promotion_source` chain
ends at the terminal environment. The production hop is step 8, and it happens only after a human
returns the authorization, because the second-line hold exists to stop exactly that hop.

1. Deploy the released commit to that pre-production environment, using **its declared
   `identity`** — not yours, and not the build agent's.
2. Run the smoke suite **against that environment's declared `url`**, not against a local build.
   The URL is read from the ladder for the same reason the commit is fixed in step 1: a smoke
   suite pointed somewhere by hand is a smoke suite that can be pointed at something green.
3. A failing smoke suite **fails the deploy**. Execute the rehearsed rollback (R3), record it in
   the build log, and end the release. Do not seal a bundle for a deployment that did not stand
   up.

**Deploy is not exposure.** If the service declares a `progressive_delivery` block (R3b) and the
change's plan requires the `exposure_control` capability, the artifact ships *dark*: the flag
named in `docs/governance/feature-flags.json` defaults off, and turning it on for a cohort is a
separate, later act governed by the same compound authorization. Shipping and exposing on the same
event is what forces a quarter of work to queue behind one signature.

## 3. Re-run every gate at the released commit

In the clean worktree, run the full gate set — not a summary of the last CI run, not a link to a
green badge. Re-run them.

```bash
node core/gate-runner.mjs --lane release --out /tmp/release-gates.json --emit-dir /tmp/release-emitted
```

The release lane runs more than the PR lane by design. Any gate the runner skips must appear in
`/tmp/release-gates.json` with its reason; **a skip with no reason is a stop**, not a note.

`--emit-dir` makes the runner capture each mechanism's output and write one result record per
mechanism plus the run record (`gate-run.json`) — gate-emitted artifacts carrying the commit and
timestamp, not your summary of them. Do not transcribe a verdict by hand: a hand-typed "PASS" is
exactly the fabricatable evidence the seal gate exists to refuse.

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
it must never become a pass/fail input. Copy the artifacts — including the runner's
`gate-run.json` from step 3's `--emit-dir` — back into the repository checkout's
`docs/governance/evidence/`; the worktree is for running gates, not for holding the record.

Then **derive** the manifest; never hand-chain it. The collector hashes every artifact, orders
the entries by the seal gate's required-types contract, binds `release_commit`, seals the
gate-run record when present, and re-verifies its own output with the seal gate's `evaluate()`
**before** writing — a bundle that would fail verification is never written at all:

```bash
node scripts/seal-evidence.mjs --commit "$RELEASE_COMMIT"
```

The seal now also demands (rc.36): a **mandatory anchor** (the collector writes it — D4), a
`release_commit` that **exists in this repository and is an ancestor of HEAD** (D5; outside a git
checkout the collector says so as a recorded not-performable, never a silent pass), and an anchor
attestation from a **non-demo** registered issuer — the unified stack refuses `demo: true` keys
everywhere (D3). Sign the anchor with your institution's registered signer;
`evidence-example/regenerate.mjs` shows the per-run key pattern CI uses.

Then run the gate itself, as the independent re-verification CI will repeat:

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
   capacity, third-party continuity, reconciliation — each inside its freshness window. Where the
   change compiles `exposure_control`, that includes **R3b**: a declared ramp, and an automated
   rollback trigger fired inside its own 90-day window. What you are authorizing at that point is
   **exposure**, not the deploy — the artifact may already be running, dark.
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
- author an eval result, a drill outcome, or a risk classification;
- **turn a feature flag on, advance a cohort stage, or extend a flag's expiry.** Exposure is the
  act the authorization authorizes; a loop that could grant itself exposure has made the whole
  separation decorative. Shipping dark is the loop's job. Turning the light on is not.

Every one of those is a human act performed by a named identity the agent is not. The gates
already refuse each of them; this skill refuses them one step earlier, so the refusal is a rule
rather than a rejection.

## 8. Promote to production — only on a returned authorization

When, and only when, a human returns all four conditions met:

1. The **human** performs or triggers the production promotion into the terminal environment
   declared in `docs/governance/environments.json` — the one nothing promotes out of, which the
   gate requires to carry `approval_required: true`. It runs under **that environment's declared
   `identity`**, which `environments-check` has already proven is a human outside the builders
   group, and against a ticket that references the authorization. The build agent's identity is
   never the promotion identity.
2. Re-run the smoke suite against that environment's declared `url`.
3. A failure here executes the rehearsed rollback (R3) and reopens the release.
4. **Write the deployment record** — `docs/governance/deployments/<deployment-id>.json`, emitted
   by the deploy job from what it *observed*, never typed from what was intended:

   ```json
   {
     "deployment_id": "DEP-…", "service_id": "…", "environment": "<terminal environment id>",
     "release_commit": "<the commit fixed in step 1>",
     "deployed_digest": "<the digest from docs/governance/release-subject.json>",
     "strategy": "<the service's declared progressive_delivery.strategy>",
     "feature_flag_ref": "<the service's declared exposure switch>",
     "stages_completed": [{ "name": "…", "traffic_pct": 1, "started_at": "…", "completed_at": "…" }],
     "deployed_by": "…", "authorized_by": "<the second-line human who returned the authorization>",
     "deployed_at": "…"
   }
   ```

   `scripts/deployed-digest-check.mjs` (the **deploy** lane) then verifies the two things nothing
   else in the harness ever checked: that the deployed digest is the *authorized* digest — same
   artifact, not merely the same source — and that every declared ramp stage actually ran, in
   order, at its declared traffic, having baked for at least its declared time.

If any of the four is outstanding, this step does not begin. There is no partial promotion, and
"we will get the hold signed after" is the failure mode the hold was built for.

## 9. Record

Append to `docs/build-log.md`: the released commit, the deploy target **as its declared
environment id**, the smoke result, the gate-run summary including every recorded skip and its
reason, the nine artifact types with their hashes, the deployment record id written in step 8, the
exposure state of every flag the change owns (still off, or turned on for which cohort stage), and
the authorization state — which of the four conditions are met, which are outstanding, and who
holds each outstanding one.

## Red flags — stop and re-read this skill

- Assembling evidence at `HEAD` rather than at the released commit
- Editing any artifact to turn a gate green
- Reusing the last CI run's results instead of re-running the gates at the released commit
- Presenting an `UNVERIFIED-HERE` anchor as verified
- Setting a production state, releasing the hold, or signing anything
- Sealing a bundle for a deployment whose smoke suite failed
- Proceeding on a decision-log chain with gaps in it
- Naming a promotion target that is not an id in `docs/governance/environments.json`
- Recording a deployment whose digest is "the build from that commit" rather than the digest in
  `release-subject.json` — a rebuild is a different artifact and it was not the one evaluated
- Skipping a declared ramp stage, or cutting its bake short, because the change "looks fine"
- Turning a flag on as part of assembling the case
