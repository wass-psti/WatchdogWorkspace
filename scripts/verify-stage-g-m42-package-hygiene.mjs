import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const scannerSource = join(root, 'scripts', 'scan-secrets.mjs');
const sandbox = mkdtempSync(join(tmpdir(), 'wm-m42-package-hygiene-'));
const project = join(sandbox, 'project');
const scripts = join(project, 'scripts');
mkdirSync(scripts, { recursive: true });
cpSync(scannerSource, join(scripts, 'scan-secrets.mjs'));

const run = () => spawnSync(process.execPath, ['scripts/scan-secrets.mjs'], {
  cwd: project,
  encoding: 'utf8',
});

try {
  const authTokenKey = '_auth' + 'Token';
  const npmToken = 'npm_' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456';
  const passwordKey = '_pass' + 'word';
  const encodedPassword = 'QUJDREVGR0hJSktM' + 'TU5PUFFSU1RVVldYWVo=';

  writeFileSync(join(project, '.npmrc'), `engine-strict=true\n//registry.npmjs.org/:${authTokenKey}=\${NPM_TOKEN}\n`);
  let result = run();
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /High-confidence secret scan: PASS/, 'environment-backed npm token placeholder must be allowed');

  writeFileSync(join(project, '.npmrc'), `engine-strict=true\n//registry.npmjs.org/:${authTokenKey}=${npmToken}\n`);
  result = run();
  assert.notEqual(result.status, 0, 'literal npm access token must fail secret scanning');
  assert.match(`${result.stdout}${result.stderr}`, /npm access token|literal npm auth token assignment/i, 'literal npm token failure must identify the credential class');

  writeFileSync(join(project, '.npmrc'), `engine-strict=true\n//registry.npmjs.org/:${passwordKey}=${encodedPassword}\n`);
  result = run();
  assert.notEqual(result.status, 0, 'literal npm password/auth material must fail secret scanning');
  assert.match(`${result.stdout}${result.stderr}`, /literal npm auth credential assignment/i, 'literal npm auth material failure must identify the credential class');

  const githubPrefix = 'github_' + 'pat_';
  const githubToken = githubPrefix + 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  writeFileSync(join(project, 'shipping-notes.txt'), `temporary_token=${githubToken}\n`);
  result = run();
  assert.notEqual(result.status, 0, 'literal credential in packaged .txt text must fail secret scanning');
  assert.match(`${result.stdout}${result.stderr}`, /GitHub token/i, 'text-format credential failure must identify the credential class');
  writeFileSync(join(project, 'shipping-notes.txt'), 'no credentials here\n');

  const awsKey = 'AKIA' + 'ABCDEFGHIJKLMNOP';
  mkdirSync(join(project, 'supabase'), { recursive: true });
  writeFileSync(join(project, 'supabase', 'config.toml'), `project_id = "safe"\ncredential = "${awsKey}"\n`);
  result = run();
  assert.notEqual(result.status, 0, 'literal credential in packaged .toml text must fail secret scanning');
  assert.match(`${result.stdout}${result.stderr}`, /AWS access key/i, 'TOML credential failure must identify the credential class');

} finally {
  rmSync(sandbox, { recursive: true, force: true });
}

console.log('Stage G M42 certified-package secret hygiene verification: PASS (packaged text formats and .npmrc are scanned; env placeholders allowed; literal npm/text credentials fail closed)');
