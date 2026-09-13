// Bounded Codex CLI reviewer adapter. No merge, approval, credential or hook configuration.
import {existsSync,readFileSync,writeFileSync,appendFileSync,mkdirSync,mkdtempSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawn,spawnSync,fork} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {validate,invariants} from './agent-output-check.mjs';
import {resolveNoSymlink} from '../core/repo-path.mjs';
const hash=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const json=path=>JSON.parse(readFileSync(path,'utf8'));
function localFile(cwd,path){
 const abs=resolveNoSymlink(cwd,path,'pinned adapter input');
 if(!existsSync(abs)||!lstatSync(abs).isFile())throw new Error(`Required file is absent: ${path}`);return abs;
}
export function prepareCodex(cwd,{task,role}){
 cwd=resolve(cwd);
 if(!/^[a-z][a-z-]+$/.test(role||''))throw new Error('Supply a named reviewer --role.');
 const manifestPath=localFile(cwd,'docs/governance/model-manifest.json'),manifest=json(manifestPath);
 const matches=(manifest.models||[]).filter(m=>m.role===role||m.agents?.includes(role));
 if(matches.length!==1)throw new Error('Reviewer must resolve to exactly one model-manifest role.');
 const pin=matches[0];
 for(const key of ['model_id','prompt_version'])if(typeof pin[key]!=='string'||!pin[key].trim()||/ADOPT|example|unknown|latest|^main$/i.test(pin[key]))throw new Error(`Supply a concrete ${key} in the model manifest.`);
 if(pin.provider!=='openai')throw new Error('This adapter implements the OpenAI-backed Codex CLI only; other providers require their own adapter.');
 if(pin.eval?.evaluated_model_id!==pin.model_id||pin.eval?.evaluated_prompt_version!==pin.prompt_version)throw new Error('Evaluation pins do not match the selected model and prompt. Re-evaluate changes before use.');
 const agentPath=localFile(cwd,`.claude/agents/${role}.md`),schemaPath=localFile(cwd,'.claude/agents/agent-output.schema.json');
 const schema=json(schemaPath);if(!schema.properties?.agent?.enum?.includes(role))throw new Error('Role is not supported by the reviewer output contract.');
 const instruction=['AGENTS.override.md','AGENTS.md'].find(p=>existsSync(join(cwd,p))&&readFileSync(localFile(cwd,p),'utf8').trim());
 if(!instruction)throw new Error('Provide nonempty repository AGENTS.md instructions before running a reviewer.');
 const instructionPath=localFile(cwd,instruction),taskPath=localFile(cwd,task);
 const inputs=[manifestPath,agentPath,schemaPath,instructionPath,taskPath].map(path=>({path:path.slice(cwd.length+1),digest:hash(readFileSync(path))}));
 const prompt=`Loom read-only review. Do not edit files, run mutating commands, approve, merge or deploy. Read the applicable repository instructions and reviewer definition. Missing evidence must remain missing. Output only a JSON object satisfying loom.agent-output/v1. A reviewer verdict is never human approval.\nReviewer: ${role}\nRequested model: ${pin.model_id}\nPrompt version: ${pin.prompt_version}\n\nReviewer definition:\n${readFileSync(agentPath,'utf8')}\n\nOutput contract:\n${JSON.stringify(schema)}\n\nReview task:\n${readFileSync(taskPath,'utf8')}`;
 if(inputs.some(i=>hash(readFileSync(localFile(cwd,i.path)))!==i.digest))throw new Error('Inputs changed during preparation; retry with stable files.');
 return {schema:'loom.runtime-request/v1',runtime:'codex',mode:'read-only-review',authority:'none',cwd,role,requested_model:pin.model_id,prompt_version:pin.prompt_version,inputs,prompt_digest:hash(prompt),command:'codex',args:['exec','--cd',cwd,'--sandbox','read-only','--model',pin.model_id,'--json','-'],prompt,outputSchema:schema,gaps:['No Loom pre-action hooks are installed for Codex.','AGENTS instruction loading and actual model/tool behaviour need live verification.','CLI events and model output are untrusted claims, not signed governance evidence.','Evaluation pin equality does not validate the evaluation report or authorize use.','Read-only constrains shell filesystem writes; MCP tools and network egress are not attested by this adapter.','Automatic resume and write-capable delivery are not implemented.']};
}
export function inspectEvents(text,request,{exitCode=null,signal=null}={}){
 const findings=[],events=[];let thread=null,started=false,completed=false,final=null;
 for(const [i,line] of text.split('\n').entries()){
  if(!line.trim())continue;let e;try{e=JSON.parse(line);}catch{findings.push(`Malformed JSON event at line ${i+1}`);continue;}
  if(!e||typeof e.type!=='string'){findings.push(`Invalid event at line ${i+1}`);continue;}events.push(e.type);
  if(e.type==='thread.started'){if(thread||typeof e.thread_id!=='string'||!e.thread_id.trim())findings.push('Invalid or repeated thread identity');else thread=e.thread_id;}
  if(e.type==='turn.started'){if(started||completed)findings.push('Unexpected additional turn');started=true;}
  if(e.type==='turn.completed'){if(!started||completed)findings.push('Unexpected completion');completed=true;}
  if(e.type==='item.completed'&&e.item?.type==='file_change')findings.push('A file change was reported during a read-only reviewer request.');
  if(e.type==='turn.failed'||e.type==='error'){
   const message=e.message||e.error?.message||'';
   const diagnosis=typeof message==='string'&&message.includes('requires a newer version of Codex')
    ? 'The requested model requires a newer Codex CLI. Select a compatible installed CLI on PATH or upgrade it, then retry with the same model pin.'
    : 'Codex reported a failed turn or runtime error';
   if(!findings.includes(diagnosis))findings.push(diagnosis);
  }
  if(e.type==='item.completed'&&e.item?.type==='agent_message'){if(completed)findings.push('Message arrived after completion');final=e.item.text;}
 }
 if(!thread||!started||!completed)findings.push('Incomplete event stream; do not infer successful completion or auto-resume.');
 if(exitCode!==0||signal)findings.push('Process failed, was interrupted, or its exit status is unavailable.');
 let output=null;try{output=JSON.parse(final);if(!output||typeof output!=='object'||Array.isArray(output))throw new Error();}catch{findings.push('Final reviewer message is not a JSON object.');output=null;}
 if(output){const shape=validate(output,request.outputSchema);findings.push(...shape);if(!shape.length)findings.push(...invariants(output));
 if(output.agent!==request.role||output.model!==request.requested_model||output.prompt_version!==request.prompt_version)findings.push('Reviewer identity or model/prompt claim differs from the requested pin.');}
 return {schema:'loom.runtime-result/v1',runtime:'codex',authority:'none',status:findings.length?'incomplete-or-invalid':'completed-unverified',thread_id:thread,exit_code:exitCode,signal,events,findings,output,scope:'Transport and output-contract validation only. No observation of model correctness, input reads, institutional approval or governance-gate passage.'};
}
export async function runCodex(request,{spawnProcess=spawn,versionProbe=spawnSync}={}){
 const parent=join(request.cwd,'.loom');if(existsSync(parent)&&lstatSync(parent).isSymbolicLink())throw new Error('Runtime output directory cannot be a symlink.');mkdirSync(parent,{recursive:true});
 const dir=mkdtempSync(join(parent,'runtime-run-'));
 // Install protection before writing any captured data; keep other .loom files trackable.
 writeFileSync(join(dir,'.gitignore'),'*\n',{mode:0o600});
 const version=versionProbe('codex',['--version'],{encoding:'utf8'});
 if(version.error||version.status!==0)throw new Error(`Codex CLI is unavailable. Ignored run directory: ${dir}`);
 const metadata={...request,prompt:undefined,outputSchema:undefined,cli_version:version.stdout.trim(),status:'running',authority:'none'};
 writeFileSync(join(dir,'request.json'),JSON.stringify(metadata,null,2));writeFileSync(join(dir,'events.jsonl'),'');writeFileSync(join(dir,'stderr.log'),'');
 const grouped=process.platform!=='win32';
 const child=spawnProcess(request.command,request.args,{cwd:request.cwd,stdio:['pipe','pipe','pipe'],shell:false,detached:grouped});
 let stream='',captureError=null;
 let interrupted=false,killTimer;
 const terminate=signal=>{
  if(grouped&&Number.isInteger(child.pid)){
   try{process.kill(-child.pid,signal);}catch(e){if(e.code!=='ESRCH')child.kill(signal);}
  }else child.kill(signal);
 };
 const stop=()=>{
  if(interrupted)return;interrupted=true;terminate('SIGTERM');
  killTimer=setTimeout(()=>terminate('SIGKILL'),5000);killTimer.unref();
 };process.on('SIGINT',stop);process.on('SIGTERM',stop);
 const result=await new Promise(resolveResult=>{
  // Decode as one UTF-8 stream: a multi-byte character split across pipe chunks must reach
  // inspectEvents intact, and the on-disk capture must carry the same bytes.
  child.stdout.setEncoding('utf8');
  child.stdout.on('data',chunk=>{stream+=chunk;try{appendFileSync(join(dir,'events.jsonl'),chunk);}catch(e){captureError=e.message;stop();}});
  child.stderr.on('data',chunk=>{try{appendFileSync(join(dir,'stderr.log'),chunk);}catch(e){captureError=e.message;stop();}});
  child.once('error',e=>{captureError=e.message;});
  child.once('close',(code,signal)=>resolveResult(inspectEvents(stream,request,{exitCode:code,signal:signal||(interrupted?'SIGTERM':null)})));
  child.stdin.on('error',e=>{captureError=e.message;});child.stdin.end(request.prompt);
 });
 clearTimeout(killTimer);if(interrupted)terminate('SIGKILL');
 process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);
 if(captureError){result.findings.push(`Capture/process error: ${captureError}`);result.status='incomplete-or-invalid';}
 if(interrupted)result.cleanup={scope:grouped?'Codex process group':'Codex child process',completeness:'unverified',note:'Subprocesses that detach into other process groups and external tool work may survive. Inspect runtime state before retrying.'};
 writeFileSync(join(dir,'result.json'),JSON.stringify(result,null,2));
 return {dir,result};
}
// A separate capture owner survives loss of the public CLI. IPC disconnect is the
// cancellation signal; no PID guessing or automatic replay is involved.
export async function runSupervisedCodex(request){
 const worker=fork(new URL('./codex-runtime-worker.mjs',import.meta.url),[],{stdio:['ignore','ignore','ignore','ipc']});
 let reply,error;
 const cancel=()=>{if(worker.connected)worker.send({type:'cancel'},()=>{});};
 process.on('SIGINT',cancel);process.on('SIGTERM',cancel);
 try{
  return await new Promise((resolveResult,reject)=>{
   worker.on('message',message=>{reply=message;});
   worker.once('error',e=>{error=e;});
   worker.once('close',()=>{
    if(reply?.type==='result')resolveResult(reply.value);
    else reject(error||new Error(reply?.error||'Runtime supervisor stopped without a result. Inspect the retained run directory; do not auto-resume.'));
   });
   worker.send({type:'run',request},e=>{if(e)error=e;});
  });
 }finally{process.removeListener('SIGINT',cancel);process.removeListener('SIGTERM',cancel);}
}
export async function runtimeCommand(args,cwd=process.cwd(),out=process.stdout){
 const [runtime,...rest]=args;if(runtime!=='codex'){out.write('usage: loom runtime codex --task <file> --role <reviewer> [--run]\n');return 2;}
 const options={};let execute=false;
 for(let i=0;i<rest.length;i++)if(['--task','--role'].includes(rest[i])&&rest[i+1]&&!rest[i+1].startsWith('--'))options[rest[i].slice(2)]=rest[++i];else if(rest[i]==='--run')execute=true;else{out.write('Unknown or incomplete runtime option.\n');return 2;}
 try{const request=prepareCodex(cwd,options);
 if(!execute){out.write(JSON.stringify({...request,prompt:undefined,outputSchema:undefined},null,2)+'\nPreview only; add --run to invoke Codex using its existing authentication.\n');return 0;}
 const {dir,result}=await runSupervisedCodex(request);out.write(`Runtime capture: ${dir}\n${result.status}\n${result.findings.join('\n')}\n`);return result.findings.length?1:0;
 }catch(e){out.write(e.message+'\n');return 1;}
}
if(process.argv[1]&&existsSync(process.argv[1])&&import.meta.url===pathToFileURL(realpathSync(process.argv[1])).href)process.exit(await runtimeCommand(process.argv.slice(2)));
