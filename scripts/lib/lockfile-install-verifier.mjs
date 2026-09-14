import fs from 'node:fs';
import path from 'node:path';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const normalize = (value) => value.split(path.sep).join('/');

function allowedByConstraint(values, actual) {
  if (!Array.isArray(values) || values.length === 0) return true;
  const negatives = values.filter((value) => String(value).startsWith('!')).map((value) => String(value).slice(1));
  if (negatives.includes(actual)) return false;
  const positives = values.filter((value) => !String(value).startsWith('!')).map(String);
  return positives.length === 0 || positives.includes(actual);
}

function platformApplicable(meta) {
  return allowedByConstraint(meta.os, process.platform) && allowedByConstraint(meta.cpu, process.arch);
}

function sameDependencyMap(left = {}, right = {}) {
  const leftEntries = Object.entries(left).sort(([a], [b]) => a.localeCompare(b));
  const rightEntries = Object.entries(right).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(leftEntries) === JSON.stringify(rightEntries);
}

function collectInstalledPackagePaths(root) {
  const installed = [];
  const visited = new Set();

  const scanNodeModules = (nodeModulesDir) => {
    let real;
    try { real = fs.realpathSync(nodeModulesDir); } catch { return; }
    if (visited.has(real)) return;
    visited.add(real);

    let entries = [];
    try { entries = fs.readdirSync(nodeModulesDir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name === '.bin' || entry.name === '.cache' || entry.name === '.package-lock.json') continue;
      const first = path.join(nodeModulesDir, entry.name);
      if (entry.name.startsWith('@')) {
        let scoped = [];
        try { scoped = fs.readdirSync(first, { withFileTypes: true }); } catch { continue; }
        for (const child of scoped) {
          if (!child.isDirectory() && !child.isSymbolicLink()) continue;
          const packageDir = path.join(first, child.name);
          const packageJson = path.join(packageDir, 'package.json');
          if (fs.existsSync(packageJson)) installed.push(normalize(path.relative(root, packageDir)));
          scanNodeModules(path.join(packageDir, 'node_modules'));
        }
        continue;
      }
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
      const packageJson = path.join(first, 'package.json');
      if (fs.existsSync(packageJson)) installed.push(normalize(path.relative(root, first)));
      scanNodeModules(path.join(first, 'node_modules'));
    }
  };

  scanNodeModules(path.join(root, 'node_modules'));
  return installed;
}

export function verifyInstalledLockfileTree(root, { allowExtraneous = false } = {}) {
  const issues = [];
  const lockPath = path.join(root, 'package-lock.json');
  const packagePath = path.join(root, 'package.json');
  if (!fs.existsSync(lockPath)) return { ok: false, issues: ['package-lock.json is missing'], checked: 0, optionalSkipped: 0 };
  if (!fs.existsSync(packagePath)) return { ok: false, issues: ['package.json is missing'], checked: 0, optionalSkipped: 0 };

  let lock;
  let pkg;
  try { lock = readJson(lockPath); } catch (error) { return { ok: false, issues: [`package-lock.json is unreadable: ${error.message}`], checked: 0, optionalSkipped: 0 }; }
  try { pkg = readJson(packagePath); } catch (error) { return { ok: false, issues: [`package.json is unreadable: ${error.message}`], checked: 0, optionalSkipped: 0 }; }

  if (Number(lock.lockfileVersion) !== 3) issues.push(`package-lock.json must use lockfileVersion 3; found ${lock.lockfileVersion ?? 'unknown'}`);
  const rootEntry = lock.packages?.[''] ?? {};
  if (!sameDependencyMap(pkg.dependencies, rootEntry.dependencies)) issues.push('package.json dependencies do not exactly match package-lock root dependencies');
  if (!sameDependencyMap(pkg.devDependencies, rootEntry.devDependencies)) issues.push('package.json devDependencies do not exactly match package-lock root devDependencies');

  let checked = 0;
  let optionalSkipped = 0;
  const expected = new Set();
  for (const [lockKey, meta] of Object.entries(lock.packages ?? {})) {
    if (!lockKey || !meta?.version || !lockKey.startsWith('node_modules/')) continue;
    if (!platformApplicable(meta)) continue;
    expected.add(lockKey);
    const packageJson = path.join(root, lockKey, 'package.json');
    if (!fs.existsSync(packageJson)) {
      if (meta.optional) { optionalSkipped += 1; continue; }
      issues.push(`${lockKey}@${meta.version} is missing`);
      continue;
    }
    checked += 1;
    try {
      const installed = readJson(packageJson).version;
      if (installed !== meta.version) issues.push(`${lockKey} expected ${meta.version} but found ${installed ?? 'unknown'}`);
    } catch (error) {
      issues.push(`${lockKey} has unreadable package metadata: ${error.message}`);
    }
  }

  if (fs.existsSync(path.join(root, 'node_modules'))) {
    for (const installedPath of collectInstalledPackagePaths(root)) {
      if (!expected.has(installedPath) && !allowExtraneous) issues.push(`${installedPath} is extraneous to package-lock.json`);
    }
  }

  for (const binary of ['tsc', 'vite']) {
    if (!fs.existsSync(path.join(root, 'node_modules', '.bin', binary))) issues.push(`node_modules/.bin/${binary} is missing`);
  }

  return { ok: issues.length === 0, issues, checked, optionalSkipped };
}
