import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const coverage = process.argv.includes('--coverage');
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const beforePackage = hash('package.json');
const beforeLock = hash('package-lock.json');

const run = (command, args, label) => {
  console.log(`\n================ ${label} ================`);
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}.`);
};

run(process.execPath, ['scripts/ensure-modern-test-toolchain.mjs'], 'Ensure exact isolated modern test toolchain');
const vitest = path.join(root, 'node_modules', '.bin', 'vitest');
if (!fs.existsSync(vitest)) throw new Error('Vitest binary is unavailable after toolchain bootstrap.');
const args = ['run', '--config', 'vitest.config.mjs'];
if (coverage) args.push('--coverage');
run(vitest, args, coverage ? 'Run modern test suite with V8 coverage gate' : 'Run modern test suite');

if (hash('package.json') !== beforePackage) throw new Error('Modern test execution modified package.json.');
if (hash('package-lock.json') !== beforeLock) throw new Error('Modern test execution modified package-lock.json.');
console.log(`\nStage F M30 modern testing execution: PASS (${coverage ? 'coverage-enforced' : 'test-only'}; application lockfile preserved)`);
