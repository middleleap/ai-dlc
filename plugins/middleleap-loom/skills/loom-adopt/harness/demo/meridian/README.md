# The Meridian scenario — one obligation, traced

The fixture set behind `node demo/run-demo.mjs --scenario meridian`, prepared for the Kosli
founder demonstration (`docs/plans/kosli-founder-demo-briefing.md`, "Develop": one obligation
translated into an acceptance condition, an agent task and an executable check).

Everything here is **fictional planning** for the invented institution Meridian Trust. The
obligation cites Meridian's own internal policy, not a regulation. Nothing is added to the
shipped templates; the demo registers these files in the *adopted* scratch tree only.

| File | Role in the walk | Evidence status |
|---|---|---|
| `obligation.json` | The obligation `OB-AE-MTPOL-PSI-001`, its data-risk register rows (`DR-2.1-001`, `CTRL-002`) and the demo-scoped catalog control `PAYMENT-STATUS` | fictional planning |
| `payment-status-check.mjs` | The executable check (`PSI-R01`–`PSI-R06`): a timeout resolves to *unknown*, the reference is preserved, a status query precedes any retry, and a recorded negative test is digest-bound | executed local check |
| `payment-status-check.test.mjs` | The control's own negative test (`test_ref`) | executed local check |
| `status-contract.first-cut.json` | The AI-assisted team's first reading: timeout → *failed*, automatic retry. **Refused.** | fixture |
| `status-contract.repaired.json` | The repaired contract. The demo script writes it — a *scripted repair* standing in for an agent task, and labelled as such on screen | fixture |
| `payment-status-tests.json` | Synthetic negative-test evidence the contract cites by sha256 | fixture |

What the walk then shows: the gate runner posts the `PAYMENT-STATUS` result to the provider with
`controls.institution` carrying the obligation id (filled by `core/record-controls.mjs`, never
typed), and `scripts/record-join.mjs CHG-2026-0042 --obligation OB-AE-MTPOL-PSI-001` prints the
one inspectable join — mandate, obligation, catalog digest, change, commit, artifact, check,
producer, signature, approval, external record — each row marked VERIFIED, DECLARED,
RESOLVED · SIMULATED (the fake) or RESOLVED · LIVE (`--real`), or NOT CHECKED.

The boundary the check prints on every run is the boundary of the demo: it validates a declared
contract and a recorded test. It does not observe a payment system, a participant bank or the
platform's status API, and it does not make the Open Finance proposition a running service.
