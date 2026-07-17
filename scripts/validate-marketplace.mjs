#!/usr/bin/env node
// Validates the marketplace against what Claude Code actually loads.
// Run: node scripts/validate-marketplace.mjs
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const warnings = []
const fail = (m) => errors.push(m)
const warn = (m) => warnings.push(m)

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
const isDir = (p) => existsSync(p) && statSync(p).isDirectory()

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
  const text = readFileSync(file, 'utf8')
  const m = /^---\n([\s\S]*?)\n---/.exec(text)
  if (!m) return null
  const fields = {}
  const re = /^([A-Za-z][\w-]*):[ \t]*(.*(?:\n[ \t]+.*)*)/gm
  let f
  while ((f = re.exec(m[1]))) {
    fields[f[1]] = f[2].replace(/^>-?\s*/, '').split('\n').map((l) => l.trim()).join(' ').trim()
  }
  return fields
}

const marketplacePath = join(root, '.claude-plugin', 'marketplace.json')
if (!existsSync(marketplacePath)) {
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
      if (!existsSync(manifestPath)) {
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

      // Skills: a DIRECTORY containing SKILL.md.
      const skillsDir = join(dir, 'skills')
      if (isDir(skillsDir)) {
        for (const name of readdirSync(skillsDir)) {
          const skillDir = join(skillsDir, name)
          if (!isDir(skillDir)) {
            fail(`${label}: skills/${name} is a file — a skill must be a directory containing SKILL.md.`)
            continue
          }
          if (!KEBAB.test(name)) fail(`${label}: skill folder "${name}" must be kebab-case.`)
          const skillFile = join(skillDir, 'SKILL.md')
          if (!existsSync(skillFile)) {
            fail(`${label}: skills/${name}/SKILL.md is missing.`)
            continue
          }
          const fm = frontmatter(skillFile)
          if (!fm) fail(`${label}: skills/${name}/SKILL.md has no YAML frontmatter.`)
          else if (!fm.description) fail(`${label}: skills/${name}/SKILL.md has no description — Claude cannot decide when to load it.`)
          else if (fm.description.length > 1024) {
            fail(`${label}: skills/${name} description is ${fm.description.length} chars (max 1024).`)
          }
          if (fm?.name && fm.name !== name) {
            warn(`${label}: skills/${name} declares name "${fm.name}" — it will be invoked as "${fm.name}", not the folder name.`)
          }
        }
      }

      // Agents: FLAT .md files. The directory form is the classic mistake.
      const agentsDir = join(dir, 'agents')
      if (isDir(agentsDir)) {
        for (const name of readdirSync(agentsDir)) {
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
