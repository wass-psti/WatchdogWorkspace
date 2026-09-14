import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const release = process.argv.includes('--release');
const file = new URL('../config/stage-f-m33-service-worker-update-strategy-target.ts', import.meta.url);
const prerequisite = new URL('../config/stage-f-m32-observability-target.ts', import.meta.url);
const original = await readFile(file, 'utf8');
const prerequisiteSource = await readFile(prerequisite, 'utf8');
if (!prerequisiteSource.includes("activationState: 'active-certified'")) throw new Error('M33 requires M32 active-certified.');
const run = (cmd, args = []) => { const result = spawnSync(cmd, args, { stdio: 'inherit' }); if (result.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed`); };
try {
  let source = original.replace("activationState: 'implementation-complete-pending-certification'", "activationState: 'active-pending-release-certification'");
  await writeFile(file, source);
  run('node', ['verify-stage-f-m33-service-worker-update-strategy.mjs']);
  run('node', ['--experimental-strip-types', 'scripts/verify-service-worker-update-execution.mjs']);
  if (release) {
    run('npm', ['run', 'observability:test']);
    run('npm', ['run', 'performance:bench']);
    run('npm', ['run', 'modern-tests:coverage']);
    run('npm', ['run', 'modern-tests:e2e']);
    run('npm', ['run', 'lint:eslint']);
    run('npm', ['run', 'typecheck']);
    run('npm', ['run', 'build']);
    run('npm', ['run', 'performance:bundle']);
    run('npm', ['run', 'service-worker-update:dist']);
    run('npm', ['run', 'verify:preview']);
    run('npm', ['run', 'audit:ci']);
  }
  source = source.replace("activationState: 'active-pending-release-certification'", "activationState: 'active-certified'");
  await writeFile(file, source);
  run('node', ['verify-stage-f-m33-service-worker-update-strategy.mjs']);
  console.log('Stage F M33 activation: PASS');
} catch (error) {
  await writeFile(file, original);
  throw error;
}
