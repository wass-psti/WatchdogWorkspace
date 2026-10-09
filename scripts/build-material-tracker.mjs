import { cp, mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const source = resolve(root, 'integrations/material-tracker');
const target = resolve(root, 'apps/material-tracker');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (args) => {
  const result = spawnSync(npm, args, { cwd: source, stdio: 'inherit', env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
};
run(['ci', '--ignore-scripts']);
run(['run', 'build']);
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(resolve(source, 'dist'), target, { recursive: true, force: true });
console.log('Material Tracker embedded runtime prepared:', target);
