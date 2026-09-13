// Preview-first, local snapshot reuse. Copies existing decisions; never approves or reseals.
import { existsSync, lstatSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join, dirname } from 'node:path';
import { loadBrainkit, BRAINKIT_DIR } from '../core/brainkit.mjs';
import { evaluate, readFrontmatter } from './brainkit-check.mjs';
import { loadRegistry, evaluate as evaluateIdentities } from './identity-registry-check.mjs';
import { evaluate as evaluateEstate } from './brainkit-registry-check.mjs';

function safePath(root, rel) {
  if (typeof rel !== 'string' || !rel || rel.startsWith('/') || rel.includes('\\') || rel.includes(':') || rel.split('/').some(p => !p || p === '..' || p === '.')) throw new Error(`Unsafe repository path: ${rel}`);
  let path = root;
  for (const part of rel.split('/')) { path = join(path, part); try { if (lstatSync(path).isSymbolicLink()) throw new Error(`Symlink is not a snapshot input: ${rel}`); } catch (e) { if (e.code !== 'ENOENT') throw e; } }
  return path;
}
function filesBelow(root, rel) {
  const path = safePath(root, rel);
  return readdirSync(path, { withFileTypes: true }).flatMap(e => e.isDirectory() ? filesBelow(root, `${rel}/${e.name}`) : [safePath(root, `${rel}/${e.name}`) && `${rel}/${e.name}`]);
}
const json = path => JSON.parse(readFileSync(path, 'utf8'));
export function reuseBrainkit({ from, dest = process.cwd(), profile, digest, apply = false, now = Date.now() }) {
  const report = { mode: apply ? 'apply' : 'preview', files: [], findings: [], copied: [], scope: 'Local snapshot conformance and copy only. Source authenticity, human approval, estate acknowledgement and production readiness are not established by this command.' };
  try {
    if (!from || !/^[a-z0-9][a-z0-9-]*$/.test(profile || '') || !/^sha256:[0-9a-f]{64}$/.test(digest || '')) throw new Error('Supply --from <publisher-repository> --profile <institution-id> --digest sha256:<expected-release-digest>.');
    const source = resolve(from), target = resolve(dest);
    safePath(source, `${BRAINKIT_DIR}/manifest.json`);
    const bk = loadBrainkit(source); if (!bk?.manifest) throw new Error('Publisher has no valid BrainKit manifest.');
    const m = bk.manifest;
    if (!Array.isArray(m.sections)) throw new Error('BrainKit sections must be an array.');
    for (const section of m.sections) safePath(source, `${BRAINKIT_DIR}/${section.path}`);
    const paths = filesBelow(source, BRAINKIT_DIR);
    const profilePath = `profiles/institutions/${profile}.json`;
    const p = json(safePath(source, profilePath));
    if (p.kind !== 'institution' || p.profile !== profile || p.brainkit?.institution_id !== m.institution_id || p.brainkit?.brainkit_id !== m.brainkit_id || p.brainkit?.path !== `${BRAINKIT_DIR}/manifest.json` || p.brainkit?.release_digest !== digest || m.package_digest !== digest) throw new Error('The selected profile, manifest and expected release digest do not agree.');
    if (!p.requirements?.low?.gates?.includes('brainkit-conformance')) throw new Error('Institution profile must require brainkit-conformance.');
    if (!Number.isFinite(Date.parse(m.effective_at)) || (m.expires_at && !Number.isFinite(Date.parse(m.expires_at)))) throw new Error('Release lifecycle dates are invalid.');
    for (const root of [source,target]) for (const path of ['docs/governance/identities.json','identities.json']) safePath(root,path);
    const sourceIdentities = loadRegistry(source), targetIdentities = loadRegistry(target);
    if (!sourceIdentities || !targetIdentities) throw new Error('Publisher and consumer must each have an identity registry. Mount consumer identities through the accountable governance process; they are never copied automatically.');
    const projectionPath = safePath(source, 'discovery/brand/design.md');
    const projection = existsSync(projectionPath) ? readFrontmatter(readFileSync(projectionPath, 'utf8')) : null;
    // Every file is path-checked before the existing gate reads it.
    const refs = json(safePath(source, `${BRAINKIT_DIR}/source-register.json`)).sources;
    if (!Array.isArray(refs)) throw new Error('Source register must contain sources.');
    for (const ref of refs) if (ref.reference && !/^[a-z][a-z0-9+.-]*:/i.test(ref.reference)) {
      safePath(source, ref.reference);
      if (!existsSync(safePath(target, ref.reference))) report.findings.push(`Consumer source reference is absent: ${ref.reference}. Mount it through the approved source channel.`);
    }
    for (const [label, registry] of [['Publisher', sourceIdentities], ['Consumer owner resolution', targetIdentities]]) {
      report.findings.push(...evaluateIdentities(registry,{now}).map(f => `${label} identities: ${f}`));
      report.findings.push(...evaluate(bk, { required: true, registry, projection, repoRoot: source, now }).map(f => `${label}: ${f}`));
    }
    for (const [label, root] of [['Publisher', source], ['Consumer', target]]) {
      const estatePath = ['docs/governance/brainkit-registry.json','brainkit-registry.json'].map(p => safePath(root,p)).find(existsSync);
      if (estatePath) {
        const estate = json(estatePath); report.findings.push(...evaluateEstate(estate).map(f => `${label} estate: ${f}`));
        const release = estate.releases?.find(r => r.brainkit_id === m.brainkit_id && r.version === m.version && r.package_digest === digest);
        if (release?.status !== 'active') report.findings.push(`${label} estate does not register this exact release as active.`);
      }
    }
    report.release = { institution: m.institution_id, brainkit: m.brainkit_id, version: m.version, digest };
    if (existsSync(safePath(target,BRAINKIT_DIR))) for (const path of filesBelow(target,BRAINKIT_DIR)) if (!paths.includes(path)) report.findings.push(`Consumer has additional BrainKit content: ${path}. Reconcile it before mounting.`);
    paths.push(profilePath);
    // Keep immutable bytes for the reviewed copy; copy the manifest last.
    paths.sort((a,b) => Number(a.endsWith('/manifest.json')) - Number(b.endsWith('/manifest.json')) || a.localeCompare(b));
    const bytes = new Map();
    for (const path of paths) {
      const src = safePath(source,path), dst = safePath(target,path), content = readFileSync(src); bytes.set(path,content);
      const status = !existsSync(dst) ? 'new' : lstatSync(dst).isFile() && readFileSync(dst).equals(content) ? 'current' : 'conflict';
      report.files.push({ path, status });
      if (status === 'conflict') report.findings.push(`Preserved local file: ${path}. Reconcile in a reviewed change; this command never overwrites.`);
    }
    for (const section of m.sections) {
      const hash = 'sha256:' + createHash('sha256').update(bytes.get(`${BRAINKIT_DIR}/${section.path}`)).digest('hex');
      if (hash !== section.digest) throw new Error('Publisher sections changed during preview; retry against an immutable release.');
    }
    if (JSON.stringify(JSON.parse(bytes.get(`${BRAINKIT_DIR}/manifest.json`))) !== JSON.stringify(m) || JSON.stringify(JSON.parse(bytes.get(profilePath))) !== JSON.stringify(p)) throw new Error('Publisher metadata changed during preview; retry against an immutable release.');
    report.next = ['Review source authenticity and approval records with institutional context owners.', 'Project the approved identity into discovery/brand/design.md with BrainKit version and digest provenance; preserve local changes for review.', `Select ${profile} in each applicable change envelope and recompile affected plans.`, 'Run node scripts/brainkit-check.mjs and node scripts/loom.mjs gates; record estate acknowledgement through the existing process.'];
    if (apply && !report.findings.length) for (const f of report.files.filter(f => f.status === 'new')) {
      const dst = safePath(target,f.path);mkdirSync(dirname(dst),{recursive:true});
      writeFileSync(dst,bytes.get(f.path),{flag:'wx'});report.copied.push(f.path);
    }
  } catch (error) { report.findings.push(error.message); }
  report.ok = report.findings.length === 0;
  return report;
}
export function brainkitCommand(args, cwd = process.cwd(), out = process.stdout, err = process.stderr) {
  const options = {dest:cwd};
  for (let i=0;i<args.length;i++) {
    const a=args[i];
    if (['--from','--profile','--digest'].includes(a) && args[i+1] && !args[i+1].startsWith('--')) options[a.slice(2)] = args[++i];
    else if (a==='--apply') options.apply=true;
    else if (a!=='--json') {err.write('usage: loom brainkit --from <publisher-repository> --profile <id> --digest sha256:<digest> [--apply] [--json]\n');return 2;}
  }
  const report=reuseBrainkit(options);
  if(args.includes('--json'))out.write(JSON.stringify(report,null,2)+'\n');
  else {
    out.write(`BrainKit ${report.mode}\n${report.scope}\n`);
    if(report.release)out.write(`${report.release.brainkit}@${report.release.version}\n${report.release.digest}\n`);
    for(const f of report.files)out.write(`  ${f.status}: ${f.path}\n`);
    for(const f of report.findings)out.write(`Needs attention: ${f}\n`);
    if(report.copied.length)out.write(`Copied ${report.copied.length} files.\n`);
    if(!options.apply&&report.ok)out.write('Preview only. Review these files and re-run with --apply to create absent files.\n');
    for(const step of report.next||[])out.write(`Next: ${step}\n`);
    if(!report.ok&&report.copied.length)out.write('Copy stopped part-way; the copied list identifies files already created. Inspect them before retrying.\n');
  }
  return report.ok?0:1;
}
