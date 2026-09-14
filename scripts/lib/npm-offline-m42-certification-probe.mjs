import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { verifyInstalledLockfileTree } from './lockfile-install-verifier.mjs';
import { modernTestToolchainInstallSpecs, verifyModernTestToolchain } from './modern-test-toolchain.mjs';

const combinedOutput = (result) => `${result.stdout || ''}${result.stderr || ''}`.trim();

export function probeOfflineM42CertificationInstall(projectRoot, { timeout = 180000 } = {}) {
  const probeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-m42-offline-cert-probe-'));
  try {
    for (const name of ['package.json', 'package-lock.json', '.npmrc']) {
      const source = path.join(projectRoot, name);
      if (fs.existsSync(source)) fs.copyFileSync(source, path.join(probeRoot, name));
    }
    const app = spawnSync('npm', [
      'ci', '--ignore-scripts', '--offline', '--no-audit', '--fund=false',
    ], { cwd: probeRoot, encoding: 'utf8', shell: false, timeout });
    if (app.error || app.status !== 0) {
      return { ok: false, stage: 'application-lockfile', status: app.status, error: app.error ?? null, output: combinedOutput(app) };
    }

    const tools = spawnSync('npm', [
      'install', '--no-save', '--package-lock=false', '--ignore-scripts', '--offline', '--no-audit', '--no-fund',
      ...modernTestToolchainInstallSpecs(),
    ], { cwd: probeRoot, encoding: 'utf8', shell: false, timeout });
    if (tools.error || tools.status !== 0) {
      return { ok: false, stage: 'modern-test-toolchain', status: tools.status, error: tools.error ?? null, output: combinedOutput(tools) };
    }

    const lockfile = verifyInstalledLockfileTree(probeRoot, { allowExtraneous: true });
    const toolchain = verifyModernTestToolchain(probeRoot);
    if (!lockfile.ok || !toolchain.ok) {
      return {
        ok: false,
        stage: 'verification',
        status: 1,
        error: null,
        output: [...lockfile.issues, ...toolchain.issues].join('\n'),
      };
    }
    return {
      ok: true,
      stage: 'verified',
      status: 0,
      error: null,
      output: `lockfile=${lockfile.checked}; toolchain=${toolchain.checked}/${toolchain.expected}`,
    };
  } finally {
    fs.rmSync(probeRoot, { recursive: true, force: true });
  }
}
