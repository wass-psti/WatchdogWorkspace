import path from 'node:path';
import { verifyInstalledLockfileTree } from './lib/lockfile-install-verifier.mjs';
const root = path.resolve(import.meta.dirname, '..');
const result = verifyInstalledLockfileTree(root);
if (!result.ok) {
  console.error(`Installed dependency tree verification: FAIL (${result.issues.length} issue(s))`);
  for (const issue of result.issues.slice(0, 50)) console.error(`- ${issue}`);
  if (result.issues.length > 50) console.error(`- ... ${result.issues.length - 50} additional issue(s)`);
  process.exit(1);
}
console.log(`Installed dependency tree verification: PASS (${result.checked} lockfile packages verified${result.optionalSkipped ? `; ${result.optionalSkipped} optional package(s) legitimately absent` : ''})`);
