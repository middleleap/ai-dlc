// Research support only: build a synthetic kit or summarize explicitly recorded observations.
import {readFileSync,writeFileSync,mkdirSync,existsSync,realpathSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {loadSources,render} from '../plugins/middleleap-loom/skills/loom-adopt/harness/intake/build-questionnaire.mjs';
import {exportRecord,validateRecord} from '../plugins/middleleap-loom/skills/loom-adopt/harness/intake/record.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const protocolBytes=readFileSync(join(ROOT,'docs/pilots/loom-onboarding/tasks.json'));
export const protocol=JSON.parse(protocolBytes);
const digest=b=>'sha256:'+createHash('sha256').update(b).digest('hex');
export const protocolDigest=digest(protocolBytes);
const median=values=>{if(!values.length)return null;const a=[...values].sort((a,b)=>a-b),i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2;};
export function buildKit(destination){
 const dir=resolve(destination);if(existsSync(dir))throw new Error('Choose a new directory; existing pilot work is never overwritten.');
 const {bank,questions_digest}=loadSources();
 const institution='SYNTHETIC PILOT — Meridian Trust';
 const make=(entries,name=institution)=>exportRecord({institution:name,pack:'',answers:Object.fromEntries(entries.map(([id,answer,reference])=>[id,{answer,reference,role:bank.blocks.find(b=>b.id===bank.questions.find(q=>q.id===id).block).role}]))},bank,questions_digest);
 const fixtures={
  'brand.json':make([['A1','SYNTHETIC: Brand Guide v1','SYNTHETIC source: Brand Guide v1']]),
  'architecture.json':make([['C1','SYNTHETIC: API-first architecture','SYNTHETIC source: Architecture v1']]),
  'brand-conflict.json':make([['A1','SYNTHETIC: Brand Guide v2','SYNTHETIC source: Brand Guide v2']]),
  'blank.json':make([]),
  'other-institution.json':make([['A1','SYNTHETIC: Other brand','SYNTHETIC source']], 'SYNTHETIC PILOT — Other Institution')
 };
 for(const record of Object.values(fixtures)){const r=validateRecord(record,bank,questions_digest);if(r.findings.length)throw new Error(r.findings.join('\n'));}
 mkdirSync(join(dir,'fixtures'),{recursive:true});
 const page=render()+'\n';
 const files={'COORDINATOR.md':readFileSync(join(ROOT,'docs/pilots/loom-onboarding/coordinator.md'),'utf8'),'README.md':readFileSync(join(ROOT,'docs/pilots/loom-onboarding/README.md'),'utf8').replace('(coordinator.md)','(COORDINATOR.md)'),'questionnaire.html':page,'tasks.json':JSON.stringify(protocol,null,2),'observations.json':JSON.stringify({schema:'loom.pilot-observations/v1',mode:'observed',protocol_digest:protocolDigest,candidate_questionnaire_digest:digest(page),round:'round-1',sessions:[]},null,2),'.gitignore':'observations.json\nevidence/\nresults*.json\n'};
 for(const [name,record] of Object.entries(fixtures))files['fixtures/'+name]=JSON.stringify(record,null,2);
 files['fixtures/malformed.json']='{ deliberate malformed synthetic import';
 files['fixtures/wrong-bank.json']=JSON.stringify({...fixtures['brand.json'],questions_digest:'sha256:'+'0'.repeat(64)},null,2);
 for(const [name,bytes] of Object.entries(files))writeFileSync(join(dir,name),bytes);
 const manifest={schema:'loom.pilot-kit/v1',authority:'none',protocol_digest:protocolDigest,institution,questions_digest,questionnaire_digest:digest(page),files:Object.fromEntries(Object.keys(files).map(name=>[name,digest(readFileSync(join(dir,name)))])),scope:'Synthetic inputs and empty observations only. No browser or participant acceptance established.'};
 writeFileSync(join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');return {directory:dir,...manifest};
}
export function summarizePilot(data){
 if(data?.schema!=='loom.pilot-observations/v1'||data.protocol_digest!==protocolDigest||!['observed','synthetic'].includes(data.mode)||typeof data.round!=='string'||!data.round.trim()||!/^sha256:[a-f0-9]{64}$/.test(data.candidate_questionnaire_digest||'')||!Array.isArray(data.sessions))throw new Error('Invalid pilot header; name the round, matching protocol digest, candidate digest, mode and sessions.');
 const seen=new Set(),rows=[],gaps=[];
 for(const s of data.sessions){
  if(typeof s.participant_id!=='string'||!/^P[0-9]+$/.test(s.participant_id)||!protocol.roles.includes(s.role)||!['first','second'].includes(s.cohort)||typeof s.unfamiliar!=='boolean'||!Array.isArray(s.attempts))throw new Error('Invalid participant session; use pseudonymous P<number> identifiers.');
  const key=s.participant_id+':'+s.cohort;if(seen.has(key))throw new Error('Duplicate participant/cohort session.');seen.add(key);
  const required=protocol.tasks.filter(t=>t.roles.includes(s.role)&&t.cohorts.includes(s.cohort));const attempted=new Set();
  for(const a of s.attempts){
   if(!required.some(t=>t.id===a.task_id)||attempted.has(a.task_id))throw new Error('Unknown, inapplicable or repeated task.');attempted.add(a.task_id);
   if(!['completed','failed','abandoned','not-run'].includes(a.outcome))throw new Error('Invalid task outcome.');
   if(a.outcome==='not-run'){gaps.push(`${key}/${a.task_id}: not run`);continue;}
   for(const n of ['elapsed_seconds','download_seconds','waiting_seconds','review_seconds','assistance_count','repeated_fields','lost_answers'])if(!Number.isInteger(a[n])||a[n]<0)throw new Error(`Invalid ${n}.`);
   if(a.download_seconds+a.waiting_seconds>a.elapsed_seconds||a.review_seconds>a.elapsed_seconds||typeof a.readiness_correct!=='boolean'||typeof a.false_ready!=='boolean'||typeof a.evidence_ref!=='string'||!a.evidence_ref.trim())throw new Error('Invalid timing, readiness or observation evidence.');
   rows.push({...a,role:s.role,cohort:s.cohort,participant_id:s.participant_id,unfamiliar:s.unfamiliar});
  }
  for(const t of required)if(!attempted.has(t.id))gaps.push(`${key}/${t.id}: no observation`);
 }
 const observed=data.mode==='observed'?rows:[];
 const eligible=observed.filter(r=>r.unfamiliar);
 const completion=eligible.length?100*eligible.filter(r=>r.outcome==='completed'&&r.assistance_count===0).length/eligible.length:null;
 const artifact=eligible.filter(r=>r.task_id==='first-artifact'&&r.outcome==='completed');
 const artifactMedian=median(artifact.map(r=>r.elapsed_seconds-r.download_seconds));
 const coverage=protocol.roles.flatMap(role=>['first','second'].filter(cohort=>protocol.tasks.some(t=>t.roles.includes(role)&&t.cohorts.includes(cohort))).filter(cohort=>!data.sessions.some(s=>s.role===role&&s.cohort===cohort&&s.unfamiliar)).map(cohort=>`${role}/${cohort}`));
 const paired=[];
 for(const first of eligible.filter(r=>r.task_id==='team-setup'&&r.cohort==='first'&&r.outcome==='completed')){
  const second=eligible.find(r=>r.participant_id===first.participant_id&&r.role===first.role&&r.task_id==='team-setup'&&r.cohort==='second'&&r.outcome==='completed');
  if(second)paired.push(first.repeated_fields-second.repeated_fields);
 }
 const blockers=[];
 if(!observed.length)blockers.push('No observed participant attempts.');
 if(coverage.length)blockers.push('Required unfamiliar role/cohort coverage is missing.');
 if(gaps.length)blockers.push('Required task observations are incomplete.');
 if(observed.some(r=>r.lost_answers>0||r.false_ready))blockers.push('Answer loss or a false-ready interpretation was observed.');
 if(observed.some(r=>r.task_id==='readiness'&&!r.readiness_correct))blockers.push('Readiness meaning was not understood.');
 if(completion===null||completion<protocol.targets.unassisted_completion_percent)blockers.push('Unassisted completion target not demonstrated.');
 if(artifactMedian===null||artifact.some(r=>r.elapsed_seconds-r.download_seconds>protocol.targets.first_artifact_seconds_excluding_downloads)||eligible.some(r=>r.task_id==='first-artifact'&&r.outcome!=='completed'))blockers.push('First-artifact time target not demonstrated.');
 return {schema:'loom.pilot-summary/v1',authority:'none',protocol_digest:protocolDigest,round:data.round,candidate_questionnaire_digest:data.candidate_questionnaire_digest,mode:data.mode,status:blockers.length?'needs-evidence-or-iteration':'ready-for-human-review',observed_attempts:observed.length,unfamiliar_attempts:eligible.length,unassisted_completion_percent:completion,first_artifact_median_seconds_excluding_downloads:artifactMedian,median_waiting_seconds:median(eligible.map(r=>r.waiting_seconds)),median_review_seconds:median(eligible.map(r=>r.review_seconds)),paired_team_setup_repeated_field_reductions:paired,missing_role_cohorts:coverage,incomplete_tasks:gaps,blockers,scope:'Descriptive participant observations only; evidence references are not authenticated. Small-sample/learning effects apply. This does not approve release or establish statistical confidence.'};
}
export function main(args){
 if(args.length!==2||!['build','report'].includes(args[0]))throw new Error('usage: node scripts/onboarding-pilot.mjs <build directory|report observations.json>');
 return args[0]==='build'?buildKit(args[1]):summarizePilot(JSON.parse(readFileSync(args[1],'utf8')));
}
if(process.argv[1]&&existsSync(process.argv[1])&&import.meta.url===pathToFileURL(realpathSync(process.argv[1])).href){try{const r=main(process.argv.slice(2));console.log(JSON.stringify(r,null,2));if(r.status==='needs-evidence-or-iteration')process.exitCode=1;}catch(e){console.error(e.message);process.exitCode=2;}}
