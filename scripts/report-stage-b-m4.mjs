import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));
const target = read('config/stage-b-m4-design-system-target.ts');
const pkg = json('package.json');
const lock = json('package-lock.json');
const composition = read('src/app/composition/ApplicationCompositionRoot.tsx');

const match = (pattern, label) => {
  const result = target.match(pattern);
  if (!result) throw new Error(`Unable to read ${label} from Stage B M4 target contract.`);
  return result[1];
};

const chakra = match(/chakraReact:\s*'([^']+)'/, 'Chakra version');
const emotion = match(/emotionReact:\s*'([^']+)'/, 'Emotion version');
const state = match(/activationState:\s*'([^']+)'/, 'activation state');
const rootLock = lock.packages?.[''] ?? {};

const packageChakra = pkg.dependencies?.['@chakra-ui/react'] ?? null;
const packageEmotion = pkg.dependencies?.['@emotion/react'] ?? null;
const lockChakra = lock.packages?.['node_modules/@chakra-ui/react']?.version ?? null;
const lockEmotion = lock.packages?.['node_modules/@emotion/react']?.version ?? null;
const providerMounted = composition.includes('<WorkManagementDesignSystemProvider>');

console.log('Stage B Milestone 4 React Design System status');
console.log('------------------------------------------------');
console.log(`Activation state: ${state}`);
console.log(`Target @chakra-ui/react: ${chakra}`);
console.log(`Target @emotion/react: ${emotion}`);
console.log(`package.json Chakra: ${packageChakra ?? 'not declared'}`);
console.log(`package.json Emotion: ${packageEmotion ?? 'not declared'}`);
console.log(`package-lock Chakra: ${lockChakra ?? 'not locked'}`);
console.log(`package-lock Emotion: ${lockEmotion ?? 'not locked'}`);
console.log(`Provider mounted: ${providerMounted ? 'YES' : 'NO'}`);
console.log(`Lock root aligned: ${JSON.stringify(rootLock.dependencies ?? {}) === JSON.stringify(pkg.dependencies ?? {}) ? 'YES' : 'NO'}`);

const installedState = state !== 'blocked-pending-registry-access';
const packageAligned = packageChakra === chakra && packageEmotion === emotion;
const lockAligned = rootLock.dependencies?.['@chakra-ui/react'] === chakra
  && rootLock.dependencies?.['@emotion/react'] === emotion
  && lockChakra === chakra
  && lockEmotion === emotion;

let valid = true;
if (!installedState) {
  valid = packageChakra === null && packageEmotion === null && lockChakra === null && lockEmotion === null && !providerMounted;
} else if (state === 'dependencies-installed-pending-certification') {
  valid = packageAligned && lockAligned && !providerMounted;
} else {
  valid = packageAligned && lockAligned && providerMounted;
}

if (!valid) {
  console.error('\nM4 activation state is internally inconsistent. Run npm run design-system:check for exact diagnostics.');
  process.exit(1);
}

if (state === 'active-certified') {
  console.log('\nM4 state is release-certified.');
} else if (state === 'active-pending-release-certification') {
  console.log('\nProvider is active; full release certification remains pending.');
} else if (state === 'dependencies-installed-pending-certification') {
  console.log('\nDependencies are governed and locked; provider activation remains pending targeted certification.');
} else {
  console.log('\nRuntime activation remains blocked until the governed packages can be installed from npm.');
}
