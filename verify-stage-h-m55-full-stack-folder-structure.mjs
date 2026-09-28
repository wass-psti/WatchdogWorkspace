import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const requiredTopology = [
  'architecture/full-stack/README.md',
  'architecture/full-stack/frontend/README.md',
  'architecture/full-stack/backend/README.md',
  'architecture/full-stack/shared/README.md',
  'architecture/full-stack/infrastructure/README.md',
  'architecture/full-stack/quality/README.md',
  'architecture/full-stack/delivery/README.md',
  'config/full-stack-folder-structure.ts',
  'src/main.ts',
  'src/app',
  'src/features',
  'src/design-system',
  'src/platform/contracts',
  'src/runtime-schemas',
  'src/types',
  'assets/js',
  'assets/css',
  'apps/time-tracker',
  'apps/fueltrack-plus',
  'apps/tradelink',
  'supabase/functions',
  'supabase/migrations',
  'supabase/schema.sql',
  'supabase/tests',
  'tests',
  'scripts',
  'config',
  'docs',
  '.github',
  'config/stage-h-m55-full-stack-folder-structure-target.ts',
  'RELEASE-STATUS-v1.43.2-STAGE-H-M55-FULL-STACK-FOLDER-STRUCTURE.md',
  'scripts/lib/stage-h-m55-certification-tree.mjs',
  'scripts/verify-stage-h-m55-release.sh',
  'scripts/finalize-stage-h-m55.sh',
  'scripts/verify-stage-h-m55-certified-state.mjs',
  'scripts/verify-stage-h-m55-certified-artifact.mjs',
  'scripts/verify-stage-h-m55-certified-package-hygiene.mjs',
  'scripts/verify-stage-h-m55-final-checkpoint.mjs',
  'scripts/verify-stage-h-m55-finalizer-fail-closed.mjs',
  'M55-CERTIFICATION-HANDOFF.md',
];
for (const relative of requiredTopology) assert(exists(relative), `required full-stack boundary missing: ${relative}`);

const manifest = read('config/full-stack-folder-structure.ts');
for (const area of ['frontend', 'backend', 'shared', 'infrastructure', 'quality', 'delivery']) {
  assert(manifest.includes(`area: '${area}'`), `full-stack structure manifest missing ${area} area`);
}
for (const preserved of ['src/app', 'assets/js', 'apps', 'supabase/functions', 'supabase/migrations', 'src/platform/contracts', 'tests', 'scripts']) {
  assert(manifest.includes(`'${preserved}'`), `structure manifest does not preserve canonical path ${preserved}`);
}

const topologyDoc = read('architecture/full-stack/README.md');
assert(topologyDoc.includes('not symlinks'), 'topology documentation must explicitly reject alias/symlink ambiguity');
assert(topologyDoc.includes('production paths on the right remain authoritative'), 'topology documentation must preserve existing production authority');
assert(topologyDoc.includes('Dependency direction'), 'topology documentation must define dependency direction');

const vite = read('vite.config.js');
assert(vite.includes("resolve(rootDir, 'src')"), 'Vite src alias authority changed unexpectedly');
assert(vite.includes("resolve(rootDir, 'apps')"), 'Vite embedded app copy authority changed unexpectedly');
assert(vite.includes("resolve(rootDir, 'assets/js/runtime/module-bootstrap.ts')"), 'Vite module bootstrap entry changed unexpectedly');

const tsconfig = JSON.parse(read('tsconfig.json'));
assert(tsconfig.compilerOptions?.baseUrl === '.', 'TypeScript baseUrl must remain repository-root relative');
assert(Array.isArray(tsconfig.compilerOptions?.paths?.['@/*']) && tsconfig.compilerOptions.paths['@/*'][0] === 'src/*', 'TypeScript @ alias must remain src/*');
assert(Array.isArray(tsconfig.exclude) && tsconfig.exclude.includes('apps'), 'embedded app TypeScript exclusion must remain intact');

const main = read('src/main.ts');
assert(main.includes("./app/composition/mount-react-composition.tsx"), 'React composition entry contract changed unexpectedly');
assert(main.includes("../config/backend-config.js"), 'backend public-config bootstrap contract changed unexpectedly');

const packageJson = JSON.parse(read('package.json'));
assert(packageJson.scripts?.['full-stack-structure:check'] === 'node verify-stage-h-m55-full-stack-folder-structure.mjs', 'package script full-stack-structure:check missing or changed');
assert(packageJson.scripts?.['full-stack-structure:test'] === 'node scripts/verify-stage-h-m55-full-stack-folder-structure-execution.mjs', 'package script full-stack-structure:test missing or changed');
assert(packageJson.scripts?.['full-stack-structure:browser'] === 'npm run modern-tests:e2e', 'package script full-stack-structure:browser missing or changed');
assert(packageJson.scripts?.['full-stack-structure:certify'] === 'bash scripts/finalize-stage-h-m55.sh', 'package script full-stack-structure:certify missing or changed');
assert(packageJson.scripts?.['full-stack-structure:post-certification'] === 'node scripts/verify-stage-h-m55-certified-artifact.mjs', 'package script full-stack-structure:post-certification missing or changed');
assert(packageJson.scripts?.['full-stack-structure:package-hygiene'] === 'node scripts/verify-stage-h-m55-certified-package-hygiene.mjs', 'package script full-stack-structure:package-hygiene missing or changed');
assert(packageJson.scripts?.['full-stack-structure:final-checkpoint'] === 'node scripts/verify-stage-h-m55-final-checkpoint.mjs', 'package script full-stack-structure:final-checkpoint missing or changed');
assert((packageJson.scripts?.['release:check'] ?? '').includes('npm run full-stack-structure:finalizer:test'), 'aggregate release:check does not include M55 fail-closed finalizer regression');

const target = read('config/stage-h-m55-full-stack-folder-structure-target.ts');
assert(target.includes("activationState: 'implementation-complete-pending-certification'") || target.includes("activationState: 'active-certified'"), 'M55 certification target has invalid activation state');
assert(target.includes("semanticsVersion: '1.43.2-m55-v1'"), 'M55 certification semantics version missing');

if (failures.length) {
  console.error('M55 full-stack folder structure verification FAILED');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log('M55 full-stack folder structure verification PASS');
console.log(`Verified ${requiredTopology.length} required physical/logical topology contracts.`);
