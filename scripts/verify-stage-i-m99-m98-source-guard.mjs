import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const manifestPath = path.join(root, 'regression-baseline/m99-m98-source-guard.json');
const fail = (message) => { console.error(`M99 M98-certified source guard FAILED: ${message}`); process.exit(1); };
if (!fs.existsSync(manifestPath)) fail('baseline manifest missing');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.baselineCertifiedZipSha256 !== 'b0275f299c3cafa2c3aa16a60f4359018ffabd2d1c6b96ab22b10e006ec304ad') fail('M98 certified ZIP provenance drift');
if (manifest.baselineCertifiedSourceSha256 !== '0a8c5a05ed57904195b4c5665a54874aab37f286a3cf73883d19bb3e6a2f1a59') fail('M98 certified source provenance drift');

const mutations = new Set(manifest.allowedMutations || []);
const additions = new Set(manifest.allowedNewFiles || []);
const removals = new Set(manifest.allowedRemovals || []);
const baseline = new Map((manifest.entries || []).map((entry) => [entry.path, entry]));
const ignored = new Set([
  '.git','node_modules','dist','coverage','test-results','playwright-report','CHECKSUMS.sha256',
  '.wm-modern-test-toolchain','m97-browser-evidence','m98-browser-evidence','m99-browser-evidence',
  'm97-certified-artifacts-upload','m97-continuation-artifacts-upload',
  'm98-certified-artifacts-upload','m98-continuation-artifacts-upload',
  'm99-certified-artifacts-upload','m99-continuation-artifacts-upload',
  ...Array.from({length: 45}, (_, i) => `m${55 + i}-certified-artifacts-upload`),
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
    if (!removals.has(relative)) issues.push(`unauthorized M98 baseline removal: ${relative}`);
    continue;
  }
  if (removals.has(relative)) issues.push(`allowed removal still present: ${relative}`);
  if (actual.mode !== expected.mode) issues.push(`M98 baseline mode drift: ${relative}`);
  if (!mutations.has(relative) && (actual.sha256 !== expected.sha256 || actual.size !== expected.size)) issues.push(`unauthorized M98 baseline mutation: ${relative}`);
}
for (const [relative] of current) if (!baseline.has(relative) && !additions.has(relative)) issues.push(`unauthorized new M99 file: ${relative}`);
for (const relative of mutations) if (!baseline.has(relative)) issues.push(`allowed mutation absent from M98 baseline: ${relative}`);
for (const relative of additions) if (baseline.has(relative)) issues.push(`allowed-new path already existed in M98 baseline: ${relative}`);
for (const relative of removals) if (!baseline.has(relative)) issues.push(`allowed-removal path absent from M98 baseline: ${relative}`);

if (issues.length) {
  console.error('M99 M98-certified source guard FAILED');
  for (const issue of issues.slice(0, 240)) console.error(` - ${issue}`);
  process.exit(1);
}
console.log(`M99 M98-certified source guard: PASS (baseline files=${baseline.size}; allowed mutations=${mutations.size}; allowed removals=${removals.size}; allowed new files=${additions.size})`);
