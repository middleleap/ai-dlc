# Harness governance — the HG catalog

Decision records for **how the AI build harness itself is governed** — the AI-SDLC, not the
product it builds. They are kept separate from product architecture ADRs because the audience
and concern differ: change management, model risk, separation of duties, and the controls a
regulated institution needs before an autonomous build loop is allowed near its SDLC.

The unifying principle: **AI proposes; humans and a protected control plane dispose.** An
ungoverned agent can author, self-review, self-merge, deploy, and *edit its own guardrails* —
the catalog replaces that with enforced human accountability and an immutable control plane.

## The catalog

Each entry names the gap an ungoverned harness has, and the one-line decision that closes it.
Adopting organisations write these as their own ADRs (the OFBO instance in the origin
repository is the worked example); the ids below are the Loom's stable names for the decisions.

| ID | Gap in an ungoverned harness | Decision |
|---|---|---|
| **HG-0001** | Self-merge / no human four-eyes | Human-approved merges + a production gate via enforced branch protection. The agent never merges its own work |
| **HG-0002** | The agent can edit its own guardrails | Immutable control plane: CODEOWNERS + managed settings + protected CI, including supply-chain integrity (see `supply-chain-security.md` for how hardened images + signed SBOM + SLSA provenance evidence it). Hooks, gates, and workflows live outside the agent's write scope |
| **HG-0003** | Self-attested change records | Externally-anchored traceability + tamper-evident evidence — the release bundle is sealed, not narrated. Enforced repo-side by `evidence-seal-check.mjs` (a hash-chained evidence manifest); external WORM + timestamping is the anchor |
| **HG-0004** | Broad agent credentials / secrets on disk | Least-privilege service identity for the agent + vaulted secrets |
| **HG-0005** | Auto-deploy with no promotion or rollback | dev → staging → prod promotion with a human production gate and a rehearsed rollback |
| **HG-0006** | The agent is an ungoverned model | AI/model-risk governance for the harness itself (aligned to the applicable AI-risk frameworks: regulator guidance, NIST AI RMF / GenAI Profile, ISO 42001). See `model-risk.md` for the model manifest + provenance gate that enforce the repo-side half |
| **HG-0007** | Delivery built the wrong thing / no problem trace | **Discovery precedes delivery** — a gated left diamond (D1–D9) feeds delivery via a hand-off; a waist gate makes a green hand-off the entry condition for a feature item |
| **HG-0008** | Domain content hard-coded into the harness | **Solution-agnostic seams**: the data-risk register (D6) and the `design.md` brand profile (D7) are mounted, not embedded |
| **HG-0009** | The right diamond was a straight line | **Develop diverges before delivery converges** — explore N solution directions, judge, converge to a Solution Direction Record + the discovery-linked backlog item |
| **HG-0010** | No mandatory cease-use capability | Immediate cease-use kill-switch + a named accountable officer for autonomous systems |
| **HG-0011** | Agent LLM traffic and execution not residency-controlled | Onshore model gateway + pre-egress DLP + attested sandbox execution, where residency rules apply |
| **HG-0012** | The agent can reach "green" by retrieval, not derivation (mine `.git`, look up the fix) | Controlled build/eval runtime — sealed history + egress allow-list + an independent derivation-vs-retrieval audit |
| **HG-0013** | Autonomy is uncalibrated — one lighting policy governs a lint fix and an auth rewrite alike | **Graduated autonomy with a fixed dark boundary**: the loop runs fully autonomous up to *proposal*, never through *disposal* — the PR is the light switch. Per-change-class relaxation happens only through a second-line-owned, expiring **routine envelope** (`routine-change-check`), never ad hoc; the envelope moves human approval from per-change to per-envelope, it never removes it. Enforcement of record: a merge-queue/ruleset that auto-merges only with the routine gate among passing required checks |

## How to adopt the catalog

1. **Start with the five that are pure repo mechanics** — HG-0001, HG-0002, HG-0007, HG-0009,
   HG-0013. They are wire-in-the-repo decisions (branch protection, CODEOWNERS, the waist gate,
   the Develop skill, the routine envelope) and they are the ones the Loom's bundled machinery
   enforces directly.
2. **Take the rest to your change/risk governance** as proposals — HG-0003–HG-0006,
   HG-0008, HG-0010–HG-0012 are organisational decisions (identity, promotion, model risk,
   residency) that need owners outside engineering.
3. **Write each accepted decision as a real ADR** in your repository, citing your regulator's
   language, and keep the status honest (Proposed / Accepted). An HG id with no ADR behind it
   is a label, not a control.
4. **Remember the enforcement-of-record rule.** A skill or reviewer agent that honours a rule
   is hygiene; the *control* is the platform mechanism the agent cannot bypass (branch
   protection, protected CI, managed settings). Every HG decision should name its enforcement
   of record. Inert controls fail: the origin repository's catalog was prompted by a live
   incident in which an agent identity merged to `main` because branch protection was
   configured but not activated.

## The activation runbook (HG-0001/HG-0002 in practice)

The origin implementation ships a runbook a platform admin runs — outside the agent's write
scope — to make the paper controls real: real CODEOWNERS teams, `main` branch protection with
required Code Owner review + required checks + no bypass, and a least-privilege agent identity
(HG-0004). Adopters should mirror it on their platform: the decisive property is that **the
agent's identity is not in the approver group and cannot toggle the protection.**
