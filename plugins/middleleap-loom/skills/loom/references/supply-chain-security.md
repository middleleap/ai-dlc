# Supply-chain security — filling slots the frame already has

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
| **Institutional DNA · approved technologies** (the brain) | Snyk policy as the approved-dependency gate | Chainguard Images as the approved base-image golden path |
| **Data-risk register · D6 seam** (`discovery-harness.md` §5.1) | A third-party / supply-chain dependency risk domain, with these tools as its **enforcing control** | — |

## Two directions, not one

The tools are complementary, not overlapping:

- **Snyk shifts scanning left** — it blocks at the PR, on the Q2/Q4 gates, with block-on-introduce
  policy (stop new findings while a backlog is triaged separately).
- **Chainguard shifts the baseline down** — fewer CVEs *exist* to find, because the image ships
  without shells, package managers, and unused libraries. The cheapest vulnerability to fix is
  the one that was never in the image.

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
- **Provenance is only as strong as its verification.** An SBOM and an SLSA attestation buy nothing
  unless something checks them at the point of use (the evidence bundle, HG-0002).
- **Tool choice stays the institution's.** These are recommended instances of neutral roles, not a
  mandate — the whole point of the seam is that an adopter can fill it differently.

See also: `delivery-harness.md` (the Q-gate pattern), `governance.md` (HG-0002 and the
enforcement-of-record rule), `continuous-assurance.md` (the assurance triggers), and
`bank-grade-gap.md` (where these gates sit on the enforced/named-only/absent scorecard).
