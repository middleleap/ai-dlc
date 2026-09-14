import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createSession, saveSession, listSessions, recoverLegacy, visibleBlocks, sourceState, PREFIX } from '../intake/session.mjs';
import { loadSources, render } from '../intake/build-questionnaire.mjs';
import { exportRecord, validateRecord, previewImport } from '../intake/record.mjs';
const { bank, questions_digest: digest } = loadSources();
const store = () => {const data=new Map();return {get length(){return data.size;},key:i=>[...data.keys()][i],getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
test('two institutions save and resume independent answers, roles and navigation', () => {
  const storage=store();let a=createSession('Alpha','institution',bank,'alpha'),b=createSession('Beta','institution',bank,'beta');
  a.state.role=bank.blocks[0].role;a.current=bank.blocks[1].id;a.all=true;
  a.state.answers[bank.questions[0].id]={answer:'Alpha only',role:a.state.role,reference:''};
  a=saveSession(storage,a,bank,digest);b=saveSession(storage,b,bank,digest);
  const {sessions,errors}=listSessions(storage,bank,digest);
  assert.deepEqual(errors,[]);assert.deepEqual(sessions,[a,b]);assert.deepEqual(b.state.answers,{});
  assert.throws(()=>saveSession(storage,{...a,state:{...a.state,institution:'Beta'}},bank,digest),/cannot be changed/);
});
test('same-name intakes remain separate sessions rather than overwriting', () => {
  const storage=store();saveSession(storage,createSession('Alpha','institution',bank,'one'),bank,digest);saveSession(storage,createSession('Alpha','institution',bank,'two'),bank,digest);
  assert.equal(listSessions(storage,bank,digest).sessions.length,2);
});
test('stale tab save preserves the newer stored answers', () => {
  const storage=store(),initial=saveSession(storage,createSession('Alpha','institution',bank,'one'),bank,digest);
  const newer=saveSession(storage,{...initial,state:{...initial.state,role:bank.blocks[0].role}},bank,digest);
  assert.throws(()=>saveSession(storage,initial,bank,digest),/another tab/);
  assert.deepEqual(listSessions(storage,bank,digest).sessions,[newer]);
});
test('storage failures are explicit and do not advance in-memory revision', () => {
  const s=createSession('Alpha','institution',bank,'one'),storage=store();storage.setItem=()=>{throw new Error('quota');};
  assert.throws(()=>saveSession(storage,s,bank,digest),/quota/);assert.equal(s.revision,0);
  assert.equal(listSessions({get length(){throw new Error('denied');}},bank,digest).errors.length,1);
});
test('malformed and different-bank sessions remain untouched and produce recovery findings', () => {
  const storage=store();storage.setItem(PREFIX+'bad','{');
  const s=createSession('Alpha','institution',bank,'old');s.digest='sha256:old';storage.setItem(PREFIX+'old',JSON.stringify(s));
  const report=listSessions(storage,bank,digest);assert.equal(report.errors.length,2);assert.equal(report.sessions.length,0);assert.equal(storage.getItem(PREFIX+'bad'),'{');
});
test('legacy recovery validates shape and does not invent missing attribution', () => {
  const old={institution:'Alpha',pack:'',role:bank.blocks[1].role,answers:{[bank.questions[0].id]:{answer:'Legacy answer',reference:''}}};
  const session=recoverLegacy(JSON.stringify(old),bank,'recovered');
  assert.equal(session.state.answers[bank.questions[0].id].role,undefined);
  assert.ok(validateRecord(exportRecord(session.state,bank,digest),bank,digest).findings.some(f=>f.includes('respondent_role')));
  assert.throws(()=>recoverLegacy(JSON.stringify({...old,answers:[]}),bank,'bad'),/Invalid saved/);
});
test('role views show only matching blocks unless facilitator explicitly sees all', () => {
  assert.deepEqual(visibleBlocks(bank,''),[]);
  for(const b of bank.blocks)assert.ok(visibleBlocks(bank,b.role).every(v=>v.role===b.role));
  assert.equal(visibleBlocks(bank,'the facilitator').length,bank.blocks.length);
  assert.equal(visibleBlocks(bank,bank.blocks[0].role,true).length,bank.blocks.length);
});
test('synthetic example is exportable, isolated and cannot merge into a real institution', () => {
  const storage=store(),s=createSession('Example','example',bank,'example');saveSession(storage,s,bank,digest);
  assert.equal(storage.length,0);
  const record=exportRecord(s.state,bank,digest);assert.deepEqual(validateRecord(record,bank,digest).findings,[]);
  assert.match(record.institution,/SYNTHETIC/);assert.equal(record.authority,'none');
  assert.ok(previewImport(createSession('Alpha','institution',bank,'alpha').state,record,bank,digest).errors.length);
});
test('a supplied reference never implies retrieval or approval', () => {
  assert.deepEqual(sourceState({reference:'Policy v2'}),{reference:'Reference supplied',retrieval:'Not checked here',approval:'Not assessed here'});
  assert.equal(sourceState({}).reference,'Reference missing');
});
test('generated standalone scripts parse without module imports', () => {
  const html=render();let scripts=0;
  for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!match[1].includes('application/json')){new vm.Script(match[2]);scripts++;}
  assert.equal(scripts,1);
});
