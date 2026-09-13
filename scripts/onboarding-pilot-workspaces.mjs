// Disposable synthetic repositories for the coordinator; never configures a live institution.
import {cpSync,existsSync,mkdirSync,readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {reuseBrainkit} from '../plugins/middleleap-loom/skills/loom-adopt/harness/scripts/brainkit-reuse.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const harness=join(root,'plugins/middleleap-loom/skills/loom-adopt/harness');
const put=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');};
const hash=path=>'sha256:'+createHash('sha256').update(readFileSync(path)).digest('hex');
function git(cwd,...args){const r=spawnSync('git',['-c','user.name=Synthetic pilot','-c','user.email=pilot@example.invalid',...args],{cwd,encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.error?.message||'Git failed');return r.stdout.trim();}
export function buildWorkspaces(destination){
 const dest=resolve(destination);if(existsSync(dest))throw new Error('Choose a new directory; existing pilot work is never overwritten.');
 const sourceCommit=git(root,'rev-parse','HEAD');
 if(git(root,'status','--porcelain','--',harness))throw new Error('Commit the candidate harness before packaging pilot workspaces.');
 mkdirSync(dest,{recursive:true});cpSync(join(root,'plugins/middleleap-loom'),join(dest,'candidate'),{recursive:true});
 const publisher=join(dest,'publisher');cpSync(join(harness,'brainkit-example'),publisher,{recursive:true});
 const identities=JSON.parse(readFileSync(join(publisher,'docs/governance/identities.json')));
 identities.identities=identities.identities.filter(i=>i.kind==='human');
 put(join(publisher,'docs/governance/identities.json'),identities);
 const manifest=JSON.parse(readFileSync(join(publisher,'institution/brainkit/manifest.json')));
 put(join(publisher,'brainkit-registry.json'),{releases:[{brainkit_id:manifest.brainkit_id,version:manifest.version,package_digest:manifest.package_digest,status:'active',released_at:'2026-07-01'}],adoption_inventory:[]});
 const teams=[];
 for(const name of ['team-one','team-two']){
  const team=join(dest,name);mkdirSync(team);put(join(team,'README.md'),'# '+name+' — SYNTHETIC PILOT\n\nDisposable exercise only. No remote, institutional approval or activation.\n');
  put(join(team,'.github/workflows/ci.yml'),'name: Synthetic team CI\non: [push]\njobs:\n  team-check:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo "Synthetic team workflow"\n');
  put(join(team,'.loom/project.json'),{schema:'loom.project/v1',spec_paths:['contracts/api.yaml'],feature_pattern:'^PILOT-[0-9]+$',verification_commands:[['node','-e','process.exit(0)']]});
  put(join(team,'contracts/api.yaml'),'openapi: 3.0.3\ninfo:\n  title: Synthetic pilot API\n  version: 0.0.0\npaths: {}\n');
  put(join(team,'docs/governance/identities.json'),identities);
  git(team,'init','-q','-b','main');git(team,'add','.');git(team,'commit','-qm','Synthetic pilot baseline');
  const check=reuseBrainkit({from:publisher,dest:team,profile:'meridian-trust',digest:manifest.package_digest});
  if(!check.ok)throw new Error('Synthetic reuse preflight failed: '+check.findings.join('; '));
  teams.push({directory:name,baseline_commit:git(team,'rev-parse','HEAD'),preserved_files:Object.fromEntries(['.github/workflows/ci.yml','.loom/project.json'].map(p=>[p,hash(join(team,p))]))});
 }
 const result={schema:'loom.pilot-workspaces/v1',authority:'none',candidate_commit:sourceCommit,profile:'meridian-trust',release_digest:manifest.package_digest,teams,scope:'Fictional approvals and identities from the bundled example. No live remotes, credentials, approval or activation.'};
 put(join(dest,'workspaces.json'),result);cpSync(join(root,'docs/pilots/loom-onboarding/coordinator.md'),join(dest,'COORDINATOR.md'));
 return result;
}
if(process.argv[1]&&existsSync(process.argv[1])&&import.meta.url===pathToFileURL(realpathSync(process.argv[1])).href){try{if(process.argv.length!==3)throw new Error('usage: node scripts/onboarding-pilot-workspaces.mjs <new-directory>');console.log(JSON.stringify(buildWorkspaces(process.argv[2]),null,2));}catch(e){console.error(e.message);process.exitCode=2;}}
