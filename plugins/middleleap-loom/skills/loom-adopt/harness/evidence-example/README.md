# Evidence bundle — a real worked example (HG-0003)

A **self-contained, tamper-evident release evidence bundle**: a `manifest.json` plus the five
artifacts it seals, with real sha256 hashes and an append-only chain. The delivery loop writes
this at step ⑧. `scripts/evidence-seal-check.mjs` verifies it — and now **re-reads each artifact
and fails on any hash mismatch**, so altering an artifact on disk (not just the manifest) is
caught. Run it:

```bash
cd evidence-example && node ../scripts/evidence-seal-check.mjs
# → Evidence-seal gate (HG-0003) — OK
# corrupt any artifact and it fails: "artifact <ref> was altered after sealing"
```

## What's here

| File | Sealed as | Is |
|---|---|---|
| `manifest.json` | — | the index: one entry per artifact (type, ref, sha256, prev, seal) + `anchor` |
| `tests.json` | `tests` | Q1/Q1b results |
| `reviews.json` | `reviews` | reviewer verdicts (hard-stop, contract-conformance) |
| `lineage.json` | `lineage` | which stores emit lineage (Q4.5) |
| `model-provenance.json` | `model-provenance` | the model-provenance gate result |
| `control-plane.json` | `control-plane` | the control-plane gate result |

Each entry's `sha256` is the real hash of its sibling artifact; `seal = sha256(prev | type | ref |
sha256)` chains them; `anchor` is the final seal. **Publish the anchor** to an external,
append-only, RFC-3161-timestamped store (WORM) so a *fully-recomputed* chain is detectable too —
that external store is the adopter's (see `governance/runbooks/independent-assurance-runbook.md`).

## Mounting / regenerating

On adoption this bundle is copied to `docs/governance/evidence/`. For a real release, replace the
artifacts with your actual evidence and **reseal**: recompute each `sha256`, then re-chain with
`buildChain()` from `scripts/evidence-seal-check.mjs`. The gate fails a release whose manifest and
artifacts disagree, so a bundle can't be edited after the fact without breaking a seal.
