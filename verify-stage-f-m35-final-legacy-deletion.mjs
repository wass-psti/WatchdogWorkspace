import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
const req = async (path) => readFile(new URL(path, import.meta.url), 'utf8');
const target = await req('./config/stage-f-m35-final-legacy-deletion-target.ts');
const m34 = await req('./config/stage-f-m34-backup-disaster-recovery-target.ts');
const manifest = await req('./config/application-manifest.ts');
const types = await req('./src/types/manifest.ts');
const schema = await req('./src/runtime-schemas/manifest.ts');
const shell = await req('./src/app/shell/WorkManagementShell.tsx');
const boundary = await req('./src/app/composition/RuntimeApplicationBoundary.tsx');
const host = await req('./src/app/composition/runtime-host.ts');
const adapter = await req('./src/app/composition/runtime-adapter.ts');
const app = await req('./assets/js/app.ts');
const sw = await req('./service-worker.js');
const m24Verifier = await req('./verify-stage-e-m24-fueltrack-stabilization.mjs');
const shellM1Verifier = await req('./verify-v1432-shell-navigation-foundation-sm1.mjs');
const shellM2Verifier = await req('./verify-v1432-shell-primary-sidebar-sm2.mjs');
const shellM4Verifier = await req('./verify-v1432-shell-resizing-pinning-sm4.mjs');
const shellM7Verifier = await req('./verify-v1432-shell-responsive-accessibility-sm7.mjs');
const settingsVerifier = await req('./verify-settings.mjs');
const m35Workflow = await req('./.github/workflows/final-legacy-deletion.yml');
const historicalCollector = await req('./scripts/verify-all-historical-verifiers.mjs');
const m26 = await req('./config/stage-e-m26-iframe-retirement-target.ts');
const backup = await req('./assets/js/core/backup.ts');
const pkg = JSON.parse(await req('./package.json'));
const architecture = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const oldFiles = ['src/app/composition/LegacyApplicationBoundary.tsx','src/app/composition/legacy-runtime-adapter.ts','src/app/composition/legacy-host.ts'];
const checks = [
 ['M34 prerequisite certified', m34.includes("activationState: 'active-certified'")],
 ['M35 state', /activationState: '(?:implementation-complete-pending-certification|active-pending-release-certification|active-certified)'/.test(target)],
 ['architecture 43+', architecture >= 43],
 ['old composition files deleted', oldFiles.every((path) => !fs.existsSync(new URL(`./${path}`, import.meta.url)))],
 ['neutral boundary exists', boundary.includes('RuntimeApplicationBoundary') && boundary.includes('data-wm-runtime-host') && boundary.includes('runtime-route-content')],
 ['neutral adapter exists', adapter.includes('mountRuntimeApplication') && adapter.includes("import('../../../assets/js/app.ts')")],
 ['neutral host exists', host.includes('resolveRuntimeApplicationHost') && host.includes('__WM_RUNTIME_CONTENT_HOST__')],
 ['shell uses neutral boundary', shell.includes('<RuntimeApplicationBoundary') && !shell.includes('LegacyApplicationBoundary')],
 ['app resolves neutral host', app.includes('resolveRuntimeApplicationHost') && app.includes('[data-wm-runtime-host]')],
 ['dead shell serializer deleted', !/function\s+shell\s*\(/.test(app) && !app.includes('void shell;')],
 ['dead shell markup helpers deleted', !app.includes('shellNavigationToggleMarkup') && !app.includes('shellNavigationPinMarkup') && !app.includes('shellNavigationResizerMarkup')],
 ['expired update alias deleted', !sw.includes('SKIP_WAITING') && !sw.includes('LEGACY_UPDATE_MESSAGE') && sw.includes("const UPDATE_MESSAGE = 'WM_ACTIVATE_UPDATE'")],
 ['manifest neutral presentation', manifest.includes("presentationBoundary: 'react-composition-runtime-content'") && manifest.includes("routeContentBoundary: 'runtime-route-content-island-v1'")],
 ['manifest M35 authority', manifest.includes("finalLegacyDeletion: 'expired-compatibility-retirement-v1'") && manifest.includes('RuntimeApplicationBoundary.tsx')],
 ['manifest types updated', types.includes("'runtime-route-content-island-v1'") && types.includes('finalLegacyDeletion')],
 ['runtime schema updated', schema.includes("'runtime-route-content-island-v1'") && schema.includes('Architecture v43+ requires the neutral runtime-content boundary')],
 ['M26 iframe decisions retained', m26.includes("retainedModuleIds: Object.freeze(['time-tracker', 'fueltrack-plus', 'tradelink']") && m26.includes('justifiedRetirementCount: 0')],
 ['backup compatibility retained', backup.includes('SUPPORTED_BACKUP_VERSIONS = Object.freeze([1, 2, 3, 4]') && backup.includes('migrateBackup')],
 ['audit history retained', fs.existsSync(new URL('./supabase/migrations/v1.41.0-transactional-backup-restore.sql', import.meta.url)) && fs.existsSync(new URL('./M34-ACTIVATION-RUNBOOK.md', import.meta.url))],
 ['M35 scripts governed', pkg.scripts?.['legacy-deletion:check:governed'] === 'node verify-stage-f-m35-final-legacy-deletion.mjs' && pkg.scripts?.['legacy-deletion:test:governed'] === 'node --experimental-strip-types scripts/verify-final-legacy-deletion-execution.mjs'],
 ['M24 historical ECharts verifier synchronized', m24Verifier.includes('treeShakenAnalyticsImportAuthority') && m24Verifier.includes('architectureVersion >= 39') && m24Verifier.includes("from 'echarts/core'") && fs.existsSync(new URL('./M35-M24-HISTORICAL-ECHARTS-VERIFIER-SYNCHRONIZATION-HOTFIX.md', import.meta.url))],
 ['historical Shell verifiers synchronized', [shellM1Verifier, shellM2Verifier, shellM4Verifier, shellM7Verifier].every((source) => source.includes('architectureVersion >= 43')) && shellM1Verifier.includes("!app.includes('function shell(')") && fs.existsSync(new URL('./M35-SHELL-HISTORICAL-VERIFIER-SYNCHRONIZATION-HOTFIX.md', import.meta.url))],
 ['historical Settings backup verifier synchronized', settingsVerifier.includes('architectureVersion >= 42') && settingsVerifier.includes('inspectBackupFile') && settingsVerifier.includes('restoreWorkspaceBackupGuarded') && settingsVerifier.includes('pre-restore recovery checkpoint') && fs.existsSync(new URL('./M35-SETTINGS-BACKUP-HISTORICAL-VERIFIER-SYNCHRONIZATION-HOTFIX.md', import.meta.url))],
 ['M35 workflow exercises synchronized historical authorities early', m35Workflow.includes('verify-settings.mjs') && m35Workflow.includes('npm run fueltrack-stabilization:check') && m35Workflow.includes('npm run verify:ui') && m35Workflow.indexOf('verify-settings.mjs') < m35Workflow.indexOf('npm run legacy-deletion:check')],
 ['M35 collect-all historical verifier preflight governed', pkg.scripts?.['verify:historical-all'] === 'node scripts/verify-all-historical-verifiers.mjs' && historicalCollector.includes('Historical verifier collect-all summary') && historicalCollector.includes('failures.length') && m35Workflow.includes('npm run verify:historical-all') && m35Workflow.indexOf('npm run verify:historical-all') < m35Workflow.indexOf('verify-settings.mjs') && fs.existsSync(new URL('./M35-CERTIFICATION-HARNESS-COLLECT-ALL-HOTFIX.md', import.meta.url))],
 ['no database change', target.includes('migrationRequired: false') && target.includes('schemaChangeRequired: false')],
];
for (const [name, ok] of checks) if (!ok) throw new Error(`M35 verifier failed: ${name}`);
console.log(`Stage F Milestone 35 Final legacy deletion verification: PASS (architecture=${architecture}; checks=${checks.length}; deleted=expired-runtime-compatibility; retained=certified-live-boundaries)`);
