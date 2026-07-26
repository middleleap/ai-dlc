# The adapter-evidence worked example (Factory Floor WS5 · D5.3)

Four evidence-stream declarations, and one **real signed observation** for one of them, so
`scripts/adapter-evidence-check.mjs` verifies something instead of reporting

```
Adapter-evidence gate (D5.3) — no adapters mounted (nothing declares an evidence stream)
```

That line is a green gate that proves nothing — the same hole `freeze-stamp-check` and `drift-check`
each had before a worked example was staged beside them. A gate that has never been given a record
to refuse has not been shown to refuse anything.

## What is here

| Path | What it is |
|---|---|
| `docs/governance/adapters/*.json` | The four D5.3 stream declarations — one adapter, one control, each |
| `docs/governance/control-catalog.json` | A four-control extract, including the `FLOOR-SEAM` control the harness deliberately does not ship |
| `docs/governance/identities.json` | A verbatim subset of `governance/identities.template.json` — the six identities the streams name |
| `docs/governance/attestation-issuers.json` | **Empty on purpose.** No key material ships here, in any form |
| `observe.mjs` | Stages the declarations into a repository root and generates the signed observations |

The directory is laid out as a miniature repository root, like `brainkit-example/`, so the
declaration half runs with no staging at all:

```
cd adapter-evidence-example && node ../scripts/adapter-evidence-check.mjs
cd adapter-evidence-example && node ../scripts/adapter-check.mjs
```

## What the gate says in each state

Run from a staged root — `node adapter-evidence-example/observe.mjs --dest <root>` first.

| State | Output | Exit |
|---|---|---|
| nothing staged (bundle root) | `no adapters mounted (nothing declares an evidence stream)` — **vacuous** | 0 |
| nothing staged (adopted root) | `OK (0 evidence streams: 0 active, 0 declared; 2 pre-D5.3 adapters outside the stream contract)` — the two reference adapters, correctly outside the contract, and still nothing verified | 0 |
| example in a bare root | `OK (4 evidence streams: 2 active, 2 declared)` | 0 |
| example in an adopted root | `OK (2 evidence streams: 1 active, 1 declared; 2 pre-D5.3 adapters outside the stream contract)` | 0 |
| `--borrow` | `AD-R13: … the record names control "HG-0002", which belongs to adapter "github-codeowners-hold"` | **1** |
| `--self-attest` | `AD-R19` + `AD-R20` + `AD-R18` — the observer is the subject, is an agent, and is not the signer | **1** |
| `--stale 5` | `AD-R21: the observation is 5 days old (limit 3)`, plus `AD-R23` on each of the four probes | **1** |
| `--self-declare` | `AD-R09: … activation_evidence carries real values but no verified observation is bound to this adapter` | **1** |

Every mutated record is **authentically signed after the mutation**, deliberately. An unsigned
mutation would fail with `AD-R16` and prove nothing about `AD-R13`, `AD-R19` or `AD-R21` — the
negative would be answering a question nobody asked.

## The four streams, and which of them are honestly active

| Stream | Control | Verified by | State here |
|---|---|---|---|
| `notion-pa-decision` | `PA-GATES` | this gate | **active** — a fresh, independently signed, four-way bypass-tested observation |
| `github-codeowners-hold` | `HG-0002` | `platform-activation-check.mjs` | **active in a bare root** (a forge observation is generated beside it); declared in an adopted one |
| `github-branch-protection` | `HG-0001` | `platform-activation-check.mjs` | **declared** — no branch-protection observation is filed by this example |
| `notion-activation` | `FLOOR-SEAM` | this gate | **declared** — nobody has probed a seam, and a seam-liveness observation nobody made is the exact overstatement this gate exists to refuse |

Two streams stay `DECLARED, NOT ACTIVE` on a green run. That is the honest resting state of a wired
seam, not a defect, and forcing all four green would have meant manufacturing observations — which
is the failure mode the whole of D5.3 is written against.

## Why it is generated rather than committed

**Freshness.** `notion-pa-decision` tightens its window to three days (`evidence.max_age_days`, the
only direction `AD-R06` allows). A committed, statically dated record would verify for three days and
then fail every build afterwards for a reason unrelated to the change under review — at which point
somebody deletes it and the gate returns to `no adapters mounted`. `drift-example/observe.mjs` and
`approval-attestation-example/regenerate.mjs` both made this call; the seam's window is 7 days
against drift's 7 and the forge gate's 365, so the pressure here is at least as strong.

**Keys.** `AD-R17` refuses a `"demo": true` anchor outright. So unlike `approval-attestation-example/`,
this example *cannot* ship a marked-and-refused public half and still demonstrate an ACTIVE stream —
the key has to be real. A real key committed to the bundle is a live root of trust in every
repository that copied it, which this bundle shipped once and removed. The way out of that trap is
not to ship one: each ed25519 pair is generated in memory by `observe.mjs`, the public half is
written only into the staging root it was told to write to, and the private half is never
serialised. `docs/governance/attestation-issuers.json` ships with an empty `issuers` array and a
comment saying why. Grep this directory for a PEM header of either half and there is nothing to
find.

`observe.mjs` refuses `--dest` pointing at the harness bundle or at this directory, and refuses to
default `--dest` to the working directory at all. Generated evidence must not land in a git tree
that is meant to stay clean.

## Two destinations, and what it refuses to stage

A **bare root** (no identity registry, no catalog, no issuer registry) gets the whole example. An
**existing repository** gets only the two directories this example owns — `docs/governance/adapters/`
additively, and `docs/governance/adapter-evidence/`. Seeding a second-line-owned identity registry,
adding controls to somebody's catalog, or filing forge observations into a repository with its own
platform-activation story are not a staging script's business.

Three collisions are skipped, each printed with its reason — a staging script that silently dropped a
stream would produce a smaller, greener report than the repository deserves:

- **`github-branch-protection` in an adopted layout.** `adapters/reference/github-branch-protection.json`
  is already mounted there, pre-D5.3. This example's file is that same adapter upgraded to the stream
  contract, and overwriting it is a real decision with consequences beyond this gate:
  `scripts/adapter-evidence-check.test.mjs` asserts the shipped reference adapters still read as
  `stream === false` **from that very directory**, so replacing one turns that test red. Do the
  upgrade deliberately or not at all.
- **A control already claimed by a different adapter** — `AD-R05`. Two adapters claiming one control
  make their evidence interchangeable, which is finding F4 re-entered from the other side.
- **`notion-activation` where the catalog has no `FLOOR-SEAM`.** `core/floor-adapters.mjs` says
  plainly that the seam's own liveness is a control an adopting institution must add and own, and
  that a control id invented by the harness and owned by nobody is the mapping-to-nothing
  `adapter-check.mjs` refuses. `--add-floor-seam-control` models the institution adding it; it is
  opt-in and never the default.

## What this does NOT demonstrate

**Nobody observed anything.** No Notion workspace was queried, no approval was submitted as a bot,
no nonce was replayed. The observation is synthetic and its `observation` block is invented numbers.
What is real is the *shape* and the *verification*: a registered issuer's signature over the record's
canonical hash, checked by `core/attestations.mjs` with real crypto; an observer resolved in the
registry, outside `builders`, not an agent, not named among the identities the stream makes a claim
about; four negatives each with their own executed, rejected, fresh probe. `core/floor-adapters.mjs`
says this limit better than this file can: *the observation is authentic, not necessarily true.*

**The compiled-requirement path is not exercised.** `checkCompiledRequirement()` — mandatory-when-compiled,
where every D5.3 stream must be ACTIVE — is inert here, because no bundled change's plan compiles the
`adapter_evidence` capability (`change-example/control-plan.json` compiles `data_risk_register` and
`model_risk`). Wiring a compiling change in would demand all four streams active, which would mean
manufacturing the two observations this example deliberately refuses to manufacture. That path is
covered in `scripts/adapter-evidence-check.test.mjs` instead.

**No `HG-0002` forge observation is filed into an adopted layout, on purpose.** It would light up the
delegation path there — and it would also turn the adoption dry-run's negative test #18 green, which
flips `HG-0002` to `platform-enforced` and requires `platform-activation-check.mjs` to fail for want
of a verified observation. So the delegated-stream demonstration lives in the bare root only, where
nothing depends on that control being unobserved.

**`AD-R10` is not exercised.** No catalog control here carries an `adapter_ref`, matching every
shipped catalog. The rule is available, not applied — residual 5 in `core/floor-adapters.mjs`'s own
header, repeated here so silence is not mistaken for coverage.

**The observer is `infosec-noor`, not `padmin-zoe`.** The platform admin holds the workspace toggle
for the mechanism being probed, and a bypass test signed by whoever holds the bypass is
self-attestation with extra steps — the threat model's gap G-5, which the harness narrows and does
not close. Information security is outside `builders`, outside the identities the stream makes a
claim about, and not the toggle-holder. That is a choice this example makes, not a rule the gate
enforces; G-5's actual decision is still awaiting a human.

## Not shipped to adopters

Like `freeze-example/`, `drift-example/`, `floor-export-example/` and
`approval-attestation-example/`, this is the Loom's own demonstration data and is deliberately
absent from `copy-manifest.json`. An adopter's first stream should be their own, mounted at
`docs/governance/adapters/` with an observation their own independent observer signed.

---

**Companions:** `../core/floor-adapters.mjs` (read its header first — the four streams, the twenty-three
rejection codes, and the five residuals it does not close) · `../scripts/adapter-evidence-check.mjs` ·
`../scripts/platform-activation-check.mjs` (the verifier of record for the two forge streams) ·
`../adapters/README.md`.
