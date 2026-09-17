# The Loom for Kosli's founders — Meridian Trust, one intervention

v3 · 17 September 2026 · private · recommendation, not a commitment. Audience: James Logan and Mike Long. Slot assumed 25 minutes; confirm. Supersedes v2 (14 September): the walk is now 27 steps with both loop ends, the NPA records and a verified runner, and this version names the two surfaces and the step numbers to dwell on.

## What the meeting is for

Show the Loom, and let James and Mike see it as the natural extension of Kosli: **the Loom produces the decisions, obligations and constraints that Kosli's record then keeps.** Kosli begins its custody when there is something to attest; the Loom is where that something is made — in discovery, which Kosli does not have and does not want to own. Delivery is shown only to prove the join is real. The trail is longer at both ends: it starts at the sponsor's intent, and it does not end at deploy.

The ask: a bounded joint evaluation — one bank-style obligation, one real Kosli sandbox trail, one refusal, one repair, four weeks, one product sponsor and one control owner from a bank we both know. Not a product decision, not an OEM conversation. The sandbox org is the practical point: `app.kosli.com` has no self-serve sign-up, so the evaluation starts with an invite from Kosli.

## The two surfaces

| Surface | What it is | Used for |
|---|---|---|
| **The pitch page** — *Upstream of the Record* | The brand-styled argument: six stages, K1–K9, what the record gains, the Meridian proof, the ask. Current with `main` as of 17 September. | On screen for the opening and the close; the join table on it is the fallback if the terminal misbehaves |
| **The walkthrough** — `docs/the-loom-walkthrough.html`, toggle *Business: matter in everyday money decisions* | 13 narrated slides, role-filterable — Intent, Gate 1, Spec, Prototype, Case, Gate 2, then Branch through Gate 4 and Learn — telling the Meridian story without a terminal | Minutes 2–13: slides 1–6 (discovery and define); slide 13 (Learn) at the close |
| **The terminal** — `node demo/run-demo.mjs --scenario meridian --pause --keep` | The executed walk. `--pause` stops after every step until Enter (`q` stops); `--keep` leaves the adopted tree so its artifacts open in a browser | Minutes 13–22: develop, deliver, run, the join |
| **The private illustration** — loom-private-demo, behind the gateway | The hosted, read-only rendering of the same scenario | The leave-behind link, sent after the call, never shown live |

Serve the walkthrough from the repository root with `python3 -m http.server 8766 --bind 127.0.0.1` (port 8080 is taken on this machine) and open `/docs/the-loom-walkthrough.html`. Run the terminal from `plugins/middleleap-loom/skills/loom-adopt/harness`.

## The customer

Meridian Trust is fictional, but it is *our* bank: a large Middle East retail bank with several product teams, existing CI/CD and security tooling, formal control owners, an innovation mandate from the top, and a delivery organisation that has learned to say no. We both know what getting a bank like that to adopt a new approach costs. That shared experience is the plausibility of the story; the story itself stays fictional and names no real institution's policy or approval.

The business problem: the retail sponsor wants to matter in customers' everyday money decisions. Customers hold accounts, cards and loans at four banks; Meridian sees one slice. The sponsor's hypothesis is a personal-finance view with the ability to move money — which is an Open Finance proposition, with every regulatory consequence that carries.

## The story in five decisions

| | Meridian decides | The Loom's contribution | What Kosli receives (all posted by the walk today) |
|---|---|---|---|
| **Discover** | Is this problem worth discovery at all? | A run, not a project: research log, signals, synthesis (D2 evidence-gated, D5 traceable themes), a falsifiable problem statement (D1), a **no-solutioning** boundary (D4) that keeps the sponsor's app idea out of the problem. A stop is a legitimate outcome. | `intent` (the sponsor's own words, a human actor), `problem-selected` (H1–H3, the choice, the D4 refusal on record) — or `discovery-stopped` on the twin run |
| **Define** | PFM alone, or is customer-initiated payment essential? Under which obligations? | **Data-governance feasibility (D6)**: the direction must cite the obligations register and the data-risk register before anyone builds. This is where the Open Finance regime enters — as obligations with owners, not as a lecture. Three solution directions, two killed (HG-0009). Disposable prototype (D8), stakeholder reaction (D9), hand-off. **The NPA is the content of PA1**: the Business Proposition Form is read (33 fields), digested and attested; the approval is attested by the approver. | `npa-pack`, `npa-approved.pa1`; `risk-class`, `spec-locked`, the hand-off's gate verdicts. An agent trying to record the PA1 approval is **refused** |
| **Develop** | What must the implementation preserve? | One obligation — payment-status integrity — compiled into a control with an executable check. The AI-assisted team's first contract is **refused**; a recorded bounded agent run repairs it; the check is re-run. | every gate result, signed, carrying the obligation id |
| **Deliver** | Is there enough trustworthy evidence for the next authorised step? | The sealed bundle anchored to a Kosli attestation; forged ids and unsigned envelopes refused before posting; the route policy compiled from the catalog into Kosli's form. The CI runner is **verified**, not declared: its OIDC token rides in the record and is checked against GitHub's keys (on the platform; on a laptop the runner is hand-named and stays DECLARED, honestly). | the anchor, the trail, the policy evaluation, the runner row |
| **Run** | Is the approved software running, and is the service helping? | Deploy-lane reads what is *running* from Kosli's snapshot; an operations signal (OPS-2026-0912: with the view in use, customers still cannot tell whether a transfer completed) is routed back into discovery. | environment snapshot out; `reopened-discovery` in, attributed to the change that shipped |

## The Open Finance obligations Meridian meets in Define

Walked as register entries, one line each, owner named. **Article numbers are still blank in the register by design.** Candidate citations for all six, fetched from the in-force Regulation (C 03/2025), the Standards and the community hub, with confidence marks, are in `docs/plans/meridian-obligations-citations-2026-09-16.md`; they go into `open-finance-obligations.json` only when the four owners (compliance, data protection, operations ×2) confirm. Until then say "verified against the current Regulation, cited on confirmation", not a number from memory.

- Participation and licensing: Meridian as LFI (data provider, payment executor) and, for the PFM view, as TPP — two roles, two obligation sets.
- Consent lifecycle: capture, scope, duration, revocation, and the customer's view of it; AlTareq CX rules and screen certification.
- Security and API conformance: FAPI-grade profile, mTLS, the Standards version in force, functional and security certification, live proving.
- Payment initiation: authorisation, status and reconciliation, the liability model between TPP, LFI and platform — and the specific obligation we trace: a timeout is never a failure. The Standards carry no timeout rule, which is why `OB-AE-MTPOL-PSI-001` is Meridian's own policy.
- Data protection and residency: personal data classification, lawful basis, retention, cross-border limits (PDPL article numbers are secondary-sourced until a human confirms).
- Operational resilience and outsourcing: incident, availability, third-party risk for the platform dependency (whether a mandated national platform counts as outsourcing is an owner question).

Each is a register row → risk → control → gate. That chain is what the join table shows for one of them.

## Run of show (25 minutes)

| Min | Surface | Beat | Tag |
|---|---|---|---|
| 0–2 | Pitch page, top | "You are Meridian's platform leadership." The problem, the sponsor's idea, three chairs: sponsor, platform owner, control owner. One sentence on the thesis: Kosli keeps what happened; the Loom is where it is made. | fictional planning |
| 2–8 | Walkthrough, slides 1–2 | Intent → research log and signals → synthesis → problem statement. Show D4 refusing the app idea in the problem statement. Show the stop outcome. **This is the part Kosli does not have; spend the time here.** | executed local check |
| 8–13 | Walkthrough, slides 3–6 | Data-governance feasibility citing the six obligations; the three directions; the prototype (open `wireframe.html` from the kept tree: Meridian brand, synthetic numbers, H3 greyed) and the reaction. Slide 5 (Case) is the NPA pack read from the form; slide 6 (Gate 2) is the PA1 approval attested by a human — say that the terminal refuses the agent's attempt at step 15. End on the hand-off: what the AI-assisted team receives. | executed local check |
| 13–18 | Terminal, paused | Steps 9–11: the first contract refused, the recorded agent repair (say "recorded, not live"), the rerun passes and the check prints its own boundary. Steps 16–20: the seal refuses until the anchor is recorded; every gate result posted with the obligation id; the outbox empty; the trail read back. | executed / recorded agent run / simulated provider |
| 18–22 | Terminal → browser | Steps 22–23: the deploy lane reads what is running; the operations signal reopens discovery. Steps 25–27: two refusals, then the join. Open `CHG-2026-0042.join.html` from the kept tree. Say once: "this is the fake; the harness is proved, Kosli is not." | simulated provider |
| 22–25 | Walkthrough slide 13, then the pitch page's ask | Where should the Loom stop and Kosli take responsibility? The seven open questions; the sandbox invite; the four-week evaluation. | — |

**Pacing the terminal.** Run the walk once *before* the call with `--keep` and note the tree path; the wireframe and the join page come from that tree. During the call run it again with `--pause --keep` and press straight through the plumbing (steps 1–2, 6–8, 12, 21, 24) — they take a second each — and stop on the beats above. If the terminal run is not wanted at all, the kept tree plus the walkthrough carry every beat; the pitch page's join table is the last resort.

**15-minute slot:** 0–2 · walkthrough slides 1–2 compressed to four minutes · terminal steps 9–11 and 25–27 · the join page · the ask.

## What to open from the kept tree

Paths are relative to the directory the walk prints as "tree kept at".

| Artifact | Path | Shown at |
|---|---|---|
| The prototype under the Meridian brand | `discovery/runs/cross-bank-money/wireframe.html` | 8–13 |
| The problem statement with the D4 boundary | `discovery/runs/cross-bank-money/problem-statement.md` | 2–8 |
| The refused first cut (fixture, not in the tree) | `demo/meridian/status-contract.first-cut.json` in the harness | 13–18 |
| The repaired contract | `docs/governance/services/payment-initiation.status-contract.json` | 13–18 |
| The six discovery-side records as Kosli receives them | `docs/governance/evidence/records/cross-bank-money-*.json` | 8–13, 18–22 |
| The join | `docs/governance/audit/CHG-2026-0042.join.html` | 18–22 |
| The audit package | `docs/governance/audit/CHG-2026-0042.html` | if asked |

## Objections, one line each

- *Is this another governance platform?* No — the record is Kosli's; the Loom is what happens before there is anything to record, and it hands Kosli better inputs.
- *Why isn't this a Kosli feature?* Discovery, institutional context and domain interpretation are the bank's and its advisor's to own; Kosli should not want to be the method.
- *Can the agent mark its own work compliant?* Show the PR2/PR4 refusals and the PA1 refusal; say that authenticated approval is the bank's platform, not a field in a file.
- *Does this add approval overhead?* One human state transition on a green lane of 54 mechanisms (the count the pr lane executed on 17 September); routine changes ride a pre-approved pattern.
- *Does Kosli prove the payment is safe?* No, and the check says so on screen (PSI-R06). A record is not a control.
- *Is the runner real?* On the platform, yes: the token is verified against GitHub's keys on every CI run since 2.4.7. On this laptop the row says DECLARED, and the join page says why.

## Evidence legend (on every screen)

fictional planning · executed local check · recorded agent run · simulated provider · verified external record. Say the `simulated provider` caveat once, then let the chips carry it.

## To prepare, in order

1. ~~A worked Meridian discovery run~~ **Done** (`demo/meridian/discovery-run/` and `discovery-run-stopped/`; D1–D9 green, the D4 refusal, the stop).
2. ~~Open Finance obligation rows~~ **Done**; articles blank by design. ~~Candidate citations~~ **Done** (16 September); **owner confirmation pending** — do not fill the register before it.
3. ~~Private illustration~~ **Done**: regenerated from ai-dlc `25be82e`, deployed on Railway behind the gateway; the sync check runs daily. Still to do by hand: open both hosts once after the rollout and confirm anonymous → login and an authenticated session.
4. ~~Verify the Kosli citations~~ **Done** in the pitch page and the seam reference; nothing stale found on 17 September.
5. Sandbox org: **no self-serve route exists** — ask for the invite on the call and set `KOSLI_API_TOKEN` in the shell, never in a file or a prompt. Once granted, run `--real` once and send the LIVE join page as the follow-up; if Kosli refuses a step, the refusal goes verbatim into `docs/integration-run.md` and is the finding.
6. Rehearse the walkthrough slides 1–6 aloud twice; rehearse the terminal with `--pause --keep` once against a timer; rehearse the fallback (kept tree + pitch page's join table).
7. Upload the de-identified `islamic-banking-uae` skill to the Claude.ai skills UI so the canonical copy no longer carries a client's name (unrelated to the call; two minutes).

## What exists today

`demo/run-demo.mjs --scenario meridian` — 27 steps, 3 refusals, green in CI on every push: the two discovery runs and their records, the NPA pack and its PA1 approval, the refused first cut and the recorded repair, the seam against the fake, the runner row (VERIFIED in CI, DECLARED on a laptop), the operations signal reopening discovery, and `record-join.mjs`. Live Kosli integration: still owed (`docs/integration-run.md`), blocked on an invite. The operations-queue demo and the second-team exercise stay in the private repository and are not on this agenda.
