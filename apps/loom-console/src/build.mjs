// Build the console as a static site: index.html + app.js + app.css + console.json, and each run's
// committed wireframe copied beside it so the page embeds the asset itself, byte for byte. The
// output is plain files with a strict CSP (no network), hostable anywhere a bank serves internal
// static content. Nothing is written into the installation.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { consoleData } from './data.mjs';

export const WEB = resolve(dirname(fileURLToPath(import.meta.url)), '../web');
export const WEB_FILES = ['index.html', 'app.js', 'app.css'];

/** The installation files the site may carry beside the data: committed wireframes only. */
export function siteArtifacts(data) {
  return data.runs.filter((r) => r.prototype?.wireframe).map((r) => ({ slug: r.slug, from: r.prototype.wireframe, to: `artifacts/${r.slug}/wireframe.html` }));
}

export async function buildSite(repo, out, { now = Date.now() } = {}) {
  const root = resolve(repo);
  const data = await consoleData(root, { now });
  mkdirSync(out, { recursive: true });
  for (const f of WEB_FILES) cpSync(join(WEB, f), join(out, f));
  for (const a of siteArtifacts(data)) {
    const src = join(root, a.from);
    if (!existsSync(src)) continue;
    mkdirSync(dirname(join(out, a.to)), { recursive: true });
    cpSync(src, join(out, a.to));
    data.runs.find((r) => r.slug === a.slug).prototype.site_wireframe = a.to;
  }
  writeFileSync(join(out, 'console.json'), JSON.stringify(data) + '\n');
  return { out, runs: data.runs.length, artifacts: siteArtifacts(data).length, data };
}
