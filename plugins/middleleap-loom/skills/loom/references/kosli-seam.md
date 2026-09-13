# The Kosli seam — where the Loom stops and the record begins

> Appendix. **Decisions K1–K9 and hardening-plan rows 0.6–0.10 were ratified on 13 September
> 2026.** Rows 2.1–2.6, 2.8 and 2.14 are shipped (§4b, §4c); the rest of phase 2 lands after
> the seven questions in §5 are answered on the 18 September call. Where a sentence below says
> "posts" or "reads" about a row not yet shipped, it describes a contract, not code, and
> `bank-grade-gap.md` grades the corresponding rows accordingly.

## 1. The one-line division

**The Loom decides what must be true; the external record keeps what happened, and Kosli is the first provider of that record.** The Loom compiles the
route (which gates, which approvers, which evidence), runs the gates, and signs every result.
Kosli holds the record of those results outside the tree the agent edits, evaluates policy
over it, and — from deploy onward — sees the one thing the Loom cannot: what is running.

Why the record has to be outside: every Loom trust root — the control catalog, the identity
registry, the issuer keys, the evidence chain — lives in the repository the agent writes to.
The only thing separating a control from a self-attestation is a platform setting no gate can
observe (HG-0003, `governance.md`). Kosli is that outside record. Nothing else the harness
holds is.

## 2. The decisions

| # | Decision | Why |
|---|---|---|
| K1 | **No second evidence store.** The sealed evidence bundle is the outbox; Kosli is the record. Nothing else persists attestations | Two records disagree eventually, and the one the agent can edit wins the argument |
| K2 | **The seal gate's external anchor is a Kosli attestation id.** A recomputed hash chain without one fails `evidence-seal-check` | A chain the agent can rebuild from scratch proves consistency, not custody |
| K3 | **Gate definitions have one source.** The Kosli policy and the custom attestation types compile from `docs/governance/control-catalog.json` and carry its sha256 | `ci-catalog-check` already refuses a second gate list; a hand-written policy would be one |
| K4 | **Every attestation carries a signed actor record** (human or agent, with the agent's model pin) made with the harness's own attestation core | Kosli treats actors alike; the Loom's four-eyes and no-self-attestation rules need the actor to be legible |
| K5 | **Agents read Kosli before they plan**, through a read-only server; nothing writes to Kosli except the gate runner's attest step | Least privilege: a reviewer that could write the record could close its own finding |
| K6 | **Deploy onward is Kosli's.** Environment snapshots, drift, runtime evidence: the Loom's deploy lane *reads* the snapshot and never re-implements it | The Loom is a build-time frame (`SKILL.md` limits); pretending otherwise is the claim the method refuses to make |
| K7 | **Shell out to the official CLI; never re-implement the API** | The CLI is the supported surface; auth and fingerprinting stay Kosli's |
| K8 | **Unit tests pass without a Kosli org** (a record/replay fake); integration runs only with a token | An adopter's CI cannot depend on a SaaS being reachable to know its own gates pass |
| K9 | **Kosli is a provider, never a dependency.** The control is HG-0003, a record outside the tree the agent edits; `external_record` is a provider role in `adapters/providers/roles.json`, chosen in `provider-selection.json` and required by the base profile at high tier. `core/external-record.mjs` is the only seam; `core/providers/kosli.mjs` is the first adapter; a WORM store with RFC 3161 timestamps, a transparency log, or a bank's own evidence platform are others. Unmounted, every seam call is a named no-op and the status report says so | HG-0008 says roles, never vendors; a bank that already runs an evidence platform adopts the Loom without buying a second one, and the Loom stays the deliverable |

## 3. What crosses the seam, and in which direction

```
  Loom → Kosli (write, one path)                   Kosli → Loom (read, one path)
  ─────────────────────────────                    ────────────────────────────
  intent · problem-selected · D-gate results       trail status and gaps (next-story)
  risk-class (compiled tier + plan hash)           last failures (next-story, change-watch)
  spec-locked · gate results per lane              environment snapshot (deploy lane)
  review (reviewer agent, loom.agent-output/v1)    attestations cited by risk-reviewer /
  accepted (PA1 · PA2 · release hold)                change-watch in their evidence_refs
  discovery-stopped · reopened-discovery
  evidence seal (anchored to the attestation id)
```

Every write is an envelope: the artifact the Loom already produces, signed, with the actor
record. Every reviewer agent's write is its `loom.agent-output/v1` block (`agent-runtime.md`
governs the agent; `agents/agent-output.schema.json` governs what it says), so the record
carries the verdict, the confidence and the evidence refs, not a paraphrase.

## 4. What the Loom keeps that Kosli does not hold

- The **compiled control plan** and its hash: the route is the Loom's decision, Kosli records
  that it was followed.
- The **registers**: obligations, data risks, controls, the model manifest, identities. Kosli
  cites their ids; it is not where they live.
- The **decision log**: the agent's reasoning, replayable. Kosli holds the outcome.
- The **discovery run**: the left diamond's artifacts stay in `discovery/runs/`; the trail
  carries the run's slug and its gate verdicts.

## 4b. What is already built ahead of the call (phase 2 prep)

Four pieces of the seam never touch the Kosli CLI, so they exist before the seven questions
are answered:

- **The actor record** (row 2.1): an agent identity in `identities.json` declares its model
  pins, its harness role and its tool permissions; the registry gate cross-checks the pins
  against the model manifest, and a service identity that runs no model says so. An acceptor
  resolves through the same registry rule as an approver.
- **The risk-class record** (row 2.8): `core/risk-class-attestation.mjs` builds, signs and
  verifies the compiler's decision as it leaves the tree — tier, plan hash, profile inputs,
  flags, classifier. `scripts/risk-class-attest.mjs` writes it beside the envelope.
- **The two loop attestation types** (row 2.14): `discovery-stopped` from a run's `outcome.md`
  and `reopened-discovery` from an operations signal routed `discovery`, in
  `core/loop-attestations.mjs`.
- **The seam and its double**: `core/kosli-cli.mjs` is the only module that will ever invoke
  the binary, and `core/kosli-fake.mjs` records every invocation and replays canned answers,
  so the rest of phase 2 has a CI harness waiting (decision K8).

Each record is signed with the one attestation stack and refused as evidence while unsigned.

## 4c. What phase 2 rows 2.2–2.6 shipped (13 September 2026)

- **The role and the seam** (row 2.2): `external-record` is a role in
  `adapters/providers/roles.json` with two offers (`kosli`, `transparency-log`); the
  `regulated-bank` profile requires the capability at high tier; `core/external-record.mjs`
  is the only module the harness calls — `status`, `post`, `resolve`, `trailStatus`,
  `flushOutbox` — and `core/providers/kosli.mjs` the only place a Kosli command is spelled.
  Unmounted is a named no-op everywhere. The verified CLI surface is `docs/kosli-surface.md`.
- **The envelope and its rules** (row 2.6): `core/provenance.mjs` builds, signs and judges the
  `loom.record-envelope/v1` envelope — PR1 tool run, PR2 no self-attestation, PR3 not narrated,
  PR4 human acceptance, PR5 timestamps, PR6 runner identity. The seam refuses before it posts;
  `scripts/provenance-check.mjs` (catalog `RECORD-PROVENANCE`) refuses what is still in the
  tree — the outbox `.loom/record-outbox/` and the copies kept beside the evidence.
- **The trail** (row 2.3): one trail per change envelope on the delivery flow, one per run on
  the discovery flow; `begin trail` is idempotent; `scripts/record-trail-status.mjs` prints
  expected (from the catalog) against present (from the provider).
- **Posting** (row 2.4): `core/gate-runner.mjs --record` posts each executed mechanism's row
  as a signed `gate` record on every implicated change's trail, and writes the run record's
  `external_record` block; `scripts/record-flush-outbox.mjs` retries what the provider refused.
- **The anchor** (row 2.5): `scripts/seal-evidence.mjs --record` posts the `seal-anchor`
  envelope and writes `manifest.external_record { provider, id }`; when a plan requires the
  capability and a provider is mounted, `scripts/evidence-seal-check.mjs` resolves that id at
  the provider and fails a fabricated one, a mismatched provider, or a different anchor.

Still ahead: the type and policy compilers (2.9), environments (2.10), the read-only server
(2.11), the audit package (2.12), and the refusal half of question 2 (2.7), which waits on the
18 September call.

## 5. Open questions — answered before phase 2 builds

| # | For Kosli | It gates |
|---|---|---|
| 1 | Residency: where the trail and the evidence vault live; onshore or self-hosted option | the HG-0011 claim |
| 2 | Can an approval be refused when the approver is an agent identity | `accepted`; without it the no-agent-approver rule is one-sided |
| 3 | Can an attestation carry and verify the CI runner's OIDC token | the runner-identity rule |
| 4 | Attestation retrieval by name on a trail | the no-self-attestation rule read back |
| 5 | Policy surface: `kosli evaluate` with Rego, environment policies, or both | the policy compiler |
| 6 | Custom attestation type versioning when a gate's output schema changes | the type compiler |
| 7 | Answers API, or UI only | the read-only server |

## 6. Limits

- Kosli's chain of custody starts at the first commit. Everything before it — intent,
  requirement, risk decision, who or which agent decided — is the Loom's to produce and sign.
  The seam carries it across; it does not exist in Kosli otherwise.
- A record is not a control. Kosli proving a gate ran does not prove the gate was right;
  `bank-grade-gap.md`'s five states still apply to every row, and *platform enforced* still
  needs the platform observed refusing a bypass.
- The FINOS SDLC controls catalogue ids the obligations register cites (`mi-4`, `mi-20`)
  are draft mitigations with no implementation pattern; contributing the Loom's as one is
  hardening-plan row 3.7, co-authored, and not part of this seam.

## Cross-references

- `core.md` — "Where Kosli sits", the two-page summary this appendix expands.
- `governance.md` — HG-0003 (sealed evidence) and the enforcement-of-record rule.
- `delivery-harness.md` — the seal step and the merge policy the trail records.
- `operations.md` — the signal types that become `reopened-discovery` attestations.
- `agent-runtime.md` — the reviewer as a governed model; the output the trail carries.
