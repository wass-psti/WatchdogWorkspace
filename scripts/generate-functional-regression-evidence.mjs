import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const evidenceDir = path.join(root, 'm37-evidence');
fs.mkdirSync(evidenceDir, { recursive: true });
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const inventory = JSON.parse(read('regression-baseline/m37-functional-regression-inventory.json'));
const policy = JSON.parse(read('config/functional-regression-baseline-policy.json'));
const sourceAuthorities = [
  'assets/js/app.ts',
  'assets/js/core/auth.ts',
  'src/app/management/AuthenticatedManagementUI.tsx',
  'src/app/management/authenticated-management-ui-runtime.ts',
  'src/app/boards/board-presentation-host.ts',
  'assets/js/features/boards/data/board-repository.ts',
  'tests/modern/e2e/functional-regression-baseline.spec.mjs',
  'tests/modern/e2e/helpers/m37-regression-probe.mjs',
  'tests/modern/e2e/helpers/m37-supabase-fixture.mjs',
  'scripts/run-modern-browser-tests.mjs',
  'scripts/run-functional-regression-browser.mjs',
];
const expectedBrowserFiles = Object.freeze([
  'unconfigured-account.json',
  'unconfigured-boards.json',
  'unconfigured-settings.json',
  'unconfigured-users.json',
  'fixture-account.json',
  'fixture-boards.json',
  'fixture-settings.json',
  'fixture-users.json',
]);
const browserEvidence = fs.readdirSync(evidenceDir)
  .filter((name) => name.endsWith('.json') && name !== 'M37-FUNCTIONAL-REGRESSION-REPORT.json')
  .sort()
  .map((name) => {
    try { return { file: name, evidence: JSON.parse(fs.readFileSync(path.join(evidenceDir, name), 'utf8')) }; }
    catch (error) { return { file: name, error: error instanceof Error ? error.message : String(error) }; }
  });
const byName = new Map(browserEvidence.map((entry) => [entry.file, entry]));
const credentialPattern = /m37\.fixture\.access\.token|m37-fixture-refresh-token|sb_publishable_m37_regression_fixture|Bearer\s+(?!\[redacted\])\S+/i;
const containsCredentialMaterial = (value) => {
  if (typeof value === 'string') return credentialPattern.test(value);
  if (Array.isArray(value)) return value.some(containsCredentialMaterial);
  if (value && typeof value === 'object') return Object.entries(value).some(([key, item]) => /access_token|refresh_token|authorization|apikey|password/i.test(key) ? item !== '[redacted]' : containsCredentialMaterial(item));
  return false;
};
const scenarioStatus = expectedBrowserFiles.map((file) => {
  const entry = byName.get(file);
  const evidence = entry?.evidence;
  const complete = Boolean(
    evidence
    && evidence.schemaVersion === 1
    && evidence.milestone === 37
    && evidence.summary?.characterized === true
    && evidence.summary?.reproduced === true
    && !evidence.summary?.harnessError,
  );
  return {
    file,
    present: Boolean(entry),
    complete,
    characterized: evidence?.summary?.characterized === true,
    reproduced: evidence?.summary?.reproduced === true,
    harnessError: evidence?.summary?.harnessError ?? null,
  };
});
const credentialsCaptured = browserEvidence.some((entry) => containsCredentialMaterial(entry.evidence));
const browserCharacterizationComplete = scenarioStatus.every((entry) => entry.complete) && !credentialsCaptured;
const report = {
  schemaVersion: 1,
  milestone: 37,
  stage: 'G',
  generatedAt: new Date().toISOString(),
  status: browserCharacterizationComplete ? 'browser-evidence-collected' : 'source-baseline-generated-browser-evidence-pending',
  policy: { architectureVersion: policy.architectureVersion, failClosed: policy.failClosed, requiredEvidence: policy.requiredEvidence },
  inventorySummary: {
    total: inventory.entries.length,
    critical: inventory.entries.filter((entry) => entry.severity === 'critical').length,
    high: inventory.entries.filter((entry) => entry.severity === 'high').length,
    medium: inventory.entries.filter((entry) => entry.severity === 'medium').length,
    modules: ['boards', 'users', 'settings', 'account'],
  },
  sourceAuthorities: Object.fromEntries(sourceAuthorities.map((file) => [file, sha256(file)])),
  expectedBrowserFiles,
  scenarioStatus,
  browserEvidence,
  security: {
    credentialMaterialCaptured: credentialsCaptured,
  },
  completion: {
    sourceCharacterizationComplete: true,
    browserCharacterizationComplete,
    remediationComplete: false,
    productionReady: false,
  },
};
fs.writeFileSync(path.join(evidenceDir, 'M37-FUNCTIONAL-REGRESSION-REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
const markdown = `# M37 Functional Regression Baseline Evidence\n\n- Generated: ${report.generatedAt}\n- Status: **${report.status}**\n- Inventory entries: **${report.inventorySummary.total}**\n- Source characterization: **complete**\n- Browser characterization: **${report.completion.browserCharacterizationComplete ? 'complete' : 'pending'}**\n- Credential material captured: **${report.security.credentialMaterialCaptured ? 'YES - FAIL' : 'no'}**\n- Remediation: **not part of M37**\n- Production ready: **no**\n\n## Scope\n\nBoards, Users, Settings, and Account.\n\n## Evidence policy\n\n${policy.requiredEvidence.map((item) => `- ${item}`).join('\n')}\n\n## Scenario status\n\n${scenarioStatus.map((entry) => `- ${entry.file}: ${entry.complete ? 'complete' : 'pending'}${entry.harnessError ? ` — ${entry.harnessError}` : ''}`).join('\n')}\n`;
fs.writeFileSync(path.join(evidenceDir, 'M37-FUNCTIONAL-REGRESSION-REPORT.md'), markdown);
const completeCount = scenarioStatus.filter((entry) => entry.complete).length;
if (!browserCharacterizationComplete) {
  console.error(`Stage G M37 functional regression evidence generation: INCOMPLETE (inventory=${inventory.entries.length}; completeScenarios=${completeCount}/${expectedBrowserFiles.length}; credentialsCaptured=${credentialsCaptured}; status=${report.status})`);
  process.exitCode = 1;
} else {
  console.log(`Stage G M37 functional regression evidence generation: PASS (inventory=${inventory.entries.length}; completeScenarios=${completeCount}/${expectedBrowserFiles.length}; credentialsCaptured=false; status=${report.status})`);
}
