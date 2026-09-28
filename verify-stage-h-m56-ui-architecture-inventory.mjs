import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const requiredArtifacts = [
  'config/ui-architecture-inventory.ts',
  'config/stage-h-m56-ui-architecture-inventory-target.ts',
  'regression-baseline/m56-ui-architecture-inventory.json',
  'architecture/ui-governance/README.md',
  'architecture/ui-governance/migration-register.md',
  'M56-UI-ARCHITECTURE-INVENTORY-AND-DESIGN-GOVERNANCE-BASELINE.md',
  'M56-CONTINUATION-STATE.md',
  'RELEASE-STATUS-v1.43.2-STAGE-H-M56-UI-ARCHITECTURE-INVENTORY-DESIGN-GOVERNANCE-BASELINE.md',
  'scripts/verify-stage-h-m56-ui-architecture-inventory-execution.mjs',
  'scripts/lib/stage-h-m56-certification-tree.mjs',
  'scripts/verify-stage-h-m56-release.sh',
  'scripts/finalize-stage-h-m56.sh',
  'scripts/verify-stage-h-m56-certified-state.mjs',
  'scripts/verify-stage-h-m56-certified-artifact.mjs',
  'scripts/verify-stage-h-m56-certified-package-hygiene.mjs',
  'scripts/verify-stage-h-m56-final-checkpoint.mjs',
  'M56-CERTIFICATION-HANDOFF.md',
];
for (const relative of requiredArtifacts) assert(exists(relative), `M56 required governance artifact missing: ${relative}`);

const inventory = read('config/ui-architecture-inventory.ts');
for (const id of [
  'react-design-system',
  'foundation-css',
  'host-shared-presentation',
  'application-shell',
  'overlay-floating-surface',
  'imperative-ui-runtime',
  'boards-presentation',
  'motion-system',
  'time-tracker-module-ui',
  'fueltrack-module-ui',
  'tradelink-module-ui',
  'ui-verification-governance',
]) {
  assert(inventory.includes(`id: '${id}'`), `M56 inventory is missing domain ${id}`);
}
for (const status of ['authoritative-shared', 'authoritative-host', 'compatibility-authority', 'module-specific-authority', 'verification-authority']) {
  assert(inventory.includes(`'${status}'`), `M56 inventory is missing classification ${status}`);
}
for (const preserved of ['src/design-system', 'assets/css/foundation', 'src/app/shell', 'assets/js/platform/ui/primitives.ts', 'src/app/boards', 'apps/time-tracker', 'apps/fueltrack-plus', 'apps/tradelink']) {
  assert(inventory.includes(`'${preserved}'`), `M56 inventory does not preserve known UI authority ${preserved}`);
}

const snapshot = JSON.parse(read('regression-baseline/m56-ui-architecture-inventory.json'));
assert(snapshot.schemaVersion === 1, 'M56 discovery snapshot schemaVersion must be 1');
assert(snapshot.milestone === 56, 'M56 discovery snapshot milestone mismatch');
assert(snapshot.sourceBaseline === 'Work-Management-App-v1.43.2-Stage-H-M55-Certified-Baseline.zip', 'M56 discovery snapshot must bind to certified M55 baseline');
assert(Array.isArray(snapshot.observations?.embeddedModules) && snapshot.observations.embeddedModules.length === 3, 'M56 discovery snapshot must record three embedded modules');
assert(Array.isArray(snapshot.observations?.directChakraImports), 'M56 discovery snapshot must record Chakra import ownership');

const governance = read('architecture/ui-governance/README.md');
assert(governance.includes('does **not** redesign'), 'M56 governance must explicitly reject premature redesign');
assert(governance.includes('No classification means "safe to delete"'), 'M56 governance must reject deletion-by-classification');
assert(governance.includes('M57-M77'), 'M56 governance must identify successor program range');

const migration = read('architecture/ui-governance/migration-register.md');
assert(migration.includes('Retirement requirement'), 'M56 migration register must define retirement requirements');
assert(migration.includes('historical regression gates pass'), 'M56 retirement policy must require historical regression');

const target = read('config/stage-h-m56-ui-architecture-inventory-target.ts');
assert(target.includes("activationState: 'implementation-complete-pending-certification'") || target.includes("activationState: 'active-certified'"), 'M56 target has invalid activation state');
assert(target.includes("visualRuntimeMutationAllowed: false"), 'M56 target must forbid visual/runtime mutation');
assert(target.includes("semanticsVersion: '1.43.2-m56-v1'"), 'M56 semantics version missing');

const packageJson = JSON.parse(read('package.json'));
assert(packageJson.scripts?.['ui-inventory:check'] === 'node verify-stage-h-m56-ui-architecture-inventory.mjs', 'ui-inventory:check script missing or changed');
assert(packageJson.scripts?.['ui-inventory:test'] === 'node scripts/verify-stage-h-m56-ui-architecture-inventory-execution.mjs', 'ui-inventory:test script missing or changed');
assert(packageJson.scripts?.['ui-inventory:browser'] === 'npm run modern-tests:e2e', 'ui-inventory:browser script missing or changed');
assert(packageJson.scripts?.['ui-inventory:certify'] === 'bash scripts/finalize-stage-h-m56.sh', 'ui-inventory:certify script missing or changed');
assert(packageJson.scripts?.['ui-inventory:post-certification'] === 'node scripts/verify-stage-h-m56-certified-artifact.mjs', 'ui-inventory:post-certification script missing or changed');
assert(packageJson.scripts?.['ui-inventory:package-hygiene'] === 'node scripts/verify-stage-h-m56-certified-package-hygiene.mjs', 'ui-inventory:package-hygiene script missing or changed');
assert(packageJson.scripts?.['ui-inventory:final-checkpoint'] === 'node scripts/verify-stage-h-m56-final-checkpoint.mjs', 'ui-inventory:final-checkpoint script missing or changed');
assert((packageJson.scripts?.check ?? '').includes('ui-inventory:check'), 'aggregate npm check must include M56 static governance verification');
assert((packageJson.scripts?.['release:check'] ?? '').includes('ui-inventory:check'), 'aggregate release:check must include M56 static governance verification');
assert((packageJson.scripts?.['release:check'] ?? '').includes('ui-inventory:test'), 'aggregate release:check must include M56 deterministic governance verification');

if (failures.length) {
  console.error('M56 UI architecture inventory verification FAILED');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log('M56 UI architecture inventory verification: PASS');
console.log(`Verified ${requiredArtifacts.length} required M56 governance artifacts and 12 UI ownership domains.`);
