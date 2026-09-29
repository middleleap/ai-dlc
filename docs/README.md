# docs/

Working documents behind the plugins. Only the two decks linked from the root README are
reader-facing; everything else is a plan, a record or research, shown with the status it
declares about itself. "—" means the file declares none. "Cited by" lists references from code
or READMEs outside `docs/`; a document cited by harness code must not be moved or renamed
without updating that code.

## Reader-facing decks

| Document | What it is | Status | Cited by |
|---|---|---|---|
| [the-loom.html](the-loom.html) | The Loom, explained for people who will run it | — | README.md, plugins/middleleap-loom/README.md, loom/assets/loom-stream.html |
| [loom-for-the-value-chain.html](loom-for-the-value-chain.html) | The Loom for the people who approve it: sponsor, product, engineering, risk, audit, operations, security | — | README.md |

## Other decks

| Document | What it is | Status | Cited by |
|---|---|---|---|
| [the-loom-walkthrough.html](the-loom-walkthrough.html) | Presenter walkthrough of the Loom; lists some since-retired skills | — | — |
| [loom-factory-floor.html](loom-factory-floor.html) | The Factory Floor surface, visualised | — | — |
| [loom-notion-architecture.html](loom-notion-architecture.html) | The Notion-hosted Factory Floor architecture | — | — |
| [loom-kosli-overlap.html](loom-kosli-overlap.html) | Where the Loom and Kosli overlap | "Identifiers cited in this note are drafts" | — |

## Architecture decisions (`adrs/`)

| Document | What it is | Status | Cited by |
|---|---|---|---|
| [0001-api-compatibility](adrs/0001-api-compatibility.md) | Factory Floor API compatibility | accepted 2026-07-26 | harness id-legibility-check.test.mjs |
| [0002-sync-service-hosting](adrs/0002-sync-service-hosting.md) | Where the sync service runs | accepted 2026-07-26; open AWAITING items | — |
| [0003-freeze-trigger-ux](adrs/0003-freeze-trigger-ux.md) | How a freeze is triggered | accepted 2026-07-26; one AWAITING item | — |
| [0004-projection-cadence](adrs/0004-projection-cadence.md) | How often the floor is projected | accepted 2026-07-26; one AWAITING item | — |
| [0005-human-assertion-mechanism](adrs/0005-human-assertion-mechanism.md) | How a human assertion is captured | accepted 2026-07-25; open AWAITING items | — |
| [0006-core-scripts-layering](adrs/0006-core-scripts-layering.md) | Layering between core/ and scripts/ | proposed; decider AWAITING | — |

## Loom 2.0 planning (July 2026)

| Document | What it is | Status | Cited by |
|---|---|---|---|
| [loom-2.0-baseline.md](loom-2.0-baseline.md) | Baseline recorded against middleleap-loom 1.9.1 | — ("bundle side complete") | — |
| [loom-2.0-plan.md](loom-2.0-plan.md) | The 2.0 plan | proposed | harness architecture-assurance-check.mjs, loom/assets/loom-stream.html |
| [loom-2.0-rc7-plan.md](loom-2.0-rc7-plan.md) | The rc.7 slice of 2.0 | proposed | — |
| [loom-control-plane-plan.md](loom-control-plane-plan.md) | The control-plane plan | proposed | — |
| [loom-flow-plan.md](loom-flow-plan.md) | The flow plan | proposed; body records items landed at rc.33–35 | — |
| [loom-plans-and-ga.md](loom-plans-and-ga.md) | How the plans map to general availability | note, recorded at 2.0.0-rc.16 | — |

## Notion Factory Floor (July 2026)

| Document | What it is | Status | Cited by |
|---|---|---|---|
| [notion-floor-plan.md](notion-floor-plan.md) | The Notion Factory Floor plan | v2, proposed 2026-07-25 | harness adapter-evidence-check.mjs, floor-keeper-check.mjs, approval-attestation-example |
| [notion-floor-alpha-walkthrough.md](notion-floor-alpha-walkthrough.md) | A simulated alpha walkthrough | — (a simulation, recorded 26 Jul) | harness freeze-example/README.md |
| [notion-floor-identity-mapping.md](notion-floor-identity-mapping.md) | Identity mapping between Notion and the repo | DRAFT — not approved; owner AWAITING | harness core/identity-map.mjs, identity-map-check.mjs |
| [notion-floor-threat-model.md](notion-floor-threat-model.md) | Threat model | DRAFT — not reviewed, not approved; owner AWAITING | harness floor-keeper-check.mjs, projection-capability-check.mjs |
| [notion-floor-residency-review.md](notion-floor-residency-review.md) | Data-residency review record | DRAFT — not approved; owner AWAITING | harness residency-check.mjs |
| [notion-floor-residency-review-example.md](notion-floor-residency-review-example.md) | A filled-in example of that record | ILLUSTRATIVE | — |
| [notion-floor-p1-decision-worksheet.md](notion-floor-p1-decision-worksheet.md) | P1 decision worksheet | — (twelve AWAITING items) | — |
| [notion-floor-p1-reviewer-brief.md](notion-floor-p1-reviewer-brief.md) | Brief for the P1 reviewer | — | harness core/residency.mjs |
| [notion-floor-p1-vendor-questionnaire.md](notion-floor-p1-vendor-questionnaire.md) | Vendor questionnaire | ready to send | — |
| [notion-floor-sso-runbook.md](notion-floor-sso-runbook.md) | SSO runbook | operational draft | — |

## Pilots (`pilots/loom-onboarding/`)

| Document | What it is | Status | Cited by |
|---|---|---|---|
| [README.md](pilots/loom-onboarding/README.md) | The onboarding pilot | — (no participant results yet) | scripts/onboarding-pilot.mjs (reads it) |
| [coordinator.md](pilots/loom-onboarding/coordinator.md) | The coordinator's guide | — ("no participant has yet been recruited") | scripts/onboarding-pilot*.mjs (reads/copies it) |
| [runtime-qualification.md](pilots/loom-onboarding/runtime-qualification.md) | Runtime qualification cases | — (open acceptance cases) | — |
| [tasks.json](pilots/loom-onboarding/tasks.json) | Pilot task list | — | scripts/onboarding-pilot.mjs, harness configuration-tasks.mjs |

## Plans (`plans/`)

| Document | What it is | Status | Cited by |
|---|---|---|---|
| [2026-09-16-consolidated-landing-plan.md](plans/2026-09-16-consolidated-landing-plan.md) | Landing plan for the September work | 2 of 50 steps ticked | — |
| [loom-product-direction.md](plans/loom-product-direction.md) | Product direction, phases 1–6 | phases 1–4 locally implemented; 5 partially live-qualified; 6 not yet run | — |
| [loom-codex-live-qualification.md](plans/loom-codex-live-qualification.md) | Codex runtime qualification (+ [evidence](plans/loom-codex-live-evidence.json)) | — ("partial runtime qualification, not approval") | harness runtime-contract.md |
| [loom-onboarding-browser-acceptance.md](plans/loom-onboarding-browser-acceptance.md) | Agent-operated browser acceptance | — | — |
| [loom-onboarding-release-validation.md](plans/loom-onboarding-release-validation.md) | Release validation (+ [evidence](plans/loom-onboarding-release-evidence.json)) | — (browser and user testing open) | — |
| [meridian-obligations-citations-2026-09-16.md](plans/meridian-obligations-citations-2026-09-16.md) | Proposed citations for the Meridian obligations | PROPOSAL — nothing written into the demo | — |
| [loom-kosli-integration/](plans/loom-kosli-integration/README.md) | Kosli integration PRD, tasks and execution notes | superseded 16 Sep 2026 by the harness's kosli-seam.md | apps/loom-console |

## Other

| Document | What it is | Status | Cited by |
|---|---|---|---|
| [private-demo-illustration.md](private-demo-illustration.md) | Usage note for scripts/customer-demo-illustration.mjs | — | — |
| [research/ai-dlc-harness-landscape-2026-07.md](research/ai-dlc-harness-landscape-2026-07.md) | Competitive and trends scan of AI-DLC harnesses | research, July 2026 | — |
| [research/notion-software-factory-collaboration-2026-07.md](research/notion-software-factory-collaboration-2026-07.md) | Notion as a software-factory collaboration surface | research, July 2026 | — |
| [simulations/notion-e2e/](simulations/notion-e2e/README.md) | End-to-end Notion simulation, run 26 Jul 2026 | — ("four checks, all green") | .gitignore (its token file) |
| [superpowers/](superpowers/) | Implementation plans and specs written with the superpowers skills | see each file; the 29 Sep plan is merged (PRs #92–#96) | — |
