import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const m96AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m96-visual-consistency-legacy-styling-retirement-target.ts'));

const required = [
  'assets/css/foundation/host-ui-migration.css',
  'src/design-system/host-migration-system.ts',
  'config/host-level-ui-migration-architecture.ts',
  'config/stage-h-m72-host-level-ui-migration-target.ts',
  'regression-baseline/m72-host-level-ui-migration.json',
  'architecture/ui-governance/host-level-ui-migration-architecture.md',
  'M72-HOST-LEVEL-UI-MIGRATION-VISUAL-CONSOLIDATION.md',
  'M72-CONTINUATION-STATE.md',
  'M72-CERTIFICATION-HANDOFF.md',
  'RELEASE-STATUS-v1.43.2-STAGE-H-M72-HOST-LEVEL-UI-MIGRATION.md',
  'scripts/verify-stage-h-m72-host-level-ui-migration-execution.mjs',
  'scripts/verify-stage-h-m72-release.sh',
  'scripts/finalize-stage-h-m72.sh',
  'scripts/verify-stage-h-m72-certified-state.mjs',
  'scripts/verify-stage-h-m72-certified-artifact.mjs',
  'scripts/verify-stage-h-m72-certified-package-hygiene.mjs',
  'scripts/verify-stage-h-m72-final-checkpoint.mjs',
];
for (const file of required) { if (m96AuthorityExists && file === 'assets/css/foundation/host-ui-migration.css') continue; ok(fs.existsSync(path.join(root, file)), `missing M72 artifact: ${file}`); }

const system = read('src/design-system/host-migration-system.ts');
for (const marker of [
  'workManagementHostMigrationSystem',
  "migrationModel: 'controlled-react-host-consumer-migration'",
  'routeOwnershipRemainsM40Authority: true',
  'shellMechanicsRemainM68Authority: true',
  'businessAndPersistenceLogicUnchanged: true',
  'legacyDataAndEventHooksRemainCompatible: true',
  'noEmbeddedModuleConsumerMigrationInM72: true',
  'noBoardsConsumerMigrationInM72: true',
]) ok(system.includes(marker), `M72 host contract missing: ${marker}`);

const main = read('src/main.ts');
if (m96AuthorityExists) ok(!main.includes("host-ui-migration.css"), 'M96 must retire the M72 host migration stylesheet from the host entry'); else ok(main.includes("host-ui-migration.css"), 'M72 host migration stylesheet is not loaded by the host entry');
for (const embedded of ['apps/time-tracker/index.html', 'apps/fueltrack-plus/runtime.html', 'apps/tradelink/runtime.html']) {
  ok(!read(embedded).includes('host-ui-migration.css'), `M72 host-only stylesheet must not be injected into ${embedded}`);
}

const auth = read('src/app/auth/AuthenticationUI.tsx');
for (const marker of ['WMField', 'WMInput', 'WMButton', 'WMStatusMessage', 'WMLoadingState', 'WMErrorState', 'data-wm-host-migrated="authentication"']) ok(auth.includes(marker), `M72 authentication migration missing: ${marker}`);
const management = read('src/app/management/AuthenticatedManagementUI.tsx');
for (const marker of ['WMButton', 'WMField', 'WMInput', 'WMNativeSelect', 'WMStatusMessage', 'WMLoadingState', 'WMErrorState', 'WMEmptyState', 'data-wm-host-migrated="account"', 'data-wm-host-migrated="settings"', 'data-wm-host-migrated="users"']) ok(management.includes(marker), `M72 management migration missing: ${marker}`);
const shared = read('src/app/shared-ui/SharedApplicationUI.tsx');
for (const marker of ['WMButton', 'WMStatusMessage', 'data-wm-host-migrated="shared-ui"', 'data-wm-component="input"']) ok(shared.includes(marker), `M72 shared UI migration missing: ${marker}`);
ok(read('src/app/shell/WorkManagementShell.tsx').includes('data-wm-host-migrated="shell"'), 'M72 shell migration marker missing');

if (m96AuthorityExists) {
  ok(!fs.existsSync(path.join(root,'assets/css/foundation/host-ui-migration.css')), 'M96 must remove the retired M72 host bridge');
  const css = read('assets/css/foundation/cross-module-responsive-harmonization.css');
  for (const marker of ['.update-banner.wm-status-message', '@media (max-width:40rem)']) ok(css.includes(marker), `M72 successor CSS contract missing after M96: ${marker}`);
} else {
  const css = read('assets/css/foundation/host-ui-migration.css');
  for (const marker of ['.update-banner.wm-status-message', '@media(max-width:620px)']) ok(css.includes(marker), `M72 host CSS contract missing: ${marker}`);
}
ok(read('assets/css/foundation/feedback-system.css').includes('@media (forced-colors: active)'), 'M72 must inherit forced-colors feedback behavior from M67');
ok(read('assets/css/foundation/interactions.css').includes('@media (prefers-reduced-motion:reduce)'), 'M72 must inherit reduced-motion interaction behavior from the shared interaction authority');

const pkg = JSON.parse(read('package.json'));
for (const script of ['host-ui:check','host-ui:test','host-ui:browser','host-ui:release','host-ui:certify','host-ui:post-certification','host-ui:package-hygiene','host-ui:final-checkpoint']) ok(typeof pkg.scripts?.[script] === 'string', `package script missing: ${script}`);
const release = pkg.scripts['release:check'] ?? '';
ok(release.indexOf('motion-continuity:test') < release.indexOf('host-ui:check'), 'M72 must execute after M71');
ok(release.indexOf('host-ui:test') < release.indexOf('design-system:check'), 'M72 deterministic gate must precede downstream design-system verification');

if (failures.length) {
  console.error('M72 host-level UI migration architecture verification FAILED');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log('M72 host-level UI migration architecture verification: PASS');
console.log('Verified controlled host consumer migration, certified primitive adoption, runtime ownership preservation, host-only styling, successor boundaries, and certification wiring.');
