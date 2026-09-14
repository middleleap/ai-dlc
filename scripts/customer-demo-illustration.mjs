// Add a private editorial companion to a generated package without changing recorded evidence.
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function entries(root) {
 const result=[];
 function walk(dir) { for(const name of readdirSync(dir).sort()) { const p=join(dir,name), s=lstatSync(p); if(s.isSymbolicLink())throw new Error('Symlinks are not allowed'); if(s.isDirectory())walk(p); else if(s.isFile())result.push([relative(root,p).split('\\').join('/'),hash(readFileSync(p))]); else throw new Error('Unsupported file'); } }
 walk(root); return result;
}
function validate(s) {
 if(s.schema!=='loom.private-illustration/v1'||s.authority!=='fictional-editorial')throw new Error('Fictional editorial authority required');
 for(const k of ['name','question','brief','operations'])if(typeof s[k]!=='string'||!s[k].trim())throw new Error('Missing '+k);
 if(!Array.isArray(s.stages)||s.stages.length!==4)throw new Error('Four stages required');
 for(const stage of s.stages) { for(const k of ['name','title','body','output','decision'])if(typeof stage[k]!=='string')throw new Error('Invalid stage'); pairs(stage.questions); }
 pairs(s.considerations);
 if(!Array.isArray(s.artifacts)||s.artifacts.length!==3)throw new Error('Three artifact excerpts required');
 for(const a of s.artifacts){for(const k of ['title','status','description'])if(typeof a[k]!=='string')throw new Error('Invalid artifact');pairs(a.lines);}
 if(!Array.isArray(s.sources))throw new Error('Sources required');
 for(const source of s.sources) { if(typeof source.label!=='string'||new URL(source.url).protocol!=='https:')throw new Error('HTTPS source required'); }
}
function pairs(values) { if(!Array.isArray(values)||!values.length||values.some(p=>!Array.isArray(p)||p.length!==2||p.some(x=>typeof x!=='string')))throw new Error('Invalid detail pairs'); }
const list = values => '<dl>'+values.map(([a,b])=>`<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')+'</dl>';
export function addIllustration(base, scenarioPath, destination) {
 base=resolve(base);destination=resolve(destination);scenarioPath=resolve(scenarioPath);
 if(destination===base||destination.startsWith(base+'/'))throw new Error('Output must be outside the base package');
 if(existsSync(destination))throw new Error('Choose a new destination');
 const scenarioBytes=readFileSync(scenarioPath), s=JSON.parse(scenarioBytes);validate(s);
 const original=entries(base);
 for(const file of ['README.md','server.mjs','Dockerfile','dist/index.html','dist/release.json'])if(!existsSync(join(base,file)))throw new Error('Incomplete generated package');
 if(existsSync(join(base,'dist/illustration.html')))throw new Error('Illustration already exists; regenerate from the base package');
 const index=readFileSync(join(base,'dist/index.html'),'utf8');
 if(!index.includes('<main id="main">'))throw new Error('Missing companion entry point');
 const release=JSON.parse(readFileSync(join(base,'dist/release.json')));
 cpSync(base,destination,{recursive:true,filter:p=>!p.split('/').includes('.git')});
 const dist=join(destination,'dist');
 const disclaimer='Fictional planning illustration. Not a recorded execution, customer project, regulatory approval or production system.';
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>${esc(s.name)} — private Loom illustration</title><link rel="stylesheet" href="/fonts/fonts.css"><link rel="stylesheet" href="/illustration.css"></head><body><main class="illustration"><nav aria-label="Demo sections"><a href="/">← Recorded operations demo</a><a href="#artifacts">Example artifacts</a><form method="post" action="/logout"><button>End private session</button></form></nav><header><p class="eyebrow">Private · Open Finance planning illustration</p><h1>${esc(s.name)}: ${esc(s.question)}</h1><p>${esc(s.brief)}</p><p class="boundary">${disclaimer} The recorded operations demo is a separate scenario; its evidence does not validate this PFM/payment proposition.</p></header><section aria-labelledby="cycle"><h2 id="cycle">One intervention, from mandate to learning.</h2>${s.stages.map((stage,i)=>`<details${i===0?' open':''}><summary>${i+1}. ${esc(stage.name)} — ${esc(stage.title)}</summary><div class="detail"><p>${esc(stage.body)}</p>${list(stage.questions)}<p class="decision">${esc(stage.decision)}</p><p><strong>Artifact:</strong> ${esc(stage.output)}</p></div></details>`).join('')}</section><section><h2>Run / Operations → the next intervention</h2><p>${esc(s.operations)}</p></section><details><summary>What must be considered across the intervention</summary><div class="detail">${list(s.considerations)}</div></details><section id="artifacts"><h2>Three connected artifact excerpts</h2><p>Fictional values and decisions arranged around Loom artifact structures. No executed test results are claimed.</p><div class="artifacts">${s.artifacts.map(a=>`<article><p class="eyebrow">${esc(a.status)}</p><h3>${esc(a.title)}</h3>${list(a.lines)}<p>${esc(a.description)}</p></article>`).join('')}</div></section><section><h2>Domain grounding and source structures</h2><p>Requirements and deployed platform capabilities must be verified for the actual mandate.</p><ul>${s.sources.map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a></li>`).join('')}</ul></section></main></body></html>`;
 writeFileSync(join(dist,'illustration.html'),html);
 writeFileSync(join(dist,'illustration.css'),`*{box-sizing:border-box}body{margin:0;background:#f7f5ef;color:#2b2925;font:17px/1.7 'DM Sans',sans-serif}.illustration{max-width:1160px;margin:auto;padding:28px 32px 80px}nav{display:flex;gap:24px;align-items:center;flex-wrap:wrap;border-bottom:1px solid #bcb7aa;padding-bottom:24px}nav form{margin-left:auto}a{color:#a83614;text-underline-offset:4px}button{font:inherit;padding:10px 16px;background:transparent;border:1px solid #777;color:inherit;cursor:pointer}h1,h2,h3{font-family:'Instrument Serif',Georgia,serif;font-weight:400;line-height:1.15;color:#1b1b1b}h1{font-size:clamp(36px,5vw,60px);max-width:950px}h2{font-size:34px}h3{font-size:28px}header,section{padding:32px 0}.eyebrow{font:12px/1.7 'JetBrains Mono',monospace;text-transform:uppercase;color:#5f5b54}.boundary,.decision{border-left:3px solid #a83614;padding:18px;background:#e8e4db}.boundary{font-size:14px}details{border:1px solid #bcb7aa;margin:14px 0}summary{padding:20px;cursor:pointer;font-weight:600}.detail{padding:0 24px 24px}dl{display:grid;gap:18px}dl>div{border-top:1px solid #bcb7aa;padding-top:14px}dt{font-weight:600}dd{margin:8px 0 0}.artifacts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.artifacts article{border:1px solid #bcb7aa;padding:22px;font-size:15px}.artifacts h3{margin-top:20px}a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid #a83614;outline-offset:4px}@media(max-width:760px){.illustration{padding:20px}.artifacts{grid-template-columns:1fr}nav form{margin-left:0}.detail{padding:0 18px 18px}summary{padding:18px}}`);
 writeFileSync(join(dist,'index.html'),index.replace('<main id="main">','<main id="main"><aside class="section-head"><p><a href="/illustration.html">Explore the Open Finance planning illustration →</a><br>Fictional PFM/payment proposition · separate from the recorded operations evidence below.</p></aside>'));
 const changed=new Set(['dist/index.html','dist/release.json']);
 for(const [file,digest] of original){if(file.startsWith('.git/')||changed.has(file))continue;if(hash(readFileSync(join(destination,file)))!==digest)throw new Error('Base content changed: '+file);}
 const assets=entries(dist).filter(([p])=>p!=='release.json');
 writeFileSync(join(dist,'release.json'),JSON.stringify({...release,base_package_digest:release.package_digest,package_digest:hash(JSON.stringify(assets)),illustration:{authority:s.authority,scenario_sha256:hash(scenarioBytes),generator_sha256:hash(readFileSync(fileURLToPath(import.meta.url))),recorded_evidence_unchanged:true}},null,2)+'\n');
 return destination;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{if(process.argv.length!==5)throw new Error('Usage: node customer-demo-illustration.mjs <base-package> <private-scenario.json> <new-package>');console.log(addIllustration(...process.argv.slice(2)));}catch(e){console.error(e.message);process.exitCode=1;}}
