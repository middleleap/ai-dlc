# Continuous assurance — agents, not meetings

Standing up the Loom is one thing; keeping a regulated entity compliant forever is another.
Traditionally that means humans in the loop and an endless calendar of review, risk, control
and sign-off meetings — and assurance that is only ever as fresh as the last one. On the Loom,
the harness pulls specialised agents into that same lifecycle **continuously** — on every
change, on a schedule, and on events — so every audit and regulatory commitment is
continuously evidenced and pre-checked by agents, and **confirmed by accountable humans**.

Read honestly, what ships today is an **assurance protocol and its validation framework**: the
`assurance-cycle-check` gate proves a signed, fresh six-step cycle record exists, and steps
① Watch and ② Assess ship as agents. The scheduler, regulatory-intelligence feed, SIEM/telemetry
integration, incident detection and the independent confirmation function that *produce* those
records are the adopting institution's to wire — the frame checks the record; it does not yet run
the whole cycle. See `bank-grade-gap.md` for the per-step state of record.

## The triggers

The harness pulls assurance agents in:

- **on every change** — every commit / PR, every merge / deploy
- **on a schedule** — daily / continuous monitors
- **on events** — a new regulation, a certificate expiring within its warning window, a
  scheme or risk signal, a newly-disclosed CVE in a shipped dependency (see
  `supply-chain-security.md`)

## The regulatory lifecycle — each step run by an agent

Each step below was traditionally a meeting. On the Loom it is run by an agent the harness
pulls in, with humans reserved for judgement and the approvals that must stay human:

| # | Step | Agent(s) | Replaces |
|---|---|---|---|
| ① | **Watch** | change-watch — regulatory & risk horizon scan | periodic review |
| ② | **Assess** | risk-reviewer — risk & impact review | risk committee |
| ③ | **Check** | conformance + hard-stop reviewers — spec & hard-stop check | design review |
| ④ | **Test** | gate runners — controls, the Q-gates | control-test cycle |
| ⑤ | **Evidence** | audit + lineage — trail + lineage capture | audit-prep scramble |
| ⑥ | **Confirm & report** | attest + report — confirm, file, notify, **+ human four-eyes** | sign-off meetings |

The loop is never "done": it re-runs on the next trigger. Every cycle writes back to the
regulated-entity brain / evidence ledger.

Most of those triggers fire from **Run/Operations** — the third arc where the shipped system
lives. `operations.md` covers how operational signals feed this lifecycle and route back into
Discovery to close the loop (the `operations-signal` seam keeps that feedback wire traceable).

## Domain streams — the same six steps, a second cadence and a different confirmer

An institution rarely runs one assurance cycle. The standing control set runs on one cadence; a
**domain** cycle — Shari'ah, medical, privacy — runs on another, and is confirmed by a different
body. That is now a configured mechanism rather than a fork: `assurance-config.json` names each
stream with its own `cadence_days` and `confirm_roles`, and a cycle record declares which stream it
belongs to. A repo that configures no streams is unaffected in every respect.

The Shari'ah stream, as the worked example, over the same six steps:

| Step | Who runs it in this stream |
|---|---|
| ① **Watch** | agent-run — the pronouncement / knowledge-pin class: a new ruling, a standard revised, a pin past its max age |
| ② **Assess** | **routed to the human Shari'ah functions.** For a pronouncement item the judgement is never the risk-reviewer agent's — an agent can surface that something moved; whether it binds this institution is a determination |
| ③ **Check** | conformance reviewers — composition, provenance, binding to an approved structure |
| ④ **Test** | the gate runner — the compiled control plan's gates, as for any other change |
| ⑤ **Evidence** | agent-assembled — the signed, sealed trail |
| ⑥ **Confirm** | **role-locked to the committee**, and internal: the third-line Shari'ah audit function may not be outsourced. Never an agent's |

This is also where changes that took the **conforming lane** — those covered by an already-approved
structure, where no fresh determination was sought — are **ratified at cadence**: the accountable
body confirms after the fact what the lane let through, and the signed record is the receipt.

The honesty line holds here as everywhere: **the harness checks the records.** The feeds, the
screening and the monitoring that produce them are the institution's runtime. And nothing in a
stream rules on its domain — `confirm_roles` decides who confirms, never what was confirmed.

## Why this is different

| Before — point-in-time, meeting-driven | Now — continuous, agent-driven |
|---|---|
| Humans in the loop; countless meetings & handoffs | Agents pulled in by the harness on every trigger |
| Periodic reviews; evidence gathered after the fact | Review, testing & evidence run automatically, always-on |
| Compliance proven at audit time — a scramble | Compliance is a property of the line, not an event |
| Assurance is a snapshot, and quickly goes stale | Every commitment confirmed live — always audit-ready |
| Slow, costly, current only to the last review | Fast, cheap, current to the last commit |

Agents augment people; accountability and four-eyes stay human. What changes is that the
recurring assurance becomes continuous and **evidence-by-construction**, not a periodic
scramble.

## The brain is governed, not accumulated

Every assurance cycle writes back to the context brain — and the brain itself is treated
like a regulated record: access-controlled, versioned, auditable, with owners and a change
history. It is not loose notes in people's heads. Bad context compounds as readily as good,
so curation is a control, not housekeeping.
