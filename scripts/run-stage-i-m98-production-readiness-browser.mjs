import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import process from 'node:process';

const run = (command, args) => {
  const result = spawnSync(command, args, {stdio: 'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
run('npm', ['run','workspace-regression:browser']);
run('npm', ['run','workspace-regression:evidence']);

const manifestPath = path.join(process.cwd(),'m97-browser-evidence','M97-SCREENSHOT-MANIFEST.json');
if (!fs.existsSync(manifestPath)) { console.error('M98 browser gate FAILED: M97 screenshot manifest missing after browser matrix'); process.exit(1); }
const bytes = fs.readFileSync(manifestPath);
const manifest = JSON.parse(bytes.toString('utf8'));
if (manifest.screenshotCount !== 84) { console.error('M98 browser gate FAILED: expected 84 screenshot records'); process.exit(1); }
const source = spawnSync(process.execPath,['scripts/lib/stage-i-m98-checkpoint-tree.mjs',process.cwd()],{encoding:'utf8'});
if (source.status !== 0) process.exit(source.status ?? 1);
const outDir = path.join(process.cwd(),'m98-browser-evidence');
fs.rmSync(outDir,{recursive:true,force:true}); fs.mkdirSync(outDir,{recursive:true});
const attestation = {
  milestone: 98,
  sourceTreeSha256: source.stdout.trim(),
  inheritedMatrixMilestone: 97,
  browserMatrix: manifest.browsers,
  viewports: manifest.viewports,
  surfaces: [...manifest.hostRoutes, ...manifest.modules],
  screenshotCount: manifest.screenshotCount,
  m97ScreenshotManifestSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
};
fs.writeFileSync(path.join(outDir,'M98-BROWSER-ATTESTATION.json'),JSON.stringify(attestation,null,2)+'\n');
console.log('M98 browser/E2E production-readiness gate: PASS (M97 full matrix re-executed; M98 attestation written)');
