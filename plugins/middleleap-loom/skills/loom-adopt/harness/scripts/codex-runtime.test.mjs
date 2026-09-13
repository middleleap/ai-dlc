import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,readdirSync,existsSync,chmodSync,symlinkSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {prepareCodex,inspectEvents,runCodex,runtimeCommand} from './codex-runtime.mjs';
const schema=JSON.parse(readFileSync(['../agents/agent-output.schema.json','../.claude/agents/agent-output.schema.json'].map(p=>new URL(p,import.meta.url)).find(existsSync)));
function put(cwd,path,value){mkdirSync(join(cwd,path,'..'),{recursive:true});writeFileSync(join(cwd,path),typeof value==='string'?value:JSON.stringify(value));}
function fixture(t){const cwd=mkdtempSync(join(tmpdir(),'loom-codex-'));t.after(()=>rmSync(cwd,{recursive:true,force:true}));put(cwd,'AGENTS.md','Team instructions: review only.');put(cwd,'task.md','Review the proposed change.');put(cwd,'.claude/agents/hard-stop-reviewer.md','Use loom.agent-output/v1; do not infer approval.');put(cwd,'.claude/agents/agent-output.schema.json',schema);put(cwd,'docs/governance/model-manifest.json',{models:[{role:'hard-stop-reviewer',provider:'openai',model_id:'pinned-model-2026-09',prompt_version:'reviewer@1',eval:{evaluated_model_id:'pinned-model-2026-09',evaluated_prompt_version:'reviewer@1'}}]});return cwd;}
const output={schema:'loom.agent-output/v1',agent:'hard-stop-reviewer',model:'pinned-model-2026-09',prompt_version:'reviewer@1',inputs_read:[],register_state:'absent',verdict:'INSUFFICIENT_EVIDENCE',reason:'No register supplied',confidence:'low',findings:[]};
function events(value=output){return [{type:'thread.started',thread_id:'test-thread'},{type:'turn.started'},{type:'item.completed',item:{type:'agent_message',text:JSON.stringify(value)}},{type:'turn.completed'}].map(JSON.stringify).join('\n')+'\n';}
test('preview pins inputs and selects read-only with no privilege-bypass or model default',t=>{
 const cwd=fixture(t),request=prepareCodex(cwd,{task:'task.md',role:'hard-stop-reviewer'});
 assert.ok(request.args.includes('read-only'));assert.ok(request.args.includes('pinned-model-2026-09'));assert.ok(!request.args.some(a=>a.includes('bypass')||a==='--ignore-rules'||a==='--ignore-user-config'));assert.equal(request.authority,'none');assert.equal(request.inputs.length,5);assert.equal(request.gaps.length,6);
});
test('instruction override is pinned; existing project instructions are never rewritten',t=>{
 const cwd=fixture(t);put(cwd,'AGENTS.override.md','A scoped override');const request=prepareCodex(cwd,{task:'task.md',role:'hard-stop-reviewer'});assert.ok(request.inputs.some(i=>i.path==='AGENTS.override.md'));assert.equal(readFileSync(join(cwd,'AGENTS.md'),'utf8'),'Team instructions: review only.');put(cwd,'AGENTS.override.md','');assert.ok(prepareCodex(cwd,{task:'task.md',role:'hard-stop-reviewer'}).inputs.some(i=>i.path==='AGENTS.md')); 
});
test('missing, ambiguous and stale model-role pins are blocked',t=>{
 const cwd=fixture(t),path=join(cwd,'docs/governance/model-manifest.json'),original=JSON.parse(readFileSync(path));
 for(const models of [[],[...original.models,...original.models],[{...original.models[0],prompt_version:'reviewer@2'}]]){put(cwd,'docs/governance/model-manifest.json',{models});assert.throws(()=>prepareCodex(cwd,{task:'task.md',role:'hard-stop-reviewer'}));}
});
test('successful transport validates schema but retains authority none and unverified status',t=>{
 const r=inspectEvents(events(),prepareCodex(fixture(t),{task:'task.md',role:'hard-stop-reviewer'}),{exitCode:0});assert.deepEqual(r.findings,[]);assert.equal(r.status,'completed-unverified');assert.equal(r.authority,'none');
});
test('missing terminal events, errors, malformed data, signals and empty logs never complete',t=>{
 const request=prepareCodex(fixture(t),{task:'task.md',role:'hard-stop-reviewer'});
 for(const text of ['',events().replace('{"type":"turn.completed"}\n',''),events()+'not-json\n',events()+'{"type":"error"}\n',events()+'{"type":"item.completed","item":{"type":"file_change"}}\n'])assert.ok(inspectEvents(text,request,{exitCode:0}).findings.length);
 assert.ok(inspectEvents(events(),request,{exitCode:0,signal:'SIGTERM'}).findings.length);
 assert.ok(inspectEvents(events(),request).findings.length);
});
test('invalid reviewer verdicts and mismatched pins cannot validate as completed',t=>{
 const request=prepareCodex(fixture(t),{task:'task.md',role:'hard-stop-reviewer'});
 for(const value of [{...output,verdict:'PASS'},{...output,model:'another-model'},{...output,prompt_version:'v2'},{}])assert.ok(inspectEvents(events(value),request,{exitCode:0}).findings.length);
});
test('provider CLI incompatibility explains the fix without changing the requested model',t=>{
 const request=prepareCodex(fixture(t),{task:'task.md',role:'hard-stop-reviewer'});
 const message='The requested model requires a newer version of Codex. Please upgrade.';
 const text=[{type:'error',message},{type:'turn.failed',error:{message}}].map(JSON.stringify).join('\n');
 const result=inspectEvents(text,request,{exitCode:1});
 assert.equal(result.status,'incomplete-or-invalid');
 assert.equal(result.findings.filter(f=>f.includes('newer Codex CLI')).length,1);
 assert.match(result.findings[0],/same model pin/);
 assert.equal(request.requested_model,'pinned-model-2026-09');
});
function fakeProcess(text,code=0,signal=null){return (_cmd,_args,opts)=>{assert.equal(opts.shell,false);const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.stdin=new PassThrough();child.kill=()=>{};child.stdin.once('finish',()=>{child.stdout.write(text);child.emit('close',code,signal);});return child;};}
test('runner captures events and interrupted status without automatic resume or approval',async t=>{
 const cwd=fixture(t),request=prepareCodex(cwd,{task:'task.md',role:'hard-stop-reviewer'});
 for(const [code,signal] of [[0,null],[null,'SIGTERM']]){const {dir,result}=await runCodex(request,{spawnProcess:fakeProcess(events(),code,signal),versionProbe:()=>({status:0,stdout:'codex-cli fixture'})});assert.equal(readFileSync(join(dir,'events.jsonl'),'utf8'),events());assert.equal(result.status,signal?'incomplete-or-invalid':'completed-unverified');assert.equal(JSON.parse(readFileSync(join(dir,'request.json'))).authority,'none');}
 assert.equal(readdirSync(join(cwd,'.loom')).length,2);
});
test('public preview creates no run artifacts and rejects unsupported runtimes or flags',async t=>{
 const cwd=fixture(t),out={write(){}};assert.equal(await runtimeCommand(['codex','--task','task.md','--role','hard-stop-reviewer'],cwd,out),0);assert.ok(!readdirSync(cwd).includes('.loom'));assert.equal(await runtimeCommand(['other'],cwd,out),2);assert.equal(await runtimeCommand(['codex','--sandbox','workspace-write'],cwd,out),2);
});
test('git add -A excludes runtime captures while project configuration remains trackable',async t=>{
 const cwd=fixture(t),{spawnSync}=await import('node:child_process');
 const git=(...args)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout;};
 git('init','-q');put(cwd,'.loom/project.json','{}');
 const request=prepareCodex(cwd,{task:'task.md',role:'hard-stop-reviewer'});
 const {dir}=await runCodex(request,{spawnProcess:fakeProcess(events()),versionProbe:()=>({status:0,stdout:'codex-cli fixture'})});
 assert.ok(existsSync(join(dir,'events.jsonl')));
 git('add','-A');const tracked=git('ls-files');
 assert.match(tracked,/\.loom\/project.json/);assert.doesNotMatch(tracked,/runtime-run-/);
 assert.match(git('check-ignore',join(dir,'events.jsonl')),/events.jsonl/);
});
test('CLI entry points invoked through a symlink still execute the request',async t=>{
 const cwd=fixture(t),{spawnSync}=await import('node:child_process');
 for(const [file,args] of [['loom.mjs',['runtime','codex']],['codex-runtime.mjs',['codex']]]){
  const alias=join(cwd,`alias-${file}`);symlinkSync(new URL(file,import.meta.url),alias);
  const result=spawnSync(process.execPath,[alias,...args,'--task','task.md','--role','hard-stop-reviewer'],{cwd,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/read-only-review/);
 }
});
for(const parentSignal of ['SIGTERM','SIGKILL','stubborn-child'])test(`public CLI ${parentSignal} stops its child and retains an incomplete result`,async t=>{
 const cwd=fixture(t);put(cwd,'bin/codex',`#!/usr/bin/env node
if(process.argv.includes('--version')){console.log('codex-cli fixture');process.exit(0);}
process.stdin.resume();
process.on('SIGTERM',()=>{${parentSignal==='stubborn-child'?'':'process.exit(143);'}});
console.log(JSON.stringify({type:'thread.started',thread_id:'public-cancel-fixture'}));
setInterval(()=>{},1000);
`);chmodSync(join(cwd,'bin/codex'),0o755);
 let cli=new URL('./loom.mjs',import.meta.url).pathname;
 if(existsSync(new URL('../adopt.mjs',import.meta.url))){
  const {install}=await import('../adopt.mjs');install(cwd,{tier:'core'});
  assert.ok(existsSync(join(cwd,'scripts/codex-runtime-worker.mjs')));cli=join(cwd,'scripts/loom.mjs');
 }
 const child=spawn(process.execPath,[cli,'runtime','codex','--task','task.md','--role','hard-stop-reviewer','--run'],{cwd,env:{...process.env,PATH:join(cwd,'bin')+':'+process.env.PATH},stdio:['ignore','pipe','pipe']});
 let diagnostic='';child.stdout.on('data',b=>{diagnostic+=b;});child.stderr.on('data',b=>{diagnostic+=b;});
 t.after(()=>{if(child.exitCode===null)child.kill('SIGKILL');});
 const closed=new Promise(resolve=>child.once('close',(code,signal)=>resolve({code,signal})));
 let dir;const deadline=Date.now()+5000;
 while(Date.now()<deadline){
  const parent=join(cwd,'.loom');dir=existsSync(parent)&&readdirSync(parent).filter(n=>n.startsWith('runtime-run-')).map(n=>join(parent,n)).find(d=>existsSync(join(d,'events.jsonl'))&&readFileSync(join(d,'events.jsonl'),'utf8').includes('thread.started'));
  if(dir)break;await new Promise(resolve=>setTimeout(resolve,20));
 }
 assert.ok(dir,`native child started before cancellation: ${diagnostic}`);child.kill(parentSignal==='stubborn-child'?'SIGTERM':parentSignal);
 const timeout=setTimeout(()=>child.kill('SIGKILL'),10000);const exit=await closed;clearTimeout(timeout);
 assert.equal(exit.code,parentSignal==='SIGKILL'?null:1);assert.equal(exit.signal,parentSignal==='SIGKILL'?'SIGKILL':null);
 const resultDeadline=Date.now()+5000;
 while(!existsSync(join(dir,'result.json'))&&Date.now()<resultDeadline)await new Promise(resolve=>setTimeout(resolve,20));
 const result=JSON.parse(readFileSync(join(dir,'result.json')));
 assert.equal(result.status,'incomplete-or-invalid');assert.equal(result.signal,parentSignal==='stubborn-child'?'SIGKILL':'SIGTERM');assert.equal(result.authority,'none');assert.equal(result.cleanup.completeness,'unverified');
});
test('installed core exposes the same preview contract without launching a model',{skip:!existsSync(new URL('../adopt.mjs',import.meta.url))},async t=>{
 const cwd=fixture(t),{install}=await import('../adopt.mjs');install(cwd,{tier:'core'});
 const {spawnSync}=await import('node:child_process');const result=spawnSync(process.execPath,['scripts/loom.mjs','runtime','codex','--task','task.md','--role','hard-stop-reviewer'],{cwd,encoding:'utf8'});
 assert.equal(result.status,0,result.stdout+result.stderr);assert.match(result.stdout,/read-only-review/);assert.ok(!readdirSync(join(cwd,'.loom')).some(p=>p.startsWith('runtime-run-')));
});
