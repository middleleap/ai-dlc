---
name: re-perform
description: Use to produce the input to a third-line re-performance of a release assessment — never the re-performance itself, which a named human auditor must adopt in their own name. Takes a released commit, re-runs every gate in a clean checkout, verifies the evidence chain and its signatures, reconciles what the manifest claims against what the gates produce now, and writes a re-performance report with a verdict and findings. Read-only by construction — never fixes anything it finds.
---

# Re-perform — check the record without asking the build team

One invocation = one release, independently re-assessed. This skill exists so that internal
audit is not the only participant in the value chain with nothing that does work on its behalf.

The governing rule is different from every other skill in this harness: **this one changes
nothing.** It does not fix, patch, re-run to green, or open a pull request. A discrepancy is a
**finding**, not a task. If you find yourself repairing something, you have stopped
re-performing and started building, and the independence that made the exercise worth anything
is gone.

> **What this is, and is not.** This produces **input to** a re-performance — never the
> re-performance itself. The verdict below is a recommendation until a named human auditor
> adopts it in their own name. It does **not** satisfy the pilot exit criterion ("internal audit
> has independently re-performed the evidence assessment for at least one release") and it does
> not move the third-line row off `Absent` in the maturity grading. Agents reviewing agents is
> not assurance; that principle does not stop applying because the agent is careful.
>
> **Who runs this.** Someone outside the team that built the release, using an identity that is
> not the build agent's and not in the approver group. If the only identity available is the one
> that authored the change, say so and mark the verdict `NOT-INDEPENDENT` — that is a finding
> about your control environment, and a more useful output than a clean report nobody should
> trust.

## 1. Start from a clean checkout, at the stated commit

Take the release's claimed commit from the evidence manifest's `release_commit` — not from a
branch, a tag someone re-pointed, or a colleague's message.

```bash
git clone --no-local <repo> /tmp/reperform && cd /tmp/reperform
RELEASE_COMMIT=$(node -e 'process.stdout.write(require("./docs/governance/evidence/manifest.json").release_commit)')
[ -n "$RELEASE_COMMIT" ] || { echo "no release_commit in the manifest — finding, stop here"; exit 1; }
git checkout "$RELEASE_COMMIT"
git rev-parse HEAD          # must equal $RELEASE_COMMIT — prove the checkout actually moved
```

**First check, before any gate runs:** does `release_commit` in the manifest correspond to a
commit that is actually an ancestor of the released branch? A manifest naming a commit that was
never merged is the most serious finding available, and it is the cheapest one to test.

## 2. Re-run every gate, and compare to what was claimed

```bash
node core/gate-runner.mjs --lane release --out /tmp/reperform-gates.json
```

Then reconcile, line by line, three things that must agree:

| Source | What it asserts |
|---|---|
| The sealed manifest | What the gates produced **at release time** |
| Your run just now | What the gates produce **at the same commit, today** |
| `/tmp/reperform-gates.json` | Which gates ran, which were skipped, and the reason for each skip |

A gate that passed at release and fails now is not automatically a finding — a dependency
advisory published since release will do that legitimately, and it is exactly what continuous
assurance is meant to surface. **Record the delta and its cause.** A gate that was *skipped* at
release with no recorded reason is a finding, unconditionally.

## 3. Verify the chain, not the summary

Check integrity, then semantics, then binding:

- **Integrity** — re-hash the manifest chain. Recompute; do not read the stored digest and
  agree with it.
- **Semantics** — the seal gate checks nine artifact types for meaning, not presence. Open the
  test results and confirm `failed` is zero. Open the SAST report and confirm no error-level
  result. Open the dependency audit and confirm no critical. Do this yourself; a green gate is
  the claim you are testing, not the evidence for it.
- **Binding** — `release_commit` is present and matches step 1.
- **Signatures** — verify each anchored attestation against the issuer registry. Anything
  reporting `UNVERIFIED-HERE` is an **unverified** attestation, and belongs in the report as
  such. Do not upgrade it because the surrounding chain is intact.

## 4. Verify the human controls actually involved humans

This is the section a build team cannot perform on itself.

- **Approvals** — every PA1/PA2 approval resolves to a human identity in the registry holding
  that role at the time of approval. **No agent identity appears in any approver, classifier,
  hold-holder or cease-use role.** One agent identity in one of those roles invalidates the
  control environment for the whole release.
- **Separation** — second line ∩ builders = ∅. Check it against the registry as it stood, not
  as it stands.
- **Classification** — the risk tier was set by a human with classification authority, and the
  stored control plan reconciles against a fresh compile from the profile. Compile to stdout and
  diff; **never pass `--write`** — that would overwrite the artifact you are auditing:

  ```bash
  node core/policy-compiler.mjs docs/governance/changes/<CHG>/change-envelope.json \
    | diff - docs/governance/changes/<CHG>/control-plan.json
  ```

  A hand-edited plan is a finding even where the outcome looks correct.
- **The hold** — the second-line release hold was RELEASED by a second-line human before any
  production state was claimed. Check the order of events, not just the end state.
- **Decision log** — the chain is contiguous, and the entries reconstruct what the agent did:
  actor, decision, rationale, inputs, tools, timestamp. Pick three entries at random and ask
  whether you could explain that decision to a supervisor from the record alone. If you cannot,
  that is a finding about replayability even when the hash chain is intact.

## 5. State plainly what you could not verify

Every re-performance has a boundary. Naming it is not a weakness of the report — it is most of
its value, and a report that omits this section is asserting more assurance than it performed.

At minimum, state your position on each of these:

- **Whether a drill actually happened.** R-gate freshness proves a date is not stale. It cannot
  prove the rollback was rehearsed or that it worked. That remains an attestation.
- **Whether an evaluation was meaningful.** The provenance gate proves an eval ran, was pinned,
  and its report hashes correctly. It cannot tell you the threshold was set sensibly.
- **Whether the evidence store is immutable.** Without an external WORM anchor and timestamping
  authority, the chain proves internal consistency, not that the record could not have been
  rebuilt wholesale.
- **Whether the scanners were configured well.** The gates validate scanner *output*. A scanner
  pointed at nothing produces a clean report.

## 6. Write the report

Write `docs/governance/re-performance/<release>-<date>.md`. Do not commit it to the release
branch; it is your artifact, not the build's. <!-- ADOPT: name your audit repository or store -->

Structure it as: **verdict**, then **findings**, then **boundary**, then **method**. The method
section names the identity that executed the run — including, if it was an agent, that it was an
agent.

The verdict is one of:

| Verdict | Meaning |
|---|---|
| `RE-PERFORMED` | Re-run independently; results reconcile; no material finding |
| `RE-PERFORMED-WITH-FINDINGS` | Reconciles, with findings listed and rated |
| `NOT-RECONCILED` | The record and the re-run disagree materially |
| `NOT-INDEPENDENT` | Performed, but not by an identity independent of the build |
| `NOT-PERFORMABLE` | The record was insufficient to attempt it — itself the finding |

Rate each finding by what it would mean if it recurred unnoticed, not by how hard it was to
spot. Then stop. Route findings through the register or the operations-signal log so they cannot
fall on the floor — and let someone else fix them.

## Red flags — stop and re-read this skill

- Fixing, patching or re-running anything to green
- Reading a stored hash and agreeing with it instead of recomputing
- Accepting a green gate as evidence rather than as the claim under test
- Treating `UNVERIFIED-HERE` as verified
- Omitting the boundary section because the release looked clean
- Asking the build team what an artifact means instead of recording that it could not be
  understood from the record
- Running under the build agent's identity and not saying so
- Running the policy compiler with `--write` anywhere inside the audited checkout
- Presenting the verdict as a completed audit rather than as input a human auditor must adopt
