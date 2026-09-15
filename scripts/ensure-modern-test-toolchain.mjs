import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { verifyInstalledLockfileTree } from './lib/lockfile-install-verifier.mjs';
import {
  EXPECTED_JSDOM_NODE_ENGINE,
  materializeModernTestToolchain,
  MODERN_TEST_TOOLCHAIN_WORKSPACE,
  verifyModernTestToolchain,
  verifyModernTestToolchainIsolation,
} from './lib/modern-test-toolchain.mjs';

const root = path.resolve(import.meta.dirname, '..');
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const beforePackage = hash('package.json');
const beforeLock = hash('package-lock.json');
const before = verifyModernTestToolchain(root);
const beforeIsolation = verifyModernTestToolchainIsolation(root);
if (before.ok && beforeIsolation.ok) {
  console.log(`Modern test toolchain preflight: PASS (${before.checked} exact tools available from isolated ${MODERN_TEST_TOOLCHAIN_WORKSPACE}; jsdom engines=${EXPECTED_JSDOM_NODE_ENGINE})`);
  process.exit(0);
}

console.log('Modern test toolchain preflight: bootstrap required');
for (const issue of [...before.issues, ...beforeIsolation.issues]) console.log(`- ${issue}`);

const applicationTree = verifyInstalledLockfileTree(root);
if (!applicationTree.ok) {
  throw new Error(`Modern test-toolchain bootstrap requires an exact application npm-ci baseline and refuses to repair application dependency drift:\n- ${applicationTree.issues.join('\n- ')}`);
}

// The isolated bootstrap intentionally retains the M30 no-save/package-lock policy.
// npm install --no-save --package-lock=false --ignore-scripts runs in a disposable
// OS-temporary staging workspace outside the application tree, then the verified
// workspace is transactionally published under node_modules/.wm-modern-test-toolchain.
// This avoids npm Arborist treating the application node_modules tree as an ancestor
// install graph while still keeping the governed toolchain isolated from package.json
// and package-lock.json.
const result = materializeModernTestToolchain(root);
if (!result.ok) {
  throw new Error(`Modern test toolchain bootstrap failed${result.status == null ? '' : ` with exit code ${result.status}`}:${result.output ? `\n${result.output}` : ''}`);
}

if (hash('package.json') !== beforePackage) throw new Error('Modern test-toolchain bootstrap modified package.json.');
if (hash('package-lock.json') !== beforeLock) throw new Error('Modern test-toolchain bootstrap modified package-lock.json.');

const applicationAfter = verifyInstalledLockfileTree(root, { allowExtraneous: true });
if (!applicationAfter.ok) {
  throw new Error(`Modern test-toolchain bootstrap changed the lockfile-governed application dependency tree:\n- ${applicationAfter.issues.join('\n- ')}`);
}
const after = verifyModernTestToolchain(root);
const isolation = verifyModernTestToolchainIsolation(root);
if (!after.ok || !isolation.ok) {
  throw new Error(`Modern test toolchain verification failed:\n- ${[...after.issues, ...isolation.issues].join('\n- ')}`);
}
console.log(`Modern test toolchain bootstrap: PASS (${after.checked} exact tools installed in isolated ${MODERN_TEST_TOOLCHAIN_WORKSPACE}; application lockfile tree preserved; jsdom engines=${EXPECTED_JSDOM_NODE_ENGINE}; package.json/package-lock.json unchanged by bootstrap)`);
