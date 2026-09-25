# The Meridian scenario — one obligation, traced

The fixture set behind `node demo/run-demo.mjs --scenario meridian`, prepared for the Kosli
founder demonstration (`docs/plans/kosli-founder-demo-briefing.md`, "Develop": one obligation
translated into an acceptance condition, an agent task and an executable check).

Everything here is **fictional planning** for the invented institution Meridian Trust. The
obligation cites Meridian's own internal policy, not a regulation. Nothing is added to the
shipped templates; the demo registers these files in the *adopted* scratch tree only.

| File | Role in the walk | Evidence status |
|---|---|---|
| `mount.mjs` | Mounts the scenario into an adopted tree: registers, obligations, the control, both discovery runs, the Meridian brand as `discovery/brand/design.md` | — |
| `open-finance-obligations.json` | The Open Finance obligations Meridian meets in Define (participation, consent, personal data, security and certification, resilience and outsourcing) with their register rows. Sources named; **articles deliberately not cited** — verify against the current Regulation and Standards before the meeting | fictional planning |
| `discovery-run/` | The run `cross-bank-money`: research log (S-001–S-011), synthesis (T-1–T-4), problem statement (H1–H3), data-governance feasibility citing the obligations by id, prototype brief + `specs/wireframe.prototype.json` rendered to `wireframe.html` under the Meridian brand, stakeholder reaction (digest-bound), hand-off. D1–D9 green | executed local check |
| `discovery-run-stopped/` | The alternative ending `cross-bank-money-stopped`: same signals, a customer panel that refuted H2, and `outcome.md` — a STOP decided by a human product owner, from which the `discovery-stopped` record is built | executed local check |
| `portfolio/portfolio.json` | Meridian's whole discovery portfolio as an oversight surface reads it: six runs, each with owner, strategic intent (`SI-*`, resolved in the BrainKit's `strategy.md`), product profile, status, stage, and the **exact gate state it is expected to be in** | executed local check |
| `portfolio/plain-language-decline/` | `SI-02`, `ai-decision-system`. Stages 1–5 recorded; the wireframe has been shown but nobody has reacted yet, so **D9 is open** and nothing else is | executed local check |
| `portfolio/sme-overdraft-decision/` | `SI-01`, `lending`. Problem framed and frozen (D1–D5 green); data-governance feasibility is the next record, so **D6 and D8 are open** | executed local check |
| `portfolio/home-finance-top-up/` | `SI-04`, `islamic-product`. Synthesis written; theme T-2 is a workshop assumption with no signal behind it, so **D5 fails** — the worked example of the gate refusing an unsourced theme | executed local check |
| `portfolio/salary-advance/` | `SI-03`, `consumer-lending`. Opened from operations signal `OPS-2026-0918`; four signals, nothing synthesised yet | executed local check |
| `portfolio/portfolio-obligations.json` | The rows the portfolio cites beyond the Open Finance set: `DR-5.1-001`, `CTRL-005`, and Meridian's internal explanation policy `OB-AE-MTPOL-EXPL-001` (fictional, not a regulatory citation) | fictional planning |
| `portfolio/operations-signal.json` | `OPS-2026-0918`, routed `discovery`, linked to `salary-advance` | fixture |
| `scenario.test.mjs` | Adopts a scratch tree, mounts the scenario, requires D1–D9 on both walk runs, the D4 refusal, a well-formed stop record, green register gates, every portfolio run in exactly its declared gate state, every cited `SI-*` approved in the BrainKit strategy, and the operations signal routed and traceable | executed local check |
| `obligation.json` | The obligation `OB-AE-MTPOL-PSI-001`, its data-risk register rows (`DR-2.1-001`, `CTRL-002`) and the demo-scoped catalog control `PAYMENT-STATUS` | fictional planning |
| `payment-status-check.mjs` | The executable check (`PSI-R01`–`PSI-R06`): a timeout resolves to *unknown*, the reference is preserved, a status query precedes any retry, and a recorded negative test is digest-bound | executed local check |
| `payment-status-check.test.mjs` | The control's own negative test (`test_ref`) | executed local check |
| `status-contract.first-cut.json` | The AI-assisted team's first reading: timeout → *failed*, automatic retry. **Refused.** | fixture |
| `agent-run/` | A bounded agent task that was run once (14 Sep 2026) against the first cut: `task.md` (the brief and its boundaries), `output/payment-initiation.status-contract.json` (the repair it produced, the only repaired contract), `transcript.md` (its final report, verbatim), `run.json` (digests of task, inputs and output; model declared, not attested; per-call tool log not captured). The demo replays the output after checking the digests and re-executes the check over it | recorded agent run |
| `payment-status-tests.json` | Synthetic negative-test evidence the contract cites by sha256 | fixture |

What the walk then shows: the gate runner posts the `PAYMENT-STATUS` result to the provider with
`controls.institution` carrying the obligation id (filled by `core/record-controls.mjs`, never
typed), and `scripts/record-join.mjs CHG-2026-0042 --obligation OB-AE-MTPOL-PSI-001` prints the
one inspectable join — mandate, obligation, catalog digest, change, commit, artifact, check,
producer, signature, approval, external record — each row marked VERIFIED, DECLARED,
RESOLVED · SIMULATED (the fake) or RESOLVED · LIVE (`--real`), or NOT CHECKED.

On stage, run it as `node demo/run-demo.mjs --scenario meridian --pause --keep`: `--pause` stops after
every step until Enter (`q` stops the walk), and `--keep` leaves the adopted tree behind so the wireframe,
the repaired contract and the join page can be opened in a browser after the walk. Without a terminal on
stdin the flag is announced and ignored, so CI never blocks.

A recorded run is a run that happened once and was kept, not a live agent on stage: the demo says so on the step. The boundary the check prints on every run is the boundary of the demo: it validates a declared
contract and a recorded test. It does not observe a payment system, a participant bank or the
platform's status API, and it does not make the Open Finance proposition a running service.
