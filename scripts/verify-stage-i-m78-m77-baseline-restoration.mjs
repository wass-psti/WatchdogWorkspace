import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const EXPECTED_SOURCE_SHA = '4a07b2a7dbc876159858b208bd366e38115030702434fcde501f35c2bd6cd5b9';
const args = process.argv.slice(2);
const flagIndex = args.indexOf('--baseline-root');
const positional = args.find((arg) => !arg.startsWith('--'));
const baselineRoot = path.resolve(flagIndex >= 0 ? (args[flagIndex + 1] ?? '') : (process.env.M78_M77_BASELINE_ROOT ?? positional ?? ''));

if (!baselineRoot || baselineRoot === path.parse(baselineRoot).root || !fs.existsSync(baselineRoot)) {
  console.error('M78 M77 baseline restoration verification FAILED');
  console.error(' - provide --baseline-root <extracted M77 certified repository> or M78_M77_BASELINE_ROOT');
  process.exit(1);
}

const treeVerifier = path.join(baselineRoot, 'scripts/lib/stage-h-m77-certification-tree.mjs');
if (!fs.existsSync(treeVerifier)) {
  console.error('M78 M77 baseline restoration verification FAILED');
  console.error(` - M77 source-identity verifier missing: ${treeVerifier}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, [treeVerifier, baselineRoot], { encoding: 'utf8' });
if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || 'M77 source-identity verifier failed\n');
  process.exit(result.status ?? 1);
}
const actual = result.stdout.trim().split(/\s+/).at(-1) ?? '';
if (actual !== EXPECTED_SOURCE_SHA) {
  console.error('M78 M77 baseline restoration verification FAILED');
  console.error(` - expected M77 source SHA: ${EXPECTED_SOURCE_SHA}`);
  console.error(` - actual M77 source SHA:   ${actual}`);
  process.exit(1);
}
console.log('M78 M77 baseline restoration verification: PASS');
console.log(`M77 certified source SHA=${actual}`);
