# Supply-chain security — filling slots the frame already has

> **Identifiers.** Gate ids (`D1`–`D9`, `Q1`–`Q5`) and run-level ids (`S-001` signal,
> `T-1` theme, `H1` hypothesis) are expanded in `glossary.md`.

Supply-chain security is **not a new warp thread**. The Loom already names the slots where it
belongs — the `Q2` and `Q4` quality gates, `HG-0002` (supply-chain integrity), the sealed
evidence bundle, and the continuous-assurance triggers. What follows is how concrete tooling
*fills* those slots without changing the frame.

Consistent with `HG-0008` (solution-agnostic seams), the canon stays **vendor-neutral**: the
harness names *roles* (an SCA scanner, a hardened base image), never a vendor. This file names
**Chainguard** and **Snyk** as recommended *instances* of those roles — swap them and the same
slots still hold.

## The mapping — role in the Loom → what fills it

| Slot the Loom already defines | Snyk | Chainguard |
|---|---|---|
| **Q2 · static + SAST** (`delivery-harness.md`) | Snyk Code (SAST); Snyk IaC (Terraform / K8s / CloudFormation misconfig) | — |
| **Q4 · security + dependencies** ("dependency audit, secrets scan") | Snyk Open Source (SCA / CVEs) + Snyk Container (image scan) — the *dependency audit* the gate already names | A zero-CVE hardened base image shrinks the OS attack surface Q4 has to scan |
| **HG-0002 · supply-chain integrity** (`governance.md`) | Broker / least-privilege scanner identity | Hardened minimal images + signed SLSA provenance = the trusted base of the immutable control plane |
| **Evidence bundle** (delivery step ⑧, "agent build-provenance") | SPDX / CycloneDX SBOM + scan verdict, sealed at release | Signed SBOM (SPDX + CycloneDX) + SLSA Build-L2 attestation, sealed at release |
| **Continuous assurance** ("on a schedule / on events", `continuous-assurance.md`) | Scheduled re-scan + a new-CVE **event** trigger = the *watch → assess* steps | Daily-rebuilt zero-CVE images = drift caught upstream, not in your pipeline |
| **Institutional DNA · approved technologies** (the brain) | Snyk policy as the approved-dependency gate | Chainguard Libraries as the *registry* behind `technology-policy.json` — §3 |
| **Data-risk register · D6 seam** (`discovery-harness.md` §5.1) | A third-party / supply-chain dependency risk domain, with these tools as its **enforcing control** | — |
| **HG-0011 / HG-0012 · the agent's own runtime** | — | The attested sandbox and controlled build/eval runtime are themselves images — §2 |

## Two directions, not one

The tools are complementary, not overlapping:

- **Snyk shifts scanning left** — it blocks at the PR, on the Q2/Q4 gates, with block-on-introduce
  policy (stop new findings while a backlog is triaged separately).
- **Chainguard shifts the baseline down** — fewer CVEs *exist* to find, because the image ships
  without shells, package managers, and unused libraries. The cheapest vulnerability to fix is
  the one that was never in the image.

## 1. The hole these tools actually close: a self-asserted audit

`supply-chain-check.mjs` reads `dependency-audit.json` from a path the coding agent can write.
An agent that writes `{"critical": 0, "high": 0}` goes green **without a scan having run** —
which is exactly the `HG-0002` failure mode ("the agent can edit its own guardrails") reappearing
inside the gate meant to prevent it. Buying a scanner does not fix this; the scanner's verdict
still arrives as a file in the repository under test.

The harness already has the mechanism: the **adapter contract** (`adapters/README.md`) maps an
external system's state into a signed envelope tied to a catalog control, and `adapter-check.mjs`
fails any adapter naming a control that does not exist. Two reference mappings ship for this:

| Role | Control | Emits | What it binds |
|---|---|---|---|
| `sca` | `Q4-SUPPLY` | `dependency-audit` envelope | The **scanning platform's own** counts + reachability verdict, reconciled against the file the gate reads on `scanned_commit` and every count |
| `hardened-runtime` | `HG-0011` | `runtime-attestation` envelope | The digest, SBOM digest, SLSA level and *verification result* for the runtime the agent executes in — §2 |

Each provider carries a **negative probe** in `activation_evidence`, and the probe is the decisive
field: `tamper_probe` (editing the local counts away from the platform's must fail the build),
`unsigned_image_probe` (an image without a valid attestation must fail admission). An adapter with
no real `activation_evidence` is reported as *declared, not active* — a wired seam, never a green
control. That honesty is the point: it distinguishes "we bought Snyk" from "the Snyk verdict is the
one the gate cannot route around."

The roles name **different** controls. `AD-R05` is one adapter, one control: two adapters sharing a
control make their evidence interchangeable, so a probe of one mechanism appears to satisfy a claim
it was never tested against. The release-side base image needs no second adapter anyway — its SBOM
and provenance are already the Q4 artifacts `supply-chain-check.mjs` gates.

### These are roles, and the choice is the institution's

Snyk and Chainguard are **instances**, and the harness has to make that structurally true rather
than merely say it. Until `2.0.0-rc.19` it only said it: adapters lived in a directory that holds
at most one mapping per control, so naming Snyk left nowhere to put Trivy. `HG-0008` was honoured
in the prose and broken in the filesystem.

The catalog is `adapters/providers/<role>/<provider>.json` — alternatives side by side, none
mounted by default. The institution records what it picked in
`docs/governance/provider-selection.json`, and `provider-selection-check.mjs` enforces the join:
one provider per role (`PS-R03`), the provider must exist and fill the role's control
(`PS-R02`/`PS-R04`), and its adapter must actually be mounted, because selecting is not installing
(`PS-R05`). Each provider states its `role_fit` — one line on its strength, one on where it is
weak — so the choice is made with open eyes rather than sold.

**The choice is required, not merely offered.** The base `regulated-bank` profile declares both
capabilities at **high tier**, so `PS-R06` fires on a high-tier change that never chose:

| Role | Capability | Required at | Because |
|---|---|---|---|
| `sca` | `sca` | high | High tier already mandates `dependency-audit` evidence — a tier that must produce the audit should have said who asserts it |
| `hardened-runtime` | `hardened_runtime` | high | A high-tier change whose agent runtime is unaccounted for has not met `HG-0011`'s attested-execution limb |

This is the D6-register pattern: the requirement comes from the **profile**, never from a CI flag,
so a pipeline edit cannot weaken it. The distinction `PS-R06` draws is between *choosing* and
*activating* — it demands a recorded decision, not a live integration, because an institution can
honestly be mid-onboarding with a provider chosen and its probes not yet run. And it stays silent
for low- and medium-tier work: an institution that has not reached this decision is not failing it.

The shipped alternatives are deliberately not two commercial vendors: `trivy` (self-hosted,
open-source) and `internal-golden-images` (the institution's own pipeline) exist to prove the role
can be filled without buying anything. Both inherit the same demand — a self-hosted scanner earns
the same evidence only when the identity that runs it, and the store it writes to, are outside the
coding agent's reach. Building it yourself changes who signs, not whether a signature is checked.

## 2. Chainguard belongs on the *agent's* runtime, not only the product's

The obvious use is the shipped product's base image. The less obvious one matters more here: the
container the coding agent runs in is itself a supply-chain artifact with a build, a digest, and
provenance. `HG-0011` requires **attested sandbox execution**; `HG-0012` requires a **controlled
build/eval runtime**. Neither is satisfied by a sandbox image nobody can account for.

Chainguard VMs and Containers — built from source in SLSA-certified infrastructure, carrying only
what a container host needs — fill that slot directly, and compose with the egress half already in
the canon (`agent-egress-control.md`, `agent-credential-brokering.md`). The second-order benefit is
containment: an image with no shell and no package manager narrows what a compromised *or merely
misdirected* agent can do inside its own sandbox. The `HG-0012` egress allow-list stops the agent
reaching out; a minimal runtime stops it reaching for tools that were never installed.

## 3. The agent picks the dependency — which is a different risk

This is the part that is specific to AI-DLC rather than generic AppSec. In a human SDLC a person
chooses a package and a scanner checks it afterwards. In the Loom the **agent** chooses it, which
makes hallucinated and slopsquatted package names a first-class risk — and SCA is structurally bad
at that class. A scanner tells you a package is *vulnerable*. It does not tell you the package
should never have been selected, and it has nothing at all to say about a name that resolves to
someone else's typo-bait.

`brainkit/technology-policy.json` is where the institution states `allowed` / `consult` /
`forbidden` — and until now it stated them with **no enforcement mechanism whatsoever**: a document
a reviewer was supposed to check. Chainguard Libraries (Python, Java, JavaScript, rebuilt daily
from source) lets you pin the resolver at a curated registry instead, so the build **cannot fetch
what the registry does not carry**. The template now carries a `registry` block for exactly this:
upstream per ecosystem, the resolver-config files that pin it, `fallback_to_public: false`, and the
adapter that attests it is live.

Two properties make this a control rather than a preference:

- **The resolver config belongs to CODEOWNERS**, not to the agent. A pin the agent can edit is a
  suggestion.
- **A fallback that silently reaches the public index is not a boundary.** If resolution degrades
  to the open registry when the curated one lacks a package, the agent's unapproved choice succeeds
  anyway — and it succeeds *quietly*, which is worse than failing.

This is the same move the Loom makes everywhere else: the control is the mechanism, not the
statement of intent.

## 4. Calibrating Q4 by reachability — without loosening it

`MAX_CRITICAL = 0, MAX_HIGH = 0` is the correct floor and unlivable on a real dependency tree. The
predictable outcome is a permanently-red gate that gets bypassed, which is an inert control with
extra steps. Snyk's transitive reachability analysis — whether a vulnerable function is actually
callable from your code — is the honest way out, and `supply-chain-check.mjs` now accepts it.

The design point is **which side states what**:

| | States | Lives where |
|---|---|---|
| The **report** | tool, method, reachable counts, the deferral SLA — *facts* | `dependency-audit.json`, the agent-writable evidence path |
| The **gate** | `MAX_CRITICAL`, `MAX_HIGH`, `MAX_DEFERRED_*` — *policy* | `supply-chain-check.mjs`, under CODEOWNERS |

So calibrating the policy is a control-plane change, not something a report can grant itself. The
rules that follow from that split:

- A **usable** claim gates the reachable counts at `MAX_CRITICAL`/`MAX_HIGH` and the unreachable
  remainder at the deferral budget. It *replaces* the totals gate rather than stacking on it.
- An **unusable** claim — unattributed, missing counts, or claiming more reachable findings than
  exist — fails **and** the strict totals still apply. A broken block never buys leniency.
- **Deferral requires an SLA date, and an expired one means overdue, not deferred.** A deferral
  without a date is a bypass wearing a policy's clothes.
- An unreachable *critical* is never within budget by default. Reachability lowers triage load; it
  does not reclassify a critical.

## 5. The new-CVE event has to land somewhere

`continuous-assurance.md` defines ①Watch → ②Assess, the `change-watch` agent exists, and
`drift-check.mjs` exists — but nothing wires a post-release vulnerability event into any of them.
Both tools emit exactly the signal those triggers want, in two different shapes:

- **Snyk monitor** emits a *new-vulnerability event* against an already-released project — the
  ①Watch input, which `change-watch` assesses rather than a human noticing a dashboard.
- **Chainguard's daily rebuild** means a remediation arrives as a **new digest** for an image you
  already pinned. That is a drift signal in the harness's own currency: the running digest and the
  supplier's current digest have diverged, and `drift-check.mjs` is the shape that reads it.

The second one is worth stating plainly because it inverts the usual posture: with a continuously
rebuilt base, "we are behind" is detectable as a digest comparison rather than as a CVE feed you
have to interpret.

## The enforcement-of-record rule still applies

A scanner that **reports** is hygiene; the **control** is the CI gate that **blocks merge** on a
policy violation, wired so the agent identity cannot bypass it — branch protection / protected CI,
per `HG-0001` and `HG-0002`. Buying the tools is not the control. A Snyk scan whose failure does
not fail the build, or a Chainguard SBOM that is generated but never verified at release, is an
inert control — exactly the failure mode `governance.md` warns about.

## Limits — stated plainly

- **"Zero-CVE" means *known* CVEs at build time**, not proof of no vulnerabilities. It lowers the
  triage load; it does not end the need for the other gates.
- **SCA covers declared dependencies, not your custom code** — that is SAST's job (Q2). The two
  gates are not interchangeable.
- **Reachability is an analysis, not an oracle.** Dynamic dispatch, reflection, and configuration-
  driven call paths are where it is weakest; that is why the deferral budget is small and dated
  rather than unlimited.
- **A curated registry constrains selection, not correctness.** It stops the agent pulling an
  unapproved or nonexistent package. It does not make an approved package the right choice.
- **Provenance is only as strong as its verification.** An SBOM and an SLSA attestation buy nothing
  unless something checks them at the point of use (the evidence bundle, HG-0002).
- **These two tools move roughly two rows** on the `bank-grade-gap.md` scorecard. They do nothing
  for `HG-0001` (four-eyes), `HG-0003` (sealed evidence), `HG-0007` (discovery precedes delivery),
  `HG-0009` (divergence before convergence), or `HG-0013` (graduated autonomy). A supply-chain
  purchase is not a governance programme.
- **Tool choice stays the institution's.** These are recommended instances of neutral roles, not a
  mandate — the whole point of the seam is that an adopter can fill it differently.

See also: `delivery-harness.md` (the Q-gate pattern), `governance.md` (HG-0002 and the
enforcement-of-record rule), `continuous-assurance.md` (the assurance triggers),
`agent-egress-control.md` (the runtime half of §2), `brainkit.md` (where `technology-policy.json`
sits), and `bank-grade-gap.md` (where these gates sit on the enforced/named-only/absent scorecard).
