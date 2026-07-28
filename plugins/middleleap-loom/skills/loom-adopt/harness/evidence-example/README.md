# Evidence bundle — a real worked example (HG-0003)

A **self-contained, tamper-evident release evidence bundle**: a `manifest.json` plus the
artifacts it seals, with real sha256 hashes and an append-only chain. The delivery loop writes
this at step ⑧. `scripts/evidence-seal-check.mjs` verifies it — it **re-reads each artifact and
fails on any hash mismatch**, so altering an artifact on disk (not just the manifest) is caught.

**The committed bundle is deliberately refusable (rc.36).** Its anchor is signed by the bundle's
`demo-anchor-signer` and its `release_commit` is fictional — and the gates now refuse both: a
`demo: true` issuer is refused by the one unified attestation stack (D3), and the release commit
must exist in the repository and be an ancestor of HEAD (D5). The chain and semantics still
verify (the `evaluate()` half is exercised by the tests and by CI's derive step); what can no
longer happen is this example passing for a *live* release. That is the point: shipping a bundle
that could pass would be shipping usable trust material. `regenerate.mjs` shows how CI (and a
real adopter) re-derives and re-signs it per run — fresh non-demo key, real commit, public half
into the registry, private half discarded.

```bash
node evidence-example/regenerate.mjs --dest <adopted-repo-root>   # re-derive + re-sign for real
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
artifacts with your actual evidence and **derive** the manifest — never hand-chain it:

```bash
node scripts/seal-evidence.mjs --commit "$RELEASE_COMMIT"   # rc.35 — hashes, orders, chains, anchors
```

The collector re-verifies its own output with the seal gate before writing and refuses a bundle
whose sealed content is bad. The gate fails a release whose manifest and artifacts disagree, so a
bundle can't be edited after the fact without breaking a seal.
