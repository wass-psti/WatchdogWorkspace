import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { computeM42CertificationTreeDigest } from './lib/stage-g-m42-certification-tree.mjs';
import { computeM42DependencyTreeDigest } from './lib/stage-g-m42-dependency-tree.mjs';

const root = path.resolve(import.meta.dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-m42-evidence-stability-'));
const write = (relative, contents, mode = 0o644) => {
  const file = path.join(temp, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents, { mode });
};

try {
  write('node_modules/vite/package.json', '{"name":"vite","version":"8.2.2"}\n');
  write('node_modules/vite/bin/vite.js', '#!/usr/bin/env node\n', 0o755);
  write('node_modules/.bin/vite', '../vite/bin/vite.js');
  const baseline = computeM42DependencyTreeDigest(temp).digest;

  // Vite's default bundled config loader writes its generated config beneath
  // node_modules/.vite-temp. That directory is runtime/tool output, not installed
  // dependency content, and must not invalidate the certification dependency tree.
  write('node_modules/.vite-temp/vite.config.js.timestamp-1-deadbeef.mjs', 'export default {}\n');
  const withViteTemp = computeM42DependencyTreeDigest(temp).digest;
  assert.equal(withViteTemp, baseline, 'Vite .vite-temp output must be excluded from the M42 installed-dependency evidence domain');

  write('node_modules/.vite/deps/_metadata.json', '{}\n');
  write('node_modules/.vitest/results.json', '{}\n');
  write('node_modules/vite/.cache/runtime.json', '{}\n');
  assert.equal(computeM42DependencyTreeDigest(temp).digest, baseline, 'known generated tool caches must remain outside installed-dependency evidence');

  fs.writeFileSync(path.join(temp, 'node_modules/vite/package.json'), '{"name":"vite","version":"8.2.3-tampered"}\n');
  assert.notEqual(computeM42DependencyTreeDigest(temp).digest, baseline, 'real installed package byte drift must remain certification-visible');

  const project = path.join(temp, 'project');
  fs.mkdirSync(project, { recursive: true });
  for (const relative of [
    'scripts/assert-stage-g-m42-evidence-stability.mjs',
    'scripts/lib/stage-g-m42-certification-tree.mjs',
    'scripts/lib/stage-g-m42-dependency-tree.mjs',
  ]) {
    const source = path.join(root, relative);
    const target = path.join(project, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
  writeProject(project, 'package.json', '{"name":"m42-evidence-fixture"}\n');
  writeProject(project, 'app.txt', 'stable\n');
  writeProject(project, 'supabase/schema.sql', 'select 1;\n');
  writeProject(project, 'node_modules/pkg/package.json', '{"name":"pkg","version":"1.0.0"}\n');

  const sourceBaseline = computeM42CertificationTreeDigest(project).digest;
  writeProject(project, 'supabase/.temp/cli-latest', '2.117.0\n');
  assert.equal(
    computeM42CertificationTreeDigest(project).digest,
    sourceBaseline,
    'Supabase CLI supabase/.temp runtime metadata must be excluded from the M42 source evidence domain',
  );

  writeProject(project, 'other/.temp/probe.txt', 'must-remain-visible\n');
  assert.notEqual(
    computeM42CertificationTreeDigest(project).digest,
    sourceBaseline,
    'unrelated .temp directories must remain certification-visible',
  );
  fs.rmSync(path.join(project, 'other'), { recursive: true, force: true });
  assert.equal(computeM42CertificationTreeDigest(project).digest, sourceBaseline, 'removing unrelated temporary source must restore the source digest');

  writeProject(project, 'supabase/schema.sql', 'select 2;\n');
  assert.notEqual(
    computeM42CertificationTreeDigest(project).digest,
    sourceBaseline,
    'real Supabase source-byte drift must remain certification-visible',
  );
  writeProject(project, 'supabase/schema.sql', 'select 1;\n');
  assert.equal(computeM42CertificationTreeDigest(project).digest, sourceBaseline, 'restoring Supabase source must restore the source digest');

  writeProject(project, 'app.txt', 'mutated\n');
  assert.notEqual(
    computeM42CertificationTreeDigest(project).digest,
    sourceBaseline,
    'real application source-byte drift must remain certification-visible',
  );
  writeProject(project, 'app.txt', 'stable\n');
  assert.equal(computeM42CertificationTreeDigest(project).digest, sourceBaseline, 'restoring application source must restore the source digest');

  const snapshot = path.join(temp, 'baseline.json');
  let result = spawnSync(process.execPath, ['scripts/assert-stage-g-m42-evidence-stability.mjs', 'capture', snapshot], { cwd: project, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  result = spawnSync(process.execPath, ['scripts/assert-stage-g-m42-evidence-stability.mjs', 'verify', snapshot, 'stable fixture'], { cwd: project, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  writeProject(project, 'node_modules/.vite-temp/vite.config.js.timestamp-2-feedface.mjs', 'export default {}\n');
  result = spawnSync(process.execPath, ['scripts/assert-stage-g-m42-evidence-stability.mjs', 'verify', snapshot, 'Vite temporary output'], { cwd: project, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  writeProject(project, 'supabase/.temp/cli-latest', '2.117.1\n');
  result = spawnSync(process.execPath, ['scripts/assert-stage-g-m42-evidence-stability.mjs', 'verify', snapshot, 'Supabase CLI temporary output'], { cwd: project, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  writeProject(project, 'node_modules/pkg/package.json', '{"name":"pkg","version":"2.0.0"}\n');
  result = spawnSync(process.execPath, ['scripts/assert-stage-g-m42-evidence-stability.mjs', 'verify', snapshot, 'dependency mutation'], { cwd: project, encoding: 'utf8' });
  assert.notEqual(result.status, 0, 'dependency mutation must fail evidence verification');
  assert.match(`${result.stdout}\n${result.stderr}`, /dependency evidence drift during dependency mutation/);
  assert.match(`${result.stdout}\n${result.stderr}`, /changed: pkg\/package\.json/);

  console.log('Stage G M42 evidence stability verification: PASS (Vite .vite-temp and Supabase supabase/.temp normalized; real source/package mutations remain visible; drift diagnostics identify exact paths)');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

function writeProject(project, relative, contents, mode = 0o644) {
  const file = path.join(project, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents, { mode });
}
