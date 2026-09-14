import path from 'node:path';
import { verifyInstalledLockfileTree } from './lib/lockfile-install-verifier.mjs';
import { verifyModernTestToolchain } from './lib/modern-test-toolchain.mjs';

const root = path.resolve(import.meta.dirname, '..');
const lockfile = verifyInstalledLockfileTree(root, { allowExtraneous: true });
const toolchain = verifyModernTestToolchain(root);
const issues = [...lockfile.issues, ...toolchain.issues];
if (issues.length) throw new Error(`M42 certification dependency tree verification failed:\n- ${issues.join('\n- ')}`);
console.log(`M42 certification dependency tree: PASS (${lockfile.checked} lockfile packages; governed modern test toolchain=${toolchain.checked}/${toolchain.expected})`);
