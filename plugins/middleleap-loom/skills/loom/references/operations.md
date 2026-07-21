# Run / Operations — closing the loop (the cloth in use)

The double diamond *builds*: discovery finds the right problem, delivery ships it under
control. But a regulated system does not stop at ship — it **runs**, and running is where
reality tests the framing. Run is the Loom's **third arc**: the cloth in use. It is not a
third harness — the Loom ships no SRE — it is the **edge that bends the double diamond into a
loop**, feeding what production learns back into Discovery as evidence. A build-time frame
that never hears from production is a frame that assumes its problem statement stayed true.
Run is the wire that lets it be told otherwise.

## Where Run sits

Run begins at the delivery seam — steps **⑦ DEPLOY** and **⑧ EVIDENCE** (`delivery-harness.md`):
merge auto-deploys to a live target, a smoke suite runs against the live URL, and the release
seals its evidence bundle. Past that seam the software is *running*, and the warp — four-eyes,
INSERT-only audit, lineage, the sealed evidence trail — persists into the cloth: the record
built at ⑧ keeps accreting as the system operates.

But the harness does **not** operate the system. What ships as the run-time expression of the
warp is **Continuous Assurance** (`continuous-assurance.md`): the six-step
watch→assess→check→test→evidence→confirm lifecycle, re-run **on a schedule and on events**,
writing every cycle back to the governed context brain. Continuous Assurance *is* the run-time
loop the bundle ships. The **operation underneath it** — the observability, SRE, and incident
response that produce the events it reacts to — is adopter-side (cluster E; see below). The
bundle listens; it does not run the pager.

## The feedback edge — Run → Discovery

Discovery is **evidence-gated**: gate **D2** (`discovery-harness.md` §2) fails any claim that
does not trace to a logged signal in `evidence/`. That gate is what makes the loop closable —
because to Discovery, **an operational signal is just a signal**. A production incident is not
a different kind of input from a user interview; it is a signal that happened to originate in
prod. So Run re-enters through the same doors any evidence uses:

| Signal (Run produces it) | What it is | Re-enters via |
|---|---|---|
| **incident** / **near-miss** | something broke, or nearly | research-log evidence (D2) → usually a Delivery fix |
| **slo-breach** | a reliability objective missed | evidence (D2); an error-budget freeze touches the delivery line |
| **drift** | model / eval / config drift | `change-watch` (① Watch) catches it → the D6 register or a fix |
| **cve** | a shipped dependency is now vulnerable | `change-watch` (① Watch) → a patch (spec-fix) or the register |
| **regulatory** | a rule changed | `change-watch` horizon scan → the register, or reopen Discovery |
| **risk-materialised** | a register risk actually happened | the **D6 register** (`discovery-harness.md` §5.1) — cite its `DR-*` |
| **customer-signal** | the market said something | research-log evidence → synthesis, possibly a new problem |

Every one lands as evidence in the brain, the register, or a discovery run — never on the
floor. The brain is *governed*, not accumulated: a signal is a record with an owner and a
history, not a note.

## The routing triage

Most signals do **not** reopen Discovery. Reopening the left diamond means "the problem we
framed may be wrong" — a heavy claim, reserved for signals that *invalidate the framing*.
Everything else resolves in an inner loop. The triage is four-way, and it is exactly the
**ROUTE verdict** the ② Assess agent (`risk-reviewer`) already produces:

| Route | The claim | Lands in |
|---|---|---|
| **spec-fix** | the build is wrong, the problem is fine | **Delivery** — a PR / `spec-change` |
| **register** | the risk position moved | **Continuous Assurance** — a `DR-*` update |
| **discovery** | the *problem* may be wrong | **Discovery**, reopened — a re-discovery run |
| **accepted** | a conscious no-op | closed, with a stated reason |

`risk-reviewer` names the route; it does not get to leave one un-named. A signal with no route
is the failure the whole edge exists to prevent — the incident that was noticed, discussed,
and quietly dropped.

## The operations-signal seam

The routing is enforced, the same way the waist gate enforces discovery→delivery. The seam is
`docs/governance/operations-signal.json` (`{ signals: [...] }`) and its gate
`operations-signal-check.mjs` — the **Run→Discovery analogue of the waist gate**
(`discovery-link-check.mjs`). Where the waist gate makes a green hand-off the entry condition
for a feature, this gate makes **triage + traceability the exit condition for a signal**:

- Every signal declares a **type** (incident · slo-breach · drift · cve · regulatory ·
  near-miss · customer-signal · risk-materialised) and a **severity** (low · medium · high ·
  critical); **high/critical carry an `evidence_ref`** so a reviewer can reconstruct them.
- Every signal declares a **route**, and the route must **resolve**: `spec-fix` links a PR /
  spec-change; `register` cites a `DR-*` in `link`; `discovery` links a run slug **or** carries
  `status:"triaging"`; `accepted` states a `justification`.
- An **empty `signals` array is valid** — operations may not have begun. A signal **with no
  route** is the one failure the gate exists to catch.

What the gate enforces is narrow and honest: **that signals are triaged and traceable.** It
does **not** detect incidents, watch SLOs, or read production — it cannot; it reads a JSON log.
Detection is the adopter's operation. The gate only guarantees that once a signal *is* logged,
it cannot fall on the floor untriaged.

## Honest state

**Shipped — the feedback machinery.** The wire, not the system it carries:

- **Evidence-gated Discovery (D2)** — the property that lets a prod signal re-enter as evidence.
- **The D6 register seam** (`discovery-harness.md` §5.1) — where a materialised risk lands.
- **Continuous Assurance's triggers** — the on-schedule / on-event run-time loop
  (`continuous-assurance.md`).
- **① Watch (`change-watch`)** and **② Assess (`risk-reviewer`)** — the two continuous-assurance
  agents that ship; ① catches drift / CVE / regulatory horizon items, ② produces the ROUTE
  verdict.
- **The operations-signal seam + `operations-signal-check.mjs`** — this gate, enforcing triage
  and traceability.

**Adopter-side — the Run operation itself.** Everything that *produces* the signals:

- **SRE, observability, SLOs, incident management, on-call** — the running system's controls.
- **Operational resilience** — BCP/DR, RTO/RPO, chaos, SEV, kill-switch — **bank-grade-gap
  cluster E**, *Absent* from the bundle by design: a build-time frame was never scoped to run
  the bank.
- The full "you build all of this" list is the **security-testing-and-resilience runbook**
  (`../../loom-adopt/harness/governance/runbooks/security-testing-and-resilience-runbook.md`).

The bundle does not run your system, page your on-call, or detect your incidents. It ships the
**discipline that a signal, once produced, is triaged and traceable back into the loop** — and
nothing more. Claiming otherwise would be the exact dishonesty cluster E exists to name.

## Cross-references

- `continuous-assurance.md` — the six-step run-time lifecycle; ① Watch / ② Assess; on-schedule
  / on-events.
- `discovery-harness.md` — **D2** evidence gate (§2), the **D6** register seam (§5.1), the
  waist-gate pattern this seam mirrors.
- `delivery-harness.md` — the **⑦ DEPLOY / ⑧ EVIDENCE** seam Run begins at, and `spec-change`
  (the spec-fix route).
- `bank-grade-gap.md` — **cluster E** (operational resilience, *Absent*); the "build-time frame
  strong, run-the-bank sparse" grade.
- `governance.md` — HG-0005 (promotion + rehearsed rollback) and HG-0010 (cease-use switch) —
  the seams Run hangs off.
- `../../loom-adopt/harness/scripts/operations-signal-check.mjs` — the gate.
- `../../loom-adopt/harness/operations-example/` — a worked example (Meridian Trust): a realistic
  signal log across all four routes, showing the loop close end to end.
- `../../loom-adopt/harness/governance/runbooks/security-testing-and-resilience-runbook.md` —
  the adopter-side Run operation, in full.
- `SKILL.md` — the double diamond this arc closes into a loop.
