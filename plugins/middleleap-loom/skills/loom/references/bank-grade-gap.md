# Bank-grade gap — the Loom's honest self-grade

The Loom is a strong **build-time** control frame. "Bank-grade" — acceptable to a regulated
institution's risk function and an examiner — is a higher bar in three specific ways, and
this file grades the harness against all three, honestly. It is the method's own scorecard,
kept next to the `SKILL.md` **Limits** section rather than hidden from it.

The three ways the bar rises:

1. **Enforced, not narrated.** A control a reviewer *honours* is hygiene; the control of
   record is the platform mechanism the agent cannot bypass. (This is the Loom's own rule —
   see `governance.md`.)
2. **Independent, not self-generated.** Agents reviewing agents is not assurance. A bank
   runs three lines of defence; the second and third are organisationally separate from the
   builders.
3. **Run-the-bank, not just build-the-app.** The harness governs how software is *built*.
   A regulated institution must also *operate* it — resilience, incident response, model
   monitoring, real-data handling.

> This is the maturity of the **bundled harness as it ships**, not of any given bank. An
> adopting institution that activates branch protection and wires HG-0004/0005 to its real
> IAM and change process flips those rows from Mechanically validated to Platform enforced.
> The point of the seams is that adopters raise their own grade.

## The five states (Loom 2.0 §3)

| State | Meaning |
|---|---|
| **Absent** | The capability is not present in the harness or the adoption at all |
| **Defined** | Requirement exists only in documentation — a real ADR, an inert control |
| **Mechanically validated** | A bundled gate validates a declaration or artifact and blocks merge on failure |
| **Platform enforced** | A non-bypassable technical control enforces it, with a passing negative bypass test and activation evidence |
| **Organisationally enforced** | Independent authority, operating process, and evidence exist |

A gate that validates a *declaration* grades **Mechanically validated**, never "enforced" —
the word enforced is earned by the platform (branch protection, protected CI, a vault) plus a
negative test showing an attempted bypass being rejected. The axis of maturity is **Defined →
Mechanically validated → Platform enforced**: the governance catalog already *names* the right
decisions; bank-grade is the work of making them non-bypassable and proving it.

> **The state of record is the control catalog** — `governance/control-catalog.template.json`,
> mounted as `docs/governance/control-catalog.json` and checked by `control-catalog-check.mjs`,
> which fails the build on any entry claiming a state without its receipts. This file is the
> narrative view; where they disagree, the catalog wins.

## Scorecard

The scorecard below is **generated from the control catalog** (rc.7, W6) — one source of
truth, no hand-kept counts to drift. `adopter_side` controls are capabilities a bundle
cannot ship (real IAM, external WORM, DAST/pentest, the supervised pilot, a live exam): they
sit in the catalog as `absent`/`defined` so the whole picture, including what is out of a
bundle's reach, is in one place.

<!-- LOOM:SCORECARD:START -->
| Mechanically validated | Defined | Absent | Platform enforced | Organisationally enforced |
|---|---|---|---|---|
| 36 | 6 | 7 | 0 | 0 |

_Generated from the control catalog (49 controls; 12 flagged `adopter_side`) by `scripts/generate-scorecard.mjs`. The catalog is the state of record — do not edit this block by hand; run `node scripts/doc-integrity-check.mjs --fix`._
<!-- LOOM:SCORECARD:END -->

**Platform enforced: 0 as shipped. Organisationally enforced: 0 as shipped.** A bundle cannot
activate branch protection or stand up an independent function — those states are the
adopter's to claim, per control, in the catalog, with activation evidence.

**This is a defensible estimate of what ships today, not an audit.** It reflects the plugin
bundle as-is — e.g. of the six continuous-assurance agents only steps ① Watch (`change-watch`)
and ② Assess (`risk-reviewer`) ship so far, so the rest are graded *Defined*; the bundled
data-risk register is graded
against its shipped state (a one-record demo), not the full taxonomy an adopter mounts. Read
the clusters below for the reasoning behind each grade. The headline it encodes: **build-time
frame strong, run-the-bank sparse** — though the mechanically-validated column is growing as
Loom 2.0 releases land (1.10: Q1b, secrets-history, SAST/SBOM output validation, the catalog;
1.11: the policy compiler, the change envelope, PA1/PA2 product approval, architecture
assurance A1–A5, and the identity registry — the product-governance plane the review named
as the largest gap; 1.12: R1–R6 operational readiness with freshness windows, the compound
production authorization, the second-line release hold (fail closed), real ed25519 anchor
attestation, the silence-after-launch rule, and the risk-scoped gate runner with lanes —
every skip recorded, never silent; 2.0-rc: the signed assurance-cycle record and the
replayable decision log — the last two bundle-side rows that were honestly `absent` in 1.12 —
plus enterprise adapters, high-tier model runtime governance, and the supervised-pilot
playbook with its adversarial checklist mapped to the gates that catch each attack; 2.0-rc.3:
comprehension debt named as a standing limit, HG-0013 graduated autonomy, and the
routine-change lane — a second-line-owned, expiring envelope that lets a narrow class of
low-risk changes auto-merge behind an absolute control-plane floor; 2.0-rc.4: the
product-eval gate — a release links its discovery hand-off and scores every D1 success
measure against the shipping commit, so discovery → delivery → measurement closes; 2.0-rc.5:
token-spend telemetry — a report, not a gate (cost is a signal for humans, never a merge
control), the macro ring's first instrument).

## Six clusters, graded

### A · Control-plane enforcement (HG catalog)

| Capability | State | What closes it |
|---|---|---|
| HG-0001 four-eyes merge · branch protection | Defined | Branch protection is a platform setting: activate it (activation runbook), record the rejected direct-push probe, then claim Platform enforced in the catalog |
| HG-0013 graduated autonomy · routine-change lane | **Mechanically validated** | — (`routine-change-check.mjs`: a claimed routine change must fit a second-line-owned, expiring envelope, under a diff cap with required gates green; an absolute in-code floor keeps the control plane, contract, auth and migrations out of the lane. Platform enforced is the adopter's: a merge-queue that auto-merges only with this gate among the passing required checks) |
| HG-0002 immutable control plane · supply-chain integrity | **Mechanically validated** | — |
| HG-0007 / HG-0009 waist gate · develop diverges | **Mechanically validated** | — |
| HG-0008 solution-agnostic seams | **Mechanically validated** | — |
| HG-0003 tamper-evident sealed evidence | **Mechanically validated** | — (the evidence-seal gate; external WORM + timestamping is the adopter's anchor) |
| HG-0004 least-privilege identity · vaulted secrets | Defined | Real IAM/PAM, HSM-backed vault, short-lived tokens, rotation |
| HG-0005 promotion + rehearsed rollback | Defined | Environment segregation, change-ticket linkage, rollback drills |
| HG-0006 model-risk governance (see cluster B) | Defined | The MRM apparatus in cluster B |
| HG-0010 cease-use switch · accountable officer | Defined | A wired kill-switch + a named Senior Manager |
| HG-0011 onshore gateway · pre-egress DLP · attested sandbox | Defined | Model gateway, DLP, sandbox execution where residency applies |
| HG-0012 controlled build/eval runtime | Defined | Sealed history + egress allow-list + derivation-vs-retrieval audit |

Most HG decisions the bundle can check are mechanically validated; none are platform
enforced until the adopter activates the platform half and records the evidence. This is
the single biggest, and fastest, credibility gap.

*Shipped machinery for the control plane (loom-adopt harness):* a `control-plane-check.mjs`
CI gate that fails if any control-plane file loses its CODEOWNERS owner — or is owned only by
the placeholder team (1.9.1) — over an exhaustive target list covering every bundled gate,
hook, workflow, and governance manifest (1.10), a `CODEOWNERS.template`,
and an `activation-runbook.md` that walks a platform admin through activating HG-0001/0002/0004
(branch protection, ownership, least-privilege identity). The runbook makes HG-0004 *adoptable*
but not yet *enforced* — the real IAM/vault is still the adopter's to wire. For HG-0003, an
`evidence-seal-check.mjs` gate + `evidence-manifest.json` seam make the release bundle a
hash-chained, tamper-evident, completeness-checked, commit-bound and SEMANTICALLY verified chain — sealed tests must pass, verdicts must be PASS/CONFORMANT, scans must be clean (1.10) — with an optional external anchor.

### B · Model risk & AI governance (SR 11-7 · PRA SS1/23 · EU AI Act · NIST AI RMF · ISO 42001)

| Capability | State | What closes it |
|---|---|---|
| Q1b anti-reward-hacking gate | **Mechanically validated** | — (`test-integrity-check.mjs` diffs the test surface against the merge base, 1.10; `test-tripwire.sh` is the session-side defence in depth) |
| Model + prompt version pinning in evidence bundle | **Mechanically validated** | — (the model-provenance gate) |
| Agent eval harness · challenger models | Defined | The gate requires a fresh passing eval before release; the eval *rig* + challengers are the adopter's to build |
| Independent model validation function | Defined | `validated_by` + the `model-risk-reviewer` challenge agent ship; the org-separate MRM *function* is the adopter's |
| Production drift monitoring | Defined | The model manifest now REQUIRES runtime monitoring/suspension/fallback declarations at high tier (`model-provenance-check`, 2.0-rc); executing the live monitoring is the adopter's model-risk function |
| Replayable decision log | **Mechanically validated** | — (`decision-log-check.mjs`, 2.0-rc: an append-only hash chain of the agent's decisions; CAPTURE is the adopter's harness wiring) |
| Fairness/bias testing · explainability · AI incident runbook | Absent | Where applicable to the use case |

The agent *is a model*. This cluster was the gap most specific to an AI-driven harness and the
least addressed; roadmap Step 2 moved provenance from *absent* to *mechanically validated*.

*Shipped machinery (loom-adopt harness):* a `model-manifest.json` inventory seam +
`model-provenance-check.mjs` — an HG-0006 CI gate that fails a release unless every model role
pins its model + prompt version, declares a risk tier, and (at required tiers) carries a
passing eval **run against the shipping pin** whose report artifact is cited by ref + sha256 and re-hashed by the gate (1.10: a declared pass is not evidence; the anti-stale-eval check, model-risk's analogue
of Q1b) plus an independent validation. Plus the `model-risk-reviewer` plugin agent for the
② Assess challenge. See `references/model-risk.md`.

### C · Assurance & audit (three lines of defence)

| Capability | State | What closes it |
|---|---|---|
| 1st-line reviewer agents (hard-stop · conformance · data-gov · boundary) | **Mechanically validated** | — |
| Product-outcome eval gate (evals-as-product-management) | **Mechanically validated** | — (`product-eval-check.mjs`: a release links its discovery hand-off, scores every D1 success measure, and carries a fresh eval bound to the shipping commit; a regression blocks. The eval *rig* is the adopter's) |
| Continuous-assurance agents (change-watch · risk-reviewer · attest · report · lineage) | Defined | Steps ① Watch and ② Assess ship as plugin agents; the **signed cycle record** with an unresolved-findings register now ships as `assurance-cycle-check.mjs` (2.0-rc), so a cycle leaves examinable evidence — but agents ③–⑥ remain described-not-shipped |
| Independent 2nd-line challenge function | Absent | The release-hold MECHANISM ships (fail closed, second-line-owned, 1.12); the organisationally-separate function operating it is the adopter's |
| 3rd-line internal audit · read-only evidence portal | Absent | Auditor access to the sealed evidence trail |
| WORM · time-stamped evidence retention | Defined | The evidence-seal gate makes the bundle tamper-evident and anchor-checkable; the immutable store + RFC-3161 timestamping authority + retention policy are the adopter's |
| SOC 2 / ISO 27001 attestation of the harness | Absent | Third-party attestation of the harness itself |

The evidence bundle is *sealed* but not shown to be WORM, time-stamped, or examinable by an
independent party — the difference between self-assurance and examinable assurance.

### D · Data-governance depth (BCBS 239 · PDPL · residency)

| Capability | State | What closes it |
|---|---|---|
| D6 register seam + data-governance-reviewer | **Mechanically validated** | — |
| Q4.5 lineage emission · pii-guard hook | **Mechanically validated** | — |
| Full risk taxonomy | Absent | The bundled register is a one-record demo (DR-1 only) — mount the real taxonomy |
| Retention + right-to-erasure enforcement | Defined | The data-lifecycle gate makes a bounded retention + an erasure disposition a merge condition; executing the deletion/crypto-shred is the adopter's data platform |
| Real-data control surface (KMS · field encryption · tokenization · access logging) | Absent | The harness is synthetic-only by design; the real-PII surface is unbuilt and untested (governance/data-protection-runbook.md) |
| Data residency (HG-0011) | Defined | Residency-controlled model traffic + execution |

The *shape* is right; the depth is demo-grade. The real-data control surface being unbuilt
is the caveat that sits under everything else.

*Shipped machinery:* a `data-lifecycle.json` seam + `data-lifecycle-check.mjs` gate that fails a
release unless every data category declares a classification, a lawful basis (for personal data),
a **bounded retention** (or a justified indefinite hold), an **erasure disposition**
(right-to-erasure, or a justified legal-hold exemption), and a residency. It enforces the
*disposition is declared and bounded* — the KMS/tokenization/deletion execution stays the
adopter's (see `governance/data-protection-runbook.md`).

### E · Security & resilience breadth (DORA · FAPI · Basel)

| Capability | State | What closes it |
|---|---|---|
| Q2 SAST · Q4 SCA/SBOM/provenance output validation | **Mechanically validated** | — (`sast-check.mjs` + `supply-chain-check.mjs` validate the scanners' OUTPUT semantically, 1.10; the scanners themselves are the adopter's fill — Snyk, Chainguard, CodeQL) |
| Secrets scanning — current tree AND git history | **Mechanically validated** | — (`secrets-scan.mjs`, 1.10: a deleted secret is still leaked) |
| DAST · penetration testing | Absent (adopter-side) | Add as gates / scheduled assurance; catalogued as `DAST-PENTEST` |
| Threat modelling (STRIDE) | **Mechanically validated** | — (A2 in the architecture-assurance plane requires threat→control→test traceability, `architecture-assurance-check.mjs`, 1.11) |
| Operational readiness R1–R6 (BCP/DR · RTO/RPO · rollback drills · kill-switch, freshness-windowed) | **Mechanically validated** | — (`operational-readiness-check.mjs`, 1.12; running the drills and telling the truth about them is the adopter's) |
| Pre-egress DLP (HG-0011) | Defined | Wired DLP on model egress |
| FAPI 2.0 / mTLS conformance | Defined | Conformance suite as a gate (domain-specific) |

The Q2/Q4 gates now validate scanner *output* semantically — a missing report, an
error-level SARIF finding, an empty SBOM, or a critical vulnerability fails the build
(1.10) — but the scanners themselves remain the adopter's fill. Operational readiness is
mechanically validated as of 1.12 (the R-gates); what stays adopter-side is *running* the
drills and DAST/pentest (catalogued as `DAST-PENTEST`).

### F · Operating model & production proof (SMR/SMCR · examination)

| Capability | State | What closes it |
|---|---|---|
| Named accountable officer (HG-0010) | Defined | Appoint and document the Senior Manager |
| Senior-manager regime · board oversight · RACI | Absent | The governance operating model around the loop |
| Supervised production pilot | Absent | A real, supervised run on non-synthetic scope |
| Legacy / core-banking integration patterns | Absent | The integration cost the demo never paid |
| Live regulator examination | Absent | The proof the method has not yet earned |

These are the Loom's own stated limits (`SKILL.md`), made specific: proven on synthetic data
in one greenfield domain, permanently non-production, no legacy integration, no live exam.

## Close in this order

Sequenced so each step buys the most credibility for the least motion.

1. **Enforce the whole HG catalog.** Take the platform-enforceable set through activation (IAM/secrets,
   promotion + rollback, DLP/gateway). The paper-to-platform gap is the fastest win, and it
   is decisions already made — only the enforcement of record is missing.
2. **Stand up model-risk management.** Eval harness + drift monitoring + independent
   validation + model/prompt pinning in the evidence bundle. The gap most specific to an AI
   harness.
3. **Independent 2nd line + WORM evidence.** Turn self-assurance into examinable assurance:
   an org-separate challenge function and immutable, time-stamped auditor evidence.
4. **Real-data surface + full register.** Synthetic-only is the caveat under everything
   else. Build and exercise the real-PII control surface against the complete taxonomy.

*Progress:* Steps 1–3 are underway — the control-plane gate (HG-0002), the model-provenance
gate (HG-0006), and the evidence-seal gate (HG-0003) now ship as mechanically-validated machinery, with their
activation runbook and manifest seams. What remains is the org-side half a bundle cannot ship:
real IAM/vault (HG-0004), an organisationally-independent model-risk and 2nd-line function,
runtime drift monitoring, an external WORM/timestamping store, and the real-PII control surface
(Step 4). Those need owners outside engineering — the honest edge of what a harness can enforce.

## The org-side, in runbooks

The items above that stay **Defined** or **Absent** because they need owners outside
engineering are not left as a shrug. The loom-adopt harness ships seven adoption runbooks
(`governance/runbooks/`, plus the supervised-pilot playbook) that say, honestly, what a plugin
bundle cannot enforce and what the
adopting institution must stand up — each with a "why a bundle cannot enforce this" note and a
"verify — evidence, not vibes" checklist:

| Runbook | Closes (cluster) |
|---|---|
| `identity-and-secrets-runbook.md` | Least-privilege agent identity + vaulted secrets (A · HG-0004) |
| `independent-assurance-runbook.md` | 2nd/3rd lines, auditor portal, external WORM anchor (C) |
| `model-risk-operating-model-runbook.md` | Independent MRM function, runtime drift monitoring (B · HG-0006) |
| `data-protection-runbook.md` | Real-PII control surface, DSAR, full register (D) |
| `security-testing-and-resilience-runbook.md` | DAST/pentest/threat-model, operational resilience (E) |
| `governance-and-accountability-runbook.md` | Accountable Senior Manager, board oversight, production pilot (F) |

A runbook is not a control — but it is the honest difference between a gap the method *named*
and one it left you to *discover*.

## The rule under all of it

A reviewer agent that honours a rule is hygiene; the **control** is the platform mechanism
the agent cannot bypass (branch protection, protected CI, managed settings, a vault, a
gateway). Most of this gap is not "the Loom decided wrong" — the HG catalog decides right.
It is **Defined → Mechanically validated → Platform enforced**, plus the run-the-bank domains a build-time frame was never
scoped to cover. See `governance.md` (the HG catalog and its enforcement-of-record rule),
`delivery-harness.md` (the Q-gates), `continuous-assurance.md` (the assurance lifecycle),
and `discovery-harness.md` §5.1 (the data-risk register seam).
