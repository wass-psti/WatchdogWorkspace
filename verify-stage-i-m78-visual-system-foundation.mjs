import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const required = [
  'config/stage-i-m78-futuristic-minimalist-foundation-target.ts',
  'config/futuristic-minimalist-presentation-ownership.ts',
  'regression-baseline/m78-m77-protected-presentation.json',
  'architecture/ui-governance/futuristic-minimalist-migration-boundaries.md',
  'M78-VISUAL-SYSTEM-FOUNDATION-REPOSITORY-BASELINE-GUARD.md',
  'M78-CONTINUATION-STATE.md',
  'M78-CERTIFICATION-HANDOFF.md',
  'RELEASE-STATUS-v1.43.2-STAGE-I-M78-VISUAL-SYSTEM-FOUNDATION-BASELINE-GUARD.md',
  'scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs',
  'scripts/verify-stage-i-m78-m77-baseline-restoration.mjs',
  'scripts/lib/stage-i-m78-checkpoint-tree.mjs',
  'scripts/verify-stage-i-m78-final-checkpoint.mjs',
  'scripts/verify-stage-i-m78-release.sh',
  'scripts/finalize-stage-i-m78.sh',
  'scripts/verify-stage-i-m78-certified-state.mjs',
  'scripts/verify-stage-i-m78-certified-artifact.mjs',
  'scripts/verify-stage-i-m78-certified-package-hygiene.mjs',
];
for (const relative of required) ok(exists(relative), `M78 required artifact missing: ${relative}`);

const target = read('config/stage-i-m78-futuristic-minimalist-foundation-target.ts');
ok(target.includes("milestone: 78"), 'M78 target milestone mismatch');
ok(target.includes("stage: 'I'"), 'M78 target stage mismatch');
ok(target.includes("activationState: 'implementation-complete-pending-certification'") || target.includes("activationState: 'active-certified'"), 'M78 target has invalid activation state');
ok(target.includes("visualRuntimeMutationAllowed: false"), 'M78 must forbid production visual/runtime mutation');
ok(target.includes('4a07b2a7dbc876159858b208bd366e38115030702434fcde501f35c2bd6cd5b9'), 'M78 target must bind certified M77 source identity');
ok(target.includes('a0fc170a518582acb5ad8a86fe73e2a12174b207'), 'M78 target must bind published M77 commit');

const ownership = read('config/futuristic-minimalist-presentation-ownership.ts');
for (const id of [
  'design-system-foundation', 'application-shell-and-host', 'boards-presentation', 'imperative-host-runtime',
  'time-tracker-presentation', 'fueltrack-plus-presentation', 'tradelink-presentation', 'visual-regression-and-certification',
]) ok(ownership.includes(`id: '${id}'`), `M78 presentation ownership missing domain ${id}`);
for (const classification of [
  'shared-design-authority', 'host-presentation-authority', 'module-presentation-authority', 'compatibility-runtime-authority', 'verification-authority',
]) ok(ownership.includes(`'${classification}'`), `M78 ownership classification missing ${classification}`);
for (let milestone = 79; milestone <= 98; milestone += 1) {
  ok(target.includes(`: ${milestone}`) || ownership.includes(`[${milestone}`) || ownership.includes(`, ${milestone}`), `M78 successor roadmap does not reference M${milestone}`);
}

const boundaries = read('architecture/ui-governance/futuristic-minimalist-migration-boundaries.md');
for (const protectedBoundary of [
  'routing', 'authentication', 'authorization/RBAC', 'persistence', 'Supabase contracts', 'module workflows', 'responsive behavior', 'accessibility semantics', 'motion behavior',
]) ok(boundaries.includes(protectedBoundary), `M78 migration-boundary document missing protected boundary: ${protectedBoundary}`);
ok(boundaries.includes('does **not** intentionally change production visual output'), 'M78 must explicitly prohibit intentional visual drift');
ok(boundaries.includes('No path is safe to delete'), 'M78 must explicitly prohibit deletion-by-migration assumption');

const manifest = JSON.parse(read('regression-baseline/m78-m77-protected-presentation.json'));
ok(manifest.schemaVersion === 1, 'M78 protected-presentation manifest schemaVersion must be 1');
ok(manifest.milestone === 78 && manifest.sourceMilestone === 77, 'M78 protected-presentation manifest milestone binding mismatch');
ok(manifest.certifiedSourceSha256 === '4a07b2a7dbc876159858b208bd366e38115030702434fcde501f35c2bd6cd5b9', 'M78 manifest M77 source identity mismatch');
ok(manifest.publishedCommit === 'a0fc170a518582acb5ad8a86fe73e2a12174b207', 'M78 manifest M77 published commit mismatch');
ok(Array.isArray(manifest.entries) && manifest.entries.length >= 250, `M78 protected-presentation manifest unexpectedly narrow: ${manifest.entries?.length ?? 0} files`);
ok(manifest.fileCount === manifest.entries.length, 'M78 protected-presentation manifest fileCount mismatch');

const packageJson = JSON.parse(read('package.json'));
ok(packageJson.scripts?.['visual-foundation:check'] === 'node verify-stage-i-m78-visual-system-foundation.mjs', 'visual-foundation:check script missing or changed');
ok(packageJson.scripts?.['visual-foundation:test'] === 'node scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs', 'visual-foundation:test script missing or changed');
ok(packageJson.scripts?.['visual-foundation:restore-m77'] === 'node scripts/verify-stage-i-m78-m77-baseline-restoration.mjs', 'visual-foundation:restore-m77 script missing or changed');
ok(packageJson.scripts?.['visual-foundation:browser'] === 'npm run modern-tests:e2e', 'visual-foundation:browser script missing or changed');
ok(packageJson.scripts?.['visual-foundation:release'] === 'bash scripts/verify-stage-i-m78-release.sh', 'visual-foundation:release script missing or changed');
ok(packageJson.scripts?.['visual-foundation:certify'] === 'bash scripts/finalize-stage-i-m78.sh', 'visual-foundation:certify script missing or changed');
ok(packageJson.scripts?.['visual-foundation:post-certification'] === 'node scripts/verify-stage-i-m78-certified-state.mjs && node scripts/verify-stage-i-m78-certified-artifact.mjs', 'visual-foundation:post-certification script missing or changed');
ok(packageJson.scripts?.['visual-foundation:package-hygiene'] === 'node scripts/verify-stage-i-m78-certified-package-hygiene.mjs', 'visual-foundation:package-hygiene script missing or changed');
ok(packageJson.scripts?.['visual-foundation:final-checkpoint'] === 'node scripts/verify-stage-i-m78-final-checkpoint.mjs --require-certified', 'visual-foundation:final-checkpoint script missing or changed');
ok((packageJson.scripts?.check ?? '').includes('visual-foundation:check'), 'aggregate npm check must include M78 static guard');
ok((packageJson.scripts?.['release:check'] ?? '').includes('visual-foundation:check'), 'aggregate release:check must include M78 static guard');
ok((packageJson.scripts?.['release:check'] ?? '').includes('visual-foundation:test'), 'aggregate release:check must include M78 deterministic guard');

if (failures.length) {
  console.error('M78 visual-system foundation verification FAILED');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log('M78 visual-system foundation verification: PASS');
console.log(`Verified ${required.length} M78 foundation artifacts and ${manifest.entries.length} protected M77 presentation/runtime files.`);
