// Serve the console locally over the installation, read-only. Binds to 127.0.0.1 only; answers GET
// and HEAD and nothing else; re-reads the installation on every request for console.json, so a
// facilitator's edit shows on refresh. It serves the web UI, the data, and the committed wireframes
// the data names — no other path in the installation is reachable through it.
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { consoleData } from './data.mjs';
import { WEB, WEB_FILES, siteArtifacts } from './build.mjs';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const type = (p) => TYPES[p.slice(p.lastIndexOf('.'))] || 'application/octet-stream';
const HEADERS = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store', 'X-Frame-Options': 'SAMEORIGIN' };

export function createConsoleServer(repo, { now = null } = {}) {
  const root = resolve(repo);
  return createServer(async (req, res) => {
    const send = (code, body, t = 'text/plain; charset=utf-8') => { res.writeHead(code, { ...HEADERS, 'Content-Type': t }); res.end(req.method === 'HEAD' ? undefined : body); };
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET, HEAD'); return send(405, 'The Loom console is read-only.\n'); }
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    try {
      if (path === '/' || path === '/index.html') return send(200, readFileSync(join(WEB, 'index.html')), type('.html'));
      const file = path.slice(1);
      if (WEB_FILES.includes(file)) return send(200, readFileSync(join(WEB, file)), type(file));
      if (file === 'console.json' || file.startsWith('artifacts/')) {
        const data = await consoleData(root, { now: now ?? Date.now() });
        const arts = siteArtifacts(data);
        for (const a of arts) data.runs.find((r) => r.slug === a.slug).prototype.site_wireframe = a.to;
        if (file === 'console.json') return send(200, JSON.stringify(data), type('.json'));
        const hit = arts.find((a) => a.to === file);
        if (hit && existsSync(join(root, hit.from))) return send(200, readFileSync(join(root, hit.from)), type('.html'));
      }
      return send(404, 'Not found.\n');
    } catch (e) { return send(500, `The console could not read the installation: ${e.message}\n`); }
  });
}
