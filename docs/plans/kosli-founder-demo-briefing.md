# Tailoring the Loom demonstration for Kosli's founders

Prepared 14 September 2026. Private discussion material. Recommendation, not an agreed partnership or implementation commitment. Assumption: a 25-minute demonstration leading to discussion of a bounded joint evaluation; meeting objective and duration remain to be confirmed.

**Recommendation:** present Meridian Trust as a prospective banking customer trying to turn a strategic ambition into an accountable, AI-assisted change. Use Loom to expose the institutional decisions and translate them into delivery obligations. Show Kosli as the governance infrastructure with which that workflow should integrate. Demonstrate the relationship through one inspectable change, including a refusal, rather than a tour of the methodology or plugin catalogue.

**The positioning correction**

Kosli currently presents itself as governance infrastructure for the AI SDLC. Its governance-engineering framework includes evidence, controls, audit and insight. This is substantial overlap with the vocabulary of the Loom; pretending otherwise would undermine credibility with its founders. [Kosli homepage](https://www.kosli.com/), [Governance Engineering](https://www.kosli.com/governance-engineering/).

The productive distinction is the proposed division of responsibilities in a customer's operating model, not a claim that Kosli cannot express something. Loom offers a structured intervention method, institutional context, domain interpretation and an adopted agent workflow. Kosli offers infrastructure into which approved obligations, evidence and decisions can be integrated. The bank owns the business decision, risk appetite and authority to operate.

Avoid the current local seam document's categorical claim that Kosli starts at the first commit. Kosli explicitly describes Flows as supporting business processes as well as delivery pipelines. Its participation in the FINOS SDLC Common Control Catalog also makes a requirements-to-runtime conversation natural. Propose connecting earlier decisions to the delivery record; do not claim to have discovered a lifecycle boundary Kosli cannot cross. [Flows](https://www.kosli.com/flows/), [FINOS proposal](https://github.com/finos/community/issues/425).

**Why this particular banking story fits**

The relevant audience is a regulated institution's product sponsor, engineering-platform owner and control owner acting together. Kosli's public customer material includes Deutsche Bank and ADCB testimonials. Its older Modulr payments case describes the burden of assembling evidence and scaling manual change approval. Use those concerns to make the fictional customer recognizable; do not imply any named customer wants or has endorsed Loom. [Customer stories](https://www.kosli.com/case-studies/), [Modulr case, published 2023](https://www.kosli.com/case-studies/modulr/).

Give Meridian a recognizable institutional situation: several product teams, existing CI/CD and security tooling, formal control owners, and pressure to use coding agents. These are proposed fictional details. Avoid inventing customer research findings, regulatory approvals or quantified savings.

Opening script:

> You are Meridian Trust's platform and engineering leadership. Your retail sponsor wants a more useful relationship with customers who manage money across several banks. They believe a personal-finance app with transfers might help. You must decide whether that is worth pursuing, then enable an AI-assisted team without losing control of intent, authority or evidence. What would you need to see before you let the team proceed?

Open Finance makes the consequences concrete, but it is the domain of the example rather than the product being sold. Do not spend the meeting teaching every API, permission or jurisdictional requirement. Meridian's legal entity, applicable permissions and participating-bank capabilities remain explicit discovery questions.

**Explain the product hierarchy once**

| Term | Meaning in this demonstration |
| --- | --- |
| The Loom | Method for deciding whether and how to intervene: Discover, Define, Develop, Deliver, with operational learning returning to the decision. |
| The Loom Toolkit | Adoptable implementation of that method: context, roles, work products, checks and evidence conventions. |
| AI-DLC | The repository/distribution and supporting AI-delivery foundations used to put that workflow into practice. Avoid introducing it as a second competing method. |
| Open Finance pack | Optional domain material that makes the generic workflow specific to the proposed service; it does not grant permission to operate. |
| Kosli | Proposed connected governance infrastructure for evidence, control evaluation and the relationship between delivery and running software. |

Loom informs delivery by producing decisions and constraints that survive handoff: approved scope, rejected alternatives, authority boundaries, acceptance conditions, owners and unresolved issues. A coding agent receives those constraints as work context; executable mechanisms check the portions that can actually be checked. Judgment and institutional approval do not become true merely because an agent writes them into a file.

**One thread through the complete intervention**

Use the customer question: “Can I understand my commitments across banks and move money confidently?” The strategic interest is becoming useful in everyday money decisions. PFM and payment initiation are competing or complementary hypotheses, not the starting authorization.

| Stage | Meridian's decision | What the audience sees |
| --- | --- | --- |
| Discover | Is the customer problem sufficiently important, and is Open Finance a useful solution domain? | Sponsor interest, research plan, alternatives and a decision authorizing discovery only. A stop is a legitimate outcome. |
| Define | Is PFM alone sufficient, or is a customer-initiated transfer essential? | Bounded scope, commercial assumptions, legal/platform questions, owners and permission for a synthetic prototype only. |
| Develop | What must the implementation preserve? | One obligation translated into acceptance criteria, an agent task and an executable check, with attribution and version references. |
| Deliver | Is there enough trustworthy evidence for the authorized next step? | A release decision that distinguishes passing software checks from unresolved operational or institutional blockers. |
| Run and reconsider | Is the approved software running, and does the service actually help customers? | Separate software/runtime observations from payment operations and customer-outcome signals; show how either can reopen a decision. |

For the future integrated slice, delayed payment status is a strong candidate. A response timeout must not become an unsupported claim that payment failed. A proposed Meridian policy could require preserving the reference, investigating the existing outcome and preventing an unsafe retry. This is a proposed product obligation for the fictional case, not a statement that all these mechanisms are implemented or that this alone satisfies payment regulation.

The present operations-queue demo already provides a narrower, honest bridge: preserve the original exception information and an attributable history when a resolution is added. Show its actual behavior and repair evidence. Explain that it demonstrates a mechanism relevant to payment operations; it is not an executed PFM/payment application. If a unified payment story is desired, build and test that specific fixture before representing it as the same end-to-end journey.

**The proposed integration contract**

```text
Bank-owned mandate, scope, authorities and control policy
                         |
               Loom workflow and context
                         |
       Agent change -> isolated checks and reviewers
                         |
        Trusted publisher -> Kosli evidence / policy record
                         |
              Bank's release/deployment control
                         |
          Running artifact <-> runtime observations

Business and payment telemetry -> Loom outcome review -> revised mandate
```

This diagram is a target responsibility model. It is not a claim that every arrow is live in the current demo. Kosli describes build/release/run coverage, automated approval of qualifying low-risk changes, and comparison of approved and running software. The actual enforcement point and permissions must be agreed and demonstrated in the selected platform. [How Kosli works](https://www.kosli.com/how-it-works/).

For one synthetic change, make the join inspectable: mandate ID, obligation ID, control-catalog version/hash, change/commit, artifact fingerprint, check result, authenticated producer, applicable approval and external record reference. Expose only the minimum appropriate metadata; raw customer or account data should not be required for this exercise.

Use one authoritative control definition and explicit mappings to external policy. If Loom and Kosli both evaluate something, explain which result governs release and how disagreements are resolved. A locally queued record is not external custody. A successful upload is not verification that the assertion is true. An attestation carrying a signature is not proof that Kosli checked that signature. An actor field saying “human” is not independently authenticated human approval.

Keep the agent outside the authority to change protected checks, issuer credentials and release policies. A prohibition in repository text is insufficient if the same agent can change the check or obtain the publishing secret. Read-only access to evidence can assist the agent; the trusted publisher needs a separately enforced identity and boundary.

Preserve human accountability without inserting a new manual approval for every change. The institution can authorize a policy envelope; routine qualifying changes can follow its automated path where supported. Humans decide exceptions, material scope changes and decisions reserved to them. This is a design direction to validate, not a claim of a currently demonstrated Loom/Kosli automatic-release integration.

**What is demonstrated today**

| Material | Defensible statement | Boundary |
| --- | --- | --- |
| Private Open Finance illustration | Authored Meridian decisions explain the intervention cycle and a blocked production decision. | Fictional planning; no executed payment, certification or customer evidence. |
| Working operations demo | Synthetic exception assignment/resolution/history, deterministic refusal checks and recorded bounded agent repair are documented locally. | Separate from the Open Finance illustration; no bank deployment. |
| Second-team exercise | Prepared teams inherited shared context while retaining team-specific settings. | Prepared local fixtures, not independent customer onboarding or proven savings. |
| Kosli adapter | CLI wrapper, posting/readback, missing-evidence handling, outbox and runtime-query mechanics exist in source. | Targeted verification uses a simulated CLI. |
| Live Kosli integration | A real-mode demonstration path exists. | No successful live-org integration report was established in this review. |

On 14 September, the three targeted adapter/seam/CLI test files passed: 26 tests, zero failures. This proves the exercised local contracts against fixtures. It does not qualify the live API, server-side policy evaluation, runtime collector, trusted identity or enforcement configuration. No live Kosli writes were performed for this analysis.

The local case study reports an actual bounded repair and independent targeted rerun. Its reported model cost excludes preparation, human time, original application work and integration. Do not use that number as an end-to-end productivity claim. Prefer observable outcomes: a check identified a defect, the agent corrected it, another review found an omission, and the corrected behavior was rerun.

**Recommended 25-minute demonstration**

| Time | Screen or artifact | Point to make |
| --- | --- | --- |
| 0–3 min | Meridian mandate and three role cards: product sponsor, platform owner, control owner | Put the founders in the bank's decision, not in a product-tour audience. |
| 3–6 min | Discover/Define decision | Ask whether they would approve PFM plus transfers yet; show why discovery or a narrower scope is the answer. |
| 6–10 min | One obligation traced into a task and acceptance condition | Show precisely how Loom changes what the AI-assisted team receives and must demonstrate. |
| 10–15 min | Existing operations behavior, failing check, recorded repair and rerun | Demonstrate bounded execution and refusal; explicitly identify the separate synthetic mechanics example. |
| 15–20 min | Evidence contract and Kosli view, if live-verified; otherwise a labelled adapter walkthrough | Let them inspect the intended handoff, identity boundary and authoritative record. |
| 20–23 min | Conditional Run feedback and second-team reuse | Show continuing control and reuse, plus where business outcomes require separate telemetry. |
| 23–25 min | One bounded evaluation proposal | Ask what would make this valuable and credible in a bank they know. |

If the slot is 15 minutes, shorten discovery and reuse; retain the concrete obligation, failed check and integration boundary. If technical feedback is the purpose, devote the closing discussion to the event contract and trust boundary. If partnership is the purpose, focus on a repeatable joint customer motion rather than asserting an OEM or reseller model prematurely.

**Founder-level objections to address proactively**

“Is this another governance platform?” Answer: identify the overlapping concepts candidly and show where existing Kosli/platform capabilities are reused. Loom's proposed contribution must earn its place through domain translation, institution-owned context and repeatable adoption.

“Why isn't this a set of prompts?” Show versioned authority, deterministic refusals, provenance and reuse. Also acknowledge that protected execution and authentic approval require infrastructure beyond prompts and repository declarations.

“Can the agent mark its own work compliant?” Show the publisher/runner boundary and the negative case. Distinguish today's synthetic role checks from a bank's authenticated separation of duties.

“Does this create extra approval overhead?” Show risk-proportionate handling and a narrow control mapping. Measure review effort instead of presuming governance reduces it.

“Does Kosli prove the payment is safe?” No. Delivery evidence, deployed identity, payment authorization, settlement/status reconciliation and customer value are different questions with different authoritative sources.

“Will another team adopt it?” Show the prepared reuse exercise, then propose testing with an unfamiliar team and measuring onboarding effort. Do not confuse idempotent file import with organizational adoption.

**Changes to prepare before the meeting**

1. Add a Kosli-facing presenter route or introduction within the private demo. Lead with the mandate and roles; retain the full method detail as optional exploration.
2. Add a persistent, compact evidence legend: fictional planning; executed local check; recorded agent run; simulated provider; verified external record. Make status visible on the artifact where the claim appears.
3. Add one traceable change view and the explicit transition from planning illustration to operations mechanics. Either preserve their separation or build the missing payment-specific slice; do not silently relabel recordings.
4. Add a Kosli responsibility/evidence view with authoritative source, producer, check, external reference and verification status. Avoid fabricating a live dashboard.
5. Correct the “first commit” and “Kosli only stores” framing in the supporting seam narrative. Preserve the useful provider-neutral architecture.
6. Rehearse the refusal and repair before optional installation details. Keep the public website unchanged for this audience-specific material.

Candidate implementation locations: private scenario/presenter content in `middleleap/loom-private-demo/private-source/`; reusable rendering in `ai-dlc/scripts/customer-demo-illustration.mjs` and the customer-demo source; adapter-specific evidence under the Loom harness. Generated private `dist/` content should follow the established export workflow, not become an independent source of truth.

**Implementation status (14 September, this repository)**

| # | Change | Where | Status |
| --- | --- | --- | --- |
| 1 | Presenter route — mandate and three role cards above the method detail | `scripts/customer-demo-illustration.mjs` (`presenter` block, optional) | Rendering and validation done; the private scenario JSON must add the block |
| 2 | Persistent evidence legend, status on the artifact where the claim appears | `scripts/customer-demo-illustration.mjs` (`evidence_status` per excerpt, legend always rendered); `demo/run-demo.mjs` tags every step with the same vocabulary | Done |
| 3 | One traceable change with the explicit planning → mechanics transition | `harness/demo/run-demo.mjs --scenario meridian` + `harness/demo/meridian/` — one fictional Meridian obligation (`OB-AE-MTPOL-PSI-001`, payment-status integrity) → register rows → demo-scoped `PAYMENT-STATUS` control → executable check; first cut refused, scripted repair, rerun, record posted with the obligation id | Done against the fake; the repair is scripted and labelled so, not a recorded agent run |
| 4 | Kosli responsibility/evidence view with source, producer, check, external reference and verification status | `harness/scripts/record-join.mjs <CHG> --obligation <OB>` — one table, per-row VERIFIED / DECLARED / RESOLVED · LIVE or SIMULATED / NOT CHECKED; `--out` renders a page | Done; no live dashboard is fabricated — the fake is detected from its bytes |
| 5 | Correct the "first commit" and "Kosli only stores" framing | `loom/references/kosli-seam.md` §1 and §6, `loom/references/core.md` "Where Kosli sits" | Done |
| 6 | Rehearse refusal and repair; public website unchanged | `run-demo.mjs --scenario meridian` runs in CI (`validate.yml`) | Done; website untouched |

Also fixed on the way: the default demo's pr lane was red on eight gates (missing fixtures the CI dry-run stages, and the demo's own signing key tripping the secrets gate). It is now green, and the script fails if it is not, so the only failures on screen are the deliberate ones.

Still outside this repository: the operations-queue demo, the case study, the pilot offer and the second-team exercise (private material on the presenter's machine and in `loom-private-demo`), and the live-org integration run (`docs/integration-run.md`, still owed). The join and the scenario say `simulated provider` until that run exists.

**The minimum credible joint technical evaluation**

Use a synthetic non-production change, one bank-style obligation, one real Kosli sandbox flow/trail and one deliberately failing check. Demonstrate an authorized producer posting the result, retrieving its external reference, evaluating the agreed control, withholding advancement when required evidence is missing, then succeeding after an actual repair. Bind the result to the exact change and artifact. Test provider failure separately from an absent/forged record. Runtime correlation is an additional proof, not an assumed consequence of successful posting.

For the founders, the commercial hypothesis is that Loom could help a bank make useful, policy-aligned inputs and evidence available to its Kosli-enabled delivery platform, while reducing repeated team setup and interpretation. Neither improved conversion nor reduced services effort is established. A sensible next step is a bounded joint evaluation with one product sponsor, platform owner and control reviewer, followed by an unfamiliar second team.

Measure time to onboard, manual evidence-assembly effort, traceability completeness, false refusals, defect detection and review effort against an agreed baseline. Agree success thresholds with the participants. Keep business-value validation and live-service readiness separate from this delivery-mechanics evaluation.

Closing question:

> If Meridian were your customer, where would you want Loom to stop and Kosli to take responsibility—and what single end-to-end proof would make you comfortable testing this together?

**Local evidence inspected**

- `plugins/middleleap-loom/skills/loom/references/kosli-seam.md`
- `plugins/middleleap-loom/skills/loom-adopt/harness/docs/kosli-surface.md`
- `plugins/middleleap-loom/skills/loom-adopt/harness/core/providers/kosli.mjs`
- `plugins/middleleap-loom/skills/loom-adopt/harness/demo/run-demo.mjs`
- `docs/demos/loom-customer/case-study.md` — local, uncommitted; not on any branch of this repository
- `docs/demos/loom-customer/pilot-offer.md` — local, uncommitted; not on any branch of this repository
- `loom-private-demo` `private-source/open-finance-illustration.json` — private repository

Source review used the current local checkout, whose tracked HEAD was `36ea325e3db363f8130e638675b96184f95cf2f0`, plus existing local demo work and the private scenario copy. It did not certify that every local capability is present in the hosted demo or current remote main. Public positioning was researched live; no authenticated live demo or Kosli organization was exercised during this review.
