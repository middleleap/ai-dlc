# Agent runtime security — the agent's own credentials and egress

The agent's own runtime — the credentials it holds and the network it can reach — is **not a new
warp thread**. The Loom already names the slots where it belongs: `HG-0004` (broad agent
credentials / secrets on disk), `HG-0010` (cease-use), `HG-0011` (residency-controlled model
traffic, pre-egress DLP, attested execution), and `HG-0012` (controlled build/eval runtime —
sealed history + egress allow-list). What follows is how one concrete *shape* fills those slots
without changing the frame.

Consistent with `HG-0008` (solution-agnostic seams), the canon stays **vendor-neutral**: what the
harness names is a *role*. This file names four instances of that role as **peers** — none of them
a recommendation — so an adopter can see what the slot actually asks for and fill it their way.

## The role — a credential-brokering egress proxy

One box the agent's traffic must pass through, holding the secrets the agent is not allowed to
hold. Three properties, and an instance either has them or it does not:

1. **The agent holds placeholders, not secrets.** The runtime is given a dummy value
   (`__github_token__`); the real credential is substituted **server-side, in transit**, on the way
   to the upstream. Nothing in the agent's address space is worth exfiltrating.
2. **All egress traverses one enforcement point**, with a **default-deny** host allow-list. An
   unlisted destination is refused, not merely logged.
3. **The enforcement point keeps its own request log**, outside the agent's write scope — the same
   decisive property the control plane (`HG-0002`) and the audit sink already depend on: *the agent
   cannot edit the record of what it did.*

## Why brokering, and not just a vault

`HG-0004`'s runbook (`identity-and-secrets-runbook.md` §5) has the agent **lease** a real,
short-lived secret from a vault and hold it in memory. That is the right control for an ordinary
workload and a large improvement on a static key on disk. It is the wrong shape for *this*
workload: a coding agent is an **untrusted-input processor by construction** — it reads issues, PR
comments, dependency READMEs, web pages, tool output — so the process holding the secret is the
same process an attacker gets to write prompts for. Leasing shortens the window; brokering removes
the key from the window entirely. A short TTL is a mitigation; a placeholder is an invariant.

## The mapping — slot the Loom already defines → what the role provides

| Slot | What a credential-brokering egress proxy puts in it |
|---|---|
| **HG-0004 · vaulted secrets** (the "secrets on disk" half) | The strongest available answer: the runner holds no credential at all, so the filesystem-and-image scan in the runbook's Verify list passes by construction rather than by discipline |
| **HG-0011 · pre-egress DLP + attested execution** | The single inspection point DLP needs, and a sandbox whose egress is denied by default — the two halves currently graded *Named-only* |
| **HG-0012 · controlled build/eval runtime** | The **egress allow-list** the decision names: an agent that cannot reach an arbitrary host cannot reach green by retrieval |
| **HG-0010 · cease-use** | A kill switch that cuts something real — revoking the agent's broker identity ends its reach to every brokered upstream at once, without touching the repository |
| **HG-0003 · sealed evidence** + continuous assurance ⑤ **Evidence** | The request log is the identity-layer feed `identity-and-secrets-runbook.md` §7 asks for: *that* a credential was used, against which host, never its value |
| **D6 · the data-risk register** (`discovery-harness.md` §5.1) | An egress / exfiltration risk domain with a named enforcing control, rather than a `DR-*` with a policy sentence behind it |

## Instances — peers, not a recommendation

| Instance | What it gives | What it does not |
|---|---|---|
| **Agent Vault** (Infisical; MIT, with an `ee/` directory under a separate licence) | Purpose-built for agents. Per-vault *services* matching host / port / path globs with `bearer` · `basic` · `api-key` · `custom` · `passthrough` auth; placeholder substitution across path, query, header, body and websocket frames; `unmatched_host_policy=deny`; a container isolation mode that denies egress at the kernel; its own encrypted store or an external one | Research preview — the API is explicitly subject to change. Not an HSM. Adds a credential-store dependency of its own if backed externally |
| **HashiCorp Vault** (+ Boundary) | Mature leasing, dynamic secrets, HSM key custody, session brokering and recording — most of what `HG-0004` §5–§6 asks for, at bank scale | Returns the credential **to the caller**. This is the leasing shape, not the brokering shape: property (1) above is absent |
| **Cloud-native egress** (AWS Network Firewall + PrivateLink · Azure Firewall + APIM · GCP Secure Web Proxy) | A strong allow-list and a clean residency story inside one cloud, on infrastructure the platform team already runs and already audits | Credential injection at the gateway is yours to build. Weak-to-absent story for traffic leaving that cloud |
| **An existing enterprise forward proxy** (Zscaler / Netskope class) + a vault | Already deployed, already in the control register, already examined — the cheapest path to *something* in the slot | Not agent-aware: no placeholder substitution, no per-agent identity, no proposal path. Allow-lists are usually org-wide, not per-workload |

## The property worth requiring: deny → proposal → human approval

A default-deny allow-list has a failure mode: the agent hits a wall mid-task and the only way
forward is a human who is not there. The good answer is not a wider allow-list — it is to make the
**denial produce a reviewable request**. Agent Vault does this concretely (a `403` carries a
`proposal_hint`; the agent posts the services and credential slots it wants, with a
developer-facing rationale and a human-facing one; a person approves from the CLI or a link), and
it is worth requiring of *any* instance, because it is the Loom's own sentence one layer down:
**the agent proposes; a human disposes.** `HG-0001` asserts that over merges; this asserts it over
the agent's reach.

The caveat is the whole control: the approval route must terminate at a **human outside the agent's
identity**. A proposal path the agent can approve — or that any automation inside its blast radius
can approve — is a self-service privilege-escalation endpoint, and strictly worse than a plain
deny.

## The Run tie

The enforcement point is a sensor, and the third arc (`operations.md`) already has somewhere to put
what it senses. Its denials map onto signal types the log already defines, and route through the
same four-way triage:

| What the proxy saw | Signal type | Typical route |
|---|---|---|
| A blocked request to an unlisted host | `near-miss` | `accepted` — the control worked; or `spec-fix` if the agent legitimately needed it |
| A placeholder that reached the wire unsubstituted | `incident` | `spec-fix` — a substitution rule is wrong |
| A brokered upstream that changed shape, or a new one appearing | `drift` | `register` — the D6 position moved |

No new signal type, and no new claim: the bundle still detects nothing.
`operations-signal-check.mjs` only guarantees that a signal, once logged, is triaged and traceable.

## The enforcement-of-record rule still applies

A proxy that **observes** is telemetry; the **control** is the one the agent cannot route around.
Two traps, both easy to walk into:

- **A default-forward unmatched-host policy.** Most proxies forward what they cannot match. That is
  a monitoring deployment wearing a control's name — flip it to deny, and treat the denials as the
  proposal queue above.
- **Environment-variable isolation is cooperative.** Setting `HTTPS_PROXY` for the agent's process
  asks it nicely. An agent that can unset the variable, open a raw socket, or resolve a name for
  itself has already left. The control is **kernel- or network-level egress denial** — a container
  network policy, a VPC route, a firewall rule — enforced somewhere the agent has no write
  authority. Agent Vault names this distinction directly (host isolation versus container
  isolation); if your instance does not, ask the question yourself.

Buying the box is not the control, exactly as `supply-chain-security.md` says of a scanner.

## Limits — stated plainly

- **A broker moves the credential; it does not remove the capability.** The agent can still *act*
  through the proxy — injection can still make it open a PR, post a comment, call an API. What it
  cannot do is walk away with the key and use it later, elsewhere, unlogged. That is a real
  reduction in blast radius, and it is not containment.
- **Allow-listing is per host, sometimes per path — never per record.** "May reach
  `api.github.com`" is not "may read this repository". Fine-grained authorization stays upstream,
  in the token's own scopes.
- **TLS interception means the broker reads plaintext.** It becomes the highest-value target in the
  build environment and a data-residency subject in its own right. `HG-0011` cuts both ways: an
  offshore broker inspecting onshore traffic is a new finding, not a closed one.
- **The proxy hop is a trust boundary.** Session tokens travel in a cleartext
  `Proxy-Authorization` header; this belongs on a private network or a VPN, never the open
  internet.
- **None of this touches the git half of `HG-0004`.** Branch protection (`HG-0001`), the CODEOWNERS
  control plane (`HG-0002`), and a least-privilege repository scope are separate, unchanged work. A
  brokered agent with merge rights is still an ungoverned agent.
- **Nothing here graduates a control.** A control reaches `platform-enforced` only when the live
  platform is *observed* preventing bypass, bypass-tested and independently signed
  (`platform-activation-check.mjs`). A brokering proxy nobody has tried to escape is `defined`.

See also: `governance.md` (HG-0004 · HG-0010 · HG-0011 · HG-0012, and the enforcement-of-record
rule), `operations.md` (the signal routing this feeds), `supply-chain-security.md` (the sibling
"fills slots the frame already has" file), `bank-grade-gap.md` (clusters **A** and **E**, where
these controls sit), and the two adoption runbooks —
`../../loom-adopt/harness/governance/runbooks/identity-and-secrets-runbook.md` (HG-0004) and
`../../loom-adopt/harness/governance/runbooks/security-testing-and-resilience-runbook.md` (§9,
pre-egress DLP).
