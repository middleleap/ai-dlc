import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {isRepoRelative} from './repo-path.mjs';
export const PROJECT_CONFIG='.loom/project.json';
export const DEFAULTS={schema:'loom.project/v1',spec_paths:['specs/openapi.yaml','specs/openapi.yml','specs/openapi.json'],feature_pattern:'^STORY-\\d+$',verification_commands:[]};
export function validateProject(config){
 const findings=[];
 if(config?.schema!=='loom.project/v1')findings.push('schema must be loom.project/v1');
 if(!Array.isArray(config?.spec_paths)||!config.spec_paths.length||config.spec_paths.some(p=>typeof p!=='string'||!/^[A-Za-z0-9_./-]+$/.test(p)||!isRepoRelative(p)))findings.push('spec_paths must contain nonempty repository-relative paths without whitespace or traversal');
 try{if(typeof config?.feature_pattern!=='string'||!config.feature_pattern.startsWith('^')||!config.feature_pattern.endsWith('$')||config.feature_pattern.length>128)throw new Error();new RegExp(config.feature_pattern);}catch{findings.push('feature_pattern must be a valid anchored regex of at most 128 characters');}
 if(!Array.isArray(config?.verification_commands)||config.verification_commands.some(c=>!Array.isArray(c)||!c.length||c.some(a=>typeof a!=='string'||!a.trim()||a.includes('\0'))))findings.push('verification_commands must be arrays of executable and literal arguments');
 return findings;
}
export function loadProject(cwd=process.cwd()){
 const path=join(cwd,PROJECT_CONFIG);
 if(!existsSync(path)){
  const stamp=join(cwd,'.loom/adoption.json');
  if(existsSync(stamp)){const s=JSON.parse(readFileSync(stamp));if(s.files?.[PROJECT_CONFIG])throw new Error(`${PROJECT_CONFIG} is missing from this adoption; restore it before continuing.`);}
  return {config:DEFAULTS,legacy:true};
 }
 let config;try{config=JSON.parse(readFileSync(path,'utf8'));}catch{throw new Error(`${PROJECT_CONFIG} is not valid JSON`);}
 const findings=validateProject(config);if(findings.length)throw new Error(`${PROJECT_CONFIG}: ${findings.join('; ')}`);
 return {config,legacy:false};
}
