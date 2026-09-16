import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { addIllustration, EVIDENCE_STATUSES } from './customer-demo-illustration.mjs';
function fixture(t) {
 const root=mkdtempSync(join(tmpdir(),'illustration-test-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const base=join(root,'base');mkdirSync(join(base,'dist/evidence'),{recursive:true});
 for(const file of ['README.md','Dockerfile','server.mjs'])writeFileSync(join(base,file),'unchanged');
 writeFileSync(join(base,'dist/index.html'),'<main id="main"><p>Recorded evidence</p></main>');writeFileSync(join(base,'dist/release.json'),JSON.stringify({package_digest:'original',source_digest:'recorded'}));writeFileSync(join(base,'dist/evidence/record.json'),'actual-record');
 const scenario={schema:'loom.private-illustration/v1',authority:'fictional-editorial',name:'Sample <script>alert(1)</script>',question:'Question',brief:'Brief',operations:'Hypothetical',stages:['Discover','Define','Develop','Deliver'].map(name=>({name,title:'Title',body:'Body',output:'Output',decision:'Illustrative decision',questions:[['Question','Detail']]})),considerations:[['Scope','Pending']],artifacts:[1,2,3].map(()=>({title:'Artifact',status:'Pending',description:'No execution',lines:[['Field','Value']]})),sources:[{label:'Source',url:'https://example.com/'}]};
 const input=join(root,'private.json');writeFileSync(input,JSON.stringify(scenario));return {root,base,input,scenario,out:join(root,'out')};
}
test('adds an escaped, script-free companion without changing recorded evidence or gateway',t=>{
 const f=fixture(t);addIllustration(f.base,f.input,f.out);
 const html=readFileSync(join(f.out,'dist/illustration.html'),'utf8');assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script/);assert.match(html,/Not a recorded execution/);assert.match(html,/<details open>/);assert.match(readFileSync(join(f.out,'dist/index.html'),'utf8'),/href="\/illustration.html"/);
 assert.equal(readFileSync(join(f.out,'dist/evidence/record.json'),'utf8'),'actual-record');assert.equal(readFileSync(join(f.out,'server.mjs'),'utf8'),'unchanged');
 const release=JSON.parse(readFileSync(join(f.out,'dist/release.json')));assert.equal(release.source_digest,'recorded');assert.equal(release.base_package_digest,'original');assert.equal(release.illustration.recorded_evidence_unchanged,true);assert.match(release.illustration.scenario_sha256,/^[a-f0-9]{64}$/);
});
test('refuses non-editorial authority, unsafe links, overwrite and repeated layering',t=>{
 const f=fixture(t);f.scenario.authority='production';writeFileSync(f.input,JSON.stringify(f.scenario));assert.throws(()=>addIllustration(f.base,f.input,f.out),/editorial/);
 f.scenario.authority='fictional-editorial';f.scenario.sources[0].url='javascript:alert(1)';writeFileSync(f.input,JSON.stringify(f.scenario));assert.throws(()=>addIllustration(f.base,f.input,f.out),/HTTPS/);
 f.scenario.sources[0].url='https://example.com';writeFileSync(f.input,JSON.stringify(f.scenario));addIllustration(f.base,f.input,f.out);assert.throws(()=>addIllustration(f.base,f.input,f.out),/new destination/);assert.throws(()=>addIllustration(f.out,f.input,join(f.root,'repeat')),/already exists/);assert.throws(()=>addIllustration(f.base,f.input,join(f.base,'child')),/outside/);
});
test('the evidence legend is always rendered, artifacts carry a status chip, and an unknown status is refused',t=>{
 const f=fixture(t);f.scenario.artifacts[0].evidence_status='executed local check';f.scenario.artifacts[1].evidence_status='simulated provider';writeFileSync(f.input,JSON.stringify(f.scenario));addIllustration(f.base,f.input,f.out);
 const html=readFileSync(join(f.out,'dist/illustration.html'),'utf8');
 assert.match(html,/<section id="legend"/);for(const k of Object.keys(EVIDENCE_STATUSES))assert.ok(html.includes(`data-status="${k}"`),k);
 const chips=[...html.matchAll(/<article><p class="eyebrow">[^<]*<\/p><p><span class="chip" data-status="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(chips,['executed local check','simulated provider','fictional planning']);
 f.scenario.artifacts[2].evidence_status='verified by me';writeFileSync(f.input,JSON.stringify(f.scenario));assert.throws(()=>addIllustration(f.base,f.input,join(f.root,'bad')),/evidence_status must be one of/);
});
test('the presenter block renders the mandate and three role cards, and is validated',t=>{
 const f=fixture(t);f.scenario.presenter={mandate:'MERIDIAN-SOR-TECH-2026-04',opening:'You are the bank <b>',roles:[1,2,3].map(i=>({title:'Role '+i,holds:'authority',asks:'what must be true'}))};writeFileSync(f.input,JSON.stringify(f.scenario));addIllustration(f.base,f.input,f.out);
 const html=readFileSync(join(f.out,'dist/illustration.html'),'utf8');
 assert.match(html,/class="presenter"/);assert.match(html,/Mandate MERIDIAN-SOR-TECH-2026-04/);assert.match(html,/You are the bank &lt;b&gt;/);assert.equal((html.match(/<strong>Holds:<\/strong>/g)||[]).length,3);
 f.scenario.presenter.roles.pop();writeFileSync(f.input,JSON.stringify(f.scenario));assert.throws(()=>addIllustration(f.base,f.input,join(f.root,'bad')),/Three presenter roles/);
});
