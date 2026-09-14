import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const requireFile = (file) => {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing M4 file: ${file}`);
};
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const required = [
  'src/design-system/foundation.ts',
  'src/design-system/system.ts',
  'src/design-system/WorkManagementDesignSystemProvider.tsx',
  'src/design-system/primitives/layout.tsx',
  'src/design-system/primitives/surface.tsx',
  'src/design-system/primitives/typography.tsx',
  'src/design-system/primitives/index.ts',
  'src/design-system/index.ts',
  'config/stage-b-m4-design-system-target.ts',
  'scripts/report-stage-b-m4.mjs',
  'scripts/activate-stage-b-m4.mjs',
  'verify-stage-b-m4-vendor-type-compatibility.mjs',
  'docs/WORK-MANAGEMENT-REACT-DESIGN-SYSTEM.md',
];
required.forEach(requireFile);

const foundation = read('src/design-system/foundation.ts');
const system = read('src/design-system/system.ts');
const provider = read('src/design-system/WorkManagementDesignSystemProvider.tsx');
const publicApi = read('src/design-system/index.ts');
const cssTokens = read('assets/css/foundation/tokens.css');
const cssThemes = read('assets/css/foundation/themes.css');
const packageJson = JSON.parse(read('package.json'));
const tsconfig = JSON.parse(read('tsconfig.json'));
const lock = JSON.parse(read('package-lock.json'));
const lockRoot = lock.packages?.[''] ?? {};
const target = read('config/stage-b-m4-design-system-target.ts');
const composition = read('src/app/composition/ApplicationCompositionRoot.tsx');
const reactShell = read('src/app/shell/WorkManagementShell.tsx');
const activationTool = read('scripts/activate-stage-b-m4.mjs');

assert(tsconfig.compilerOptions?.strict === true, 'M4 must retain strict TypeScript.');
assert(tsconfig.compilerOptions?.exactOptionalPropertyTypes === true, 'M4 must retain exactOptionalPropertyTypes for Work Management source.');
assert(tsconfig.compilerOptions?.skipLibCheck === true, 'M4 must skip third-party declaration internals to remain compatible with Chakra/Ark/Zag published types.');
assert(packageJson.scripts?.['vendor-types:check'] === 'node verify-stage-b-m4-vendor-type-compatibility.mjs', 'M4 vendor declaration compatibility gate must remain governed.');

const cssVarRefs = [...foundation.matchAll(/wmCssVariable\('(--wm-[^']+)'\)/g)].map((match) => match[1]);
assert(cssVarRefs.length >= 45, 'M4 must bridge a substantial set of authoritative --wm-* tokens.');
for (const variable of cssVarRefs) {
  assert(cssTokens.includes(variable) || cssThemes.includes(variable), `M4 references missing CSS token: ${variable}`);
}

assert(system.includes('preflight: false'), 'Chakra preflight must remain disabled during the legacy-runtime migration.');
assert(system.includes("cssVarsRoot: ':where(#app)'"), 'Chakra variables must be scoped to the React application root.');
assert(system.includes("cssVarsPrefix: 'wm-react'"), 'Chakra variables require a Work Management namespace.');
assert(system.includes('workManagementSemanticColors'), 'Chakra semantic tokens must bridge Work Management semantic colors.');
assert(!/#(?:[0-9a-f]{3}){1,2}\b/i.test(system), 'The Chakra system must not introduce hard-coded hex palette values.');
assert(!system.includes('_dark') && !system.includes('dark:'), 'Theme state must remain authoritative in existing --wm-* semantic variables.');
assert(provider.includes('ChakraProvider'), 'The product-owned provider must wrap ChakraProvider.');
assert(provider.includes('workManagementSystem'), 'The product-owned provider must use the governed Work Management Chakra system.');
assert(!publicApi.includes('@chakra-ui/react'), 'The public Work Management Design System API must not re-export Chakra.');

const primitiveSource = [
  read('src/design-system/primitives/layout.tsx'),
  read('src/design-system/primitives/surface.tsx'),
  read('src/design-system/primitives/typography.tsx'),
].join('\n');
for (const primitive of ['wm-stack', 'wm-cluster', 'wm-grid', 'wm-page', 'wm-section', 'wm-surface', 'wm-divider', 'wm-kicker', 'wm-visually-hidden']) {
  assert(primitiveSource.includes(primitive), `React primitive bridge is missing ${primitive}.`);
}

const forbiddenDirectDependencies = [
  'framer-motion',
  'motion',
  '@tanstack/react-table',
  '@tanstack/react-virtual',
  'react-hook-form',
  '@dnd-kit/core',
  'lexical',
];
for (const dependency of forbiddenDirectDependencies) {
  assert(!(dependency in (packageJson.dependencies ?? {})) && !(dependency in (packageJson.devDependencies ?? {})), `${dependency} belongs to a later milestone and must not be introduced directly by M4.`);
}

// M24 may legitimately introduce Apache ECharts after M4. Its presence is governed by
// the M24 FuelTrack+ stabilization target rather than attributed retroactively to M4.
if ('echarts' in (packageJson.dependencies ?? {}) || 'echarts' in (packageJson.devDependencies ?? {})) {
  assert(fs.existsSync(path.join(root, 'config/stage-e-m24-fueltrack-stabilization-target.ts')), 'ECharts is only permitted when the M24 FuelTrack+ stabilization target is present.');
  const m24Target = read('config/stage-e-m24-fueltrack-stabilization-target.ts');
  const dependencyMatch = m24Target.match(/newExternalDependency:\s*'echarts@([^']+)'/);
  assert(dependencyMatch, 'M24 target must govern the exact ECharts dependency before it may appear after M4.');
  const version = dependencyMatch[1];
  assert(packageJson.dependencies?.echarts === version, 'Direct ECharts ownership must match the exact governed M24 target.');
  assert(packageJson.devDependencies?.echarts === undefined, 'ECharts must remain a governed runtime dependency, not a devDependency.');
  assert(lockRoot.dependencies?.echarts === version, 'package-lock root must align ECharts with the governed M24 target.');
  assert(lock.packages?.['node_modules/echarts']?.version === version, 'package-lock ECharts package entry must match the governed M24 target.');
}

// M8 may legitimately introduce TanStack Query after M4. Its presence is governed by
// the M8 server-state target rather than attributed retroactively to M4.
if ('@tanstack/react-query' in (packageJson.dependencies ?? {}) || '@tanstack/react-query' in (packageJson.devDependencies ?? {})) {
  assert(fs.existsSync(path.join(root, 'config/stage-b-m8-tanstack-query-target.ts')), '@tanstack/react-query is only permitted when the M8 TanStack Query target is present.');
  const m8Target = read('config/stage-b-m8-tanstack-query-target.ts');
  const packageMatch = m8Target.match(/package:\s*'([^']+)'/);
  const versionMatch = m8Target.match(/version:\s*'([^']+)'/);
  assert(packageMatch?.[1] === '@tanstack/react-query', 'M8 target must govern @tanstack/react-query before it may appear after M4.');
  assert(versionMatch, 'M8 target must declare the exact @tanstack/react-query version.');
  assert(packageJson.dependencies?.['@tanstack/react-query'] === versionMatch[1], 'Direct @tanstack/react-query ownership must match the exact governed M8 target.');
  assert(packageJson.devDependencies?.['@tanstack/react-query'] === undefined, '@tanstack/react-query must remain a governed runtime dependency, not a devDependency.');
  assert(lockRoot.dependencies?.['@tanstack/react-query'] === versionMatch[1], 'package-lock root must align @tanstack/react-query with the governed M8 target.');
  assert(lock.packages?.['node_modules/@tanstack/react-query']?.version === versionMatch[1], 'package-lock TanStack Query package entry must match the governed M8 target.');
}

// M9 may legitimately introduce Zustand after M4. Its presence is governed by
// the M9 client-state target rather than attributed retroactively to M4.
if ('zustand' in (packageJson.dependencies ?? {}) || 'zustand' in (packageJson.devDependencies ?? {})) {
  assert(fs.existsSync(path.join(root, 'config/stage-b-m9-client-state-target.ts')), 'Zustand is only permitted when the M9 client-state target is present.');
  const m9Target = read('config/stage-b-m9-client-state-target.ts');
  const packageMatch = m9Target.match(/package:\s*'([^']+)'/);
  const versionMatch = m9Target.match(/version:\s*'([^']+)'/);
  assert(packageMatch?.[1] === 'zustand', 'M9 target must govern Zustand before it may appear after M4.');
  assert(versionMatch, 'M9 target must declare the exact Zustand version.');
  assert(packageJson.dependencies?.zustand === versionMatch[1], 'Direct Zustand ownership must match the exact governed M9 target.');
  assert(packageJson.devDependencies?.zustand === undefined, 'Zustand must remain a governed runtime dependency, not a devDependency.');
  assert(lockRoot.dependencies?.zustand === versionMatch[1], 'package-lock root must align Zustand with the governed M9 target.');
  assert(lock.packages?.['node_modules/zustand']?.version === versionMatch[1], 'package-lock Zustand package entry must match the governed M9 target.');
}

// M6 may legitimately introduce Zod after M4. Its presence is governed by the
// M6 runtime-schema target rather than attributed retroactively to M4.
if ('zod' in (packageJson.dependencies ?? {}) || 'zod' in (packageJson.devDependencies ?? {})) {
  assert(fs.existsSync(path.join(root, 'config/stage-b-m6-runtime-schema-target.ts')), 'Zod is only permitted when the M6 runtime-schema target is present.');
  const m6Target = read('config/stage-b-m6-runtime-schema-target.ts');
  const zodMatch = m6Target.match(/zod:\s*'([^']+)'/);
  assert(zodMatch && packageJson.dependencies?.zod === zodMatch[1], 'Direct Zod ownership must match the governed M6 target.');
}

// M5 may legitimately introduce Ark/Floating/Lucide after M4. Their presence is
// governed by the M5 target contract rather than attributed retroactively to M4.
if (fs.existsSync(path.join(root, 'config/stage-b-m5-interaction-target.ts'))) {
  const m5Target = read('config/stage-b-m5-interaction-target.ts');
  for (const [name, pattern] of [
    ['@ark-ui/react', /arkReact:\s*'([^']+)'/],
    ['@floating-ui/react', /floatingReact:\s*'([^']+)'/],
    ['lucide-react', /lucideReact:\s*'([^']+)'/],
  ]) {
    const match = m5Target.match(pattern);
    assert(match, `M5 target must govern ${name} before it may appear after M4.`);
    const declared = packageJson.dependencies?.[name];
    if (declared !== undefined) assert(declared === match[1], `${name} must match the exact M5 governed target.`);
  }
}

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
  if (file.startsWith(`src${path.sep}design-system${path.sep}`)) continue;
  const content = read(file);
  assert(!content.includes('@chakra-ui/react'), `Chakra leaked outside the Work Management Design System boundary: ${file}`);
}

const chakraMatch = target.match(/chakraReact:\s*'([^']+)'/);
const emotionMatch = target.match(/emotionReact:\s*'([^']+)'/);
const stateMatch = target.match(/activationState:\s*'([^']+)'/);
assert(chakraMatch && emotionMatch && stateMatch, 'M4 target contract must declare exact dependency versions and activation state.');
const chakraVersion = chakraMatch[1];
const emotionVersion = emotionMatch[1];
const activationState = stateMatch[1];
assert(chakraVersion === '3.36.1', 'M4 Chakra target must remain exact and reviewable.');
assert(emotionVersion === '11.14.0', 'M4 Emotion target must remain exact and reviewable.');

const validStates = new Set([
  'blocked-pending-registry-access',
  'dependencies-installed-pending-certification',
  'active-pending-release-certification',
  'active-certified',
]);
assert(validStates.has(activationState), `Unknown M4 activation state: ${activationState}`);

const packageChakra = packageJson.dependencies?.['@chakra-ui/react'];
const packageEmotion = packageJson.dependencies?.['@emotion/react'];
const lockChakra = lock.packages?.['node_modules/@chakra-ui/react'];
const lockEmotion = lock.packages?.['node_modules/@emotion/react'];
const providerMounted = composition.includes('<WorkManagementDesignSystemProvider>');
const providerImported = composition.includes("from '../../design-system/index.ts'");

const assertGovernedRuntimeDependencies = () => {
  assert(packageChakra === chakraVersion, `package.json must exact-pin @chakra-ui/react@${chakraVersion}.`);
  assert(packageEmotion === emotionVersion, `package.json must exact-pin @emotion/react@${emotionVersion}.`);
  assert(lockRoot.dependencies?.['@chakra-ui/react'] === chakraVersion, 'package-lock root must align Chakra with package.json.');
  assert(lockRoot.dependencies?.['@emotion/react'] === emotionVersion, 'package-lock root must align Emotion with package.json.');
  assert(lockChakra?.version === chakraVersion, 'package-lock Chakra package entry must match the governed target.');
  assert(lockEmotion?.version === emotionVersion, 'package-lock Emotion package entry must match the governed target.');
  assert(/^sha512-/.test(lockChakra?.integrity ?? ''), 'package-lock Chakra integrity is required.');
  assert(/^sha512-/.test(lockEmotion?.integrity ?? ''), 'package-lock Emotion integrity is required.');
  assert(typeof lockChakra?.resolved === 'string' && lockChakra.resolved.startsWith('https://registry.npmjs.org/'), 'Chakra must resolve from the governed npm registry.');
  assert(typeof lockEmotion?.resolved === 'string' && lockEmotion.resolved.startsWith('https://registry.npmjs.org/'), 'Emotion must resolve from the governed npm registry.');
};

if (activationState === 'blocked-pending-registry-access') {
  assert(packageChakra === undefined && packageEmotion === undefined, 'Blocked M4 state must not claim runtime dependencies that are not lockfile-installed.');
  assert(lockChakra === undefined && lockEmotion === undefined, 'Blocked M4 state must keep the M3 lockfile truthful.');
  assert(!providerMounted && !providerImported, 'Blocked M4 state must not mount the unavailable provider.');
} else if (activationState === 'dependencies-installed-pending-certification') {
  assertGovernedRuntimeDependencies();
  assert(!providerMounted && !providerImported, 'Dependency-installed M4 state must keep the provider inactive until real-package type certification passes.');
} else {
  assertGovernedRuntimeDependencies();
  assert(providerMounted && providerImported, 'Active M4 states must mount WorkManagementDesignSystemProvider above the active presentation boundary.');
  assert(composition.includes('<WorkManagementShell />'), 'The M10 composition root must mount WorkManagementShell inside the design-system provider.');
  assert(composition.indexOf('<WorkManagementDesignSystemProvider>') < composition.indexOf('<WorkManagementShell />'), 'The design-system provider must wrap the M10 React shell.');
  assert(reactShell.includes('<RuntimeApplicationBoundary'), 'The M10 React shell must retain the M3 runtime route-content boundary beneath the provider.');
}

assert(packageJson.scripts?.['design-system:status'] === 'node scripts/report-stage-b-m4.mjs', 'M4 status command must remain governed.');
assert(packageJson.scripts?.['design-system:activate'] === 'node scripts/activate-stage-b-m4.mjs', 'M4 activation command must remain governed.');
assert(packageJson.scripts?.['design-system:activate:release'] === 'node scripts/activate-stage-b-m4.mjs --release', 'M4 release activation command must remain governed.');
assert(activationTool.includes("const registry = 'https://registry.npmjs.org/'"), 'M4 activation must preflight and install from the governed npm registry.');
assert(activationTool.includes("'--fetch-retries=0'"), 'M4 registry preflight must fail fast instead of hanging through npm retry defaults.');
assert(activationTool.includes("`@chakra-ui/react@${chakra}`") && activationTool.includes("`@emotion/react@${emotion}`"), 'M4 activation must install the target versions explicitly.');

for (const scriptName of ['check', 'release:check']) {
  const script = packageJson.scripts?.[scriptName] ?? '';
  const reactIndex = script.indexOf('npm run react:check');
  const designIndex = script.indexOf('npm run design-system:check');
  const typecheckIndex = script.indexOf('npm run typecheck');
  assert(reactIndex >= 0 && designIndex > reactIndex && typecheckIndex > designIndex, `${scriptName} must preserve React boundary -> design-system -> typecheck ordering.`);
}

const ciWorkflow = read('.github/workflows/ci.yml');
const deployWorkflow = read('.github/workflows/deploy-pages.yml');
assert(/Run Stage B Work Management React Design System source gate[\s\S]*npm run design-system:check/.test(ciWorkflow), 'CI must execute the M4 design-system gate.');
assert(/Run Stage B Work Management React Design System source gate[\s\S]*npm run design-system:check/.test(deployWorkflow), 'Deployment must execute the M4 design-system gate.');
assert(/Run M4 vendor declaration compatibility gate[\s\S]*npm run vendor-types:check/.test(ciWorkflow), 'CI must execute the M4 vendor declaration compatibility gate.');
assert(/Run M4 vendor declaration compatibility gate[\s\S]*npm run vendor-types:check/.test(deployWorkflow), 'Deployment must execute the M4 vendor declaration compatibility gate.');

console.log(`Stage B Milestone 4 React Design System verification: PASS (${cssVarRefs.length} CSS token bridges; state=${activationState})`);
