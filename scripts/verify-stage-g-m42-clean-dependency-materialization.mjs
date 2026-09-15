import assert from 'node:assert/strict';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const sandbox = mkdtempSync(join(tmpdir(), 'wm-m42-clean-deps-'));
try {
  const project = join(sandbox, 'project');
  const scripts = join(project, 'scripts');
  const lib = join(scripts, 'lib');
  const bin = join(sandbox, 'bin');
  mkdirSync(lib, { recursive: true });
  mkdirSync(bin, { recursive: true });
  cpSync(join(root, 'scripts/ensure-project-dependencies.mjs'), join(scripts, 'ensure-project-dependencies.mjs'));
  cpSync(join(root, 'scripts/lib/lockfile-install-verifier.mjs'), join(lib, 'lockfile-install-verifier.mjs'));
  cpSync(join(root, 'scripts/lib/npm-offline-lockfile-probe.mjs'), join(lib, 'npm-offline-lockfile-probe.mjs'));
  cpSync(join(root, 'scripts/lib/modern-test-toolchain.mjs'), join(lib, 'modern-test-toolchain.mjs'));
  cpSync(join(root, 'scripts/lib/stage-g-m42-dependency-tree.mjs'), join(lib, 'stage-g-m42-dependency-tree.mjs'));

  const packageJson = {
    name: 'm42-clean-dependency-fixture',
    version: '1.0.0',
    private: true,
    packageManager: 'npm@10.9.2',
    devDependencies: { typescript: '1.0.0', vite: '1.0.0' },
  };
  const packageLock = {
    name: packageJson.name,
    version: packageJson.version,
    lockfileVersion: 3,
    requires: true,
    packages: {
      '': { name: packageJson.name, version: packageJson.version, devDependencies: packageJson.devDependencies },
      'node_modules/typescript': { version: '1.0.0', dev: true },
      'node_modules/vite': { version: '1.0.0', dev: true },
    },
  };
  writeFileSync(join(project, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
  writeFileSync(join(project, 'package-lock.json'), `${JSON.stringify(packageLock, null, 2)}\n`);
  for (const [name, version] of [['typescript', '1.0.0'], ['vite', '1.0.0']]) {
    const dir = join(project, 'node_modules', name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'package.json'), `${JSON.stringify({ name, version })}\n`);
  }
  const binDir = join(project, 'node_modules', '.bin');
  mkdirSync(binDir, { recursive: true });
  writeFileSync(join(binDir, 'tsc'), '#!/bin/sh\nexit 0\n');
  writeFileSync(join(binDir, 'vite'), '#!/bin/sh\nexit 0\n');

  const log = join(sandbox, 'npm.log');
  const npm = join(bin, 'npm');
  writeFileSync(npm, `#!/bin/sh\nif [ "${'$'}1" = "--version" ]; then printf '%s\\n' '10.9.2'; exit 0; fi\nprintf '%s\\n' "${'$'}*" >> "${log}"\nexit 0\n`);
  chmodSync(npm, 0o755);
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH || ''}` };
  const certificationOnlyEnvironment = [
    'M42_SOURCE_DIGEST',
    'M42_DEPENDENCY_DIGEST',
    'WM_M42_PRESERVE_GOVERNED_TEST_TOOLCHAIN',
    'WM_M42_CERTIFICATION_DEPENDENCY_DIGEST',
  ];
  for (const key of certificationOnlyEnvironment) delete env[key];
  for (const key of certificationOnlyEnvironment) {
    assert.equal(env[key], undefined, `${key} must not leak from the owning certification transaction into the synthetic dependency fixture`);
  }

  const ordinary = spawnSync(process.execPath, ['scripts/ensure-project-dependencies.mjs'], { cwd: project, encoding: 'utf8', env });
  assert.equal(ordinary.status, 0, ordinary.stderr || 'ordinary dependency ensure should accept the exact installed metadata tree');
  assert.equal(existsSync(log) ? readFileSync(log, 'utf8') : '', '', 'ordinary dependency ensure should not reinstall an already exact metadata tree');

  const forced = spawnSync(process.execPath, ['scripts/ensure-project-dependencies.mjs', '--force-clean'], { cwd: project, encoding: 'utf8', env });
  assert.equal(forced.status, 0, forced.stderr || 'forced certification dependency materialization should succeed');
  const calls = readFileSync(log, 'utf8').trim().split(/\n+/).filter(Boolean);
  assert.equal(calls.length, 2, 'forced certification dependency materialization must execute an offline probe and the real clean npm ci');
  assert.ok(calls.every((call) => call.startsWith('ci --ignore-scripts --offline')), 'both forced npm ci operations must use the verified offline path in this fixture');
  assert.match(forced.stdout, /clean npm ci materialization required/i, 'forced path must report that clean materialization is mandatory');

  console.log('Stage G M42 clean dependency materialization verification: PASS (metadata-only reuse is allowed for ordinary ensure; release certification always performs clean npm ci)');
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
