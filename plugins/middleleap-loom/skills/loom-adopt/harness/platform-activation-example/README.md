# Platform-activation observations (rc.12 · WS2)

A control graduates to **platform-enforced** only when the *live* platform is observed
preventing bypass — not when a JSON file declares it. `scripts/platform-activation-check.mjs`
verifies the observation record `loom activate --platform github` produces.

Each record (mount under `docs/governance/platform-activation/<mechanism>.json`) must carry:

| Field | Meaning |
|---|---|
| `platform`, `repository` | what was observed |
| `satisfies_control` | the catalog control this observation activates |
| `mechanism` | `branch_protection` \| `rulesets` \| `required_reviews` \| `codeowners` \| `workflow_permissions` \| `environment_protection` \| `oidc_subjects` |
| `observation` | what the platform actually reported active |
| `bypass_test` | a **negative** test executed against the platform — `result: "rejected"` |
| `observer_identity` | resolves in the identity registry, **outside** the agent's write authority (not a builder/agent) |
| `observed_at`, `bypass_test.tested_at` | fresh within the window (default 365d) |
| `attestation` | ed25519 over the record's canonical hash, by a registered observer issuer |

`github-branch-protection.json` in this directory shows the shape (its `attestation.signature`
is an `ADOPT` placeholder — a real observation is signed by your observer's key). The gate's
graduation rule fails the build if any catalog control claims `platform-enforced` without a
verified record naming it.

**Honesty.** The bundle ships the verifier, the schema, the observer-separation rule and this
reference. The live query runs adopter-side with read-only platform credentials — a public
bundle cannot observe your GitHub org, only prove the observation, once made, is authentic,
independent and fresh.
