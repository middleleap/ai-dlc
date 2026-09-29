#!/usr/bin/env bash
# The Loom negative bypass tests (run after loom-dry-run.sh; they reuse its tree) — extracted verbatim from .github/workflows/validate.yml.
# GitHub runs step scripts with `bash -e -o pipefail`; so does this. Outside Actions the
# runner variables default to a scratch dir, so `node scripts/ci/local.mjs` can run it.
set -eo pipefail
RUNNER_TEMP="${RUNNER_TEMP:-$(mktemp -d)}"; export RUNNER_TEMP
GITHUB_ENV="${GITHUB_ENV:-$RUNNER_TEMP/github-env}"; export GITHUB_ENV; touch "$GITHUB_ENV"
cd "$(git rev-parse --show-toplevel)"
A="$RUNNER_TEMP/loom-adopt-dryrun"
cd "$A"
# 1 · Tampered evidence: alter a sealed artifact — the seal gate must break.
sed -i 's/"failed": 0/"failed": 1/' docs/governance/evidence/tests.json
if node scripts/evidence-seal-check.mjs; then
  echo "::error::evidence-seal gate passed on a tampered artifact"; exit 1
fi
git checkout -- docs/governance/evidence/tests.json
# 2 · Weakened tests: delete a test file on a branch — Q1b must reject it.
git checkout -qb weaken
git rm -q discovery/render/render.test.mjs && git commit -qm "delete a test"
if node scripts/test-integrity-check.mjs --base main; then
  echo "::error::test-integrity gate passed a deleted test file"; exit 1
fi
git checkout -q main
# 3 · Committed secret: a key in history must fail even after the file is gone.
# The marker below exempts THIS line only — it must sit on the same line as the match.
# leak.txt is written without it, so the gate still fails on the generated file exactly as
# the assertion below requires. Without the marker, the bundle's own secrets gate reports
# this workflow as a committed key: a false alarm for anyone running the adopter gates here.
printf 'aws_access_key_id = AKIAIOSFODNN7DRYRUN0\n' > leak.txt  # loom-allow-secret
git add leak.txt && git commit -qm "leak" && git rm -q leak.txt && git commit -qm "remove leak"
if node scripts/secrets-scan.mjs; then
  echo "::error::secrets gate passed a secret that lives in git history"; exit 1
fi
git reset -q --hard HEAD~2
# 4 · Failing SAST report: an error-level SARIF finding must block.
node -e 'const fs=require("fs");const p="docs/governance/evidence/sast.sarif";const s=JSON.parse(fs.readFileSync(p));s.runs[0].results=[{ruleId:"demo-sqli",level:"error",message:{text:"injected"}}];fs.writeFileSync(p,JSON.stringify(s))'
if node scripts/sast-check.mjs; then
  echo "::error::SAST gate passed an error-level finding"; exit 1
fi
git checkout -- docs/governance/evidence/sast.sarif
# 5 · Doctored control plan: hand-editing PA1 out of the compiled plan must fail
#     reconciliation (classification-time rigor survives to execution time).
node -e 'const fs=require("fs");const p="docs/governance/changes/CHG-2026-0042/control-plan.json";const s=JSON.parse(fs.readFileSync(p));s.required_gates=s.required_gates.filter(g=>g!=="PA1");fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/change-envelope-check.mjs; then
  echo "::error::change-envelope gate accepted a hand-edited control plan"; exit 1
fi
git checkout -- docs/governance/changes/CHG-2026-0042/control-plan.json
# 6 · PA1 revoked: a high-risk change in Develop without PA1 must be blocked.
node -e 'const fs=require("fs");const p="docs/governance/changes/CHG-2026-0042/product-passport.json";const s=JSON.parse(fs.readFileSync(p));s.pa1.decision="pending";fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/change-envelope-check.mjs; then
  echo "::error::a high-risk change entered Develop without PA1"; exit 1
fi
git checkout -- docs/governance/changes/CHG-2026-0042/product-passport.json
# 7 · Agent as approver: an agent identity signing PA1 must be rejected.
node -e 'const fs=require("fs");const p="docs/governance/changes/CHG-2026-0042/product-passport.json";const s=JSON.parse(fs.readFileSync(p));s.pa1.approvals=s.pa1.approvals.map(a=>a.role==="risk-second-line"?{...a,by:"agent-loom-delivery"}:a);fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/product-approval-check.mjs; then
  echo "::error::an AGENT approval was accepted for a control function"; exit 1
fi
git checkout -- docs/governance/changes/CHG-2026-0042/product-passport.json
# 8 · Stale kill-switch: a test older than its 90d window must block readiness.
node -e 'const fs=require("fs");const p="docs/governance/services/credit-origination.json";const s=JSON.parse(fs.readFileSync(p));s.kill_switch.last_tested="2024-01-01";fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/operational-readiness-check.mjs; then
  echo "::error::readiness gate passed a stale kill-switch test"; exit 1
fi
git checkout -- docs/governance/services/credit-origination.json
# 9 · Held release: production-authorized with the second-line hold still held must
#     block — and the silence-after-launch rule must fire on the empty ops log.
#     rc.37: the transition is APPENDED to state_history as an author now has to, so the
#     rejection is still the HOLD and not the history mismatch — a negative test that
#     fails for a new reason has quietly stopped testing the old one.
node -e 'const fs=require("fs");const p="docs/governance/changes/CHG-2026-0042/change-envelope.json";const s=JSON.parse(fs.readFileSync(p));s.current_state="production-authorized";s.state_history.push({state:"production-authorized",at:new Date().toISOString(),by:"risk-lena"});fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/change-envelope-check.mjs 2>/tmp/hold.txt; then
  echo "::error::a production authorization passed with the second-line hold still HELD"; exit 1
fi
grep -q 'release hold is "held"' /tmp/hold.txt || {
  echo "::error::the production authorization was refused, but not for the hold"; cat /tmp/hold.txt; exit 1; }
node -e 'const fs=require("fs");const p="docs/governance/operations-signal.json";const s=JSON.parse(fs.readFileSync(p));s.signals=[];fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/operations-signal-check.mjs; then
  echo "::error::an EMPTY operations log passed while a change claims production — silence after launch must fail"; exit 1
fi
git checkout -- docs/governance/changes/CHG-2026-0042/change-envelope.json docs/governance/operations-signal.json
# 10 · Tampered assurance cycle: editing a step after signing must fail verification.
node -e 'const fs=require("fs");const p="docs/governance/assurance-cycles/AC-2026-W29.json";const s=JSON.parse(fs.readFileSync(p));s.steps.check.status="fail";fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/assurance-cycle-check.mjs; then
  echo "::error::assurance-cycle gate passed a record edited after signing"; exit 1
fi
git checkout -- docs/governance/assurance-cycles/AC-2026-W29.json
# 11 · Rewritten decision: editing a logged decision must break the hash chain.
node -e 'const fs=require("fs");const p="docs/governance/decision-log.json";const s=JSON.parse(fs.readFileSync(p));s.entries[1].decision="rewritten after the fact";fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/decision-log-check.mjs; then
  echo "::error::decision-log gate passed an entry edited after logging"; exit 1
fi
git checkout -- docs/governance/decision-log.json
# 12 · Adapter to a non-existent control: a mapping to nothing must fail.
node -e 'const fs=require("fs");const p="docs/governance/adapters/github-branch-protection.json";const s=JSON.parse(fs.readFileSync(p));s.satisfies_control="NO-SUCH-CONTROL";fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/adapter-check.mjs; then
  echo "::error::adapter gate passed a mapping to a control the catalog does not have"; exit 1
fi
git checkout -- docs/governance/adapters/github-branch-protection.json
# 13 · rc.7 W1 — a compiled plan requires product evals; removing the manifest must FAIL
#      (the capability is mandatory-when-compiled, not optional).
mv docs/governance/product-evals.json /tmp/pe.json
if node scripts/product-eval-check.mjs; then
  echo "::error::product-eval gate passed with no manifest while a high-tier plan requires it"; exit 1
fi
mv /tmp/pe.json docs/governance/product-evals.json
# 14 · rc.7 W3 — a signed assurance cycle with a FAIL step and no risk acceptance must block.
node -e 'const fs=require("fs");const p="docs/governance/assurance-cycles/AC-2026-W29.json";const s=JSON.parse(fs.readFileSync(p));s.steps.check.status="fail";fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/assurance-cycle-check.mjs; then
  echo "::error::assurance-cycle gate passed a FAIL step with no risk acceptance"; exit 1
fi
git checkout -- docs/governance/assurance-cycles/AC-2026-W29.json
# 15 · rc.11 WS1 — a symbolic release_commit must fail the seal (no binding subject, F2).
node -e 'const fs=require("fs");const p="docs/governance/evidence/manifest.json";const s=JSON.parse(fs.readFileSync(p));s.release_commit="release-v-demo";fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/evidence-seal-check.mjs; then
  echo "::error::evidence-seal gate accepted a symbolic release_commit"; exit 1
fi
git checkout -- docs/governance/evidence/manifest.json
# 15b · rc.36 D4 — a manifest with NO anchor must fail: omitting the field used to skip
#       anchor verification entirely, which made the external-anchor control opt-out.
node -e 'const fs=require("fs");const p="docs/governance/evidence/manifest.json";const s=JSON.parse(fs.readFileSync(p));delete s.anchor;fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/evidence-seal-check.mjs; then
  echo "::error::evidence-seal gate passed a manifest with NO anchor — D4 is back"; exit 1
fi
git checkout -- docs/governance/evidence/manifest.json
# 15c · rc.36 D5 — a well-formed 40-hex commit that exists NOWHERE in this repository
#       must fail, and for that reason (the rc.11 shape check cannot see it).
node -e 'const fs=require("fs");const p="docs/governance/evidence/manifest.json";const s=JSON.parse(fs.readFileSync(p));s.release_commit="a".repeat(40);fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/evidence-seal-check.mjs 2>/tmp/d5.txt; then
  echo "::error::evidence-seal gate accepted a release_commit no one ever ran — D5 is back"; exit 1
fi
grep -q 'does not exist in this repository' /tmp/d5.txt || {
  echo "::error::the foreign commit was refused, but not for being foreign"; cat /tmp/d5.txt; exit 1; }
git checkout -- docs/governance/evidence/manifest.json
# 15d · rc.36 D3 — pointing the anchor attestation back at the bundled DEMO key must fail
#       the release-attestation gate: one attestation stack, the strong one, everywhere.
node -e 'const fs=require("fs");const p="docs/governance/evidence/manifest.json";const s=JSON.parse(fs.readFileSync(p));s.attestation.issuer="demo-anchor-signer";fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/release-attestation-check.mjs 2>/tmp/d3.txt; then
  echo "::error::a demo-signed anchor passed the release-attestation gate — the weak stack is back"; exit 1
fi
grep -q '"demo": true' /tmp/d3.txt || {
  echo "::error::the demo anchor was refused, but not for being a demo key"; cat /tmp/d3.txt; exit 1; }
git checkout -- docs/governance/evidence/manifest.json
# 16 · rc.11 WS1 — reusing the evidence for a DIFFERENT artifact digest must fail the
#      cross-binding (source→artifact no longer agree).
node -e 'const fs=require("fs");const p="docs/governance/release-subject.json";const s=JSON.parse(fs.readFileSync(p));const d="sha256:"+"a".repeat(64);s.artifact.digest=d;s.artifact.uri="registry.example.invalid/credit-service@"+d;fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/release-attestation-check.mjs; then
  echo "::error::release-attestation gate accepted evidence for a different artifact digest"; exit 1
fi
git checkout -- docs/governance/release-subject.json
# 17 · rc.11 WS1 — a product eval bound to a commit but NOT the built artifact must fail
#      (closes the F1 self-reference: the eval must name the immutable digest).
node -e 'const fs=require("fs");const p="docs/governance/product-evals.json";const s=JSON.parse(fs.readFileSync(p));for(const pr of s.products)delete pr.eval.evaluated_artifact;fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/release-attestation-check.mjs; then
  echo "::error::release-attestation gate accepted a commit-only eval not bound to the built artifact"; exit 1
fi
git checkout -- docs/governance/product-evals.json
# 18 · rc.12 WS2 — a catalog control claiming platform-enforced with no verified
#      observation must fail graduation (the state of record cannot overstate to the
#      platform tier without a receipt).
node -e 'const fs=require("fs");const p="docs/governance/control-catalog.json";const s=JSON.parse(fs.readFileSync(p));s.controls.find(c=>c.control_id==="HG-0002").state="platform-enforced";fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/platform-activation-check.mjs; then
  echo "::error::platform-activation gate let a control claim platform-enforced with no verified observation"; exit 1
fi
git checkout -- docs/governance/control-catalog.json
# 19 · rc.12 WS2.4 — weakening the live config (force-push re-enabled) must be caught as
#      drift, and while drifted the routine lane must be suspended.
node -e 'const fs=require("fs");const p="docs/governance/platform-activation/github-branch-protection.json";const s=JSON.parse(fs.readFileSync(p));s.observation.allow_force_pushes=true;fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/config-reconciliation-check.mjs; then
  echo "::error::config-reconciliation gate missed a control-plane weakening (force-push re-enabled)"; exit 1
fi
git checkout -- docs/governance/platform-activation/github-branch-protection.json
# 20 · rc.12 WS2.4 — a suspended routine envelope must fail the routine lane (auto-merge
#      cannot ride a drifted control plane).
node -e 'const fs=require("fs");const p="docs/governance/routine-envelope.json";const s=JSON.parse(fs.readFileSync(p));s.suspended=true;fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/routine-change-check.mjs --assert-routine --base main; then
  echo "::error::routine lane auto-merged while SUSPENDED"; exit 1
fi
git checkout -- docs/governance/routine-envelope.json
# 21 · rc.13 WS3 (F5) — the register requirement is DERIVED, not hardcoded: with the
#      compiling change removed, registerMandatory flips to false (so dropping the CLI
#      flag genuinely tracks compiled policy rather than silently always-requiring).
mv docs/governance/changes/CHG-2026-0042 /tmp/chg-f5
node -e 'import("./discovery/gates/validate.mjs").then(m=>{if(m.registerMandatory(".",{flag:false})){console.error("::error::register still mandatory with no compiling change — it is hardcoded, not derived from policy");process.exit(1)}console.log("F5: register correctly not mandatory once no compiled plan requires it")})'
mv /tmp/chg-f5 docs/governance/changes/CHG-2026-0042
# rc.14 WS5: `loom status` projects the five-stage adoption matrix (must run clean) …
node scripts/loom.mjs status --json > /tmp/loom-status.json
node -e 'const s=require("/tmp/loom-status.json");if(!Array.isArray(s.capabilities)||!s.capabilities.length){console.error("::error::loom status produced no capability matrix");process.exit(1)}console.log("loom status:",s.capabilities.length,"capabilities,",s.unresolved.length,"adopt-pending")'
# … and `attest-adoption` must REFUSE while the reference repo is adopt-pending (F7).
if node scripts/loom.mjs attest-adoption; then
  echo "::error::attest-adoption signed an adoption report while items are still adopt-pending"; exit 1
fi
# 22 · rc.13 WS4 — a guardrail policy that CLAIMS enforcement via a mechanism that does
#      not exist (implied coverage) must fail; the Loom must not imply a protection it lacks.
node -e 'const fs=require("fs");const p="guardrails/guardrail-policy.json";const s=JSON.parse(fs.readFileSync(p));s.guardrails[0].coverage["local-git"]={state:"enforced",mechanism:"hooks/does-not-exist.sh"};fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/guardrail-policy-check.mjs; then
  echo "::error::guardrail-policy gate accepted a claimed protection whose mechanism does not exist"; exit 1
fi
git checkout -- guardrails/guardrail-policy.json
# 23 · rc.14 WS6 — a runtime breach (high severity) with its containment removed must fail
#      the assurance-case gate; a breach must be contained.
node -e 'const fs=require("fs");const p="docs/governance/assurance-cases/CASE-2026-0007.json";const s=JSON.parse(fs.readFileSync(p));delete s.steps.remediation.containment;fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/assurance-case-check.mjs; then
  echo "::error::assurance-case gate passed a runtime breach with no containment action"; exit 1
fi
git checkout -- docs/governance/assurance-cases/CASE-2026-0007.json
# 24 · rc.15 WS7 — a repository pinning a REVOKED BrainKit release must fail (an unsafe
#      release cannot keep running across the estate).
node -e 'const fs=require("fs");const p="docs/governance/brainkit-registry.json";const s=JSON.parse(fs.readFileSync(p));const rev=s.releases.find(r=>r.status==="revoked");s.adoption_inventory.push({repository:"meridian/legacy",brainkit_id:rev.brainkit_id,version:rev.version,package_digest:rev.package_digest,acknowledged_at:"2026-04-02T00:00:00Z"});fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/brainkit-registry-check.mjs; then
  echo "::error::brainkit-registry gate let a repository run a REVOKED release"; exit 1
fi
git checkout -- docs/governance/brainkit-registry.json
# 25 · rc.15 WS8 — a high-tier change with its comprehension record removed must fail.
mv docs/governance/changes/CHG-2026-0042/comprehension.json /tmp/comp.json
if node scripts/comprehension-check.mjs; then
  echo "::error::comprehension gate passed a high-tier change with no understanding record"; exit 1
fi
mv /tmp/comp.json docs/governance/changes/CHG-2026-0042/comprehension.json
# 26 · rc.14 WS5 (F7) — the adoption-attestation gate. Unlike every other gate here it is
#      NOT run on the positive path: the dry-run repo is deliberately half-adopted (the
#      installer never fakes activation), so a signed adoption report MUST be impossible.
#      That makes the dry-run a natural home for F7's negative and a wrong one for its
#      positive, which lives in scripts/adoption-attest.test.mjs against a clean status.
#      The REASON is asserted: refusing because no attestation file exists would prove
#      nothing about the rule, which is that adopt-pending items forbid one being made.
if node scripts/adoption-attest.mjs 2>/tmp/aa.txt; then
  echo "::error::a half-adopted repo produced a valid adoption attestation — F7 is back"; exit 1
fi
grep -q 'adoption is not complete' /tmp/aa.txt || {
  echo "::error::the adoption gate refused, but not for being adopt-pending"; cat /tmp/aa.txt; exit 1; }
# 27 · rc.37 (flow-plan Phase 3.1) — a REWRITTEN state history must fail. The whole value
#      of an append-only record is that it cannot be re-authored after the fact, so the
#      three ways to re-author it are each asserted: reorder the states, back-date a
#      transition, and record a state the change never reached.
cp docs/governance/changes/CHG-2026-0042/change-envelope.json /tmp/sh-pristine.json
for MUT in reorder backdate parallel; do
  MUT=$MUT node -e '
    const fs=require("fs"), p="docs/governance/changes/CHG-2026-0042/change-envelope.json";
    const s=JSON.parse(fs.readFileSync("/tmp/sh-pristine.json"));
    if (process.env.MUT === "reorder") s.state_history.reverse();
    if (process.env.MUT === "backdate") s.state_history[2].at = "2026-01-01T00:00:00Z";
    if (process.env.MUT === "parallel") s.current_state = "in-production";
    fs.writeFileSync(p, JSON.stringify(s, null, 2));'
  if node scripts/change-envelope-check.mjs > /dev/null 2>&1; then
    echo "::error::a $MUT-ed state_history passed the change-envelope gate — the record is not append-only"; exit 1
  fi
done
cp /tmp/sh-pristine.json docs/governance/changes/CHG-2026-0042/change-envelope.json
node scripts/change-envelope-check.mjs > /dev/null
# 28 · rc.37 (flow-plan Phase 3.3) — an operations signal attributed to a change that does
#      not exist must fail. Without this the change-failure rate is computed over links
#      nobody can follow, which is worse than not computing it.
cp docs/governance/operations-signal.json /tmp/ops-pristine.json
node -e 'const fs=require("fs");const p="docs/governance/operations-signal.json";const s=JSON.parse(fs.readFileSync(p));s.signals[0].caused_by_change="CHG-2026-0042";s.signals[0].resolved_at="2026-07-15T02:00:00Z";fs.writeFileSync(p,JSON.stringify(s,null,2))'
node scripts/operations-signal-check.mjs > /dev/null || {
  echo "::error::a signal attributed to a REAL governed change failed the ops gate"; exit 1; }
node -e 'const fs=require("fs");const p="docs/governance/operations-signal.json";const s=JSON.parse(fs.readFileSync(p));s.signals[0].caused_by_change="CHG-9999-0001";fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/operations-signal-check.mjs 2>/tmp/ops.txt; then
  echo "::error::a signal attributed to a change that does not exist passed the ops gate"; exit 1
fi
grep -q 'does not resolve to a governed change' /tmp/ops.txt || {
  echo "::error::the ghost attribution was refused, but not for being a ghost"; cat /tmp/ops.txt; exit 1; }
cp /tmp/ops-pristine.json docs/governance/operations-signal.json
echo "all negative bypass tests rejected, as required"
