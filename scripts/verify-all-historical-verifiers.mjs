import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nodeOptions = [process.env.NODE_OPTIONS ?? '', '--experimental-strip-types', '--disable-warning=ExperimentalWarning']
  .filter(Boolean)
  .join(' ')
  .trim();
const verifiers = readdirSync(root)
  .filter((name) => /^verify-.*\.mjs$/.test(name))
  .sort();

const failures = [];
let passed = 0;
console.log(`Historical verifier collect-all preflight: ${verifiers.length} verifiers`);
for (const verifier of verifiers) {
  const result = spawnSync(process.execPath, [verifier], {
    cwd: root,
    env: { ...process.env, NODE_OPTIONS: nodeOptions },
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status === 0) {
    passed += 1;
    console.log(`PASS ${verifier}`);
    continue;
  }
  failures.push({
    verifier,
    status: result.status,
    signal: result.signal,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  });
  console.error(`FAIL ${verifier} (status=${result.status ?? 'null'}${result.signal ? ` signal=${result.signal}` : ''})`);
}

console.log(`Historical verifier collect-all summary: total=${verifiers.length}; passed=${passed}; failed=${failures.length}`);
if (failures.length) {
  console.error('\n================ FAILURE DETAILS ================');
  for (const failure of failures) {
    console.error(`\n--- ${failure.verifier} ---`);
    if (failure.stdout.trim()) console.error(failure.stdout.trim());
    if (failure.stderr.trim()) console.error(failure.stderr.trim());
  }
  process.exit(1);
}
console.log('Historical verifier collect-all preflight: PASS');
