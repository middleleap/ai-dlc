# The agent's own runtime — egress control and credential brokering (HG-0004 · HG-0011 · HG-0012)

> **Identifiers.** Gate ids (`D1`–`D9`, `Q1`–`Q5`) and run-level ids (`S-001` signal,
> `T-1` theme, `H1` hypothesis) are expanded in `glossary.md`.

The harness governs how software is *built*; this file governs the environment the **agent
itself** runs in — two optional components that fill slots the frame already names and leaves
`Defined`. Neither is a new warp thread and neither is required to run the Loom. A Loom adoption
with no gateway and no broker is a valid adoption whose HG-0004, HG-0011 and HG-0012 rows stay
honestly `Defined`.

- **The network half — an egress gateway.** A chokepoint every outbound request an agent makes is
  forced through, which decides against policy whether the request leaves. Fills `HG-0011`
  (onshore gateway · pre-egress DLP, the *block* half), `HG-0012` (controlled build/eval runtime ·
  the egress allow-list), and the run-side signal wire.
- **The credential half — a broker.** Holds the secret so the agent never does: the agent's
  runtime is given a placeholder (`__github_token__`) and the real credential is substituted
  server-side, in transit, on the way upstream. Fills the vault half of `HG-0004`.

Consistent with `HG-0008` (solution-agnostic seams), the canon names **roles**. Instances are named
the way `supply-chain-security.md` names Snyk and Chainguard: as instances, swappable, never a
mandate.

## 1. The four properties — or it is not the control

Both halves sit on the same chokepoint and share the same four properties. A broker deployed on
the chokepoint inherits them rather than restating them.

1. **Non-bypassable.** The network denies all egress except through the gateway. A proxy the agent
   reaches by honouring `HTTP_PROXY` is a hook, and hooks the agent can skip are hygiene.
2. **Deterministic floor.** Static allow/deny rules for the boundaries that must never be
   negotiated — deny beats allow, evaluated before anything that reasons.
3. **Fail-closed.** Gateway, broker or judge unavailable ⇒ deny. A control that opens under load is
   a control an attacker can create load against.
4. **Attributable and logged.** Per-agent identity, and every decision — forwarded and blocked,
   substituted and not — written to an audit store the agent cannot rewrite.

## 2. The mapping — slots the Loom already defines

| Slot | The gateway fills | The broker fills | Stays open |
|---|---|---|---|
| **HG-0011** onshore gateway · pre-egress DLP | The inline chokepoint; **block** on policy — regulated data, secrets, source, unapproved destinations | — | Field-level redaction and tokenisation |
| **HG-0012** controlled build/eval runtime | The egress **allow-list** the decision names verbatim — deny the hosts the agent would reach green *by retrieval* | — | The derivation-vs-retrieval audit |
| **HG-0004** least-privilege identity · vaulted secrets | A per-agent **network** identity with its own policy | The runner holds **no credential at all**; the runbook's filesystem-and-image scan passes by construction | The git half: branch protection, CODEOWNERS, repository scope |
| **HG-0003** sealed evidence · assurance ⑤ Evidence | The allow/deny log — routing | The credential-**use** record: *that* a secret was used, against which host, never its value | External anchor |
| **HG-0010** cease-use switch | Revoking the agent's gateway identity halts its reach in one action, outside the repo | Revoking its broker identity removes every credential at once | The named accountable officer |
| **D6** the data-risk register | — | A credential-exposure risk domain with a named enforcing control | — |
| **Run** (`operations.md`) | Every deny is a dated, attributable event with a payload reason | A placeholder reaching the wire is an `incident` | — |
| **Continuous assurance** | Deny-rate and destination drift as ① Watch inputs; the deny log as ② Assess evidence | Credential-use anomalies as ① Watch inputs | — |

## 3. Why brokering, and not just a vault

`HG-0004`'s runbook (`identity-and-secrets-runbook.md` §5) has the agent **lease** a real,
short-lived secret from a vault and hold it in memory. That is the right control for an ordinary
workload and a large improvement on a static key on disk. It is the wrong shape for *this*
workload: a coding agent is an **untrusted-input processor by construction** — it reads issues, PR
comments, dependency READMEs, web pages, tool output — so the process holding the secret is the
same process an attacker gets to write prompts for. Leasing shortens the window; brokering removes
the key from the window entirely. A short TTL is a mitigation; a placeholder is an invariant.

## 4. The property worth requiring: deny → proposal → human approval

A default-deny allow-list has a failure mode: the agent hits a wall mid-task and the only way
forward is a human who is not there. The good answer is not a wider allow-list — it is to make the
**denial produce a reviewable request**: the deny carries a proposal hint; the agent posts the
services and credential slots it wants, with a developer-facing rationale and a human-facing one;
a person approves from the CLI or a link. It is worth requiring of *any* instance, gateway or
broker, because it is the Loom's own sentence one layer down: **the agent proposes; a human
disposes.** `HG-0001` asserts that over merges; this asserts it over the agent's reach.

The caveat is the whole control: the approval route must terminate at a **human outside the
agent's identity**. A proposal path the agent can approve — or that any automation inside its blast
radius can approve — is a self-service privilege-escalation endpoint, strictly worse than a plain
deny.

## 5. Activation — what makes it enforced rather than deployed

`platform-activation-check.mjs` accepts **`egress_proxy`** as a mechanism, so an adopter who wires
a gateway can produce the signed observation that lets a catalog control graduate from `defined`
to `platform-enforced`. The rules are the ones every activation record obeys — an `observation`
of what the live gateway reports, an `observer_identity` outside the agent's write authority,
freshness, and an ed25519 attestation. What is specific here is the **bypass test**:

| `satisfies_control` | `bypass_test.attempted` | What a `rejected` result proves |
|---|---|---|
| **HG-0011** | An outbound request from the agent's runtime with the proxy variables **unset**, direct to an allowed host | The chokepoint is the *only route* — the network, not the agent's cooperation, is the control |
| **HG-0012** | During a build/eval run, a fetch of a **denied retrieval source** (the upstream fix, the issue thread) | The allow-list actually constrains how the agent reaches green |
| **HG-0004** | A request carrying the literal placeholder, with the broker bypassed | The placeholder is worthless without the broker — nothing in the agent's address space is a secret |

`../../loom-adopt/harness/platform-activation-example/crabtrap-egress-proxy.json` is the reference
shape for the first. A planted secret in an outbound body, blocked with a reason, is worth running
but is not a graduation receipt: it tests the policy, not the chokepoint, and policy coverage is
never proven by one negative case. **Nothing here graduates a control by being deployed.** A
gateway or broker nobody has tried to defeat is `defined`.

## 6. The judge is a model — govern it as one

Where the gateway decides by LLM rather than by rule, it has put a model **inside the control
environment**, and `HG-0006` applies to it exactly as it applies to the delivery loop and to the
reviewer agents. Add a role to `docs/governance/model-manifest.json` — pinned `model_id`,
`prompt_version` tracking the policy text, `risk_tier: high` (it is a control), an eval suite of
known allow/deny cases run against the shipping pin, an independent `validated_by`, and a
`runtime` block whose `fallback` records the deny-on-unavailable behaviour. A judge absent from
the manifest is a model laundered into the control environment; `model-provenance-check.mjs` is
what stops that.

## 7. The run-side wire — no new signal type

Both halves land in `operations-signal.json` through the existing type enum. Do not add a
`policy-block` type:

- routine deny → `near-miss`, `source: "<gateway>"`
- deny of a payload matching a registered data risk → `risk-materialised`, `link: "DR-*"`
- a new destination appearing in allow traffic → `drift`, via ① Watch
- **a placeholder reaching the wire** (substitution silently no-oped: a misconfigured rule, an
  unmatched host, a body encoding the broker skips) → `incident`, routed `spec-fix`. It is the one
  credential-layer signal the gateway's log does not carry, and the only reliable evidence that
  substitution is actually happening. The request fails in an ordinary-looking way and the agent
  retries; nothing else reports that the *control* did not run.

## 8. Instances — named, not mandated

**Gateway — CrabTrap** (Brex, MIT, Go, `github.com/brexhq/CrabTrap`). A forward HTTP/HTTPS proxy:
terminates TLS with per-host certificates minted from its own CA, evaluates **static rules**
(prefix / exact / glob, deny-over-allow), falls through to an **LLM judge** carrying that agent's
natural-language policy, writes every decision to PostgreSQL. Judge-unavailable fallback defaults
to **deny** with a circuit breaker; SSRF protection covers RFC1918 / loopback / link-local with
DNS-rebinding prevention. Deployable from a Railway template — which is the point of naming it:
the step the runbook says to take *now* becomes an afternoon. **But a managed-PaaS deployment is
the wrong instantiation for the regulated case.** HG-0011 is a *residency* decision; a gateway
that terminates TLS on all agent traffic and stores the audit outside the institution's boundary
defeats the control it implements. Use the template for the pilot and the demo; run the regulated
instance onshore, on infrastructure the third-party register already covers.

**Brokers — peers, not a recommendation:**

| Instance | What it gives | What it does not |
|---|---|---|
| **Agent Vault** (Infisical; MIT, with an `ee/` directory under a separate licence) | Purpose-built for agents: per-vault *services* matching host / port / path globs; placeholder substitution across path, query, header, body and websocket frames; `unmatched_host_policy=deny`; a container isolation mode that denies egress at the kernel; the deny → proposal → approval path of §4 | Research preview — the API is explicitly subject to change. Not an HSM |
| **HashiCorp Vault** (+ Boundary) | Mature leasing, dynamic secrets, HSM key custody, session brokering and recording — most of what `HG-0004` §5–§6 asks for, at bank scale | Returns the credential **to the caller**: the leasing shape, not the brokering shape |
| **A gateway with credential injection at the edge** | Substitution on infrastructure the platform team already runs and audits, colocated with the chokepoint | Injection is usually yours to build; per-agent credential scoping is rarely native |
| **An existing enterprise forward proxy** (Zscaler / Netskope class) + a vault | Already deployed, already in the control register, already examined | Not agent-aware: no placeholder substitution, no per-agent identity, no proposal path |

## 9. Limits — stated plainly

- **The gateway blocks; it does not redact.** HG-0011 says *pre-egress DLP*; a gateway of this
  shape gets the block half. Field-level redaction and tokenisation stay `Defined`.
- **Responses are not filtered.** Inbound prompt injection arriving in an allowed API's response
  is untouched. The egress gateway is not a content firewall in the other direction.
- **A judge can be argued with.** Payload encoding raises the cost of prompt injection against the
  adjudicator; it does not remove it. The boundaries that must hold belong on static rules.
- **A broker moves the credential; it does not remove the capability.** The agent can still *act*
  through the proxy — injection can still make it open a PR, post a comment, call an API. What it
  cannot do is walk away with the key and use it later, elsewhere, unlogged. A real reduction in
  blast radius; not containment.
- **TLS interception means the chokepoint reads plaintext.** It holds every credential *and* sees
  every payload: the highest-value target in the build environment and a data-residency subject in
  its own right. `HG-0011` cuts both ways. Session tokens in a cleartext `Proxy-Authorization`
  header belong on a private network, never the open internet.
- **It is a single point of failure with a crown jewel in it.** Fail-closed means an outage stops
  the loop, and the gateway's CA private key can impersonate every host the agent trusts. That is
  a service in `docs/governance/services/`, a third-party register entry, a CA-expiry horizon item
  for `change-watch`, and its own threat model — not a sidecar.
- **None of this touches the git half of `HG-0004`.** Branch protection (`HG-0001`), the CODEOWNERS
  control plane (`HG-0002`), and a least-privilege repository scope are separate, unchanged work. A
  brokered agent with merge rights is still an ungoverned agent.
- **Maturity is the adopter's assessment.** CrabTrap is young (first published 2026), Agent Vault
  is a research preview; both sit in the most privileged path in the build. Named as an instance
  is not a supply-chain sign-off; each goes through the same third-party assessment as any other
  dependency in the control plane — and, under the obligations register, the outsourcing
  obligation that covers it.

## Cross-references

- `governance.md` — HG-0004, HG-0010, HG-0011, HG-0012 and the enforcement-of-record rule.
- `bank-grade-gap.md` — cluster **A** (HG-0004) and cluster **E** (pre-egress DLP), and the
  five-state model this component moves a row along.
- `model-risk.md` — the manifest the judge belongs in.
- `supply-chain-security.md` — the sibling pattern: concrete tooling filling named slots.
- `operations.md` — the signal types and the routing triage a deny or a substitution failure lands in.
- `../../loom-adopt/harness/governance/runbooks/identity-and-secrets-runbook.md` — HG-0004 in full;
  §4–§5 are the steps the broker strengthens.
- `../../loom-adopt/harness/governance/runbooks/security-testing-and-resilience-runbook.md` §9 —
  the "close in this order" that puts pre-egress DLP second.
