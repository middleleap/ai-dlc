// The Meridian Trust demo installation: adopt the Loom from this checkout's bundle into a scratch
// directory, then mount the Meridian scenario and estate (demo/meridian/mount.mjs). This is the one
// place the console knows the demo exists; everything else reads any installation the same way.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), '../../../plugins/middleleap-loom/skills/loom-adopt/harness');

export async function meridianInstallation(dest = mkdtempSync(join(tmpdir(), 'loom-console-meridian-'))) {
  if (!existsSync(join(HARNESS, 'adopt.mjs'))) throw new Error(`the Loom bundle is not beside this app (${HARNESS}); run the demo from an ai-dlc checkout`);
  execFileSync(process.execPath, [join(HARNESS, 'adopt.mjs'), '--dest', dest, '--tier', 'full'], { stdio: 'ignore' });
  cpSync(join(HARNESS, 'register-example'), join(dest, 'docs/governance/data-risk-register'), { recursive: true });
  // The demo stands in for the compliance function on the template obligations, as the CI dry-run and
  // run-demo.mjs do; the console reports these as demo stand-ins, never as citations.
  const p = join(dest, 'docs/governance/obligations.json');
  const ob = JSON.parse(readFileSync(p, 'utf8'));
  for (const x of ob.obligations) { x.illustrative = false; x.article = 'demo fixture'; }
  writeFileSync(p, JSON.stringify(ob, null, 2));
  const { mountMeridian, mountEstate } = await import(pathToFileURL(join(HARNESS, 'demo/meridian/mount.mjs')).href);
  mountMeridian(dest);
  mountEstate(dest);
  return dest;
}
