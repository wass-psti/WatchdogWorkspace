import assert from 'node:assert/strict';
import fs from 'node:fs';

const restore = fs.readFileSync('scripts/restore-required-repository-artifacts.mjs', 'utf8');
for (const token of [
  'SYNCHRONIZED ${entry.destination}',
  "'npm run csp-dist:check'",
  "'npm run interactions:check'",
  "'npm run runtime-schemas:check'",
  "'npm run supabase-client:check'",
  "'npm run tanstack-query:check'",
  "'npm run client-state:check'",
  'requiredTokens',
]) {
  assert.ok(restore.includes(token), `governance synchronization implementation missing ${token}`);
}

for (const workflow of [
  '.github/workflows/ci.yml',
  '.github/workflows/deploy-pages.yml',
  'governance-artifacts/github/workflows/ci.yml',
  'governance-artifacts/github/workflows/deploy-pages.yml',
]) {
  const source = fs.readFileSync(workflow, 'utf8');
  for (const command of ['npm run dependencies:ensure', 'npm run toolchain:dispatch:check', 'npm run csp-dist:check', 'npm run interactions:check', 'npm run runtime-schemas:check', 'npm run supabase-client:check', 'npm run tanstack-query:check', 'npm run client-state:check']) {
    assert.ok(source.includes(command), `${workflow} missing ${command}`);
  }
}

for (const activation of ['scripts/activate-stage-b-m4.mjs', 'scripts/activate-stage-b-m5.mjs', 'scripts/activate-stage-b-m6.mjs', 'scripts/activate-stage-b-m7.mjs', 'scripts/activate-stage-b-m8.mjs', 'scripts/activate-stage-b-m9.mjs']) {
  const source = fs.readFileSync(activation, 'utf8');
  const synchronizes = source.includes("run('npm', ['run', 'governance:restore'], 'Synchronize repository governance artifacts')")
    || source.includes("run('governance:restore', 'Synchronize repository governance artifacts')");
  assert.ok(synchronizes, `${activation} must synchronize governance artifacts before certification`);
}

console.log('Stage B M4/M5/M6/M7/M8/M9 governance synchronization regression verification: PASS');
