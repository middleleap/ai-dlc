#!/usr/bin/env bash
# The Loom adoption dry-run — extracted verbatim from .github/workflows/validate.yml.
# GitHub runs step scripts with `bash -e -o pipefail`; so does this. Outside Actions the
# runner variables default to a scratch dir, so `bash scripts/ci/local.sh` can run it.
set -eo pipefail
RUNNER_TEMP="${RUNNER_TEMP:-$(mktemp -d)}"; export RUNNER_TEMP
GITHUB_ENV="${GITHUB_ENV:-$RUNNER_TEMP/github-env}"; export GITHUB_ENV; touch "$GITHUB_ENV"
cd "$(git rev-parse --show-toplevel)"
A="$RUNNER_TEMP/loom-adopt-dryrun"
P=plugins/middleleap-loom/skills
H="$P/loom-adopt/harness"
# rc.8 WS1: copy-manifest.json drives the install through adopt.mjs — no parallel CI
# copy list. A new manifest entry now lands in the adopted layout with zero CI edits
# (scripts/adopt.test.mjs proves this). The generated SKILL copy table is still gated
# for drift by the doc-integrity step above.
# --tier full, explicitly: the dry-run exercises governed/full-tier templates (identity
# map, routine envelope, service readiness, institution BrainKit …). rc.33 made the
# unflagged default `core` — the safe on-ramp for a real adopter, the wrong coverage here.
node "$H/adopt.mjs" --dest "$A" --tier full
# Worked-example fixtures the installer deliberately does NOT ship (they are the Loom's
# own demonstration data, not adopter machinery, so they are not in the copy manifest).
mkdir -p "$A/docs/governance/changes" "$A/docs/governance/services" \
         "$A/docs/governance/evidence" "$A/docs/governance/assurance-cycles" \
         "$A/docs/governance/adapters"
cp -r "$H/change-example" "$A/docs/governance/changes/CHG-2026-0042"
# rc.37 (flow-plan Phase 3): a change that went all the way and then ended. The flow
# instruments need one — change-example is mid-flight, so on its own it yields a stage
# histogram and no lead time, and a report that can only print "not computable" proves
# nothing. Terminal, so it carries no plan, no passport and no receipts.
cp -r "$H/change-closed-example" "$A/docs/governance/changes/CHG-2026-0031"
cp "$H/evidence-example/"*.json "$A/docs/governance/evidence/"
cp "$H/evidence-example/sast.sarif" "$A/docs/governance/evidence/"
cp -r "$H/register-example" "$A/docs/governance/data-risk-register"
cp "$H/assurance-example/assurance-cycle.json" "$A/docs/governance/assurance-cycles/AC-2026-W29.json"
# The committed example carries fixed dates and the assurance-cycle gate judges them
# against the real clock: the moment the wall clock passed AC-F-1's due date the gate
# started blocking every run, and the 30d cadence on ran_at was days from doing the
# same. Same reasoning as rc.36 re-stamping the fictional commit: the derived tree is
# this run's, so its time-relative fields are stamped at derivation — ran_at fresh,
# open findings due ahead of now. Resolved findings keep their history; regenerate.mjs
# below signs the stamped record, so signature verification is unaffected.
node -e '
  const fs=require("fs");
  const p=process.argv[1];
  const c=JSON.parse(fs.readFileSync(p));
  const DAY=86400000, now=Date.now();
  c.ran_at=new Date(now-2*DAY).toISOString();
  for (const f of c.findings??[]) if (f.status==="open") f.due=new Date(now+21*DAY).toISOString().slice(0,10);
  fs.writeFileSync(p,JSON.stringify(c,null,2));
' "$A/docs/governance/assurance-cycles/AC-2026-W29.json"
cp "$H/assurance-example/decision-log.json" "$A/docs/governance/decision-log.json"
mkdir -p "$A/docs/governance/assurance-cases"
cp "$H/assurance-example/assurance-case.json" "$A/docs/governance/assurance-cases/CASE-2026-0007.json"
cp "$H/brainkit-example/brainkit-registry.json" "$A/docs/governance/brainkit-registry.json"   # rc.15 WS7 — BrainKit estate registry
cp "$H/adapters/reference/"*.json "$A/docs/governance/adapters/"
# rc.13: the approval-attestation worked example, so the PA gate's attestation path is
# exercised end to end in the adopted layout rather than skipping there (it is bundle
# demonstration data, so the installer does not ship it).
cp -r "$H/approval-attestation-example" "$A/approval-attestation-example"
# rc.13 WS4: the export example, so the deterministic exporter's positive AND abort
# cases run in the adopted layout too (bundle demonstration data, not adopter machinery).
cp -r "$H/floor-export-example" "$A/floor-export-example"
# rc.13 WS4 · D4.1: a real frozen artifact + its stamp, so freeze-stamp-check verifies an
# actual digest instead of passing vacuously on a layout that has frozen nothing. The
# gate is silent where no run carries stamps, which is exactly why one has to be staged.
mkdir -p "$A/discovery/runs/accounts-elsewhere/.freeze"
cp "$H/freeze-example/data-governance.md" "$A/discovery/runs/accounts-elsewhere/data-governance.md"
cp "$H/freeze-example/data-governance.freeze.json" "$A/discovery/runs/accounts-elsewhere/.freeze/data-governance.json"
# …and the observer that watches it, so the D4.2 gate below has something real to compare.
cp -r "$H/freeze-example" "$A/freeze-example"
cp -r "$H/drift-example" "$A/drift-example"
# rc.16 WS5/WS6: the three worked examples that stop approval-surface, floor-keeper and
# adapter-evidence from passing vacuously. Each is bundle demonstration data, so the
# installer does not ship it and the dry-run stages it here.
cp -r "$H/approval-surface-example" "$A/approval-surface-example"
cp -r "$H/floor-keeper-example" "$A/floor-keeper-example"
cp -r "$H/adapter-evidence-example" "$A/adapter-evidence-example"
# rc.18 WS0 · D0.1: staged HERE with every other example, because $H is repo-root-relative
# and everything below `cd "$A"` runs from the dry-run destination.
cp -r "$H/residency-example" "$A/residency-example"
# rc.39 (flow-plan Phase 5): the exposure plane's worked example. The change-example
# compiles HIGH and regulated-bank now declares the exposure_control capability at high
# tier, so the flag register is MANDATORY-WHEN-COMPILED in this layout — without a real
# register the gate could only ever have been exercised against tmp fixtures, which is
# the vacuum every *-example/ here exists to fill. The deployment record is the deploy
# lane's first subject; the lane had zero controls until rc.39 and its CI invocation was
# deleted at rc.33 for exactly that reason.
cp -r "$H/exposure-example" "$A/exposure-example"
cp "$H/exposure-example/feature-flags.json" "$A/docs/governance/feature-flags.json"
mkdir -p "$A/docs/governance/deployments"
cp "$H/exposure-example/deployment.json" "$A/docs/governance/deployments/DEP-2026-0042-01.json"
# 2.4.0: the UAE profile automatically compiles ai-decision-system for this
# model-involved material product change. Stage the worked AI governance joins so the
# dry-run exercises accountability, human oversight, bilingual disclosure, fairness,
# contestability and stress-evidence binding without pretending the bundle ran a model.
mkdir -p "$A/docs/governance/ai-evidence"
cp "$H/ai-governance-example/ai-governance.json" "$A/docs/governance/ai-governance.json"
cp "$H/ai-governance-example/fairness-evaluations.json" "$A/docs/governance/fairness-evaluations.json"
cp "$H/ai-governance-example/decision-contestability.json" "$A/docs/governance/decision-contestability.json"
cp "$H/ai-governance-example/ai-evidence/"*.json "$A/docs/governance/ai-evidence/"
# 2.4.0: the high-tier bank profile now requires the operating-model seam. Mount the
# synthetic worked record so the dry-run checks the RACI, accountable executive, IAM
# bindings and independent re-performance route without claiming any organisation exists.
cp "$H/operating-model-example/operating-model.json" "$A/docs/governance/operating-model.json"
# rc.7: the high-tier change-example's compiled plan REQUIRES product evals; lay the
# example + its sealed report and let it stand in for the installed template.
cp -r "$H/product-eval-example" "$A/product-eval-example"
cp "$H/product-eval-example/product-evals.json" "$A/docs/governance/product-evals.json"
# rc.11 WS1: the immutable release subject binds source→artifact→evals→evidence by one
# digest. Mounts at the top governance level (peer of product-evals.json).
cp "$H/evidence-example/release-subject.json" "$A/docs/governance/release-subject.json"
printf 'milestones: []\n' > "$A/docs/backlog.yaml"
# rc.36 (flow-plan Phase 2b): the evidence-example directory itself, so the dry-run can
# re-derive + re-sign the bundle at a real commit with regenerate.mjs (the committed
# example is demo-signed and bound to a fictional commit ON PURPOSE — the gates now
# refuse both, and the dry-run pays the refusal by regenerating).
cp -r "$H/evidence-example" "$A/evidence-example"
# Deliberate ADOPT completions the installer never fakes: the manifest ships
# services/example-service.json with ADOPT placeholders; the dry-run exercises a real
# service (credit-origination) and drops the stub. rc.36: a drill is a SIGNED
# OBSERVATION (observation + refused negative test + non-builder observer + signature),
# generated per run with a fresh ed25519 key exactly like the platform-activation
# observer below — a stamped bare date is now the DEPRECATED form.
rm -f "$A/docs/governance/services/example-service.json"
TPL="$H/governance/service-readiness.template.json" DEST="$A" node <<'JS'
const { generateKeyPairSync, sign, createHash } = require("crypto"), fs = require("fs");
const canonical = (v) => Array.isArray(v) ? `[${v.map(canonical).join(",")}]` : (v && typeof v === "object") ? `{${Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canonical(v[k])).join(",")}}` : JSON.stringify(v);
const t = JSON.parse(fs.readFileSync(process.env.TPL));
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const today = new Date().toISOString();
const observe = (note, attempted) => {
  const rec = { observed_at: today, observation: { note }, negative_test: { attempted, result: "rejected", tested_at: today }, observer_identity: "ops-dana" };
  const h = createHash("sha256").update(canonical(rec)).digest("hex");
  rec.attestation = { issuer: "ci-drill-observer", signature: sign(null, Buffer.from(h, "utf8"), privateKey).toString("base64") };
  return rec;
};
t.bcp_dr.last_exercised = observe("failover to the secondary region in 42m; RPO held at 11m", "promotion of a stale replica");
t.rollback.last_drilled = observe("rolled back to vN-1 in 6m; limits reconciled", "writes against the rolled-back schema");
t.kill_switch.last_tested = observe("decisioning drained to the manual queue in 90s", "traffic routed through the killed path");
t.capacity.last_run = observe("2x peak sustained for 1h; p99 within SLO", "load beyond the declared ceiling");
// rc.39 (flow-plan Phase 5.3) — R3b. The change-example compiles exposure_control, so the
// progressive_delivery block is REQUIRED here, and its automated-rollback trigger test is a
// signed observation on a 90-day window like every other drill.
t.progressive_delivery.automated_rollback.last_tested = observe("error-rate breach at 12% traffic auto-reverted to vN-1 in 90s; no manual step", "ramp advanced past the next stage while the trigger SLO was breaching");
fs.writeFileSync(`${process.env.DEST}/docs/governance/services/credit-origination.json`, JSON.stringify(t, null, 2));
const regPath = `${process.env.DEST}/docs/governance/attestation-issuers.json`;
const reg = JSON.parse(fs.readFileSync(regPath));
reg.issuers.push({ id: "ci-drill-observer", mechanism: "ed25519", verify: { public_key: publicKey.export({ type: "spki", format: "pem" }).toString() } });
fs.writeFileSync(regPath, JSON.stringify(reg, null, 2));
JS
cd "$A"
# Negative test: the unadopted template (placeholder @your-org team) must FAIL the
# control-plane gate — a copied-but-never-adopted control plane is not a control.
if node scripts/control-plane-check.mjs; then
  echo "::error::control-plane gate passed on the placeholder CODEOWNERS template — the false green is back"
  exit 1
fi
# The ADOPT step: replace the placeholder with a real team, as an adopter would.
sed -i 's|@your-org/|@dryrun-bank/|g' CODEOWNERS
# 2.1.0 — the obligations register ships ILLUSTRATIVE and, by design, FAILS its gate under a
# regulated profile (the change-example compiles one). Like the owner substitution above,
# this stands in for the compliance function on the dry-run: entries marked verified with a
# fixture citation. An unadopted register must never read as a green control in a real repo.
node -e '
  const fs=require("fs"),p="docs/governance/obligations.json",o=JSON.parse(fs.readFileSync(p));
  for (const x of o.obligations){ x.illustrative=false; x.article="dry-run fixture — stands in for the compliance function\u0027s verified citation"; }
  fs.writeFileSync(p,JSON.stringify(o,null,2));
'
if node scripts/obligations-check.mjs > /dev/null 2>&1; then :; else
  echo "::error::the obligations gate failed on the dry-run register after the fixture substitution"; exit 1; fi
# demo/meridian tests run in the bundle-layout step; $H is not staged under $A
node --test discovery/gates/*.test.mjs discovery/render/*.test.mjs scripts/*.test.mjs core/*.test.mjs
# rc.12 WS2: model `loom activate` — generate a today-dated, independently-signed
# observation that the live platform refused a bypass, and register the observer key. Done
# BEFORE the base commit so the record + registry entry are TRACKED — the negative-bypass
# section restores them with `git checkout --` and survives its `git reset --hard`.
# (A committed static record would age out; generating per-run keeps it perpetually fresh
# and faithful to how a real observation is produced.)
node -e '
  const {generateKeyPairSync,sign,createHash}=require("crypto"),fs=require("fs");
  const canonical=(v)=>Array.isArray(v)?`[${v.map(canonical).join(",")}]`:(v&&typeof v==="object")?`{${Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+canonical(v[k])).join(",")}}`:JSON.stringify(v);
  const {publicKey,privateKey}=generateKeyPairSync("ed25519"),today=new Date().toISOString();
  const rec={platform:"github",repository:"dryrun-bank/service",satisfies_control:"HG-0001",mechanism:"branch_protection",observation:{required_status_checks:["gates"],enforce_admins:true,allow_force_pushes:false,required_pull_request_reviews:{required_approving_review_count:1,require_code_owner_reviews:true}},bypass_test:{attempted:"direct push to main by a builder",result:"rejected",tested_at:today},observer_identity:"padmin-zoe",observed_at:today};
  const {attestation,...rest}=rec,h=createHash("sha256").update(canonical(rest)).digest("hex");
  rec.attestation={issuer:"demo-platform-observer",signature:sign(null,Buffer.from(h,"utf8"),privateKey).toString("base64")};
  fs.mkdirSync("docs/governance/platform-activation",{recursive:true});
  fs.writeFileSync("docs/governance/platform-activation/github-branch-protection.json",JSON.stringify(rec,null,2));
  const reg=JSON.parse(fs.readFileSync("docs/governance/attestation-issuers.json"));
  reg.issuers.push({id:"demo-platform-observer",mechanism:"ed25519",verify:{public_key:publicKey.export({type:"spki",format:"pem"}).toString()}});
  fs.writeFileSync("docs/governance/attestation-issuers.json",JSON.stringify(reg,null,2));
'
# rc.16 D5.3: stage the adapter declarations and generate their signed observations BEFORE
# the base commit, so they are tracked and survive the `git checkout --` restores the
# negative-bypass step below performs. Same reason the platform-activation record is
# generated here rather than committed: the keys are fresh per run and only public halves
# are ever written, so the bundle never ships usable trust material.
node adapter-evidence-example/observe.mjs --dest .
# Q1b + the secrets history scan diff against git — give the adopted layout a history.
git init -q -b main && git config user.email loom@dryrun.invalid && git config user.name loom-dryrun
git add -A && git commit -qm base
# rc.36 (flow-plan Phase 2b / D3+D5): the committed evidence bundle is demo-signed and
# bound to a fictional commit, and the gates now refuse BOTH. Re-derive the manifest at
# the base commit and re-sign the anchor (and the demo-signed assurance cycle) with a
# per-run, non-demo key — then commit, so every `git checkout --` restore below recovers
# the REGENERATED state, and the base commit is a real ancestor of HEAD (D5).
node evidence-example/regenerate.mjs --dest .
# rc.39: regenerate stamps release-subject.json's source.commit to the real base commit,
# so the deployment record must name the same one — exactly what an adopter's deploy job
# does when it writes the record from what it observed. The DIGEST is untouched: that is
# the binding the deploy gate exists to check and it must not be papered over here.
node -e '
  const fs=require("fs");
  const c=JSON.parse(fs.readFileSync("docs/governance/release-subject.json")).source.commit;
  const p="docs/governance/deployments/DEP-2026-0042-01.json";
  const d=JSON.parse(fs.readFileSync(p)); d.release_commit=c; fs.writeFileSync(p,JSON.stringify(d,null,2));
'
git add -A && git commit -qm "seal release evidence at the base commit (rc.36)"
node scripts/discovery-link-check.mjs
# ── HG-0007 coverage + nesting (rc.28) ────────────────────────────────────────────
# The waist gate is the one gate where an inert PASS is worse than an absent gate:
# nobody goes looking at a green light. The run above passes on `milestones: []`, which
# proves nothing about coverage — so prove it on a backlog the gate genuinely covers,
# then invert the three ways it used to go quiet. All paths are destination-relative
# (we are inside "$A"); the empty backlog is restored at the end.
cat > docs/backlog.yaml <<'YAML'
milestones:
  - id: M1
    name: milestone keyed by id — the nesting style that used to swallow its items
    items:
      - id: STORY-1
        status: pending
        discovery_exempt: true
        reason: dry-run fixture — no discovery run exists in an adopted skeleton
      - id: INFRA-1
        status: pending
YAML
node scripts/discovery-link-check.mjs | tee /tmp/wg.txt
grep -q '1 of 3 backlog item(s) waist-gated' /tmp/wg.txt || {
  echo "::error::waist gate passed without stating its coverage, or covered the wrong number of items"; exit 1; }
#   ① The silent miss itself — a milestone keyed by `id` looks exactly like an item
#      start. It used to absorb every item beneath it, so an UNGATED pending feature
#      went unexamined and the gate reported OK.
cat > docs/backlog.yaml <<'YAML'
milestones:
  - id: M1
    items:
      - id: STORY-1
        status: pending
YAML
if node scripts/discovery-link-check.mjs; then
  echo "::error::a pending feature nested under an id-keyed milestone passed the waist gate — the swallow is back"; exit 1; fi
#   ② Content the parser cannot read. A mapping-shaped backlog is real work and zero
#      recognised items; printing OK would claim every feature traces to a hand-off on
#      the strength of having examined nothing.
printf 'items:\n  STORY-1:\n    status: pending\n' > docs/backlog.yaml
if node scripts/discovery-link-check.mjs; then
  echo "::error::waist gate reported OK over a backlog in which it recognised no items"; exit 1; fi
#   ③ An unedited ADOPT marker. Every brownfield repo has ids like FEAT-102, which the
#      shipped ^STORY-\d+$ default matches never — the gate reads everything, gates
#      nothing, and says OK.
printf -- '- id: FEAT-102\n  status: pending\n- id: PAY-88\n  status: pending\n' > docs/backlog.yaml
if node scripts/discovery-link-check.mjs; then
  echo "::error::waist gate passed with its FEATURE marker still on the shipped default and matching no item"; exit 1; fi
printf 'milestones: []\n' > docs/backlog.yaml
node scripts/control-plane-check.mjs
node scripts/template-parity-check.mjs   # floor forms in step with the git templates
node scripts/identity-map-check.mjs      # P6 — the map that says WHO a signed subject is
# rc.18 WS0 · D0.1/P1: the residency sign-off gate. The fixture was staged above, before
# the `cd "$A"` — paths here are destination-relative. Staged with a real fixture from the
# start rather than wired blind — a gate whose first CI run has nothing to read is the
# exact failure this PR series existed to close. BOTH directions asserted below.
mkdir -p docs/governance
cp residency-example/residency-review.md docs/governance/residency-review.md
node scripts/residency-check.mjs | tee /tmp/rs.txt
grep -q 'SIGNED' /tmp/rs.txt || {
  echo "::error::the residency gate is not reading a signed record — it is passing on nothing"; exit 1; }
# 1 · unsigned while a floor is in use must FAIL — this is §11's blocking statement, and
#     it is the whole reason the gate exists.
cp residency-example/residency-review.unsigned.md docs/governance/residency-review.md
if node scripts/residency-check.mjs; then
  echo "::error::a floor is in use with an UNSIGNED residency record and the gate passed"; exit 1; fi
# 2 · a builder signing must FAIL — §11 says builders may not sign. The REASON is asserted,
#     not just the exit code: a gate that fails for the wrong reason will pass for the
#     wrong reason later, and eng-omar also trips "does not hold the role".
cp residency-example/residency-review.builder-signed.md docs/governance/residency-review.md
if node scripts/residency-check.mjs 2>/tmp/rs-b.txt; then
  echo "::error::a builder signed the residency record and the gate passed"; exit 1; fi
grep -q 'builders group' /tmp/rs-b.txt || {
  echo "::error::the builder signature was refused, but not for being a builder"; cat /tmp/rs-b.txt; exit 1; }
# 3 · one person holding both roles must FAIL — four eyes, not one pair wearing two hats.
cp residency-example/residency-review.one-person.md docs/governance/residency-review.md
if node scripts/residency-check.mjs 2>/tmp/rs-o.txt; then
  echo "::error::one identity signed both residency roles and the gate passed"; exit 1; fi
grep -q 'signed as both' /tmp/rs-o.txt || {
  echo "::error::the double signature was refused, but not for being one person"; cat /tmp/rs-o.txt; exit 1; }
cp residency-example/residency-review.md docs/governance/residency-review.md
node scripts/residency-check.mjs > /dev/null   # green again after the restores
node scripts/freeze-stamp-check.mjs      # D4.1 — a frozen artifact still matches its stamp
# rc.15 WS4 · D4.2: the drift gate passed VACUOUSLY here — "nothing has been observed" —
# which is the same hole freeze-stamp-check had before a real artifact was staged beside
# it. Generate an observation of the bundled freeze (fresh: the gate refuses one over 7
# days old, so a committed one would fail every build within a week and get deleted) and
# assert BOTH directions, so a regression in drift detection fails the dry-run.
mkdir -p docs/governance/floor-drift
node drift-example/observe.mjs > docs/governance/floor-drift/alpha-in-sync.json
node scripts/drift-check.mjs | tee /tmp/drift-insync.txt
grep -q '0 drifted' /tmp/drift-insync.txt || {
  echo "::error::an in-sync observation should report 0 drifted"; exit 1; }
rm docs/governance/floor-drift/alpha-in-sync.json
node drift-example/observe.mjs --drifted > docs/governance/floor-drift/alpha-drifted.json
node scripts/drift-check.mjs | tee /tmp/drift-moved.txt
grep -q '1 drifted' /tmp/drift-moved.txt || {
  echo "::error::a page whose digest moved should be reported as drifted — detection is broken"; exit 1; }
rm docs/governance/floor-drift/alpha-drifted.json
node scripts/drift-check.mjs             # D4.2 — no NEW claim against a page that has moved on
node scripts/floor-only-check.mjs        # D3.3 — a floor-only note must never reach the record
node scripts/projection-capability-check.mjs  # WS1 — the projector is OBSERVED unable to write git
# rc.16 · D5.1/D5.4 — these three gates all reported a confident OK about NOTHING, which is
# the vacuum freeze-stamp and drift both had. Each now gets a worked example and, as with
# D4.2, BOTH directions are asserted: the count must be real, and the mutation must fail.
# A count assertion matters as much as a failure assertion here — the bug was never a wrong
# answer, it was a right answer about an empty set.
mkdir -p floor/approvals
node approval-surface-example/derive.mjs PA1 > floor/approvals/CHG-2026-0042-PA1.json
node approval-surface-example/derive.mjs PA2 > floor/approvals/CHG-2026-0042-PA2.json
node scripts/approval-surface-check.mjs | tee /tmp/as.txt
grep -q '2 approval surfaces' /tmp/as.txt || {
  echo "::error::the approval-surface gate is back to counting zero"; exit 1; }
node approval-surface-example/derive.mjs PA2 --break drop-section > floor/approvals/CHG-2026-0042-PA2.json
if node scripts/approval-surface-check.mjs; then
  echo "::error::a surface missing a compiled role passed the gate"; exit 1; fi
node approval-surface-example/derive.mjs PA2 > floor/approvals/CHG-2026-0042-PA2.json

# D6.3/D6.4 — a keeper holding no grant where approvals live, and a floor that says it is
# degraded. A truthfully-degraded floor must PASS: failing it would make the honest record
# the expensive one.
mkdir -p docs/governance/floor-degradation
node floor-keeper-example/generate.mjs --register > docs/governance/floor-keepers.json
node floor-keeper-example/generate.mjs --observation > docs/governance/floor-degradation/floor.json
node scripts/floor-keeper-check.mjs | tee /tmp/fk.txt
grep -q 'no grant on any approval-carrying container' /tmp/fk.txt || {
  echo "::error::the floor gate is no longer checking keeper separation"; exit 1; }
node floor-keeper-example/generate.mjs --register --mutate keeper-grant > docs/governance/floor-keepers.json
if node scripts/floor-keeper-check.mjs; then
  echo "::error::a keeper grant on the approvals container passed FK-R03"; exit 1; fi
node floor-keeper-example/generate.mjs --register > docs/governance/floor-keepers.json
node floor-keeper-example/generate.mjs --observation --mutate paused-but-live > docs/governance/floor-degradation/floor.json
if node scripts/floor-keeper-check.mjs; then
  echo "::error::a paused floor reported as live passed DG-R02"; exit 1; fi
node floor-keeper-example/generate.mjs --observation > docs/governance/floor-degradation/floor.json

# D5.3 — one adapter, one control. The declarations and signed observations were staged
# before the base commit (above) so they are tracked. `--borrow` offers one stream's
# evidence for another stream's control, which is finding F4 itself and must never verify.
node scripts/adapter-evidence-check.mjs | tee /tmp/ae.txt
# `[1-9] active`, not bare `active` — "DECLARED, NOT ACTIVE" would satisfy a loose match and
# the assertion would pass on precisely the state it exists to catch.
grep -qE '[1-9][0-9]* active' /tmp/ae.txt || {
  echo "::error::the adapter-evidence gate reports no ACTIVE stream — it is verifying declarations only"; exit 1; }
node adapter-evidence-example/observe.mjs --dest . --borrow
if node scripts/adapter-evidence-check.mjs; then
  echo "::error::one stream's evidence satisfied another stream's control — finding F4 is back"; exit 1; fi
git checkout -- docs/governance/adapters docs/governance/attestation-issuers.json 2>/dev/null || true
rm -rf docs/governance/adapter-evidence
node adapter-evidence-example/observe.mjs --dest .
node scripts/control-catalog-check.mjs
node scripts/identity-registry-check.mjs
node scripts/change-envelope-check.mjs
node scripts/product-approval-check.mjs
node scripts/architecture-assurance-check.mjs
node scripts/operational-readiness-check.mjs

# ── rc.39 · flow-plan Phase 5: exposure is decoupled from deploy ──────────────────
# Three new gates, each staged with something real. The register is MANDATORY here (the
# change-example compiles HIGH and regulated-bank declares exposure_control at high
# tier), so this is the same mandatory-when-compiled derivation the data-risk register
# and the provider roles use — the requirement comes from the PROFILE, never a CI flag.
#
# ① The promotion ladder. The installed template is the Loom's EXAMPLE estate, and the
#    gate must say so rather than reading green as somebody's real one.
node scripts/environments-check.mjs | tee /tmp/env.txt
grep -q "shipped template's placeholder" /tmp/env.txt || {
  echo "::error::the environment gate passed the shipped example ladder without saying it is the shipped example"; exit 1; }
#    …and the two rules that fail closed. Personal data behind an unattended promotion:
node -e 'const fs=require("fs"),p="docs/governance/environments.json",s=JSON.parse(fs.readFileSync(p));s.environments.find(e=>e.id==="staging").data_classification="personal";fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/environments-check.mjs 2>/tmp/env-p.txt; then
  echo "::error::an environment holding personal data passed with approval_required false"; exit 1; fi
grep -q 'promoted into by decision, not by pipeline' /tmp/env-p.txt || {
  echo "::error::the personal-data environment was refused, but not for holding personal data"; cat /tmp/env-p.txt; exit 1; }
git checkout -- docs/governance/environments.json
#    …and a builder waving work into the environment that requires approval:
node -e 'const fs=require("fs"),p="docs/governance/environments.json",s=JSON.parse(fs.readFileSync(p));s.environments.find(e=>e.id==="production").identity="eng-omar";fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/environments-check.mjs 2>/tmp/env-b.txt; then
  echo "::error::a builder is the promotion identity for an approval-required environment and the gate passed"; exit 1; fi
grep -q 'builders group' /tmp/env-b.txt || {
  echo "::error::the builder promoter was refused, but not for being a builder"; cat /tmp/env-b.txt; exit 1; }
git checkout -- docs/governance/environments.json
node scripts/environments-check.mjs > /dev/null
#
# ② The exposure register. Positive first — it must be COUNTING a real flag, not passing
#    over an empty set, and it must say the capability is what makes it mandatory.
node scripts/feature-flag-check.mjs | tee /tmp/ff.txt
grep -q '1 flag, exposure_control required by a compiled plan' /tmp/ff.txt || {
  echo "::error::the exposure gate is not reading the staged flag, or not deriving the compiled requirement"; cat /tmp/ff.txt; exit 1; }
#    default ON is the whole pattern collapsing:
node -e 'const fs=require("fs"),p="docs/governance/feature-flags.json",s=JSON.parse(fs.readFileSync(p));s.flags[0].default=true;fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/feature-flag-check.mjs 2>/tmp/ff-d.txt; then
  echo "::error::a flag defaulting ON passed the exposure gate — that is a deploy, not an exposure control"; exit 1; fi
grep -q 'it is a deploy' /tmp/ff-d.txt || {
  echo "::error::the default-on flag was refused, but not for defaulting on"; cat /tmp/ff-d.txt; exit 1; }
git checkout -- docs/governance/feature-flags.json
#    the expiry, BOTH directions, restamped per run so no shipped date is load-bearing:
node -e 'const fs=require("fs"),p="docs/governance/feature-flags.json",s=JSON.parse(fs.readFileSync(p));s.flags[0].expires=new Date(Date.now()+10*86400000).toISOString().slice(0,10);fs.writeFileSync(p,JSON.stringify(s,null,2))'
node scripts/feature-flag-check.mjs > /tmp/ff-w.txt || {
  echo "::error::a flag 10 days from expiry must WARN, never fail — the deadline is unmoved, the surprise is removed"; cat /tmp/ff-w.txt; exit 1; }
grep -q '14-day band' /tmp/ff-w.txt || {
  echo "::error::a flag inside the 14-day band did not warn"; cat /tmp/ff-w.txt; exit 1; }
node -e 'const fs=require("fs"),p="docs/governance/feature-flags.json",s=JSON.parse(fs.readFileSync(p));s.flags[0].expires=new Date(Date.now()-86400000).toISOString().slice(0,10);fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/feature-flag-check.mjs 2>/tmp/ff-x.txt; then
  echo "::error::an EXPIRED flag passed — an exposure control past its end date is a permanent branch in production"; exit 1; fi
grep -q 'EXPIRED' /tmp/ff-x.txt || {
  echo "::error::the expired flag was refused, but not for being expired"; cat /tmp/ff-x.txt; exit 1; }
git checkout -- docs/governance/feature-flags.json
#    and the mandatory-when-compiled derivation itself: remove the register entirely.
mv docs/governance/feature-flags.json /tmp/feature-flags.json
if node scripts/feature-flag-check.mjs 2>/tmp/ff-m.txt; then
  echo "::error::a compiled plan requires exposure_control and the missing register passed"; exit 1; fi
grep -q 'CHG-2026-0042' /tmp/ff-m.txt || {
  echo "::error::the missing register was refused without naming the change that requires it"; cat /tmp/ff-m.txt; exit 1; }
mv /tmp/feature-flags.json docs/governance/feature-flags.json
node scripts/feature-flag-check.mjs > /dev/null
#    R3b is mandatory the same way: strip the ramp and readiness must refuse it.
node -e 'const fs=require("fs"),p="docs/governance/services/credit-origination.json",s=JSON.parse(fs.readFileSync(p));delete s.progressive_delivery;fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/operational-readiness-check.mjs 2>/tmp/pd-m.txt; then
  echo "::error::a service under a change compiling exposure_control passed R3 with no declared ramp"; exit 1; fi
grep -q 'progressive_delivery is not an object' /tmp/pd-m.txt || {
  echo "::error::the missing ramp was refused, but not for being missing"; cat /tmp/pd-m.txt; exit 1; }
git checkout -- docs/governance/services/credit-origination.json
#
# ③ The deploy lane's first control. The lane ran green-about-nothing until rc.33 deleted
#    its invocation; it is back because there is now something in it.
node scripts/deployed-digest-check.mjs | tee /tmp/dep.txt
grep -q '1 deployment record' /tmp/dep.txt || {
  echo "::error::the deploy gate is not reading the staged deployment record"; cat /tmp/dep.txt; exit 1; }
#    a rebuild of the same source is a DIFFERENT artifact and was not the one evaluated:
node -e 'const fs=require("fs"),p="docs/governance/deployments/DEP-2026-0042-01.json",s=JSON.parse(fs.readFileSync(p));s.deployed_digest="sha256:"+"b".repeat(64);fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/deployed-digest-check.mjs 2>/tmp/dep-d.txt; then
  echo "::error::a deployment of a digest that is NOT the authorized one passed the deploy gate"; exit 1; fi
grep -q 'DEPLOYED DIGEST IS NOT THE AUTHORIZED DIGEST' /tmp/dep-d.txt || {
  echo "::error::the wrong digest was refused, but not for being the wrong digest"; cat /tmp/dep-d.txt; exit 1; }
git checkout -- docs/governance/deployments/DEP-2026-0042-01.json
#    …and a canary that jumped to 100% did not go out the way it was approved to:
node -e 'const fs=require("fs"),p="docs/governance/deployments/DEP-2026-0042-01.json",s=JSON.parse(fs.readFileSync(p));s.stages_completed=[s.stages_completed[3]];fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/deployed-digest-check.mjs 2>/tmp/dep-s.txt; then
  echo "::error::a deployment that skipped every declared ramp stage passed the deploy gate"; exit 1; fi
grep -q 'exposure that was never baked' /tmp/dep-s.txt || {
  echo "::error::the skipped ramp was refused, but not for skipping stages"; cat /tmp/dep-s.txt; exit 1; }
git checkout -- docs/governance/deployments/DEP-2026-0042-01.json
#    …and a stage cut short of its declared bake is an unwatched rollout, not a fast one:
node -e 'const fs=require("fs"),p="docs/governance/deployments/DEP-2026-0042-01.json",s=JSON.parse(fs.readFileSync(p));s.stages_completed[1].completed_at=s.stages_completed[1].started_at;fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node scripts/deployed-digest-check.mjs 2>/tmp/dep-b.txt; then
  echo "::error::a ramp stage that never baked passed the deploy gate"; exit 1; fi
grep -q 'it is an unwatched one' /tmp/dep-b.txt || {
  echo "::error::the unbaked stage was refused, but not for the bake"; cat /tmp/dep-b.txt; exit 1; }
git checkout -- docs/governance/deployments/DEP-2026-0042-01.json
node scripts/deployed-digest-check.mjs > /dev/null
#    …and the LANE itself: the runner refused an empty deploy lane at rc.33, so proving
#    it now selects and passes is what actually retires that guard.
node core/gate-runner.mjs --lane deploy --out /tmp/gate-run-deploy.json | tee /tmp/deploy-lane.txt
grep -q 'Gate runner \[deploy\] — PASS' /tmp/deploy-lane.txt || {
  echo "::error::the deploy lane did not run — an empty lane is a hole, not a pass"; cat /tmp/deploy-lane.txt; exit 1; }
node -e 'const r=require("/tmp/gate-run-deploy.json");if(!r.executed.some(e=>e.controls.includes("DEPLOYED-DIGEST")))throw new Error("the deploy lane ran without its only control");console.log("deploy lane: DEPLOYED-DIGEST executed")'

node scripts/test-integrity-check.mjs --base main
node scripts/sast-check.mjs
node scripts/secrets-scan.mjs
node scripts/supply-chain-check.mjs
node scripts/model-provenance-check.mjs
# rc.25 — three NEGATIVE tests for the adversarial rows the pilot playbook grades
# CI-proven. That grade means "a negative bypass test in this workflow demonstrates the
# rejection"; until now these three rows had only the positive runs above, so the
# playbook was claiming a standard of evidence it did not meet for its own checklist.
# Each attack is staged, the gate is asserted to REJECT it, and the fixture is restored.
# Restores come from a snapshot taken here, NOT from $H: `P`/`H` are repo-relative (L29)
# and everything below `cd "$A"` (L90) runs from the dry-run tree, so an $H path does not
# resolve — the same trap the residency fixture comment above records. A snapshot needs no
# path resolution and cannot go stale. `git checkout --` cannot restore either: the
# dry-run tree is a copy, not a working tree.
cp docs/governance/model-manifest.json "$RUNNER_TEMP/pristine-model-manifest.json"
cp docs/governance/evidence/eval-report-delivery-loop.json "$RUNNER_TEMP/pristine-eval-report.json"
cp docs/governance/evidence/dependency-audit.json "$RUNNER_TEMP/pristine-dependency-audit.json"
#
#   ① Stale model evaluation — the eval was run against a superseded pin. This is
#      model-risk's analogue of Q1b: a passing eval for a model you are not shipping.
python3 - <<'PY'
import json
p = 'docs/governance/model-manifest.json'
d = json.load(open(p))
d['models'][0]['eval']['evaluated_model_id'] = 'example-model@2025-09'
json.dump(d, open(p, 'w'), indent=2)
PY
if node scripts/model-provenance-check.mjs; then
  echo "::error::model-provenance accepted an eval run against a DIFFERENT pin than the shipping model — the stale-eval check is gone"; exit 1; fi
cp "$RUNNER_TEMP/pristine-model-manifest.json" docs/governance/model-manifest.json
#   ② Fabricated evaluation artifact — the report was edited after its digest was cited.
#      A declared pass is not evidence; the gate re-hashes the artifact.
python3 - <<'PY'
import json
p = 'docs/governance/evidence/eval-report-delivery-loop.json'
d = json.load(open(p))
d['fabricated'] = 'says pass, but is not the artifact that was hashed'
json.dump(d, open(p, 'w'), indent=2)
PY
if node scripts/model-provenance-check.mjs; then
  echo "::error::model-provenance accepted an eval report that no longer matches its declared sha256 — a fabricated artifact passes"; exit 1; fi
cp "$RUNNER_TEMP/pristine-eval-report.json" docs/governance/evidence/eval-report-delivery-loop.json
#   ③ Vulnerable dependency — a critical CVE in the audit the release ships on.
python3 - <<'PY'
import json
p = 'docs/governance/evidence/dependency-audit.json'
d = json.load(open(p))
d['critical'] = 2
json.dump(d, open(p, 'w'), indent=2)
PY
if node scripts/supply-chain-check.mjs; then
  echo "::error::supply-chain accepted 2 critical vulnerabilities against a policy maximum of 0"; exit 1; fi
cp "$RUNNER_TEMP/pristine-dependency-audit.json" docs/governance/evidence/dependency-audit.json
# Restored — both gates must be green again, or a later step inherits a broken fixture.
node scripts/model-provenance-check.mjs
node scripts/supply-chain-check.mjs
node scripts/release-subject-check.mjs       # rc.11 WS1 — coherent immutable artifact subject
node scripts/release-attestation-check.mjs    # rc.11 WS1 — source→artifact→evals→anchor bound to one digest
node scripts/evidence-seal-check.mjs
node scripts/data-lifecycle-check.mjs
node scripts/operations-signal-check.mjs
node scripts/assurance-cycle-check.mjs
node scripts/assurance-case-check.mjs        # rc.14 WS6 — signal-triggered cases within SLA, mapped, contained, second-line decided
node scripts/decision-log-check.mjs
node scripts/adapter-check.mjs
# Provider choice (HG-0008): the harness names ROLES, the institution picks who fills them.
# rc.20 — the base profile now declares `sca` and `hardened_runtime` at high tier, and the
# change-example compiles high, so this is MANDATORY-WHEN-COMPILED exactly like the D6
# register: the requirement comes from the profile, not from a CI flag. Four properties:
#   ① a compiled plan requiring the capability with the template untouched must FAIL —
#      "we never chose" is not a pass once the plan demands a choice
#   ② a real selection is COUNTED (the empty-set bug the other examples exist to catch)
#   ③ mounted-but-unactivated is reported as selected-not-active, never as a live control
#   ④ a bad selection must FAIL — both the duplicate-role and unknown-provider directions
if node scripts/provider-selection-check.mjs; then
  echo "::error::a compiled plan requires a provider capability, yet the untouched template passed"; exit 1; fi
# The ADOPT step: choose a provider per role and mount its adapter, as an adopter would.
cp docs/governance/adapters/providers/sca/snyk.json docs/governance/adapters/
cp docs/governance/adapters/providers/hardened-runtime/chainguard.json docs/governance/adapters/
# rc.46: a THIRD role. The worked change carries personal_data, and regulated-bank's
# personal_data conditional requires `real_data_controls` — a change touching real
# customer data must say which platform controls stand between that data and whoever
# touches it. Selecting it here is exactly what the adopter does; leaving it out would
# assert that the seam is optional, which is the silence the capability exists to refuse.
cp docs/governance/adapters/providers/real-data-controls/kms-field-encryption.json docs/governance/adapters/
# 2.1.0 (hardening plan 2.2, decision K9): a FOURTH role. regulated-bank requires
# `external_record` at high tier — the record of the gates' findings must live outside
# the tree the agent edits. Kosli is the first provider, never a dependency; the seam
# (core/external-record.mjs) is exercised below against the record-and-replay fake.
cp docs/governance/adapters/providers/external-record/kosli.json docs/governance/adapters/
# 2.4.0: the auto-compiled AI route requires an explicit serving-path enforcement point.
# Selecting the gateway fixture exercises the seam; placeholder activation evidence keeps
# it honestly "selected, not active" and makes no claim about a live denial.
cp docs/governance/adapters/providers/runtime-guardrails/gateway-policy-enforcement.json docs/governance/adapters/
node -e '
  const fs=require("fs"), sel=(role,provider,adapter_id)=>({role,provider,adapter_id,
    decided_by:"infosec-noor",decided_at:new Date().toISOString().slice(0,10),source:"mt-tech-2026"});
  fs.writeFileSync("/tmp/provider-selection.json",JSON.stringify({selections:[
    sel("sca","snyk","snyk-sca"), sel("hardened-runtime","chainguard","chainguard-runtime"),
    sel("real-data-controls","kms-field-encryption","kms-field-encryption"),
    sel("external-record","kosli","kosli-external-record"),
    sel("runtime-guardrails","gateway-policy-enforcement","gateway-policy-enforcement")]},null,2));
'
cp /tmp/provider-selection.json docs/governance/provider-selection.json
node scripts/provider-selection-check.mjs | tee /tmp/ps1.txt
grep -q '5 roles selected' /tmp/ps1.txt || {
  echo "::error::the provider-selection gate is not counting the real selections"; exit 1; }
grep -q 'selected, not active' /tmp/ps1.txt || {
  echo "::error::a mounted-but-unactivated provider must be reported as selected, not active"; exit 1; }
# ④a — two providers for one role: AD-R05 re-entered at selection time.
node -e '
  const fs=require("fs"), p="docs/governance/provider-selection.json", s=JSON.parse(fs.readFileSync(p));
  s.selections.push({role:"sca",provider:"trivy",adapter_id:"trivy-sca",decided_by:"x",decided_at:"2026-07-26",source:"y"});
  fs.writeFileSync(p,JSON.stringify(s,null,2));
'
if node scripts/provider-selection-check.mjs; then
  echo "::error::two providers selected for one role passed the gate"; exit 1; fi
# ④b — a provider the catalog does not offer.
node -e '
  const fs=require("fs"), p="docs/governance/provider-selection.json";
  fs.writeFileSync(p,JSON.stringify({selections:[{role:"sca",provider:"acme-scanner",
    adapter_id:"snyk-sca",decided_by:"x",decided_at:"2026-07-26",source:"y"}]},null,2));
'
if node scripts/provider-selection-check.mjs; then
  echo "::error::a selection naming a provider outside the catalog passed the gate"; exit 1; fi
# Restore the ADOPTED selection, not the template: the compiled plan requires a choice, so
# every later gate run in this job must see a repo that has made one.
cp /tmp/provider-selection.json docs/governance/provider-selection.json
node scripts/provider-selection-check.mjs
# ── 2.1.0 · the external record (K9) — the anchor must be held OUTSIDE the tree ─────
# With a provider mounted, the seal gate requires manifest.external_record and resolves
# it at the provider. Five properties, against the fake (decision K8, no org in CI):
#   ① mounted + no record id           → the seal gate FAILS (the anchor is only in the tree)
#   ② seal-evidence --record-only      → posts the signed seal-anchor envelope, writes the id
#   ③ the id resolves                  → the seal gate is OK again; release-attestation untouched
#   ④ a fabricated id                  → FAILS, for being unknown to the provider
#   ⑤ an unsigned envelope             → REFUSED (exit 3), nothing posted, manifest untouched
# The fake stays mounted for the rest of the job (KOSLI_BIN via GITHUB_ENV) so every later
# seal-gate run resolves the recorded anchor; the signing key is fresh, never written to
# the tree, and deleted at the end of this block.
FK="$RUNNER_TEMP/kosli-fake"
node --input-type=module -e '
  const { createFakeKosli, respond } = await import("./core/kosli-fake.mjs");
  const f = createFakeKosli(process.argv[1]);
  respond(f.dir, ["get","trail"], { stdout: { name: "CHG-2026-0042", compliance_status: { attestations_statuses: [
    { attestation_name: "seal-anchor", attestation_type: "generic", attestation_id: "att-anchor-1", status: "COMPLETE", is_compliant: true, unexpected: false } ] } } });
  respond(f.dir, ["get","attestation","--attestation-id","att-anchor-1"], { stdout: { attestation_name: "seal-anchor", attestation_type: "generic", is_compliant: true, created_at: 1, html_url: "https://app.kosli.com/fake" } });
  respond(f.dir, ["get","attestation","--attestation-id","forged"], { exit: 1, stderr: "Error: attestation not found" });
' "$FK"
export KOSLI_BIN="$FK/kosli"
echo "KOSLI_BIN=$FK/kosli" >> "$GITHUB_ENV"
node -e '
  const { generateKeyPairSync } = require("node:crypto"), fs = require("node:fs");
  const k = generateKeyPairSync("ed25519");
  fs.writeFileSync(process.argv[1], k.privateKey.export({ type: "pkcs8", format: "pem" }));
  const p = "docs/governance/attestation-issuers.json", r = JSON.parse(fs.readFileSync(p));
  r.issuers.push({ id: "ci-record-signer", mechanism: "ed25519", description: "per-run record signer (CI dry-run)", verify: { public_key: k.publicKey.export({ type: "spki", format: "pem" }) } });
  fs.writeFileSync(p, JSON.stringify(r, null, 2));
' "$RUNNER_TEMP/record-key.pem"
export LOOM_RUNNER_REPOSITORY="$GITHUB_REPOSITORY" LOOM_RUNNER_REF="$GITHUB_REF"
export LOOM_RUNNER_SHA=$(node -e 'console.log(require("./docs/governance/evidence/manifest.json").release_commit)')
if node scripts/evidence-seal-check.mjs 2>/tmp/xr1.txt; then
  echo "::error::a mounted external-record provider with NO record id on the manifest passed the seal gate"; exit 1; fi
grep -q 'carries no external_record id' /tmp/xr1.txt || { echo "::error::the seal gate failed, but not for the missing record id"; cat /tmp/xr1.txt; exit 1; }
node scripts/seal-evidence.mjs --record-only --actor agent-loom-delivery --record-issuer ci-record-signer --record-key "$RUNNER_TEMP/record-key.pem" | tee /tmp/xr2.txt
grep -q 'anchor recorded as att-anchor-1' /tmp/xr2.txt || { echo "::error::seal-evidence --record-only did not record the anchor"; exit 1; }
node scripts/evidence-seal-check.mjs
node scripts/release-attestation-check.mjs
sed -i 's/att-anchor-1/forged/' docs/governance/evidence/manifest.json
if node scripts/evidence-seal-check.mjs 2>/tmp/xr3.txt; then
  echo "::error::the seal gate accepted a record id the provider does not hold — a recomputed chain with a fabricated id is back"; exit 1; fi
grep -q 'does NOT hold anchor id forged' /tmp/xr3.txt || { echo "::error::the fabricated id was refused, but not for being unknown"; cat /tmp/xr3.txt; exit 1; }
sed -i 's/forged/att-anchor-1/' docs/governance/evidence/manifest.json
BEFORE=$(sha256sum docs/governance/evidence/manifest.json)
if node scripts/seal-evidence.mjs --record-only --actor agent-loom-delivery 2>/tmp/xr4.txt; then
  echo "::error::an UNSIGNED seal-anchor envelope was accepted for posting"; exit 1; fi
grep -q 'unsigned' /tmp/xr4.txt || { echo "::error::the unsigned envelope was refused, but not for being unsigned"; cat /tmp/xr4.txt; exit 1; }
[ "$BEFORE" = "$(sha256sum docs/governance/evidence/manifest.json)" ] || { echo "::error::a refused record still rewrote the manifest"; exit 1; }
node scripts/provenance-check.mjs
rm -f "$RUNNER_TEMP/record-key.pem"
# Commit ONLY what this block produced. `git add -A` here would sweep up the untracked
# example files earlier steps leave beside the tree (residency-review.md among them), and
# the legibility gate reads the git tree — a stray "D0.2" in an example nobody committed
# would then fail the benchmark lane for a file this block never touched.
git add docs/governance/evidence/manifest.json docs/governance/attestation-issuers.json
git commit -qm "record the seal anchor in the external record (2.1.0, K9)"
node scripts/brainkit-check.mjs   # rc.8: no-op here (no change compiles brainkit-conformance) — proves it composes without breaking the generic path
node scripts/brainkit-registry-check.mjs     # rc.15 WS7 — estate registry consistent; no repo runs a revoked release
node scripts/comprehension-check.mjs         # rc.15 WS8 — the high-tier change carries a human understanding record
node scripts/guardrail-policy-check.mjs      # rc.13 WS4 — guardrail coverage is explicit + honest; every claimed mechanism exists; no implied protection
node scripts/platform-activation-check.mjs   # rc.12 WS2 — observation is signed, independent, bypass-tested, fresh; no overstated platform-enforced claim (record generated + committed above)
node scripts/config-reconciliation-check.mjs  # rc.12 WS2.4 — observed config matches the approved baseline; no identity drift
# rc.13 WS3 (closes F5): the data-risk register is MANDATORY-WHEN-COMPILED. The high-tier
# change-example compiles the data_risk_register capability, so D6 requires the register
# with NO --require-register flag — a CI-config change can no longer weaken a regulated
# build. Prove the derivation is live in the adopted layout.
node -e 'import("./discovery/gates/validate.mjs").then(m=>{if(!m.registerMandatory(".",{flag:false})){console.error("::error::F5 regression — the compiled plan requires the data-risk register but registerMandatory returned false");process.exit(1)}console.log("F5: data-risk register is mandatory-when-compiled (no flag needed)")})'
# rc.7: product evals (commit-bound); the example's evaluated_commit is stamped to HEAD
# as a real adopter's CI would, then verified against the shipping commit.
HEAD_SHA=$(git rev-parse HEAD)
node -e 'const fs=require("fs");const p="docs/governance/product-evals.json";const s=JSON.parse(fs.readFileSync(p));for(const pr of s.products)pr.eval.evaluated_commit=process.argv[1];fs.writeFileSync(p,JSON.stringify(s,null,2))' "$HEAD_SHA"
node scripts/product-eval-check.mjs --commit "$HEAD_SHA"
# rc.7: the two routine check contexts — an ordinary PR passes normal-lane, fails --assert-routine.
node scripts/routine-change-check.mjs --base main         # normal-human-review: ordinary PR passes
if node scripts/routine-change-check.mjs --assert-routine --base main; then
  echo "::error::routine-qualified passed an ordinary PR — the queue split is broken"; exit 1
fi
# The gate runner: a README-only diff must run the always-on core and RECORD the
# rest as skipped — risk-proportionate execution with no silent skips.
node core/gate-runner.mjs --lane pr --base main --out /tmp/gate-run.json
node -e 'const r=require("/tmp/gate-run.json");if(!r.skipped.length||r.skipped.some(s=>!s.reason))throw new Error("runner must record every skip with a reason");console.log(`gate-runner: ${r.executed.length} run, ${r.skipped.length} skipped — all recorded`)'

# ── rc.40 · flow-plan Phase 6: the pool, the waves, and the cache, on a REAL lane ───
# The unit tests run the pool over synthetic gates. This runs it over the adopted
# repository's actual pr lane — the only place the wave structure and the cache meet
# the real catalog. Everything asserted here is a PROPERTY, never a duration: a gate
# runner that got slower is not a build failure, and never becomes one.
rm -rf .loom/gate-cache
node core/gate-runner.mjs --lane pr --out /tmp/cold.json | tee /tmp/cold.txt
node -e '
  const r=require("/tmp/cold.json");
  if(!r.concurrency||!(r.concurrency.jobs>=1)||!(r.concurrency.waves>=1)) throw new Error("the run record does not describe how it was executed");
  if(r.concurrency.timeout_ms!==300000) throw new Error("the default per-gate timeout is not recorded");
  if(r.executed.some(e=>typeof e.wave!=="number")) throw new Error("an execution has no wave number");
  // The two shipped depends_on edges must produce a real ordering, not a single flat wave.
  const drift=r.executed.find(e=>e.controls.includes("FLOOR-DRIFT")), freeze=r.executed.find(e=>e.controls.includes("FREEZE-STAMP"));
  if(!drift||!freeze) throw new Error("the drift/freeze pair did not run — the depends_on edge is untested here");
  if(!(drift.wave>freeze.wave)) throw new Error(`FLOOR-DRIFT (wave ${drift.wave}) did not wait for FREEZE-STAMP (wave ${freeze.wave})`);
  if(r.cache.stored<1) throw new Error("nothing was cacheable on a full-tier pr lane — the cache is being exercised against nothing");
  if(!r.cache.not_cacheable.length||r.cache.not_cacheable.some(x=>!x.reason)) throw new Error("a mechanism was excluded from the cache without a recorded reason");
  if(!r.cache.not_cacheable.some(x=>/always:true/.test(x.reason))) throw new Error("the always-on tamper core is not being excluded from the cache");
  console.log(`gate-runner: ${r.concurrency.waves} wave(s), ${r.concurrency.jobs} job(s), ${r.cache.stored} result(s) cached, ${r.cache.not_cacheable.length} never cacheable`);
'
# The warm run: hits are recorded as pass-cached WITH the key, and the log still says
# what the cold run said — a cached run is not a quieter run.
node core/gate-runner.mjs --lane pr --out /tmp/warm.json | tee /tmp/warm.txt
node -e '
  const c=require("/tmp/cold.json"), w=require("/tmp/warm.json");
  const hits=w.executed.filter(e=>e.status==="pass-cached");
  if(!hits.length) throw new Error("a second run with no input change served nothing from cache");
  if(hits.some(e=>!/^[0-9a-f]{64}$/.test(e.cache_key||""))) throw new Error("a pass-cached execution carries no key — a hit must be as auditable as a skip");
  if(hits.some(e=>c.cache.not_cacheable.find(x=>x.mechanism===e.mechanism))) throw new Error("a mechanism declared never-cacheable was served from cache");
  if(w.result!=="pass"||c.result!=="pass") throw new Error("the benchmark lane is not green — the cache is being measured against a red run");
  if(c.executed.map(e=>e.mechanism).join()!==w.executed.map(e=>e.mechanism).join()) throw new Error("the cached run reports a different set of mechanisms, in a different order");
  console.log(`gate-runner: ${hits.length} pass-cached, each with its key`);
'
# NEGATIVE ① a failing gate is never cached — the failure must be re-discovered, not
#            remembered as absent. Break a scoped gate's input and run twice.
cp docs/governance/data-lifecycle.json /tmp/dl.json
node -e 'const fs=require("fs"),p="docs/governance/data-lifecycle.json",s=JSON.parse(fs.readFileSync(p));s.categories[0].retention={period:"soon"};fs.writeFileSync(p,JSON.stringify(s,null,2))'
if node core/gate-runner.mjs --lane pr --out /tmp/red1.json > /dev/null 2>&1; then
  echo "::error::a broken data-lifecycle input did not fail the pr lane"; exit 1; fi
if node core/gate-runner.mjs --lane pr --out /tmp/red2.json > /dev/null 2>&1; then
  echo "::error::a FAILING gate was served from cache on the second run — there is no such thing as a cached red"; exit 1; fi
node -e '
  const r=require("/tmp/red2.json"), e=r.executed.find(x=>x.mechanism==="scripts/data-lifecycle-check.mjs");
  if(!e||e.status!=="fail") throw new Error("the broken gate did not re-run as a failure on the second pass");
'
cp /tmp/dl.json docs/governance/data-lifecycle.json
# NEGATIVE ② --no-cache means no cache, and the record says which it was.
node core/gate-runner.mjs --lane pr --no-cache --out /tmp/nocache.json | tee /tmp/nc.txt
grep -q 'cache OFF' /tmp/nc.txt || { echo "::error::--no-cache did not report the cache as off"; exit 1; }
node -e 'const r=require("/tmp/nocache.json");if(r.cache.enabled!==false||r.cache.hits!==0||r.executed.some(e=>e.status==="pass-cached"))throw new Error("--no-cache still served a cached result")'
# NEGATIVE ③ a hung gate is KILLED and recorded as a timeout — a timeout is a failure.
#            Run the lane with an impossible bound; every gate must be recorded, none passed.
if node core/gate-runner.mjs --lane pr --no-cache --timeout-ms 1 --out /tmp/to.json > /dev/null 2>&1; then
  echo "::error::a 1ms per-gate timeout produced a PASSING run — a timeout is not a pass"; exit 1; fi
node -e '
  const r=require("/tmp/to.json");
  if(!r.executed.some(e=>e.status==="timeout")) throw new Error("no execution was recorded as a timeout");
  if(r.executed.some(e=>e.status==="pass-cached")) throw new Error("a timeout run served a cached pass");
  if(r.result!=="fail") throw new Error("a run containing a timeout was reported as passing");
  console.log(`gate-runner: ${r.executed.filter(e=>e.status==="timeout").length} timeout(s), recorded as failures`);
'
rm -rf .loom/gate-cache

# ── rc.37 · flow-plan Phase 3: the flow instruments measure something REAL ──────────
# The failure mode for a report is not a wrong answer, it is a confident answer about an
# empty set — the same vacuum freeze-stamp, drift and approval-surface each had. So the
# figures are asserted, not just the exit codes. The gate-run record written above is
# copied in so the wall-clock section has a lane to read.
cp /tmp/gate-run.json gate-run-pr.json
node scripts/flow-report.mjs --check
node scripts/flow-report.mjs | tee /tmp/flow.txt
grep -q '1 completed' /tmp/flow.txt || {
  echo "::error::flow-report computed no lead time from a change that reached in-production"; exit 1; }
grep -q 'permission-to-launch' /tmp/flow.txt || {
  echo "::error::flow-report printed no stage-residency histogram"; exit 1; }
grep -q 'GATE WALL-CLOCK' /tmp/flow.txt && grep -q 'pr  *1 run' /tmp/flow.txt || {
  echo "::error::flow-report did not read the runner's own per-lane wall-clock"; exit 1; }
rm -f gate-run-pr.json
# The approval queue names WHO the change is waiting on. PA2 compiles twelve roles here;
# asserting a count rather than a name keeps this honest if the profiles move.
node scripts/approval-status.mjs --check
node scripts/approval-status.mjs | tee /tmp/queue.txt
grep -qE '1[0-9] outstanding approval' /tmp/queue.txt || {
  echo "::error::the approval queue reports nothing outstanding on a change with a pending PA2"; exit 1; }
grep -q 'risk-second-line' /tmp/queue.txt || {
  echo "::error::the approval queue does not name the roles a change is waiting on"; exit 1; }
node scripts/comprehension-report.mjs --check
node scripts/comprehension-report.mjs | tee /tmp/comp.txt
grep -q '95min' /tmp/comp.txt || {
  echo "::error::the comprehension trend is not reading the metrics comprehension-check collects"; exit 1; }
# ── The exception register, both directions ───────────────────────────────────────
# The expiry dates are COMPUTED per run, never committed: a fixture with a fixed date is
# a build that goes red on a calendar, which is how a check like this gets deleted.
node scripts/exception-register-check.mjs   # nothing excepted yet — and it says so
cp docs/governance/changes/CHG-2026-0042/change-envelope.json "$RUNNER_TEMP/pristine-envelope.json"
# Arguments travel by ENV, not argv: `node -e … -2` makes node try to parse -2 as a flag.
except() { DAYS=$1 N=$2 CONTROL=$3 node -e '
  const fs = require("fs"), p = "docs/governance/changes/CHG-2026-0042/change-envelope.json";
  const days = Number(process.env.DAYS), n = Number(process.env.N), control = process.env.CONTROL;
  const s = JSON.parse(fs.readFileSync(p));
  const expires = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  s.exemptions = Array.from({ length: n }, () => ({ control, owner: "eng-omar",
    rationale: "The pre-launch penetration test slot is booked for the next window.",
    compensating_control: "Q2-SAST plus an external scan of the exposed surface",
    expires, approved_by: "risk-lena" }));
  fs.writeFileSync(p, JSON.stringify(s, null, 2));'; }
#   ① well inside its window: counted, no warning, green — the non-vacuous positive.
except 120 1 DAST-PENTEST
node scripts/exception-register-check.mjs | tee /tmp/exc.txt
grep -q '1 exception(s) projected (1 open)' /tmp/exc.txt || {
  echo "::error::the exception register is not projecting a real open exception"; exit 1; }
if grep -q 'WARNING' /tmp/exc.txt; then
  echo "::error::an exception 120 days from expiry warned — the bands are firing on everything"; exit 1; fi
#   ② inside the 30-day band: WARNS and still PASSES. This is the whole point — the
#      deadline does not move, the surprise does.
except 20 1 DAST-PENTEST
node scripts/exception-register-check.mjs > /tmp/exc20.txt || {
  echo "::error::an expiry WARNING failed the build — warning bands must never gate"; cat /tmp/exc20.txt; exit 1; }
cat /tmp/exc20.txt
grep -q '30-day band' /tmp/exc20.txt || {
  echo "::error::an exception 20 days from expiry did not warn — the overnight surprise is back"; exit 1; }
#   ③ expired: blocked, exactly as before the bands existed.
except -2 1 DAST-PENTEST
if node scripts/exception-register-check.mjs 2>/tmp/exc-x.txt; then
  echo "::error::the exception register passed an EXPIRED exception"; exit 1; fi
grep -q 'EXPIRED' /tmp/exc-x.txt || {
  echo "::error::the expired exception was refused, but not for being expired"; cat /tmp/exc-x.txt; exit 1; }
#   ④ concentration: four open against ONE control fails; the same four spread across
#      four controls do not. A limit that fires on any four exceptions is not a limit.
except 120 4 DAST-PENTEST
if node scripts/exception-register-check.mjs 2>/tmp/exc-c.txt; then
  echo "::error::four open exceptions against one control passed the concentration limit"; exit 1; fi
grep -q 'CONCENTRATION: 4 open exceptions' /tmp/exc-c.txt || {
  echo "::error::the pile-up was refused, but not for being a concentration"; cat /tmp/exc-c.txt; exit 1; }
node -e '
  const fs = require("fs"), p = "docs/governance/changes/CHG-2026-0042/change-envelope.json";
  const s = JSON.parse(fs.readFileSync(p));
  s.exemptions = s.exemptions.map((e, i) => ({ ...e, control: `SPREAD-${i}` }));
  fs.writeFileSync(p, JSON.stringify(s, null, 2));'
node scripts/exception-register-check.mjs > /dev/null || {
  echo "::error::four exceptions against four DIFFERENT controls tripped the concentration limit"; exit 1; }
#   ⑤ the limit may be tightened and never loosened — the monotonicity rule, on this knob.
node -e 'require("fs").writeFileSync("docs/governance/exception-policy.json", JSON.stringify({ concentration_limit: 10 }, null, 2))'
if node scripts/exception-register-check.mjs 2>/tmp/exc-p.txt; then
  echo "::error::a policy raising the concentration limit above the shipped floor was obeyed"; exit 1; fi
grep -q 'may TIGHTEN and never loosen' /tmp/exc-p.txt || {
  echo "::error::the loosening policy was refused, but not for loosening"; cat /tmp/exc-p.txt; exit 1; }
git checkout -- docs/governance/exception-policy.json
cp "$RUNNER_TEMP/pristine-envelope.json" docs/governance/changes/CHG-2026-0042/change-envelope.json
node scripts/exception-register-check.mjs > /dev/null   # green again after the restores
