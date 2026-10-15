import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const manifestPath = path.join(root, 'regression-baseline/m78-m77-protected-presentation.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };
const m79AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m79-design-tokens-semantic-theme-target.ts'));
const m79AllowedProtectedMutations = new Set([
  'assets/css/foundation/tokens.css',
  'assets/css/foundation/themes.css',
  'assets/css/foundation/token-architecture.css',
  'src/design-system/foundation.ts',
  'src/design-system/tokens.ts',
  'src/design-system/theme-contract.ts',
  'src/design-system/index.ts',
]);
const m79AllowedNewProtectedFiles = new Set(['src/design-system/futuristic-token-contract.ts']);
const m80AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m80-shared-primitive-component-layer-target.ts'));
const m80AllowedNewProtectedFiles = new Set([
  'src/design-system/shared-primitive-system.ts',
  'src/design-system/shared-primitives/alert.tsx',
  'src/design-system/shared-primitives/card.tsx',
  'src/design-system/shared-primitives/filter.tsx',
  'src/design-system/shared-primitives/index.ts',
  'src/design-system/shared-primitives/search.tsx',
  'src/design-system/shared-primitives/segmented-control.tsx',
  'src/design-system/shared-primitives/selector.tsx',
  'src/design-system/shared-primitives/shared.ts',
]);
const m81AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m81-application-shell-global-navigation-target.ts'));
const m81AllowedProtectedMutations = new Set([
  'src/app/boards/components/BoardPresentationSurface.tsx',
  'src/app/composition/RuntimeApplicationBoundary.tsx',
  'src/app/shell/WorkManagementShell.tsx',
]);
const m81AllowedNewProtectedFiles = new Set([
  'src/design-system/application-shell-system.ts',
  'src/design-system/application-shell/index.tsx',
]);
const m82AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m82-layout-surface-responsive-composition-target.ts'));
const m82AllowedProtectedMutations = new Set([
  'assets/css/foundation/responsive-system.css',
]);
const m82AllowedNewProtectedFiles = new Set([
  'src/design-system/layout-composition-system.ts',
  'src/design-system/layout-composition/index.tsx',
]);
const m83AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m83-authentication-account-surfaces-target.ts'));
const m83AllowedProtectedMutations = new Set([
  'src/app/auth/AuthenticationUI.tsx',
  'src/app/management/AuthenticatedManagementUI.tsx',
  'src/design-system/index.ts',
]);
const m83AllowedNewProtectedFiles = new Set([
  'assets/css/foundation/authentication-account-system.css',
  'src/design-system/authentication-account-system.ts',
  'src/design-system/authentication-account/index.tsx',
]);
const m84AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m84-boards-visual-migration-target.ts'));
const m84AllowedProtectedMutations = new Set([
  'src/design-system/index.ts',
]);
const m84AllowedNewProtectedFiles = new Set([
  'assets/css/foundation/boards-visual-migration.css',
  'src/design-system/boards-visual-migration-system.ts',
]);
const m85AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m85-time-tracker-visual-migration-target.ts'));
const m85AllowedProtectedMutations = new Set(['apps/time-tracker/index.html','src/design-system/index.ts']);
const m85AllowedNewProtectedFiles = new Set(['apps/time-tracker/m85-visual-migration.css','src/design-system/time-tracker-visual-migration-system.ts']);
const m86AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m86-fueltrack-plus-visual-migration-target.ts'));
const m86AllowedProtectedMutations = new Set(['apps/fueltrack-plus/runtime.html']);
const m87AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m87-tradelink-visual-migration-target.ts'));
const m87AllowedProtectedMutations = new Set(['apps/tradelink/runtime.html']);
const m86AllowedNewProtectedFiles = new Set(['apps/fueltrack-plus/m86-visual-migration.css','src/design-system/fueltrack-plus-visual-migration-system.ts']);
const m87AllowedNewProtectedFiles = new Set(['apps/tradelink/m87-visual-migration.css','src/design-system/tradelink-visual-migration-system.ts']);
const m88AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m88-users-roles-administration-surfaces-target.ts'));
const m88AllowedProtectedMutations = new Set(['src/app/management/AuthenticatedManagementUI.tsx']);
const m88AllowedNewProtectedFiles = new Set(['assets/css/foundation/users-administration-visual-migration.css','src/design-system/users-administration-visual-migration-system.ts']);
const m89AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m89-settings-configuration-surfaces-target.ts'));
const m89AllowedProtectedMutations = new Set(['src/app/management/AuthenticatedManagementUI.tsx']);
const m89AllowedNewProtectedFiles = new Set(['assets/css/foundation/settings-configuration-visual-migration.css','src/design-system/settings-configuration-visual-migration-system.ts']);
const m90AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m90-data-dense-enterprise-interaction-patterns-target.ts'));
const m90AllowedProtectedMutations = new Set(['src/app/management/AuthenticatedManagementUI.tsx','src/design-system/data/index.ts']);
const m90AllowedNewProtectedFiles = new Set(['assets/css/foundation/data-dense-enterprise-interactions.css','src/design-system/data/enterprise-interactions.tsx','src/design-system/data-dense-enterprise-interaction-system.ts']);
const m91AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m91-dialog-drawer-overlay-feedback-system-target.ts'));
const m91AllowedProtectedMutations = new Set(['src/main.ts','src/design-system/interactions/index.ts','src/design-system/feedback/index.ts']);
const m91AllowedNewProtectedFiles = new Set(['assets/css/foundation/overlay-feedback-successor.css','src/design-system/interactions/drawer.tsx','src/design-system/interactions/confirmation-dialog.tsx','src/design-system/feedback/notification-stack.tsx','src/design-system/overlay-feedback-system.ts']);
const m92AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m92-state-system-coverage-target.ts'));
const m92AllowedProtectedMutations = new Set(['src/main.ts','src/design-system/feedback/index.ts','src/design-system/index.ts']);
const m92AllowedNewProtectedFiles = new Set(['assets/css/foundation/state-system.css','src/design-system/feedback/async-state.tsx','src/design-system/feedback/completion-state.tsx','src/design-system/feedback/skeleton-state.tsx','src/design-system/feedback/validation-state.tsx','src/design-system/state-system.ts']);
const m93AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m93-interaction-state-harmonization-target.ts'));
const m93AllowedNewProtectedFiles = new Set(['assets/css/foundation/interaction-state-harmonization.css','src/design-system/interaction-state-harmonization-system.ts']);
const m94AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m94-motion-transition-architecture-target.ts'));
const m94AllowedProtectedMutations = new Set(['src/design-system/index.ts']);
const m94AllowedNewProtectedFiles = new Set(['assets/css/foundation/motion-transition-architecture.css','assets/js/runtime/motion-transition-architecture.ts','src/design-system/motion-transition-architecture-system.ts']);

const m95AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m95-cross-module-responsive-harmonization-target.ts'));
const m95AllowedProtectedMutations = new Set([
  'apps/fueltrack-plus/styles.v3.17.0-wm6.css',
  'apps/time-tracker/styles.css',
  'apps/time-tracker/v2.css',
  'apps/tradelink/styles.v1.42.0-wm1.css',
  'assets/css/app.css',
  'assets/css/boards-monday.css',
  'assets/css/shell-accessibility.css',
  'assets/css/shell-account-menu.css',
  'assets/css/shell-navigation.css',
]);
const m95AllowedNewProtectedFiles = new Set([
  'assets/css/foundation/cross-module-responsive-harmonization.css',
  'src/design-system/cross-module-responsive-harmonization.ts',
]);

const m96AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m96-visual-consistency-legacy-styling-retirement-target.ts'));
const m96AllowedProtectedMutations = new Set([
  'src/main.ts',
  'apps/time-tracker/index.html',
  'apps/time-tracker/app.js',
  'apps/fueltrack-plus/runtime.html',
  'apps/fueltrack-plus/app.v3.17.0-wm6.js',
  'apps/tradelink/runtime.html',
  'apps/tradelink/app.v1.42.0-wm1.js',
]);
const m96AllowedProtectedRemovals = new Set([
  'assets/css/foundation/host-ui-migration.css',
  'assets/css/foundation/boards-ui-migration.css',
  'apps/time-tracker/m74-harmonization.css',
  'apps/fueltrack-plus/m75-harmonization.css',
  'apps/tradelink/m76-harmonization.css',
]);
const m96AllowedNewProtectedFiles = new Set([
  'src/design-system/visual-consistency-legacy-styling-retirement.ts',
]);

const m97AuthorityExists = fs.existsSync(path.join(root, 'config/stage-i-m97-workspace-wide-visual-regression-functional-preservation-target.ts'));
const m97AllowedNewProtectedFiles = new Set([
  'src/design-system/workspace-wide-visual-regression-functional-preservation.ts',
]);

const m100AuthorityExists = fs.existsSync(path.join(root, 'M100-M99-BASELINE-SOURCE-MANIFEST.json'))
  && fs.existsSync(path.join(root, 'scripts/verify-stage-i-m100-m99-source-guard.mjs'));
const m100AllowedProtectedMutations = new Set([
  'assets/js/features/boards/index.ts',
  'src/features/boards/contracts/index.ts',
]);
const m100AllowedNewProtectedFiles = new Set([
  'src/features/boards/contracts/import.ts',
  'src/features/boards/import/board-import-parser.ts',
  'src/features/boards/import/index.ts',
]);

const m101AuthorityExists = fs.existsSync(path.join(root, 'M101-M100-BASELINE-SOURCE-MANIFEST.json'))
  && fs.existsSync(path.join(root, 'scripts/verify-stage-i-m101-m100-source-guard.mjs'));
const m101AllowedProtectedMutations = new Set([
  'assets/js/boards-ui.ts',
  'assets/js/features/boards/index.ts',
  'assets/js/features/boards/data/board-repository.ts',
  'assets/js/features/boards/services/board-domain-service.ts',
  'assets/js/features/boards/views/board-workspace-view.ts',
  'src/features/boards/contracts/index.ts',
  'src/features/boards/contracts/repository.ts',
]);
const m101AllowedNewProtectedFiles = new Set([
  'assets/js/features/boards/controllers/board-import-workflow.ts',
  'src/features/boards/contracts/import-preview.ts',
  'src/features/boards/import/board-import-preview.ts',
]);

const m102AuthorityExists = fs.existsSync(path.join(root, 'M102-M101-BASELINE-SOURCE-MANIFEST.json'))
  && fs.existsSync(path.join(root, 'scripts/verify-stage-i-m102-m101-source-guard.mjs'));
const m102AllowedProtectedMutations = new Set([
  'assets/js/boards-ui.ts',
  'assets/js/features/boards/controllers/board-import-workflow.ts',
  'assets/js/features/boards/index.ts',
  'assets/js/features/boards/views/board-workspace-view.ts',
  'src/features/boards/contracts/index.ts',
]);
const m102AllowedNewProtectedFiles = new Set([
  'assets/js/features/boards/controllers/board-export-workflow.ts',
  'src/features/boards/contracts/export.ts',
  'src/features/boards/export/board-export.ts',
  'src/features/boards/export/index.ts',
]);

const m103AuthorityExists = fs.existsSync(path.join(root, 'M103-M102-BASELINE-SOURCE-MANIFEST.json'))
  && fs.existsSync(path.join(root, 'scripts/verify-stage-i-m103-m102-source-guard.mjs'));
const m103AllowedProtectedMutations = new Set([
  'assets/js/features/boards/controllers/board-import-workflow.ts',
  'assets/js/features/boards/data/board-repository.ts',
  'assets/js/features/boards/data/board-contracts.ts',
  'src/features/boards/contracts/domain.ts',
  'src/features/boards/contracts/export.ts',
  'src/features/boards/contracts/import-preview.ts',
  'src/features/boards/contracts/import.ts',
  'src/features/boards/export/board-export.ts',
  'src/features/boards/import/board-import-preview.ts',
]);
const m103AllowedNewProtectedFiles = new Set([]);

// M109 successor authorization is deliberately hash-pinned, not blanket permission.
// The M77/M78 baseline is immutable for every other protected presentation file.
const m109BoardAuthorityExists = fs.existsSync(path.join(root, 'scripts/verify-m109-board-ux.mjs'));
const m109ExactProtectedPresentationHashes = new Map([
  ['assets/js/features/boards/board-schema.ts', '9b7d0a55bb47a85436d29801d7fd62beea44cb0944a016843b6a33994e61cce1'],
  ['assets/js/features/boards/controllers/board-menu-controller.ts', '303c39ff27de01d112dbd5f0a541ee51ee2a24acd50feee7312c97d11670449b'],
  ['assets/js/features/boards/controllers/column-workflows.ts', 'd86b8ca16a694c699cca7a7fe211aa6e3d581601f20bf1897ab17fbcb8fbd36d'],
  ['assets/js/features/boards/views/table-view.ts', '575a944f918d4134b456671dc7b88e65e309e64c0d7764900afaf2aad00f8076'],
]);

// M143 Board Import wizard successor: six exact SHA-256-pinned additions only.
// The M77/M78 baseline and all other successor authorities remain unchanged.
const m143WizardExactNewProtectedHashes = new Map([
  ['assets/css/board-import-wizard.css', '3ee1ab4e968421eb98dbd67f8b543d6120a4d3413d440e2abfc4f07d6a34a0e6'],
  ['assets/js/features/boards/controllers/board-import-wizard-ui.ts', '7fd7b09b9cccd4eb0bc36827d54cc845222e15c3dce676ae486669506c1fce81'],
  ['src/features/boards/contracts/import-wizard-commit.ts', '8222931e5e97f9f383a7d1ec72c55a43ef28f406efcb5f2434de205f3007f961'],
  ['src/features/boards/contracts/import-wizard.ts', 'f126606d8a2b26177d4731130562aa17e0c22823e8ad2ad28017c019fa20405d'],
  ['src/features/boards/import/board-import-wizard-commit.ts', '877cb6cb3aaeec46006a369a2fadee99371af07dcdbd31c4eab2c5799de237e1'],
  ['src/features/boards/import/board-import-wizard-plan.ts', '9abda2153f22868e3685c994cb2dbc0bae91da42b5ee737cbe15a410c4c366b1'],
]);


// M144.15 HF1: preserve the immutable M143 hashes; authorize only three
// separately reviewed successor bytes when the whole triplet is unchanged.
const m14415WizardExactProtectedHashes = new Map([
  ['assets/js/features/boards/controllers/board-import-wizard-ui.ts', 'e48fe28a46c0def531c42558537333a82d0ba13cb54155a22404799febbd1615'],
  ['src/features/boards/import/board-import-wizard-commit.ts', '0b351be68bb4d059d98f8111b128738aa6085b95ddba922271e7ac5b6f2619de'],
  ['src/features/boards/import/board-import-wizard-plan.ts', '7536ad306234757e2fb3303f59290a996a22da4c7c773910ec8e983310448c8d'],
]);

// M144.15 HF3: one additional reviewed wizard UI successor; every other hash is unchanged.
const m14415Hf3WizardUiSha256 = 'e1c615bc73335e448c2a4aa4ddcea2b7380866cdf605ba941e41e4f8ec9986cc';
const m14415Hf3WizardUiPath = 'assets/js/features/boards/controllers/board-import-wizard-ui.ts';
const isReviewedWizardHash = (relative, actual, historical) => actual === historical ||
  (relative === m14415Hf3WizardUiPath && actual === m14415Hf3WizardUiSha256);

const modeFor = (stat) => {
  if (stat.isSymbolicLink()) return '120000';
  return (stat.mode & 0o111) !== 0 ? '100755' : '100644';
};
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

// Refuse M143 visual authority unless the exact reviewed atomic RPC source
// and the documented M143 contract are both present. This does not execute SQL.
const m143WizardSqlPath = path.join(root, 'supabase/m143/board_import_wizard_atomic_DRAFT.sql');
const m143WizardAuthorityExists =
  fs.existsSync(path.join(root, 'spec/M143-TRANSACTION-AND-DEPLOYMENT-BOUNDARIES-NOT-CERTIFIED.md')) &&
  fs.existsSync(path.join(root, 'tests/modern/board-import/m143-contract.verify.mjs')) &&
  fs.existsSync(m143WizardSqlPath) &&
  sha256(fs.readFileSync(m143WizardSqlPath)) === 'b883b3c432ae5ebcadd9fda2f15b5bcdeb0cff9448ace4862c6fb88fd5fd37fc';

const actualEntries = [];
const walk = (relative) => {
  const absolute = path.join(root, relative);
  ok(fs.existsSync(absolute), `protected root/path missing: ${relative}`);
  if (!fs.existsSync(absolute)) return;
  const stat = fs.lstatSync(absolute);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(absolute).sort()) walk(path.posix.join(relative, name));
    return;
  }
  const bytes = stat.isSymbolicLink() ? Buffer.from(fs.readlinkSync(absolute)) : fs.readFileSync(absolute);
  actualEntries.push({ path: relative, mode: modeFor(stat), sha256: sha256(bytes), size: bytes.length });
};
for (const protectedRoot of manifest.protectedRoots) walk(protectedRoot);
actualEntries.sort((a, b) => a.path.localeCompare(b.path));

const expectedByPath = new Map(manifest.entries.map((entry) => [entry.path, entry]));
const actualByPath = new Map(actualEntries.map((entry) => [entry.path, entry]));

// A partial successor edit does not authorize any one of the three files.
// The reviewed M143 SQL and strict regular-file modes are still required.
const m14415WizardAuthorityExists = m143WizardAuthorityExists &&
  [...m14415WizardExactProtectedHashes].every(([relative, digest]) => {
    const entry = actualByPath.get(relative);
    return Boolean(entry) && isReviewedWizardHash(relative, entry.sha256, digest) && entry.mode === '100644';
  });

for (const [relative, expected] of expectedByPath) {
  const actual = actualByPath.get(relative);
  const successorAuthorizedRemoval = m96AuthorityExists && m96AllowedProtectedRemovals.has(relative);
  ok(Boolean(actual) || successorAuthorizedRemoval, `M77 protected presentation file removed: ${relative}`);
  if (!actual) continue;
  ok(actual.mode === expected.mode, `M77 protected presentation mode drift: ${relative} expected=${expected.mode} actual=${actual.mode}`);
  const successorAuthorizedMutation =
    (m79AuthorityExists && m79AllowedProtectedMutations.has(relative)) ||
    (m81AuthorityExists && m81AllowedProtectedMutations.has(relative)) ||
    (m82AuthorityExists && m82AllowedProtectedMutations.has(relative)) ||
    (m83AuthorityExists && m83AllowedProtectedMutations.has(relative)) ||
    (m84AuthorityExists && m84AllowedProtectedMutations.has(relative)) ||
    (m85AuthorityExists && m85AllowedProtectedMutations.has(relative)) ||
    (m86AuthorityExists && m86AllowedProtectedMutations.has(relative)) ||
    (m87AuthorityExists && m87AllowedProtectedMutations.has(relative)) ||
    (m88AuthorityExists && m88AllowedProtectedMutations.has(relative)) ||
    (m89AuthorityExists && m89AllowedProtectedMutations.has(relative)) ||
    (m90AuthorityExists && m90AllowedProtectedMutations.has(relative)) ||
    (m91AuthorityExists && m91AllowedProtectedMutations.has(relative)) ||
    (m92AuthorityExists && m92AllowedProtectedMutations.has(relative)) ||
    (m94AuthorityExists && m94AllowedProtectedMutations.has(relative)) ||
    (m95AuthorityExists && m95AllowedProtectedMutations.has(relative)) ||
    (m96AuthorityExists && m96AllowedProtectedMutations.has(relative)) ||
    (m100AuthorityExists && m100AllowedProtectedMutations.has(relative)) ||
    (m101AuthorityExists && m101AllowedProtectedMutations.has(relative)) ||
    (m102AuthorityExists && m102AllowedProtectedMutations.has(relative)) ||
    (m103AuthorityExists && m103AllowedProtectedMutations.has(relative));
  const m108MaterialTrackerBootstrapSuccessor =
    relative === 'assets/js/runtime/module-bootstrap.ts' &&
    fs.existsSync(path.join(root, 'M108-MATERIAL-TRACKER-SECURITY-CORRECTIVE.md'));
  if (m108MaterialTrackerBootstrapSuccessor) {
    const bootstrapSource = fs.readFileSync(path.join(root, relative), 'utf8');
    ok(bootstrapSource.includes("'material-tracker'"), 'M78 M108 successor Material Tracker bootstrap registration missing');
    const normalizedBootstrap = bootstrapSource.replace(", 'material-tracker'", '');
    const normalizedBytes = Buffer.from(normalizedBootstrap);
    ok(sha256(normalizedBytes) === expected.sha256, `M77 protected presentation bootstrap drift beyond certified Material Tracker module-id extension: ${relative}`);
    ok(normalizedBytes.length === expected.size, `M77 protected presentation bootstrap size drift beyond certified Material Tracker module-id extension: ${relative}`);
  } else if (!(successorAuthorizedMutation || (
    m109BoardAuthorityExists &&
    m109ExactProtectedPresentationHashes.get(relative) === actual.sha256 &&
    actual.sha256 !== expected.sha256
  ))) {
    ok(actual.sha256 === expected.sha256, `M77 protected presentation byte drift: ${relative}`);
    ok(actual.size === expected.size, `M77 protected presentation size drift: ${relative}`);
  }
}
// Unlike a folder-level allowlist, every approved new file must exist at
// its reviewed bytes and non-executable regular-file mode.
if (m143WizardAuthorityExists) {
  for (const [relative, expectedSha] of m143WizardExactNewProtectedHashes) {
    const actual = actualByPath.get(relative);
    ok(Boolean(actual), `M143 protected wizard successor file missing: ${relative}`);
    if (!actual) continue;
    ok(actual.mode === '100644', `M143 protected wizard successor file mode drift: ${relative}`);
    ok(actual.sha256 === expectedSha || (m14415WizardAuthorityExists && isReviewedWizardHash(relative, actual.sha256, m14415WizardExactProtectedHashes.get(relative))), `M143 protected wizard successor SHA-256 drift: ${relative}`);
  }
}
for (const relative of actualByPath.keys()) {
  if (!expectedByPath.has(relative)) {
    ok(
      (m79AuthorityExists && m79AllowedNewProtectedFiles.has(relative)) ||
      (m80AuthorityExists && m80AllowedNewProtectedFiles.has(relative)) ||
      (m81AuthorityExists && m81AllowedNewProtectedFiles.has(relative)) ||
      (m82AuthorityExists && m82AllowedNewProtectedFiles.has(relative)) ||
      (m83AuthorityExists && m83AllowedNewProtectedFiles.has(relative)) ||
      (m84AuthorityExists && m84AllowedNewProtectedFiles.has(relative)) ||
      (m85AuthorityExists && m85AllowedNewProtectedFiles.has(relative)) ||
      (m86AuthorityExists && m86AllowedNewProtectedFiles.has(relative)) ||
      (m87AuthorityExists && m87AllowedNewProtectedFiles.has(relative)) ||
      (m88AuthorityExists && m88AllowedNewProtectedFiles.has(relative)) ||
      (m89AuthorityExists && m89AllowedNewProtectedFiles.has(relative)) ||
      (m90AuthorityExists && m90AllowedNewProtectedFiles.has(relative)) ||
      (m91AuthorityExists && m91AllowedNewProtectedFiles.has(relative)) ||
      (m92AuthorityExists && m92AllowedNewProtectedFiles.has(relative)) ||
      (m93AuthorityExists && m93AllowedNewProtectedFiles.has(relative)) ||
      (m94AuthorityExists && m94AllowedNewProtectedFiles.has(relative)) ||
      (m95AuthorityExists && m95AllowedNewProtectedFiles.has(relative)) ||
      (m96AuthorityExists && m96AllowedNewProtectedFiles.has(relative)) ||
      (m97AuthorityExists && m97AllowedNewProtectedFiles.has(relative)) ||
      (m100AuthorityExists && m100AllowedNewProtectedFiles.has(relative)) ||
      (m101AuthorityExists && m101AllowedNewProtectedFiles.has(relative)) ||
      (m102AuthorityExists && m102AllowedNewProtectedFiles.has(relative)) ||
      (m103AuthorityExists && m103AllowedNewProtectedFiles.has(relative)) ||
      (m143WizardAuthorityExists &&
        (m143WizardExactNewProtectedHashes.get(relative) === actualByPath.get(relative)?.sha256 ||
         (m14415WizardAuthorityExists && isReviewedWizardHash(relative, actualByPath.get(relative)?.sha256, m14415WizardExactProtectedHashes.get(relative)))) &&
        actualByPath.get(relative)?.mode === '100644'),
      `new protected presentation file is not successor-authorized: ${relative}`,
    );
  }
}

const aggregate = sha256(Buffer.from(actualEntries.map((entry) => `${entry.mode} ${entry.sha256} ${entry.path}\n`).join('')));
if (!m79AuthorityExists) {
  ok(actualEntries.length === manifest.fileCount, `protected presentation file count drift: expected=${manifest.fileCount} actual=${actualEntries.length}`);
  ok(aggregate === manifest.aggregateSha256, `protected presentation aggregate drift: expected=${manifest.aggregateSha256} actual=${aggregate}`);
} else {
  const target = fs.readFileSync(path.join(root, 'config/stage-i-m79-design-tokens-semantic-theme-target.ts'), 'utf8');
  ok(target.includes("activationState: 'implementation-complete-pending-certification'") || target.includes("activationState: 'active-certified'"), 'M78 successor M79 authority has invalid state');
}

const chakraImports = [];
const scanTs = (relative) => {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return;
  const stat = fs.lstatSync(absolute);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(absolute).sort()) scanTs(path.posix.join(relative, name));
  } else if (/\.(?:ts|tsx)$/.test(relative)) {
    const source = fs.readFileSync(absolute, 'utf8');
    if (/from\s+['"]@chakra-ui\/react['"]/.test(source)) chakraImports.push(relative);
  }
};
scanTs('src');
chakraImports.sort();
ok(JSON.stringify(chakraImports) === JSON.stringify([
  'src/design-system/WorkManagementDesignSystemProvider.tsx',
  'src/design-system/system.ts',
]), `design-system provider boundary drifted: ${chakraImports.join(', ')}`);

if (failures.length) {
  console.error('M78 protected-presentation no-visual-drift verification FAILED');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log('M78 protected-presentation no-visual-drift verification: PASS');
console.log(`Protected files=${actualEntries.length}; aggregate=${aggregate}; Chakra imports remain design-system-owned${m79AuthorityExists ? '; M79 token/theme successor mutations authorized' : ''}${m80AuthorityExists ? '; M80 shared primitive additions authorized' : ''}${m81AuthorityExists ? '; M81 application-shell successor mutations/additions authorized' : ''}${m82AuthorityExists ? '; M82 layout-composition mutations/additions authorized' : ''}${m83AuthorityExists ? '; M83 authentication/account presentation mutations/additions authorized' : ''}${m84AuthorityExists ? '; M84 Boards visual presentation additions authorized' : ''}${m85AuthorityExists ? '; M85 TimeTracker visual presentation mutation/additions authorized' : ''}${m86AuthorityExists ? '; M86 FuelTrack+ visual presentation mutation/additions authorized' : ''}${m87AuthorityExists ? '; M87 TradeLink visual presentation mutation/additions authorized' : ''}${m88AuthorityExists ? '; M88 Users/roles administration presentation mutation/additions authorized' : ''}${m89AuthorityExists ? '; M89 Settings/configuration presentation mutation/additions authorized' : ''}${m90AuthorityExists ? '; M90 data-dense enterprise interaction mutation/additions authorized' : ''}${m91AuthorityExists ? '; M91 overlay/feedback successor mutation/additions authorized' : ''}${m92AuthorityExists ? '; M92 state-system successor mutation/additions authorized' : ''}${m93AuthorityExists ? '; M93 interaction-state successor additions authorized' : ''}${m94AuthorityExists ? '; M94 motion-transition successor mutation/additions authorized' : ''}${m95AuthorityExists ? '; M95 responsive-harmonization successor mutations/additions authorized' : ''}${m96AuthorityExists ? '; M96 legacy styling retirement mutations/removals authorized' : ''}${m97AuthorityExists ? '; M97 workspace-wide visual regression successor additions authorized' : ''}${m100AuthorityExists ? '; M100 Boards import protected-source mutations/additions authorized' : ''}${m101AuthorityExists ? '; M101 Boards import preview/atomic-commit protected-source mutations/additions authorized' : ''}${m102AuthorityExists ? '; M102 Boards data-portability protected-source mutations/additions authorized' : ''}${m103AuthorityExists ? '; M103 Prompts 1-4 completion protected-source mutations authorized' : ''}${m109BoardAuthorityExists ? '; M109 four exact hash-pinned Board presentation mutations authorized' : ''}${m143WizardAuthorityExists ? '; M143 six exact hash-pinned Board Import wizard additions authorized' : ''}.`);
