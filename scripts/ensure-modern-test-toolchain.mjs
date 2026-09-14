import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  EXPECTED_JSDOM_NODE_ENGINE,
  modernTestToolchainInstallSpecs,
  verifyModernTestToolchain,
} from './lib/modern-test-toolchain.mjs';

const root = path.resolve(import.meta.dirname, '..');
const before = verifyModernTestToolchain(root);
if (before.ok) {
  console.log(`Modern test toolchain preflight: PASS (${before.checked} exact tools available; jsdom engines=${EXPECTED_JSDOM_NODE_ENGINE})`);
  process.exit(0);
}

console.log('Modern test toolchain preflight: bootstrap required');
for (const issue of before.issues) console.log(`- ${issue}`);

const args = [
  'install',
  '--no-save',
  '--package-lock=false',
  '--ignore-scripts',
  '--no-audit',
  '--no-fund',
  ...modernTestToolchainInstallSpecs(),
];
const result = spawnSync('npm', args, { cwd: root, stdio: 'inherit', shell: false });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`Modern test toolchain bootstrap failed with exit code ${result.status ?? 'unknown'}.`);

const after = verifyModernTestToolchain(root);
if (!after.ok) {
  throw new Error(`Modern test toolchain verification failed:\n- ${after.issues.join('\n- ')}`);
}
console.log(`Modern test toolchain bootstrap: PASS (${after.checked} exact tools installed; jsdom engines=${EXPECTED_JSDOM_NODE_ENGINE}; package.json/package-lock.json unchanged by bootstrap)`);
