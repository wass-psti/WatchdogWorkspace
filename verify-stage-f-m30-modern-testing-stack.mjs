import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root=path.resolve(import.meta.dirname);
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const stateOf=(file)=>read(file).match(/activationState:\s*'([^']+)'/)?.[1]??'unknown';
const state=stateOf('config/stage-f-m30-modern-testing-stack-target.ts');
assert(['implementation-complete-pending-certification','active-pending-release-certification','active-certified'].includes(state),`Unexpected M30 activation state: ${state}`);
assert(stateOf('config/stage-f-m29-database-rls-test-suite-target.ts')==='active-certified','M30 requires M29 active-certified.');

const target=read('config/stage-f-m30-modern-testing-stack-target.ts');
const manifest=read('config/application-manifest.ts');
const manifestTypes=read('src/types/manifest.ts');
const manifestSchema=read('src/runtime-schemas/manifest.ts');
const config=read('vitest.config.mjs');
const playwrightConfig=read('playwright.config.mjs');
const browserRunner=read('scripts/run-modern-browser-tests.mjs');
const bootstrap=read('scripts/ensure-modern-test-toolchain.mjs');
const toolchainAuthority=read('scripts/lib/modern-test-toolchain.mjs');
const runner=read('scripts/run-modern-tests.mjs');
const pkg=JSON.parse(read('package.json'));
const project=read('verify-project.sh');
const ci=read('.github/workflows/ci.yml');
const deploy=read('.github/workflows/deploy-pages.yml');
const workflow=read('.github/workflows/modern-tests.yml');
const docs=read('docs/WORK-MANAGEMENT-MODERN-TESTING.md');
const runbook=read('M30-ACTIVATION-RUNBOOK.md');
const status=read('RELEASE-STATUS-v1.43.2-STAGE-F-M30-MODERN-TESTING-STACK.md');
const compatibilityHotfix=read('M30-MODERN-TESTING-TOOLCHAIN-COMPATIBILITY-HOTFIX.md');

const arch=Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1]??0);
assert(arch>=38,`M30 requires Architecture 38 or later, found ${arch}.`);
for(const marker of [
  "modernTesting: 'vitest-5-testing-library-playwright-v1'",
  "modernTestRoot: 'tests/modern'",
  "modernTestConfig: 'vitest.config.mjs'",
  "modernTestRunner: 'scripts/run-modern-tests.mjs'",
  "modernTestCoverage: 'v8-threshold-gate-v1'",
  "modernTestToolchain: 'isolated-exact-bootstrap-v1'",
]) assert(manifest.includes(marker),`Application manifest missing M30 marker: ${marker}`);
assert(manifestTypes.includes("modernTesting?: 'vitest-5-testing-library-playwright-v1'")&&manifestSchema.includes("modernTesting: z.literal('vitest-5-testing-library-playwright-v1').optional()"),'M30 manifest type/runtime schema authority missing.');
assert(manifest.includes('Architecture v38+')&&manifestSchema.includes('Architecture v38+'),'Architecture 38 manifest validators must enforce M30 testing authority.');

for(const marker of [
  "runner: 'vitest-5'",
  "domEnvironment: 'jsdom-27'",
  "reactTesting: 'testing-library-react-16'",
  "coverageProvider: 'vitest-v8-coverage-5'",
  'testFiles: 5',
  'testCases: 23',
  'assertionExpressions: 74',
  'statements: 75',
  'branches: 65',
  'functions: 75',
  'lines: 75',
  "jsdomNodeEngine: '^20.19.0 || ^22.12.0 || >=24.0.0'",
]) assert(target.includes(marker),`M30 target missing marker: ${marker}`);

const exact={
  vitest:'5.0.0',
  '@vitest/coverage-v8':'5.0.0',
  '@testing-library/dom':'10.4.1',
  '@testing-library/react':'16.3.3',
  '@testing-library/user-event':'14.6.7',
  '@testing-library/jest-dom':'7.0.1',
  jsdom:'27.4.0',
  '@playwright/test':'1.63.0',
};
for(const [name,version] of Object.entries(exact)) assert(toolchainAuthority.includes(`'${name}': '${version}'`)||toolchainAuthority.includes(`${name}: '${version}'`),`M30 governed toolchain authority must exact-pin ${name}@${version}.`);
assert(toolchainAuthority.includes("EXPECTED_JSDOM_NODE_ENGINE = '^20.19.0 || ^22.12.0 || >=24.0.0'")&&bootstrap.includes('EXPECTED_JSDOM_NODE_ENGINE'),'M30 bootstrap must consume the shared exact jsdom Node engine contract.');
for(const marker of ['--no-save','--package-lock=false','--ignore-scripts']) assert(toolchainAuthority.includes(marker),`M30 isolated bootstrap authority missing ${marker}.`);
assert(toolchainAuthority.includes("MODERN_TEST_TOOLCHAIN_WORKSPACE = '.wm-modern-test-toolchain'")&&toolchainAuthority.includes('materializeModernTestToolchain')&&bootstrap.includes('application lockfile tree preserved'),'M30 isolated bootstrap must materialize outside the application dependency root and verify that the lockfile-governed tree remains intact.');
assert(runner.includes("hash('package.json')")&&runner.includes("hash('package-lock.json')")&&runner.includes('modified package-lock.json'),'M30 runner must enforce package manifest/lockfile immutability.');

for(const marker of [
  "environment: 'jsdom'",
  "setupFiles: ['./tests/modern/setup.mjs']",
  "provider: 'v8'",
  "statements: 75",
  "branches: 65",
  "functions: 75",
  "lines: 75",
]) assert(config.includes(marker),`Vitest config missing M30 marker: ${marker}`);

const tests=[
  'tests/modern/unit/route-policy.test.mjs',
  'tests/modern/unit/board-virtualization.test.mjs',
  'tests/modern/unit/client-state-store.test.mjs',
  'tests/modern/component/button.test.mjs',
  'tests/modern/e2e/application-smoke.spec.mjs',
];
for(const file of tests) assert(fs.existsSync(path.join(root,file)),`M30 test missing: ${file}`);
const testSource=tests.map(read).join('\n');
const vitestSource=tests.slice(0,4).map(read).join('\n');
const e2eSource=read('tests/modern/e2e/application-smoke.spec.mjs');
assert((vitestSource.match(/\bit\(/g)??[]).length===22,'M30 Vitest baseline must contain exactly 22 unit/component cases.');
assert((e2eSource.match(/\btest\(/g)??[]).length===1,'M30 Playwright baseline must contain exactly one application smoke case.');
assert((testSource.match(/\bexpect\(/g)??[]).length===74,'M30 baseline must contain exactly 74 assertion expressions.');
for(const marker of ['route policy','board virtualization planner','Work Management client-state service','Work Management button primitives','boots the real Work Management login composition']) assert(testSource.includes(marker),`M30 representative suite missing ${marker}.`);
assert(read('tests/modern/component/button.test.mjs').includes('userEvent.setup()')&&read('tests/modern/component/button.test.mjs').includes("getByRole('button'"),'Component tests must exercise user-centric Testing Library interactions and accessible-role queries.');
assert(playwrightConfig.includes('tests/modern/e2e')&&playwrightConfig.includes('browserName')&&playwrightConfig.includes('chromium'),'M30 Playwright config must target the governed e2e root and Chromium-family browser.');
assert(browserRunner.includes('findBrowserBinary')&&browserRunner.includes('WM_PLAYWRIGHT_BASE_URL')&&browserRunner.includes('WM_PLAYWRIGHT_EXECUTABLE_PATH')&&browserRunner.includes("hash('package-lock.json')"),'M30 Playwright runner must reuse the certified system-browser discovery and preserve package-lock immutability.');

for(const script of ['modern-tests:check','modern-tests:test','modern-tests:coverage','modern-tests:e2e','modern-tests:status','modern-tests:activate','modern-tests:activate:release']) assert(pkg.scripts?.[script],`package.json missing ${script}.`);
assert(pkg.scripts.check.includes('modern-tests:check')&&pkg.scripts.check.includes('modern-tests:test'),'Normal check gate must execute M30 static + modern tests.');
assert(pkg.scripts['release:check'].includes('modern-tests:check')&&pkg.scripts['release:check'].includes('modern-tests:coverage')&&pkg.scripts['release:check'].includes('modern-tests:e2e'),'Release gate must execute M30 static + coverage-enforced unit/component tests + Playwright smoke.');
for(const workflowText of [ci,deploy]) assert(workflowText.includes('Stage F M30 Modern testing stack')&&workflowText.includes('npm run modern-tests:check'),'CI/deployment workflows must enforce M30 static architecture.');
assert(ci.includes('npm run modern-tests:test'),'CI must execute M30 modern unit/component tests.');
assert(workflow.includes('npm run modern-tests:check')&&workflow.includes('npm run modern-tests:test')&&workflow.includes('npm run modern-tests:coverage')&&workflow.includes('npm run modern-tests:e2e'),'Dedicated M30 workflow must execute static, unit/component, coverage, and Playwright gates.');
assert(project.includes('verify-stage-f-m30-modern-testing-stack.mjs'),'verify-project.sh must include M30 verifier.');
assert(docs.includes('Vitest 5')&&docs.includes('jsdom 27.4.0')&&docs.includes('^20.19.0 || ^22.12.0 || >=24.0.0')&&docs.includes('Testing Library')&&docs.includes('Playwright')&&docs.includes('bounded-CDP')&&docs.includes('pgTAP')&&docs.includes('package-lock'),'M30 documentation must explain the corrected modern stack, Node-compatible jsdom contract, and retained specialized compatibility boundaries.');
assert(compatibilityHotfix.includes('jsdom@27.4.0')&&compatibilityHotfix.includes('Node 22.16.0')&&compatibilityHotfix.includes('EBADENGINE'),'M30 compatibility hotfix must preserve trigger, governed Node baseline, and corrective jsdom pin provenance.');
assert(runbook.includes('modern-tests:coverage')&&runbook.includes('stage-f:certify'),'M30 activation runbook must include coverage and Stage F certification.');
assert(status.includes('implementation-complete-pending-certification')&&status.includes('Architecture 38')&&status.includes('jsdom is exact-pinned at 27.4.0'),'M30 release status must record pending certification, Architecture 38, and the corrective jsdom authority.');

const lockHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'package-lock.json'))).digest('hex');
assert(lockHash==='22677ed5a0abd2997e57691e200fa80bd9e11ab1a824a6b64b18048adb2f8b84',`M30 must preserve M29 application package-lock; found ${lockHash}.`);
for(const name of Object.keys(exact)) {
  assert(!(name in (pkg.devDependencies??{}))&&!(name in (pkg.dependencies??{})),`M30 isolated tool ${name} must not be added to application package dependency authority.`);
}
const result=spawnSync(process.execPath,['--experimental-strip-types','--disable-warning=ExperimentalWarning','config/stage-f-m30-modern-testing-stack-target.ts'],{cwd:root,encoding:'utf8'});
assert(result.status===0,`M30 target TypeScript parse failed: ${result.stderr}`);
console.log(`Stage F Milestone 30 Modern testing stack verification: PASS (state=${state}; architecture=${arch}; testFiles=5; cases=23; assertions=74; coverage=75/65/75/75; runner=vitest-5)`);
