import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { MODERN_TEST_TOOLCHAIN, EXPECTED_JSDOM_NODE_ENGINE, verifyModernTestToolchain } from './lib/modern-test-toolchain.mjs';
import { verifyInstalledLockfileTree } from './lib/lockfile-install-verifier.mjs';
import { computeM42DependencyTreeDigest } from './lib/stage-g-m42-dependency-tree.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-m42-toolchain-preserve-'));
const assert = (value, message) => { if (!value) throw new Error(message); };
const writeJson = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); };

try {
  const scriptsDir = path.join(temp, 'scripts');
  const libDir = path.join(scriptsDir, 'lib');
  fs.mkdirSync(libDir, { recursive: true });
  for (const rel of [
    'scripts/ensure-project-dependencies.mjs',
    'scripts/lib/lockfile-install-verifier.mjs',
    'scripts/lib/npm-offline-lockfile-probe.mjs',
    'scripts/lib/modern-test-toolchain.mjs',
    'scripts/lib/stage-g-m42-dependency-tree.mjs',
  ]) {
    const target = path.join(temp, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, rel), target);
  }

  writeJson(path.join(temp, 'package.json'), { name: 'm42-toolchain-fixture', version: '1.0.0', packageManager: 'npm@10.9.2' });
  writeJson(path.join(temp, 'package-lock.json'), {
    name: 'm42-toolchain-fixture', version: '1.0.0', lockfileVersion: 3, requires: true,
    packages: { '': { name: 'm42-toolchain-fixture', version: '1.0.0' } },
  });
  fs.mkdirSync(path.join(temp, 'node_modules', '.bin'), { recursive: true });
  for (const binary of ['tsc', 'vite']) fs.writeFileSync(path.join(temp, 'node_modules', '.bin', binary), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  for (const [name, version] of Object.entries(MODERN_TEST_TOOLCHAIN)) {
    const metadata = { name, version };
    if (name === 'jsdom') metadata.engines = { node: EXPECTED_JSDOM_NODE_ENGINE };
    writeJson(path.join(temp, 'node_modules', ...name.split('/'), 'package.json'), metadata);
  }
  writeJson(path.join(temp, 'node_modules', 'toolchain-transitive-fixture', 'package.json'), { name: 'toolchain-transitive-fixture', version: '1.0.0' });

  const strict = verifyInstalledLockfileTree(temp);
  assert(!strict.ok && strict.issues.some((issue) => issue.includes('is extraneous to package-lock.json')), 'strict dependency verification must reject governed-toolchain extras by default');
  const certification = verifyInstalledLockfileTree(temp, { allowExtraneous: true });
  assert(certification.ok, `certification dependency verification should preserve extras while requiring lockfile packages: ${certification.issues.join('; ')}`);
  const tools = verifyModernTestToolchain(temp);
  assert(tools.ok && tools.checked === tools.expected, `governed modern test toolchain fixture must verify: ${tools.issues.join('; ')}`);

  const capturedDigest = computeM42DependencyTreeDigest(temp).digest;
  const result = spawnSync(process.execPath, ['scripts/ensure-project-dependencies.mjs'], {
    cwd: temp,
    encoding: 'utf8',
    shell: false,
    env: { ...process.env, WM_M42_PRESERVE_GOVERNED_TEST_TOOLCHAIN: '1', WM_M42_CERTIFICATION_DEPENDENCY_DIGEST: capturedDigest },
  });
  assert(!result.error && result.status === 0, `governed dependency preservation should pass without reinstalling: ${result.stderr || result.stdout || result.error?.message}`);
  assert(result.stdout.includes('governed modern test toolchain=8/8'), 'governed dependency preservation must verify the exact modern test toolchain');
  assert(fs.existsSync(path.join(temp, 'node_modules', 'toolchain-transitive-fixture', 'package.json')), 'governed dependency preservation must not clean the captured test-toolchain extension');

  const activation = fs.readFileSync(path.join(root, 'scripts/activate-stage-g-m42.mjs'), 'utf8');
  assert(activation.indexOf("run('modern-tests:toolchain:ensure')") < activation.indexOf('const certifiedDependencies = dependencyTree()'), 'M42 activation must materialize governed test tooling before capturing dependency evidence');
  assert(activation.indexOf('WM_M42_PRESERVE_GOVERNED_TEST_TOOLCHAIN') < activation.indexOf('runReleasePreActivationEvidenceGates()'), 'M42 activation must preserve the governed test-toolchain extension before evidence gates begin');
  assert(activation.includes('WM_M42_CERTIFICATION_DEPENDENCY_DIGEST = certifiedDependencies.digest'), 'M42 activation must bind nested dependency checks to the captured certification dependency digest');

  const workflow = fs.readFileSync(path.join(root, '.github/workflows/users-rbac-functional-recovery.yml'), 'utf8');
  assert(workflow.indexOf('npm run modern-tests:toolchain:ensure') < workflow.indexOf('M42_DEPENDENCY_DIGEST='), 'M42 CI must install governed test tooling before capturing dependency evidence');
  assert(workflow.includes('WM_M42_PRESERVE_GOVERNED_TEST_TOOLCHAIN=1'), 'M42 CI must preserve the governed toolchain across dependency checks');
  assert(workflow.includes('WM_M42_CERTIFICATION_DEPENDENCY_DIGEST='), 'M42 CI must bind nested dependency checks to its captured dependency digest');

  console.log('Stage G M42 governed modern test-toolchain preservation regression: PASS');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
