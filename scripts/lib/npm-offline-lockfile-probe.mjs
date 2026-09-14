import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export function probeOfflineLockfileInstall(projectRoot, { timeout = 120000 } = {}) {
  const probeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-npm-offline-probe-'));
  try {
    for (const name of ['package.json', 'package-lock.json', '.npmrc']) {
      const source = path.join(projectRoot, name);
      if (fs.existsSync(source)) fs.copyFileSync(source, path.join(probeRoot, name));
    }
    const result = spawnSync('npm', [
      'ci',
      '--ignore-scripts',
      '--offline',
      '--no-audit',
      '--fund=false',
    ], {
      cwd: probeRoot,
      encoding: 'utf8',
      shell: false,
      timeout,
    });
    return {
      ok: !result.error && result.status === 0,
      status: result.status,
      error: result.error ?? null,
      output: `${result.stdout || ''}${result.stderr || ''}`.trim(),
    };
  } finally {
    fs.rmSync(probeRoot, { recursive: true, force: true });
  }
}
