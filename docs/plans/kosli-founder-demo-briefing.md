# The Loom for Kosli's founders — Meridian Trust, one intervention

v2 · 14 September 2026 · private · recommendation, not a commitment. Audience: James Logan and Mike Long. Slot assumed 25 minutes; confirm.

## What the meeting is for

Show the Loom, and let James and Mike see it as the natural extension of Kosli: **the Loom produces the decisions, obligations and constraints that Kosli's record then keeps.** Kosli begins its custody when there is something to attest; the Loom is where that something is made — in discovery, which Kosli does not have and does not want to own. Delivery is shown only to prove the join is real.

The ask: a bounded joint evaluation — one bank-style obligation, one real Kosli sandbox trail, one refusal, one repair, four weeks, one product sponsor and one control owner from a bank we both know. Not a product decision, not an OEM conversation.

## The customer

Meridian Trust is fictional, but it is *our* bank: a large Middle East retail bank with several product teams, existing CI/CD and security tooling, formal control owners, an innovation mandate from the top, and a delivery organisation that has learned to say no. We both know what getting a bank like that to adopt a new approach costs. That shared experience is the plausibility of the story; the story itself stays fictional and names no real institution's policy or approval.

The business problem: the retail sponsor wants to matter in customers' everyday money decisions. Customers hold accounts, cards and loans at four banks; Meridian sees one slice. The sponsor's hypothesis is a personal-finance view with the ability to move money — which is an Open Finance proposition, with every regulatory consequence that carries.

## The story in five decisions

| | Meridian decides | The Loom's contribution | What Kosli receives |
|---|---|---|---|
| **Discover** | Is this problem worth discovery at all? | A run, not a project: research log, signals, synthesis (D2 evidence-gated, D5 traceable themes), a falsifiable problem statement (D1), a **no-solutioning** boundary (D4) that keeps the sponsor's app idea out of the problem. A stop is a legitimate outcome. | `intent`, `problem-selected` — or `discovery-stopped` — as signed records on a discovery trail |
| **Define** | PFM alone, or is customer-initiated payment essential? Under which obligations? | **Data-governance feasibility (D6)**: the direction must cite the obligations register and the data-risk register before anyone builds. This is where the Open Finance regime enters — as obligations with owners, not as a lecture. Three solution directions, two killed (HG-0009). Disposable prototype (D8), stakeholder reaction (D9), hand-off. | `risk-class`, `spec-locked`, the hand-off's gate verdicts |
| **Develop** | What must the implementation preserve? | One obligation — payment-status integrity — compiled into a control with an executable check. The AI-assisted team's first contract is **refused**; a recorded bounded agent run repairs it; the check is re-run. | every gate result, signed, carrying the obligation id |
| **Deliver** | Is there enough trustworthy evidence for the next authorised step? | The sealed bundle anchored to a Kosli attestation; forged ids and unsigned envelopes refused before posting; the route policy compiled from the catalog into Kosli's form. | the anchor, the trail, the policy evaluation |
| **Run** | Is the approved software running, and is the service helping? | Deploy-lane reads what is *running* from Kosli's snapshot; operations signals route back into discovery (`reopened-discovery`). | environment snapshot out; a reopen record in |

## The Open Finance obligations Meridian meets in Define

Walked as register entries, one line each, owner named, no article numbers quoted from memory — verify against the current Standards and the `open-finance-uae` skill before the meeting:

- Participation and licensing: Meridian as LFI (data provider, payment executor) and, for the PFM view, as TPP — two roles, two obligation sets.
- Consent lifecycle: capture, scope, duration, revocation, and the customer's view of it; AlTareq CX rules and screen certification.
- Security and API conformance: FAPI-grade profile, mTLS, the Standards version in force, functional and security certification, live proving.
- Payment initiation: authorisation, status and reconciliation, the liability model between TPP, LFI and platform — and the specific obligation we trace: a timeout is never a failure.
- Data protection and residency: personal data classification, lawful basis, retention, cross-border limits.
- Operational resilience and outsourcing: incident, availability, third-party risk for the platform dependency.

Each is a register row → risk → control → gate. That chain is what the join table shows for one of them.

## Run of show

| Min | Screen | Beat | Tag |
|---|---|---|---|
| 0–2 | Presenter block | "You are Meridian's platform leadership." The problem, the sponsor's idea, three chairs: sponsor, platform owner, control owner. | fictional planning |
| 2–8 | Discovery run | The research log and signals → synthesis → problem statement. Show D4 refusing the app idea in the problem statement. Show the stop outcome. **This is the part Kosli does not have; spend the time here.** | executed local check |
| 8–13 | Define | Data-governance feasibility citing the Open Finance obligations; the three directions; the prototype and the reaction. End on the hand-off: what the AI-assisted team receives. | executed local check |
| 13–18 | Terminal | The obligation → control → check. First contract refused. Recorded agent repair. Rerun passes; the check prints its own boundary. | executed / recorded agent run |
| 18–22 | Join table | Mandate → obligation → catalog digest → change → commit → artifact → check → producer → approval → external record, each row VERIFIED / DECLARED / RESOLVED·SIMULATED. Say once: "this is the fake; the harness is proved, Kosli is not." | simulated provider |
| 22–25 | Close | Where should the Loom stop and Kosli take responsibility? Offer the evaluation. | — |

15-minute slot: 0–2, 2–8 compressed to four, 13–18, 18–22.

## Objections, one line each

- *Is this another governance platform?* No — the record is Kosli's; the Loom is what happens before there is anything to record, and it hands Kosli better inputs.
- *Why isn't this a Kosli feature?* Discovery, institutional context and domain interpretation are the bank's and its advisor's to own; Kosli should not want to be the method.
- *Can the agent mark its own work compliant?* Show PR2/PR4 refusals and the publisher boundary; say that authenticated approval is the bank's platform, not a field in a file.
- *Does this add approval overhead?* One human state transition on a green lane of 54 mechanisms; routine changes ride a pre-approved pattern.
- *Does Kosli prove the payment is safe?* No, and the check says so on screen (PSI-R06).

## Evidence legend (on every screen)

fictional planning · executed local check · recorded agent run · simulated provider · verified external record. Say the `simulated provider` caveat once, then let the chips carry it.

## To prepare, in order

1. ~~A worked Meridian discovery run~~ **Done:** `demo/meridian/discovery-run/` (`cross-bank-money`, D1–D9 green under the Meridian brand, wireframe rendered) and `discovery-run-stopped/` (the stop, with its `discovery-stopped` record). `run-demo.mjs --scenario meridian` walks them: nine gates, the D4 refusal of the sponsor's app idea, the stop.
2. ~~Open Finance obligation rows~~ **Done:** `demo/meridian/open-finance-obligations.json` — six obligations with owners and register rows, cited by id from the run's data-governance (D6). **Articles are deliberately blank-by-design; verify each against the current Regulation and Standards before the meeting and fill them in.** Three solution directions (HG-0009) are not yet written as a Solution Direction Record — add if the Define beat needs it.
3. Private illustration: add the presenter block and evidence chips (snippet prepared); regenerate through the export workflow.
4. Verify the Kosli citations the week of the meeting; drop anything stale.
5. Ask for a sandbox org and token; if granted, run `--real` once and send the LIVE join page as the follow-up.
6. Rehearse 2–13 aloud twice; rehearse the fallback (kept tree + static join page).

## What exists today

Delivery half: `demo/run-demo.mjs --scenario meridian` — green PR lane, refusal, recorded agent repair, seam against the fake, `record-join.mjs` — all in this repository, run in CI. Discovery half: `cross-bank-money` and its stopped twin run in the same script and in CI. Live Kosli integration: still owed (`docs/integration-run.md`). The operations-queue demo and the second-team exercise stay in the private repository and are not on this agenda.
