import path from 'node:path';
import { verifyInstalledLockfileTree } from './lib/lockfile-install-verifier.mjs';
import { verifyModernTestToolchain, verifyModernTestToolchainIsolation } from './lib/modern-test-toolchain.mjs';

const root = path.resolve(import.meta.dirname, '..');
const lockfile = verifyInstalledLockfileTree(root, { allowExtraneous: true });
const toolchain = verifyModernTestToolchain(root);
const isolation = verifyModernTestToolchainIsolation(root);
const issues = [...lockfile.issues, ...toolchain.issues, ...isolation.issues];
if (issues.length) throw new Error(`M42 certification dependency tree verification failed:\n- ${issues.join('\n- ')}`);
console.log(`M42 certification dependency tree: PASS (${lockfile.checked} lockfile packages; governed modern test toolchain=${toolchain.checked}/${toolchain.expected}; isolated bootstrap=true)`);
