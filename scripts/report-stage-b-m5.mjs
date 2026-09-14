import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));
const target = read('config/stage-b-m5-interaction-target.ts');
const m4Target = read('config/stage-b-m4-design-system-target.ts');
const pkg = json('package.json');
const lock = json('package-lock.json');
const tsconfig = json('tsconfig.json');
const publicApi = read('src/design-system/index.ts');

const match = (source, pattern, label) => {
  const result = source.match(pattern);
  if (!result) throw new Error(`Unable to read ${label}.`);
  return result[1];
};
const ark = match(target, /arkReact:\s*'([^']+)'/, 'Ark UI version');
const floating = match(target, /floatingReact:\s*'([^']+)'/, 'Floating UI version');
const lucide = match(target, /lucideReact:\s*'([^']+)'/, 'Lucide version');
const state = match(target, /activationState:\s*'([^']+)'/, 'M5 activation state');
const m4State = match(m4Target, /activationState:\s*'([^']+)'/, 'M4 activation state');
const rootLock = lock.packages?.[''] ?? {};
const deps = pkg.dependencies ?? {};
const excludes = new Set(tsconfig.exclude ?? []);
const stagedExcludes = ['src/design-system/interactions/**/*', 'src/design-system/icons/**/*'];
const publicActive = publicApi.includes("./interactions/index.ts") && publicApi.includes("./icons/index.tsx");

const direct = (name) => ({ package: deps[name] ?? null, rootLock: rootLock.dependencies?.[name] ?? null, resolved: lock.packages?.[`node_modules/${name}`]?.version ?? null });
const arkState = direct('@ark-ui/react');
const floatingState = direct('@floating-ui/react');
const lucideState = direct('lucide-react');

console.log('Stage B Milestone 5 Primitive Interaction Architecture status');
console.log('---------------------------------------------------------------');
console.log(`M4 prerequisite state: ${m4State}`);
console.log(`M5 activation state: ${state}`);
console.log(`Target @ark-ui/react: ${ark}`);
console.log(`Target @floating-ui/react: ${floating}`);
console.log(`Target lucide-react: ${lucide}`);
console.log(`package.json direct Ark/Floating/Lucide: ${arkState.package ?? '-'} / ${floatingState.package ?? '-'} / ${lucideState.package ?? '-'}`);
console.log(`package-lock root direct Ark/Floating/Lucide: ${arkState.rootLock ?? '-'} / ${floatingState.rootLock ?? '-'} / ${lucideState.rootLock ?? '-'}`);
console.log(`resolved top-level package entries: ${arkState.resolved ?? '-'} / ${floatingState.resolved ?? '-'} / ${lucideState.resolved ?? '-'}`);
console.log(`Compiler staging excludes present: ${stagedExcludes.every((value) => excludes.has(value)) ? 'YES' : 'NO'}`);
console.log(`Public interaction API active: ${publicActive ? 'YES' : 'NO'}`);

const blocked = state === 'blocked-pending-m4-certification' || state === 'blocked-pending-registry-access';
const packageAligned = arkState.package === ark && floatingState.package === floating && lucideState.package === lucide;
const rootLockAligned = arkState.rootLock === ark && floatingState.rootLock === floating && lucideState.rootLock === lucide;
const resolvedAligned = arkState.resolved === ark && floatingState.resolved === floating && lucideState.resolved === lucide;
let valid;
if (blocked) {
  // M4/Chakra may already place Ark transitively in the lockfile. M5 ownership is
  // determined only by package.json + root lock direct dependencies.
  valid = arkState.package === null && floatingState.package === null && lucideState.package === null
    && arkState.rootLock === null && floatingState.rootLock === null && lucideState.rootLock === null
    && stagedExcludes.every((value) => excludes.has(value)) && !publicActive;
} else if (state === 'dependencies-installed-pending-certification') {
  valid = packageAligned && rootLockAligned && resolvedAligned && stagedExcludes.every((value) => !excludes.has(value)) && !publicActive;
} else {
  valid = packageAligned && rootLockAligned && resolvedAligned && stagedExcludes.every((value) => !excludes.has(value)) && publicActive;
}

if (!valid) {
  console.error('\nM5 activation state is internally inconsistent. Run npm run interactions:check for exact diagnostics.');
  process.exit(1);
}

if (state === 'blocked-pending-m4-certification') console.log('\nM5 source is staged; M4 must reach active-certified before M5 dependency activation.');
else if (state === 'blocked-pending-registry-access') console.log('\nM4 is certified; M5 direct dependency installation is waiting for npm registry access.');
else if (state === 'dependencies-installed-pending-certification') console.log('\nM5 direct dependencies are governed and compiler-active; public API promotion is pending targeted certification.');
else if (state === 'active-pending-release-certification') console.log('\nM5 public API is active; complete production release certification remains pending.');
else console.log('\nM5 primitive interaction architecture is release-certified.');
