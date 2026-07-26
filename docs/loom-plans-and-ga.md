# The two Loom plans, and what "GA" actually requires

**Status:** note · **Date:** 2026-07-26 · **Recorded at:** `middleleap-loom` 2.0.0-rc.16
**Companions:** `loom-control-plane-plan.md` · `notion-floor-plan.md` · `loom-2.0-baseline.md`

Two plan documents advanced the Loom in parallel and are now unified at **rc.16**. This note
says how they relate (so neither reads as a competing fork), and states plainly what still
stands between rc.16 and a defensible "GA / certified" — all of it adopter-side by construction.

## 1 · The two plans are a backbone and a surface, not two forks

Both descend from the same `loom-2.0-plan.md` foundation and share the same non-negotiable
disciplines: **git is the system of record · observed, not declared · agents approve nothing ·
no new gates before the control-plane foundations land.** They address different halves of the
same system.

| | `loom-control-plane-plan.md` (the backbone) | `notion-floor-plan.md` (the surface) |
|---|---|---|
| **Question it answers** | Are the greens *true*? Is what shipped what was evaluated, approved and deployed? | Can non-technical teammates *participate* — product, second line, stakeholders — without a control leaving git? |
| **Scope** | WS1–WS8: artifact-bound evidence, platform observation, compiler-bound regulated policy, runtime-neutral guardrails, adoption state machine, continuous-assurance cases, BrainKit estate, comprehension | The Notion "floor": guided discovery/approval surfaces projected back to git by PR — exporter, freeze-stamp, drift, webhooks, decision routing, floor operations |
| **Relationship to the other** | Provides the gates the floor's decisions must satisfy | A human collaboration layer *on top of* the backbone; explicitly cites it as an inheritance |

They are complementary layers of one method: the control plane makes assurance *true*, the
floor makes it *usable*. The Factory Floor plan is authored against the control-plane gates, not
around them.

### Where they already cross-pollinate (rc.16)

- **The PA gate is the shared seam.** The floor's decision-routing (WS5) extends the same
  `product-approval-check` the control-plane plan compiles PA1/PA2 into — with subject-bound
  human assertions so a signature authenticates the *approver*, not the transcribing bridge.
- **Egress graduated through platform-activation.** Main's agent-egress control (HG-0011/HG-0012)
  is now a recognised `egress_proxy` mechanism in `platform-activation-check` — it earns
  `platform-enforced` by the *same* rule as branch protection: a bypass test proving the platform
  refused a route around it.
- **One honesty invariant governs both.** Neither track ships a `platform-enforced` or
  `organisationally-enforced` control; both record what is adopter-side as `absent`/`adopter_side`
  in the single control catalog.

### The one thing to keep true going forward

They now share the plugin's **rc version line** (reconciled at rc.16; see the baseline's rc.16
addendum). Keep it a single monotonic line — one release train, two workstream families — rather
than letting each track number independently again. The control catalog and the generated
scorecard are the single state of record for both.

## 2 · The adopter-side GA criteria

rc.16 is a **release candidate, not a certification**. Adoption of the Loom is not, and does not
substitute for, regulatory approval. Everything below is out of a plugin bundle's reach by
construction — the machinery to satisfy each is built and negative-tested; earning it needs an
adopter's live platform, people, and evidence. These are the `adopter_side` rows of the control
catalog (13 of 57 controls at rc.16), grouped by what they need.

### a. Live platform activation (flips controls to `platform-enforced`)
The bundle ships **0** platform-enforced controls by design. Each of these becomes platform-
enforced only via a signed, fresh, independently-observed activation record with a passed bypass
test (`platform-activation-check`):
- **HG-0004** — least-privilege agent identity, vaulted secrets, no shared credentials.
- **HG-0005** — environment promotion with rehearsed rollback + change-ticket linkage.
- **HG-0011** — residency-controlled model traffic, pre-egress DLP, attested execution (the
  `egress_proxy` mechanism is ready; it needs a live gateway observed refusing a bypass).
- **ROUTINE-CONTROLLER** — auto-merge enabled by a bot identity disjoint from the coding agent,
  wired to a real merge-queue ruleset.

### b. The three lines of defence as *functions*, not just mechanisms
The mechanisms ship; the organisationally-separate people operating them are the adopter's:
- **HG-0010** — a named accountable executive with cease-use authority.
- **MRM-FN** — an organisationally-separate model-risk function owning validation + monitoring.
- **2L-CHALLENGE** — an independent second-line challenge function (people, mandate, veto). The
  release-hold *mechanism* ships; the function operating it is theirs to stand up.
- **3L-AUDIT** — internal-audit read access and independent re-performance of the evidence
  assessment.

### c. Real-data and external-assurance surfaces the harness deliberately does not include
- **REAL-PII-SURFACE** — KMS, field encryption, tokenization, access logging (the harness is
  synthetic-only by design).
- **WORM-EVIDENCE** — external WORM + RFC-3161 timestamped retention, independently examinable
  (the seal is tamper-evident and anchor-checkable; the immutable store is the adopter's).
- **DAST-PENTEST** — dynamic application security testing + penetration testing (the bundle stops
  at SAST/SCA output validation).

### d. The proofs the method has not yet earned
- **SUPERVISED-PILOT** — a supervised production pilot on real, bounded, reversible scope
  (the pilot playbook + adversarial checklist ship; running it is the adopter's).
- **LIVE-EXAM** — a live regulator examination of the method in production.

### e. And one repo-side item that is not a control
- **The ofbo back-port.** Every gate change through rc.16 must be back-ported to the `ofbo`
  worked example (no automated sync exists). It is not in this catalog because it is the Loom's
  own maintenance obligation, not an adopter's control — but it gates calling rc.16 "done"
  across the estate.

## 3 · The honest one-line status

The Loom's *machinery* for a verifiable delivery control plane is complete and self-consistent at
rc.16 (43 of 57 controls mechanically-validated, F1–F8 all closed, 1224 tests green). Its
*institutional operation* — live enforcement, three independent lines, real-data controls, a
supervised pilot, and an examination — is the adopter's, by design and stated as such. rc.16 is a
strong release candidate; certification is earned in production, not in a bundle.
