# Product-eval — worked example

The Loom-native shape of "evals are the new product management": a discovery hand-off's
success measures become the eval a release is scored against.

## Files

- `product-evals.json` — the seam (mounts at `docs/governance/product-evals.json`). Product
  `PRD-017`, from the `credit-limit-review` discovery run, with its two D1 success measures
  scored green by a sealed eval bound to a shipping commit.
- `report.json` — the eval artifact (mounts under `docs/governance/evidence/`). Its real
  sha256 is embedded in `product-evals.json`, so the gate re-hashes it and fails on any edit.

## Verify

```bash
# in CI the shipping commit comes from GITHUB_SHA; here it is passed explicitly:
node scripts/product-eval-check.mjs --commit 0123456789abcdef0123456789abcdef01234567
# → every product discovery-linked, measures green, eval fresh. OK
```

## What makes it fail

- a product with no `discovery` link — the measures must trace to a hand-off (D1);
- any success measure with `result != pass` — a regression blocks the release;
- an `evaluated_commit` that is not the shipping commit — the anti-stale control (the product
  analogue of the model-provenance pin-match);
- a `report` whose bytes no longer match its `sha256` — the artifact was altered after sealing;
- a missing eval identity field (`dataset_version`, `runner_version`, `ran_at`).

The eval *rig* — how a measure is actually scored — is the adopter's to build. This gate
enforces that a release cannot claim product-green without a fresh, discovery-linked, sealed
eval. See `../../loom/references/enterprise-rings.md` (the meso ring).
