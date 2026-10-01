import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const requireCertified = process.argv.includes('--require-certified');
const failures = [];
const run = (args, label) => {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) failures.push(`${label} failed: ${(result.stderr || result.stdout).trim()}`);
};
run(['verify-stage-i-m78-visual-system-foundation.mjs'], 'M78 static verification');
run(['scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs'], 'M78 deterministic verification');

const state = fs.readFileSync(path.join(root, 'M78-CONTINUATION-STATE.md'), 'utf8');
const target = fs.readFileSync(path.join(root, 'config/stage-i-m78-futuristic-minimalist-foundation-target.ts'), 'utf8');
if (!target.includes('visualRuntimeMutationAllowed: false')) failures.push('M78 final checkpoint lost no-visual-mutation guard');
if (requireCertified) {
  run(['scripts/verify-stage-i-m78-certified-state.mjs', root], 'M78 certified-state verification');
  run(['scripts/verify-stage-i-m78-certified-artifact.mjs'], 'M78 certified-artifact verification');
  run(['scripts/verify-stage-i-m78-certified-package-hygiene.mjs'], 'M78 package-hygiene verification');
} else if (!state.includes('IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS') && !state.includes('FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE')) {
  failures.push('M78 continuation state is neither pending certification nor fully certified');
}

if (failures.length) {
  console.error('M78 final checkpoint verification FAILED');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log(`M78 final checkpoint verification: PASS (${requireCertified ? 'certified' : 'implementation checkpoint'})`);
