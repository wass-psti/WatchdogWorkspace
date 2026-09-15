import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const MODERN_TEST_TOOLCHAIN = Object.freeze({
  vitest: '5.0.0',
  '@vitest/coverage-v8': '5.0.0',
  '@testing-library/dom': '10.4.1',
  '@testing-library/react': '16.3.3',
  '@testing-library/user-event': '14.6.7',
  '@testing-library/jest-dom': '7.0.1',
  '@playwright/test': '1.63.0',
  jsdom: '27.4.0',
});

export const EXPECTED_JSDOM_NODE_ENGINE = '^20.19.0 || ^22.12.0 || >=24.0.0';
export const MODERN_TEST_TOOLCHAIN_WORKSPACE = '.wm-modern-test-toolchain';
export const MODERN_TEST_TOOLCHAIN_STAGING_PREFIX = 'wm-modern-test-toolchain-stage-';

const normalize = (value) => value.split(path.sep).join('/');
const packagePathFromNodeModules = (nodeModulesRoot, name) => path.join(nodeModulesRoot, ...name.split('/'), 'package.json');
const readMetadataAtNodeModules = (nodeModulesRoot, name) => {
  try { return JSON.parse(fs.readFileSync(packagePathFromNodeModules(nodeModulesRoot, name), 'utf8')); }
  catch { return null; }
};
const packagePath = (root, name) => packagePathFromNodeModules(path.join(root, 'node_modules'), name);
const readMetadata = (root, name) => {
  try { return JSON.parse(fs.readFileSync(packagePath(root, name), 'utf8')); }
  catch { return null; }
};

export function modernTestToolchainWorkspace(root) {
  return path.join(path.resolve(root), 'node_modules', MODERN_TEST_TOOLCHAIN_WORKSPACE);
}

export function modernTestToolchainInstallSpecs() {
  return Object.entries(MODERN_TEST_TOOLCHAIN).map(([name, version]) => `${name}@${version}`);
}

export function modernTestToolchainInstallArgs({ offline = false } = {}) {
  return [
    'install',
    '--no-save',
    '--package-lock=false',
    '--ignore-scripts',
    ...(offline ? ['--offline'] : []),
    '--no-audit',
    '--no-fund',
    ...modernTestToolchainInstallSpecs(),
  ];
}

export function verifyModernTestToolchain(root) {
  const issues = [];
  let checked = 0;
  for (const [name, expected] of Object.entries(MODERN_TEST_TOOLCHAIN)) {
    const metadata = readMetadata(root, name);
    const actual = metadata?.version ?? null;
    if (actual !== expected) {
      issues.push(`${name} expected ${expected} but found ${actual ?? 'missing'}`);
      continue;
    }
    checked += 1;
  }
  const jsdom = readMetadata(root, 'jsdom');
  const engine = jsdom?.engines?.node ?? null;
  if (engine !== EXPECTED_JSDOM_NODE_ENGINE) {
    issues.push(`jsdom engine contract mismatch: expected ${EXPECTED_JSDOM_NODE_ENGINE}, found ${engine ?? 'missing'}`);
  }
  return { ok: issues.length === 0, issues, checked, expected: Object.keys(MODERN_TEST_TOOLCHAIN).length };
}

function verifyStagedModernTestToolchain(workspace) {
  const nodeModulesRoot = path.join(workspace, 'node_modules');
  const issues = [];
  let checked = 0;
  for (const [name, expected] of Object.entries(MODERN_TEST_TOOLCHAIN)) {
    const metadata = readMetadataAtNodeModules(nodeModulesRoot, name);
    const actual = metadata?.version ?? null;
    if (actual !== expected) {
      issues.push(`${name} expected ${expected} in staged workspace but found ${actual ?? 'missing'}`);
      continue;
    }
    checked += 1;
  }
  const jsdom = readMetadataAtNodeModules(nodeModulesRoot, 'jsdom');
  const engine = jsdom?.engines?.node ?? null;
  if (engine !== EXPECTED_JSDOM_NODE_ENGINE) {
    issues.push(`staged jsdom engine contract mismatch: expected ${EXPECTED_JSDOM_NODE_ENGINE}, found ${engine ?? 'missing'}`);
  }
  return { ok: issues.length === 0, issues, checked, expected: Object.keys(MODERN_TEST_TOOLCHAIN).length };
}

function expectedPackageSource(root, name) {
  return path.join(modernTestToolchainWorkspace(root), 'node_modules', ...name.split('/'));
}

function packageBridge(root, name) {
  return path.join(path.resolve(root), 'node_modules', ...name.split('/'));
}

function linkRelative(source, destination, type = 'file') {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.rmSync(destination, { recursive: true, force: true });
  const relative = path.relative(path.dirname(destination), source) || '.';
  fs.symlinkSync(relative, destination, process.platform === 'win32' && type === 'dir' ? 'junction' : type);
}

function packageBins(metadata) {
  const value = metadata?.bin;
  if (!value) return [];
  if (typeof value === 'string') {
    const fallback = String(metadata.name || '').split('/').pop();
    return fallback ? [[fallback, value]] : [];
  }
  if (typeof value === 'object') return Object.entries(value).filter(([, target]) => typeof target === 'string');
  return [];
}

export function verifyModernTestToolchainIsolation(root) {
  const projectRoot = path.resolve(root);
  const workspace = modernTestToolchainWorkspace(projectRoot);
  const issues = [];
  if (!fs.existsSync(path.join(workspace, 'package.json'))) {
    issues.push(`isolated modern test-toolchain workspace is missing: ${normalize(path.relative(projectRoot, workspace))}`);
  }
  for (const name of Object.keys(MODERN_TEST_TOOLCHAIN)) {
    const source = expectedPackageSource(projectRoot, name);
    const bridge = packageBridge(projectRoot, name);
    let bridgeStat = null;
    try { bridgeStat = fs.lstatSync(bridge); } catch {}
    if (!bridgeStat?.isSymbolicLink()) {
      issues.push(`${normalize(path.relative(projectRoot, bridge))} must be a managed symlink into ${MODERN_TEST_TOOLCHAIN_WORKSPACE}`);
      continue;
    }
    try {
      if (fs.realpathSync(bridge) !== fs.realpathSync(source)) {
        issues.push(`${normalize(path.relative(projectRoot, bridge))} points outside the isolated modern test-toolchain workspace`);
      }
    } catch {
      issues.push(`${normalize(path.relative(projectRoot, bridge))} is a broken modern test-toolchain bridge`);
    }
  }
  return { ok: issues.length === 0, issues, workspace };
}

function writeWorkspacePackage(workspace) {
  fs.mkdirSync(workspace, { recursive: true });
  fs.writeFileSync(path.join(workspace, 'package.json'), `${JSON.stringify({
    name: 'work-management-modern-test-toolchain',
    version: '1.0.0',
    private: true,
  }, null, 2)}\n`);
}

function prepareExternalStagingWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), MODERN_TEST_TOOLCHAIN_STAGING_PREFIX));
  writeWorkspacePackage(workspace);
  return workspace;
}

function publishWorkspaceSnapshot(root, stagingWorkspace) {
  const projectRoot = path.resolve(root);
  const nodeModulesRoot = path.join(projectRoot, 'node_modules');
  const workspace = modernTestToolchainWorkspace(projectRoot);
  const nonce = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const replacement = path.join(nodeModulesRoot, `.${MODERN_TEST_TOOLCHAIN_WORKSPACE}.next-${nonce}`);
  const backup = path.join(nodeModulesRoot, `.${MODERN_TEST_TOOLCHAIN_WORKSPACE}.previous-${nonce}`);
  fs.mkdirSync(nodeModulesRoot, { recursive: true });
  fs.rmSync(replacement, { recursive: true, force: true });
  fs.rmSync(backup, { recursive: true, force: true });

  try {
    fs.cpSync(stagingWorkspace, replacement, { recursive: true, verbatimSymlinks: true });
    if (fs.existsSync(workspace)) fs.renameSync(workspace, backup);
    try {
      fs.renameSync(replacement, workspace);
    } catch (error) {
      if (fs.existsSync(backup) && !fs.existsSync(workspace)) fs.renameSync(backup, workspace);
      throw error;
    }
    fs.rmSync(backup, { recursive: true, force: true });
  } catch (error) {
    fs.rmSync(replacement, { recursive: true, force: true });
    throw error;
  }
}

function publishWorkspaceBridges(root) {
  const projectRoot = path.resolve(root);
  const workspace = modernTestToolchainWorkspace(projectRoot);
  const bins = new Map();
  for (const name of Object.keys(MODERN_TEST_TOOLCHAIN)) {
    const source = expectedPackageSource(projectRoot, name);
    const metadataFile = path.join(source, 'package.json');
    if (!fs.existsSync(metadataFile)) throw new Error(`Modern test-toolchain package did not materialize: ${name}`);
    const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
    linkRelative(source, packageBridge(projectRoot, name), 'dir');
    for (const [binName] of packageBins(metadata)) bins.set(binName, path.join(workspace, 'node_modules', '.bin', binName));
  }
  for (const [binName, source] of bins) {
    if (!fs.existsSync(source)) throw new Error(`Modern test-toolchain binary did not materialize: ${binName}`);
    linkRelative(source, path.join(projectRoot, 'node_modules', '.bin', binName), 'file');
  }
}

export function materializeModernTestToolchain(root, { offline = false, stdio = 'inherit', timeout } = {}) {
  const projectRoot = path.resolve(root);
  const stagingWorkspace = prepareExternalStagingWorkspace();
  try {
    const result = spawnSync('npm', modernTestToolchainInstallArgs({ offline }), {
      cwd: stagingWorkspace,
      stdio,
      encoding: stdio === 'inherit' ? undefined : 'utf8',
      shell: false,
      timeout,
    });
    if (result.error || result.status !== 0) {
      return {
        ok: false,
        status: result.status,
        error: result.error ?? null,
        output: `${result.stdout || ''}${result.stderr || ''}`.trim(),
        workspace: modernTestToolchainWorkspace(projectRoot),
        stagingWorkspace,
      };
    }

    const staged = verifyStagedModernTestToolchain(stagingWorkspace);
    if (!staged.ok) {
      return {
        ok: false,
        status: 1,
        error: null,
        output: staged.issues.join('\n'),
        workspace: modernTestToolchainWorkspace(projectRoot),
        stagingWorkspace,
        staged,
      };
    }

    try {
      publishWorkspaceSnapshot(projectRoot, stagingWorkspace);
      publishWorkspaceBridges(projectRoot);
    } catch (error) {
      return {
        ok: false,
        status: 1,
        error,
        output: error instanceof Error ? error.message : String(error),
        workspace: modernTestToolchainWorkspace(projectRoot),
        stagingWorkspace,
      };
    }

    const toolchain = verifyModernTestToolchain(projectRoot);
    const isolation = verifyModernTestToolchainIsolation(projectRoot);
    return {
      ok: toolchain.ok && isolation.ok,
      status: toolchain.ok && isolation.ok ? 0 : 1,
      error: null,
      output: [...toolchain.issues, ...isolation.issues].join('\n'),
      workspace: modernTestToolchainWorkspace(projectRoot),
      stagingWorkspace,
      staged,
      toolchain,
      isolation,
    };
  } finally {
    fs.rmSync(stagingWorkspace, { recursive: true, force: true });
  }
}
