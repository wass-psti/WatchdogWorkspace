import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const paths = {
  target: path.join(root, 'config/stage-b-m5-interaction-target.ts'),
  m4Target: path.join(root, 'config/stage-b-m4-design-system-target.ts'),
  pkg: path.join(root, 'package.json'),
  lock: path.join(root, 'package-lock.json'),
  tsconfig: path.join(root, 'tsconfig.json'),
  publicApi: path.join(root, 'src/design-system/index.ts'),
};
const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, value) => fs.writeFileSync(file, value);
const json = (file) => JSON.parse(read(file));
const targetSource = () => read(paths.target);
const value = (source, pattern, label) => {
  const match = source.match(pattern);
  if (!match) throw new Error(`Unable to read ${label}.`);
  return match[1];
};
const targetValue = (pattern, label) => value(targetSource(), pattern, label);
const ark = targetValue(/arkReact:\s*'([^']+)'/, 'Ark UI target');
const floating = targetValue(/floatingReact:\s*'([^']+)'/, 'Floating UI target');
const lucide = targetValue(/lucideReact:\s*'([^']+)'/, 'Lucide target');
const getState = () => targetValue(/activationState:\s*'([^']+)'/, 'M5 activation state');
const getM4State = () => value(read(paths.m4Target), /activationState:\s*'([^']+)'/, 'M4 activation state');
const states = new Set(['blocked-pending-m4-certification','blocked-pending-registry-access','dependencies-installed-pending-certification','active-pending-release-certification','active-certified']);
const stagedExcludes = ['src/design-system/interactions/**/*', 'src/design-system/icons/**/*'];

const setState = (next) => {
  if (!states.has(next)) throw new Error(`Unsupported M5 activation state: ${next}`);
  const current = targetSource();
  const updated = current.replace(/activationState:\s*'[^']+'/, `activationState: '${next}'`);
  if (updated === current) throw new Error('Unable to update M5 activation state.');
  write(paths.target, updated);
};
const setCompilerStaging = (staged) => {
  const config = json(paths.tsconfig);
  const excludes = new Set(config.exclude ?? []);
  for (const item of stagedExcludes) staged ? excludes.add(item) : excludes.delete(item);
  config.exclude = [...excludes];
  write(paths.tsconfig, `${JSON.stringify(config, null, 2)}\n`);
};
const setPublicApi = (active) => {
  let source = read(paths.publicApi)
    .replace(/^export \* from '\.\/interactions\/index\.ts';\n?/m, '')
    .replace(/^export \* from '\.\/icons\/index\.tsx';\n?/m, '')
    .trimEnd();
  if (active) source += "\nexport * from './interactions/index.ts';\nexport * from './icons/index.tsx';";
  write(paths.publicApi, `${source}\n`);
};
const run = (command, args, label) => {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}.`);
};
const assertDependencies = () => {
  const pkg = json(paths.pkg);
  const lock = json(paths.lock);
  const rootLock = lock.packages?.[''] ?? {};
  for (const [name, version] of [['@ark-ui/react', ark], ['@floating-ui/react', floating], ['lucide-react', lucide]]) {
    if (pkg.dependencies?.[name] !== version) throw new Error(`package.json must exact-pin ${name}@${version}.`);
    if (rootLock.dependencies?.[name] !== version) throw new Error(`package-lock root must exact-pin ${name}@${version}.`);
    const entry = lock.packages?.[`node_modules/${name}`];
    if (entry?.version !== version) throw new Error(`package-lock package entry mismatch for ${name}.`);
    if (!/^sha512-/.test(entry?.integrity ?? '')) throw new Error(`package-lock integrity missing for ${name}.`);
    if (!(entry?.resolved ?? '').startsWith('https://registry.npmjs.org/')) throw new Error(`${name} must resolve from the governed npm registry.`);
  }
};

const releaseRequested = process.argv.includes('--release');
run('npm', ['run', 'governance:restore'], 'Synchronize repository governance artifacts');
run('npm', ['run', 'governance:artifacts'], 'Repository governance artifact preflight');
run('npm', ['run', 'governance:sync-check'], 'M4/M5 governance synchronization regression gate');
const artifactProbe = spawnSync('npm', ['run', 'governance:artifacts'], { cwd: root, stdio: 'inherit', shell: false });
if (artifactProbe.error) throw artifactProbe.error;
if (artifactProbe.status !== 0) run('npm', ['run', 'governance:restore'], 'Restore missing repository governance artifacts');
run('npm', ['run', 'governance:artifacts'], 'Repository governance artifact preflight');

let state = getState();
if (!states.has(state)) throw new Error(`Unknown current M5 activation state: ${state}`);
if (getM4State() !== 'active-certified') {
  throw new Error('Stage B M5 activation requires Stage B M4 to be active-certified first. Complete `npm run design-system:activate:release` before activating M5.');
}
if (state === 'blocked-pending-m4-certification') {
  setState('blocked-pending-registry-access');
  state = 'blocked-pending-registry-access';
}

const rollbackFiles = [paths.target, paths.pkg, paths.lock, paths.tsconfig, paths.publicApi];
const snapshots = new Map(rollbackFiles.map((file) => [file, read(file)]));
let rollbackOnFailure = state === 'blocked-pending-registry-access';
try {
  if (state === 'blocked-pending-registry-access') {
    const registry = 'https://registry.npmjs.org/';
    run('npm', ['ping', `--registry=${registry}`, '--fetch-retries=0', '--fetch-timeout=8000'], 'Official npm registry preflight');
    run('npm', ['install','--save-exact',`--registry=${registry}`,'--fetch-retries=1','--fetch-timeout=20000',`@ark-ui/react@${ark}`,`@floating-ui/react@${floating}`,`lucide-react@${lucide}`], 'Install governed M5 interaction dependencies');
    assertDependencies();
    setCompilerStaging(false);
    setPublicApi(false);
    setState('dependencies-installed-pending-certification');
    state = 'dependencies-installed-pending-certification';
    // Keep a truthful dependency-installed state if later source certification fails.
    rollbackOnFailure = false;
  }

  if (state === 'dependencies-installed-pending-certification') {
    assertDependencies();
    setCompilerStaging(false);
    setPublicApi(false);
    run('npm', ['run', 'governance:check'], 'Package governance gate');
    run('npm', ['run', 'security:check'], 'Security baseline gate');
    run('npm', ['run', 'react:check'], 'React composition boundary gate');
    run('npm', ['run', 'design-system:check'], 'M4 design-system gate');
    run('npm', ['run', 'corrective:check'], 'M4 corrective integrity gate');
    run('npm', ['run', 'vendor-types:check'], 'M4 vendor declaration compatibility gate');
    run('npm', ['run', 'csp-dist:check'], 'M4 production CSP serialization compatibility gate');
    run('npm', ['run', 'interactions:check'], 'M5 dependency-installed gate');
    run('npm', ['run', 'lint:eslint'], 'Governed ESLint gate');
    run('npm', ['run', 'typecheck'], 'TypeScript verification against Ark/Floating/Lucide public APIs');

    setPublicApi(true);
    setState('active-pending-release-certification');
    state = 'active-pending-release-certification';
    run('npm', ['run', 'interactions:check'], 'M5 public-boundary gate');
    run('npm', ['run', 'typecheck'], 'TypeScript revalidation with active M5 public API');
  }

  if (state === 'active-pending-release-certification' && releaseRequested) {
    assertDependencies();
    run('npm', ['run', 'audit:ci'], 'High-severity dependency audit');
    run('npm', ['run', 'release:check'], 'Complete production release gate');
    setState('active-certified');
    run('npm', ['run', 'interactions:check'], 'Final M5 certified-state gate');
    state = 'active-certified';
  }

  if (state === 'active-certified' && releaseRequested) {
    assertDependencies();
    run('npm', ['run', 'interactions:check'], 'M5 certified-state validation');
  }
} catch (error) {
  if (rollbackOnFailure) {
    for (const [file, content] of snapshots) write(file, content);
    console.error('\nM5 activation failed before dependency installation completed. Governed source/package files were rolled back to their pre-run state.');
  }
  throw error;
}

console.log(`\nStage B M5 activation workflow complete for this run. Current state: ${state}`);
if (state === 'dependencies-installed-pending-certification') console.log('Dependencies remain installed and governed so source/API corrections can resume without repeating installation.');
if (state === 'active-pending-release-certification') console.log('Run `npm run interactions:activate:release` to execute audit + full release certification.');
