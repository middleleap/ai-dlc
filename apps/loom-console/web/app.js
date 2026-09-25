// The Loom console — the web UI. Renders ONLY from console.json (loom.console/v1), produced by
// src/data.mjs from a Loom installation. It has no write path: its actions are navigation, the
// "view as" lens, and copying a file path or a command. Served by `loom-console serve` or `build`.
const D=globalThis.__LOOM_DATA__||await fetch('console.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('console.json: '+r.status);return r.json();});
const WF=globalThis.__LOOM_WF__||{};
const BUILD=globalThis.__LOOM_BUILD__||'';
const NOW=Date.parse(D.generated_at);
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const G=['D1','D2','D3','D4','D5','D6','D7','D8','D9'];
const STAGES=[['1','Signals','research'],['2','Synthesis','synthesis'],['3','Problem','problem'],['4','Data & risk','dataGov'],['5','Prototype','prototype'],['5b','Reaction','reaction'],['6','Hand-off','handoff']];
const STAGE_GATES={'1':['D2'],'2':['D5'],'3':['D1','D3','D4'],'4':['D6'],'5':['D7','D8'],'5b':['D9'],'6':[]};
const HUM=Object.fromEntries(D.identities.map(i=>[i.id,i]));
const holders=role=>D.identities.filter(i=>i.roles.includes(role));
const pname=id=>{const h=HUM[id];return h&&h.display&&!/^ADOPT/.test(h.display)?h.display:id;};
const dn=id=>{const h=HUM[id];if(!h)return `<span class="mono">${esc(id||'—')}</span>`;const d=h.display&&!/^ADOPT/.test(h.display)?h.display:null;return d?`<span title="${esc(id)}">${esc(d)}</span>`:`<span class="mono" title="unfilled seat">${esc(id)}</span>`;};
const fmtDate=s=>{if(!s)return '—';const d=new Date(s);return isNaN(d)?esc(s):d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});};
const fmtStamp=s=>{const d=new Date(s);return isNaN(d)?esc(s):d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'})+', '+d.toISOString().slice(11,16)+' UTC';};
const daysTo=s=>Math.round((Date.parse(s)-NOW)/86400000);
const title=s=>String(s||'').split('-').map(w=>w&&w[0].toUpperCase()+w.slice(1)).join(' ');
const INST=title(D.institution.profile)||'Loom installation';
const KLABEL={'record':'record','executed-check':'executed check','derived':'derived','telemetry':'telemetry'};
const base=f=>String(f||'').split('/').filter(Boolean).pop()||f;
const prov=(s,label)=>s?`<button class="prov k-${s.kind}" data-copy="${esc(s.file)}" title="${esc(KLABEL[s.kind])} · ${esc(s.file)} · click to copy the path">${esc(label||base(s.file))}</button>`:'';
const runs=D.runs;
const byStatus=st=>runs.filter(r=>r.status===st);
const STATUS={'handed-off':['Handed off','b-pos'],'stopped':['Stopped','b-none'],'awaiting-reaction':['Awaiting reaction','b-info'],'in-progress':['In progress','b-info'],'gate-failing':['Gate failing','b-crit']};
const statusBadge=r=>{const s=STATUS[r.status]||[r.status,'b-none'];return `<span class="badge ${s[1]}">${s[0]}</span>`;};
const gate=(r,id)=>r.gates.find(g=>g.id===id);
const passCount=r=>r.gates.filter(g=>g.status==='pass').length;
const HG=Object.fromEntries((D.control_catalog?.governance||[]).map(h=>[h.id,h]));
const stBadge=s=>`<span class="badge ${s==='mechanically-validated'?'b-pos':s==='defined'?'b-cau':s==='absent'?'b-crit':'b-info'}">${esc(s)}</span>`;

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
const gcls=g=>g.status==='pass'?'p':g.status==='fail'?(g.reached?'x':'w'):'';
const gtitle=g=>g.id+' '+g.name+' · '+g.status+(g.status==='fail'&&!g.reached?' (stage not reached)':'')+(g.issues.length?' · '+g.issues.join('; '):'');
const gateStrip=r=>`<span class="gstrip">${G.map(id=>{const g=gate(r,id);return `<i class="${gcls(g)}" title="${esc(gtitle(g))}"></i>`;}).join('')}</span>`;

/* ---------- "view as": registry roles, the humans who hold them, and a guide per role (in Help) ---------- */
const ROLES={
 all:{label:'Everyone',reg:[],home:'overview'},
 exec:{label:'Accountable executive',reg:['accountable-executive'],home:'overview',hg:'HG-0010',
  guide:[['Is discovery effort going where the strategy says?','Portfolio by intent','overview'],['What have I approved, and on what conditions?','New Product Approval','run:cross-bank-money'],['How mature are the controls?','Control maturity','overview']],
  gap:'Cost of change and value delivered.'},
 programme:{label:'Loom programme owner',reg:[],home:'overview',hg:'HG-0007',
  guide:[['Where is every run, and what is stuck?','Pipeline','overview'],['Who is each item waiting on, and for how long?','Inbox','inbox'],['Are the gates doing the work?','Runs · gates','runs']],
  gap:'An accountable programme-owner role: the identity registry has none.'},
 product:{label:'Product owner',reg:['product-owner'],home:'runs',hg:'HG-0007',owner:true,
  guide:[['Where are my runs?','Runs · mine','runs'],['Is there a prototype, and where is the PRD?','Run · Prototype, PRD','run:first'],['What happens next?','Run · Summary','run:first']],
  gap:'Authoring. Runs are written with the facilitator or on the Factory Floor.'},
 risk:{label:'Second line · DPO · compliance',reg:['risk-second-line','data-protection','compliance','credit-risk','legal'],home:'inbox',hg:'HG-0001',
  guide:[['Which risks have no control?','Inbox · uncovered risk','inbox'],['What is waiting on my signature?','Inbox · approvals','inbox'],['Do our obligations resolve, and are they verified?','Context · Obligations','context:obligations']],
  gap:'The NPA committee pack (PA1/PA2) as its own view.'},
 context:{label:'Institutional context owner',reg:['institutional-context-owner'],home:'context',
  decide:'A BrainKit change is re-versioned, resealed and approved in git; brainkit-check refuses anything else.',
  guide:[['Is the BrainKit approved, sealed and current?','Context · BrainKit','context:brainkit'],['Which intents are pursued, and by which runs?','Context · Strategy','context:strategy'],['What on the radar is due?','Context · Strategy','context:strategy']],
  gap:'A diff between BrainKit versions.'},
 platform:{label:'Platform admin · CIO',reg:['platform-admin','information-security','enterprise-architect'],home:'install',hg:'HG-0002',
  guide:[['What did we install, and what is switched on?','Installation','install'],['Which guardrails run on every change?','Installation · hooks, CI','install'],['What is not stood up yet?','Installation · seams','install']],
  gap:'Runtime controls in production. The Loom is a build-time frame.'},
 facilitator:{label:'Facilitator',reg:['engineering','solution-architect'],home:'runs',
  decide:'You own the record, not the content, and you merge nothing you authored.',
  guide:[['What do I run next, and for whom?','Runs · next step','runs'],['Which gate result do I read back?','Run · Gates','run:blocked'],['Is each reaction still bound to its prototype?','Overview · Checks','overview']],
  gap:'A live terminal. Commands stay in your terminal.'},
 audit:{label:'Internal audit · model risk',reg:['internal-audit','model-validator'],home:'overview',hg:'HG-0006',
  guide:[['What happened, when, and who decided?','Activity','overview'],['Where does each fact come from?','Source tags on every item','overview'],['Which runs carry a model?','Run · model-bearing','run:model']],
  gap:'The per-change evidence bundle, which lives in the delivery half.'}
};
let role='all', poId=null, curRun=runs[0]?.slug, runFilter='all', showAll=false, runTab='summary', ctxTab='brainkit', sevFilter='all', helpOpen=false, curView='overview';
try{const r=localStorage.getItem('loom-role');if(r&&ROLES[r])role=r;const p=localStorage.getItem('loom-po');if(p)poId=p;}catch(e){}
const POS=holders('product-owner').map(h=>h.id);
if(!poId||!POS.includes(poId))poId=POS[0];
const roleOfRegistry=r=>Object.entries(ROLES).filter(([,R])=>R.reg.includes(r)).map(([k])=>k);

/* ---------- inbox: every item is computed from the data; nothing is typed in ---------- */
function attention(){
 const A=[];const po=r=>r.sponsor?.id===poId?['product']:[];
 for(const r of byStatus('gate-failing'))for(const id of r.blocked_by){const g=gate(r,id);A.push({sev:'crit',kind:'Gate',t:`${id} ${g.name} failing`,subj:r.slug,b:esc(g.issues[0]||''),o:dn(r.sponsor?.id),roles:['programme','facilitator',...po(r)],src:r.gates_source,go:`data-run="${r.slug}" data-tab="gates"`});}
 for(const r of runs.filter(x=>x.status!=='stopped'))for(const u of (r.data_governance?.uncovered||[]))A.push({sev:'crit',kind:'Risk',t:'Uncovered risk',subj:r.slug,b:esc(u.replace(/`/g,'')),o:holders('risk-second-line').map(h=>dn(h.id)).join(', ')||'risk-second-line',roles:['risk','exec','programme'],src:r.data_governance.source,go:`data-run="${r.slug}" data-tab="governance"`});
 const byChange={};for(const x of D.approvals.rows){(byChange[x.change_id+' '+x.stage]||=[]).push(x);}
 for(const [k,rows] of Object.entries(byChange)){const x=rows[0];const br=rows.filter(y=>y.breached).length;const nobody=rows.filter(y=>!y.holders.length).map(y=>y.role);
  A.push({sev:br?'cau':'info',kind:'Approval',t:`${rows.length} approvals pending`,subj:k,b:`${x.age_days} days open · ${br} past SLA${nobody.length?' · unheld: '+nobody.join(', '):''}`,o:rows.map(y=>esc(y.role)).join(', '),age:x.age_days,roles:['programme','exec'],src:D.approvals.source,go:'data-v="install"'});
  for(const y of rows){const mapped=roleOfRegistry(y.role);if(mapped.length)A.push({sev:y.breached?'cau':'info',kind:'Approval',t:`${y.role} decision pending`,subj:`${y.change_id} ${y.stage}`,b:`${y.age_days} of ${y.target_days} days${y.breached?' · SLA breached':''}`,o:y.holders.map(dn).join(', ')||'unheld',age:y.age_days,roles:mapped,perRole:true,src:D.approvals.source,go:'data-v="install"'});}}
 for(const r of byStatus('awaiting-reaction'))A.push({sev:'cau',kind:'Reaction',t:'Stakeholder reaction not recorded',subj:r.slug,b:`${r.hypotheses.map(h=>h.id).join(', ')} untested · D9 open`,o:dn(r.sponsor?.id),roles:['programme','facilitator',...po(r),...(r.product_profile?.id==='ai-decision-system'?['audit']:[])],src:r.gates_source,go:`data-run="${r.slug}" data-tab="prototype"`});
 for(const r of runs)if(r.npa&&r.npa.conditions.length)A.push({sev:'cau',kind:'Condition',t:`${r.npa.conditions.length} NPA conditions open`,subj:`${r.slug} · ${r.npa.receipt}`,b:`none recorded as met · valid until ${fmtDate(r.npa.valid_until)}`,o:dn(r.npa.approved_by),roles:['exec','risk'],src:r.npa.source,go:`data-run="${r.slug}"`});
 const pend=D.registers.obligations.filter(o=>o.article_status==='owner-verification-pending');
 if(pend.length)A.push({sev:'cau',kind:'Obligation',t:`${pend.length} obligations pending owner verification`,subj:'obligations register',b:esc(pend.map(o=>o.id).join(' · ')),o:[...new Set(pend.map(o=>o.owner_role))].join(', '),roles:['risk','context','audit'],src:D.registers.obligations_source,go:'data-go="context:obligations"'});
 const stand=D.registers.obligations.filter(o=>o.article_status==='demo-stand-in');
 if(stand.length)A.push({sev:'info',kind:'Obligation',t:`${stand.length} obligations cite a stand-in article`,subj:'obligations register',b:'citation reads "demo fixture"',o:'compliance',roles:['risk','audit'],src:D.registers.obligations_source,go:'data-go="context:obligations"'});
 for(const e of (D.brainkit?.radar||[]))if(e.review_by&&daysTo(e.review_by)<=30){const d=daysTo(e.review_by);A.push({sev:d<0?'crit':'cau',kind:'Radar',t:d<0?`Radar review ${-d} days overdue`:`Radar review due in ${d} days`,subj:e.technology,b:`ring: ${esc(e.ring)}`,o:dn(e.owner),roles:['context','platform'],src:D.brainkit.source,go:'data-go="context:strategy"'});}
 const seats=D.identities.filter(i=>/^ADOPT/.test(i.display||'')&&i.roles.some(r=>r.startsWith('shariah')));
 const isl=runs.filter(r=>r.product_profile?.id==='islamic-product');
 if(seats.length&&isl.length)A.push({sev:'cau',kind:'Registry',t:`${seats.length} Shari'ah seats unfilled`,subj:'identity registry',b:`routes approvals for ${isl.map(r=>r.slug).join(', ')}`,o:'institutional-context-owner',roles:['risk','context','audit'],src:{file:'docs/governance/identities.json',kind:'record'},go:`data-run="${isl[0].slug}"`});
 if(D.installation.floor_blocked_by)A.push({sev:'info',kind:'Platform',t:'Factory Floor not stood up',subj:'installation',b:'no residency approval on record',o:holders('platform-admin').map(h=>dn(h.id)).join(', ')||'platform-admin',roles:['platform','programme'],src:D.installation.source,go:'data-v="install"'});
 return A;
}
const ATT=attention();
const SEV={crit:['Critical','var(--critical)'],cau:['Warning','var(--caution)'],info:['Info','var(--bone-3)']};
const mine=()=>role==='all'?ATT.filter(a=>!a.perRole):ATT.filter(a=>a.roles.includes(role));
const attRow=a=>`<tr class="click" ${a.go}><td><span class="dia" style="background:${SEV[a.sev][1]}" title="${SEV[a.sev][0]}"></span></td><td><div class="t1">${esc(a.t)}</div><div class="mono cap">${esc(a.subj)}</div></td><td class="cap">${a.b}</td><td class="own">${a.o}</td><td>${prov(a.src)}</td></tr>`;
const attItem=a=>`<button class="it" ${a.go}><span class="dia" style="background:${SEV[a.sev][1]}" title="${SEV[a.sev][0]}"></span><span class="it-m"><span class="t1">${esc(a.t)}</span> <span class="mono cap">${esc(a.subj)}</span><span class="it-d cap">${a.b}</span></span><span class="it-o cap">${a.o}</span></button>`;
const attList=(list,empty)=>list.length?`<div class="ilist">${list.map(attItem).join('')}</div>`:`<div class="empty">${empty}</div>`;
const attTable=(list,empty)=>list.length?`<div class="tbl-wrap"><table class="inbox"><colgroup><col style="width:28px"><col style="width:28%"><col><col style="width:22%"><col style="width:150px"></colgroup><thead><tr><th></th><th>Item</th><th>Detail</th><th>Owner</th><th>Source</th></tr></thead><tbody>${list.map(attRow).join('')}</tbody></table></div>`:`<div class="empty">${empty}</div>`;

/* ---------- page header ---------- */
const head=(h,meta,right='')=>`<header class="ph"><div><h1>${h}</h1>${meta?`<div class="meta">${meta}</div>`:''}</div>${right?`<div class="row">${right}</div>`:''}</header>`;
const tabs=(cur,list,attr)=>`<div class="tabs" role="tablist">${list.map(([k,l,n])=>`<button role="tab" ${attr}="${k}" aria-selected="${cur===k}">${l}${n!=null?` <span class="ct">${n}</span>`:''}</button>`).join('')}</div>`;

/* ================= VIEWS ================= */
const VIEWS={};
VIEWS.overview=()=>{
 const cc=D.control_catalog;const bk=D.brainkit;
 const cols=[...STAGES.map(s=>[s[0],s[1]]),['→','Delivery']];
 const byCol=cols.map(()=>[]);
 for(const r of runs){let i=STAGES.findIndex(s=>s[0]===r.stage.id);if(r.status==='handed-off')i=7;if(i<0)i=0;byCol[i].push(r);}
 const pend=D.registers.obligations.filter(o=>o.article_status==='owner-verification-pending').length;
 const breached=D.approvals.rows.filter(x=>x.breached).length;
 const rel=D.integrity;const checks=[['Sponsors resolve to the identity registry',rel.unresolved_sponsors],['Strategic intents resolve to the BrainKit',rel.unresolved_intents],['Product profiles exist',rel.unresolved_profiles],['Reactions bound to the prototype on disk',rel.stale_reactions]];
 const failing=byStatus('gate-failing').length, active=runs.filter(r=>!['stopped','handed-off'].includes(r.status)).length;
 const M=mine();
 const kpi=(l,v,sub,go,tone='')=>`<button class="kpi ${tone}" ${go}><span class="label">${l}</span><span class="v num">${v}</span><span class="cap">${sub}</span></button>`;
 const seg=cc.ladder.map(s=>`<span style="flex:${cc.counts[s]||0}" class="lv-${s}" title="${esc(s)}: ${cc.counts[s]}"></span>`).join('');
 return `
 ${head('Overview',`${INST} · ${runs.length} runs · ${bk?'BrainKit v'+esc(bk.version):'no BrainKit'}`)}
 <div class="kpis">
  ${kpi('Active runs',active,`${byStatus('handed-off').length} handed off · ${byStatus('stopped').length} stopped`,'data-v="runs"')}
  ${kpi('Gate failures',failing,failing?byStatus('gate-failing').map(r=>r.blocked_by.join(' ')).join(' · '):'none','data-filter="gate-failing"',failing?'bad':'')}
  ${kpi('Approvals pending',D.approvals.rows.length,`${breached} past SLA · oldest ${Math.max(0,...D.approvals.rows.map(x=>x.age_days))}d`,'data-v="install"',breached?'warn':'')}
  ${kpi('Obligations',D.registers.obligations.length,`${pend} pending verification`,'data-go="context:obligations"',pend?'warn':'')}
  ${kpi('Controls validated',`${cc.counts['mechanically-validated']}<small>/${cc.total}</small>`,`${cc.counts['platform-enforced']+cc.counts['organisationally-enforced']} enforced`,'data-go="install"')}
 </div>

 <div class="grid g-7-5">
  <section class="card">
   <div class="ch"><h2>Inbox${role!=='all'?` · ${esc(ROLES[role].label)}`:''}</h2><button class="lnk" data-v="inbox">View all ${M.length} →</button></div>
   ${attList(M.slice(0,7),'Nothing waiting on this role.')}
  </section>
  <div class="stack" style="gap:16px">
   <section class="card">
    <div class="ch"><h2>Control maturity</h2>${prov(cc.source)}</div>
    <div class="segbar">${seg}</div>
    <div class="seglegend">${cc.ladder.map(s=>`<span><i class="lv-${s}"></i>${esc(s.replace(/-/g,' '))} <b class="num">${cc.counts[s]}</b></span>`).join('')}</div>
   </section>
   <section class="card">
    <div class="ch"><h2>Checks</h2>${prov({file:D.generator,kind:'derived'},'integrity')}</div>
    ${checks.map(([t,l])=>`<div class="kv"><div class="l"><span>${t}</span>${l.length?`<span class="dig" style="color:var(--critical-text)">${esc(l.join(' · '))}</span>`:''}</div><span class="badge ${l.length?'b-crit':'b-pos'}">${l.length?l.length+' failing':'pass'}</span></div>`).join('')}
   </section>
  </div>
 </div>

 <section class="card" style="margin-top:16px">
  <div class="ch"><h2>Pipeline</h2><span class="cap">discovery stages 1–6 → delivery</span></div>
  <div class="pipe-wrap"><div class="pipe">
   ${cols.map((c,i)=>`<div class="${i===7?'waist':''}"><div class="ph2"><span class="label">${c[0]==='→'?'delivery':c[0]}</span><b>${c[1]}</b><span class="ct">${byCol[i].length||''}</span></div>${byCol[i].map(r=>`<button class="pcard" data-run="${r.slug}"><span class="mono">${r.slug}</span>${statusBadge(r)}</button>`).join('')}</div>`).join('')}
  </div></div>
 </section>

 <div class="grid g2" style="margin-top:16px">
  <section class="card">
   <div class="ch"><h2>Portfolio by intent</h2>${prov(bk?.source,'strategy.md')}</div>
   ${(bk?.intents||[]).map(it=>{const rs=runs.filter(r=>r.strategic_intent?.id===it.id);return `<div class="intent-row"><div><span class="mono cap">${it.id}</span> <span class="${it.pursued?'':'muted'}">${esc(it.intent)}</span></div><div class="runs">${rs.length?rs.map(r=>`<button class="irun" data-run="${r.slug}">${track(r)} ${r.slug}</button>`).join(''):`<span class="badge b-none">${it.pursued?'no runs':'parked'}</span>`}</div></div>`;}).join('')}
  </section>
  <section class="card">
   <div class="ch"><h2>Activity</h2><span class="cap">${D.trail.length} events</span></div>
   <div class="trail">${[...D.trail].reverse().slice(0,8).map(trRow).join('')}</div>
   ${D.trail.length>8?`<details class="more"><summary>${D.trail.length-8} earlier</summary><div class="trail">${[...D.trail].reverse().slice(8).map(trRow).join('')}</div></details>`:''}
  </section>
 </div>`;
};
function trRow(e){return `<div class="tr"><span class="d">${e.at?fmtDate(e.at):'—'}</span>${e.kind==='decision'||e.kind==='approval'?'<span class="sq" style="background:var(--bone-1)"></span>':e.kind==='binding'?'<span class="dia" style="background:var(--positive)"></span>':'<span class="sq" style="border:1.5px solid var(--bone-2)"></span>'}<div>${e.actor?dn(e.actor)+' · ':''}${esc(e.what)} ${prov(e.source)}${e.detail?`<div class="cap" style="margin-top:2px">${esc(e.detail)}</div>`:''}</div></div>`;}

VIEWS.inbox=()=>{
 const M=mine();const list=M.filter(a=>sevFilter==='all'||a.sev===sevFilter);
 const n=k=>M.filter(a=>a.sev===k).length;
 return `${head('Inbox',`${M.length} items${role!=='all'?' for '+esc(ROLES[role].label):''} · ${n('crit')} critical`)}
 ${tabs(sevFilter,[['all','All',M.length],['crit','Critical',n('crit')],['cau','Warning',n('cau')],['info','Info',n('info')]],'data-sev')}
 ${attTable(list,'Nothing here.')}
 ${role!=='all'?`<p class="cap" style="margin-top:12px">${ATT.filter(a=>!a.perRole&&!M.includes(a)).length} further items are routed to other roles. <button class="lnk" data-role-set="all">Show everyone's</button></p>`:''}`;
};

VIEWS.runs=()=>{
 const R=ROLES[role];const mineOnly=R.owner&&!showAll;const baseL=mineOnly?runs.filter(r=>r.sponsor?.id===poId):runs;
 const list=baseL.filter(r=>runFilter==='all'||r.status===runFilter);
 const n=k=>k==='all'?baseL.length:baseL.filter(r=>r.status===k).length;
 const T=[['all','All'],['in-progress','In progress'],['awaiting-reaction','Awaiting reaction'],['gate-failing','Gate failing'],['handed-off','Handed off'],['stopped','Stopped']].filter(([k])=>k==='all'||n(k)).map(([k,l])=>[k,l,n(k)]);
 const right=`${R.owner?`<div class="segctl"><button data-owners="mine" aria-pressed="${mineOnly}">Mine</button><button data-owners="all" aria-pressed="${!mineOnly}">All</button></div>`:''}<input class="search" id="q" type="search" placeholder="Filter runs" aria-label="Filter runs">`;
 return `${head('Runs',`${runs.length} discovery runs · ${byStatus('handed-off').length} with a PRD · ${runs.filter(r=>r.prototype).length} with a prototype`,right)}
 ${tabs(runFilter,T,'data-filter')}
 <div class="tbl-wrap"><table id="runTable">
  <thead><tr><th>Run</th><th>Stage</th><th>Gates D1–D9</th><th>Prototype</th><th>PRD</th><th>Status</th><th>Sponsor</th>${role==='facilitator'?'<th>Next</th>':''}</tr></thead>
  <tbody>${list.map(r=>`<tr class="click" data-run="${r.slug}" data-s="${esc((r.slug+' '+r.title+' '+pname(r.sponsor?.id)+' '+r.status).toLowerCase())}">
   <td><div class="t1">${esc(r.title)}</div><div class="mono cap">${r.slug}</div></td>
   <td>${track(r)}<div class="cap" style="margin-top:4px">${r.stage.id} · ${r.stage.name}</div></td>
   <td>${gateStrip(r)}<div class="cap num" style="margin-top:4px">${passCount(r)}/9 pass</div></td>
   <td>${r.prototype?`<span class="file">${esc(base(r.prototype.wireframe))}</span>`:'<span class="cap">—</span>'}</td>
   <td>${r.artifacts.handoff&&r.status==='handed-off'?'<span class="file">handoff.md</span>':r.artifacts.outcome?'<span class="file">outcome.md</span>':'<span class="cap">—</span>'}</td>
   <td>${statusBadge(r)}</td>
   <td class="nowrap">${dn(r.sponsor?.id)}</td>${role==='facilitator'?`<td class="cap">${esc(nextStep(r).t)}</td>`:''}</tr>`).join('')}</tbody>
 </table></div>
 ${list.length?'':'<div class="empty">No runs match.</div>'}`;
};

function nextStep(r){
 const v=`node discovery/gates/validate.mjs discovery/runs/${r.slug}`;
 if(r.status==='stopped')return {t:'None · stopped',b:`Stopped by ${pname(r.outcome?.decided_by)} on ${fmtDate(r.outcome?.decided_at)}.`,cmds:[],skill:null};
 if(r.status==='handed-off')return {t:'Develop',b:'Validate, then explore at least three solution directions against the hand-off.',cmds:[v],skill:'develop'};
 if(r.status==='gate-failing'){const g=gate(r,r.blocked_by[0]);return {t:`Fix ${g.id} ${g.name}`,b:g.issues.join('; '),cmds:[v],skill:'discovery'};}
 if(r.status==='awaiting-reaction')return {t:'Record reaction',b:`Verdicts on ${r.hypotheses.map(h=>h.id).join(', ')} from the named roles, bound to the prototype digest.`,cmds:[`${v} --prototype-digest`,v],skill:'discovery'};
 const what={'1':'Gather signals','2':'Write the synthesis','3':'Frame the problem','4':'Data-governance feasibility','5':'Build the prototype'}[r.stage.id]||`Stage ${r.stage.id}`;
 return {t:what,b:'',cmds:[v],skill:'discovery'};
}

VIEWS.run=()=>{
 const r=runs.find(x=>x.slug===curRun)||runs[0];
 const cls={d:'done',c:'cur',f:'fail',s:'stop',t:'todo'};
 const cells=STAGES.map(([sid,name,art])=>{const st=stageState(r,sid,art);const gl=STAGE_GATES[sid].join(' ');return `<div class="bt ${cls[st]}"><span class="n">${sid}${gl?' · '+gl:''}</span><b>${name}</b><span class="f">${r.artifacts[art]?esc(base(r.artifacts[art])):'—'}</span></div>`;}).join('')
  +`<div class="bt right ${r.status==='handed-off'?'cur':''}"><span class="n">delivery</span><b>Develop → Deliver</b><span class="f">${r.status==='handed-off'?'may start':'—'}</span></div>`;
 const dg=r.data_governance;const n=nextStep(r);
 const ctrlName=id=>D.registers.controls.find(c=>c.id===id)?.name||'';
 const failing=r.gates.filter(g=>g.status==='fail'&&g.reached).length;
 const T=[['summary','Summary'],['gates','Gates',`${passCount(r)}/9`],['prototype','Prototype',r.prototype?null:'—'],['prd','PRD',r.status==='handed-off'?null:r.outcome?'stopped':'—'],['governance','Data & risk',dg?null:'—']];
 const opts=runs.map(x=>`<option value="${x.slug}" ${x.slug===r.slug?'selected':''}>${x.slug}</option>`).join('');
 const hyp=r.hypotheses.length?r.hypotheses.map(h=>{const c={confirmed:'b-pos',refuted:'b-crit',uncertain:'b-cau','not-tested':'b-none',open:'b-none'}[h.verdict]||'b-none';return `<div class="kv"><div class="l"><span><span class="mono cap">${h.id}</span> ${esc(h.text)}</span>${h.reactions.length?`<span class="dig">${h.reactions.map(x=>esc(x.stakeholder)+': '+esc(x.verdict)).join(' · ')}</span>`:''}</div><span class="badge ${c}">${esc(h.verdict)}</span></div>`;}).join(''):'<div class="empty sm">No hypotheses yet · framed at stage 3</div>';
 let body='';
 if(runTab==='summary')body=`
  <div class="grid g-7-5">
   <div class="stack" style="gap:16px">
    <section class="card"><div class="ch"><h2>Problem statement</h2>${prov({file:'discovery/runs/'+r.slug+'/intent.md',kind:'record'},'intent.md')}</div><p>${esc(r.statement||'—')}</p></section>
    <section class="card"><div class="ch"><h2>Hypotheses</h2><span class="cap">${r.hypotheses.length}</span></div>${hyp}</section>
    ${r.npa?`<section class="card"><div class="ch"><h2>${esc(r.npa.receipt)} · New Product Approval</h2><div class="row"><span class="badge b-cau">${esc(r.npa.decision)}</span>${prov(r.npa.source)}</div></div>
     <dl class="props"><dt>Decided by</dt><dd>${dn(r.npa.approved_by)}</dd><dt>Decided</dt><dd>${fmtDate(r.npa.decided_at)}</dd><dt>Valid until</dt><dd>${fmtDate(r.npa.valid_until)}</dd><dt>Evidence</dt><dd class="mono">${esc(r.npa.evidence_status)}</dd></dl>
     <div class="tbl-wrap" style="margin-top:12px"><table><thead><tr><th>#</th><th>Condition</th><th>Met</th></tr></thead><tbody>${r.npa.conditions.map((c,i)=>`<tr><td class="mono cap">${i+1}</td><td>${esc(c)}</td><td><span class="badge b-none">no record</span></td></tr>`).join('')}</tbody></table></div></section>`:''}
   </div>
   <div class="stack" style="gap:16px">
    <section class="card next"><div class="ch"><h2>Next step</h2>${n.skill?`<span class="chip">skill: ${n.skill}</span>`:''}</div>
     <p class="t1">${esc(n.t)}</p>${n.b?`<p class="cap" style="margin-top:4px">${esc(n.b)}</p>`:''}
     ${n.cmds.map(c=>`<div class="term" style="margin-top:10px"><code><span class="p">$</span> ${esc(c)}</code><button class="btn sm" data-copy="${esc(c)}">Copy</button></div>`).join('')}
    </section>
    <section class="card"><div class="ch"><h2>Details</h2></div>
     <dl class="props">
      <dt>Sponsor</dt><dd>${dn(r.sponsor?.id)}${r.sponsor?.resolves?'':' <span class="badge b-crit">not in registry</span>'}</dd>
      <dt>Intent</dt><dd><span class="mono">${esc(r.strategic_intent?.id||'—')}</span>${r.strategic_intent&&!r.strategic_intent.resolves?' <span class="badge b-crit">unresolved</span>':''}</dd>
      <dt>Profile</dt><dd class="mono">${esc(r.product_profile?.id||'—')}</dd>
      <dt>Stage</dt><dd>${r.stage.id} · ${esc(r.stage.name)}</dd>
      <dt>Gates</dt><dd>${gateStrip(r)} <span class="cap num">${passCount(r)}/9</span></dd>
      <dt>Signals</dt><dd class="num">${r.signals.count}</dd>
      ${r.product_profile?.id==='ai-decision-system'?`<dt>Model risk</dt><dd>${HG['HG-0006']?'<span class="mono">HG-0006</span> '+stBadge(HG['HG-0006'].state):'HG-0006'} · validator ${holders('model-validator').map(h=>dn(h.id)).join(', ')||'unheld'}</dd>`:''}
      <dt>Path</dt><dd>${prov({file:'discovery/runs/'+r.slug,kind:'record'},'discovery/runs/'+r.slug)}</dd>
     </dl>
    </section>
   </div>
  </div>`;
 if(runTab==='gates')body=`<section class="card"><div class="ch"><h2>Validator result</h2><div class="row"><span class="cap num">${passCount(r)} pass · ${failing} failing · ${r.gates.filter(g=>g.status==='fail'&&!g.reached).length} not reached</span>${prov(r.gates_source)}</div></div>
  <div class="tbl-wrap"><table class="gtable"><thead><tr><th>Gate</th><th>Result</th><th>Findings</th></tr></thead><tbody>
  ${r.gates.map(g=>`<tr><td class="nowrap"><span class="mono t1">${g.id}</span> <span class="cap">${esc(g.name)}</span></td><td class="gstat"><span class="badge ${g.status==='pass'?'b-pos':g.status==='skip'?'b-none':g.reached?'b-crit':'b-cau'}">${g.status==='fail'&&!g.reached?'not reached':g.status}</span>${g.verdict?` <span class="cap">${esc(g.verdict)}</span>`:''}</td><td class="cap">${g.issues.length?esc(g.issues.join(' · ')):'—'}</td></tr>`).join('')}
  </tbody></table></div></section>`;
 if(runTab==='prototype'){const wf=WF[r.slug];const wfSrc=r.prototype?.site_wireframe||null;
  body=r.prototype?`<div class="grid g-7-5"><section class="card flush">${wf?`<iframe class="wf" title="Wireframe for ${esc(r.slug)}" sandbox srcdoc="${esc(wf)}"></iframe>`:wfSrc?`<iframe class="wf" title="Wireframe for ${esc(r.slug)}" sandbox src="${esc(wfSrc)}"></iframe>`:'<div class="empty">Wireframe not included in this build.</div>'}</section>
   <section class="card"><div class="ch"><h2>Prototype</h2><span class="badge b-none">low fidelity</span></div><dl class="props">
    <dt>Wireframe</dt><dd>${prov({file:r.prototype.wireframe,kind:'record'})}</dd>
    <dt>Brief</dt><dd>${prov({file:r.prototype.brief,kind:'record'})}</dd>
    <dt>Digest</dt><dd class="dig">${esc(r.prototype.digest)}</dd>
    <dt>Reaction</dt><dd><span class="badge ${r.prototype.reaction_binding==='bound'?'b-pos':r.prototype.reaction_binding==='stale'?'b-crit':'b-cau'}">${r.prototype.reaction_binding==='bound'?'bound · digest matches':r.prototype.reaction_binding==='stale'?'stale · digest differs':'none recorded'}</span></dd>
    ${r.prototype.reaction_bound_to?`<dt>Bound to</dt><dd class="dig">${esc(r.prototype.reaction_bound_to)}</dd>`:''}
    <dt>D7 · D8</dt><dd>${['D7','D8'].map(id=>{const g=gate(r,id);return `<span class="badge ${g.status==='pass'?'b-pos':'b-crit'}">${id} ${g.status}</span>`;}).join(' ')}</dd>
   </dl></section></div>`
  :`<div class="empty">No prototype · built at stage 5 · run is at stage ${r.stage.id}</div>`;}
 if(runTab==='prd')body=r.status==='handed-off'&&r.handoff?`<section class="card"><div class="ch"><h2>Hand-off</h2><div class="row"><span class="badge b-pos">D1–D9 pass</span>${prov(r.handoff.source,'handoff.md')}</div></div><dl class="props wide">
   <dt>Problem</dt><dd>${esc(r.handoff.problem)}</dd><dt>Target user</dt><dd>${esc(r.handoff.target_user)}</dd><dt>Success</dt><dd>${esc(r.handoff.success)}</dd><dt>Out of scope</dt><dd>${esc(r.handoff.out_of_scope)}</dd><dt>Risk verdict</dt><dd>${esc(r.handoff.verdict)}</dd><dt>Signatures</dt><dd><span class="badge b-none">none recorded</span></dd></dl></section>`
  :r.outcome?`<section class="card"><div class="ch"><h2>Outcome</h2><div class="row"><span class="badge b-none">${esc(r.outcome.outcome)}</span>${prov(r.outcome.source,'outcome.md')}</div></div><dl class="props wide"><dt>Decided by</dt><dd>${dn(r.outcome.decided_by)}</dd><dt>Decided</dt><dd>${fmtDate(r.outcome.decided_at)}</dd><dt>Reason</dt><dd>${esc(r.outcome.reason)}</dd><dt>PRD</dt><dd><span class="badge b-none">none · stopped runs have no hand-off</span></dd></dl></section>`
  :`<div class="empty">No PRD · written when D1–D9 pass · ${passCount(r)}/9 now</div>`;
 if(runTab==='governance')body=dg?`<section class="card"><div class="ch"><h2>Data-governance feasibility</h2><div class="row"><span class="badge ${dg.verdict==='yes'?'b-pos':dg.verdict==='no'?'b-crit':'b-cau'}">verdict: ${esc(dg.verdict)}</span>${prov(dg.source)}</div></div>
  <dl class="props wide"><dt>Risks</dt><dd class="mono">${dg.risks.filter(x=>/-\d{3}$/.test(x)).join(' · ')||'—'}</dd>
  <dt>Controls</dt><dd>${dg.controls.map(c=>`<div><span class="mono">${c}</span> <span class="cap">${esc(ctrlName(c))}</span></div>`).join('')||'—'}</dd>
  <dt>Obligations</dt><dd class="mono">${dg.obligations.join(' · ')||'—'}</dd>
  <dt>Uncovered</dt><dd>${dg.uncovered.length?`<span class="badge b-crit">${dg.uncovered.length}</span> ${esc(dg.uncovered.join(' ').replace(/`/g,''))}`:'<span class="badge b-pos">none</span>'}</dd></dl></section>`
  :`<div class="empty">No data-governance record · stage 4 · run is at stage ${r.stage.id}</div>`;
 return `<header class="ph run-h"><div>
   <div class="row" style="gap:8px"><button class="lnk" data-v="runs">← Runs</button><select id="runPick" class="sel sm" aria-label="Switch run">${opts}</select></div>
   <h1 style="margin-top:8px">${esc(r.title)}</h1>
   <div class="meta">${statusBadge(r)} <span class="mono">${r.slug}</span> · ${dn(r.sponsor?.id)} · stage ${r.stage.id} ${esc(r.stage.name)}${r.synthetic?' · <span class="badge b-none">synthetic</span>':''}</div></div></header>
 <div class="bigtrack-wrap"><div class="bigtrack">${cells}</div></div>
 ${tabs(runTab,T,'data-tab')}
 ${body}`;
};

VIEWS.context=()=>{
 const bk=D.brainkit,R=D.registers;
 const runsCiting=id=>runs.filter(r=>(r.data_governance?.obligations||[]).includes(id)).map(r=>r.slug);
 const ast={'owner-verification-pending':['owner to verify','b-cau'],'demo-stand-in':['stand-in','b-none'],'cited':['cited','b-pos'],'missing':['missing','b-crit']};
 const T=[['brainkit','BrainKit'],['register','Risk register',R.risks.length],['obligations','Obligations',R.obligations.length],['strategy','Strategy & radar'],['profiles','Product profiles',D.product_profiles.length],['coverage','Coverage']];
 let body='';
 if(ctxTab==='brainkit')body=`<div class="grid g-7-5"><section class="card"><div class="ch"><h2>Sections</h2>${prov(bk?.source,'manifest.json')}</div>
   <div class="tbl-wrap"><table><thead><tr><th>Section</th><th>File</th><th>Owner</th><th>Digest</th><th></th></tr></thead><tbody>${(bk?.sections||[]).map(b=>`<tr><td class="t1">${esc(b.section)}</td><td class="mono cap">${esc(b.path)}</td><td class="mono cap">${esc(bk.owners[b.section]||'—')}</td><td class="dig">${esc(b.digest.slice(0,15))}…</td><td><span class="badge b-pos">sealed</span></td></tr>`).join('')}</tbody></table></div></section>
  <section class="card"><div class="ch"><h2>Package</h2>${bk?.check?`<span class="badge ${bk.check.ok?'b-pos':'b-crit'}">brainkit-check ${bk.check.ok?'pass':'fail'}</span>`:''}</div>
   <dl class="props"><dt>Version</dt><dd class="mono">${esc(bk?.version)}</dd><dt>Status</dt><dd>${esc(bk?.status)}</dd><dt>Digest</dt><dd class="dig">${esc((bk?.package_digest||'').slice(0,23))}…</dd><dt>Check</dt><dd>${bk?.check?prov(bk.check.source):'—'}</dd></dl>
   <h3 class="sub">Approvals</h3>${(bk?.approvals||[]).map(a=>`<div class="kv"><div class="l"><span class="mono">${esc(a.version)}</span><span class="dig">${esc(a.by)}</span></div><span class="cap">${fmtDate(a.at)}</span></div>`).join('')}</section></div>`;
 if(ctxTab==='register')body=`<div class="grid g2"><section class="card"><div class="ch"><h2>Risk statements</h2>${prov(R.source)}</div>
   <div class="tbl-wrap"><table><thead><tr><th>Risk</th><th>Inherent</th><th>Residual</th></tr></thead><tbody>${R.risks.map(c=>`<tr><td class="mono">${esc(c.id)}</td><td class="cap">${esc(c.inherent||'—')}</td><td class="cap">${esc(c.residual||'—')}</td></tr>`).join('')}</tbody></table></div></section>
  <section class="card"><div class="ch"><h2>Controls</h2><span class="cap">${R.controls.length}</span></div>
   <div class="tbl-wrap"><table><thead><tr><th>Control</th><th>Name</th></tr></thead><tbody>${R.controls.map(c=>`<tr><td class="mono">${esc(c.id)}</td><td class="cap">${esc(c.name||'')}</td></tr>`).join('')}</tbody></table></div>
   <h3 class="sub">Risk categories</h3><div class="chips">${R.risk_categories.map(c=>`<span class="chip">${esc(c.id)}</span>`).join('')}</div></section></div>`;
 if(ctxTab==='obligations')body=`<section class="card"><div class="ch"><h2>Obligations register</h2>${prov(R.obligations_source)}</div>
  <div class="tbl-wrap"><table><thead><tr><th>Obligation</th><th>Owner role</th><th>Held by</th><th>Verified</th><th>Article</th><th>Cited by</th></tr></thead>
  <tbody>${R.obligations.map(o=>`<tr><td><span class="mono t1">${esc(o.id)}</span><div class="cap">${esc(o.source||'')}</div></td><td class="mono cap">${esc(o.owner_role)}</td><td>${holders(o.owner_role).map(h=>dn(h.id)).join(', ')||'<span class="badge b-crit">unheld</span>'}</td><td class="cap num">${esc(o.last_verified||'—')}</td><td><span class="badge ${ast[o.article_status][1]}">${ast[o.article_status][0]}</span></td><td class="cap">${runsCiting(o.id).join(', ')||'—'}</td></tr>`).join('')}</tbody></table></div></section>`;
 if(ctxTab==='strategy')body=`<div class="grid g2"><section class="card"><div class="ch"><h2>Strategic intents</h2>${prov({file:'institution/brainkit/strategy.md',kind:'record'})}</div>
   ${(bk?.intents||[]).map(i=>{const n=runs.filter(r=>r.strategic_intent?.id===i.id);return `<div class="kv"><div class="l"><span><span class="mono cap">${i.id}</span> ${esc(i.intent)}</span><span class="dig">${i.pursued?esc(i.owner_role)+' · '+esc(i.measure):esc(i.rationale)} · ${n.length} run${n.length===1?'':'s'}</span></div><span class="badge ${i.pursued?'b-pos':'b-none'}">${i.pursued?'pursued':'parked'}</span></div>`;}).join('')}</section>
  <section class="card"><div class="ch"><h2>Technology radar</h2>${prov({file:'institution/brainkit/technology-policy.json',kind:'record'})}</div>
   <div class="tbl-wrap"><table><thead><tr><th>Technology</th><th>Ring</th><th>Review by</th><th>Owner</th></tr></thead><tbody>${(bk?.radar||[]).map(e=>{const d=e.review_by?daysTo(e.review_by):null;return `<tr><td class="t1">${esc(e.technology)}</td><td><span class="badge ${e.ring==='hold'?'b-crit':e.ring==='trial'?'b-cau':'b-info'}">${esc(e.ring)}</span></td><td class="cap num">${e.review_by?fmtDate(e.review_by)+`<div class="${d<0?'bad-t':d<=30?'warn-t':''}">${d<0?-d+'d overdue':'in '+d+'d'}</div>`:'—'}</td><td class="mono cap">${esc(e.owner)}</td></tr>`;}).join('')}</tbody></table></div></section></div>`;
 if(ctxTab==='profiles')body=`<section class="card"><div class="ch"><h2>Product profiles</h2>${prov({file:'profiles/products',kind:'record'})}</div><div class="tbl-wrap"><table><thead><tr><th>Profile</th><th>Runs</th></tr></thead><tbody>${D.product_profiles.map(p=>{const rs=runs.filter(r=>r.product_profile?.id===p);return `<tr><td class="mono">${esc(p)}</td><td>${rs.map(r=>`<button class="irun" data-run="${r.slug}">${r.slug}</button>`).join(' ')||'<span class="cap">—</span>'}</td></tr>`;}).join('')}</tbody></table></div></section>`;
 if(ctxTab==='coverage')body=`<section class="card"><div class="ch"><h2>Context cited per run</h2>${prov({file:D.generator,kind:'derived'})}</div>
  <div class="tbl-wrap"><table class="matrix"><thead><tr><th>Run</th><th>Intent</th><th>Profile</th><th>Risks</th><th>Controls</th><th>Obligations</th><th>Uncovered</th><th>Brand D7</th></tr></thead>
  <tbody>${runs.map(r=>{const dg=r.data_governance;return `<tr class="click" data-run="${r.slug}"><td class="mono">${r.slug}</td><td class="mono cap">${r.strategic_intent?esc(r.strategic_intent.id)+(r.strategic_intent.resolves?'':' ✗'):'—'}</td><td class="mono cap">${esc(r.product_profile?.id||'—')}</td><td class="num">${dg?dg.risks.filter(x=>/-\d{3}$/.test(x)).length:'—'}</td><td class="num">${dg?dg.controls.length:'—'}</td><td class="num">${dg?dg.obligations.length:'—'}</td><td class="num">${dg?(dg.uncovered.length?`<span class="bad-t">${dg.uncovered.length}</span>`:0):'—'}</td><td><span class="cell ${gate(r,'D7').status==='pass'?'y':'n'}"></span></td></tr>`;}).join('')}</tbody></table></div></section>`;
 return `${head('Context',`BrainKit v${esc(bk?.version)} · ${esc(bk?.status)} · ${R.risks.length} risks · ${R.controls.length} controls · ${R.obligations.length} obligations`,bk?.check?`<span class="badge ${bk.check.ok?'b-pos':'b-crit'}">${esc(bk.check.summary)}</span>`:'')}
 ${tabs(ctxTab,T,'data-ctx')}${body}`;
};

VIEWS.install=()=>{
 const I=D.installation;
 const row=(a,b,c)=>`<div class="kv"><div class="l"><span>${a}</span><span class="dig">${b}</span></div>${c}</div>`;
 const on=x=>x?'<span class="badge b-pos">mounted</span>':'<span class="badge b-none">absent</span>';
 const byC={};for(const x of D.approvals.rows)(byC[x.change_id+' · '+x.stage]||=[]).push(x);
 return `${head('Installation',`middleleap-loom ${esc(I.bundle_version||'—')} · ${esc(I.tier||'—')} tier · adopted ${fmtDate(I.adopted_at)}`,prov(I.source))}
 <div class="grid g3">
  <section class="card"><div class="ch"><h2>Seams</h2></div>
   ${row('BrainKit','institution/brainkit/manifest.json',on(I.seams.brainkit))}
   ${row('Data-risk register','docs/governance/data-risk-register/',on(I.seams.register))}
   ${row('Obligations register','docs/governance/obligations.json',on(I.seams.obligations))}
   ${row('Brand profile','discovery/brand/design.md',on(I.seams.brand))}
   ${row('Factory Floor',I.floor_blocked_by?'residency approval missing':'residency approval on record',I.seams.floor?'<span class="badge b-pos">enabled</span>':'<span class="badge b-none">disabled</span>')}
  </section>
  <section class="card"><div class="ch"><h2>Hooks</h2>${prov({file:'.claude/settings.json',kind:'record'})}</div>
   ${I.hooks.map(h=>row(esc(h.name),esc(h.event+' · '+(h.matcher||'any')),'<span class="badge b-pos">on</span>')).join('')}
  </section>
  <section class="card"><div class="ch"><h2>CI</h2>${I.ci.map(c=>prov({file:c.file,kind:'record'})).join('')}</div>
   ${I.ci.flatMap(c=>c.steps).map(s=>`<div class="kv"><div class="l"><span>${esc(s)}</span></div></div>`).join('')}
   <div class="kv"><div class="l"><span>Reviewer agents</span><span class="dig">.claude/agents</span></div><span class="cap num">${I.agents.length||'none'}</span></div>
  </section>
 </div>
 <section class="card" style="margin-top:16px"><div class="ch"><h2>Approval queue</h2><div class="row"><span class="cap">${D.approvals.rows.length} pending · ${D.approvals.rows.filter(x=>x.breached).length} past SLA</span>${prov(D.approvals.source)}</div></div>
  <div class="tbl-wrap"><table><thead><tr><th>Change</th><th>Role</th><th>Held by</th><th>Age</th><th>Target</th><th>SLA</th></tr></thead><tbody>
  ${Object.entries(byC).map(([k,rows])=>rows.map((y,i)=>`<tr><td class="mono ${i?'cap':''}">${i?'':esc(k)}</td><td class="mono cap">${esc(y.role)}</td><td>${y.holders.map(dn).join(', ')||'<span class="badge b-crit">unheld</span>'}</td><td class="num">${y.age_days}d</td><td class="num cap">${y.target_days}d</td><td><span class="badge ${y.breached?'b-cau':'b-pos'}">${y.breached?'breached':'within'}</span></td></tr>`).join('')).join('')}
  </tbody></table></div></section>
 <section class="card" style="margin-top:16px"><div class="ch"><h2>Governance decisions</h2>${prov(D.control_catalog.source)}</div>
  <div class="tbl-wrap"><table><thead><tr><th>ID</th><th>Objective</th><th>Owner</th><th>State</th></tr></thead><tbody>${D.control_catalog.governance.map(h=>`<tr><td class="mono t1">${h.id}</td><td class="cap">${esc(h.objective.length>120?h.objective.slice(0,118)+'…':h.objective)}</td><td class="mono cap">${esc(h.owner_role)}</td><td>${stBadge(h.state)}</td></tr>`).join('')}</tbody></table></div></section>`;
};

/* ================= HELP DRAWER — explanation lives here, not on the page ================= */
const PAGE_HELP={
 overview:'Counts, the inbox and the pipeline for this installation. Every number is computed from files in the repository when the snapshot was generated.',
 inbox:'Items that need a person. Each is derived from a record, an executed check or approval telemetry, and names who acts. Telemetry flags; it never blocks.',
 runs:'Stage and status come from which artifacts exist and what the D1–D9 validator returned. A run has a PRD (hand-off) only when all nine gates pass.',
 run:'One discovery run: its stages, the validator result, the prototype on disk and, once handed off, the PRD.',
 context:'What agents read: the BrainKit (sealed institutional context), the data-risk and obligations registers, and product profiles. Each has a named owner; agents never write to it.',
 install:'Read from the adoption stamp, the Claude Code settings and the CI workflow in the repository.'
};
function helpHtml(){
 const R=ROLES[role];
 const go=t=>{if(t==='run:first'){const r=runs.find(x=>x.sponsor?.id===poId)||runs[0];return `data-run="${r.slug}"`;}if(t==='run:blocked'){const r=byStatus('gate-failing')[0]||runs[0];return `data-run="${r.slug}" data-tab="gates"`;}if(t==='run:model'){const r=runs.find(x=>x.product_profile?.id==='ai-decision-system')||runs[0];return `data-run="${r.slug}"`;}if(t.startsWith('run:'))return `data-run="${t.slice(4)}"`;return `data-go="${t}"`;};
 const people=R.reg.map(rg=>{const hs=holders(rg);return `<div class="kv"><div class="l"><span class="mono">${rg}</span></div><span class="cap">${hs.length?hs.map(h=>esc(pname(h.id))).join(', '):'unheld'}</span></div>`;}).join('');
 const cc=D.control_catalog;
 return `<div class="dh"><b>Help</b><button class="icon-btn" data-help="close" aria-label="Close help">×</button></div>
 ${role!=='all'?`<section><h3>${esc(R.label)}</h3>
  ${people||'<p class="cap">No registry role maps to this view.</p>'}
  <h4>Where to look</h4>${R.guide.map(q=>`<button class="hq" ${go(q[2])}><span>${esc(q[0])}</span><span class="cap">${esc(q[1])} →</span></button>`).join('')}
  <h4>Where you decide</h4><p>${R.hg&&HG[R.hg]?`<span class="mono">${R.hg}</span> ${esc(HG[R.hg].objective.split(/[;:]/)[0])} ${stBadge(HG[R.hg].state)}<br><span class="cap">Signed records in git, merged by a second person. The console is read-only.</span>`:esc(R.decide||'')}</p>
  <h4>Not in the console</h4><p class="cap">${esc(R.gap)}</p></section>`:''}
 <section><h3>This page</h3><p class="cap">${PAGE_HELP[curView]||''}</p></section>
 <section><h3>Source tags</h3>${['record','executed-check','derived','telemetry'].map(k=>`<div class="kv"><div class="l"><span><span class="prov k-${k}" style="cursor:default">${KLABEL[k]}</span></span></div><span class="cap">${{record:'a file in the repository',"executed-check":'a check run at snapshot time',derived:'computed by the console',telemetry:'ages and SLAs; never blocks'}[k]}</span></div>`).join('')}<p class="cap" style="margin-top:6px">Click any tag to copy its path.</p></section>
 <section><h3>Control maturity</h3><p class="cap">${cc.ladder.map(s=>esc(s)).join(' → ')}. A control moves right only when evidence of enforcement is recorded. Platform and organisational enforcement belong to the institution; the Loom is a build-time frame.</p></section>
 <section><h3>Snapshot</h3><dl class="props"><dt>Generated</dt><dd>${fmtStamp(D.generated_at)}</dd><dt>By</dt><dd class="mono">${esc(D.generator)}</dd><dt>Schema</dt><dd class="mono">${esc(D.schema)}</dd><dt>Commit</dt><dd class="mono">${D.repository.commit?esc(D.repository.commit.slice(0,7)):'—'}</dd><dt>Authority</dt><dd class="mono">${esc(D.authority)}</dd></dl>${D.repository.commit?'':`<p class="cap" style="margin-top:6px">${esc(D.repository.note)}</p>`}${BUILD?`<p class="cap" style="margin-top:6px">${esc(BUILD)}</p>`:''}</section>`;
}

/* ================= CHROME + ROUTER ================= */
/* ---------- theme: light / dark, following the system until the viewer picks ---------- */
const SUN='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6 13 13M3 13l1.4-1.4M11.6 4.4 13 3"/></svg>';
const MOON='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z"/></svg>';
const sysLight=()=>globalThis.matchMedia?.('(prefers-color-scheme: light)').matches;
let theme=null;try{theme=localStorage.getItem('loom-theme');}catch(e){}
const hostTheme=document.documentElement.dataset.theme||null;
const effTheme=()=>theme||hostTheme||(sysLight()?'light':'dark');
function applyTheme(){if(theme)document.documentElement.dataset.theme=theme;const b=$('#themeBtn');if(b){b.innerHTML=effTheme()==='dark'?SUN:MOON;b.title=effTheme()==='dark'?'Switch to light':'Switch to dark';}}
applyTheme();
$('#themeBtn').addEventListener('click',()=>{theme=effTheme()==='dark'?'light':'dark';try{localStorage.setItem('loom-theme',theme)}catch(e){}applyTheme();});
globalThis.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change',applyTheme);

const synth=runs.filter(r=>r.synthetic).length;
if(synth){const eb=$('#envbar');eb.hidden=false;eb.innerHTML=`<span class="dia" style="background:#110D0A"></span>Synthetic data · ${synth} of ${runs.length} runs · ${esc(INST)}`;}
$('#ws').innerHTML=`<b>${esc(INST)}</b><span class="cap mono">loom ${esc(D.installation.bundle_version||'—')} · ${esc(D.installation.tier||'—')}</span>`;
$('#runCount').textContent=runs.length;
$('#snap').innerHTML=`<span class="badge b-none">read-only</span> <span class="cap">Snapshot ${fmtStamp(D.generated_at)}</span>`;
$('#sideFoot').innerHTML=`<span class="cap mono">${esc(D.schema)}</span>${D.repository.commit?`<span class="cap mono">@ ${esc(D.repository.commit.slice(0,7))}</span>`:''}`;
$('#roleSel').innerHTML=Object.entries(ROLES).map(([k,R])=>`<option value="${k}">${esc(R.label)}</option>`).join('');
function renderChrome(){
 $('#roleSel').value=role;
 $('#poWrap').innerHTML=ROLES[role].owner?`<select class="sel sm" id="poPick" aria-label="Product owner">${POS.map(p=>`<option value="${p}" ${p===poId?'selected':''}>${esc(pname(p))}</option>`).join('')}</select>`:'';
 $('#inboxCount').textContent=mine().length;
 const h=$('#help');h.hidden=!helpOpen;$('#helpBtn').setAttribute('aria-expanded',String(helpOpen));if(helpOpen)h.innerHTML=helpHtml();
}
const CRUMB={overview:'Overview',inbox:'Inbox',runs:'Runs',context:'Context',install:'Installation'};
function render(v){
 if(v&&v.startsWith('context:')){ctxTab=v.slice(8);v='context';}
 if(!VIEWS[v])v='overview';curView=v;
 document.querySelectorAll('#nav button').forEach(b=>b.setAttribute('aria-current',(b.dataset.v===v||(v==='run'&&b.dataset.v==='runs'))?'page':'false'));
 $('#view').innerHTML=VIEWS[v]();
 renderChrome();
 $('#crumbs').innerHTML=esc(INST)+' / '+(v==='run'?`<button class="lnk" data-v="runs">Runs</button> / <b>${esc(curRun)}</b>`:`<b>${CRUMB[v]}</b>`);
 try{history.replaceState(null,'','#'+(v==='run'?'run-'+curRun:v))}catch(e){}
 const pick=$('#runPick');if(pick)pick.addEventListener('change',e=>{curRun=e.target.value;runTab='summary';render('run')});
 const q=$('#q');if(q)q.addEventListener('input',()=>{const t=q.value.trim().toLowerCase();document.querySelectorAll('#runTable tbody tr').forEach(tr=>{tr.hidden=!!t&&!tr.dataset.s.includes(t);});});
 window.scrollTo(0,0);
}
function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>{el.hidden=true},2600);}
function setRole(k){role=k;showAll=false;runFilter='all';sevFilter='all';try{localStorage.setItem('loom-role',role)}catch(err){}render(ROLES[role].home);}
$('#roleSel').addEventListener('change',e=>setRole(e.target.value));
$('#poWrap').addEventListener('change',e=>{if(e.target.id==='poPick'){poId=e.target.value;try{localStorage.setItem('loom-po',poId)}catch(err){}render(curView==='run'?'runs':curView);}});
$('#helpBtn').addEventListener('click',()=>{helpOpen=!helpOpen;renderChrome();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&helpOpen){helpOpen=false;renderChrome();}});
document.addEventListener('click',e=>{
 const c=e.target.closest('[data-copy]');if(c){e.stopPropagation();const t=c.dataset.copy;try{navigator.clipboard.writeText(t).then(()=>toast('Copied '+t),()=>toast(t));}catch(err){toast(t);}return;}
 if(e.target.closest('[data-help="close"]')){helpOpen=false;renderChrome();return;}
 const rs=e.target.closest('[data-role-set]');if(rs){setRole(rs.dataset.roleSet);return;}
 const ow=e.target.closest('[data-owners]');if(ow){showAll=ow.dataset.owners==='all';render('runs');return;}
 const sv=e.target.closest('[data-sev]');if(sv){sevFilter=sv.dataset.sev;render('inbox');return;}
 const cx=e.target.closest('[data-ctx]');if(cx){ctxTab=cx.dataset.ctx;render('context');return;}
 const f=e.target.closest('[data-filter]');if(f){runFilter=f.dataset.filter;render('runs');return;}
 const r=e.target.closest('[data-run]');if(r){curRun=r.dataset.run;runTab=r.dataset.tab||'summary';render('run');return;}
 const tb=e.target.closest('[data-tab]');if(tb){runTab=tb.dataset.tab;render('run');return;}
 const n=e.target.closest('[data-v]');if(n){render(n.dataset.v);return;}
 const g=e.target.closest('[data-go]');if(g){render(g.dataset.go);return;}
});
function fromHash(){let h=(location.hash||'').slice(1);if(h.startsWith('as-')&&ROLES[h.slice(3)]){role=h.slice(3);h=ROLES[role].home;}if(h.startsWith('run-')){const s=h.slice(4);if(runs.some(r=>r.slug===s)){if(s!==curRun)runTab='summary';curRun=s;h='run';}}render(h||'overview');}
window.addEventListener('hashchange',fromHash);
fromHash();
