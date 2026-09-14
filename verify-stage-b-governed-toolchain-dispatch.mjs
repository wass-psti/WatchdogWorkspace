import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname);
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const wrapperPath = path.join(root, 'scripts/run-governed-toolchain.sh');
const wrapper = fs.readFileSync(wrapperPath, 'utf8');

assert.ok(fs.statSync(wrapperPath).mode & 0o100, 'governed toolchain wrapper must be executable');
assert.match(wrapper, /\.nvmrc/, 'toolchain dispatcher must source the governed Node version from .nvmrc');
assert.match(wrapper, /packageManager/, 'toolchain dispatcher must source the governed npm version from packageManager');
assert.match(wrapper, /\.nvm\/versions\/node\/v\$\{EXPECTED_NODE\}\/bin/, 'toolchain dispatcher must support standard NVM installations without requiring an interactive shell');
assert.match(wrapper, /nvm use --silent/, 'toolchain dispatcher must support NVM shell activation as a fallback');
assert.match(wrapper, /hash -r/, 'toolchain dispatcher must clear stale node/npm command hashes after switching');
assert.match(wrapper, /FINAL_NODE/, 'toolchain dispatcher must revalidate Node after switching');
assert.match(wrapper, /FINAL_NPM/, 'toolchain dispatcher must revalidate npm after switching');

for (const name of ['dependencies:ensure','stage-b:certify','runtime-schemas:check','runtime-schemas:status','runtime-schemas:activate','runtime-schemas:activate:release','supabase-client:check','supabase-client:status','supabase-client:activate','supabase-client:activate:release','tanstack-query:check','tanstack-query:status','tanstack-query:activate','tanstack-query:activate:release','browser-harness:check']) {
  assert.match(pkg.scripts[name] ?? '', /^bash scripts\/run-governed-toolchain\.sh /, `${name} must enter through the governed toolchain dispatcher`);
}
for (const name of ['dependencies:ensure:governed','stage-b:certify:governed','runtime-schemas:check:governed','runtime-schemas:status:governed','runtime-schemas:activate:governed','runtime-schemas:activate:release:governed','supabase-client:check:governed','supabase-client:status:governed','supabase-client:activate:governed','supabase-client:activate:release:governed','tanstack-query:check:governed','tanstack-query:status:governed','tanstack-query:activate:governed','tanstack-query:activate:release:governed','browser-harness:check:governed']) {
  assert.ok(pkg.scripts[name], `${name} governed implementation script must exist`);
}

const direct = spawnSync('bash', ['scripts/run-governed-toolchain.sh', '/bin/bash', '-lc', 'printf "%s|%s" "$(node -v)" "$(npm -v)"'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(direct.status, 0, direct.stderr || 'governed toolchain direct dispatch failed');
assert.match(direct.stdout, /v22\.16\.0\|10\.9\.2/, 'direct dispatch must execute under Node v22.16.0/npm 10.9.2');

// Simulate the exact user failure: the public command starts with Node 24/npm 11,
// while a governed Node 22 installation exists under ~/.nvm but the nvm function is
// not loaded. The dispatcher must repair PATH and execute under the governed pair.
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-toolchain-dispatch-'));
try {
  const badBin = path.join(temp, 'bad-bin');
  const governedBin = path.join(temp, '.nvm', 'versions', 'node', 'v22.16.0', 'bin');
  fs.mkdirSync(badBin, { recursive: true });
  fs.mkdirSync(governedBin, { recursive: true });
  const realNode = process.execPath;
  const npmPathResult = spawnSync('bash', ['-lc', 'command -v npm'], { encoding: 'utf8' });
  assert.equal(npmPathResult.status, 0, 'unable to locate npm for toolchain simulation');
  const realNpm = npmPathResult.stdout.trim();
  const writeExe = (file, body) => {
    fs.writeFileSync(file, `#!/usr/bin/env bash\n${body}\n`, { mode: 0o755 });
  };
  writeExe(path.join(badBin, 'node'), 'if [[ "${1:-}" == "--version" || "${1:-}" == "-v" ]]; then echo v24.20.0; exit 0; fi; exit 97');
  writeExe(path.join(badBin, 'npm'), 'if [[ "${1:-}" == "--version" || "${1:-}" == "-v" ]]; then echo 11.19.0; exit 0; fi; exit 98');
  writeExe(path.join(governedBin, 'node'), `exec ${JSON.stringify(realNode)} "$@"`);
  writeExe(path.join(governedBin, 'npm'), `exec ${JSON.stringify(realNpm)} "$@"`);

  const simulated = spawnSync('/bin/bash', [wrapperPath, 'node', '-e', 'process.stdout.write(process.version)'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, HOME: temp, NVM_DIR: path.join(temp, '.nvm'), PATH: `${badBin}:/usr/bin:/bin` },
  });
  assert.equal(simulated.status, 0, simulated.stderr || simulated.stdout || 'mismatched-toolchain simulation failed');
  assert.match(simulated.stdout, /v24\.20\.0 \/ npm 11\.19\.0 -> Node v22\.16\.0 \/ npm 10\.9\.2/, 'dispatcher must detect the mismatched incoming toolchain');
  assert.match(simulated.stdout, /Governed toolchain dispatch: PASS \(v22\.16\.0, npm 10\.9\.2\)/, 'dispatcher must switch to the governed toolchain');
  assert.match(simulated.stdout, /v22\.16\.0$/, 'simulated command must execute under Node v22.16.0');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

console.log('Stage B governed toolchain dispatch verification: PASS');
