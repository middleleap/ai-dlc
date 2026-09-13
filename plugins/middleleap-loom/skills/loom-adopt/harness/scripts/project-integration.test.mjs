import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {DEFAULTS,loadProject,validateProject} from '../core/project-config.mjs';
import {verifyProject} from './project-config-check.mjs';
import {configurationTasks} from './configuration-tasks.mjs';
import {FLOOR_DENY} from './routine-change-check.mjs';
import {CONTROL_TARGETS} from './control-plane-check.mjs';
const harness=new URL('../',import.meta.url),installer=new URL('../adopt.mjs',import.meta.url);
function repo(t){const cwd=mkdtempSync(join(tmpdir(),'loom-project-'));t.after(()=>rmSync(cwd,{recursive:true,force:true}));mkdirSync(join(cwd,'.loom'));return cwd;}
function configured(cwd,extra={}){const config={...DEFAULTS,spec_paths:['api/contract.yaml'],feature_pattern:'^FEAT-\\d+$',verification_commands:[['node','--version']],...extra};mkdirSync(join(cwd,'api'),{recursive:true});writeFileSync(join(cwd,'api/contract.yaml'),'openapi: 3.0.0');writeFileSync(join(cwd,'.loom/project.json'),JSON.stringify(config));return config;}
test('project config validates unsafe paths, invalid regex and command arrays',()=>{
 assert.deepEqual(validateProject(DEFAULTS),[]);
 for(const bad of [{spec_paths:[]},{spec_paths:['../outside']},{spec_paths:['a b']},{feature_pattern:'['},{verification_commands:['npm test']}])assert.ok(validateProject({...DEFAULTS,...bad}).length);
});
test('missing stamped config fails; pre-config installations retain explicit legacy defaults',t=>{
 const cwd=repo(t);assert.equal(loadProject(cwd).legacy,true);writeFileSync(join(cwd,'.loom/adoption.json'),JSON.stringify({files:{'.loom/project.json':'digest'}}));assert.throws(()=>loadProject(cwd),/missing/);
 configured(cwd);assert.equal(loadProject(cwd).legacy,false);writeFileSync(join(cwd,'.loom/project.json'),'{');assert.throws(()=>loadProject(cwd),/valid JSON/);
});
test('verification executes literal argv, propagates failure and rejects an empty command list',t=>{
 const cwd=repo(t),out={write(){}};configured(cwd,{verification_commands:[['tool','$(never-execute)'],['second']]});const calls=[];
 assert.equal(verifyProject([],cwd,out,(command,args,opts)=>{calls.push([command,args,opts.shell]);return {status:command==='second'?1:0};}),1);
 assert.deepEqual(calls,[['tool',['$(never-execute)'],false],['second',[],false]]);
 configured(cwd,{verification_commands:[]});assert.equal(verifyProject([],cwd,out,()=>assert.fail('must not execute')),1);
});
test('discovery checker reads the configured feature pattern without editing code',t=>{
 const cwd=repo(t);configured(cwd);mkdirSync(join(cwd,'docs'));writeFileSync(join(cwd,'docs/backlog.yaml'),'items:\n  - id: FEAT-7\n    status: in-progress\n');
 const result=spawnSync(process.execPath,[new URL('scripts/discovery-link-check.mjs',harness).pathname],{cwd,encoding:'utf8'});assert.equal(result.status,1);assert.match(result.stderr,/FEAT-7.*no 'discovery/);
});
test('hook protects configured contracts and denies malformed or deleted config', {skip:spawnSync('jq',['--version']).status!==0},t=>{
 const cwd=repo(t);execFileSync('git',['init','-q','-b','feature/FEAT-7'],{cwd});configured(cwd);
 const source=['hooks/spec-tripwire.sh','.claude/hooks/spec-tripwire.sh'].map(p=>new URL(p,harness)).find(existsSync);
 const run=()=>spawnSync('bash',[source.pathname],{cwd,env:{...process.env,CLAUDE_PROJECT_DIR:cwd},input:JSON.stringify({tool_input:{file_path:'api/contract.yaml'}}),encoding:'utf8'});
 assert.match(run().stdout,/"permissionDecision": "deny"/);
 writeFileSync(join(cwd,'.loom/project.json'),'{');assert.match(run().stdout,/invalid spec_paths/);
 rmSync(join(cwd,'.loom/project.json'));writeFileSync(join(cwd,'.loom/adoption.json'),JSON.stringify({files:{'.loom/project.json':'digest'}}));assert.match(run().stdout,/missing from this adoption/);
});
test('project settings are protected and never routine',()=>{assert.ok(FLOOR_DENY.includes('.loom/project.json'));assert.ok(CONTROL_TARGETS.includes('.loom/project.json'));assert.ok(CONTROL_TARGETS.includes('.github/workflows/loom.yml'));});
test('separate CI preserves a team workflow and project settings across upgrades', {skip:!existsSync(installer)},async t=>{
 const {install}=await import(installer.href),cwd=repo(t);mkdirSync(join(cwd,'.github/workflows'),{recursive:true});const team='name: Team CI\non: push\njobs: {}\n';writeFileSync(join(cwd,'.github/workflows/ci.yml'),team);
 const dry=install(cwd,{ciMode:'separate',dryRun:true});assert.ok(dry.files.some(f=>f.path==='.github/workflows/loom.yml'));assert.equal(existsSync(join(cwd,'.github/workflows/loom.yml')),false);
 install(cwd,{ciMode:'separate'});assert.equal(readFileSync(join(cwd,'.github/workflows/ci.yml'),'utf8'),team);assert.match(readFileSync(join(cwd,'.github/workflows/loom.yml'),'utf8'),/loom-governance:\n    name: Loom governance/);
 const custom=configured(cwd);const report=install(cwd);assert.equal(report.ciMode,'separate');assert.deepEqual(JSON.parse(readFileSync(join(cwd,'.loom/project.json'))),custom);assert.equal(readFileSync(join(cwd,'.github/workflows/ci.yml'),'utf8'),team);
 assert.ok(configurationTasks(cwd).tasks.some(t=>t.path==='.github/workflows/loom.yml'));
 assert.ok(configurationTasks(cwd).tasks.some(t=>t.path==='.loom/project.json'));
 const catalog=spawnSync(process.execPath,['scripts/ci-catalog-check.mjs'],{cwd,encoding:'utf8'});assert.equal(catalog.status,0,catalog.stdout+catalog.stderr);
 assert.throws(()=>install(cwd,{ciMode:'reference'}),/workflow migration/);
});
