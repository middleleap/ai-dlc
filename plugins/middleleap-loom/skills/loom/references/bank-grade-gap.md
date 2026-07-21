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
> adopting institution that wires HG-0004/0005 to its real IAM and change process flips
> those rows from Named-only to Enforced. The point of the seams is that adopters raise
> their own grade.

## The three states

| State | Meaning |
|---|---|
| **Enforced** | Wired by the bundled machinery — CI gate, hook, validator, or branch protection. Non-bypassable in a correctly activated adoption. |
| **Named-only** | Decided and documented, but with no enforcement of record. Most of the HG catalog is here: a real ADR, an inert control. |
| **Absent** | The capability is not present in the harness at all. |

The main axis of maturity is **Named-only → Enforced**: the governance catalog already
*names* the right decisions; bank-grade is largely the work of making them non-bypassable.

## Scorecard

Across ~47 assessed capabilities, the bundled harness today grades roughly:

| Enforced | Named-only | Absent |
|---|---|---|
| ~14 | ~12 | ~21 |

**This is a defensible estimate of what ships today, not an audit.** It reflects the plugin
bundle as-is — e.g. the six continuous-assurance agents are graded *Named-only* because
`continuous-assurance.md` describes them but they are not present in the plugin's `agents/`
directory; the bundled data-risk register is graded against its shipped state (a one-record
demo), not the full taxonomy an adopter mounts. Read the clusters below for the reasoning
behind each grade. The headline it encodes: **build-time frame strong, run-the-bank sparse.**

## Six clusters, graded

### A · Control-plane enforcement (HG catalog)

| Capability | State | What closes it |
|---|---|---|
| HG-0001 four-eyes merge · branch protection | **Enforced** | — |
| HG-0002 immutable control plane · supply-chain integrity | **Enforced** | — |
| HG-0007 / HG-0009 waist gate · develop diverges | **Enforced** | — |
| HG-0008 solution-agnostic seams | **Enforced** | — |
| HG-0003 tamper-evident sealed evidence | Named-only | Externally-anchored, tamper-evident evidence store |
| HG-0004 least-privilege identity · vaulted secrets | Named-only | Real IAM/PAM, HSM-backed vault, short-lived tokens, rotation |
| HG-0005 promotion + rehearsed rollback | Named-only | Environment segregation, change-ticket linkage, rollback drills |
| HG-0006 model-risk governance (see cluster B) | Named-only | The MRM apparatus in cluster B |
| HG-0010 cease-use switch · accountable officer | Named-only | A wired kill-switch + a named Senior Manager |
| HG-0011 onshore gateway · pre-egress DLP · attested sandbox | Named-only | Model gateway, DLP, sandbox execution where residency applies |
| HG-0012 controlled build/eval runtime | Named-only | Sealed history + egress allow-list + derivation-vs-retrieval audit |

Only four HG decisions are enforced by the bundled machinery; the rest are real ADRs
awaiting platform enforcement. This is the single biggest, and fastest, credibility gap.

*Shipped machinery for the control plane (loom-adopt harness):* a `control-plane-check.mjs`
CI gate that fails if any control-plane file loses its CODEOWNERS owner, a `CODEOWNERS.template`,
and an `activation-runbook.md` that walks a platform admin through activating HG-0001/0002/0004
(branch protection, ownership, least-privilege identity). The runbook makes HG-0004 *adoptable*
but not yet *enforced* — the real IAM/vault is still the adopter's to wire.

### B · Model risk & AI governance (SR 11-7 · PRA SS1/23 · EU AI Act · NIST AI RMF · ISO 42001)

| Capability | State | What closes it |
|---|---|---|
| Q1b anti-reward-hacking gate | **Enforced** | — |
| Independent model validation function | Absent | An MRM function separate from the builders |
| Agent eval harness · challenger models | Absent | A held-out eval suite + challenger comparison |
| Production drift monitoring | Absent | Ongoing performance/accuracy monitoring in prod |
| Model + prompt version pinning in evidence bundle | Absent | Pin and attest model + prompt versions per release |
| Replayable decision log | Absent | A reconstructable log of what the agent did and why |
| Fairness/bias testing · explainability · AI incident runbook | Absent | Where applicable to the use case |

The agent *is a model*. This cluster is the gap most specific to an AI-driven harness, and
the least addressed. Q1b and HG-0012 protect build *integrity* but are not model-risk
*management*.

### C · Assurance & audit (three lines of defence)

| Capability | State | What closes it |
|---|---|---|
| 1st-line reviewer agents (hard-stop · conformance · data-gov · boundary) | **Enforced** | — |
| Continuous-assurance agents (change-watch · risk-reviewer · attest · report · lineage) | Named-only | Step ① Watch (`change-watch`) now ships as a plugin agent; ②–⑥ remain described-not-shipped |
| Independent 2nd-line challenge function | Absent | Risk & compliance, organisationally separate |
| 3rd-line internal audit · read-only evidence portal | Absent | Auditor access to the sealed evidence trail |
| WORM · time-stamped evidence retention | Absent | Immutable store + trusted timestamping + retention policy |
| SOC 2 / ISO 27001 attestation of the harness | Absent | Third-party attestation of the harness itself |

The evidence bundle is *sealed* but not shown to be WORM, time-stamped, or examinable by an
independent party — the difference between self-assurance and examinable assurance.

### D · Data-governance depth (BCBS 239 · PDPL · residency)

| Capability | State | What closes it |
|---|---|---|
| D6 register seam + data-governance-reviewer | **Enforced** | — |
| Q4.5 lineage emission · pii-guard hook | **Enforced** | — |
| Full risk taxonomy | Absent | The bundled register is a one-record demo (DR-1 only) — mount the real taxonomy |
| Retention + right-to-erasure enforcement | Absent | INSERT-only audit is the *opposite* of deletion-on-request; needs a governed erasure path |
| Real-data control surface (KMS · field encryption · tokenization · access logging) | Absent | The harness is synthetic-only by design; the real-PII surface is unbuilt and untested |
| Data residency (HG-0011) | Named-only | Residency-controlled model traffic + execution |

The *shape* is right; the depth is demo-grade. The real-data control surface being unbuilt
is the caveat that sits under everything else.

### E · Security & resilience breadth (DORA · FAPI · Basel)

| Capability | State | What closes it |
|---|---|---|
| Q2 SAST · Q4 SCA + secrets (current) | **Enforced** | Gates exist — fill with real scanners (e.g. Snyk Code/Open Source/Container, Chainguard images) |
| DAST · penetration testing | Absent | Add as gates / scheduled assurance |
| Threat modelling (STRIDE) gate · secrets-history scan | Absent | A threat-model gate; history-aware secret scanning |
| Operational resilience (BCP/DR · RTO/RPO · chaos · SEV · SLOs) | Absent | The run-the-bank surface — entirely outside a build-time frame |
| Pre-egress DLP (HG-0011) | Named-only | Wired DLP on model egress |
| FAPI 2.0 / mTLS conformance | Named-only | Conformance suite as a gate (domain-specific) |

Security testing stops at SAST + SCA. Operational resilience is absent because the Loom
governs the build, not the running system — a whole domain a bank needs and this harness
does not touch.

### F · Operating model & production proof (SMR/SMCR · examination)

| Capability | State | What closes it |
|---|---|---|
| Named accountable officer (HG-0010) | Named-only | Appoint and document the Senior Manager |
| Senior-manager regime · board oversight · RACI | Absent | The governance operating model around the loop |
| Supervised production pilot | Absent | A real, supervised run on non-synthetic scope |
| Legacy / core-banking integration patterns | Absent | The integration cost the demo never paid |
| Live regulator examination | Absent | The proof the method has not yet earned |

These are the Loom's own stated limits (`SKILL.md`), made specific: proven on synthetic data
in one greenfield domain, permanently non-production, no legacy integration, no live exam.

## Close in this order

Sequenced so each step buys the most credibility for the least motion.

1. **Enforce the whole HG catalog.** Take the enforced set from 4 → 12 (IAM/secrets,
   promotion + rollback, DLP/gateway). The paper-to-platform gap is the fastest win, and it
   is decisions already made — only the enforcement of record is missing.
2. **Stand up model-risk management.** Eval harness + drift monitoring + independent
   validation + model/prompt pinning in the evidence bundle. The gap most specific to an AI
   harness.
3. **Independent 2nd line + WORM evidence.** Turn self-assurance into examinable assurance:
   an org-separate challenge function and immutable, time-stamped auditor evidence.
4. **Real-data surface + full register.** Synthetic-only is the caveat under everything
   else. Build and exercise the real-PII control surface against the complete taxonomy.

## The rule under all of it

A reviewer agent that honours a rule is hygiene; the **control** is the platform mechanism
the agent cannot bypass (branch protection, protected CI, managed settings, a vault, a
gateway). Most of this gap is not "the Loom decided wrong" — the HG catalog decides right.
It is **Named-only → Enforced**, plus the run-the-bank domains a build-time frame was never
scoped to cover. See `governance.md` (the HG catalog and its enforcement-of-record rule),
`delivery-harness.md` (the Q-gates), `continuous-assurance.md` (the assurance lifecycle),
and `discovery-harness.md` §5.1 (the data-risk register seam).
