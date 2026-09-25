import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,cpSync,rmSync,mkdirSync,readFileSync,writeFileSync,existsSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {reuseBrainkit} from './brainkit-reuse.mjs';
import {configurationTasks} from './configuration-tasks.mjs';
const EXAMPLE=fileURLToPath(new URL('../brainkit-example',import.meta.url));
const installer=new URL('../adopt.mjs',import.meta.url);
function fixture(t){
 const root=mkdtempSync(join(tmpdir(),'loom-reuse-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const from=join(root,'publisher'),dest=join(root,'consumer');cpSync(EXAMPLE,from,{recursive:true});mkdirSync(join(dest,'docs/governance'),{recursive:true});
 // Only human context identities are needed for this snapshot fixture; its legacy demo agent is not a configured runtime.
 const identityPath=join(from,'docs/governance/identities.json'),identities=JSON.parse(readFileSync(identityPath));identities.identities=identities.identities.filter(i=>i.kind==='human');writeFileSync(identityPath,JSON.stringify(identities));
 cpSync(identityPath,join(dest,'docs/governance/identities.json'));
 // The shipped estate fixture illustrates other releases; register this fixture's actual release.
 const manifest=JSON.parse(readFileSync(join(from,'institution/brainkit/manifest.json')));
 writeFileSync(join(from,'brainkit-registry.json'),JSON.stringify({releases:[{brainkit_id:manifest.brainkit_id,version:manifest.version,package_digest:manifest.package_digest,status:'active',released_at:'2026-07-01'}],adoption_inventory:[]}));
 return {from,dest,profile:'meridian-trust',digest:manifest.package_digest,now:Date.parse('2026-09-13')};
}
const withExample={skip:!existsSync(EXAMPLE)};
test('preview does not write; two teams mount identical pinned snapshots idempotently',withExample,t=>{
 const o=fixture(t),preview=reuseBrainkit(o);assert.deepEqual(preview.findings,[]);assert.ok(preview.files.length>6);assert.equal(existsSync(join(o.dest,'institution')),false);
 const first=reuseBrainkit({...o,apply:true});assert.equal(first.ok,true,first.findings.join('\n'));assert.equal(first.copied.length,preview.files.length);
 const again=reuseBrainkit({...o,apply:true});assert.equal(again.copied.length,0);assert.ok(again.files.every(f=>f.status==='current'));
 const second=join(o.dest,'../second-team');mkdirSync(join(second,'docs/governance'),{recursive:true});cpSync(join(o.dest,'docs/governance/identities.json'),join(second,'docs/governance/identities.json'));
 assert.equal(reuseBrainkit({...o,dest:second,apply:true}).ok,true);
 for(const f of preview.files)assert.ok(readFileSync(join(o.dest,f.path)).equals(readFileSync(join(second,f.path))));
});
test('edited consumer files block the whole copy and remain untouched',withExample,t=>{
 const o=fixture(t);mkdirSync(join(o.dest,'institution/brainkit'),{recursive:true});const path=join(o.dest,'institution/brainkit/architecture.md');writeFileSync(path,'local choice');
 const r=reuseBrainkit({...o,apply:true});assert.equal(r.ok,false);assert.deepEqual(r.copied,[]);assert.equal(readFileSync(path,'utf8'),'local choice');assert.equal(existsSync(join(o.dest,'institution/brainkit/manifest.json')),false);
});
test('two synthetic releases support explicit upgrade and git rollback; revoked rollback targets fail',withExample,async t=>{
 const o=fixture(t),next=join(o.from,'../publisher-v2');cpSync(o.from,next,{recursive:true});
 const mp=join(next,'institution/brainkit/manifest.json'),m=JSON.parse(readFileSync(mp));
 const prior=m.version;m.version='1.1.0';m.approvals=m.approvals.map(a=>({...a,version:m.version,note:'Fictional approval fixture for rollback regression; no real approval.'}));
 writeFileSync(mp,JSON.stringify(m));
 const architecture=join(next,'institution/brainkit/architecture.md');writeFileSync(architecture,readFileSync(architecture,'utf8')+'\nSynthetic release-two clarification.\n');
 const {seal}=await import('./brainkit-check.mjs');seal(next);
 const sealed=JSON.parse(readFileSync(mp)),profilePath='profiles/institutions/meridian-trust.json';
 const profile=JSON.parse(readFileSync(join(next,profilePath)));profile.brainkit.release_digest=sealed.package_digest;writeFileSync(join(next,profilePath),JSON.stringify(profile));
 const projection=join(next,'discovery/brand/design.md');writeFileSync(projection,readFileSync(projection,'utf8').replaceAll(o.digest,sealed.package_digest).replaceAll(`brainkit_version: "${prior}"`,'brainkit_version: "1.1.0"'));
 writeFileSync(join(next,'brainkit-registry.json'),JSON.stringify({releases:[{brainkit_id:sealed.brainkit_id,version:sealed.version,package_digest:sealed.package_digest,status:'active',released_at:'2026-07-01'}],adoption_inventory:[]}));
 const newer={...o,from:next,digest:sealed.package_digest};
 assert.equal(reuseBrainkit({...o,apply:true}).ok,true);
 const git=(...args)=>{
  const r=spawnSync('git',['-c','user.name=Synthetic qualification','-c','user.email=qualification@example.invalid',...args],{cwd:o.dest,encoding:'utf8'});
  assert.equal(r.status,0,r.stdout+r.stderr);return r.stdout.trim();
 };
 git('init','-q');git('add','.');git('commit','-qm','Synthetic release one');const originalTree=git('rev-parse','HEAD^{tree}');
 const blocked=reuseBrainkit({...newer,apply:true});assert.equal(blocked.ok,false);assert.equal(blocked.copied.length,0);assert.equal(git('status','--porcelain'),'');
 // The explicit replacement below models the reviewed repository change, outside the
 // create-only reuse command. It is test data, never an automated institutional approval.
 rmSync(join(o.dest,'institution/brainkit'),{recursive:true});cpSync(join(next,'institution/brainkit'),join(o.dest,'institution/brainkit'),{recursive:true});cpSync(join(next,profilePath),join(o.dest,profilePath));
 const current=reuseBrainkit(newer);assert.equal(current.ok,true,current.findings.join('\n'));assert.ok(current.files.every(f=>f.status==='current'));
 git('add','.');git('commit','-qm','Synthetic release two');const upgraded=git('rev-parse','HEAD');
 git('revert','--no-edit',upgraded);assert.equal(git('rev-parse','HEAD^{tree}'),originalTree);
 const restored=reuseBrainkit(o);assert.equal(restored.ok,true,restored.findings.join('\n'));assert.ok(restored.files.every(f=>f.status==='current'));
 const estatePath=join(o.from,'brainkit-registry.json'),estate=JSON.parse(readFileSync(estatePath));estate.releases[0].status='revoked';estate.releases[0].revocation_reason='Synthetic withdrawal';writeFileSync(estatePath,JSON.stringify(estate));
 const revoked=reuseBrainkit(o);assert.equal(revoked.ok,false);assert.match(revoked.findings.join('\n'),/does not register this exact release as active/);assert.equal(git('status','--porcelain'),'');
});
test('drafts, wrong digest, absent consumer owners and revoked releases cannot be mounted',withExample,t=>{
 const o=fixture(t);assert.equal(reuseBrainkit({...o,digest:'sha256:'+'0'.repeat(64),apply:true}).ok,false);
 const manifestPath=join(o.from,'institution/brainkit/manifest.json'),m=JSON.parse(readFileSync(manifestPath));writeFileSync(manifestPath,JSON.stringify({...m,status:'draft'}));assert.equal(reuseBrainkit(o).ok,false);writeFileSync(manifestPath,JSON.stringify(m));
 const identities=join(o.dest,'docs/governance/identities.json');const original=readFileSync(identities);writeFileSync(identities,'{"identities":[]}');assert.equal(reuseBrainkit(o).ok,false);writeFileSync(identities,original);
 const ep=join(o.from,'brainkit-registry.json'),estate=JSON.parse(readFileSync(ep));estate.releases[0].status='revoked';estate.releases[0].revocation_reason='test withdrawal';writeFileSync(ep,JSON.stringify(estate));assert.equal(reuseBrainkit({...o,apply:true}).ok,false);assert.equal(existsSync(join(o.dest,'institution')),false);
});
test('tampered sections, path traversal and symlink destinations fail before copying',withExample,t=>{
 const o=fixture(t),path=join(o.from,'institution/brainkit/architecture.md'),original=readFileSync(path);writeFileSync(path,'tampered');assert.equal(reuseBrainkit({...o,apply:true}).ok,false);writeFileSync(path,original);
 const mp=join(o.from,'institution/brainkit/manifest.json'),m=JSON.parse(readFileSync(mp));m.sections[0].path='../../../outside';writeFileSync(mp,JSON.stringify(m));assert.match(reuseBrainkit(o).findings.join(' '),/Unsafe/);
 cpSync(join(EXAMPLE,'institution/brainkit/manifest.json'),mp);
 const elsewhere=join(o.dest,'../elsewhere');mkdirSync(elsewhere);symlinkSync(elsewhere,join(o.dest,'institution'));assert.match(reuseBrainkit({...o,apply:true}).findings.join(' '),/Symlink/);assert.equal(existsSync(join(elsewhere,'brainkit')),false);
});
test('core plus BrainKit stays independent of full tier and survives upgrades with edits', {skip:!existsSync(installer)},async t=>{
 const {install}=await import(installer.href);const root=mkdtempSync(join(tmpdir(),'loom-component-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const dry=install(root,{tier:'core',components:['brainkit'],dryRun:true});assert.equal(existsSync(join(root,'institution')),false);assert.ok(dry.files.some(f=>f.path==='institution/brainkit/manifest.json'));
 const first=install(root,{tier:'core',components:['brainkit']});assert.deepEqual(first.components,['brainkit']);assert.equal(existsSync(join(root,'docs/governance/issc-register.json')),false);
 assert.ok(configurationTasks(root).tasks.filter(t=>t.component==='brainkit').every(t=>t.state!=='deferred'));
 const custom=join(root,'institution/brainkit/architecture.md');writeFileSync(custom,'local institutional draft');const upgraded=install(root);assert.deepEqual(upgraded.components,['brainkit']);assert.equal(readFileSync(custom,'utf8'),'local institutional draft');assert.ok(existsSync(custom+'.loom-new'));
 const command=spawnSync(process.execPath,['scripts/loom.mjs','brainkit','--json'],{cwd:root,encoding:'utf8'});assert.equal(command.status,1);assert.ok(JSON.parse(command.stdout).findings.length);
 const cost=(await import('../assess.mjs')).costOfTier(root,'core');assert.equal(cost.entries,upgraded.length);assert.deepEqual(cost.components,['brainkit']);
 assert.throws(()=>install(root,{components:['unknown']}),/unknown component/);
});
test('installed core CLI mounts an explicitly selected publisher without full-tier templates', {skip:!existsSync(installer)||!existsSync(EXAMPLE)},async t=>{
 const o=fixture(t),{install}=await import(installer.href);
 install(o.dest,{tier:'core'});
 const profile=JSON.parse(readFileSync(join(o.from,'profiles/institutions/meridian-trust.json')));profile.profile='consumer-test';writeFileSync(join(o.from,'profiles/institutions/consumer-test.json'),JSON.stringify(profile));
 const args=['scripts/loom.mjs','brainkit','--from',o.from,'--profile','consumer-test','--digest',o.digest,'--json'];
 const preview=spawnSync(process.execPath,args,{cwd:o.dest,encoding:'utf8'});assert.equal(preview.status,0,preview.stdout+preview.stderr);assert.equal(existsSync(join(o.dest,'institution/brainkit/manifest.json')),false);
 const applied=spawnSync(process.execPath,[...args,'--apply'],{cwd:o.dest,encoding:'utf8'});assert.equal(applied.status,0,applied.stdout+applied.stderr);assert.ok(JSON.parse(applied.stdout).copied.length>0);
 const bytes=readFileSync(join(o.dest,'institution/brainkit/architecture.md'));install(o.dest);assert.ok(bytes.equals(readFileSync(join(o.dest,'institution/brainkit/architecture.md'))));
});
