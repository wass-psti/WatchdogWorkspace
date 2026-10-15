import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// A successor is compared to a fresh extraction of the pinned M108 archive.
// An arbitrary directory, mutable manifest, or unverified report is not a baseline.
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archive = process.env.M108_BASELINE_ARCHIVE;
const rootName = 'Work-Management-App-v1.43.2-Stage-I-M108-Material-Tracker-Security-Corrective-Certified';
const archiveSha = '7be24ace31dccca32cdcd806d9e1c6f276b266a34b5d12aad0b4de6deefa5735';
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const fail = message => { throw new Error(`M108 successor guard: ${message}`); };
if (!archive || !path.isAbsolute(archive)) fail('M108_BASELINE_ARCHIVE must be an absolute path to the original certified M108 ZIP');
if (!fs.existsSync(archive) || sha(archive) !== archiveSha) fail('original M108 archive SHA256 mismatch');

const expected = new Map(Object.entries({
  'assets/js/core/auth.ts': 'b93073bd4b5a37359e5c8d499deb7f63a5e8edf448170ec4bb57aba30c76c511',
  'scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs': '64bddafb64cb577aa9cb51605a86c5e7593597dcde521ee847cf037387a1683d',
  'assets/js/features/boards/board-schema.ts': '9b7d0a55bb47a85436d29801d7fd62beea44cb0944a016843b6a33994e61cce1',
  'assets/js/features/boards/controllers/board-menu-controller.ts': '303c39ff27de01d112dbd5f0a541ee51ee2a24acd50feee7312c97d11670449b',
  'assets/js/features/boards/controllers/column-workflows.ts': 'd86b8ca16a694c699cca7a7fe211aa6e3d581601f20bf1897ab17fbcb8fbd36d',
  'assets/js/features/boards/views/table-view.ts': '575a944f918d4134b456671dc7b88e65e309e64c0d7764900afaf2aad00f8076',

  'verify-stage-i-m83-authentication-account-surfaces.mjs': '8eb3077d7a6feba75cf789263b6c1b5c16eb0a71aca1be50ea46145c574b34f6',
  'scripts/lib/m108-login-successor-auth-provenance.mjs': '1151b51b22de5aece1ced064f090f8b6f4b9c6ad03a72624a80e7ba1df01ba3a',
  'verify-m108-login-unsupported-module-corrective.mjs': 'f18429eaf876a0355259534fdcfc01db244f96ad0a6b1e97728a8b912b540a22',
  'M108-LOGIN-UNSUPPORTED-MODULE-CORRECTIVE.md': 'fff2e806d030458fc89e9c231f74d41f1d442e8eda4a4c260a00bbd2977f6fae',
  'package.json': '150713f9ec26162d911c0ece6f53f4a1819e4092b7417776e5fa3ee3ce4640d5',
  'package-lock.json': '8a4790f586c86ec1c77d9815df6edc4a0561cc753cf8011bfb28ee78cc5f4667',
  'integrations/material-tracker/scripts/check-integration.mjs': '852556d2b6909fbb4402fcaf2664aa4bda2279a093dd26c1e236750c5ca7ad28',
  'scripts/lib/stage-g-m49-certification-tree.mjs': '636ae30136ab9635fbe985e288774d130abf7ec059f249ed8f7009e13ad8d4e5',
  'scripts/finalize-stage-g-m49.sh': '0a256463d54aee52140a02d0568f1307c4ab30e894448079388aeb3efd09756f',
  'tests/modern/e2e/boards-kanban-drag-drop-recovery.spec.mjs': '7e945f70a51abcf92f2f972445f87a1c5ad972a170e754ff82d9b38a08fa43dc',
  'scripts/verify-stage-g-m49-finalizer-fail-closed.mjs': 'f91fe430ee12b938b0226c6f9a6923fc1a3223534432d40f06fb04e4e54ec5c7',
  'tests/modern/e2e/helpers/m52-rbac-fixture.mjs': '8572e3f329131f0358dbf5f2c80ffce48d0a089997b6a1f1684c66022856cda8',
  'scripts/verify-package-governance.mjs': '8c05bfe07ef5884cba21024de3f36fcd79ad316b6d9bd2b59ae75103090ec66b',
  'scripts/verify-stage-i-m79-design-tokens-semantic-theme-execution.mjs': '98b9cb909c8fda293d9ca69a19f95bda29bcac756b39ea1f62546bfbb141896c',
  'scripts/verify-stage-i-m81-application-shell-global-navigation-execution.mjs': 'e76eca77b0370bc532858f60c8cd8793f0734e2b17b2ec75b7886857afb6adfd',
  'scripts/verify-stage-i-m82-layout-surface-responsive-composition-execution.mjs': '7f8b640f90b7b4926d6a3cf9611c2981f774d736ef441411d4784cf50831f30d',
  'scripts/verify-stage-i-m83-authentication-account-surfaces-execution.mjs': 'c6948dd45984efd51a0a15662612c14615d12f9681742228fa7426874f6988ec',
  'scripts/verify-stage-i-m84-boards-visual-migration-execution.mjs': '0243a375037e35bb361155264125385cb93721cbfc95ec320c92b89681aabdb1',
  'scripts/verify-stage-i-m98-futuristic-minimalist-production-readiness-certification-execution.mjs': 'a237dd12394e42078198b7587aa2e3ee41194d758b99b9fbd2527b473ae9bac3',
  'scripts/verify-stage-i-m88-users-roles-administration-surfaces-execution.mjs': '4fd0a17acd4e46a852fa6e21d759d4883182944f7472fa6ef3edc3d0317dc27c',
  'scripts/verify-stage-i-m89-settings-configuration-surfaces-execution.mjs': '97fa5b92aa912f6bf2bfd70d8d8da83168a3366fd46d2f5851a656001faf4fc0',
  '.github/workflows/boards-backend-data-contract-recovery.yml': '4d090613c258932099adcb51c8ded886183d992f95d83835fc9db837b5c665bf',
  '.github/workflows/boards-collection-route-recovery.yml': '84753a2e436b414e845e32e4c36445bdc1240ced3a9c316d422ff6b78f5cf583',
  '.github/workflows/boards-columns-cells-status-system-recovery.yml': 'da4c0d01a5b4bc33c2f841d582dbfad610b94752763cff79651d6c0097164b05',
  '.github/workflows/boards-kanban-drag-drop-recovery.yml': '7ce7c9881dde3bf018c205fe02f7647e5df24ea81da5a0d9a3b18f913eb71299',
  '.github/workflows/boards-table-group-item-recovery.yml': '2f1f6f7ba0f894406704a43cfee4bc21391a5b4f4258d891d5f22d85722b31ac',
  '.github/workflows/management-authority-consolidation.yml': 'f70b30fcaa38fdab738ffdb971de53719c6f1d4619eecf1dfac55266d7431965',
  '.github/workflows/rich-item-workspace-file-recovery.yml': '5a5ebc44005a0611f18efd2bf2e08900b454ea449317dd1fa0ab1ed48be430cf',
  '.github/workflows/settings-functional-recovery.yml': 'fbac6736c34f35ade4e9cde7cd3fbc07c37fdbb7f9001a934958230fafc7f14b',
  '.github/workflows/ci.yml': 'cfb1b17a42c2928838d9fde6f60ef8c1fcab887dd701470da9131a99f02c809c',
  '.github/workflows/deploy-pages.yml': 'deb4651d837b35f5bc0665d6da3e8bb29459fc300b2c8279e71aa72691c1258a',
  '.github/workflows/production-cutover.yml': '50dfed343bba77bada9c4277fdeb98af1d62f18a09b3815ab479b132575e67ed',
  '.github/workflows/m54-functional-production-readiness.yml': '9533442581ad82cb1841a31cf164e187a447be2a65e5c507bcb518ccf019ec97',
  '.github/workflows/users-rbac-functional-recovery.yml': '463b08f3ad06136b5d9a4df18d3c01a70d1a9da09fecddbccfa240e95d3a62b5',
  '.github/workflows/final-legacy-deletion.yml': '09afc191799895d9696766e7306e5e7b70670e0c170b3d1ac9b3e1c96121c97c',
  '.github/actions/prepare-m108-baseline/action.yml': '8ec7e6db1aaee4b92cba29e31805103445eeb860e29869e2412ac59518a49b7a',
  'assets/js/boards-ui.ts': '86063248c13bd959fcc0d4ca626dfbec82e1b0f5ba1e2e8ccd8ef1142b769739',
  'assets/css/app.css': 'a67330e1eb590f01e1e3c3ce7632464dbb54ffa4d503687d2d97c4741ba79488',
  'assets/css/boards-monday.css': 'dfc0560f8d14dc19d3291291514a098b0ae8bbdaab413d4b4eae0f2cccb37dcd',
  'scripts/verify-m109-board-ux.mjs': '147375ee0eec195cc5a17c5135ade806143d2e2b88f49db97dd92e0d465389f3',
  // Successor shell runner and documentation hashes are filled on implementation.
  'scripts/certify-m108-login-successor-local.sh': '381fa4adf50e07dd8f6d4966824c15a9ecf2ca0b970bbab6e82cf514d95a38bc',
  'scripts/test-m108-login-successor.mjs': '266e9b3dbb8a5790a80c21ef6dd5b42c9155e54c3de0d17907083865884f4ef6',
  'M108-LOGIN-SUCCESSOR-CONTINUATION.md': '357a7d5a3cae9de9376780fd55f63bfac033f71f942cb4a66d1bf424e02ebf5b',
}));

// M144.15 HF1 follows M143/M144.14 without rewriting historical approvals.
// Exact reviewed successor: three runtime files plus two narrowly scoped tests.
const m14415ExactSource = new Map([
  ['assets/js/features/boards/controllers/board-import-wizard-ui.ts', 'e48fe28a46c0def531c42558537333a82d0ba13cb54155a22404799febbd1615'],
  ['src/features/boards/import/board-import-wizard-commit.ts', '0b351be68bb4d059d98f8111b128738aa6085b95ddba922271e7ac5b6f2619de'],
  ['src/features/boards/import/board-import-wizard-plan.ts', '7536ad306234757e2fb3303f59290a996a22da4c7c773910ec8e983310448c8d'],
  ['tests/modern/board-import/m141-wizard-plan.verify.mjs', '1f7d3ac68bd0ed0b7c574a57143abfa77088dc36c2d044e91d2719889f6488f0'],
  ['tests/modern/board-import/m142-wizard-integration.verify.mjs', '18a67300093d332604bc66187ca72d6fbe2d727bed51fedf8770bf2c4a3ed304'],
 ]);
// M144.15 HF3 permits only the reviewed UI bytes, never a blanket UI-file exemption.
const m14415Hf3WizardUiPath = 'assets/js/features/boards/controllers/board-import-wizard-ui.ts';
const m14415Hf3WizardUiSha256 = 'e1c615bc73335e448c2a4aa4ddcea2b7380866cdf605ba941e41e4f8ec9986cc';
// M144.16: exact dual-file successor bound to the exact updated M78 guard.
const m14416ExactSource = new Map([
  ['assets/js/features/boards/controllers/board-import-wizard-ui.ts', '973d3cef0ecf594e85d04f076d3e51404d40c9188e5741084e7dab7b0e376400'],
  ['src/features/boards/import/board-import-wizard-commit.ts', 'fe8e8d4b85db38abd40daa2e5ac26d534e94e11314f6f3d13e58107945dde14d'],
 ]);
const m14416M78GuardSha256 = '4a3406b4a66cca4dba99cd752128b35d366639d5398e5f713a6fde381b83bc83';
const m14416Active = [...m14416ExactSource].every(([rel, digest]) =>
  fs.existsSync(path.join(repo, rel)) && sha(path.join(repo, rel)) === digest) &&
  sha(path.join(repo, 'scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs')) === m14416M78GuardSha256;
const m14415ReviewedHash = (rel, actual, prior) => actual === prior ||
  (rel === m14415Hf3WizardUiPath && actual === m14415Hf3WizardUiSha256) ||
  (m14416Active && m14416ExactSource.get(rel) === actual);
const m14415M78GuardSha256 = '668718f030a43e73fe933bb3f07a9fe382eea4ca956478f014485c8b3223ca58';
const m14415Active = [...m14415ExactSource].every(([rel, digest]) =>
  fs.existsSync(path.join(repo, rel)) && m14415ReviewedHash(rel, sha(path.join(repo, rel)), digest)) &&
  (sha(path.join(repo, 'scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs')) === m14415M78GuardSha256 || m14416Active);
const isApprovedHistoricalOrM14415 = (rel, expectedDigest) => {
  const file = path.join(repo, rel);
  if (!fs.existsSync(file)) return false;
  const actualDigest = sha(file);
  return actualDigest === expectedDigest ||
    (m14415Active && m14415ExactSource.has(rel) && m14415ReviewedHash(rel, actualDigest, m14415ExactSource.get(rel)));
};

for (const [rel, want] of expected) {
  const file = path.join(repo, rel);
  if (!isApprovedHistoricalOrM14415(rel, want) && !(m14415Active && rel === 'scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs')) fail(`unapproved bytes or missing file: ${rel}`);
}

// Only reproducible outputs are excluded; historical integration source is guarded.
const ignoredDir = new Set(['node_modules', '.git']);
const generatedDirs = new Set([
  'dist', 'coverage', 'test-results', 'playwright-report',
  'integrations/material-tracker/dist',
  'apps/material-tracker',
]);
const ignoredFiles = new Set(['.DS_Store', 'Thumbs.db']);
function inventory(root) {
  const files = new Map();
  function walk(directory, parent = '') {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const rel = parent ? `${parent}/${item.name}` : item.name;
      const f = path.join(directory, item.name);
      if (item.isSymbolicLink()) fail(`symlink not allowed: ${rel}`);
      if (item.isDirectory()) {
        if (ignoredDir.has(item.name) || generatedDirs.has(rel)) continue;
        walk(f, rel);
      } else if (item.isFile()) {
        if (ignoredFiles.has(item.name)) continue;
        files.set(rel, sha(f));
      } else fail(`unsupported filesystem entry: ${rel}`);
    }
  }
  walk(root);
  return files;
}
const permittedModified = new Set(['.github/workflows/boards-backend-data-contract-recovery.yml', '.github/workflows/boards-collection-route-recovery.yml', '.github/workflows/boards-columns-cells-status-system-recovery.yml', '.github/workflows/boards-kanban-drag-drop-recovery.yml', '.github/workflows/boards-table-group-item-recovery.yml', '.github/workflows/management-authority-consolidation.yml', '.github/workflows/rich-item-workspace-file-recovery.yml', '.github/workflows/settings-functional-recovery.yml', '.github/workflows/boards-backend-data-contract-recovery.yml', '.github/workflows/boards-collection-route-recovery.yml', '.github/workflows/boards-columns-cells-status-system-recovery.yml', '.github/workflows/boards-kanban-drag-drop-recovery.yml', '.github/workflows/boards-table-group-item-recovery.yml', '.github/workflows/management-authority-consolidation.yml', '.github/workflows/rich-item-workspace-file-recovery.yml', '.github/workflows/settings-functional-recovery.yml', '.github/workflows/boards-backend-data-contract-recovery.yml', '.github/workflows/boards-collection-route-recovery.yml', '.github/workflows/boards-columns-cells-status-system-recovery.yml', '.github/workflows/boards-kanban-drag-drop-recovery.yml', '.github/workflows/boards-table-group-item-recovery.yml', '.github/workflows/management-authority-consolidation.yml', '.github/workflows/rich-item-workspace-file-recovery.yml', '.github/workflows/settings-functional-recovery.yml', '.github/workflows/boards-backend-data-contract-recovery.yml', '.github/workflows/boards-collection-route-recovery.yml', '.github/workflows/boards-columns-cells-status-system-recovery.yml', '.github/workflows/boards-kanban-drag-drop-recovery.yml', '.github/workflows/boards-table-group-item-recovery.yml', '.github/workflows/management-authority-consolidation.yml', '.github/workflows/rich-item-workspace-file-recovery.yml', '.github/workflows/settings-functional-recovery.yml', '.github/workflows/boards-backend-data-contract-recovery.yml', '.github/workflows/boards-collection-route-recovery.yml', '.github/workflows/boards-columns-cells-status-system-recovery.yml', '.github/workflows/boards-kanban-drag-drop-recovery.yml', '.github/workflows/boards-table-group-item-recovery.yml', '.github/workflows/management-authority-consolidation.yml', '.github/workflows/rich-item-workspace-file-recovery.yml', '.github/workflows/settings-functional-recovery.yml', '.github/workflows/boards-backend-data-contract-recovery.yml', '.github/workflows/boards-collection-route-recovery.yml', '.github/workflows/boards-columns-cells-status-system-recovery.yml', '.github/workflows/boards-kanban-drag-drop-recovery.yml', '.github/workflows/boards-table-group-item-recovery.yml', '.github/workflows/management-authority-consolidation.yml', '.github/workflows/rich-item-workspace-file-recovery.yml', '.github/workflows/settings-functional-recovery.yml', '.github/workflows/boards-backend-data-contract-recovery.yml', '.github/workflows/boards-collection-route-recovery.yml', '.github/workflows/boards-columns-cells-status-system-recovery.yml', '.github/workflows/boards-kanban-drag-drop-recovery.yml', '.github/workflows/boards-table-group-item-recovery.yml', '.github/workflows/management-authority-consolidation.yml', '.github/workflows/rich-item-workspace-file-recovery.yml', '.github/workflows/settings-functional-recovery.yml', '.github/workflows/boards-backend-data-contract-recovery.yml', '.github/workflows/boards-collection-route-recovery.yml', '.github/workflows/boards-columns-cells-status-system-recovery.yml', '.github/workflows/boards-kanban-drag-drop-recovery.yml', '.github/workflows/boards-table-group-item-recovery.yml', '.github/workflows/management-authority-consolidation.yml', '.github/workflows/rich-item-workspace-file-recovery.yml', '.github/workflows/settings-functional-recovery.yml', '.github/workflows/ci.yml', '.github/workflows/deploy-pages.yml', '.github/workflows/production-cutover.yml', '.github/workflows/m54-functional-production-readiness.yml', '.github/workflows/users-rbac-functional-recovery.yml', '.github/workflows/final-legacy-deletion.yml', 'assets/js/core/auth.ts', 'package.json', 'verify-stage-i-m83-authentication-account-surfaces.mjs', 'scripts/verify-stage-i-m79-design-tokens-semantic-theme-execution.mjs', 'scripts/verify-stage-i-m81-application-shell-global-navigation-execution.mjs', 'scripts/verify-stage-i-m82-layout-surface-responsive-composition-execution.mjs', 'scripts/verify-stage-i-m83-authentication-account-surfaces-execution.mjs', 'scripts/verify-stage-i-m84-boards-visual-migration-execution.mjs', 'scripts/verify-stage-i-m98-futuristic-minimalist-production-readiness-certification-execution.mjs', 'scripts/verify-stage-i-m88-users-roles-administration-surfaces-execution.mjs', 'scripts/verify-stage-i-m89-settings-configuration-surfaces-execution.mjs', 'scripts/verify-package-governance.mjs', 'integrations/material-tracker/scripts/check-integration.mjs', 'scripts/lib/stage-g-m49-certification-tree.mjs', 'scripts/finalize-stage-g-m49.sh', 'tests/modern/e2e/boards-kanban-drag-drop-recovery.spec.mjs', 'scripts/verify-stage-g-m49-finalizer-fail-closed.mjs', 'tests/modern/e2e/helpers/m52-rbac-fixture.mjs', 'scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs', 'assets/js/features/boards/board-schema.ts', 'assets/js/boards-ui.ts', 'assets/js/features/boards/controllers/board-menu-controller.ts', 'assets/js/features/boards/views/table-view.ts', 'assets/css/app.css', 'assets/css/boards-monday.css', 'assets/js/features/boards/controllers/column-workflows.ts']);
// M121: explicitly pin the corrected M54 live test as one approved successor
// source delta. Historical M108 file guards and negative controls remain active.
const m121ApprovedM54Spec = 'tests/modern/e2e/functional-production-readiness-live.spec.mjs';
const m121ApprovedM54Sha256 = 'ba9fc17531f59ea8ab22f0cce10212f3bcf9a660f9eec71fecb7f057ec50d45c';
if (sha(path.join(repo, m121ApprovedM54Spec)) !== m121ApprovedM54Sha256) {
  fail('M121 exact M54 live test bytes differ from approved corrective patch');
}
permittedModified.add(m121ApprovedM54Spec);
const permittedAdded = new Set([
  'verify-m108-login-unsupported-module-corrective.mjs',
  'M108-LOGIN-UNSUPPORTED-MODULE-CORRECTIVE.md',
  'scripts/verify-m108-login-successor.mjs',
  'scripts/certify-m108-login-successor-local.sh',
  'scripts/test-m108-login-successor.mjs',
  'M108-LOGIN-SUCCESSOR-CONTINUATION.md',
  'scripts/lib/m108-login-successor-auth-provenance.mjs',
  'scripts/verify-m109-board-ux.mjs',
  '.github/actions/prepare-m108-baseline/action.yml',
]);
// M141: exact, non-mutating Board Import wizard contract additions.
// These are authorized successor additions only; preserve all M108 guards.
const m141ApprovedAdditions = new Map(Object.entries({
  "src/features/boards/contracts/import-wizard.ts": "f126606d8a2b26177d4731130562aa17e0c22823e8ad2ad28017c019fa20405d",
  "src/features/boards/import/board-import-wizard-plan.ts": "9abda2153f22868e3685c994cb2dbc0bae91da42b5ee737cbe15a410c4c366b1",
  "tests/modern/board-import/m141-wizard-plan.verify.mjs": "8fed6c729f89858e34b29edac7b6b903fb063e983150e0072e33e903892e60df",
  "spec/M141-BOARD-IMPORT-WIZARD-CONTRACT-NOT-CERTIFIED.md": "e3d1301ee72ebae8d959c7d718c9543c8209a49a00da47ed362eeaa3538f135e"
}));
for (const [rel, digest] of m141ApprovedAdditions) {
  if (!isApprovedHistoricalOrM14415(rel, digest)) {
    fail(`M141 Board Import source digest mismatch: ${rel}`);
  }
  permittedAdded.add(rel);
}
// M141.2 — accept only the exact successor-aware M108 historical guard.
const m1412ExactHistoricalGuard = 'scripts/verify-stage-i-m108-m107-source-guard.mjs';
if (sha(path.join(repo,m1412ExactHistoricalGuard)) !== '201b0d5864f7487bb4f2f34261e69c6c3801e49918737bc3c675fd4d2fdb9e79') {
  fail('M141.2 historical guard bytes differ from approved delegation');
}
permittedModified.add(m1412ExactHistoricalGuard);
// M142: exact approved three-step wizard extension only.
// Historical M108 predecessor identity and M141.2 delegation remain intact.
const m142ApprovedWizardAdditions = new Map(Object.entries({
  "assets/css/board-import-wizard.css": "3ee1ab4e968421eb98dbd67f8b543d6120a4d3413d440e2abfc4f07d6a34a0e6",
  "assets/js/features/boards/controllers/board-import-wizard-ui.ts": "7fd7b09b9cccd4eb0bc36827d54cc845222e15c3dce676ae486669506c1fce81",
  "spec/M142-WIZARD-IMPLEMENTATION-READINESS-NOT-CERTIFIED.md": "60fdf4b85d3cf1bd10ad08d95fe372f8f21dad85e488fcc3aef05853a53344ad",
  "tests/modern/board-import/m142-wizard-integration.verify.mjs": "74f5b3517910b032571ec50b442f91438a81f5ce933e683778102bab56ae920f"
}));
for (const [rel, digest] of m142ApprovedWizardAdditions) {
  if (!isApprovedHistoricalOrM14415(rel, digest)) fail(`M142 wizard source hash mismatch: ${rel}`);
  permittedAdded.add(rel);
}
// M143 exact source-reviewed wizard approval; predecessor safeguards retained.
const m143ApprovedSource = new Map(Object.entries({
  'assets/js/features/boards/services/board-domain-service.ts': '1f6303fbc8784a4c1158d698fac1b96f6dfb44786fc4c0bee5863eb6b6015dff',
  "assets/js/boards-ui.ts": "86063248c13bd959fcc0d4ca626dfbec82e1b0f5ba1e2e8ccd8ef1142b769739",
  "assets/js/features/boards/controllers/board-import-wizard-ui.ts": "7fd7b09b9cccd4eb0bc36827d54cc845222e15c3dce676ae486669506c1fce81",
  "assets/js/features/boards/data/board-repository.ts": "328808ebf9acc2a6d230c3b07b8be5fff4cdcc0dc1c05e9fccd691eaf7da8464",
  "spec/M143-TRANSACTION-AND-DEPLOYMENT-BOUNDARIES-NOT-CERTIFIED.md": "56454d774a5cb3098aa1bda0b4b867849717e59d0b84ed98eb05fbfaf42a5f0d",
  "src/features/boards/contracts/import-wizard-commit.ts": "8222931e5e97f9f383a7d1ec72c55a43ef28f406efcb5f2434de205f3007f961",
  "src/features/boards/contracts/repository.ts": "41a4a63cb5f47a1982e784ba547b57c31684aeddd51332ef6b19bb6bae7e217e",
  "src/features/boards/import/board-import-wizard-commit.ts": "877cb6cb3aaeec46006a369a2fadee99371af07dcdbd31c4eab2c5799de237e1",
  "src/features/boards/import/board-import-wizard-plan.ts": "9abda2153f22868e3685c994cb2dbc0bae91da42b5ee737cbe15a410c4c366b1",
  "supabase/m143/board_import_wizard_atomic_DRAFT.sql": "b883b3c432ae5ebcadd9fda2f15b5bcdeb0cff9448ace4862c6fb88fd5fd37fc",
  "tests/modern/board-import/m143-contract.verify.mjs": "0f58c83dc169c82d9737b041c2404f64775193056ccd154dfd1edce638a3efa1",
 }));
for (const [rel, expectedSha] of m143ApprovedSource) {
  if (!isApprovedHistoricalOrM14415(rel, expectedSha)) fail(`M143 source hash mismatch: ${rel}`);
  if (["spec/M143-TRANSACTION-AND-DEPLOYMENT-BOUNDARIES-NOT-CERTIFIED.md", "src/features/boards/contracts/import-wizard-commit.ts", "src/features/boards/import/board-import-wizard-commit.ts", "supabase/m143/board_import_wizard_atomic_DRAFT.sql", "tests/modern/board-import/m143-contract.verify.mjs"].includes(rel)) permittedAdded.add(rel);
  else if (!permittedAdded.has(rel)) permittedModified.add(rel);
}
// M143.2 exact isolated PostgreSQL fixture/test-source approval.
const m1432ApprovedSource = new Map(Object.entries({
  "supabase/tests/m143/m1432_atomic_behavior.test.sql": "c9d8b05224989b27a9e8a8f79dd01033f913daa4bd6322333e212c2398584b5b",
  "supabase/tests/m143/m1432_isolated_postgresql_fixture.sql": "4666aeab87dbfdf11fb7c15fdad72fbf95fa4db68cfd19d471504c0d086cd1a2",
}));
for (const [rel, expectedSha] of m1432ApprovedSource) {
  if (sha(path.join(repo, rel)) !== expectedSha) fail(`M143.2 SQL test source mismatch: ${rel}`);
  permittedAdded.add(rel);
}
// M144 exact source-reviewed real-browser acceptance additions and UI hardening.
const m144ApprovedSource = new Map(Object.entries({
  "scripts/run-m144-wizard-browser.mjs": "c2e053bebb6ca8dd391aac58c306b6a61674dcee743785d99bc9128ee29a75dd",
  "spec/M144-BROWSER-ACCEPTANCE-BOUNDARY-NOT-RELEASE-CERTIFIED.md": "0d95514cba353d54d8e62b3d2095d2ee815f1c6e928754724606325cc3bfeaef",
  "tests/modern/e2e/m144-wizard-acceptance.spec.mjs": "847943b7ac5d3f2aee5075771a7b4e2975b4051ce2cf710bc18a88d19dd77417",
  "tests/modern/e2e/m144-wizard-harness.html": "f7fb477a2993e7541d72beefe24898e4be51e6392158d2b9b91c9296fe9c22d8",
  "tests/modern/e2e/m144-wizard-harness.ts": "6bcbb12e588a12cf5f18f44af2dec07bdca7c4e72f4563946a14b295ddd2e21f",
}));
for (const [rel, expectedSha] of m144ApprovedSource) {
  if (sha(path.join(repo, rel)) !== expectedSha) fail(`M144 source SHA256 mismatch: ${rel}`);
  permittedAdded.add(rel);
}
// M144.14 — reconcile the exact M144.4–M144.12 governed successor inventory.
// This is an explicit, SHA-256-pinned and operation-typed extension to M108.
// The original certified archive must still authenticate; unlisted mutations,
// additions, removals, symlinks and different bytes remain rejected.
const m14414ExactModified = new Map(Object.entries({
  "scripts/verify-performance-budgets.mjs": "c03b656615a5bbd6e8eedc8e35df923493c9e8a341226f5bb959286ec12b2d38",
  "verify-stage-g-m38-runtime-configuration-backend-preflight.mjs": "70ccabd7de336a98fb61966c098e0aa68b24dc31ec2d268a4f66d0471c0871eb",
  "verify-stage-g-m46-boards-backend-data-contract-recovery.mjs": "0120bb601f5635e47c8bd86f1fb45adc2c9cb3a78382ddd7e7bdcbaa5def3078",
}));
const m14414ExactAdded = new Map(Object.entries({
  "M144_11-HF1-BOARD-IMPORT-ADAPTIVE-PERFORMANCE-BUDGET.md": "3d9f5ef92e38fefc5a370ec92ab537637ce623b2679162365d0ce86cf45c6934",
  "M144_4-GOVERNANCE-AND-STAGING-BOUNDARIES.md": "90195aefaf001ba5497eda95fae6db66eb0e6f367b64cebc66c7b8d3b8b7d0ad",
  "M144_5-DISPOSABLE-DB-AND-SECURITY-BOUNDARY.md": "8615c7ef22f53c65a58f1e84e5f70e814340bc90d702cb05dc33071f9c643f27",
  "M144_6-STAGING-READINESS-BOUNDARY.md": "1a7a99c1cde3f6241d76532531dd4b041522a8ac962ab1702f41b0253dab7108",
  "M144_7-DEPLOYMENT-READINESS-BOUNDARY.md": "f145366b7e89abc7fffad706a5e0e743f27f2a69aa9af0dd7487d6bc2ccef95a",
  "scripts/m14410_minimal_patch.py": "ae62a0967e7a69d4c2f4b546fb3476be9161b952ef0a687e820224df94d058fa",
  "scripts/m1444_source_governance.py": "1f48bd8a55e677702761c4708872f491f53f752b54e24f73746dfda8746da33c",
  "scripts/m1445_disposable_pg_qa.sh": "5ce1cd312f56396c5a2e4d2d1e0fbc22ac442d9936e6d77ea2f01ae24b4e2614",
  "scripts/m1445_source_governance.py": "646e8eacb217a08b9fd120176b070310e6c05081543f71bbef1729733c42cfd8",
  "scripts/m1446_source_governance.py": "57724d761c94dfc518c56b76e483dda9e9258f374ac4faf49ee743c863e52986",
  "scripts/m1446_staging_readiness.py": "f428a8cb09a5263bb5a8b6077a564f937cfc33996ec53568cd8475e785cf37a2",
  "scripts/m1447_deployment_gate.py": "96eb005b0d7bf4fd5e5122cafc97fdb702f1babd61f2ecc2da10954ca1420c88",
  "scripts/m1448_hosted_parity_gate.py": "871f5e5f79e2a1e25c5f7a57738c720a1ab0d969d607828459ca44e3751d3ae9",
  "scripts/m1449_branch_reconcile.py": "3bfe1bf796c2235d20dbb8bf2832fc28cf0c5233c608720f4c4f4c14691e9745",
  "spec/M144_10-MINIMAL-BRANCH-PATCH-REVIEW.md": "133357fc2c3325e565618c8b4e20c169d7168e15bb1d3b4a3d3667c8dc8814db",
  "spec/M144_10-PINNED-PATCH.json": "b6ff9c7d80c021312d807922846442ec0b370dd4cdab4e906c09ace884d9f3ef",
  "spec/M144_12-M78-BOARD-WIZARD-SUCCESSOR-BOUNDARY.md": "3444bf8d1163630c6b3001a73690d43d2997d746f22c495c498c9df30b03c942",
  "spec/M144_8-HOSTED-OBSERVATION.json": "ab5d3b169fe9c915d6b86febcfa38747c6f079837450e20f14236ad58f46c6c2",
  "spec/M144_8-SHARED-SUPABASE-GITHUB-BOUNDARY.md": "f7bde04065f295781773bca144fd539d42b0909f9b0c8cd0e663071e2be55473",
  "spec/M144_9-GITHUB-BRANCH-SNAPSHOT.json": "5fc92e435b6d6a015f0e55c8fa3665a32058cfcf94205353247a63190333c500",
  "spec/M144_9-TEST-BRANCH-RECONCILIATION-BOUNDARY.md": "6b98cb52acd835db112a6d74b1124e20c1d29963be6ce1419e0f4a8a839d7aac",
  "supabase/m1446/staging_catalog_READ_ONLY.sql": "afb1c3aff769a3887f3a75d36d82e05a48c83e783615b69b0decd44c1658e6a2",
  "supabase/m1448/wizard_rpc_catalog_READ_ONLY.sql": "14b61d234d4d7d0ba66f5292c9260199c1093a7b67b13d285e0de556ea91f289",
  "tests/modern/board-import/m14410-minimal-patch.verify.py": "c951793d4b9379921795b94e8f84134c99cc22625f9b1b1be6f07cdeb28f0e51",
  "tests/modern/board-import/m14412-m78-guard.verify.py": "90a420ecc6a3631e36fb1a058ec67a7869e1ec7bfe5a010b997f82202ffbc1a0",
  "tests/modern/board-import/m1449-reconcile.verify.py": "25cb204bd38b60d1e63f621e0739b9c7d51a416b662c516490a26bb5f1376bdf",
}));
for (const [rel, digest] of m14414ExactModified) {
  const file = path.join(repo, rel);
  if (!fs.existsSync(file) || sha(file) !== digest) fail(`M144.14 modified successor SHA256 mismatch: ${rel}`);
  if (permittedAdded.has(rel)) fail(`M144.14 invalid modified classification: ${rel}`);
  permittedModified.add(rel);
}
for (const [rel, digest] of m14414ExactAdded) {
  const file = path.join(repo, rel);
  if (!fs.existsSync(file) || sha(file) !== digest) fail(`M144.14 added successor SHA256 mismatch: ${rel}`);
  if (permittedModified.has(rel)) fail(`M144.14 invalid added classification: ${rel}`);
  permittedAdded.add(rel);
}
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'm108-pinned-baseline-'));
try {
  execFileSync('unzip', ['-q', archive, '-d', temp], { stdio: 'pipe' });
  const base = path.join(temp, rootName);
  if (!fs.statSync(base).isDirectory()) fail('archive repository root missing');
  const oldFiles = inventory(base);
  const newFiles = inventory(repo);
  const errors = [];
  for (const [f, digest] of oldFiles) {
    if (!newFiles.has(f)) errors.push(`REMOVED ${f}`);
    else if (newFiles.get(f) !== digest && !permittedModified.has(f)) errors.push(`MODIFIED ${f}`);
  }
  for (const f of newFiles.keys()) if (!oldFiles.has(f) && !permittedAdded.has(f)) errors.push(`ADDED ${f}`);
  for (const f of permittedModified) if (oldFiles.get(f) === newFiles.get(f)) errors.push(`CORRECTION MISSING ${f}`);
  for (const f of permittedAdded) if (!newFiles.has(f)) errors.push(`SUCCESSOR FILE MISSING ${f}`);
  if (errors.length) fail(`unexpected source delta:\n${errors.join('\n')}`);
  console.log(`PASS: M108 successor baseline ZIP sha256=${archiveSha}; baseline files=${oldFiles.size}; authorized modifications=${permittedModified.size}; additions=${permittedAdded.size}`);
  console.log(`PASS: Approved login corrective sha256=${expected.get('assets/js/core/auth.ts')}`);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
