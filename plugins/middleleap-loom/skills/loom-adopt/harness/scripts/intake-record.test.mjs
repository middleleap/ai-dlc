import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { validateRecord, updateAnswer, exportRecord, previewImport, applyImport } from '../intake/record.mjs';
import { loadSources, render } from '../intake/build-questionnaire.mjs';

const { bank, questions_digest: digest } = loadSources();
const empty = () => ({ institution: 'Synthetic Test Institution', role: '', pack: '', answers: {} });
const answer = (block, role) => {
  let s = { ...empty(), role };
  for (const q of bank.questions.filter(q => q.block === block)) {
    s = updateAnswer(s, q.id, 'answer', `Synthetic answer ${q.id}`);
    s = updateAnswer(s, q.id, 'reference', `Synthetic source ${q.id}`);
  }
  return exportRecord(s, bank, digest);
};
const a = answer('A', 'brand owner'), c = answer('C', 'architecture owner');

test('two role exports merge in either order without blank entries erasing answers', () => {
  const ac = applyImport(applyImport(empty(), a, bank, digest), c, bank, digest);
  const ca = applyImport(applyImport(empty(), c, bank, digest), a, bank, digest);
  assert.deepEqual(ac, ca);
  assert.equal(Object.keys(ac.answers).length, bank.questions.filter(q => ['A', 'C'].includes(q.block)).length);
  assert.equal(ac.answers.A1.role, 'brand owner');
  assert.equal(ac.answers.C1.role, 'architecture owner');
  assert.deepEqual(applyImport(ac, a, bank, digest), ac, 're-import is idempotent');
});

test('conflicting answers require an explicit choice; preview and failed apply never mutate state', () => {
  const s = applyImport(empty(), a, bank, digest), before = JSON.stringify(s);
  const changed = structuredClone(a); changed.answers[0].answer = 'Corrected answer';
  const p = previewImport(s, changed, bank, digest);
  assert.equal(p.conflicts.length, 1);
  assert.throws(() => applyImport(s, changed, bank, digest), /Choose/);
  assert.equal(JSON.stringify(s), before);
  assert.equal(applyImport(s, changed, bank, digest, { A1: 'keep' }).answers.A1.answer, s.answers.A1.answer);
  assert.equal(applyImport(s, changed, bank, digest, { A1: 'incoming' }).answers.A1.answer, 'Corrected answer');
});

test('different owners of identical prose remain an explicit provenance conflict', () => {
  const s = applyImport(empty(), a, bank, digest), other = structuredClone(a);
  other.answers[0].respondent_role = 'different owner';
  assert.equal(previewImport(s, other, bank, digest).conflicts[0].id, 'A1');
});

test('cross-institution and different question-bank imports fail without mutation', () => {
  const s = applyImport(empty(), a, bank, digest);
  const other = { ...c, institution: 'Another institution' };
  assert.throws(() => applyImport(s, other, bank, digest), /different institution/);
  assert.throws(() => applyImport(s, { ...c, questions_digest: 'sha256:' + '0'.repeat(64) }, bank, digest), /different question bank/);
  assert.equal(s.answers.A1.role, 'brand owner');
});

test('switching the current role does not reattribute earlier answers on export', () => {
  let s = { ...empty(), role: 'brand owner' };
  s = updateAnswer(s, 'A1', 'answer', 'brand answer');
  s = { ...s, role: 'architecture owner' };
  s = updateAnswer(s, 'C1', 'answer', 'architecture answer');
  const out = exportRecord(s, bank, digest);
  assert.equal(out.answers.find(a => a.id === 'A1').respondent_role, 'brand owner');
  assert.equal(out.answers.find(a => a.id === 'C1').respondent_role, 'architecture owner');
});

test('legacy unowned answers require an explicit correction, not a guessed current role', () => {
  let s = { ...empty(), role: 'architecture owner', answers: { A1: { answer: 'legacy answer' } } };
  s = updateAnswer(s, 'A1', 'reference', 'Policy');
  assert.match(validateRecord(exportRecord(s, bank, digest), bank, digest).findings.join(), /respondent_role/);
  s = updateAnswer(s, 'A1', 'role', 'brand owner');
  assert.deepEqual(validateRecord(exportRecord(s, bank, digest), bank, digest).findings, []);
});

test('a record cannot claim approval, duplicate answers, or omit answered-item ownership', () => {
  for (const change of [r => r.authority = 'approved', r => r.answers.push(r.answers[0]), r => delete r.answers[0].respondent_role]) {
    const r = structuredClone(a); change(r);
    assert.ok(validateRecord(r, bank, digest).findings.length);
    assert.throws(() => applyImport(empty(), r, bank, digest));
  }
});

test('malformed imports return actionable findings rather than crashing the preview', () => {
  for (const r of [null, [], { ...a, institution: 42 }, { ...a, answers: [null] }, { ...a, answers: [{ ...a.answers[0], answer: 42 }] }, { ...a, questions_digest: 42 }]) {
    assert.ok(previewImport(empty(), r, bank, digest).errors.length);
  }
});

test('summaries are derived from answers and incorrect supplied totals are reported', () => {
  const r = { ...a, summary: { SOURCED: 999, CLAIMED: 0, UNKNOWN: 0 } };
  const checked = validateRecord(r, bank, digest);
  assert.equal(checked.summary.SOURCED, 6);
  assert.equal(checked.summary.UNKNOWN, bank.questions.length - 6);
  assert.ok(checked.notices.some(n => /recomputed/.test(n)));
});

test('generated standalone page embeds the shared logic and parses as JavaScript', () => {
  const html = render();
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
  assert.doesNotThrow(() => new Script(script));
  const logic = script.slice(0, script.indexOf('(function(){'));
  const embedded = new Script(logic + '\nIntake;').runInNewContext();
  const s = embedded.applyImport(embedded.applyImport(empty(), a, bank, digest), c, bank, digest);
  assert.equal(s.answers.A1.role, 'brand owner');
  assert.equal(s.answers.C1.role, 'architecture owner');
  assert.match(html, /data-conflict/);
});
