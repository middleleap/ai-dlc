# Agent task — repair the payment-initiation timeout contract (bounded)

You are the delivery agent on Meridian Trust's payment-initiation service. The gate
`scripts/payment-status-check.mjs` (control PAYMENT-STATUS) has REFUSED the service's declared
timeout contract. Your task is to repair the contract so it satisfies obligation
OB-AE-MTPOL-PSI-001 and passes the gate, and nothing else.

## Inputs (read-only)
- `obligation.json` — the obligation, its register rows and the control definition
- `payment-status-check.mjs` — the executable check (rules PSI-R01..R06)
- `status-contract.first-cut.json` — the contract as refused
- `payment-status-tests.json` — the recorded negative-test evidence the contract cites

## Boundaries
- Write exactly ONE file: `agent-run/output/payment-initiation.status-contract.json`.
- Do not edit the check, the test, the evidence file, the obligation or the register.
- Do not change `negative_test.ref` or `negative_test.sha256` — the evidence is what it is.
- Do not add fields the check does not read; keep `schema`, `service_id`, `obligation_ids`.
- Explain each change in one line, citing the rule it answers. No other output.
