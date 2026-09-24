// The Loom console — the web UI. Renders ONLY from console.json (loom.console/v1), produced by
// src/data.mjs from a Loom installation. It has no write path: its actions are navigation, the role
// lens, and copying a file path. Served by `loom-console serve` or `loom-console build` output.
const D=globalThis.__LOOM_DATA__||await fetch('console.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('console.json: '+r.status);return r.json();});
const WF=globalThis.__LOOM_WF__||{};
const BUILD=globalThis.__LOOM_BUILD__||(D.repository.commit?`Built from ${D.repository.branch||'a checkout'} @ ${D.repository.commit.slice(0,7)}`:'');
const NOW=Date.parse(D.generated_at);
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const G=['D1','D2','D3','D4','D5','D6','D7','D8','D9'];
const STAGES=[['1','Signals','research'],['2','Synthesis','synthesis'],['3','Problem','problem'],['4','Data & risk','dataGov'],['5','Prototype','prototype'],['5b','Reaction','reaction'],['6','Hand-off','handoff']];
const STAGE_GATES={'1':['D2'],'2':['D5'],'3':['D1','D3','D4'],'4':['D6'],'5':['D7','D8'],'5b':['D9'],'6':[]};
const HUM=Object.fromEntries(D.identities.map(i=>[i.id,i]));
const holders=role=>D.identities.filter(i=>i.roles.includes(role));
const dn=id=>{const h=HUM[id];if(!h)return esc(id);const d=h.display&&!/^ADOPT/.test(h.display)?h.display:null;return d?`${esc(d)} <span class="mono cap">${esc(id)}</span>`:`<span class="mono">${esc(id)}</span>`;};
const fmtDate=s=>{if(!s)return '—';const d=new Date(s);return isNaN(d)?esc(s):d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});};
const daysTo=s=>Math.round((Date.parse(s)-NOW)/86400000);
const KLABEL={'record':'record','executed-check':'executed check','derived':'derived','telemetry':'telemetry'};
const prov=(s,label)=>s?`<button class="prov k-${s.kind}" data-copy="${esc(s.file)}" title="${esc(KLABEL[s.kind])} · ${esc(s.file)} — click to copy the path">${esc(label||KLABEL[s.kind])}</button>`:'';
const runs=D.runs;
const byStatus=st=>runs.filter(r=>r.status===st);
const STATUS={'handed-off':['Handed off','b-pos'],'stopped':['Stopped','b-none'],'awaiting-reaction':['Awaiting reaction','b-info'],'in-progress':['In progress','b-info'],'gate-failing':['Gate failing','b-crit']};
const statusBadge=r=>{const s=STATUS[r.status]||[r.status,'b-none'];return `<span class="badge ${s[1]}">${s[0]}</span>`;};
const gate=(r,id)=>r.gates.find(g=>g.id===id);

/* stage cell state, from the validator and the artifacts, nothing else */
function stageState(r,sid,art){
 const has=!!r.artifacts[art];
 const gs=STAGE_GATES[sid].map(id=>gate(r,id)).filter(Boolean);
 if(r.status==='stopped'&&!has)return 's';
 if(!has)return r.stage.id===sid?'c':'t';
 if(gs.some(g=>g.status==='fail'&&g.reached))return 'f';
 if(gs.some(g=>g.status==='fail'))return 'c';
 return 'd';
}
function track(r){let h='<span class="track" title="Stages 1 → 6, then delivery">';for(const [sid,,art] of STAGES){const s=stageState(r,sid,art);h+='<i class="'+(s==='t'?'':s)+'"></i>';}h+='<b></b><i class="r'+(r.status==='handed-off'?' c':'')+'" title="Delivery"></i></span>';return h;}
const passCount=r=>r.gates.filter(g=>g.status==='pass').length;
const failReached=r=>r.gates.filter(g=>g.status==='fail'&&g.reached).length;
const failUnreached=r=>r.gates.filter(g=>g.status==='fail'&&!g.reached).length;
function gateChips(r){return G.map(id=>{const g=gate(r,id);const c=g.status==='pass'?'p':g.status==='fail'?(g.reached?'x':'w'):'';return `<span class="gate ${c}" title="${esc(g.id+' '+g.name+' · '+g.status+(g.status==='fail'&&!g.reached?' (stage not reached)':'')+(g.issues.length?' · '+g.issues.join('; '):''))}">${id}${g.status==='fail'&&!g.reached?'·nr':''}</span>`;}).join('');}

/* ---------- roles: registry roles, humans who hold them, and the HG decision behind each ---------- */
const HG=Object.fromEntries((D.control_catalog?.governance||[]).map(h=>[h.id,h]));
const hgCite=id=>HG[id]?`<span class="mono" style="color:var(--bone-0)">${id}</span> ${esc(HG[id].objective.split(';')[0].split(':')[0])} <span class="badge ${HG[id].state==='mechanically-validated'?'b-pos':HG[id].state==='defined'?'b-cau':'b-crit'}">${HG[id].state}</span>`:id;
const ROLES={
 all:{label:'Everyone',sub:'nothing emphasised',home:'overview',views:[],reg:[]},
 exec:{label:'Accountable executive',sub:'funds change, can stop it',reg:['accountable-executive'],home:'overview',views:['overview'],hg:'HG-0010',
  qs:[['Is discovery effort going where our strategy says?','Portfolio by strategic intent','overview'],['What have I approved, and on what conditions?','cross-bank-money · PA1 decision','run:cross-bank-money'],['How mature are the controls, honestly?','Control maturity','overview']],
  gap:'Not here yet: cost of change and value delivered. The business case and the token ledger are in the method, not in this console.'},
 programme:{label:'Loom programme owner',sub:'not a registry role',reg:[],home:'overview',views:['overview','runs'],hg:'HG-0007',
  qs:[['Where is every run, and what is stuck?','Runs across the double diamond','overview'],['Who is each item waiting on, and for how long?','Needs attention · owner and age','overview'],['Are the gates doing the work?','Gate states per run','runs']],
  gap:'The identity registry has no programme-owner role. Oversight here is read-only; if Meridian wants this role accountable for anything, it belongs in the registry first.'},
 product:{label:'Product owner',sub:'owns runs',reg:['product-owner'],home:'runs',views:['runs','run'],hg:'HG-0007',owner:true,
  qs:[['Where are my runs?','Discovery runs, filtered to you','runs'],['Is there a prototype, and where is the PRD?','Run detail · prototype and hand-off','run:first'],['What happens next, and who am I waiting on?','Run detail · next step','run:first']],
  gap:'Not here yet: authoring. You write on the floor or with the facilitator, never in this view.'},
 risk:{label:'Second line · DPO · compliance',sub:'risk-second-line, data-protection, compliance',reg:['risk-second-line','data-protection','compliance','credit-risk','legal'],home:'overview',views:['overview','brain','run'],hg:'HG-0001',
  qs:[['Which risks have no control?','Needs attention · uncovered risk','overview'],['What is waiting on my signature, and how long?','Needs attention · approval queue','overview'],['Do our obligations resolve, and are they verified?','The brain · obligations','brain']],
  gap:'Not here yet: the NPA committee pack (PA1/PA2) as its own view.'},
 context:{label:'Institutional context owner',sub:'owns the BrainKit',reg:['institutional-context-owner'],home:'brain',views:['brain'],
  qs:[['Is the BrainKit approved, sealed and current?','BrainKit sections and brainkit-check','brain'],['Which intents are pursued, and by which runs?','Strategic intents','brain'],['What on the radar is due?','Technology radar','brain']],
  decide:'A BrainKit change is re-versioned, resealed and approved by you in git; brainkit-check refuses anything else.',
  gap:'Not here yet: a diff between BrainKit versions.'},
 platform:{label:'Platform admin · CIO',sub:'owns what is installed',reg:['platform-admin','information-security','enterprise-architect'],home:'install',views:['install'],hg:'HG-0002',
  qs:[['What did we install, and what is switched on?','Installation · version, tier, seams','install'],['Which guardrails run on every change?','Hooks and CI steps','install'],['What is not stood up yet?','Factory Floor · residency record','install']],
  gap:'Not here yet: runtime controls in production. The Loom is a build-time frame.'},
 facilitator:{label:'Facilitator',sub:'the one at the machine',reg:['engineering','solution-architect'],home:'runs',views:['runs','run'],
  qs:[['What do I run next, and for whom?','Your queue','runs'],['Which gate result do I read back?','A failing gate, in full','run:blocked'],['Is each reaction still bound to its prototype?','Integrity checks','overview']],
  decide:'You own the record, not the content, and you merge nothing you authored.',
  gap:'Not here yet: a live terminal. Commands stay in your terminal; the console shows the author the same state.'},
 audit:{label:'Internal audit · model risk',sub:'internal-audit, model-validator',reg:['internal-audit','model-validator'],home:'overview',views:['overview','brain'],hg:'HG-0006',
  qs:[['What happened, when, and who decided?','The record trail','overview'],['Can I trust this page?','Every fact is tagged; generated, not written','overview'],['Which runs carry a model?','Model-bearing runs','run:model']],
  gap:'Not here yet: the per-change evidence bundle and its external record, which live in the delivery half.'}
};
let role='all', poId=null, curRun=runs[0]?.slug, runFilter='all', showAll=false;
try{const r=localStorage.getItem('loom-role');if(r&&ROLES[r])role=r;const p=localStorage.getItem('loom-po');if(p)poId=p;}catch(e){}
const POS=holders('product-owner').map(h=>h.id);
if(!poId||!POS.includes(poId))poId=POS[0];
const roleOfRegistry=r=>Object.entries(ROLES).filter(([k,R])=>R.reg&&R.reg.includes(r)).map(([k])=>k);

/* ---------- attention: every item is computed from the data; nothing is typed in ---------- */
function attention(){
 const A=[];
 for(const r of byStatus('gate-failing'))for(const id of r.blocked_by){const g=gate(r,id);A.push({sev:'crit',t:`${r.slug} fails ${id} ${g.name}.`,b:esc(g.issues[0]||''),o:dn(r.sponsor?.id),roles:['programme','facilitator',...(r.sponsor?.id===poId?['product']:[])],sponsor:r.sponsor?.id,src:r.gates_source,btn:['Open run',`data-run="${r.slug}"`]});}
 for(const r of runs.filter(x=>x.status!=='stopped'))for(const u of (r.data_governance?.uncovered||[]))A.push({sev:'crit',t:`Uncovered risk in ${r.slug}.`,b:esc(u.replace(/`/g,'')),o:holders('risk-second-line').map(h=>dn(h.id)).join(', ')||'risk-second-line',roles:['risk','exec','programme'],src:r.data_governance.source,btn:['Open run',`data-run="${r.slug}"`]});
 const byChange={};for(const x of D.approvals.rows){(byChange[x.change_id+' '+x.stage]||=[]).push(x);}
 for(const [k,rows] of Object.entries(byChange)){const x=rows[0];const br=rows.filter(y=>y.breached).length;const nobody=rows.filter(y=>!y.holders.length).map(y=>y.role);
  A.push({sev:br?'cau':'info',agg:true,t:`${k} waits on ${rows.length} approver roles for ${x.age_days} days.`,b:`${br} past their SLA target. ${nobody.length?'No human holds '+nobody.join(', ')+'. ':''}Telemetry from approval-status: it flags, it never blocks.`,o:rows.map(y=>esc(y.role)).join(', '),roles:['programme','exec'],src:D.approvals.source,btn:['Queue','data-v="install"']});
  for(const y of rows){const mapped=roleOfRegistry(y.role);if(mapped.length)A.push({sev:y.breached?'cau':'info',t:`${y.change_id} ${y.stage} waits on your ${y.role} decision: ${y.age_days} days.`,b:`Target ${y.target_days} days${y.breached?', breached':''}. Telemetry: it flags, it never blocks.`,o:y.holders.map(dn).join(', ')||'no human holds '+esc(y.role),roles:mapped,perRole:true,src:D.approvals.source,btn:['Installation','data-v="install"']});}}
 for(const r of byStatus('awaiting-reaction'))A.push({sev:'cau',t:`${r.slug}: prototype built, no reaction recorded.`,b:`D9 stays open until the named roles record a verdict on ${r.hypotheses.map(h=>h.id).join(' and ')}.`,o:dn(r.sponsor?.id),roles:['programme','facilitator',...(r.sponsor?.id===poId?['product']:[]),...(r.product_profile?.id==='ai-decision-system'?['audit']:[])],sponsor:r.sponsor?.id,src:r.gates_source,btn:['Open run',`data-run="${r.slug}"`]});
 for(const r of runs)if(r.npa&&r.npa.conditions.length)A.push({sev:'cau',t:`${r.slug}: ${r.npa.receipt} approved with ${r.npa.conditions.length} conditions.`,b:`No record in the tree shows any condition met. Valid until ${fmtDate(r.npa.valid_until)}.`,o:dn(r.npa.approved_by),roles:['exec','risk'],src:r.npa.source,btn:['Open run',`data-run="${r.slug}"`]});
 const pend=D.registers.obligations.filter(o=>o.article_status==='owner-verification-pending');
 if(pend.length)A.push({sev:'cau',t:`${pend.length} obligations name a source and leave the article to their owner.`,b:esc(pend.map(o=>o.id).join(' · ')),o:[...new Set(pend.map(o=>o.owner_role))].join(', '),roles:['risk','context','audit'],src:D.registers.obligations_source,btn:['See register','data-go="brain"']});
 const stand=D.registers.obligations.filter(o=>o.article_status==='demo-stand-in');
 if(stand.length)A.push({sev:'info',t:`${stand.length} template obligations carry a demo stand-in citation.`,b:'The demo writes "demo fixture" over the template articles, the way the CI dry-run stands in for compliance. A real adoption cites each article.',o:'compliance',roles:['risk','audit'],src:D.registers.obligations_source,btn:['See register','data-go="brain"']});
 for(const e of (D.brainkit?.radar||[]))if(e.review_by&&daysTo(e.review_by)<=30)A.push({sev:daysTo(e.review_by)<0?'crit':'cau',t:`Radar review ${daysTo(e.review_by)<0?'overdue':'due in '+daysTo(e.review_by)+' days'}: ${esc(e.technology)}.`,b:`Ring: ${e.ring}.`,o:dn(e.owner),roles:['context','platform'],src:D.brainkit.source,btn:['Open radar','data-go="brain"']});
 const seats=D.identities.filter(i=>/^ADOPT/.test(i.display||'')&&i.roles.some(r=>r.startsWith('shariah')));
 const isl=runs.filter(r=>r.product_profile?.id==='islamic-product');
 if(seats.length&&isl.length)A.push({sev:'cau',t:`${seats.length} Shari'ah seats are still placeholders.`,b:`${isl.map(r=>r.slug).join(', ')} runs under islamic-product, whose approvals route to the Shari'ah committee. The registry names nobody yet.`,o:'institutional-context-owner, shariah-compliance',roles:['risk','context','audit'],src:{file:'docs/governance/identities.json',kind:'record'},btn:['Open run',`data-run="${isl[0].slug}"`]});
 if(D.installation.floor_blocked_by)A.push({sev:'info',t:'The Factory Floor is not stood up.',b:esc(D.installation.floor_blocked_by)+'. Authors work with the facilitator until data protection and second line sign it.',o:holders('platform-admin').map(h=>dn(h.id)).join(', '),roles:['platform','programme'],src:D.installation.source,btn:['Installation','data-v="install"']});
 return A;
}
const ATT=attention();
const DOT={crit:'var(--critical)',cau:'var(--caution)',info:'var(--bone-3)'};
const attRow=a=>`<div class="att"><span class="dia" style="background:${DOT[a.sev]}"></span><div><b>${a.t}</b> <span class="muted">${a.b}</span><div class="cap" style="margin-top:3px">Owner: ${a.o} ${prov(a.src)}</div></div><button class="btn" ${a.btn[1]}>${a.btn[0]}</button></div>`;
const mineAtt=()=>role==='all'?ATT.filter(a=>!a.perRole):ATT.filter(a=>a.roles.includes(role));
function attList(){
 if(role==='all')return mineAtt().map(attRow).join('');
 const mine=mineAtt(),rest=ATT.filter(a=>!mine.includes(a)&&!a.perRole);
 return (mine.length?mine.map(attRow).join(''):'<p class="cap">Nothing is waiting on this role.</p>')+(rest.length?`<details class="more"><summary>${rest.length} more for other roles</summary>${rest.map(attRow).join('')}</details>`:'');
}

/* ---------- banner ---------- */
function banner(){
 if(role==='all')return '';const R=ROLES[role];
 const go=t=>{if(t==='run:first'){const r=runs.find(x=>x.sponsor?.id===poId);return `data-run="${r?r.slug:runs[0].slug}"`;}if(t==='run:blocked'){const r=byStatus('gate-failing')[0]||runs[0];return `data-run="${r.slug}"`;}if(t==='run:model'){const r=runs.find(x=>x.product_profile?.id==='ai-decision-system')||runs[0];return `data-run="${r.slug}"`;}if(t.startsWith('run:'))return `data-run="${t.slice(4)}"`;return `data-go="${t}"`;};
 const people=R.reg.length?R.reg.map(rg=>{const hs=holders(rg);return `<span class="chip">${rg}</span> ${hs.length?hs.map(h=>dn(h.id)).join(', '):'<span class="cap">no human holds it</span>'}`;}).join('<br>'):'<span class="cap">No registry role maps to this persona.</span>';
 const po=R.owner?`<div class="row" style="margin-top:6px;gap:8px"><label class="label" for="poPick">Which product owner</label><select class="po" id="poPick">${POS.map(p=>`<option value="${p}" ${p===poId?'selected':''}>${esc(HUM[p]?.display||p)}</option>`).join('')}</select></div>`:'';
 return `<section class="banner" aria-label="Role lens"><div class="stack"><span class="label" style="color:var(--ember-300)">Viewing as</span><h2>${R.label}</h2>${po}<div style="font-size:13.5px;line-height:1.9">${people}</div><div style="font-size:13px;color:var(--bone-1);border-top:1px solid rgba(230,92,45,.3);padding-top:8px"><span class="label">Where you decide</span><div style="margin-top:4px">${R.hg?hgCite(R.hg)+'<div class="cap" style="margin-top:4px">Decisions are signed records in git, merged by a second person. This console has no approve button.</div>':esc(R.decide||'')}</div></div></div>
 <div class="stack"><span class="label">What you are looking for · where the console answers it</span><div class="qs">${R.qs.map(q=>`<div class="q"><div>${q[0]}<div class="cap" style="margin-top:2px">${q[1]}</div></div><button class="btn" ${go(q[2])}>Show me</button></div>`).join('')}</div><p class="gap">${R.gap}</p></div></section>`;
}

/* ================= VIEWS ================= */
const VIEWS={};
VIEWS.overview=()=>{
 const cc=D.control_catalog;const bk=D.brainkit;
 const cols=[...STAGES.map(s=>[s[0],s[1]]),['→','Delivery']];
 const byCol=cols.map(()=>[]);
 for(const r of runs){let i=STAGES.findIndex(s=>s[0]===r.stage.id);if(i<0)i=0;byCol[i].push(r);}
 const pend=D.registers.obligations.filter(o=>o.article_status==='owner-verification-pending').length;
 const breached=D.approvals.rows.filter(x=>x.breached).length;
 const rel=D.integrity;const intOk=!rel.unresolved_sponsors.length&&!rel.unresolved_intents.length&&!rel.unresolved_profiles.length&&!rel.stale_reactions.length;
 return `
 <div class="vh"><div><span class="label">Overview</span><h1 style="margin-top:6px">What the Loom knows, and <em>where every idea stands.</em></h1><p>Generated from the repository by <span class="mono">${esc(D.generator)}</span>. Every fact carries its source; click a tag to copy the path.</p></div></div>

 <div class="honest" data-for="exec audit platform risk programme">
  <div class="row sp"><div><span class="label">Control maturity · the method's own grade</span><h3 style="margin-top:6px;font-size:24px">${cc.counts['mechanically-validated']} of ${cc.total} controls are mechanically validated. <em style="font-style:italic;color:var(--ember-500)">None is platform- or organisationally enforced yet.</em></h3></div>${prov(cc.source)}</div>
  <div class="ladder">${cc.ladder.map(s=>`<div class="${cc.counts[s]?'':'z'}"><span class="label">${s.replace(/-/g,' ')}</span><b>${cc.counts[s]}</b></div>`).join('')}</div>
  <p class="cap" style="margin-top:10px">The Loom is proven on a demo, not in production. It is a build-time frame; live IAM, platform enforcement and the institution's control functions are Meridian's to stand up. This strip moves right only when evidence of enforcement is recorded.</p>
 </div>

 <div class="grid g4">
  <div class="stat" data-for="context exec audit"><span class="label">Brain · BrainKit</span><span class="big">${bk?bk.sections.length:0}<small> sections</small></span><span class="cap">v${esc(bk?.version)} · ${esc(bk?.status)} · ${bk?.check?.ok?'brainkit-check passes':'brainkit-check fails'}</span><div class="row">${prov(bk?.source)} ${prov(bk?.check?.source)}</div></div>
  <div class="stat" data-for="risk exec audit"><span class="label">Regulated context</span><span class="big">${D.registers.obligations.length}</span><span class="cap">obligations · ${D.registers.risk_categories.length} risk categories · ${D.registers.controls.length} controls · ${pend} awaiting owner verification</span><div class="row">${prov(D.registers.obligations_source)}</div></div>
  <div class="stat" data-for="programme exec product facilitator"><span class="label">Discovery runs</span><span class="big">${runs.length}</span><span class="cap num">${byStatus('in-progress').length+byStatus('awaiting-reaction').length} in progress · ${byStatus('gate-failing').length} failing · ${byStatus('handed-off').length} handed off · ${byStatus('stopped').length} stopped</span><div class="row">${prov(runs[0]?.gates_source,'validator ran on each')}</div></div>
  <div class="stat" data-for="programme exec risk"><span class="label">Approvals waiting</span><span class="big">${D.approvals.rows.length}</span><span class="cap">${breached} past their SLA target · oldest ${Math.max(0,...D.approvals.rows.map(x=>x.age_days))} days</span><div class="row">${prov(D.approvals.source)}</div></div>
 </div>

 <div class="card" data-for="programme exec product facilitator" style="margin-top:16px;background:var(--ink-1)">
  <div class="row sp" style="margin-bottom:12px"><h3>Runs across the double diamond</h3><span class="cap">Where the gates put each run · click to open</span></div>
  <div class="pipe-wrap"><div class="pipe">
   ${cols.map((c,i)=>`<div class="${i===6?'waist':''}"><div class="ph"><span class="label">${c[0]==='→'?'right diamond':'stage '+c[0]}</span><b>${c[1]}</b></div>${byCol[i].map(r=>`<button class="pcard" data-run="${r.slug}"><span class="mono" style="color:var(--bone-0)">${r.slug}</span>${statusBadge(r)}</button>`).join('')||'<span class="cap">—</span>'}</div>`).join('')}
  </div></div>
 </div>

 <div class="grid g-7-5" style="margin-top:16px">
  <div class="card" data-for="programme risk exec product facilitator context platform audit">
   <div class="row sp" style="margin-bottom:10px"><h3>Needs attention</h3><span class="cap">${ATT.filter(a=>!a.perRole).length} items, each computed from the record · ${role==='all'?'each names who acts':mineAtt().length+' for this role'}</span></div>
   <div>${attList()}</div>
  </div>
  <div class="stack" style="gap:16px">
   <div class="card" data-for="facilitator audit programme">
    <div class="row sp" style="margin-bottom:8px"><h3>Integrity checks</h3><span class="badge ${intOk?'b-pos':'b-crit'}">${intOk?'all clear':'findings'}</span></div>
    ${[['Every run sponsor is a human in the identity registry',rel.unresolved_sponsors],['Every strategic intent resolves in the BrainKit',rel.unresolved_intents],['Every product profile exists',rel.unresolved_profiles],['Every reaction is bound to the prototype on disk',rel.stale_reactions]].map(([t,l])=>`<div class="kv"><div class="l"><span>${t}</span>${l.length?`<span class="dig" style="color:var(--critical-text)">${esc(l.join(' · '))}</span>`:''}</div><span class="badge ${l.length?'b-crit':'b-pos'}">${l.length?l.length+' found':'holds'}</span></div>`).join('')}
    <div style="margin-top:8px">${prov({file:D.generator,kind:'derived'})}</div>
   </div>
   <div class="card" data-for="exec programme context">
    <div class="row sp" style="margin-bottom:6px"><h3>Portfolio by strategic intent</h3>${prov(bk?.source,'strategy.md')}</div>
    ${(bk?.intents||[]).map(it=>{const rs=runs.filter(r=>r.strategic_intent?.id===it.id);return `<div class="intent-row" style="grid-template-columns:1fr"><div><span class="mono" style="color:${it.pursued?'var(--ember-300)':'var(--bone-3)'};font-size:12px">${it.id}</span> <span style="color:${it.pursued?'var(--bone-0)':'var(--bone-2)'};font-size:14px">${esc(it.intent)}</span></div><div class="runs">${rs.length?rs.map(r=>`<button class="irun" data-run="${r.slug}">${track(r)} ${r.slug}</button>`).join(''):`<span class="cap">${it.pursued?'no run tests this intent yet':'parked: no run, as the strategy intends'}</span>`}</div></div>`;}).join('')}
   </div>
  </div>
 </div>

 <div class="card" data-for="audit risk context" style="margin-top:16px">
  <div class="row sp" style="margin-bottom:10px"><h3>The record trail</h3><span class="cap">only dated events that exist in the tree · oldest first</span></div>
  <div class="trail">${D.trail.map(e=>`<div class="tr" style="grid-template-columns:96px auto 1fr"><span class="d">${e.at?fmtDate(e.at):'bound'}</span>${e.kind==='decision'||e.kind==='approval'?'<span class="sq" style="background:var(--bone-1)"></span>':e.kind==='binding'?'<span class="dia" style="background:var(--positive)"></span>':'<span class="sq" style="border:1.5px solid var(--bone-2)"></span>'}<div>${e.actor?dn(e.actor)+' · ':''}${esc(e.what)} ${prov(e.source)}${e.detail?`<div class="dig" style="margin-top:2px">${esc(e.detail)}</div>`:''}</div></div>`).join('')}</div>
 </div>`;
};

VIEWS.brain=()=>{
 const bk=D.brainkit,R=D.registers;
 const runsCiting=id=>runs.filter(r=>(r.data_governance?.obligations||[]).includes(id)).map(r=>r.slug);
 const ast={'owner-verification-pending':['owner to verify','b-cau'],'demo-stand-in':['demo stand-in','b-none'],'cited':['cited','b-pos'],'missing':['missing','b-crit']};
 return `
 <div class="vh"><div><span class="label">The brain</span><h1 style="margin-top:6px">What is loaded, <em>who owns it,</em> and which runs read it.</h1><p>Three kinds of context, each a versioned file in the repository with a named owner. Agents read it; they never write it.</p></div>
 <div class="row">${bk?.check?`<span class="badge ${bk.check.ok?'b-pos':'b-crit'}">${esc(bk.check.summary)}</span>${prov(bk.check.source)}`:''}</div></div>
 <div class="grid g3">
  <section class="dim" data-for="context audit">
   <div class="dim-h"><span class="label">Dimension 1 · institutional DNA</span><h3>BrainKit <span class="mono" style="font-size:14px;color:var(--bone-3)">v${esc(bk?.version)}</span></h3><div class="row"><span class="badge b-pos">${esc(bk?.status)}</span>${prov(bk?.source)}</div>
    <div class="cap">package ${esc((bk?.package_digest||'').slice(0,19))}…</div></div>
   <div class="dim-b">
    ${(bk?.sections||[]).map(b=>`<div class="kv"><div class="l"><span>${esc(b.section)}</span><span class="dig">${esc(b.path)} · ${esc(b.digest.slice(0,15))}… · owner ${esc(bk.owners[b.section]||'—')}</span></div><span class="badge b-pos">sealed</span></div>`).join('')}
    <div class="kv"><div class="l"><span>Approvals</span><span class="dig">${(bk?.approvals||[]).map(a=>`${a.version} by ${a.by} on ${a.at}`).join(' · ')}</span></div><span class="cap num">${(bk?.approvals||[]).length}</span></div>
   </div>
  </section>
  <section class="dim" data-for="risk audit">
   <div class="dim-h"><span class="label">Dimension 2 · regulated context</span><h3>Register &amp; obligations</h3><div class="row">${prov(R.source)}${prov(R.obligations_source)}</div></div>
   <div class="dim-b">
    <div class="kv"><div class="l"><span>Risk categories</span><span class="dig">${R.risk_categories.map(c=>c.id).join(' · ')}</span></div><span class="mono num">${R.risk_categories.length}</span></div>
    <div class="kv"><div class="l"><span>Risk statements</span><span class="dig">${R.risks.map(c=>c.id+' '+(c.inherent||'')+'→'+(c.residual||'')).join(' · ')}</span></div><span class="mono num">${R.risks.length}</span></div>
    <div class="kv"><div class="l"><span>Controls</span><span class="dig">${R.controls.map(c=>c.id).join(' · ')}</span></div><span class="mono num">${R.controls.length}</span></div>
    <div class="kv"><div class="l"><span>Uncovered risks named by runs</span><span class="dig">${runs.flatMap(r=>(r.data_governance?.uncovered||[]).map(()=>r.slug)).join(' · ')||'none'}</span></div><span class="badge ${runs.some(r=>r.data_governance?.uncovered?.length)?'b-crit':'b-pos'}">${runs.reduce((n,r)=>n+(r.data_governance?.uncovered?.length||0),0)}</span></div>
   </div>
  </section>
  <section class="dim" data-for="context platform risk">
   <div class="dim-h"><span class="label">Dimension 3 · solution domains</span><h3>Product profiles</h3><div class="row"><span class="cap">${D.product_profiles.length} profiles installed</span>${prov({file:'profiles/products',kind:'record'})}</div></div>
   <div class="dim-b">
    ${D.product_profiles.map(p=>{const n=runs.filter(r=>r.product_profile?.id===p).length;return `<div class="kv"><div class="l"><span>${esc(p)}</span></div><span class="cap num">${n} run${n===1?'':'s'}</span></div>`;}).join('')}
   </div>
  </section>
 </div>

 <div class="card" data-for="risk audit context" style="margin-top:16px">
  <div class="row sp" style="margin-bottom:10px"><h3>Obligations</h3>${prov(R.obligations_source)}</div>
  <div class="tbl-wrap"><table><thead><tr><th>Obligation</th><th>Owner role</th><th>Held by</th><th>Last verified</th><th>Citation</th><th>Cited by runs</th></tr></thead>
  <tbody>${R.obligations.map(o=>`<tr><td><span class="mono" style="font-size:12px;color:var(--bone-0)">${esc(o.id)}</span><div class="cap">${esc(o.source||'')}</div></td><td class="mono" style="font-size:12px">${esc(o.owner_role)}</td><td>${holders(o.owner_role).map(h=>dn(h.id)).join(', ')||'<span class="cap">nobody</span>'}</td><td class="cap num">${esc(o.last_verified||'—')}</td><td><span class="badge ${ast[o.article_status][1]}">${ast[o.article_status][0]}</span></td><td class="cap">${runsCiting(o.id).join(', ')||'—'}</td></tr>`).join('')}</tbody></table></div>
 </div>

 <div class="grid g2" style="margin-top:16px">
  <div class="card" data-for="context exec">
   <div class="row sp" style="margin-bottom:8px"><h3>Strategic intents</h3>${prov({file:'institution/brainkit/strategy.md',kind:'record'})}</div>
   ${(bk?.intents||[]).map(i=>{const n=runs.filter(r=>r.strategic_intent?.id===i.id);return `<div class="kv"><div class="l"><span><span class="mono" style="color:var(--bone-3)">${i.id}</span> ${esc(i.intent)}</span><span class="dig">${i.pursued?esc(i.owner_role)+' · measure: '+esc(i.measure):esc(i.rationale)} · cited by ${n.length} run${n.length===1?'':'s'}</span></div><span class="badge ${i.pursued?'b-pos':'b-none'}">${i.pursued?'pursued':'parked'}</span></div>`;}).join('')}
  </div>
  <div class="card" data-for="context platform">
   <div class="row sp" style="margin-bottom:8px"><h3>Technology radar</h3>${prov({file:'institution/brainkit/technology-policy.json',kind:'record'})}</div>
   ${(bk?.radar||[]).map(e=>{const d=e.review_by?daysTo(e.review_by):null;return `<div class="kv"><div class="l"><span>${esc(e.technology)}</span><span class="dig">${e.review_by?'review by '+fmtDate(e.review_by)+' · '+(d<0?Math.abs(d)+' days overdue':'in '+d+' days'):'no review date'} · owner ${esc(e.owner)}</span></div><span class="badge ${e.ring==='hold'?'b-crit':e.ring==='trial'?'b-cau':'b-info'}">${esc(e.ring)}</span></div>`;}).join('')}
  </div>
 </div>

 <div class="card" data-for="context audit programme" style="margin-top:16px">
  <div class="row sp" style="margin-bottom:12px"><div><h3>Which runs read which context</h3><p class="cap" style="margin-top:4px">What each run cites, resolved against the brain. The start of a context index.</p></div>${prov({file:D.generator,kind:'derived'})}</div>
  <div class="tbl-wrap"><table class="matrix"><thead><tr><th>Run</th><th>Intent</th><th>Profile</th><th>Risks cited</th><th>Controls</th><th>Obligations</th><th>Brand (D7)</th></tr></thead>
  <tbody>${runs.map(r=>{const dg=r.data_governance;return `<tr class="click" data-run="${r.slug}"><td class="mono" style="font-size:12.5px">${r.slug}</td><td class="mono" style="font-size:12px">${r.strategic_intent?r.strategic_intent.id+(r.strategic_intent.resolves?'':' ✗'):'—'}</td><td class="mono" style="font-size:12px">${r.product_profile?.id||'—'}</td><td class="num">${dg?dg.risks.filter(x=>/-\d{3}$/.test(x)).length:'<span class="cap">not yet</span>'}</td><td class="num">${dg?dg.controls.length:'<span class="cap">not yet</span>'}</td><td class="num">${dg?dg.obligations.length:'<span class="cap">not yet</span>'}</td><td><span class="cell ${gate(r,'D7').status==='pass'?'y':'n'}"></span></td></tr>`;}).join('')}</tbody></table></div>
 </div>`;
};

VIEWS.runs=()=>{
 const R=ROLES[role];const mineOnly=R.owner&&!showAll;const base=mineOnly?runs.filter(r=>r.sponsor?.id===poId):runs;
 const list=base.filter(r=>runFilter==='all'||r.status===runFilter);
 const fb=(k,l)=>{const n=k==='all'?base.length:base.filter(r=>r.status===k).length;return n||k==='all'?`<button class="chip" data-filter="${k}" aria-pressed="${runFilter===k}">${l} · ${n}</button>`:'';};
 return `
 <div class="vh"><div><span class="label">Discovery runs</span><h1 style="margin-top:6px">Every idea, its stage, <em>its prototype and its PRD.</em></h1><p>Stage and status are derived from which artifacts exist and what the D1–D9 validator returned when this page was generated. In the Loom the PRD is the hand-off record: a run has one only when all nine gates pass.</p></div></div>
 ${R.owner?`<div class="row" style="margin-bottom:10px;gap:10px"><span class="badge b-ember">${mineOnly?`${base.length} runs sponsored by ${esc(HUM[poId]?.display||poId)}`:'all '+runs.length+' runs'}</span><button class="btn" data-owners="1">${mineOnly?'Show all '+runs.length:'Show only mine'}</button></div>`:''}
 <div class="row sp" style="margin-bottom:12px">
  <div class="chips">${fb('all','All')}${fb('in-progress','In progress')}${fb('awaiting-reaction','Awaiting reaction')}${fb('gate-failing','Gate failing')}${fb('handed-off','Handed off')}${fb('stopped','Stopped')}</div>
  <span class="cap">Gate chip ·nr = fails because the stage is not reached yet</span>
 </div>
 <div data-for="programme product facilitator exec"><div class="tbl-wrap"><table>
  <thead><tr><th>Run</th><th>Stage</th><th>Gates (validator)</th><th>Prototype</th><th>PRD / outcome</th><th>Status</th><th>Sponsor</th></tr></thead>
  <tbody>${list.map(r=>`<tr class="click" data-run="${r.slug}">
   <td><div class="mono" style="color:var(--bone-0);font-size:12.5px">${r.slug}</div><div class="cap">${esc(r.title)}</div></td>
   <td>${track(r)}<div class="cap" style="margin-top:4px">stage ${r.stage.id} · ${r.stage.name}</div></td>
   <td><span class="mono num" style="font-size:12.5px">${passCount(r)} pass</span><div class="cap num">${failReached(r)?failReached(r)+' failing · ':''}${failUnreached(r)} not reached</div></td>
   <td>${r.prototype?'<span class="file">'+esc(r.prototype.wireframe.split('/').pop())+'</span>':'<span class="cap">not yet</span>'}</td>
   <td>${r.artifacts.handoff&&r.status==='handed-off'?'<span class="file">handoff.md</span>':r.artifacts.outcome?'<span class="file">outcome.md</span>':'<span class="cap">not yet</span>'}</td>
   <td>${statusBadge(r)}</td>
   <td style="font-size:13px">${dn(r.sponsor?.id)}</td></tr>`).join('')}</tbody>
 </table></div></div>
 ${role==='facilitator'?`<div class="card for-me" data-for="facilitator" style="margin-top:16px"><div class="row sp" style="margin-bottom:10px"><h3>Your queue</h3><span class="cap">one next step per run · the exact validator command, and the skill to invoke</span></div><div class="q-list">${runs.filter(r=>r.status!=='stopped').map(r=>{const n=nextStep(r);return `<div class="q-item"><div><span class="mono" style="color:var(--bone-0);font-size:12.5px">${r.slug}</span> <span class="cap">· ${n.t} · author ${esc(HUM[r.sponsor?.id]?.display||r.sponsor?.id)}</span>${n.cmds.map(c=>`<div class="term" style="margin-top:6px;padding:8px 12px"><code><span class="p">$</span> ${esc(c)}</code></div>`).join('')}</div><button class="btn" data-run="${r.slug}">Open</button></div>`;}).join('')}</div></div>`:''}`;
};

function nextStep(r){
 const v=`node discovery/gates/validate.mjs discovery/runs/${r.slug}`;
 if(r.status==='stopped')return {t:'Nothing owed',b:`Stopped by ${HUM[r.outcome?.decided_by]?.display||r.outcome?.decided_by}. A stop is a result: it records who decided, why, and what would reopen it.`,cmds:[],skill:null};
 if(r.status==='handed-off')return {t:'Develop',b:'The right diamond picks it up. The develop skill requires the run to validate first, then explores at least three solution directions against the hand-off.',cmds:[v],skill:'develop'};
 if(r.status==='gate-failing'){const g=gate(r,r.blocked_by[0]);return {t:`Fix ${g.id} ${g.name}`,b:`The validator says: "${g.issues.join('; ')}". Read it back to the author in plain words, then re-run the gates.`,cmds:[v],skill:'discovery'};}
 if(r.status==='awaiting-reaction')return {t:'Record the stakeholder reaction',b:`Show the wireframe to the named roles; record a verdict per hypothesis as new signals. Bind the reaction to the prototype it saw with the digest below.`,cmds:[`${v} --prototype-digest`,v],skill:'discovery'};
 const s=STAGES.find(x=>x[0]===r.stage.id);
 const what={'1':'Keep gathering signals; the synthesis is the next record','2':'Write the synthesis','3':'Frame the problem','4':'Data-governance feasibility: map the data to the register; the data-governance reviewer checks coverage','5':'Build the low-fidelity prototype'}[r.stage.id]||`Stage ${s?s[1]:r.stage.id}`;
 return {t:what,b:'Continue the run with the discovery skill; the validator is the check before anything is frozen.',cmds:[v],skill:'discovery'};
}

VIEWS.run=()=>{
 const r=runs.find(x=>x.slug===curRun)||runs[0];
 const cls={d:'done',c:'cur',f:'fail',s:'stop',t:'todo'};
 const cells=STAGES.map(([sid,name,art])=>{const st=stageState(r,sid,art);const gl=STAGE_GATES[sid].join(' ');return `<div class="bt ${cls[st]}"><span class="n">${sid}${gl?' · '+gl:''}</span><b>${name}</b><span class="f">${r.artifacts[art]?esc(r.artifacts[art].split('/').pop()):'—'}</span><span>${st==='d'?'<span class="badge b-pos">in record</span>':st==='c'?'<span class="badge b-ember">current</span>':st==='f'?'<span class="badge b-crit">gate failing</span>':st==='s'?'<span class="badge b-none">not reached · stopped</span>':'<span class="cap">not reached</span>'}</span></div>`;}).join('')
  +`<div class="bt right"><span class="n">right diamond</span><b style="color:${r.status==='handed-off'?'var(--bone-0)':'var(--bone-3)'}">Develop → Deliver</b><span class="f">develop · next-story</span><span>${r.status==='handed-off'?'<span class="badge b-info">may start</span>':'<span class="cap">—</span>'}</span></div>`;
 const wf=WF[r.slug];const wfSrc=r.prototype?.site_wireframe||null;
 const proto=r.prototype?`${wf?`<iframe class="wf" title="Wireframe for ${esc(r.slug)}" sandbox srcdoc="${esc(wf)}"></iframe>`:wfSrc?`<iframe class="wf" title="Wireframe for ${esc(r.slug)}" sandbox src="${esc(wfSrc)}"></iframe>`:'<div class="nopro">The wireframe exists in the tree but is not part of this build.</div>'}
   <div class="stack" style="margin-top:10px;gap:6px"><div class="row sp"><span class="cap">The committed asset, as rendered by the discovery renderer. Low fidelity, synthetic, disposable.</span>${prov({file:r.prototype.wireframe,kind:'record'},'wireframe.html')}</div>
   <div class="kv"><div class="l"><span>Prototype digest</span><span class="dig">${esc(r.prototype.digest)}</span></div>${prov({file:r.prototype.brief,kind:'executed-check'},'recomputed')}</div>
   <div class="kv"><div class="l"><span>Reaction bound to</span><span class="dig">${esc(r.prototype.reaction_bound_to||'no reaction recorded')}</span></div><span class="badge ${r.prototype.reaction_binding==='bound'?'b-pos':r.prototype.reaction_binding==='stale'?'b-crit':'b-cau'}">${r.prototype.reaction_binding==='bound'?'matches':r.prototype.reaction_binding==='stale'?'STALE':'none yet'}</span></div></div>`
  :`<div class="nopro">No prototype yet. It is built at stage 5, after the problem and the data position are settled.</div>`;
 const prd=r.status==='handed-off'&&r.handoff?`<div class="prd"><dl>
   <dt>Problem</dt><dd>${esc(r.handoff.problem)}</dd><dt>Target user</dt><dd>${esc(r.handoff.target_user)}</dd><dt>Success</dt><dd>${esc(r.handoff.success)}</dd><dt>Out of scope</dt><dd>${esc(r.handoff.out_of_scope)}</dd><dt>Risk verdict</dt><dd>${esc(r.handoff.verdict)}</dd>
  </dl><div class="row sp" style="margin-top:12px">${prov(r.handoff.source,'handoff.md')}<span class="cap">Signatures on the hand-off: none recorded in the tree.</span></div></div>`
  :r.outcome?`<div class="prd"><dl><dt>Outcome</dt><dd>${esc(r.outcome.outcome)}</dd><dt>Decided by</dt><dd>${dn(r.outcome.decided_by)} on ${fmtDate(r.outcome.decided_at)}</dd><dt>Reason</dt><dd>${esc(r.outcome.reason)}</dd></dl><div class="row sp" style="margin-top:12px">${prov(r.outcome.source,'outcome.md')}<span class="cap">A stopped run never has a PRD.</span></div></div>`
  :`<div class="nopro">No PRD. The hand-off is written only when all nine gates pass; ${passCount(r)} pass now.</div>`;
 const npa=r.npa?`<div class="card" data-for="exec risk audit" style="margin-top:16px"><div class="row sp" style="margin-bottom:8px"><h3>${esc(r.npa.receipt)} · New Product Approval</h3><div class="row"><span class="badge b-cau">${esc(r.npa.decision)}</span>${prov(r.npa.source,'decision.json')}</div></div><p style="font-size:14px">Decided by ${dn(r.npa.approved_by)} on ${fmtDate(r.npa.decided_at)}, valid until ${fmtDate(r.npa.valid_until)}. Evidence status: <span class="mono">${esc(r.npa.evidence_status)}</span>.</p><ol class="cond-list">${r.npa.conditions.map(c=>`<li>${esc(c)}</li>`).join('')}</ol><p class="cap" style="margin-top:8px">No record in the tree marks any condition met. Delivery inherits them.</p></div>`:'';
 const hyp=r.hypotheses.length?r.hypotheses.map(h=>{const c={confirmed:'b-pos',refuted:'b-crit',uncertain:'b-cau','not-tested':'b-none',open:'b-none'}[h.verdict]||'b-none';return `<div class="kv"><div class="l"><span><span class="mono" style="color:var(--bone-3)">${h.id}</span> ${esc(h.text)}</span>${h.reactions.length?`<span class="dig">${h.reactions.map(x=>esc(x.stakeholder)+': '+esc(x.verdict)).join(' · ')}</span>`:''}</div><span class="badge ${c}">${esc(h.verdict)}</span></div>`;}).join(''):'<p class="cap">Hypotheses are framed at stage 3.</p>';
 const dg=r.data_governance;
 const ctrlName=id=>D.registers.controls.find(c=>c.id===id)?.name||'';
 const n=nextStep(r);
 const opts=runs.map(x=>`<option value="${x.slug}" ${x.slug===r.slug?'selected':''}>${x.slug}</option>`).join('');
 return `
 <div class="vh"><div><div class="row" style="gap:8px"><label class="label" for="runPick">Run</label><select id="runPick" class="po">${opts}</select>${prov({file:'discovery/runs/'+r.slug,kind:'record'},'discovery/runs/'+r.slug)}</div>
  <h1 style="margin-top:10px">${esc(r.title)}</h1>
  <div class="row" style="margin-top:10px;gap:8px">${statusBadge(r)}<span class="chip">sponsor ${esc(HUM[r.sponsor?.id]?.display||r.sponsor?.id)}${r.sponsor?.resolves?'':' ✗ not in registry'}</span><span class="chip">profile ${esc(r.product_profile?.id||'—')}</span><span class="chip">intent ${esc(r.strategic_intent?.id||'—')}${r.strategic_intent&&!r.strategic_intent.resolves?' ✗':''}</span><span class="chip">${r.signals.count} signals</span>${r.synthetic?'<span class="badge b-none">synthetic data</span>':''}</div></div></div>
 ${r.product_profile?.id==='ai-decision-system'?`<div class="card" data-for="audit risk" style="margin-bottom:16px;border-color:rgba(93,143,166,.45);background:var(--info-dim)"><span class="label" style="color:var(--info-text)">Model-bearing run · ai-decision-system</span><p style="margin-top:4px;color:var(--bone-0);font-size:14px">The profile routes model risk into this run. Controls it cites: ${(dg?.controls||[]).map(c=>`<span class="mono">${c}</span> ${esc(ctrlName(c))}`).join('; ')||'none yet'}. Model validation is held by ${holders('model-validator').map(h=>dn(h.id)).join(', ')}; governance decision ${hgCite('HG-0006')}.</p></div>`:''}
 <div data-for="product programme facilitator"><div class="bigtrack-wrap"><div class="bigtrack">${cells}</div></div></div>

 <div class="card" data-for="facilitator audit product" style="margin-top:16px">
  <div class="row sp" style="margin-bottom:8px"><h3>Gates, as the validator returned them</h3>${prov(r.gates_source)}</div>
  <div class="tbl-wrap"><table class="gtable"><thead><tr><th>Gate</th><th>Result</th><th>What it found</th></tr></thead><tbody>
  ${r.gates.map(g=>`<tr><td><span class="mono" style="color:var(--bone-0)">${g.id}</span> <span class="cap">${esc(g.name)}</span></td><td class="gstat"><span class="badge ${g.status==='pass'?'b-pos':g.status==='skip'?'b-none':g.reached?'b-crit':'b-cau'}">${g.status}${g.status==='fail'&&!g.reached?' · not reached':''}</span>${g.verdict?` <span class="cap">verdict: ${g.verdict}</span>`:''}</td><td class="cap">${g.issues.length?esc(g.issues.join(' · ')):'—'}</td></tr>`).join('')}
  </tbody></table></div>
 </div>

 <div class="grid g2" style="margin-top:16px">
  <div class="card" data-for="product facilitator"><div class="row sp" style="margin-bottom:12px"><h3>Prototype</h3></div>${proto}</div>
  <div class="stack" style="gap:16px">
   <div class="card" data-for="product risk exec"><div class="row sp" style="margin-bottom:12px"><h3>PRD · hand-off</h3>${r.status==='handed-off'?'<span class="badge b-pos">9 of 9 pass</span>':''}</div>${prd}</div>
   <div class="card" data-for="product audit exec"><h3 style="margin-bottom:8px">Hypotheses</h3>${hyp}</div>
  </div>
 </div>
 ${npa}
 ${dg?`<div class="card" data-for="risk audit" style="margin-top:16px"><div class="row sp" style="margin-bottom:8px"><h3>Data-governance feasibility</h3><div class="row"><span class="badge ${dg.verdict==='yes'?'b-pos':dg.verdict==='no'?'b-crit':'b-cau'}">verdict: ${esc(dg.verdict)}</span>${prov(dg.source,'data-governance.md')}</div></div>
  <div class="kv"><div class="l"><span>Risks</span><span class="dig">${dg.risks.filter(x=>/-\d{3}$/.test(x)).join(' · ')}</span></div></div>
  <div class="kv"><div class="l"><span>Controls</span><span class="dig">${dg.controls.map(c=>c+' '+ctrlName(c)).join(' · ')}</span></div></div>
  <div class="kv"><div class="l"><span>Obligations</span><span class="dig">${dg.obligations.join(' · ')}</span></div></div>
  <div class="kv"><div class="l"><span>Uncovered</span><span class="dig">${dg.uncovered.length?esc(dg.uncovered.join(' ').replace(/`/g,'')):'none named'}</span></div><span class="badge ${dg.uncovered.length?'b-crit':'b-pos'}">${dg.uncovered.length}</span></div>
 </div>`:''}
 <div class="card" data-for="facilitator product programme" style="margin-top:16px"><h3 style="margin-bottom:10px">Next step</h3>
  <p style="color:var(--bone-0);font-weight:600">${esc(n.t)}</p><p class="muted" style="margin-top:4px;font-size:14px">${esc(n.b)}</p>
  ${n.cmds.length?`<div style="margin-top:12px"><span class="label">What the facilitator runs</span>${n.cmds.map(c=>`<div class="term" style="margin-top:6px"><code><span class="p">$</span> ${esc(c)}</code><button class="btn" data-copy="${esc(c)}">Copy</button></div>`).join('')}</div>`:''}
  ${n.skill?`<p class="cap" style="margin-top:10px">Then invoke the <span class="mono">${n.skill}</span> skill in Claude Code and name this run. The skill takes no arguments; the slug is part of the conversation.</p>`:''}
 </div>`;
};

VIEWS.install=()=>{
 const I=D.installation;
 const row=(a,b,c)=>`<div class="inst-row"><div><span style="color:var(--bone-0)">${a}</span><div class="cap">${b}</div></div>${c}</div>`;
 const on=x=>x?'<span class="badge b-pos">present</span>':'<span class="badge b-none">absent</span>';
 return `
 <div class="vh"><div><span class="label">Installation</span><h1 style="margin-top:6px">What the plugin put in the repository, <em>and what is switched on.</em></h1><p>Read from the adoption stamp, the Claude Code settings and the CI workflow in the tree.</p></div></div>
 <div class="grid g3">
  <div class="card" data-for="platform"><div class="row sp" style="margin-bottom:8px"><h3>Adoption</h3>${prov(I.source)}</div>
   ${row('Bundle version',esc(I.bundle_version||'—'),'<span class="badge b-pos">stamped</span>')}
   ${row('Tier',esc(I.tier||'—'),'<span class="badge b-info">'+esc(I.tier||'—')+'</span>')}
   ${row('First adopted',fmtDate(I.adopted_at),'')}
  </div>
  <div class="card" data-for="platform context"><div class="row sp" style="margin-bottom:8px"><h3>Seams mounted</h3>${prov({file:D.generator,kind:'derived'})}</div>
   ${row('BrainKit','institution/brainkit/manifest.json',on(I.seams.brainkit))}
   ${row('Data-risk register','docs/governance/data-risk-register/',on(I.seams.register))}
   ${row('Obligations register','docs/governance/obligations.json',on(I.seams.obligations))}
   ${row('Brand profile','discovery/brand/design.md',on(I.seams.brand))}
   ${row('Factory Floor',esc(I.floor_blocked_by||'residency approval recorded'),I.seams.floor?'<span class="badge b-pos">may stand up</span>':'<span class="badge b-none">not stood up</span>')}
  </div>
  <div class="card" data-for="platform risk"><div class="row sp" style="margin-bottom:8px"><h3>Guardrail hooks</h3>${prov({file:'.claude/settings.json',kind:'record'})}</div>
   ${I.hooks.map(h=>row(esc(h.name),esc(h.event+' · '+(h.matcher||'any')),'<span class="badge b-pos">wired</span>')).join('')}
  </div>
 </div>
 <div class="grid g2" style="margin-top:16px">
  <div class="card" data-for="platform audit"><div class="row sp" style="margin-bottom:8px"><h3>CI steps</h3>${I.ci.map(c=>prov({file:c.file,kind:'record'})).join('')}</div>
   ${I.ci.flatMap(c=>c.steps).map(s=>`<div class="inst-row" style="grid-template-columns:1fr"><span style="font-size:13.5px">${esc(s)}</span></div>`).join('')}
  </div>
  <div class="card" data-for="platform audit risk exec"><div class="row sp" style="margin-bottom:8px"><h3>Governance decisions (HG)</h3>${prov(D.control_catalog.source)}</div>
   ${D.control_catalog.governance.map(h=>`<div class="kv"><div class="l"><span><span class="mono" style="color:var(--bone-0)">${h.id}</span> ${esc(h.objective.length>110?h.objective.slice(0,108)+'…':h.objective)}</span><span class="dig">owner ${esc(h.owner_role)}</span></div><span class="badge ${h.state==='mechanically-validated'?'b-pos':h.state==='defined'?'b-cau':'b-crit'}">${h.state}</span></div>`).join('')}
   <p class="cap" style="margin-top:10px">Reviewer agent definitions installed in <span class="mono">.claude/agents</span>: ${I.agents.length||'none'}. Skills come from the plugin, not the tree.</p>
  </div>
 </div>`;
};

/* ================= CHROME + ROUTER ================= */
$('#inst').innerHTML=`<span class="label">Institution</span><b>${esc(D.institution.profile||'—')}</b><span class="cap">${D.identities.length} identities · ${runs.length} runs</span>`;
$('#runCount').textContent=runs.length;
$('#legend').innerHTML=`<span class="cap">Every fact is tagged:</span>${['record','executed-check','derived','telemetry'].map(k=>`<span class="prov k-${k}" style="cursor:default">${KLABEL[k]}</span>`).join('')}${runs.some(r=>r.synthetic)?'<span class="badge b-none">synthetic data</span>':''}`;
$('#sideFoot').innerHTML=`<span class="badge b-none" style="justify-self:start">read-only · authority: ${esc(D.authority)}</span><span class="cap">Generated ${fmtDate(D.generated_at)} by <span class="mono">${esc(D.generator)}</span> (${esc(D.schema)}). ${D.repository.commit?'Commit '+esc(D.repository.commit.slice(0,7)):esc(D.repository.note)}.</span><span class="buildnote">${esc(BUILD)}</span>`;
function renderRoles(){
 $('#roles').innerHTML=Object.entries(ROLES).map(([k,R])=>`<button class="rl" data-role="${k}" aria-pressed="${k===role}"><b>${R.label}</b><span>${R.sub}</span></button>`).join('');
 document.querySelectorAll('#nav button').forEach(b=>{const o=b.querySelector('.fy');if(o)o.remove();if(role!=='all'&&ROLES[role].views.includes(b.dataset.v)){const d=document.createElement('i');d.className='fy';d.title='for this role';b.insertBefore(d,b.querySelector('.ct'));}});
}
function render(v){
 if(!VIEWS[v])v='overview';
 document.querySelectorAll('#nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.v===v?'page':'false'));
 const view=$('#view');view.classList.toggle('lens',role!=='all');
 view.innerHTML=banner()+VIEWS[v]();
 if(role!=='all')view.querySelectorAll('[data-for]').forEach(el=>{if(el.dataset.for.split(' ').includes(role))el.classList.add('for-me');});
 renderRoles();
 $('#crumbs').innerHTML=esc(D.institution.profile)+' / loom / '+(v==='run'?'runs / <b>'+esc(curRun)+'</b>':'<b>'+({overview:'overview',brain:'brain',runs:'runs',install:'installation'}[v])+'</b>');
 try{history.replaceState(null,'','#'+(v==='run'?'run-'+curRun:v))}catch(e){}
 const pick=$('#runPick');if(pick)pick.addEventListener('change',e=>{curRun=e.target.value;render('run')});
 const pp=$('#poPick');if(pp)pp.addEventListener('change',e=>{poId=e.target.value;try{localStorage.setItem('loom-po',poId)}catch(err){}render($('#view .vh .label')?.textContent==='Discovery runs'?'runs':'runs');});
 window.scrollTo(0,0);
}
function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>{el.hidden=true},2600);}
document.addEventListener('click',e=>{
 const rl=e.target.closest('[data-role]');if(rl){role=rl.dataset.role;showAll=false;runFilter='all';try{localStorage.setItem('loom-role',role)}catch(err){}render(ROLES[role].home);return;}
 const c=e.target.closest('[data-copy]');if(c){e.stopPropagation();const t=c.dataset.copy;try{navigator.clipboard.writeText(t).then(()=>toast('Copied: '+t),()=>toast(t));}catch(err){toast(t);}return;}
 const ow=e.target.closest('[data-owners]');if(ow){showAll=!showAll;render('runs');return;}
 const n=e.target.closest('[data-v]');if(n){render(n.dataset.v);return;}
 const g=e.target.closest('[data-go]');if(g){render(g.dataset.go);return;}
 const f=e.target.closest('[data-filter]');if(f){runFilter=f.dataset.filter;render('runs');return;}
 const r=e.target.closest('[data-run]');if(r){curRun=r.dataset.run;render('run');}
});
function fromHash(){let h=(location.hash||'').slice(1);if(h.startsWith('as-')&&ROLES[h.slice(3)]){role=h.slice(3);h=ROLES[role].home;}if(h.startsWith('run-')){const s=h.slice(4);if(runs.some(r=>r.slug===s)){curRun=s;h='run';}}render(h||'overview');}
window.addEventListener('hashchange',fromHash);
fromHash();
