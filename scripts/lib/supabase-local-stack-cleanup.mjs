import { spawnSync } from 'node:child_process';

const listProjectContainers = (projectId, cwd) => {
  const result = spawnSync('docker', ['ps', '-aq', '--filter', `name=${projectId}`], {
    cwd,
    encoding: 'utf8',
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Unable to inspect residual Supabase containers for ${projectId} (docker exit ${result.status ?? 'unknown'}).`);
  }
  return String(result.stdout || '')
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
};

export const removeResidualSupabaseProjectContainers = (projectId, cwd = process.cwd()) => {
  const residual = listProjectContainers(projectId, cwd);
  if (residual.length === 0) return 0;

  console.warn(`Removing ${residual.length} residual Supabase container(s) for ${projectId} after CLI stop.`);
  const remove = spawnSync('docker', ['rm', '-f', ...residual], {
    cwd,
    encoding: 'utf8',
    shell: false,
  });
  if (remove.stdout) process.stdout.write(remove.stdout);
  if (remove.stderr) process.stderr.write(remove.stderr);
  if (remove.error) throw remove.error;
  if (remove.status !== 0) {
    throw new Error(`Failed to remove residual Supabase containers for ${projectId} (docker exit ${remove.status ?? 'unknown'}).`);
  }

  const remaining = listProjectContainers(projectId, cwd);
  if (remaining.length !== 0) {
    throw new Error(`Supabase container cleanup remained incomplete for ${projectId}: ${remaining.join(', ')}`);
  }
  return residual.length;
};
