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
// The evidence legend (docs/plans/kosli-founder-demo-briefing.md, change 2): every artifact excerpt
// carries one of these five statuses, shown where the claim appears; the legend itself is always
// rendered. An excerpt that names no status is fictional planning — the only status an editorial
// scenario may assume.
export const EVIDENCE_STATUSES = {
 'fictional planning':'authored decisions and values for the fictional case — nothing was executed',
 'executed local check':'a gate mechanism actually ran here against prepared fixtures',
 'recorded agent run':'a bounded agent task was run and its transcript and result were kept',
 'simulated provider':'the external record answered from a record-and-replay double, not a live organisation',
 'verified external record':'a live provider held the record and the read-back was checked on a dated run'
};
function validate(s) {
 if(s.schema!=='loom.private-illustration/v1'||s.authority!=='fictional-editorial')throw new Error('Fictional editorial authority required');
 if(s.presenter!==undefined){const p=s.presenter;if(!p||typeof p!=='object')throw new Error('Invalid presenter');for(const k of ['mandate','opening'])if(typeof p[k]!=='string'||!p[k].trim())throw new Error('Presenter needs '+k);if(!Array.isArray(p.roles)||p.roles.length!==3)throw new Error('Three presenter roles required');for(const r of p.roles){for(const k of ['title','holds','asks'])if(typeof r[k]!=='string'||!r[k].trim())throw new Error('Invalid presenter role');}}
 for(const k of ['name','question','brief','operations'])if(typeof s[k]!=='string'||!s[k].trim())throw new Error('Missing '+k);
 if(!Array.isArray(s.stages)||s.stages.length!==4)throw new Error('Four stages required');
 for(const stage of s.stages) { for(const k of ['name','title','body','output','decision'])if(typeof stage[k]!=='string')throw new Error('Invalid stage'); pairs(stage.questions); }
 pairs(s.considerations);
 if(!Array.isArray(s.artifacts)||s.artifacts.length!==3)throw new Error('Three artifact excerpts required');
 for(const a of s.artifacts){for(const k of ['title','status','description'])if(typeof a[k]!=='string')throw new Error('Invalid artifact');if(a.evidence_status!==undefined&&!Object.hasOwn(EVIDENCE_STATUSES,a.evidence_status))throw new Error('evidence_status must be one of: '+Object.keys(EVIDENCE_STATUSES).join(', '));pairs(a.lines);}
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
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>${esc(s.name)} — private Loom illustration</title><link rel="stylesheet" href="/fonts/fonts.css"><link rel="stylesheet" href="/illustration.css"></head><body><main class="illustration"><nav aria-label="Demo sections"><a href="/">← Recorded operations demo</a><a href="#artifacts">Example artifacts</a><form method="post" action="/logout"><button>End private session</button></form></nav><header><p class="eyebrow">Private · Open Finance planning illustration</p><h1>${esc(s.name)}: ${esc(s.question)}</h1><p>${esc(s.brief)}</p><p class="boundary">${disclaimer} The recorded operations demo is a separate scenario; its evidence does not validate this PFM/payment proposition.</p></header>${s.presenter?`<section class="presenter" aria-labelledby="presenter"><h2 id="presenter">You are Meridian's decision, not its audience.</h2><p class="eyebrow">Mandate ${esc(s.presenter.mandate)}</p><p>${esc(s.presenter.opening)}</p><div class="roles">${s.presenter.roles.map(r=>`<article><h3>${esc(r.title)}</h3><p><strong>Holds:</strong> ${esc(r.holds)}</p><p><strong>Asks before proceeding:</strong> ${esc(r.asks)}</p></article>`).join('')}</div></section>`:''}<section aria-labelledby="cycle"><h2 id="cycle">One intervention, from mandate to learning.</h2>${s.stages.map((stage,i)=>`<details${i===0?' open':''}><summary>${i+1}. ${esc(stage.name)} — ${esc(stage.title)}</summary><div class="detail"><p>${esc(stage.body)}</p>${list(stage.questions)}<p class="decision">${esc(stage.decision)}</p><p><strong>Artifact:</strong> ${esc(stage.output)}</p></div></details>`).join('')}</section><section><h2>Run / Operations → the next intervention</h2><p>${esc(s.operations)}</p></section><details><summary>What must be considered across the intervention</summary><div class="detail">${list(s.considerations)}</div></details><section id="legend" aria-labelledby="legend-h"><h2 id="legend-h">Evidence legend</h2><p>Every excerpt below carries one of these. The status is on the artifact where the claim is made, not only here.</p><dl class="legend">${Object.entries(EVIDENCE_STATUSES).map(([k,v])=>`<div><dt><span class="chip" data-status="${esc(k)}">${esc(k)}</span></dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section><section id="artifacts"><h2>Three connected artifact excerpts</h2><p>Fictional values and decisions arranged around Loom artifact structures. No executed test results are claimed unless an excerpt's status says so.</p><div class="artifacts">${s.artifacts.map(a=>{const st=a.evidence_status||'fictional planning';return `<article><p class="eyebrow">${esc(a.status)}</p><p><span class="chip" data-status="${esc(st)}">${esc(st)}</span></p><h3>${esc(a.title)}</h3>${list(a.lines)}<p>${esc(a.description)}</p></article>`}).join('')}</div></section><section><h2>Domain grounding and source structures</h2><p>Requirements and deployed platform capabilities must be verified for the actual mandate.</p><ul>${s.sources.map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a></li>`).join('')}</ul></section></main></body></html>`;
 writeFileSync(join(dist,'illustration.html'),html);
 writeFileSync(join(dist,'illustration.css'),`*{box-sizing:border-box}body{margin:0;background:#f7f5ef;color:#2b2925;font:17px/1.7 'DM Sans',sans-serif}.illustration{max-width:1160px;margin:auto;padding:28px 32px 80px}nav{display:flex;gap:24px;align-items:center;flex-wrap:wrap;border-bottom:1px solid #bcb7aa;padding-bottom:24px}nav form{margin-left:auto}a{color:#a83614;text-underline-offset:4px}button{font:inherit;padding:10px 16px;background:transparent;border:1px solid #777;color:inherit;cursor:pointer}h1,h2,h3{font-family:'Instrument Serif',Georgia,serif;font-weight:400;line-height:1.15;color:#1b1b1b}h1{font-size:clamp(36px,5vw,60px);max-width:950px}h2{font-size:34px}h3{font-size:28px}header,section{padding:32px 0}.eyebrow{font:12px/1.7 'JetBrains Mono',monospace;text-transform:uppercase;color:#5f5b54}.boundary,.decision{border-left:3px solid #a83614;padding:18px;background:#e8e4db}.boundary{font-size:14px}details{border:1px solid #bcb7aa;margin:14px 0}summary{padding:20px;cursor:pointer;font-weight:600}.detail{padding:0 24px 24px}dl{display:grid;gap:18px}dl>div{border-top:1px solid #bcb7aa;padding-top:14px}dt{font-weight:600}dd{margin:8px 0 0}.artifacts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.artifacts article{border:1px solid #bcb7aa;padding:22px;font-size:15px}.artifacts h3{margin-top:20px}.chip{display:inline-block;font:12px/1.6 'JetBrains Mono',monospace;text-transform:uppercase;padding:2px 10px;border:1px solid #5f5b54;border-radius:999px;color:#2b2925;background:#efece4}.chip[data-status='executed local check'],.chip[data-status='recorded agent run']{border-color:#1f5f3a;color:#1f5f3a;background:#e3efe7}.chip[data-status='simulated provider']{border-color:#8a5a00;color:#8a5a00;background:#f4ead6}.chip[data-status='verified external record']{border-color:#1d3f8a;color:#1d3f8a;background:#e2e8f6}.legend dt{font-weight:400}.presenter .roles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:20px}.presenter article{border:1px solid #bcb7aa;padding:22px;font-size:15px}.presenter article h3{margin-top:0}a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid #a83614;outline-offset:4px}@media(max-width:760px){.illustration{padding:20px}.artifacts,.presenter .roles{grid-template-columns:1fr}nav form{margin-left:0}.detail{padding:0 18px 18px}summary{padding:18px}}`);
 writeFileSync(join(dist,'index.html'),index.replace('<main id="main">','<main id="main"><aside class="section-head"><p><a href="/illustration.html">Explore the Open Finance planning illustration →</a><br>Fictional PFM/payment proposition · separate from the recorded operations evidence below.</p></aside>'));
 const changed=new Set(['dist/index.html','dist/release.json']);
 for(const [file,digest] of original){if(file.startsWith('.git/')||changed.has(file))continue;if(hash(readFileSync(join(destination,file)))!==digest)throw new Error('Base content changed: '+file);}
 const assets=entries(dist).filter(([p])=>p!=='release.json');
 writeFileSync(join(dist,'release.json'),JSON.stringify({...release,base_package_digest:release.package_digest,package_digest:hash(JSON.stringify(assets)),illustration:{authority:s.authority,scenario_sha256:hash(scenarioBytes),generator_sha256:hash(readFileSync(fileURLToPath(import.meta.url))),recorded_evidence_unchanged:true}},null,2)+'\n');
 return destination;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{if(process.argv.length!==5)throw new Error('Usage: node customer-demo-illustration.mjs <base-package> <private-scenario.json> <new-package>');console.log(addIllustration(...process.argv.slice(2)));}catch(e){console.error(e.message);process.exitCode=1;}}
