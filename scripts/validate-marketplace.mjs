#!/usr/bin/env node
// Validates the marketplace against what Claude Code actually loads.
// Run: node scripts/validate-marketplace.mjs
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import { join, dirname, basename, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const warnings = []
const fail = (m) => errors.push(m)
const warn = (m) => warnings.push(m)

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

// What counts as "in the repository" is the GIT TREE, not the filesystem.
// Only tracked files reach a user, and CI validates a clean checkout — so walking
// the filesystem made local runs fail on strays CI never sees. The recurring one
// is macOS dropping a .DS_Store beside a skill, reported as the flat contradiction
// "skills/.DS_Store is a file — a skill must be a directory".
// File CONTENTS still come from disk, so uncommitted edits to a tracked file are
// validated before you commit them. Untracked content that looks real — a
// skills/<name>/SKILL.md, an agents/*.md — warns rather than being ignored: it is
// invisible to CI and will not ship. Outside a git checkout (a tarball, a vendored
// copy) this falls back to the filesystem, minus dotfiles.
const gitTree = (() => {
  let out
  try {
    out = execFileSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return null
  }
  const paths = out.split('\0').filter(Boolean)
  if (!paths.length) return null
  const dirs = new Set()
  const children = new Map()
  for (const p of paths) {
    const parts = p.split('/')
    for (let i = 0; i < parts.length; i++) {
      const parent = parts.slice(0, i).join('/')
      if (!children.has(parent)) children.set(parent, new Set())
      children.get(parent).add(parts[i])
      if (i < parts.length - 1) dirs.add(parts.slice(0, i + 1).join('/'))
    }
  }
  return { dirs, children }
})()

const rel = (p) => relative(root, p).split(sep).join('/')
const onDiskDir = (p) => existsSync(p) && statSync(p).isDirectory()
const isTracked = (p) => (gitTree.children.get(rel(dirname(p))) ?? new Set()).has(basename(p))
const isDir = (p) => (gitTree ? gitTree.dirs.has(rel(p)) : onDiskDir(p))

// Immediate children as the repository knows them. `looksReal` decides which
// untracked strays are worth a warning — everything else is dropped in silence.
const listDir = (abs, looksReal) => {
  if (!gitTree) return readdirSync(abs).filter((n) => !n.startsWith('.'))
  const tracked = gitTree.children.get(rel(abs)) ?? new Set()
  for (const name of existsSync(abs) ? readdirSync(abs) : []) {
    if (!tracked.has(name) && looksReal(join(abs, name))) {
      warn(`${rel(join(abs, name))} is untracked — CI validates a clean checkout, so it will not ship until committed.`)
    }
  }
  return [...tracked].sort()
}

// A file the repository will actually ship. Present-but-untracked is not an error —
// you may simply not have committed yet — but it is never left invisible.
const shipped = (abs, what) => {
  const onDisk = existsSync(abs)
  if (!gitTree) return onDisk
  if (isTracked(abs)) return true
  if (onDisk) warn(`${rel(abs)} is untracked — CI validates a clean checkout, so ${what} will not ship until committed.`)
  return onDisk
}

const looksLikeSkill = (p) => onDiskDir(p) && existsSync(join(p, 'SKILL.md'))
const looksLikeAgent = (p) => onDiskDir(p) || p.endsWith('.md')

const readJson = (p) => {
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch (e) {
    fail(`${p}: ${e.message}`)
    return null
  }
}

// Frontmatter must be a leading --- block; description may be folded (`>`) across lines.
const frontmatter = (file) => {
  const text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  const m = /^---\n([\s\S]*?)\n---/.exec(text)
  if (!m) return null
  const fields = {}
  // A value runs on over indented lines, and over a blank line that is followed by another
  // indented line (a paragraph break inside a folded or literal block).
  const re = /^([A-Za-z][\w-]*):[ \t]*(.*(?:\n(?:[ \t]+.*|(?=\n[ \t]+\S)))*)/gm
  let f
  while ((f = re.exec(m[1]))) {
    // Drop a block-scalar indicator (|, |-, >, >+, …) so it is not counted as description text.
    fields[f[1]] = f[2].replace(/^[|>][+-]?\d*[ \t]*/, '').split('\n').map((l) => l.trim()).filter(Boolean).join(' ').trim()
  }
  return fields
}

const marketplacePath = join(root, '.claude-plugin', 'marketplace.json')
if (!shipped(marketplacePath, 'the marketplace')) {
  fail('.claude-plugin/marketplace.json is missing — Claude Code cannot add this marketplace.')
} else {
  const mkt = readJson(marketplacePath)
  if (mkt) {
    for (const field of ['name', 'owner', 'plugins']) {
      if (!mkt[field]) fail(`marketplace.json: required field "${field}" is missing.`)
    }
    if (mkt.owner && !mkt.owner.name) fail('marketplace.json: owner.name is required.')
    if (mkt.name && !KEBAB.test(mkt.name)) fail(`marketplace.json: name "${mkt.name}" must be kebab-case.`)

    // metadata.pluginRoot is documented but current releases reject the bare sources it
    // enables — and only at install time, long after `marketplace add` reports success.
    if (mkt.metadata?.pluginRoot !== undefined) {
      fail('marketplace.json: metadata.pluginRoot is set. Current Claude Code releases fail to install plugins whose source relies on it. Remove it and write each source out as "./plugins/<name>".')
    }
    // A shallow clone cannot see the commit that set a version, so the content-changed check would
    // anchor on the grafted root and pass silently. Say so, and skip that check.
    let shallow = false
    if (gitTree) {
      try { shallow = execFileSync('git', ['-C', root, 'rev-parse', '--is-shallow-repository'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() === 'true' } catch { shallow = false }
      if (shallow) warn('this is a shallow clone — the content-changed-without-a-bump check cannot see history and is skipped. Fetch full history (CI: fetch-depth: 0).')
    }
    const marketplaceNames = new Set((Array.isArray(mkt.plugins) ? mkt.plugins : []).map((p) => p?.name).filter(Boolean))
    const seen = new Set()

    for (const entry of mkt.plugins ?? []) {
      const label = entry.name ?? '(unnamed)'
      if (!entry.name) fail('marketplace.json: a plugin entry has no name.')
      else if (!KEBAB.test(entry.name)) fail(`${label}: plugin name must be kebab-case.`)
      if (seen.has(entry.name)) fail(`${label}: duplicate plugin name.`)
      seen.add(entry.name)

      if (typeof entry.source !== 'string') {
        warn(`${label}: non-string source (external plugin) — not validated locally.`)
        continue
      }
      if (!entry.source.startsWith('./')) {
        fail(`${label}: source "${entry.source}" must start with "./" — a bare relative source fails at install time.`)
        continue
      }

      const dir = join(root, entry.source)
      if (!isDir(dir)) {
        fail(`${label}: source "${entry.source}" does not resolve to a directory.`)
        continue
      }

      const manifestPath = join(dir, '.claude-plugin', 'plugin.json')
      if (!shipped(manifestPath, 'the plugin')) {
        fail(`${label}: missing .claude-plugin/plugin.json.`)
        continue
      }
      const manifest = readJson(manifestPath)
      if (!manifest) continue

      if (!manifest.name) fail(`${label}: plugin.json has no name.`)
      else if (manifest.name !== entry.name) {
        fail(`${label}: plugin.json name "${manifest.name}" disagrees with the marketplace entry.`)
      }
      if (!entry.version) warn(`${label}: no version in the marketplace entry — users will not receive updates reliably.`)
      if (manifest.version !== entry.version) {
        fail(`${label}: version mismatch — plugin.json says "${manifest.version}", marketplace says "${entry.version}". Bump both.`)
      }

      // Content changed since the version was last set — CLAUDE.md's "rule that bites". Only
      // meaningful inside a git checkout. The pickaxe (-S, fixed string) finds the last commit
      // that changed how often the quoted version string appears in plugin.json — i.e. the bump
      // that introduced it; the plugin tree on disk (tracked files, staged or not) is then diffed
      // against that commit. Any difference means installed users are behind. No such commit
      // (the bump is still uncommitted) means the bump is in progress: nothing to report.
      for (const d of Array.isArray(manifest.dependencies) ? manifest.dependencies : []) {
        const depName = typeof d === 'string' ? d : d?.name
        if (typeof depName !== 'string' || !depName) fail(`${label}: malformed dependency entry ${JSON.stringify(d)} — expected a plugin name or { "name": … }.`)
        else if (!marketplaceNames.has(depName)) fail(`${label}: dependency "${depName}" is not a plugin in this marketplace — installing ${label} will fail.`)
      }

      if (gitTree && !shallow && manifest.version && manifest.version === entry.version) {
        let bumpCommit = ''
        try {
          bumpCommit = execFileSync('git', ['-C', root, 'log', '-1', '--format=%H', '-S', `"${manifest.version}"`, '--', rel(manifestPath)],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
        } catch { bumpCommit = '' }
        if (bumpCommit) {
          const diff = spawnSync('git', ['-C', root, 'diff', '--quiet', bumpCommit, '--', rel(dir)], { stdio: 'ignore' })
          if (diff.status === 1) {
            fail(`${label}: content changed since version ${manifest.version} was set in ${bumpCommit.slice(0, 7)} — bump the version in plugin.json and marketplace.json, or installed users never receive it.`)
          }
        }
      }

      // Skills: a DIRECTORY containing SKILL.md.
      const skillsDir = join(dir, 'skills')
      if (isDir(skillsDir)) {
        for (const name of listDir(skillsDir, looksLikeSkill)) {
          const skillDir = join(skillsDir, name)
          if (!isDir(skillDir)) {
            fail(`${label}: skills/${name} is a file — a skill must be a directory containing SKILL.md.`)
            continue
          }
          if (!KEBAB.test(name)) fail(`${label}: skill folder "${name}" must be kebab-case.`)
          const skillFile = join(skillDir, 'SKILL.md')
          if (!shipped(skillFile, 'the skill')) {
            fail(`${label}: skills/${name}/SKILL.md is missing.`)
            continue
          }
          const fm = frontmatter(skillFile)
          if (!fm) fail(`${label}: skills/${name}/SKILL.md has no YAML frontmatter.`)
          else if (!fm.description) fail(`${label}: skills/${name}/SKILL.md has no description — Claude cannot decide when to load it.`)
          else if (fm.description.length > 1024) {
            fail(`${label}: skills/${name} description is ${fm.description.length} chars (max 1024).`)
          }
          if (fm && !fm.name) warn(`${label}: skills/${name} has no name field.`)
          if (fm?.name && fm.name !== name) {
            warn(`${label}: skills/${name} declares name "${fm.name}" — it will be invoked as "${fm.name}", not the folder name.`)
          }
        }
      }

      // Agents: FLAT .md files. The directory form is the classic mistake.
      const agentsDir = join(dir, 'agents')
      if (isDir(agentsDir)) {
        for (const name of listDir(agentsDir, looksLikeAgent)) {
          const agentPath = join(agentsDir, name)
          if (isDir(agentPath)) {
            fail(`${label}: agents/${name}/ is a directory — an agent must be a flat file, agents/${name}.md.`)
            continue
          }
          if (!name.endsWith('.md')) continue
          const fm = frontmatter(agentPath)
          if (!fm) fail(`${label}: agents/${name} has no YAML frontmatter.`)
          else {
            if (!fm.description) fail(`${label}: agents/${name} has no description.`)
            if (!fm.name) warn(`${label}: agents/${name} has no name field.`)
          }
        }
      }
    }
  }
}

// Anything outside plugins/ is not installable — catch strays from the old layout.
for (const stray of ['skills', 'agents', 'tools', 'mcp-servers']) {
  if (isDir(join(root, stray))) {
    fail(`Top-level ${stray}/ exists — content there is not installable. It belongs in plugins/<plugin>/${stray}/.`)
  }
}
// A stray here is worth flagging whether or not it is committed — it is the wrong
// path either way, so this one deliberately looks at the filesystem.
if (existsSync(join(root, 'marketplace.json'))) {
  fail('A root marketplace.json exists — Claude Code reads .claude-plugin/marketplace.json. Remove the stray file.')
}

for (const w of warnings) console.warn(`warning: ${w}`)
if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`)
  console.error(`\n${errors.length} error(s).`)
  process.exit(1)
}
console.log(`Marketplace OK${warnings.length ? ` (${warnings.length} warning(s))` : ''}.`)
