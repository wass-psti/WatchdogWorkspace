import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const targetFile = path.join(root, 'config/stage-b-m4-design-system-target.ts');
const compositionFile = path.join(root, 'src/app/composition/ApplicationCompositionRoot.tsx');
const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, value) => fs.writeFileSync(file, value);
const json = (file) => JSON.parse(read(file));

const targetSource = () => read(targetFile);
const targetValue = (pattern, label) => {
  const match = targetSource().match(pattern);
  if (!match) throw new Error(`Unable to read ${label} from Stage B M4 target contract.`);
  return match[1];
};
const chakra = targetValue(/chakraReact:\s*'([^']+)'/, 'Chakra version');
const emotion = targetValue(/emotionReact:\s*'([^']+)'/, 'Emotion version');
const getState = () => targetValue(/activationState:\s*'([^']+)'/, 'activation state');

const states = new Set([
  'blocked-pending-registry-access',
  'dependencies-installed-pending-certification',
  'active-pending-release-certification',
  'active-certified',
]);

const setState = (next) => {
  if (!states.has(next)) throw new Error(`Unsupported M4 activation state: ${next}`);
  const current = targetSource();
  const updated = current.replace(/activationState:\s*'[^']+'/, `activationState: '${next}'`);
  if (updated === current) throw new Error('Unable to update M4 activation state.');
  write(targetFile, updated);
};

const inactiveComposition = `import { LegacyApplicationBoundary } from './LegacyApplicationBoundary.tsx';\n\nexport function ApplicationCompositionRoot() {\n  return <LegacyApplicationBoundary />;\n}\n`;
const activeComposition = `import { WorkManagementDesignSystemProvider } from '../../design-system/index.ts';\nimport { LegacyApplicationBoundary } from './LegacyApplicationBoundary.tsx';\n\nexport function ApplicationCompositionRoot() {\n  return (\n    <WorkManagementDesignSystemProvider>\n      <LegacyApplicationBoundary />\n    </WorkManagementDesignSystemProvider>\n  );\n}\n`;

const run = (command, args, label) => {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}.`);
};

const assertDependencyState = () => {
  const pkg = json(path.join(root, 'package.json'));
  const lock = json(path.join(root, 'package-lock.json'));
  const rootLock = lock.packages?.[''] ?? {};
  const assertions = [
    [pkg.dependencies?.['@chakra-ui/react'] === chakra, `package.json must pin @chakra-ui/react@${chakra}`],
    [pkg.dependencies?.['@emotion/react'] === emotion, `package.json must pin @emotion/react@${emotion}`],
    [rootLock.dependencies?.['@chakra-ui/react'] === chakra, 'package-lock root Chakra pin mismatch'],
    [rootLock.dependencies?.['@emotion/react'] === emotion, 'package-lock root Emotion pin mismatch'],
    [lock.packages?.['node_modules/@chakra-ui/react']?.version === chakra, 'package-lock Chakra package entry mismatch'],
    [lock.packages?.['node_modules/@emotion/react']?.version === emotion, 'package-lock Emotion package entry mismatch'],
    [/^sha512-/.test(lock.packages?.['node_modules/@chakra-ui/react']?.integrity ?? ''), 'package-lock Chakra integrity missing'],
    [/^sha512-/.test(lock.packages?.['node_modules/@emotion/react']?.integrity ?? ''), 'package-lock Emotion integrity missing'],
  ];
  for (const [condition, message] of assertions) if (!condition) throw new Error(message);
};

const releaseRequested = process.argv.includes('--release');
run('npm', ['run', 'governance:restore'], 'Synchronize repository governance artifacts');
run('npm', ['run', 'governance:artifacts'], 'Repository governance artifact preflight');
run('npm', ['run', 'governance:sync-check'], 'M4/M5 governance synchronization regression gate');
let state = getState();
if (!states.has(state)) throw new Error(`Unknown current M4 activation state: ${state}`);

if (state === 'blocked-pending-registry-access') {
  const registry = 'https://registry.npmjs.org/';
  run('npm', ['ping', `--registry=${registry}`, '--fetch-retries=0', '--fetch-timeout=8000'], 'Official npm registry preflight');
  run(
    'npm',
    [
      'install',
      '--save-exact',
      `--registry=${registry}`,
      '--fetch-retries=1',
      '--fetch-timeout=20000',
      `@chakra-ui/react@${chakra}`,
      `@emotion/react@${emotion}`,
    ],
    'Install governed M4 runtime dependencies',
  );
  assertDependencyState();
  write(compositionFile, inactiveComposition);
  setState('dependencies-installed-pending-certification');
  state = 'dependencies-installed-pending-certification';
}

if (state === 'dependencies-installed-pending-certification') {
  assertDependencyState();
  write(compositionFile, inactiveComposition);
  run('npm', ['run', 'governance:check'], 'Package governance gate');
  run('npm', ['run', 'security:check'], 'Security baseline gate');
  run('npm', ['run', 'react:check'], 'React composition boundary gate');
  run('npm', ['run', 'design-system:check'], 'M4 dependency-installed gate');
  run('npm', ['run', 'corrective:check'], 'M4 corrective integrity gate');
  run('npm', ['run', 'vendor-types:check'], 'M4 vendor declaration compatibility gate');
  run('npm', ['run', 'csp-dist:check'], 'M4 production CSP serialization compatibility gate');
  run('npm', ['run', 'lint:eslint'], 'Governed ESLint gate');
  run('npm', ['run', 'typecheck'], 'TypeScript verification of Work Management against Chakra/Emotion public APIs');

  write(compositionFile, activeComposition);
  setState('active-pending-release-certification');
  state = 'active-pending-release-certification';

  run('npm', ['run', 'react:check'], 'React boundary revalidation with design-system provider');
  run('npm', ['run', 'design-system:check'], 'M4 active-provider gate');
  run('npm', ['run', 'typecheck'], 'TypeScript revalidation with active provider');
}

if (state === 'active-pending-release-certification' && releaseRequested) {
  assertDependencyState();
  run('npm', ['run', 'audit:ci'], 'High-severity dependency audit');
  run('npm', ['run', 'release:check'], 'Complete production release gate');
  setState('active-certified');
  run('npm', ['run', 'design-system:check'], 'Final M4 certified-state gate');
  state = 'active-certified';
}

if (state === 'active-certified' && releaseRequested) {
  assertDependencyState();
  run('npm', ['run', 'design-system:check'], 'M4 certified-state validation');
}

console.log(`\nStage B M4 activation workflow complete for this run. Current state: ${state}`);
if (state === 'active-pending-release-certification') {
  console.log('Run `npm run design-system:activate:release` to execute audit + full release certification and promote the state to active-certified.');
}
