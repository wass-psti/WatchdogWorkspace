import fs from 'node:fs';
import process from 'node:process';
const fail = (message) => { console.error(`M99 CDP startup portability corrective verification FAILED: ${message}`); process.exit(1); };
const read = (path) => { if (!fs.existsSync(path)) fail(`required file missing: ${path}`); return fs.readFileSync(path, 'utf8'); };
const driver = read('scripts/lib/browser-cdp-smoke.mjs');
const vector = read('scripts/verify-vite-browser-cdp-execution.mjs');
const workflow = read('.github/workflows/service-worker-updates.yml');

const certification = read('scripts/certify-stage-i-m99-local.sh');
const orderingNeedle = `npm run verify:preview
# verify:preview`;
if (!certification.includes(orderingNeedle)) {
  fail('certification harness no longer documents the verify:preview dependency-restoration boundary');
}
const previewToBrowser = /npm run verify:preview[\s\S]{0,900}?npm run modern-tests:toolchain:ensure[\s\S]{0,500}?npm run test:m99:sidebar/g;
const guardedBrowserGates = certification.match(previewToBrowser) ?? [];
if (guardedBrowserGates.length < 2) {
  fail(`expected Stage 6 and Stage 11 to re-bootstrap the governed Playwright toolchain after verify:preview; found ${guardedBrowserGates.length}`);
}
if (/npm run verify:preview\s*\nnpm run test:m99:sidebar/.test(certification)) {
  fail('an unguarded verify:preview -> M99 Playwright transition remains in certification');
}
const requiredDriverContracts = [
  'DEFAULT_DEVTOOLS_STARTUP_TIMEOUT_MS = 45_000',
  'DEFAULT_DEVTOOLS_PAGE_TARGET_TIMEOUT_MS = 10_000',
  'pageTargetTimeoutMs = DEFAULT_DEVTOOLS_PAGE_TARGET_TIMEOUT_MS',
  'targetDeadline = Math.max(',
  'Date.now() + Math.max(1_000, pageTargetTimeoutMs)',
  '/json/list',
  '/json/new?about%3Ablank',
  'Chromium DevTools endpoint startup timed out before becoming reachable.',
  'Chromium DevTools page target startup timed out after the endpoint became reachable.',
];
for (const contract of requiredDriverContracts) if (!driver.includes(contract)) fail(`driver contract missing: ${contract}`);
if (driver.includes('startupTimeoutMs = 15_000')) fail('legacy 15-second shared CDP startup budget is still active');
for (const contract of ['DEFAULT_DEVTOOLS_STARTUP_TIMEOUT_MS','DEFAULT_DEVTOOLS_PAGE_TARGET_TIMEOUT_MS','wallClockCeiling']) if (!vector.includes(contract)) fail(`execution-vector contract missing: ${contract}`);
if (/startupTimeoutMs:\s*15_000/.test(vector)) fail('execution vector still pins the obsolete 15-second startup limit');
if (!workflow.includes('run: npm run verify:preview')) fail('Service Worker Update Strategy no longer exercises production preview');
console.log('M99 CDP startup portability corrective verification: PASS (startupBudget=45000ms; pageTargetBudget=10000ms; phaseBudgetsSeparated=true; previewGatePreserved=true; playwrightRebootstrapAfterPreview=true)');
