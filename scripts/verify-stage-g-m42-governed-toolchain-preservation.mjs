import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  MODERN_TEST_TOOLCHAIN,
  EXPECTED_JSDOM_NODE_ENGINE,
  MODERN_TEST_TOOLCHAIN_WORKSPACE,
  verifyModernTestToolchain,
  verifyModernTestToolchainIsolation,
} from './lib/modern-test-toolchain.mjs';
import { verifyInstalledLockfileTree } from './lib/lockfile-install-verifier.mjs';
import { computeM42DependencyTreeDigest } from './lib/stage-g-m42-dependency-tree.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assert = (value, message) => { if (!value) throw new Error(message); };
const writeJson = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); };
const copy = (fromRoot, toRoot, rel) => {
  const target = path.join(toRoot, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(fromRoot, rel), target);
};
const relativeLink = (source, destination, type = 'file') => {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.symlinkSync(path.relative(path.dirname(destination), source), destination, process.platform === 'win32' && type === 'dir' ? 'junction' : type);
};

function fixtureApplication(project) {
  const packageJson = {
    name: 'm42-toolchain-fixture',
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
  writeJson(path.join(project, 'package.json'), packageJson);
  writeJson(path.join(project, 'package-lock.json'), packageLock);
  for (const [name, version] of [['typescript', '1.0.0'], ['vite', '1.0.0']]) {
    writeJson(path.join(project, 'node_modules', name, 'package.json'), { name, version, fixture: 'application-lockfile-authority' });
  }
  const binDir = path.join(project, 'node_modules', '.bin');
  fs.mkdirSync(binDir, { recursive: true });
  for (const binary of ['tsc', 'vite']) fs.writeFileSync(path.join(binDir, binary), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
}

function writeFakeNpm(binDir, logFile, project) {
  const executable = path.join(binDir, 'npm');
  const source = `#!/usr/bin/env node\n` +
`const fs=require('node:fs'); const path=require('node:path');\n` +
`const cwd=process.cwd(); const args=process.argv.slice(2); fs.appendFileSync(${JSON.stringify(logFile)}, 'CWD='+cwd+'\\nARGS='+args.join(' ')+'\\n');\n` +
`if(!cwd.endsWith(${JSON.stringify(path.sep + MODERN_TEST_TOOLCHAIN_WORKSPACE)})){ const f=${JSON.stringify(path.join(project, 'node_modules', 'vite', 'package.json'))}; const j=JSON.parse(fs.readFileSync(f,'utf8')); j.version='9.9.9'; fs.writeFileSync(f,JSON.stringify(j)); process.exit(0); }\n` +
`const specs=args.filter((value)=>!value.startsWith('-')&&value!=='install');\n` +
`for(const spec of specs){ const cut=spec.lastIndexOf('@'); const name=spec.slice(0,cut); const version=spec.slice(cut+1); const dir=path.join(cwd,'node_modules',...name.split('/')); fs.mkdirSync(dir,{recursive:true}); const meta={name,version}; if(name==='jsdom')meta.engines={node:${JSON.stringify(EXPECTED_JSDOM_NODE_ENGINE)}}; if(name==='vitest')meta.bin={vitest:'./vitest.mjs'}; if(name==='@playwright/test')meta.bin={playwright:'./cli.js'}; fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify(meta,null,2)+'\\n'); if(name==='vitest')fs.writeFileSync(path.join(dir,'vitest.mjs'),'#!/usr/bin/env node\\n'); if(name==='@playwright/test')fs.writeFileSync(path.join(dir,'cli.js'),'#!/usr/bin/env node\\n'); }\n` +
`const bindir=path.join(cwd,'node_modules','.bin'); fs.mkdirSync(bindir,{recursive:true}); for(const [name,target] of [['vitest','../vitest/vitest.mjs'],['playwright','../@playwright/test/cli.js']]){ const dest=path.join(bindir,name); try{fs.unlinkSync(dest)}catch{} fs.symlinkSync(target,dest); }\n`;
  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(executable, source, { mode: 0o755 });
}

const isolationTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-m42-toolchain-isolation-'));
try {
  const project = path.join(isolationTemp, 'project');
  fs.mkdirSync(project, { recursive: true });
  fixtureApplication(project);
  for (const rel of [
    'scripts/ensure-modern-test-toolchain.mjs',
    'scripts/lib/lockfile-install-verifier.mjs',
    'scripts/lib/modern-test-toolchain.mjs',
  ]) copy(root, project, rel);
  const fakeBin = path.join(isolationTemp, 'bin');
  const logFile = path.join(isolationTemp, 'npm.log');
  writeFakeNpm(fakeBin, logFile, project);
  const packageBefore = fs.readFileSync(path.join(project, 'package.json'));
  const lockBefore = fs.readFileSync(path.join(project, 'package-lock.json'));
  const viteBefore = fs.readFileSync(path.join(project, 'node_modules', 'vite', 'package.json'));
  const run = spawnSync(process.execPath, ['scripts/ensure-modern-test-toolchain.mjs'], {
    cwd: project,
    encoding: 'utf8',
    shell: false,
    env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH || ''}` },
  });
  assert(!run.error && run.status === 0, `isolated modern test-toolchain bootstrap should succeed: ${run.stderr || run.stdout || run.error?.message}`);
  const log = fs.readFileSync(logFile, 'utf8');
  assert(log.includes(`${path.sep}node_modules${path.sep}${MODERN_TEST_TOOLCHAIN_WORKSPACE}`), 'modern test-toolchain npm install must execute from the isolated node_modules workspace');
  for (const flag of ['--no-save', '--package-lock=false', '--ignore-scripts']) assert(log.includes(flag), `isolated modern test-toolchain bootstrap must preserve ${flag}`);
  assert(Buffer.compare(packageBefore, fs.readFileSync(path.join(project, 'package.json'))) === 0, 'isolated bootstrap must preserve package.json byte-for-byte');
  assert(Buffer.compare(lockBefore, fs.readFileSync(path.join(project, 'package-lock.json'))) === 0, 'isolated bootstrap must preserve package-lock.json byte-for-byte');
  assert(Buffer.compare(viteBefore, fs.readFileSync(path.join(project, 'node_modules', 'vite', 'package.json'))) === 0, 'isolated bootstrap must not re-resolve or replace lockfile-governed application packages');
  const installed = verifyInstalledLockfileTree(project, { allowExtraneous: true });
  assert(installed.ok, `isolated bootstrap must preserve exact lockfile package versions: ${installed.issues.join('; ')}`);
  const tools = verifyModernTestToolchain(project);
  const isolation = verifyModernTestToolchainIsolation(project);
  assert(tools.ok && tools.checked === tools.expected, `isolated governed toolchain fixture must verify: ${tools.issues.join('; ')}`);
  assert(isolation.ok, `governed toolchain bridges must remain isolated: ${isolation.issues.join('; ')}`);
  assert(run.stdout.includes('application lockfile tree preserved'), 'bootstrap success output must explicitly report application dependency preservation');
} finally {
  fs.rmSync(isolationTemp, { recursive: true, force: true });
}

const preserveTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-m42-toolchain-preserve-'));
try {
  fixtureApplication(preserveTemp);
  for (const rel of [
    'scripts/ensure-project-dependencies.mjs',
    'scripts/lib/lockfile-install-verifier.mjs',
    'scripts/lib/npm-offline-lockfile-probe.mjs',
    'scripts/lib/modern-test-toolchain.mjs',
    'scripts/lib/stage-g-m42-dependency-tree.mjs',
  ]) copy(root, preserveTemp, rel);

  const workspace = path.join(preserveTemp, 'node_modules', MODERN_TEST_TOOLCHAIN_WORKSPACE);
  writeJson(path.join(workspace, 'package.json'), { name: 'work-management-modern-test-toolchain', version: '1.0.0', private: true });
  for (const [name, version] of Object.entries(MODERN_TEST_TOOLCHAIN)) {
    const metadata = { name, version };
    if (name === 'jsdom') metadata.engines = { node: EXPECTED_JSDOM_NODE_ENGINE };
    const source = path.join(workspace, 'node_modules', ...name.split('/'));
    writeJson(path.join(source, 'package.json'), metadata);
    const destination = path.join(preserveTemp, 'node_modules', ...name.split('/'));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    relativeLink(source, destination, 'dir');
  }
  writeJson(path.join(workspace, 'node_modules', 'toolchain-transitive-fixture', 'package.json'), { name: 'toolchain-transitive-fixture', version: '1.0.0' });

  const strict = verifyInstalledLockfileTree(preserveTemp);
  assert(!strict.ok && strict.issues.some((issue) => issue.includes('is extraneous to package-lock.json')), 'strict dependency verification must reject governed-toolchain extras by default');
  const certification = verifyInstalledLockfileTree(preserveTemp, { allowExtraneous: true });
  assert(certification.ok, `certification dependency verification should preserve extras while requiring lockfile packages: ${certification.issues.join('; ')}`);
  const tools = verifyModernTestToolchain(preserveTemp);
  const isolation = verifyModernTestToolchainIsolation(preserveTemp);
  assert(tools.ok && tools.checked === tools.expected, `governed modern test toolchain fixture must verify: ${tools.issues.join('; ')}`);
  assert(isolation.ok, `governed modern test toolchain fixture must remain isolated: ${isolation.issues.join('; ')}`);

  const capturedDigest = computeM42DependencyTreeDigest(preserveTemp).digest;
  const result = spawnSync(process.execPath, ['scripts/ensure-project-dependencies.mjs'], {
    cwd: preserveTemp,
    encoding: 'utf8',
    shell: false,
    env: { ...process.env, WM_M42_PRESERVE_GOVERNED_TEST_TOOLCHAIN: '1', WM_M42_CERTIFICATION_DEPENDENCY_DIGEST: capturedDigest },
  });
  assert(!result.error && result.status === 0, `governed dependency preservation should pass without reinstalling: ${result.stderr || result.stdout || result.error?.message}`);
  assert(result.stdout.includes('governed modern test toolchain=8/8'), 'governed dependency preservation must verify the exact modern test toolchain');
  assert(fs.existsSync(path.join(workspace, 'node_modules', 'toolchain-transitive-fixture', 'package.json')), 'governed dependency preservation must not clean the captured isolated test-toolchain extension');

  const activation = fs.readFileSync(path.join(root, 'scripts/activate-stage-g-m42.mjs'), 'utf8');
  assert(activation.indexOf("run('modern-tests:toolchain:ensure')") < activation.indexOf('const certifiedDependencies = dependencyTree()'), 'M42 activation must materialize governed test tooling before capturing dependency evidence');
  assert(activation.indexOf('WM_M42_PRESERVE_GOVERNED_TEST_TOOLCHAIN') < activation.indexOf('runReleasePreActivationEvidenceGates()'), 'M42 activation must preserve the governed test-toolchain extension before evidence gates begin');
  assert(activation.includes('WM_M42_CERTIFICATION_DEPENDENCY_DIGEST = certifiedDependencies.digest'), 'M42 activation must bind nested dependency checks to the captured certification dependency digest');

  const workflow = fs.readFileSync(path.join(root, '.github/workflows/users-rbac-functional-recovery.yml'), 'utf8');
  assert(workflow.indexOf('npm run modern-tests:toolchain:ensure') < workflow.indexOf('M42_DEPENDENCY_DIGEST='), 'M42 CI must install governed test tooling before capturing dependency evidence');
  assert(workflow.includes('WM_M42_PRESERVE_GOVERNED_TEST_TOOLCHAIN=1'), 'M42 CI must preserve the governed toolchain across dependency checks');
  assert(workflow.includes('WM_M42_CERTIFICATION_DEPENDENCY_DIGEST='), 'M42 CI must bind nested dependency checks to its captured dependency digest');

  console.log('Stage G M42 governed modern test-toolchain preservation regression: PASS (isolated bootstrap preserves application lockfile tree and digest-bound certification extension)');
} finally {
  fs.rmSync(preserveTemp, { recursive: true, force: true });
}
