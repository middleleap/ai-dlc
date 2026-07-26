# The freeze worked example (Factory Floor WS4 · D4.1)

One discovery artifact that was **actually frozen** from a collaboration surface, kept beside the
stamp that vouches for it. It exists so `scripts/freeze-stamp-check.mjs` has something real to
verify in CI, rather than passing vacuously on a repository that has frozen nothing.

## What is here

| File | What it is |
|---|---|
| `data-governance.md` | The exported artifact — the bytes a D-gate reads |
| `data-governance.freeze.json` | The stamp: the digest of exactly those bytes, and who exported them when |

CI stages them into the adopted layout as `discovery/runs/accounts-elsewhere/data-governance.md`
and `discovery/runs/accounts-elsewhere/.freeze/data-governance.json`, then runs the gate. Change a
single character of the markdown without re-freezing and the build fails — which is the entire
point, and is worth more as a live test than as a sentence in a design document.

## Where it came from

Alpha Islamic Bank, `accounts-elsewhere` — a **simulation**. Alpha does not exist; every name,
figure and rating in the artifact is synthetic. The walkthrough that produced it is
`docs/notion-floor-alpha-walkthrough.md` in the marketplace repository.

The stamp's `source` reads `notion:page/alpha-accounts-elsewhere-datagov`, which is a **fixture
id, not a live page**. These bytes were exported from a recorded page shape. A page with the same
content was later authored in a real Notion workspace to check the block types round-trip, but the
export that produced this digest did not come from it, and the stamp says so rather than
borrowing authenticity it has not earned.

## Not shipped to adopters

Like `floor-export-example/` and `approval-attestation-example/`, this is the Loom's own
demonstration data and is deliberately absent from `copy-manifest.json`. An adopter's first freeze
should be their own.
