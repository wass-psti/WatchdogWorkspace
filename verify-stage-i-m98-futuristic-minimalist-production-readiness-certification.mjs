import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const required = [
  'config/stage-i-m98-futuristic-minimalist-production-readiness-certification-target.ts',
  'regression-baseline/m98-m97-source-guard.json',
  'M98-CONTINUATION-STATE.md','M98-IMPLEMENTATION-REPORT.md','M98-CERTIFICATION-HANDOFF.md',
  'M98-FUTURISTIC-MINIMALIST-PRODUCTION-READINESS-CERTIFICATION.md',
  'RELEASE-STATUS-v1.43.2-STAGE-I-M98-FUTURISTIC-MINIMALIST-PRODUCTION-READINESS-CERTIFICATION.md',
  'scripts/verify-stage-i-m98-m97-source-guard.mjs',
  'scripts/verify-stage-i-m98-futuristic-minimalist-production-readiness-certification-execution.mjs',
  'scripts/run-stage-i-m98-production-readiness-browser.mjs','scripts/verify-stage-i-m98-browser-evidence.mjs',
  'scripts/verify-stage-i-m98-release.sh','scripts/finalize-stage-i-m98.sh','scripts/certify-stage-i-m98-local.sh',
  'scripts/verify-stage-i-m98-post-certification-state.mjs','scripts/verify-stage-i-m98-certified-state.mjs',
  'scripts/verify-stage-i-m98-certified-artifact.mjs','scripts/verify-stage-i-m98-certified-package-hygiene.mjs',
  'scripts/verify-stage-i-m98-final-checkpoint.mjs','scripts/publish-stage-i-m98-certified-artifact.sh',
  'scripts/lib/stage-i-m98-checkpoint-tree.mjs',
];
for (const relative of required) ok(exists(relative), `M98 required artifact missing: ${relative}`);

const target = read('config/stage-i-m98-futuristic-minimalist-production-readiness-certification-target.ts');
ok(target.includes('milestone: 98'), 'M98 target milestone mismatch');
ok(target.includes("stage: 'I'"), 'M98 target stage mismatch');
ok(target.includes("activationState: 'implementation-complete-local-certification-pending'") || target.includes("activationState: 'certification-gates-passed-pending-regression'") || target.includes("activationState: 'active-certified'"), 'M98 target activation state invalid');
for (const boundary of ['noApplicationSourceMutation: true','noProductionVisualMutation: true','noDatabaseSchemaMutation: true','noMigrationMutation: true','noBackendApiMutation: true','noAuthenticationAuthorizationMutation: true','noPersistenceMutation: true','noRouteOwnershipMutation: true','noModuleBusinessLogicMutation: true','noDependencyMutation: true']) ok(target.includes(boundary), `M98 mutation boundary missing: ${boundary}`);
ok(target.includes('f0c578813791444c5b8da0178b4de05a3b4e1477b0b2d350ccf7f76ec3b85303'), 'M98 target must bind M97 certified ZIP');
ok(target.includes('c2c85964f42583aca477b8f23111d727650a7bb7af6dddc0488380503db3de66'), 'M98 target must bind M97 certified source');

const m97 = read('config/stage-i-m97-workspace-wide-visual-regression-functional-preservation-target.ts');
ok(m97.includes("activationState: 'active-certified'"), 'M97 prerequisite is not active-certified');
const m77 = read('config/stage-h-m77-final-ui-production-certification-target.ts');
ok(m77.includes("activationState: 'active-certified'"), 'M77 protected presentation authority is not active-certified');

const manifest = JSON.parse(read('regression-baseline/m98-m97-source-guard.json'));
ok(manifest.milestone === 98 && manifest.sourceMilestone === 97, 'M98 source-guard manifest milestone mismatch');
ok(manifest.baselineCertifiedZipSha256 === 'f0c578813791444c5b8da0178b4de05a3b4e1477b0b2d350ccf7f76ec3b85303', 'M98 manifest ZIP provenance mismatch');
ok(manifest.baselineCertifiedSourceSha256 === 'c2c85964f42583aca477b8f23111d727650a7bb7af6dddc0488380503db3de66', 'M98 manifest source provenance mismatch');
ok((manifest.allowedRemovals || []).length === 0, 'M98 must authorize zero baseline removals');
ok((manifest.allowedMutations || []).every((x) => ['package.json','scripts/verify-stage-i-m97-m96-source-guard.mjs'].includes(x)), 'M98 mutation allowlist exceeds certification governance boundary');

const pkg = JSON.parse(read('package.json'));
const expectedScripts = {
  'futuristic-readiness:source-guard': 'node scripts/verify-stage-i-m98-m97-source-guard.mjs',
  'futuristic-readiness:check': 'node verify-stage-i-m98-futuristic-minimalist-production-readiness-certification.mjs',
  'futuristic-readiness:test': 'node scripts/verify-stage-i-m98-futuristic-minimalist-production-readiness-certification-execution.mjs',
  'futuristic-readiness:browser': 'node scripts/run-stage-i-m98-production-readiness-browser.mjs',
  'futuristic-readiness:evidence': 'node scripts/verify-stage-i-m98-browser-evidence.mjs',
  'futuristic-readiness:release': 'bash scripts/verify-stage-i-m98-release.sh',
  'futuristic-readiness:certify': 'bash scripts/finalize-stage-i-m98.sh',
  'futuristic-readiness:local-certify': 'bash scripts/certify-stage-i-m98-local.sh',
  'futuristic-readiness:post-certification': 'node scripts/verify-stage-i-m98-post-certification-state.mjs',
  'futuristic-readiness:package-hygiene': 'node scripts/verify-stage-i-m98-certified-package-hygiene.mjs',
  'futuristic-readiness:final-checkpoint': 'node scripts/verify-stage-i-m98-final-checkpoint.mjs',
  'futuristic-readiness:publish-certified': 'bash scripts/publish-stage-i-m98-certified-artifact.sh',
};
for (const [name, command] of Object.entries(expectedScripts)) ok(pkg.scripts?.[name] === command, `M98 package script mismatch: ${name}`);
ok((pkg.scripts?.check || '').includes('futuristic-readiness:check'), 'aggregate check must include M98 static verification');
ok((pkg.scripts?.['release:check'] || '').includes('futuristic-readiness:check'), 'release:check must include M98 static verification');
ok((pkg.scripts?.['release:check'] || '').includes('futuristic-readiness:test'), 'release:check must include M98 deterministic verification');

if (failures.length) {
  console.error('M98 futuristic minimalist production readiness verification FAILED');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log('M98 futuristic minimalist production readiness verification: PASS');
console.log('M98 certifies the frozen M77 presentation authority through the active-certified M97 successor chain with zero authorized production application/runtime mutations.');
