// Shared by the Node checker and the generated, standalone questionnaire.
// Pure record operations: importing records never approves institutional content.
export function disposition(answer) {
  return !answer?.answer?.trim() ? 'UNKNOWN' : answer.reference?.trim() ? 'SOURCED' : 'CLAIMED';
}

export function validateRecord(record, bank, digest) {
  const findings = [], notices = [];
  const summary = { SOURCED: 0, CLAIMED: 0, UNKNOWN: 0 };
  if (!record || typeof record !== 'object' || Array.isArray(record)) return { findings: ['record is not an object'], notices, summary };
  if (record.schema !== 'loom.intake-record/v1') findings.push('schema must be loom.intake-record/v1');
  if (record.authority !== 'none') findings.push('an intake record must say authority: none');
  if (typeof record.institution !== 'string' || !record.institution.trim()) findings.push('institution is empty');
  if (typeof record.generated_at !== 'string' || Number.isNaN(Date.parse(record.generated_at))) findings.push('generated_at is not a date-time');
  if (record.questions_digest !== undefined && (typeof record.questions_digest !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(record.questions_digest))) findings.push('questions_digest must be a sha256 digest');
  if (record.prefill_pack != null && typeof record.prefill_pack !== 'string') findings.push('prefill_pack must be text or null');
  if (!Array.isArray(record.answers)) return { findings: [...findings, 'answers is not an array'], notices, summary };
  const questions = new Map(bank.questions.map(q => [q.id, q]));
  // Roles the bank itself names ("Chief Risk Officer") are never mistaken for a person's name.
  // Anything else that has name shape is a notice, not a refusal: the shape check is a heuristic.
  const knownRoles = new Set([...(bank.blocks || []).map(b => b.role), 'the facilitator'].map(r => String(r).trim().toLowerCase()));
  const seen = new Set();
  for (const a of record.answers) {
    if (!a || typeof a !== 'object' || Array.isArray(a)) { findings.push('answer entry is not an object'); continue; }
    const tag = `answer ${a.id ?? '?'}`;
    if (!questions.has(a.id)) { findings.push(`${tag}: not a question in the bank`); continue; }
    if (seen.has(a.id)) { findings.push(`${tag}: duplicated`); continue; }
    seen.add(a.id);
    if (a.block !== questions.get(a.id).block) findings.push(`${tag}: block does not match the question`);
    let invalid = false;
    for (const field of ['answer', 'reference', 'respondent_role']) {
      if (a[field] !== undefined && typeof a[field] !== 'string') { findings.push(`${tag}: ${field} must be text`); invalid = true; }
    }
    if (a.prefilled_from != null && typeof a.prefilled_from !== 'string') findings.push(`${tag}: prefilled_from must be text or null`);
    if (invalid) continue;
    const expected = disposition(a);
    summary[expected]++;
    if (a.disposition !== expected) findings.push(`${tag}: disposition disagrees with its content — expected ${expected}`);
    if (expected !== 'UNKNOWN' && !a.respondent_role?.trim()) findings.push(`${tag}: answered questions require a respondent_role`);
    const role = a.respondent_role?.trim() || '';
    if (role && !knownRoles.has(role.toLowerCase()) && /^[A-Z][a-z]+(?:\s+[A-Z][a-z'’-]+){1,2}$/.test(role)) notices.push(`${tag}: respondent_role looks like a person's name — roles only`);
  }
  const missing = [...questions.keys()].filter(id => !seen.has(id));
  summary.UNKNOWN += missing.length;
  if (missing.length) notices.push(`${missing.length} question(s) have no answer entry`);
  if (record.questions_digest && record.questions_digest !== digest) notices.push('record answers an older question bank — review changed questions before combining records');
  if (record.summary && Object.keys(summary).some(k => record.summary[k] !== summary[k])) notices.push('supplied summary differs from answers; totals have been recomputed');
  return { findings, notices, summary };
}

// Capture the selected role only on the first entry. Legacy content with no owner is not
// silently reattributed; it must be corrected using the explicit Answered by field.
export function updateAnswer(state, id, field, value) {
  const previous = state.answers[id];
  const fresh = !previous || (!previous.answer && !previous.reference && !previous.role);
  const a = { answer: '', reference: '', role: '', prefilled_from: null, ...previous };
  if (fresh && field !== 'role') a.role = state.role || '';
  a[field] = value;
  return { ...state, answers: { ...state.answers, [id]: a } };
}

export function exportRecord(state, bank, digest, now = new Date().toISOString()) {
  const answers = bank.questions.map(q => {
    const a = state.answers[q.id] || {};
    const out = { id: q.id, block: q.block, disposition: disposition(a) };
    if (a.answer?.trim()) out.answer = a.answer.trim();
    if (a.reference?.trim()) out.reference = a.reference.trim();
    if (a.role?.trim()) out.respondent_role = a.role.trim();
    if (a.prefilled_from) out.prefilled_from = a.prefilled_from;
    return out;
  });
  const record = { schema: 'loom.intake-record/v1', authority: 'none', institution: state.institution.trim(), generated_at: now, prefill_pack: state.pack || null, questions_digest: digest, answers };
  record.summary = validateRecord(record, bank, digest).summary;
  return record;
}

// Preview without mutation. Blank entries are not deletions. Conflicts include provenance,
// so even identical prose from different owners requires a deliberate choice.
export function previewImport(state, record, bank, digest) {
  const checked = validateRecord(record, bank, digest);
  const errors = [...checked.findings];
  if (state.institution.trim() && state.institution.trim().toLowerCase() !== (typeof record?.institution === 'string' ? record.institution.trim().toLowerCase() : '')) errors.push('This record belongs to a different institution. Start a separate session to import it.');
  if (record?.questions_digest && record.questions_digest !== digest) errors.push('This record uses a different question bank. Reconcile its questions before importing.');
  if (errors.length) return { errors, notices: checked.notices, additions: [], conflicts: [] };
  const additions = [], conflicts = [];
  for (const answer of record.answers) {
    if (!answer.answer?.trim() && !answer.reference?.trim()) continue;
    const incoming = { answer: answer.answer || '', reference: answer.reference || '', role: answer.respondent_role || '', prefilled_from: answer.prefilled_from || null };
    const current = state.answers[answer.id];
    if (!current || (!current.answer?.trim() && !current.reference?.trim())) additions.push({ id: answer.id, incoming });
    else if (['answer', 'reference', 'role', 'prefilled_from'].some(k => (current[k] || '') !== (incoming[k] || ''))) conflicts.push({ id: answer.id, current: { ...current }, incoming });
  }
  return { errors, notices: checked.notices, additions, conflicts };
}

export function applyImport(state, record, bank, digest, choices = {}) {
  const preview = previewImport(state, record, bank, digest);
  if (preview.errors.length) throw new Error(preview.errors.join('\n'));
  if (preview.conflicts.some(c => !['keep', 'incoming'].includes(choices[c.id]))) throw new Error('Choose which answer to keep for every conflict before importing.');
  const answers = { ...state.answers };
  for (const a of preview.additions) answers[a.id] = { ...a.incoming };
  for (const c of preview.conflicts) if (choices[c.id] === 'incoming') answers[c.id] = { ...c.incoming };
  return { ...state, institution: state.institution.trim() || record.institution.trim(), pack: state.pack || record.prefill_pack || '', answers };
}
