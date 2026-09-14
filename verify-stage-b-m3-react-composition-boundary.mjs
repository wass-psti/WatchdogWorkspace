import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const pass = (message) => console.log(`PASS ${message}`);
const pkg = json('package.json');
const lock = json('package-lock.json');
const rootLock = lock.packages?.[''];
const tsconfig = json('tsconfig.json');

assert.equal(pkg.dependencies?.react, '19.2.8');
assert.equal(pkg.dependencies?.['react-dom'], '19.2.8');
assert.equal(pkg.devDependencies?.['@types/react'], '19.2.18');
assert.equal(pkg.devDependencies?.['@types/react-dom'], '19.2.5');
assert.equal(rootLock?.dependencies?.react, '19.2.8');
assert.equal(rootLock?.dependencies?.['react-dom'], '19.2.8');
assert.equal(rootLock?.devDependencies?.['@types/react'], '19.2.18');
assert.equal(rootLock?.devDependencies?.['@types/react-dom'], '19.2.5');
assert.equal(lock.packages?.['node_modules/react']?.version, '19.2.8');
assert.equal(lock.packages?.['node_modules/react-dom']?.version, '19.2.8');
assert.equal(lock.packages?.['node_modules/react-dom']?.dependencies?.scheduler, '^0.27.0');
assert.equal(lock.packages?.['node_modules/scheduler']?.version, '0.27.0');
assert.match(lock.packages?.['node_modules/react']?.integrity || '', /^sha512-/);
assert.match(lock.packages?.['node_modules/react-dom']?.integrity || '', /^sha512-/);
pass('React 19.2 runtime and TypeScript packages are exact-pinned and lockfile aligned');

assert.equal(tsconfig.compilerOptions?.jsx, 'react-jsx');
assert.equal(tsconfig.compilerOptions?.strict, true);
assert.equal(tsconfig.compilerOptions?.allowJs, false);
pass('strict TypeScript enables the automatic React JSX runtime');

const manifest = read('config/application-manifest.ts');
assert.match(manifest, /compositionRoot: 'src\/app\/composition\/mount-react-composition\.tsx'/);
assert.match(manifest, /serviceComposition: 'assets\/js\/runtime\/platform-services\.ts'/);
assert.match(manifest, /frontendPlatform: 'react-19\.2'/);
assert.match(manifest, /presentationBoundary: 'react-composition-(?:legacy-runtime|runtime-content)'/);
pass('application manifest declares React composition while retaining typed service composition');

for (const file of [
  'src/app/composition/mount-react-composition.tsx',
  'src/app/composition/ApplicationCompositionRoot.tsx',
  'src/app/composition/RuntimeApplicationBoundary.tsx',
  'src/app/composition/runtime-adapter.ts',
  'src/app/composition/runtime-host.ts',
]) assert.ok(fs.existsSync(file), `missing M3 composition module: ${file}`);

const main = read('src/main.ts');
assert.match(main, /mountReactComposition/);
assert.match(main, /querySelector<HTMLElement>\('#app'\)/);
assert.doesNotMatch(main, /import\('\.\.\/assets\/js\/app\.ts'\)/);
pass('Vite entry delegates root ownership to the React composition layer');

const mount = read('src/app/composition/mount-react-composition.tsx');
assert.match(mount, /createRoot/);
assert.match(mount, /compositionRoot\.render\(<ApplicationCompositionRoot \/>\)/);
assert.match(mount, /identifierPrefix: 'wm-'/);
assert.doesNotMatch(mount, /StrictMode/);
pass('React createRoot is a page-lifetime singleton and Strict Mode is intentionally deferred');

const boundary = read('src/app/composition/RuntimeApplicationBoundary.tsx');
assert.match(boundary, /data-wm-runtime-host/);
assert.match(boundary, /mountRuntimeApplication\(host\)/);
assert.doesNotMatch(boundary, /useState/);
assert.doesNotMatch(boundary, /dangerouslySetInnerHTML/);
pass('runtime content is hosted as an external DOM island without React re-rendering its descendants');

const adapter = read('src/app/composition/runtime-adapter.ts');
assert.match(adapter, /startupHost/);
assert.match(adapter, /startupPromise/);
assert.match(adapter, /import\('\.\.\/\.\.\/\.\.\/assets\/js\/app\.ts'\)/);
assert.match(adapter, /wm:vite-preload-recovery:1\.43\.2/);
pass('legacy shell starts through one typed singleton adapter and owns preload recovery completion');

const legacyHost = read('src/app/composition/runtime-host.ts');
assert.match(legacyHost, /__WM_RUNTIME_CONTENT_HOST__/);
assert.match(legacyHost, /data-wm-runtime-host/);
assert.doesNotMatch(legacyHost, /querySelector<HTMLElement>\('#app'\)/);

const app = read('assets/js/app.ts');
assert.match(app, /resolveRuntimeApplicationHost/);
assert.doesNotMatch(app, /querySelector<HTMLElement>\('#app'\)/);
pass('imperative shell no longer claims the React-owned #app container');

const appCss = read('assets/css/app.css');
assert.match(appCss, /\[data-wm-runtime-host\]\.motion-enter/);
assert.doesNotMatch(appCss, /#app\.motion-enter/);
pass('legacy route motion remains attached to the runtime content host after ownership separation');

const reactImportPattern = /(?:from\s+|import\()['"](?:react|react-dom(?:\/client)?|react\/jsx-runtime)['"]/;
const forbiddenRoots = ['assets/js', 'src/features', 'src/platform'];
for (const root of forbiddenRoots) {
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(file);
      else if (/\.tsx?$/.test(entry.name)) assert.doesNotMatch(read(file), reactImportPattern, `${file} bypasses the M3 React composition boundary`);
    }
  }
}
pass('existing platform/features remain React-free compatibility authorities during M3');

const index = read('index.html');
assert.match(index, /<div id="app"><\/div>/);
assert.match(index, /type="module" src="\/src\/main\.ts"/);

assert.equal(pkg.scripts?.['react:check'], 'node verify-stage-b-m3-react-composition-boundary.mjs');
for (const scriptName of ['check', 'release:check']) {
  const script = pkg.scripts?.[scriptName] || '';
  const securityIndex = script.indexOf('npm run security:check');
  const reactIndex = script.indexOf('npm run react:check');
  const typecheckIndex = script.indexOf('npm run typecheck');
  assert.ok(securityIndex >= 0 && reactIndex > securityIndex && typecheckIndex > reactIndex, `${scriptName} must keep security -> React boundary -> typecheck ordering`);
}
pass('M3 architecture verification is mandatory in check and release gates');

const ciWorkflow = read('.github/workflows/ci.yml');
const deployWorkflow = read('.github/workflows/deploy-pages.yml');
assert.match(ciWorkflow, /Run Stage B React 19\.2 composition boundary gate[\s\S]*npm run react:check/);
assert.match(deployWorkflow, /Run Stage B React 19\.2 composition boundary gate[\s\S]*npm run react:check/);

const projectVerifier = read('verify-project.sh');
for (const requiredM3Artifact of [
  'src/app/composition/mount-react-composition.tsx',
  'src/app/composition/ApplicationCompositionRoot.tsx',
  'src/app/composition/RuntimeApplicationBoundary.tsx',
  'src/app/composition/runtime-adapter.ts',
  'src/app/composition/runtime-host.ts',
  'docs/REACT-19-COMPOSITION-BOUNDARY.md',
  'verify-stage-b-m3-react-composition-boundary.mjs',
]) assert.match(projectVerifier, new RegExp(requiredM3Artifact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
pass('CI, deployment, and aggregate verification require the M3 composition boundary contract');

for (const documentation of [
  'docs/REACT-19-COMPOSITION-BOUNDARY.md',
  'RELEASE-STATUS-v1.43.2-STAGE-B-M3-REACT-COMPOSITION-BOUNDARY.md',
]) assert.ok(fs.existsSync(documentation), `missing M3 documentation: ${documentation}`);

console.log('Stage B Milestone 3 React 19.2 composition boundary verification: PASS');
