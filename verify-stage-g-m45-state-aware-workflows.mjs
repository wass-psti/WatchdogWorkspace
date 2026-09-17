import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), 'utf8');
const checks = [];
const check = (condition, label) => {
  if (!condition) throw new Error(`M45 state-aware workflow verification failed: ${label}`);
  checks.push(label);
};

const milestones = [
  {
    id: 'M43',
    workflow: '.github/workflows/settings-functional-recovery.yml',
    target: 'config/stage-g-m43-settings-functional-recovery-target.ts',
    regressionScript: 'npm run settings-recovery:verify:release',
    certifyScript: 'npm run settings-recovery:certify',
    sourceEnv: 'M43_SOURCE_COMMIT: ${{ github.sha }}',
    expectedEnv: 'M43_EXPECTED_SOURCE_COMMIT: ${{ github.sha }}',
    artifactPrefix: 'work-management-v1.43.2-stage-g-m43-certified-${{ github.sha }}',
    outDir: 'm43-certified-artifacts-upload/',
  },
  {
    id: 'M44',
    workflow: '.github/workflows/management-authority-consolidation.yml',
    target: 'config/stage-g-m44-management-authority-consolidation-target.ts',
    regressionScript: 'npm run management-authority:verify:release',
    certifyScript: 'npm run management-authority:certify',
    sourceEnv: 'M44_SOURCE_COMMIT: ${{ github.sha }}',
    expectedEnv: 'M44_EXPECTED_SOURCE_COMMIT: ${{ github.sha }}',
    artifactPrefix: 'work-management-v1.43.2-stage-g-m44-certified-${{ github.sha }}',
    outDir: 'm44-certified-artifacts-upload/',
  },
  {
    id: 'M45',
    workflow: '.github/workflows/boards-collection-route-recovery.yml',
    target: 'config/stage-g-m45-boards-collection-route-recovery-target.ts',
    regressionScript: 'npm run boards-collection:verify:release',
    certifyScript: 'npm run boards-collection:certify',
    sourceEnv: 'M45_SOURCE_COMMIT: ${{ github.sha }}',
    expectedEnv: 'M45_EXPECTED_SOURCE_COMMIT: ${{ github.sha }}',
    artifactPrefix: 'work-management-v1.43.2-stage-g-m45-certified-${{ github.sha }}',
    outDir: 'm45-certified-artifacts-upload/',
  },
];

for (const milestone of milestones) {
  const source = read(milestone.workflow);
  const target = read(milestone.target);

  check(source.includes('push:') && source.includes('pull_request:'), `${milestone.id} workflow retains push and pull-request triggers`);
  check(source.includes('permissions:\n  contents: read'), `${milestone.id} workflow keeps read-only repository permission`);
  check(source.includes('node-version: 22.16.0'), `${milestone.id} workflow uses governed Node 22.16.0`);
  check(source.includes('npm ci --ignore-scripts'), `${milestone.id} workflow materializes the lockfile dependency tree`);
  check(source.includes('npm run modern-tests:toolchain:ensure'), `${milestone.id} workflow materializes the modern test toolchain`);
  check(source.includes('id: milestone_state'), `${milestone.id} workflow resolves milestone state explicitly`);
  check(source.includes("state=active-certified") && source.includes("state=pending"), `${milestone.id} workflow recognizes active-certified and pending states`);
  check(source.includes("steps.milestone_state.outputs.state == 'active-certified'"), `${milestone.id} active-certified push is routed to regression-only verification`);
  check(source.includes("steps.milestone_state.outputs.state == 'pending'"), `${milestone.id} pending push is routed to certification`);
  check(source.includes("github.event_name == 'pull_request'"), `${milestone.id} pull requests remain non-publishing verification runs`);
  check(source.includes(milestone.regressionScript), `${milestone.id} regression path calls the release verifier`);
  check(source.includes(milestone.certifyScript), `${milestone.id} pending path calls the fail-closed certifier`);
  check(source.includes(milestone.sourceEnv), `${milestone.id} certification is bound to github.sha`);
  check(source.includes(milestone.expectedEnv), `${milestone.id} independent artifact verification is bound to github.sha`);
  check(source.includes(milestone.artifactPrefix), `${milestone.id} uploaded artifact name includes the exact source SHA`);
  check(source.includes(milestone.outDir), `${milestone.id} workflow publishes only its milestone-specific staged artifact directory`);
  check(source.includes('if-no-files-found: error'), `${milestone.id} artifact publication fails closed when outputs are missing`);
  check(!source.includes('continue-on-error:'), `${milestone.id} workflow has no continue-on-error bypass`);
  check(target.includes("activationState: 'active-certified'") || target.includes("activationState: 'implementation-complete-pending-certification'"), `${milestone.id} target exposes a recognized workflow state`);
}

const m43 = read('.github/workflows/settings-functional-recovery.yml');
const m44 = read('.github/workflows/management-authority-consolidation.yml');
const m45 = read('.github/workflows/boards-collection-route-recovery.yml');

check(!m43.includes('if: ${{ github.event_name == \'push\' }}\n        env:\n          M43_SOURCE_COMMIT'), 'M43 no longer certifies every push unconditionally');
check(!m44.includes('if: ${{ github.event_name == \'push\' }}\n        env:\n          M44_SOURCE_COMMIT'), 'M44 no longer certifies every push unconditionally');
check(m45.includes("github.event_name == 'push' && steps.milestone_state.outputs.state == 'pending'"), 'M45 publishes only from a pending milestone push');

console.log(`Stage G M45 state-aware workflow verification: PASS (${checks.length} checks)`);
