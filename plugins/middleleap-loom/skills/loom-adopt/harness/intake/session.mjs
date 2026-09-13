// Browser draft storage is separate from the exported institutional record and its authority.
export const PREFIX = 'loom.intake.session.v2.';
export function visibleBlocks(bank, role, all = false) {
  return all || role === 'the facilitator' ? bank.blocks : bank.blocks.filter(b => b.role === role);
}
export function createSession(institution, route, bank, id) {
  if (!institution?.trim()) throw new Error('Enter an institution name before starting.');
  if (!['institution', 'example'].includes(route) || !/^[a-zA-Z0-9-]+$/.test(id)) throw new Error('Invalid session route or identifier.');
  const state = { institution: institution.trim(), role: '', pack: '', answers: {} };
  if (route === 'example') {
    state.institution = 'SYNTHETIC EXAMPLE — Meridian Trust';
    state.role = bank.blocks[0].role;
    const q = bank.questions.find(q => q.block === bank.blocks[0].id);
    state.answers[q.id] = { answer: 'SYNTHETIC EXAMPLE: a fictional institution uses a shared brand guide.', reference: 'SYNTHETIC EXAMPLE: Brand Guide v1 (not a real source)', role: state.role, prefilled_from: null };
  }
  return { schema: 'loom.intake-session/v2', id, route, revision: 0, current: bank.blocks[0].id, all: false, state };
}
export function validateSession(value, bank, digest) {
  if (!value || value.schema !== 'loom.intake-session/v2' || !/^[a-zA-Z0-9-]+$/.test(value.id) || !['institution','example'].includes(value.route) || !Number.isInteger(value.revision) || value.revision < 0) throw new Error('Invalid saved session. The original storage has been retained.');
  if (value.digest && value.digest !== digest) throw new Error('This session uses another question bank. Keep its original questionnaire and reconcile the exported record.');
  const s = value.state;
  if (!s || typeof s.institution !== 'string' || !s.institution.trim() || typeof s.role !== 'string' || typeof s.pack !== 'string' || !s.answers || typeof s.answers !== 'object' || Array.isArray(s.answers)) throw new Error('Invalid saved answers. The original storage has been retained.');
  if (typeof value.all !== 'boolean' || !bank.blocks.some(b => b.id === value.current)) throw new Error('Invalid saved navigation.');
  for (const [id, a] of Object.entries(s.answers)) {
    if (!bank.questions.some(q => q.id === id) || !a || typeof a !== 'object' || Array.isArray(a)) throw new Error('Saved answers do not match this question bank.');
    for (const field of ['answer','reference','role']) if (a[field] !== undefined && typeof a[field] !== 'string') throw new Error('A saved answer is malformed.');
    if (a.prefilled_from != null && typeof a.prefilled_from !== 'string') throw new Error('Saved provenance is malformed.');
  }
  return value;
}
export function saveSession(storage, session, bank, digest) {
  validateSession(session, bank, digest);
  if (session.route === 'example') return session; // example never overwrites or populates institutional storage
  const key = PREFIX + session.id, raw = storage.getItem(key);
  if (raw) {
    const existing = validateSession(JSON.parse(raw), bank, digest);
    if (existing.revision !== session.revision) throw new Error('This session changed in another tab. Export your work before reloading the saved session.');
    if (existing.state.institution !== session.state.institution) throw new Error('Institution cannot be changed inside a saved session. Start a separate session.');
  } else if (session.revision !== 0) throw new Error('This saved session was removed elsewhere. Export your work before leaving.');
  const next = { ...session, digest, revision: session.revision + 1 };
  storage.setItem(key, JSON.stringify(next));
  return next;
}
export function listSessions(storage, bank, digest) {
  const sessions = [], errors = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i); if (!key?.startsWith(PREFIX)) continue;
      try { const s = validateSession(JSON.parse(storage.getItem(key)), bank, digest); if (key !== PREFIX + s.id) throw new Error('Session identifier mismatch.'); sessions.push(s); }
      catch (error) { errors.push(`${key}: ${error.message}`); }
    }
  } catch { errors.push('Browser storage is unavailable. Keep this page open and export your work.'); }
  return { sessions, errors };
}
export function recoverLegacy(raw, bank, id, institution) {
  const old = JSON.parse(raw);
  const session = createSession(old?.institution || institution, 'institution', bank, id);
  session.state = { ...session.state, ...old, institution: session.state.institution };
  return validateSession(session, bank);
}
export function sourceState(answer) {
  return { reference: answer?.reference?.trim() ? 'Reference supplied' : 'Reference missing', retrieval: 'Not checked here', approval: 'Not assessed here' };
}
