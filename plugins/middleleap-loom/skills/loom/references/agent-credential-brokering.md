# Agent credential brokering — the vault half of HG-0004

`agent-egress-control.md` covers the **network** side of the agent's runtime: the chokepoint that
decides whether a request leaves at all. This file covers the **credential** side: what the agent
is holding when it does. That file's mapping table names the half a gateway of its shape leaves
open — *"the vault half"* — and this is that half.

A **credential broker** holds the secret so the agent never does. The agent's runtime is given a
placeholder (`__github_token__`); the real credential is substituted **server-side, in transit**,
on the way to the upstream. That is the whole property, and it is the one to require of any
instance: **nothing in the agent's address space is worth exfiltrating.** The chokepoint
properties — non-bypassable, deterministic floor, fail-closed, attributable — are
`agent-egress-control.md`'s four, and a broker deployed on that chokepoint inherits them rather
than restating them.

Consistent with `HG-0008` (solution-agnostic seams), the canon stays **vendor-neutral**: what
follows names a *role*, and lists instances as peers rather than a recommendation.

## Why brokering, and not just a vault

`HG-0004`'s runbook (`identity-and-secrets-runbook.md` §5) has the agent **lease** a real,
short-lived secret from a vault and hold it in memory. That is the right control for an ordinary
workload and a large improvement on a static key on disk. It is the wrong shape for *this*
workload: a coding agent is an **untrusted-input processor by construction** — it reads issues, PR
comments, dependency READMEs, web pages, tool output — so the process holding the secret is the
same process an attacker gets to write prompts for. Leasing shortens the window; brokering removes
the key from the window entirely. A short TTL is a mitigation; a placeholder is an invariant.

## The mapping — what the credential layer adds

| Slot | What a broker puts in it |
|---|---|
| **HG-0004 · vaulted secrets** — the "secrets on disk" half (`identity-and-secrets-runbook.md` §4–§5) | The strongest available answer: the runner holds no credential at all, so the runbook's filesystem-and-image scan passes by construction rather than by discipline |
| **HG-0003 · sealed evidence** + continuous assurance ⑤ **Evidence** | The credential-use record the runbook (§7) asks for — *that* a secret was used, against which host, never its value. Distinct from the gateway's allow/deny log, which records routing, not use |
| **D6 · the data-risk register** (`discovery-harness.md` §5.1) | A credential-exposure risk domain with a named enforcing control, rather than a `DR-*` with a policy sentence behind it |

Everything else the runtime needs — the allow-list, the kill switch, the deny log, the run-side
signal wire — is `agent-egress-control.md`'s, and is not repeated here.

## The property worth requiring: deny → proposal → human approval

A default-deny allow-list has a failure mode: the agent hits a wall mid-task and the only way
forward is a human who is not there. The good answer is not a wider allow-list — it is to make the
**denial produce a reviewable request**. Agent Vault does this concretely (a `403` carries a
`proposal_hint`; the agent posts the services and credential slots it wants, with a
developer-facing rationale and a human-facing one; a person approves from the CLI or a link), and
it is worth requiring of *any* instance, gateway or broker, because it is the Loom's own sentence
one layer down: **the agent proposes; a human disposes.** `HG-0001` asserts that over merges; this
asserts it over the agent's reach.

The caveat is the whole control: the approval route must terminate at a **human outside the
agent's identity**. A proposal path the agent can approve — or that any automation inside its blast
radius can approve — is a self-service privilege-escalation endpoint, and strictly worse than a
plain deny.

## Instances — peers, not a recommendation

| Instance | What it gives | What it does not |
|---|---|---|
| **Agent Vault** (Infisical; MIT, with an `ee/` directory under a separate licence) | Purpose-built for agents. Per-vault *services* matching host / port / path globs with `bearer` · `basic` · `api-key` · `custom` · `passthrough` auth; placeholder substitution across path, query, header, body and websocket frames; `unmatched_host_policy=deny`; a container isolation mode that denies egress at the kernel; its own encrypted store or an external one | Research preview — the API is explicitly subject to change. Not an HSM. Adds a credential-store dependency of its own if backed externally |
| **HashiCorp Vault** (+ Boundary) | Mature leasing, dynamic secrets, HSM key custody, session brokering and recording — most of what `HG-0004` §5–§6 asks for, at bank scale | Returns the credential **to the caller**. This is the leasing shape, not the brokering shape: the defining property above is absent |
| **A gateway with credential injection at the edge** (cloud API gateways; some enterprise proxies) | Substitution on infrastructure the platform team already runs and already audits, colocated with the chokepoint | Injection is usually yours to build, and per-agent credential scoping is rarely native |
| **An existing enterprise forward proxy** (Zscaler / Netskope class) + a vault | Already deployed, already in the control register, already examined — the cheapest path to *something* in the slot | Not agent-aware: no placeholder substitution, no per-agent credential identity, no proposal path |

## The failure that looks green

The gateway's inert-control traps are in `agent-egress-control.md`. The broker has one of its own,
and it is quiet: **substitution that silently no-ops.** A misconfigured rule, an unmatched host, a
body encoding the broker skips — and the placeholder travels to the upstream instead of the
secret. The request fails in an ordinary-looking way, the agent retries, and nothing reports that
the *control* did not run.

Treat a placeholder reaching the wire as an **`incident`** in `operations-signal.json`, routed
`spec-fix` — not as a bad request. It is the one credential-layer signal `agent-egress-control.md`
does not already cover, and the only reliable evidence that substitution is actually happening.

## Limits — stated plainly

- **A broker moves the credential; it does not remove the capability.** The agent can still *act*
  through the proxy — injection can still make it open a PR, post a comment, call an API. What it
  cannot do is walk away with the key and use it later, elsewhere, unlogged. That is a real
  reduction in blast radius, and it is not containment.
- **TLS interception means the broker reads plaintext.** It holds every credential *and* sees every
  payload, which makes it the highest-value target in the build environment and a data-residency
  subject in its own right. `HG-0011` cuts both ways here exactly as it does for the gateway.
- **The proxy hop is a trust boundary.** Session tokens travel in a cleartext
  `Proxy-Authorization` header; this belongs on a private network or a VPN, never the open
  internet.
- **None of this touches the git half of `HG-0004`.** Branch protection (`HG-0001`), the CODEOWNERS
  control plane (`HG-0002`), and a least-privilege repository scope are separate, unchanged work. A
  brokered agent with merge rights is still an ungoverned agent.
- **Nothing here graduates a control.** A control reaches `platform-enforced` only when the live
  platform is *observed* preventing bypass, bypass-tested and independently signed
  (`platform-activation-check.mjs`). A broker nobody has tried to defeat is `defined`.

## Cross-references

- `agent-egress-control.md` — the network half: the chokepoint, the allow-list, the four
  properties this file inherits, and the `egress_proxy` activation mechanism.
- `governance.md` — HG-0004 and the enforcement-of-record rule.
- `supply-chain-security.md` — the sibling pattern: concrete tooling filling named slots.
- `operations.md` — the signal types and the routing triage a substitution failure lands in.
- `bank-grade-gap.md` — cluster **A**, where HG-0004 is graded.
- `../../loom-adopt/harness/governance/runbooks/identity-and-secrets-runbook.md` — HG-0004 in full;
  §4–§5 are the steps this shape strengthens.
