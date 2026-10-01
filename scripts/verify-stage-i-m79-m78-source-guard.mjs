import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
// M80+ successor synchronization: a certified-successor tree must be validated
// by the immediate successor guard rather than misclassified as M79 drift.
// Pure M79 trees retain the original strict M79→M78 verification below.
const m80TargetPath = path.join(root, 'config/stage-i-m80-shared-primitive-component-layer-target.ts');
const m80GuardPath = path.join(root, 'scripts/verify-stage-i-m80-m79-source-guard.mjs');
if (fs.existsSync(m80TargetPath) && fs.existsSync(m80GuardPath)) {
  const m80Target = fs.readFileSync(m80TargetPath, 'utf8');
  const validM80Binding = m80Target.includes('milestone: 80')
    && m80Target.includes("certifiedZipSha256: '42f6e572830916fd4a5c00af9030b296c9b2e64176fa7a16bf9b9c520b28ec58'")
    && m80Target.includes("certifiedSourceSha256: 'ca31475242a58595373ca65a6305c6aa79396cd2b6ea089bb1f5dd8005b56d5c'")
    && /activationState: '(?:implementation-complete-pending-certification|certification-gates-passed-pending-regression|active-certified)'/.test(m80Target);
  if (validM80Binding) {
    const successor = spawnSync(process.execPath, [m80GuardPath], { cwd: root, encoding: 'utf8' });
    if (successor.status !== 0) {
      process.stderr.write(successor.stderr || successor.stdout || 'M80+ successor source guard failed\n');
      process.exit(successor.status || 1);
    }
    process.stdout.write(successor.stdout);
    console.log('M79 M78-certified source guard: PASS (M80+ successor authority delegated to immediate successor guard)');
    process.exit(0);
  }
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'regression-baseline/m79-m78-source-guard.json'), 'utf8'));
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const mode = (stat) => stat.isSymbolicLink() ? '120000' : ((stat.mode & 0o111) !== 0 ? '100755' : '100644');
const allowedMutations = new Set(manifest.allowedMutations);
const allowedNew = new Set(manifest.allowedNewFiles);
const m80ManifestPath = path.join(root, 'regression-baseline/m80-m79-source-guard.json');
const m80AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m80-shared-primitive-component-layer-target.ts')) && fs.existsSync(m80ManifestPath);
const m80Manifest = m80AuthorityExists ? JSON.parse(fs.readFileSync(m80ManifestPath, 'utf8')) : null;
const m80AllowedNew = new Set(m80Manifest?.allowedNewFiles ?? []);
const baseline = new Map(manifest.entries.map((entry) => [entry.path, entry]));

ok(manifest.baselineCertifiedZipSha256 === '8414ed0aa4dc596af45b76ba16aae8f28d87bc1b41ddc39108c138acf5e662f2', 'M79 guard lost M78 certified ZIP identity');
ok(manifest.baselineCertifiedSourceSha256 === '437188880f12256e1bcd76924e3704e51005900af166251d513232bfcc27866a', 'M79 guard lost M78 certified source identity');

for (const [relative, expected] of baseline) {
  const absolute = path.join(root, relative);
  ok(fs.existsSync(absolute), `M78 baseline file removed during M79: ${relative}`);
  if (!fs.existsSync(absolute)) continue;
  const stat = fs.lstatSync(absolute);
  const bytes = stat.isSymbolicLink() ? Buffer.from(fs.readlinkSync(absolute)) : fs.readFileSync(absolute);
  ok(mode(stat) === expected.mode, `M78 baseline file mode drift: ${relative}`);
  if (!allowedMutations.has(relative)) {
    ok(sha(bytes) === expected.sha256, `M79 unauthorized byte drift outside allowlist: ${relative}`);
    ok(bytes.length === expected.size, `M79 unauthorized size drift outside allowlist: ${relative}`);
  }
}

const ignoredDirs = new Set(['.git','node_modules','dist','coverage','test-results','playwright-report','.wm-modern-test-toolchain']);
const ignoredPrefixes = new Set(Array.from({length: 25}, (_, index) => `m${55 + index}-certified-artifacts-upload`));
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name) || ignoredPrefixes.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).replaceAll(path.sep, '/');
    if (entry.isDirectory()) { walk(absolute); continue; }
    if (relative === 'CHECKSUMS.sha256') continue;
    if (!baseline.has(relative)) ok(allowedNew.has(relative) || (m80AuthorityExists && m80AllowedNew.has(relative)), `M79 unexpected new repository file outside governed list: ${relative}`);
  }
};
walk(root);

if (failures.length) {
  console.error('M79 M78-certified source guard FAILED');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log(`M79 M78-certified source guard: PASS (baseline files=${baseline.size}; allowed mutations=${allowedMutations.size}; allowed new files=${allowedNew.size})`);
