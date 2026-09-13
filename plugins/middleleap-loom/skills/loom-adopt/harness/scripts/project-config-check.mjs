import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {loadProject,PROJECT_CONFIG} from '../core/project-config.mjs';
export function checkProject(cwd=process.cwd()){
 try{const {config,legacy}=loadProject(cwd),findings=[];
 if(legacy)findings.push(`${PROJECT_CONFIG} is absent; legacy defaults are in use.`);
 if(!config.spec_paths.some(p=>existsSync(join(cwd,p))))findings.push('No configured contract file exists.');
 if(!config.verification_commands.length)findings.push('Supply the project verification commands.');
 return {config,findings};
 }catch(e){return {findings:[e.message]};}
}
export function verifyProject(args,cwd=process.cwd(),out=process.stdout,spawn=spawnSync){
 if(args.length){out.write('usage: loom verify-project\n');return 2;}
 const report=checkProject(cwd);if(report.findings.length){out.write(report.findings.join('\n')+'\n');return 1;}
 for(const [command,...argv] of report.config.verification_commands){
  out.write(`Running ${JSON.stringify([command,...argv])}\n`);
  const result=spawn(command,argv,{cwd,stdio:'inherit',shell:false,timeout:300000});
  if(result.error||result.status!==0){out.write('Project verification failed or could not run.\n');return 1;}
 }
 out.write('Declared project verification commands passed. This is not institutional approval.\n');return 0;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const r=checkProject();process.stdout.write(r.findings.length?r.findings.join('\n')+'\n':'Project configuration inputs present; commands have not been run.\n');process.exit(r.findings.length?1:0);}
