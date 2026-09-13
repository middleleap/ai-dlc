---
artifact: business-case
stage: develop
case_stage: "<1 | 2>"
run: "<slug>"
handoff: "discovery/runs/<slug>/handoff.md"
sdr: "docs/develop/<slug>.md"
write_class: decision-routed
authority: none
decision_record: "<ADR id or decision-envelope id once the funding decision is made — empty until then>"
---

# Business case — <slug>

> **Identifiers.** Gate ids (`D1`–`D9`, `Q1`–`Q5`) and run-level ids (`S-001` signal, `H1`
> hypothesis) are expanded in `discovery/GLOSSARY.md`. `SI-*` is a strategic intent from the
> institutional intake, where one exists.

> **What this is.** Delivery got cheap; change did not. The build is now the smaller part of
> what a change costs a regulated institution — organisational change, legal and contractual
> work, control-function time, operations and run, and the attention of the people who must
> approve it all move at the institution's pace, not the agent's. This template exists so the
> decision to fund a change is made against the **total cost of change** and against benefits
> that are the **D1 success measures**, so they can be measured after launch rather than
> forgotten.
>
> **What this is not.** It is not an approval. Write class `decision-routed`: the funding
> decision becomes real only as a signed decision record a second human merges (an ADR or a
> decision envelope under HG-0013); this document is the *proposal* that record cites. The Loom
> approves nothing. Nor is it a product approval — PA1/PA2 (the product passport) carry the
> conduct-and-risk position; this carries the money and the change.
>
> **Two stages.** Stage 1 is a one-page pre-screen: it can be written from the discovery
> hand-off alone, and on a Factory Floor it *is* the catalog-C product brief hardened. Stage 2
> is the full case and needs a chosen direction, so it is written **after** the Solution
> Direction Record and **before** the backlog item is admitted. Fill only the sections your
> stage needs; the stage-2 sections are marked.

**Proposed:** <YYYY-MM-DD> · **Proposer:** <role> · **Decision requested:** <fund · continue · stop>
**Decision authority (from `institution/brainkit/governance.md`):** <ADOPT: role or committee>
**Threshold band (ADOPT: the institution's own):** <e.g. below / above the committee threshold>

## 1. The problem, and the intent it serves

> Quote, do not restate. The problem is frozen in `problem-statement.md`; a business case that
> re-frames it has left the run.

- **Problem (D1):** `discovery/runs/<slug>/problem-statement.md` — <one line, quoted>
- **Target user:** <from the problem statement>
- **Strategic intent:** <`SI-nn` — one line> — or *"no strategic intent recorded"*, stated plainly
- **Evidence base (D2):** <count> signals, <count> `[synthetic]`

## 2. The direction, and what else was considered *(stage 2)*

> From the SDR. The alternatives table is what makes this a case rather than a request.
> **"Do nothing" is a mandatory row** — its cost is the baseline every other row is measured
> against, and it is the row most often left out.

| # | Direction (from SDR) | One-line shape | Why it was killed / survived | Rough cost band |
|---|---|---|---|---|
| 0 | **Do nothing** | Keep the current state | The baseline | <cost of the problem continuing, per year> |
| 1 | | | | |
| 2 | | | | |
| 3 | **Chosen** — | | | |

## 3. Benefits — the D1 success measures, valued

> **The rule that keeps this honest:** a benefit that is not a D1 success measure is not a
> benefit of *this* change. Either it belongs in the problem statement (re-freeze the run) or it
> is dropped. The `product-eval-check` gate later scores every D1 measure against the shipping
> commit, so what is written here is what will be measured, by construction.

| D1 measure | Baseline → target | Value driver | Value (ADOPT: currency) | From when | Measured how (→ `docs/governance/product-evals.json`) | Confidence |
|---|---|---|---|---|---|---|
| | | <revenue · cost · loss avoided · capital · regulatory> | | | | <high / medium / low> |

- **Benefits finance does not count (ADOPT: from intake block H):** <list — and state whether any
  benefit above depends on them>
- **Dis-benefits:** <what gets worse for someone, and for whom>

## 4. Total cost of change

> One-off and recurring, separately. The build row is the one the Loom can instrument (the token
> ledger, `token-report`); every other row is a human estimate and says so. **The rows most
> often under-counted are marked ▲.**

| Cost line | One-off | Recurring / yr | Basis of estimate | Owner role | Confidence |
|---|---|---|---|---|---|
| Build — agent (token ledger) | | | `docs/governance/token-ledger.json` | engineering | |
| Build — human (facilitation, review, four-eyes) | | | | engineering | |
| ▲ Organisational change — process, training, comms | | | | operations / HR | |
| ▲ Legal and contractual — NDAs, vendor onboarding, outsourcing notification | | | | legal | |
| ▲ Control functions — risk, compliance, data protection, model risk, audit | | | | risk second line | |
| ▲ Operations and run — support, monitoring, on-call, hosting | | | | operations | |
| Third parties and licences | | | | procurement | |
| Decommissioning / migration of what this replaces | | | | | |
| Contingency (ADOPT: institution's own rate) | | | | | |
| **Total** | | | | | |

## 5. Financial summary *(stage 2)*

> Use the institution's mandated method (ADOPT: from intake block H). If there is none, say so
> and show payback only — do not invent a hurdle rate.

| Measure | Value | Method / assumption |
|---|---|---|
| Horizon | <years> | ADOPT |
| Hurdle / discount rate | <%> | ADOPT: source |
| NPV | | |
| IRR | | |
| Payback | | |

**Sensitivity** — three cases, each moving one thing:

| Case | What moves | Effect on NPV / payback |
|---|---|---|
| Benefits −30 % | | |
| Change costs +50 % | | |
| Launch slips <n> months | | |

## 6. Risk and governance position

> Cite; do not re-assess. The positions below are held elsewhere and this case inherits them.

- **Data-governance verdict (D6):** `discovery/runs/<slug>/data-governance.md` — <Yes / Conditional / No>, conditions carried: <list or "none">
- **Product approval (PA1/PA2), if compiled:** <passport id and status, or "not compiled at this tier">
- **Inherent risk ratings, if assessed:** <from the passport>
- **Dependencies:** <systems, teams, third parties, decisions in `docs/adrs/` this rests on>
- **Assumptions that would change the answer:** <three at most, each falsifiable>

## 7. Delivery and exposure *(stage 2)*

- **Staged rollout:** <the pilot-playbook cohorts this will pass through, and the exit criterion for each>
- **First value date:** <when the first D1 measure is expected to move>
- **Kill criteria:** <what observation ends this change before it completes, and who calls it>
- **Backlog items this case unlocks:** <ids, each carrying `discovery: <slug>` and `sdr:`>

## 8. Benefits realisation

> Someone owns each measure after launch, and there is a date on which someone looks.

| D1 measure | Owner role | First review | Subsequent cadence | Where the number will come from |
|---|---|---|---|---|
| | | | | |

## 9. Roster — who this goes to

> This table is the **roster**, not the approval. The decision is recorded in `decision_record`
> (front-matter) as an ADR or decision envelope merged by a human other than the proposer.
> Names resolve through `docs/governance/identities.json`; roles only here.

| Role | Function | Consulted / decides |
|---|---|---|
| Proposer | | proposes |
| Finance | | consulted |
| Risk, second line | | consulted |
| Accountable executive | | **decides** |

> **Not here:** endpoints, schemas, stories, or a re-framing of the problem. If writing this case
> changed your mind about the problem, that is a discovery finding — take it back through the
> left diamond, do not resolve it in a spreadsheet.
