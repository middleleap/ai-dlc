// Tests for the marketplace validator — the repo's only gate, so a change to it
// needs proof it still fails what it used to fail. Run: `node --test scripts/`
//
// Each case builds a throwaway git repo containing a minimal VALID marketplace,
// breaks exactly one thing, and asserts the exit code and message. The git repo
// is the point: the validator reads the git tree, so "tracked" vs "untracked" is
// a behavioural difference that only a real checkout can exercise.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const VALIDATOR = resolve(dirname(fileURLToPath(import.meta.url)), 'validate-marketplace.mjs')

const git = (cwd, ...args) =>
  execFileSync('git', ['-C', cwd, ...args], { stdio: 'ignore', env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null' } })

const write = (p, s) => {
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, s)
}

/** A minimal marketplace that validates clean, in a fresh git repo. */
function build() {
  const dir = mkdtempSync(join(tmpdir(), 'mkt-'))
  mkdirSync(join(dir, 'scripts'), { recursive: true })
  cpSync(VALIDATOR, join(dir, 'scripts', 'validate-marketplace.mjs'))
  write(join(dir, '.claude-plugin', 'marketplace.json'), JSON.stringify({
    name: 'demo-mkt',
    owner: { name: 'Demo' },
    plugins: [{ name: 'demo', source: './plugins/demo', version: '1.0.0' }],
  }, null, 2))
  write(join(dir, 'plugins', 'demo', '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'demo', version: '1.0.0' }, null, 2))
  write(join(dir, 'plugins', 'demo', 'skills', 'alpha', 'SKILL.md'), '---\nname: alpha\ndescription: A demo skill.\n---\n\nbody\n')
  write(join(dir, 'plugins', 'demo', 'agents', 'rev.md'), '---\nname: rev\ndescription: A demo agent.\n---\n\nbody\n')
  git(dir, 'init', '-q')
  commit(dir)
  return dir
}

const commit = (dir) => {
  git(dir, 'add', '-A')
  git(dir, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'x')
}

/** Run the validator inside `dir`. Returns { code, out } — out is stdout AND stderr,
 *  because errors and warnings are written to stderr. */
function run(dir) {
  const r = spawnSync(process.execPath, ['scripts/validate-marketplace.mjs'], { cwd: dir, encoding: 'utf8' })
  return { code: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` }
}

const withRepo = (fn) => {
  const dir = build()
  try {
    return fn(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// ── The bug this file exists for ─────────────────────────────────────────────
// macOS drops .DS_Store beside a skill; the validator walked the filesystem and
// reported "skills/.DS_Store is a file — a skill must be a directory". CI, which
// only ever sees tracked files, never reproduced it.
test('an untracked .DS_Store beside a skill does not fail', () => withRepo((dir) => {
  writeFileSync(join(dir, 'plugins', 'demo', 'skills', '.DS_Store'), '')
  writeFileSync(join(dir, 'plugins', 'demo', 'agents', '.DS_Store'), '')
  const { code, out } = run(dir)
  assert.equal(code, 0, out)
}))

test('a gitignored .DS_Store does not fail', () => withRepo((dir) => {
  write(join(dir, '.gitignore'), '.DS_Store\n')
  commit(dir)
  writeFileSync(join(dir, 'plugins', 'demo', 'skills', '.DS_Store'), '')
  const { code, out } = run(dir)
  assert.equal(code, 0, out)
}))

// ── Everything it used to catch, it must still catch ─────────────────────────
test('a TRACKED file where a skill directory belongs still fails', () => withRepo((dir) => {
  write(join(dir, 'plugins', 'demo', 'skills', 'beta'), 'not a dir')
  commit(dir)
  const { code, out } = run(dir)
  assert.equal(code, 1)
  assert.match(out, /skills\/beta is a file/)
}))

test('the agents/<name>/ directory form still fails', () => withRepo((dir) => {
  write(join(dir, 'plugins', 'demo', 'agents', 'nested', 'AGENT.md'), '---\nname: n\ndescription: d\n---\n')
  commit(dir)
  const { code, out } = run(dir)
  assert.equal(code, 1)
  assert.match(out, /is a directory/)
}))

// git cannot track an empty directory, so "a skill dir containing nothing" is
// unrepresentable in a checkout. The case that CAN exist is a dir with other
// tracked files and no SKILL.md.
test('a tracked skill directory with no SKILL.md still fails', () => withRepo((dir) => {
  rmSync(join(dir, 'plugins', 'demo', 'skills', 'alpha', 'SKILL.md'))
  write(join(dir, 'plugins', 'demo', 'skills', 'alpha', 'references', 'x.md'), 'notes\n')
  commit(dir)
  const { code, out } = run(dir)
  assert.equal(code, 1)
  assert.match(out, /SKILL\.md is missing/)
}))

test('a version mismatch between plugin.json and the marketplace still fails', () => withRepo((dir) => {
  write(join(dir, 'plugins', 'demo', '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'demo', version: '9.9.9' }))
  commit(dir)
  const { code, out } = run(dir)
  assert.equal(code, 1)
  assert.match(out, /version mismatch/)
}))

test('a top-level skills/ directory still fails', () => withRepo((dir) => {
  write(join(dir, 'skills', 'stray', 'SKILL.md'), '---\nname: s\ndescription: d\n---\n')
  commit(dir)
  const { code, out } = run(dir)
  assert.equal(code, 1)
  assert.match(out, /Top-level skills\//)
}))

test('a skill with no description still fails', () => withRepo((dir) => {
  write(join(dir, 'plugins', 'demo', 'skills', 'alpha', 'SKILL.md'), '---\nname: alpha\n---\n')
  commit(dir)
  const { code, out } = run(dir)
  assert.equal(code, 1)
  assert.match(out, /no description/)
}))

// ── The safety net: untracked content is never silently dropped ───────────────
test('an untracked real skill warns rather than vanishing', () => withRepo((dir) => {
  write(join(dir, 'plugins', 'demo', 'skills', 'ghost', 'SKILL.md'), '---\nname: ghost\ndescription: d\n---\n')
  const { code, out } = run(dir)
  assert.equal(code, 0, out)
  assert.match(out, /skills\/ghost is untracked/)
}))

test('an untracked agent .md warns', () => withRepo((dir) => {
  write(join(dir, 'plugins', 'demo', 'agents', 'ghost.md'), '---\nname: g2\ndescription: d\n---\n')
  const { code, out } = run(dir)
  assert.equal(code, 0, out)
  assert.match(out, /agents\/ghost\.md is untracked/)
}))

// ── Outside a git checkout (a tarball, a vendored copy) ──────────────────────
test('without git it still validates a good tree', () => withRepo((dir) => {
  rmSync(join(dir, '.git'), { recursive: true, force: true })
  const { code, out } = run(dir)
  assert.equal(code, 0, out)
}))

test('without git it still catches a file where a skill directory belongs', () => withRepo((dir) => {
  rmSync(join(dir, '.git'), { recursive: true, force: true })
  write(join(dir, 'plugins', 'demo', 'skills', 'beta'), 'not a dir')
  const { code, out } = run(dir)
  assert.equal(code, 1)
  assert.match(out, /skills\/beta is a file/)
}))

test('without git a dotfile is skipped in the fallback too', () => withRepo((dir) => {
  rmSync(join(dir, '.git'), { recursive: true, force: true })
  writeFileSync(join(dir, 'plugins', 'demo', 'skills', '.DS_Store'), '')
  const { code, out } = run(dir)
  assert.equal(code, 0, out)
}))
