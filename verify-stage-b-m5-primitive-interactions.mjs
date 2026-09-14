import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const requireFile = (file) => assert(fs.existsSync(path.join(root, file)), `Missing M5 file: ${file}`);

const required = [
  'config/stage-b-m5-interaction-target.ts',
  'src/design-system/interactions/shared.ts',
  'src/design-system/interactions/button.tsx',
  'src/design-system/interactions/dialog.tsx',
  'src/design-system/interactions/menu.tsx',
  'src/design-system/interactions/popover.tsx',
  'src/design-system/interactions/tooltip.tsx',
  'src/design-system/interactions/tabs.tsx',
  'src/design-system/interactions/toggle.tsx',
  'src/design-system/interactions/collapsible.tsx',
  'src/design-system/interactions/floating.ts',
  'src/design-system/interactions/index.ts',
  'src/design-system/icons/index.tsx',
  'assets/css/foundation/interactions.css',
  'scripts/report-stage-b-m5.mjs',
  'scripts/activate-stage-b-m5.mjs',
  'docs/WORK-MANAGEMENT-PRIMITIVE-INTERACTIONS.md',
  'RELEASE-STATUS-v1.43.2-STAGE-B-M5-PRIMITIVE-INTERACTIONS.md',
  'M5-ACTIVATION-RUNBOOK.md',
];
required.forEach(requireFile);

const target = read('config/stage-b-m5-interaction-target.ts');
const m4Target = read('config/stage-b-m4-design-system-target.ts');
const pkg = json('package.json');
const lock = json('package-lock.json');
const tsconfig = json('tsconfig.json');
const publicApi = read('src/design-system/index.ts');
const css = read('assets/css/foundation/interactions.css');
const main = read('src/main.ts');
const activation = read('scripts/activate-stage-b-m5.mjs');
const rootLock = lock.packages?.[''] ?? {};

const targetValue = (pattern, label) => {
  const match = target.match(pattern);
  assert(match, `M5 target must declare ${label}.`);
  return match[1];
};
const ark = targetValue(/arkReact:\s*'([^']+)'/, 'Ark UI version');
const floating = targetValue(/floatingReact:\s*'([^']+)'/, 'Floating UI version');
const lucide = targetValue(/lucideReact:\s*'([^']+)'/, 'Lucide version');
const state = targetValue(/activationState:\s*'([^']+)'/, 'activation state');
const m4StateMatch = m4Target.match(/activationState:\s*'([^']+)'/);
assert(m4StateMatch, 'M4 activation state must remain readable by M5.');
const m4State = m4StateMatch[1];
assert(ark === '5.39.1', 'M5 Ark UI target must remain exact and reviewable.');
assert(floating === '0.27.20', 'M5 Floating UI target must remain exact and reviewable.');
assert(lucide === '1.41.0', 'M5 Lucide target must remain exact and reviewable.');
assert(tsconfig.compilerOptions?.strict === true, 'M5 must preserve strict Work Management TypeScript.');
assert(tsconfig.compilerOptions?.exactOptionalPropertyTypes === true, 'M5 must preserve exactOptionalPropertyTypes.');
assert(tsconfig.compilerOptions?.skipLibCheck === true, 'M5 must inherit the M4 vendor declaration compatibility boundary.');

const validStates = new Set([
  'blocked-pending-m4-certification',
  'blocked-pending-registry-access',
  'dependencies-installed-pending-certification',
  'active-pending-release-certification',
  'active-certified',
]);
assert(validStates.has(state), `Unknown M5 activation state: ${state}`);
assert(target.includes("prerequisite: 'stage-b-m4:active-certified'"), 'M5 must explicitly require M4 release certification.');
if (state !== 'blocked-pending-m4-certification') assert(m4State === 'active-certified', 'Any post-prerequisite M5 state requires M4 active-certified.');

const interactionFiles = required.filter((file) => file.startsWith('src/design-system/interactions/'));
const interactionSource = interactionFiles.map(read).join('\n');
for (const primitive of ['WMButton','WMIconButton','WMDialog','WMMenu','WMPopover','WMTooltip','WMTabs','WMCheckbox','WMSwitch','WMCollapsible','useWMFloatingLayer']) {
  assert(interactionSource.includes(primitive), `M5 Work Management interaction API missing ${primitive}.`);
}
for (const file of ['dialog.tsx','menu.tsx','popover.tsx','tooltip.tsx']) {
  const source = read(`src/design-system/interactions/${file}`);
  assert(source.includes('Portal'), `${file} must portal overlay content out of clipping/stacking contexts.`);
  assert(source.includes('lazyMount') && source.includes('unmountOnExit'), `${file} must keep the Ark root mounted while lazily managing portal content.`);
}
assert(read('src/design-system/interactions/dialog.tsx').includes("role?: 'dialog' | 'alertdialog'"), 'Dialog wrapper must support alertdialog semantics for destructive confirmations.');
assert(read('src/design-system/interactions/dialog.tsx').includes("role !== 'alertdialog'"), 'Alert dialogs must default to explicit outside-dismiss protection.');
assert(read('src/design-system/interactions/button.tsx').includes('aria-busy'), 'Button primitive must expose loading state accessibly.');
assert(read('src/design-system/interactions/button.tsx').includes('readonly label: string'), 'Icon button must require an accessible label.');
assert(read('src/design-system/interactions/tabs.tsx').includes('readonly ariaLabel: string'), 'Tabs list must require an accessible label.');
assert(!interactionSource.includes('onKeyDown='), 'M5 must delegate composite keyboard state machines to Ark rather than hand-building key handlers.');
assert(!interactionSource.includes('role="menu"') && !interactionSource.includes('role="tab"'), 'M5 must delegate composite ARIA roles to Ark primitives.');

const arkConsumers = ['dialog.tsx','menu.tsx','popover.tsx','tooltip.tsx','tabs.tsx','toggle.tsx','collapsible.tsx'];
for (const file of arkConsumers) assert(read(`src/design-system/interactions/${file}`).includes("from '@ark-ui/react/"), `${file} must use governed Ark UI subpath imports.`);
const floatingSource = read('src/design-system/interactions/floating.ts');
for (const token of ['autoUpdate','flip','offset','shift','size','useFloating']) assert(floatingSource.includes(token), `Floating adapter missing ${token}.`);
assert(floatingSource.includes('geometry only'), 'Floating UI adapter must document that focus/dismissal/ARIA remain owned by interaction primitives.');
const iconSource = read('src/design-system/icons/index.tsx');
assert(iconSource.includes("from 'lucide-react'"), 'M5 icon boundary must use governed Lucide React.');
assert(iconSource.includes('WMIconName') && iconSource.includes('Feature modules consume names, never Lucide imports'), 'Lucide must remain behind a Work Management-owned icon API.');

function walk(directory) {
  const absolute = path.join(root, directory);
  if (!fs.existsSync(absolute)) return [];
  const files = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(relative));
    else if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(relative);
  }
  return files;
}
for (const file of walk('src')) {
  if (file.startsWith(`src${path.sep}design-system${path.sep}interactions${path.sep}`)) continue;
  if (file === `src${path.sep}design-system${path.sep}icons${path.sep}index.tsx`) continue;
  const source = read(file);
  assert(!source.includes('@ark-ui/react'), `Ark UI leaked outside the Work Management interaction boundary: ${file}`);
  assert(!source.includes('@floating-ui/react'), `Floating UI leaked outside the Work Management positioning adapter: ${file}`);
  assert(!source.includes('lucide-react'), `Lucide leaked outside the Work Management icon boundary: ${file}`);
}

for (const variable of ['--wm-control-md','--wm-color-focus','--wm-focus-width','--wm-z-popover','--wm-z-modal','--wm-motion-fast','--wm-motion-press-scale','--wm-color-overlay']) {
  assert(css.includes(variable), `M5 interaction styles must consume ${variable}.`);
}
assert(css.includes('@media (prefers-reduced-motion:reduce)'), 'M5 interaction styles require a reduced-motion path.');
assert(!/transition\s*:\s*all\b/.test(css), 'M5 must not introduce transition: all.');
assert(!/https?:\/\//.test(css), 'M5 interaction CSS must not introduce remote visual dependencies.');
assert(main.includes("import '../assets/css/foundation/interactions.css';"), 'M5 interaction CSS must be loaded by the Vite entry.');

const stagedExcludes = ['src/design-system/interactions/**/*', 'src/design-system/icons/**/*'];
const excludes = new Set(tsconfig.exclude ?? []);
const publicActive = publicApi.includes("export * from './interactions/index.ts';") && publicApi.includes("export * from './icons/index.tsx';");
const depValues = { '@ark-ui/react': ark, '@floating-ui/react': floating, 'lucide-react': lucide };
const assertGovernedDependencies = () => {
  for (const [name, version] of Object.entries(depValues)) {
    assert(pkg.dependencies?.[name] === version, `package.json must exact-pin ${name}@${version}.`);
    assert(rootLock.dependencies?.[name] === version, `package-lock root must align direct M5 dependency ${name}.`);
    const entry = lock.packages?.[`node_modules/${name}`];
    assert(entry?.version === version, `package-lock top-level package entry must match ${name}@${version}.`);
    assert(/^sha512-/.test(entry?.integrity ?? ''), `package-lock integrity is required for ${name}.`);
    assert(typeof entry?.resolved === 'string' && entry.resolved.startsWith('https://registry.npmjs.org/'), `${name} must resolve from the governed npm registry.`);
  }
};
const assertNoDirectM5Dependencies = () => {
  for (const name of Object.keys(depValues)) {
    assert(pkg.dependencies?.[name] === undefined, `${state} must not claim direct ${name} ownership before governed M5 installation.`);
    assert(rootLock.dependencies?.[name] === undefined, `${state} must not claim ${name} as a root lock dependency before governed M5 installation.`);
  }
  // A top-level Ark package entry is allowed here because M4's Chakra dependency
  // can place Ark transitively before M5 takes direct ownership.
};

if (state === 'blocked-pending-m4-certification' || state === 'blocked-pending-registry-access') {
  assertNoDirectM5Dependencies();
  assert(stagedExcludes.every((item) => excludes.has(item)), 'Blocked M5 state must compiler-stage dependency-bearing source until direct packages exist.');
  assert(!publicActive, 'Blocked M5 state must not publish the unavailable interaction API.');
} else if (state === 'dependencies-installed-pending-certification') {
  assertGovernedDependencies();
  assert(stagedExcludes.every((item) => !excludes.has(item)), 'Dependency-installed M5 state must compile the real interaction source.');
  assert(!publicActive, 'Dependency-installed state must keep the public API inactive until type certification passes.');
} else {
  assertGovernedDependencies();
  assert(stagedExcludes.every((item) => !excludes.has(item)), 'Active M5 state must compile all interaction source.');
  assert(publicActive, 'Active M5 state must expose only the Work Management interaction/icon public boundaries.');
}

assert(pkg.scripts?.['interactions:check'] === 'node verify-stage-b-m5-primitive-interactions.mjs', 'M5 check command must remain governed.');
assert(pkg.scripts?.['interactions:status'] === 'node scripts/report-stage-b-m5.mjs', 'M5 status command must remain governed.');
assert(pkg.scripts?.['interactions:activate'] === 'node scripts/activate-stage-b-m5.mjs', 'M5 activation command must remain governed.');
assert(pkg.scripts?.['interactions:activate:release'] === 'node scripts/activate-stage-b-m5.mjs --release', 'M5 release activation command must remain governed.');
assert(activation.includes("getM4State() !== 'active-certified'"), 'M5 activation must hard-gate on M4 certification.');
assert(activation.includes("const registry = 'https://registry.npmjs.org/'"), 'M5 installation must use the governed npm registry.');
assert(activation.includes("'--fetch-retries=0'"), 'M5 registry preflight must fail fast.');
for (const gate of ['governance:check','security:check','react:check','design-system:check','corrective:check','vendor-types:check','csp-dist:check','interactions:check','lint:eslint','typecheck']) {
  assert(activation.includes(`'${gate}'`), `M5 activation must retain prerequisite/certification gate ${gate}.`);
}
assert(activation.includes('Keep a truthful dependency-installed state'), 'M5 activation must preserve installed dependency state when post-install certification fails.');

for (const scriptName of ['check', 'release:check']) {
  const script = pkg.scripts?.[scriptName] ?? '';
  const reactIndex = script.indexOf('npm run react:check');
  const m4Index = script.indexOf('npm run design-system:check');
  const correctiveIndex = script.indexOf('npm run corrective:check');
  const vendorIndex = script.indexOf('npm run vendor-types:check');
  const cspIndex = script.indexOf('npm run csp-dist:check');
  const m5Index = script.indexOf('npm run interactions:check');
  const typeIndex = script.indexOf('npm run typecheck');
  assert(reactIndex >= 0 && m4Index > reactIndex && correctiveIndex > m4Index && vendorIndex > correctiveIndex && cspIndex > vendorIndex && m5Index > cspIndex && typeIndex > m5Index, `${scriptName} must preserve React -> M4 -> corrective -> vendor boundary -> CSP serialization -> M5 -> typecheck ordering.`);
}
const ci = read('.github/workflows/ci.yml');
const deploy = read('.github/workflows/deploy-pages.yml');
assert(/Run M4 corrective integrity gate[\s\S]*npm run corrective:check/.test(ci), 'CI must retain the M4 corrective gate.');
assert(/Run M4 vendor declaration compatibility gate[\s\S]*npm run vendor-types:check/.test(ci), 'CI must retain the M4 vendor type gate.');
assert(/Run M4 production CSP serialization compatibility gate[\s\S]*npm run csp-dist:check/.test(ci), 'CI must retain the M4 CSP serialization gate.');
assert(/Run Stage B primitive interaction architecture gate[\s\S]*npm run interactions:check/.test(ci), 'CI must execute the M5 interaction gate.');
assert(/Run M4 corrective integrity gate[\s\S]*npm run corrective:check/.test(deploy), 'Deployment must retain the M4 corrective gate.');
assert(/Run M4 vendor declaration compatibility gate[\s\S]*npm run vendor-types:check/.test(deploy), 'Deployment must retain the M4 vendor type gate.');
assert(/Run M4 production CSP serialization compatibility gate[\s\S]*npm run csp-dist:check/.test(deploy), 'Deployment must retain the M4 CSP serialization gate.');
assert(/Run Stage B primitive interaction architecture gate[\s\S]*npm run interactions:check/.test(deploy), 'Deployment must execute the M5 interaction gate.');
const projectVerifier = read('verify-project.sh');
for (const file of ['config/stage-b-m5-interaction-target.ts','src/design-system/interactions/index.ts','src/design-system/icons/index.tsx','verify-stage-b-m5-primitive-interactions.mjs']) {
  assert(projectVerifier.includes(file), `Aggregate verifier must require ${file}.`);
}

console.log(`Stage B Milestone 5 Primitive Interaction Architecture verification: PASS (state=${state}; M4=${m4State})`);
