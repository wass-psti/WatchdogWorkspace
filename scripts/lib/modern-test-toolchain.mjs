import fs from 'node:fs';
import path from 'node:path';

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

const packagePath = (root, name) => path.join(root, 'node_modules', ...name.split('/'), 'package.json');
const readMetadata = (root, name) => {
  try { return JSON.parse(fs.readFileSync(packagePath(root, name), 'utf8')); }
  catch { return null; }
};

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

export function modernTestToolchainInstallSpecs() {
  return Object.entries(MODERN_TEST_TOOLCHAIN).map(([name, version]) => `${name}@${version}`);
}
