# Agent egress control — an optional component for HG-0011 / HG-0012

An **agent egress gateway** is a chokepoint every outbound request an agent makes is forced
through, which decides — against policy — whether the request leaves. It is **not a new warp
thread**, and it is **not required to run the Loom**. It is an *optional component* that fills
slots the frame already names and leaves `Defined`: `HG-0011` (onshore gateway · pre-egress DLP),
`HG-0012` (controlled build/eval runtime · egress allow-list), and the run-side signal wire.

Consistent with `HG-0008` (solution-agnostic seams), the canon stays **vendor-neutral**: what
follows names a *role*. This file names **CrabTrap** (Brex, MIT, Go —
`github.com/brexhq/CrabTrap`) as a recommended *instance* of that role, the same way
`supply-chain-security.md` names Snyk and Chainguard. Swap it and the same slots hold.

Read this alongside `../../loom-adopt/harness/governance/runbooks/security-testing-and-resilience-runbook.md`
§9, whose "close in this order" already puts wiring pre-egress DLP second — *"the one HG decision
here whose enforcement of record is squarely infrastructure you can stand up now."* This file is
how that step gets taken; it does not change the grade until it is taken.

## The role — four properties, or it is not the control

1. **Non-bypassable.** The network denies all egress except through the gateway. A proxy the agent
   reaches by honouring `HTTP_PROXY` is a hook, and hooks the agent can skip are hygiene.
2. **Deterministic floor.** Static allow/deny rules for the boundaries that must never be
   negotiated — deny beats allow, evaluated before anything that reasons.
3. **Fail-closed.** Gateway or judge unavailable ⇒ deny. A control that opens under load is a
   control that an attacker can create load against.
4. **Attributable and logged.** Per-agent identity, and every decision — forwarded and blocked —
   written to an audit store the agent cannot rewrite.

## The mapping — slot the Loom already defines → what an egress gateway fills

| Slot | What the gateway fills | Stays open |
|---|---|---|
| **HG-0011** onshore gateway · pre-egress DLP (`governance.md`) | The inline chokepoint; **block** on policy — regulated data, secrets, source, unapproved destinations | **Redaction / tokenisation**. Blocking a request is not the same as scrubbing a field out of one |
| **HG-0012** controlled build/eval runtime | The **egress allow-list** the decision names verbatim — deny the hosts the agent would reach green *by retrieval* (the upstream repo, the issue thread, the answer) | The derivation-vs-retrieval **audit** itself |
| **HG-0004** least-privilege identity (`identities.json`) | A per-agent **network** identity with its own policy — least privilege at the route, not only the credential | The vault half — see `agent-credential-brokering.md`, which fills it by holding the secret so the agent never does |
| **HG-0010** cease-use switch | Revoking the agent's gateway identity halts its reach in one action, outside the repo | The named accountable officer |
| **Run / operations-signal** (`operations.md`) | Every deny is a dated, attributable event with a payload reason — a signal source that needs no new schema | Detection of everything the gateway cannot see |
| **Continuous assurance** (`continuous-assurance.md`) | Deny-rate and destination drift as ① Watch inputs; the deny log as ② Assess evidence | — |

## Activation — what makes it enforced rather than deployed

`platform-activation-check.mjs` accepts **`egress_proxy`** as a mechanism, so an adopter who wires
a gateway can produce the signed observation that lets a catalog control graduate from `defined`
to `platform-enforced`. Before that mechanism existed the graduation was unreachable by
construction: the enum was git-forge-shaped, and a record naming a proxy was rejected.

The rules are the ones every activation record obeys — an `observation` of what the live gateway
reports, an `observer_identity` outside the agent's write authority, freshness, and an ed25519
attestation. What is specific here is the **bypass test**, and there are two distinct claims, so
there are two records:

| `satisfies_control` | `bypass_test.attempted` | What a `rejected` result proves |
|---|---|---|
| **HG-0011** | An outbound request from the agent's runtime with the proxy variables **unset**, direct to an allowed host | The chokepoint is the *only route* — the network, not the agent's cooperation, is the control |
| **HG-0012** | During a build/eval run, a fetch of a **denied retrieval source** (the upstream fix, the issue thread) | The allow-list actually constrains how the agent reaches green |

`../../loom-adopt/harness/platform-activation-example/crabtrap-egress-proxy.json` is the reference
shape for the first. A third probe worth running but *not* a graduation receipt: a planted secret
in an outbound body, blocked with a reason — that tests the policy, not the chokepoint, and policy
coverage is never proven by one negative case.

## The judge is a model — govern it as one

Where the gateway decides by LLM rather than by rule, it has put a model **inside the control
environment**, and `HG-0006` applies to it exactly as it applies to the delivery loop. Add a role
to `docs/governance/model-manifest.json` — pinned `model_id`, `prompt_version` tracking the
policy text, `risk_tier: high` (it is a control), an eval suite of known allow/deny cases run
against the shipping pin, an independent `validated_by`, and a `runtime` block whose `fallback`
records the deny-on-unavailable behaviour. A judge absent from the manifest is a model laundered
into the control environment; `model-provenance-check.mjs` is what stops that.

## The run-side wire — no new signal type

A blocked egress is an `operations-signal` record like any other, and the existing type enum
already covers it. Do not add a `policy-block` type:

- routine deny → `near-miss`, `source: "<gateway>"`
- deny of a payload matching a registered data risk → `risk-materialised`, `link: "DR-*"`
- a new destination appearing in allow traffic → `drift`, via ① Watch

## The instance — CrabTrap

A forward HTTP/HTTPS proxy: it terminates TLS with per-host certificates minted from its own CA,
evaluates **static rules** (prefix / exact / glob, deny-over-allow), falls through to an **LLM
judge** carrying that agent's natural-language policy, and writes every decision to PostgreSQL.
Proxy on 8080, admin API and UI on 8081, bearer auth, one gateway token per agent identity.
Judge-unavailable fallback defaults to **deny**, with a circuit breaker after consecutive
failures. SSRF protection covers RFC1918 / loopback / link-local with DNS-rebinding prevention.
Optional OpenTelemetry metrics in Prometheus format.

It is deployable from a Railway template (CrabTrap + PostgreSQL) — which is the point of naming it
here: the step the runbook says to take *now* becomes an afternoon rather than a project. **But a
managed-PaaS deployment is the wrong instantiation for the regulated case.** HG-0011 is a
*residency* decision; a gateway that terminates TLS on all agent traffic and stores full
request/response audit outside the institution's boundary defeats the control it implements. Use
the template for the pilot, the demo, and the worked example; run the regulated instance onshore,
inside the boundary, on infrastructure the third-party register already covers.

## Limits — stated plainly

- **It blocks; it does not redact.** HG-0011 says *pre-egress DLP*. A gateway of this shape gets
  the block half. Field-level redaction and tokenisation stay `Defined` until something else does
  them — do not let one green activation record close the whole decision.
- **Responses are not filtered.** Inbound prompt injection arriving in an allowed API's response
  is untouched. The egress gateway is not a content firewall in the other direction.
- **A judge can be argued with.** Payload encoding raises the cost of prompt injection against the
  adjudicator; it does not remove it. The boundaries that must hold belong on static rules.
- **It becomes a single point of failure with a crown jewel in it.** Fail-closed means an outage
  stops the loop, and the gateway's CA private key can impersonate every host the agent trusts.
  That is a service in `docs/governance/services/`, a third-party register entry, a CA-expiry
  horizon item for `change-watch`, and its own threat model — not a sidecar.
- **Maturity is the adopter's assessment.** CrabTrap is young (first published 2026), MIT, "as is",
  no bug-bounty programme, and it sits in the most privileged path in the build. Named as an
  instance is not a supply-chain sign-off; it goes through the same third-party assessment as any
  other dependency in the control plane.
- **Tool choice stays the institution's.** This is a recommended instance of a neutral role, not a
  mandate, and the whole component is optional. A Loom adoption with no egress gateway is a valid
  adoption whose HG-0011 and HG-0012 rows stay honestly `Defined`.

## Cross-references

- `governance.md` — HG-0011, HG-0012, HG-0004, HG-0010 and the enforcement-of-record rule.
- `bank-grade-gap.md` — **cluster E**, where pre-egress DLP is graded, and the five-state model
  this component moves a row along.
- `agent-credential-brokering.md` — the credential half of the same runtime: the broker that holds
  the secret so the agent holds only a placeholder, filling the vault half of HG-0004 this file
  leaves open.
- `supply-chain-security.md` — the sibling pattern: concrete tooling filling named slots.
- `operations.md` — the signal types and the routing triage a deny lands in.
- `model-risk.md` — HG-0006 and the model manifest the judge belongs in.
- `../../loom-adopt/harness/governance/runbooks/security-testing-and-resilience-runbook.md` §9 —
  the adopter-side work in full.
- `../../loom-adopt/harness/scripts/platform-activation-check.mjs` — the `egress_proxy` mechanism
  and the graduation rule.
- `../../loom-adopt/harness/platform-activation-example/crabtrap-egress-proxy.json` — the
  reference observation.
