import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {buildWorkspaces} from './onboarding-pilot-workspaces.mjs';
test('coordinator workspaces support installed two-team reuse without changing team files',t=>{
 const scratch=mkdtempSync(join(tmpdir(),'loom-coordinator-'));t.after(()=>rmSync(scratch,{recursive:true,force:true}));
 const dest=join(scratch,'round'),report=buildWorkspaces(dest);
 assert.throws(()=>buildWorkspaces(dest),/never overwritten/);
 const run=(cwd,...args)=>{const r=spawnSync(process.execPath,args,{cwd,encoding:'utf8'});assert.equal(r.status,0,r.stdout+r.stderr);return r.stdout;};
 for(const team of report.teams){
  const cwd=join(dest,team.directory);
  run(cwd,'../candidate/skills/loom-adopt/harness/adopt.mjs','--dest','.','--tier','core','--ci','separate','--dry-run');
  assert.equal(existsSync(join(cwd,'.loom/adoption.json')),false);
  run(cwd,'../candidate/skills/loom-adopt/harness/adopt.mjs','--dest','.','--tier','core','--ci','separate');
  run(cwd,'scripts/loom.mjs','verify-project');
  const args=['scripts/loom.mjs','brainkit','--from','../publisher','--profile',report.profile,'--digest',report.release_digest,'--json'];
  const preview=JSON.parse(run(cwd,...args));assert.equal(preview.ok,true);
  assert.equal(existsSync(join(cwd,'institution/brainkit/manifest.json')),false);
  const applied=JSON.parse(run(cwd,...args,'--apply'));assert.ok(applied.copied.length>0);
  assert.equal(JSON.parse(run(cwd,...args,'--apply')).copied.length,0);
  for(const [path,digest] of Object.entries(team.preserved_files))assert.equal('sha256:'+createHash('sha256').update(readFileSync(join(cwd,path))).digest('hex'),digest);
  assert.equal(existsSync(join(cwd,'.github/workflows/loom.yml')),true);
  assert.equal(spawnSync('git',['remote'],{cwd,encoding:'utf8'}).stdout,'');
 }
 assert.equal(report.authority,'none');
 assert.equal(readFileSync(join(dest,'team-one/institution/brainkit/manifest.json'),'utf8'),readFileSync(join(dest,'team-two/institution/brainkit/manifest.json'),'utf8'));
});
