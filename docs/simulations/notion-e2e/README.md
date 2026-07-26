# The end-to-end run — live floor to gate

**Ran:** 26 Jul 2026 · **Workspace:** a real Notion Business-tier workspace · **Run slug:**
`accounts-elsewhere-live` · **Result:** four checks, all green (`run-transcript.txt`).

This is the Alpha simulation carried the whole way: content authored by a human on a real
collaboration surface, read back live, exported by the shipped exporter, frozen with a stamp, and
put in front of the shipped gate — including the attack the gate exists to stop.

```
live Notion page ──► MCP connector ──► nfm-bridge ──► floor-export.mjs ──► digest
                                                                            │
                              freeze-stamp-check.mjs ◄── stamp + artifact ◄──┘
```

| Check | Result |
|---|---|
| Export is deterministic (same tree twice → same bytes) | **PASS** |
| Gate passes on the frozen bytes | **PASS** |
| Gate refuses a one-word tamper (`Medium` → `Low`) | **PASS** |
| The page built to be un-freezable is refused | **PASS** |

Frozen digest: `sha256:2755e0006a3665eec8c586205ae1915b631120cca503dad57d9aa32e7d254dbe`
(26 blocks: 2 tables of 5 rows, 5 headings, 4 to-dos, 2 callouts, a fenced code block, a divider,
three list types and four paragraphs.)

The tamper is the point. Changing **one word** in the frozen file — the residual-risk verdict from
`Medium` to `Low`, three bytes — is caught:

```
data-governance.md does not match its freeze stamp
(stamped sha256:2755e000…, actual sha256:55bd679f…)
— the record was edited after the freeze, so re-freeze it rather than editing in place
```

## What is honestly simulated

**One link is substituted: the transport.** `core/floor-fetch.mjs` — the module that walks the
vendor's REST API — **did not run**. `api.notion.com` is denied by this environment's egress
policy, and the proxy's own documentation is explicit that such a denial is to be reported rather
than routed around. So the live content arrived through the **MCP connector**, which is a
sanctioned path but returns Notion-flavored *Markdown* rather than raw block JSON.

`nfm-bridge.mjs` converts that back into the block tree the exporter consumes. It is **deliberately
not part of the shipped harness**: its fidelity is lower than the API's by construction, and a
digest produced through it is *not* the digest the shipped path would produce for the same page.
Two adapters producing two digests for one page is a governance problem, not a convenience — so the
bridge lives here, in a simulation directory, and nowhere else.

**Therefore still unproven:** pagination, the separate `has_children` fetch, error classification,
and the `Notion-Version` pin — everything `floor-fetch.mjs` exists to do. Closing that needs
`api.notion.com` allowed through the egress policy, or a local run:

```bash
NOTION_TOKEN=… node core/floor-fetch.mjs <page-id> <notion-version>
```

**Everything downstream of the fetch is the shipped code, unmodified**: `floor-export.mjs`
produced the markdown and the digest, `freezeStamp()` produced the stamp, and
`scripts/freeze-stamp-check.mjs` — the same command CI runs — produced both verdicts.

## Files

| File | What it is |
|---|---|
| `run.mjs` | The runner. Six stages; the result table is derived from what happened, not asserted |
| `nfm-bridge.mjs` | The substituted transport. Simulation scaffolding, not method |
| `live-data-governance.nfm` | Exactly what the workspace returned, kept so the run is reproducible |
| `frozen-data-governance.md` | The frozen artifact |
| `frozen-stamp.json` | Its stamp |
| `run-transcript.txt` | Full output of the run |

Reproduce with `node run.mjs` from this directory.

---

**Companions:** `../../notion-floor-alpha-walkthrough.md` (the walkthrough this completes) ·
`../../notion-floor-plan.md` · the CI-verified freeze at
`plugins/middleleap-loom/skills/loom-adopt/harness/freeze-example/`.
