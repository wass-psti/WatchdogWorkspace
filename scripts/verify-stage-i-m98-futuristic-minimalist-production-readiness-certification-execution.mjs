import {spawnSync} from 'node:child_process';
import process from 'node:process';

const gates = [
  ['scripts/verify-m108-login-successor.mjs'],
  ['verify-stage-h-m77-final-ui-production-certification.mjs'],
  ['scripts/verify-stage-h-m77-final-ui-production-certification-execution.mjs'],
  ['verify-stage-i-m78-visual-system-foundation.mjs'],
  ['scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs'],
  ['verify-stage-i-m97-workspace-wide-visual-regression-functional-preservation.mjs'],
  ['scripts/verify-stage-i-m97-workspace-wide-visual-regression-functional-preservation-execution.mjs'],
  ['verify-stage-g-m37-functional-regression-baseline.mjs'],
  ['scripts/verify-functional-regression-baseline-execution.mjs'],
  ['verify-stage-g-m52-cross-module-rbac-authenticated-e2e-certification.mjs'],
  ['verify-stage-e-m23-timetracker-stabilization.mjs'],
  ['verify-stage-e-m24-fueltrack-stabilization.mjs'],
  ['verify-stage-e-m25-tradelink-stabilization.mjs'],
];
for (const args of gates) {
  const result = spawnSync(process.execPath, args, {stdio: 'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('M98 deterministic production-readiness verification: PASS (M77 presentation authority + M78 foundation + M97 workspace preservation + functional/RBAC/module contracts)');
