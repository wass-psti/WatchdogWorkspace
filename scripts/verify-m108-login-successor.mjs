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
  'scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs': '942b332caedbd87fbd2332475d979d8350edba0c40c315b4b9afa1c1f46bf487',
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
  'assets/js/boards-ui.ts': '2afada75df7439ffb0d8b383f83a896cb6357fcf389f38738c4512e34ad2cce5',
  'assets/css/app.css': 'a67330e1eb590f01e1e3c3ce7632464dbb54ffa4d503687d2d97c4741ba79488',
  'assets/css/boards-monday.css': 'dfc0560f8d14dc19d3291291514a098b0ae8bbdaab413d4b4eae0f2cccb37dcd',
  'scripts/verify-m109-board-ux.mjs': '147375ee0eec195cc5a17c5135ade806143d2e2b88f49db97dd92e0d465389f3',
  // Successor shell runner and documentation hashes are filled on implementation.
  'scripts/certify-m108-login-successor-local.sh': '381fa4adf50e07dd8f6d4966824c15a9ecf2ca0b970bbab6e82cf514d95a38bc',
  'scripts/test-m108-login-successor.mjs': '266e9b3dbb8a5790a80c21ef6dd5b42c9155e54c3de0d17907083865884f4ef6',
  'M108-LOGIN-SUCCESSOR-CONTINUATION.md': '357a7d5a3cae9de9376780fd55f63bfac033f71f942cb4a66d1bf424e02ebf5b',
}));
for (const [rel, want] of expected) {
  const file = path.join(repo, rel);
  if (!fs.existsSync(file) || sha(file) !== want) fail(`unapproved bytes or missing file: ${rel}`);
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
