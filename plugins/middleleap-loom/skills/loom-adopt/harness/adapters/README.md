# Enterprise adapters — the neutral contract (Loom 2.0 §16)

The Loom integrates with, but does not own, a bank's platforms: source-control branch
protection, CI/CD, IAM/PAM, secrets vaults, GRC/control registers, model inventories,
incident management, observability, and the evidence/WORM store. Adapters keep the **core
vendor-neutral**: every adapter maps an external system's state into the Loom's own
currency — a **signed evidence envelope** tied to a control in the catalog — so the gates
never learn a vendor's API, only read envelopes.

## The contract

An adapter is a JSON declaration, mounted at `docs/governance/adapters/<adapter-id>.json`,
with these fields (validated by `scripts/adapter-check.mjs`):

| Field | Meaning |
|---|---|
| `adapter_id` | Stable id, unique across adapters |
| `system` | The external system (`github`, `servicenow-grc`, `hashicorp-vault`, …) |
| `satisfies_control` | The **catalog `control_id`** this adapter provides evidence for — must exist |
| `capability` | One line: what the system does that the control needs |
| `evidence.kind` | The envelope kind it emits (`branch-protection`, `control-register`, `vault-attestation`, …) |
| `evidence.envelope_fields` | The fields the emitted signed envelope carries |
| `activation_evidence` | Proof the integration is live (a fetch timestamp + a probe result), or absent |

The one honesty rule the gate enforces: an adapter that names a control the catalog does not
have, or that declares no evidence kind, **fails** — a mapping to nothing is not integration.
An adapter present but with no `activation_evidence` is reported as **declared, not active**:
it is a wired seam awaiting its first real fetch, never a green control on its own.

## Why the core stays neutral

The gates read **envelopes**, not vendor payloads. Swap GitHub for GitLab, ServiceNow for
Archer, and the control catalog and gates do not change — only the adapter mapping does. That
is the whole point of the seam: the same Loom runs on a different platform stack because the
adapter, not the core, speaks the vendor's dialect.

Reference mappings live in `reference/` — copy one, point it at your system, and mount it.
They are illustrative shapes, not turnkey integrations: the fetch-and-sign step that fills
`activation_evidence` is the adopter's platform wiring.
