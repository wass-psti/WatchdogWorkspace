import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {spawnSync} from 'node:child_process';

const root = process.cwd();
const m99Target = path.join(root, 'config/stage-i-m99-sidebar-corrective-successor-target.ts');
const m99Guard = path.join(root, 'scripts/verify-stage-i-m99-m98-source-guard.mjs');
if (fs.existsSync(m99Target) || fs.existsSync(m99Guard)) {
  if (!fs.existsSync(m99Target) || !fs.existsSync(m99Guard)) {
    console.error('M98 M97-certified source guard FAILED: incomplete M99 successor authority');
    process.exit(1);
  }
  const delegated = spawnSync(process.execPath, [m99Guard], {cwd: root, stdio: 'inherit'});
  if (delegated.error) throw delegated.error;
  if (delegated.status !== 0) process.exit(delegated.status ?? 1);
  console.log('M98 M97-certified source guard: PASS (M99 successor authority delegated to M99→M98 source guard)');
  process.exit(0);
}
const manifestPath = path.join(root, 'regression-baseline/m98-m97-source-guard.json');
const fail = (message) => { console.error(`M98 M97-certified source guard FAILED: ${message}`); process.exit(1); };
if (!fs.existsSync(manifestPath)) fail('baseline manifest missing');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.baselineCertifiedZipSha256 !== 'f0c578813791444c5b8da0178b4de05a3b4e1477b0b2d350ccf7f76ec3b85303') fail('M97 certified ZIP provenance drift');
if (manifest.baselineCertifiedSourceSha256 !== 'c2c85964f42583aca477b8f23111d727650a7bb7af6dddc0488380503db3de66') fail('M97 certified source provenance drift');

const mutations = new Set(manifest.allowedMutations || []);
const additions = new Set(manifest.allowedNewFiles || []);
const removals = new Set(manifest.allowedRemovals || []);
const baseline = new Map((manifest.entries || []).map((entry) => [entry.path, entry]));
const ignored = new Set([
  '.git','node_modules','dist','coverage','test-results','playwright-report','CHECKSUMS.sha256',
  '.wm-modern-test-toolchain','m97-browser-evidence','m97-certified-artifacts-upload','m97-continuation-artifacts-upload',
  'm98-browser-evidence','m98-certified-artifacts-upload','m98-continuation-artifacts-upload',
  ...Array.from({length: 44}, (_, i) => `m${55 + i}-certified-artifacts-upload`),
]);
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const modeFor = (stat) => (stat.mode & 0o111) ? '100755' : '100644';
const current = new Map();
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (ignored.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    const relative = path.relative(root, absolute).replaceAll(path.sep, '/');
    if (entry.isDirectory()) walk(absolute);
    else if (entry.isFile()) {
      const stat = fs.lstatSync(absolute);
      const bytes = fs.readFileSync(absolute);
      current.set(relative, {sha256: sha256(bytes), size: bytes.length, mode: modeFor(stat)});
    }
  }
};
walk(root);

const issues = [];
for (const [relative, expected] of baseline) {
  const actual = current.get(relative);
  if (!actual) {
    if (!removals.has(relative)) issues.push(`unauthorized M97 baseline removal: ${relative}`);
    continue;
  }
  if (removals.has(relative)) issues.push(`allowed removal still present: ${relative}`);
  if (actual.mode !== expected.mode) issues.push(`M97 baseline mode drift: ${relative}`);
  if (!mutations.has(relative) && (actual.sha256 !== expected.sha256 || actual.size !== expected.size)) issues.push(`unauthorized M97 baseline mutation: ${relative}`);
}
for (const [relative] of current) if (!baseline.has(relative) && !additions.has(relative)) issues.push(`unauthorized new M98 file: ${relative}`);
for (const relative of mutations) if (!baseline.has(relative)) issues.push(`allowed mutation absent from M97 baseline: ${relative}`);
for (const relative of additions) if (baseline.has(relative)) issues.push(`allowed-new path already existed in M97 baseline: ${relative}`);
for (const relative of removals) if (!baseline.has(relative)) issues.push(`allowed-removal path absent from M97 baseline: ${relative}`);

if (issues.length) {
  console.error('M98 M97-certified source guard FAILED');
  for (const issue of issues.slice(0, 240)) console.error(` - ${issue}`);
  process.exit(1);
}
console.log(`M98 M97-certified source guard: PASS (baseline files=${baseline.size}; allowed mutations=${mutations.size}; allowed removals=${removals.size}; allowed new files=${additions.size})`);
