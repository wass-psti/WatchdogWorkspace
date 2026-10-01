import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const failures = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const ok = (condition, message) => { if (!condition) failures.push(message); };

const target = read('config/stage-i-m89-settings-configuration-surfaces-target.ts');
ok(target.includes("certifiedZipSha256:'2ba229eae678e186a4bd1ec37fe9841df95c0df2e8f87a6a1fa50786a6834e85'"), 'M89 lost M88 certified ZIP binding');
ok(target.includes("certifiedSourceSha256:'8f8304905cd85f24f087a1b5e433386dc671e4ceea54033b6985a6115131d639'"), 'M89 lost M88 certified source binding');
ok(target.includes('inheritedM88AdaptiveCssCeiling:613000') && target.includes('successorBudgetChangeRequired:false'), 'M89 performance-governance inheritance missing');

const system = read('src/design-system/settings-configuration-visual-migration-system.ts');
for (const marker of [
  'presentation-only-settings-configuration-successor',
  'm43SettingsFunctionalRecoveryRemainsAuthoritative: true',
  'm44ManagementRuntimeRemainsAuthoritative: true',
  'm60ThemeArchitectureRemainsAuthoritative: true',
  'm79SemanticThemeAuthorityRemainsAuthoritative: true',
  'm34BackupRecoveryAuthorityPreserved: true',
  'preferenceResetScopePreserved: true',
  'noSchemaMigrationRequired: true',
  'noBackendMutationRequired: true',
]) ok(system.includes(marker), `M89 system contract missing: ${marker}`);

const main = read('src/main.ts');
ok(main.includes("settings-configuration-visual-migration.css"), 'M89 stylesheet import missing');
ok(main.indexOf('users-administration-visual-migration.css') < main.indexOf('settings-configuration-visual-migration.css'), 'M89 stylesheet must load after M88 presentation layer');

const ui = read('src/app/management/AuthenticatedManagementUI.tsx');
for (const marker of [
  'data-wm-settings-visual="m89"',
  'data-wm-configuration-surface="appearance-preferences"',
  'data-wm-configuration-surface="platform-operations"',
  'data-wm-configuration-control="theme"',
  'data-wm-configuration-control="density"',
  'data-wm-configuration-control="application-compatibility"',
  'data-wm-configuration-control="storage-health"',
  'data-wm-configuration-control="auth-backend"',
  'data-wm-configuration-control="diagnostics"',
  'data-wm-configuration-control="backup-recovery"',
  'data-wm-configuration-control="preference-reset"',
]) ok(ui.includes(marker), `M89 Settings marker missing: ${marker}`);

for (const marker of [
  "const themes: readonly ThemePreference[] = ['system', 'light', 'dark']",
  'authenticatedManagementUiRuntime.setTheme(theme)',
  "runSettingAction('density')",
  "runSettingAction('compatibility')",
  "runSettingAction('refresh-storage')",
  "runSettingAction('persist')",
  "runSettingAction('refresh-auth')",
  "runSettingAction('diagnostics')",
  "runSettingAction('export-backup')",
  'restoreBackup(file)',
  "runSettingAction('reset-platform')",
]) ok(ui.includes(marker), `M89 preserved Settings action marker missing: ${marker}`);

const css = read('assets/css/foundation/settings-configuration-visual-migration.css');
for (const marker of ['--m89-settings-surface','data-wm-settings-visual','m89-settings-group','theme-options','@media(max-width:52.5rem)','@media(forced-colors:active)']) ok(css.includes(marker), `M89 visual coverage missing: ${marker}`);
ok(!/transition\s*:\s*all/i.test(css), 'M89 CSS must not use transition: all');
const foundations = fs.readdirSync(path.join(root,'assets/css/foundation')).filter((name)=>name.endsWith('.css') && name!=='settings-configuration-visual-migration.css').map((name)=>read(`assets/css/foundation/${name}`)).join('\n');
const refs = [...new Set([...css.matchAll(/var\((--wm-[A-Za-z0-9_-]+)/g)].map((match)=>match[1]))];
for (const ref of refs) ok(foundations.includes(`${ref}:`), `M89 CSS references undefined foundation token: ${ref}`);

const m43 = read('config/stage-g-m43-settings-functional-recovery-target.ts');
for (const marker of [
  'Theme and density mutations are browser-persisted',
  'Application compatibility scanning executes every active module runtime/storage contract',
  'Storage-health refresh and persistent-storage requests',
  'Platform diagnostics combine shell/module checks',
  'Backup export produces the governed M34 recovery envelope',
  'Preference reset is explicitly scoped',
]) ok(m43.includes(marker), `M89 lost M43 semantic authority marker: ${marker}`);

const runtime = read('src/app/management/authenticated-management-ui-runtime.ts');
for (const marker of [
  "'refresh-auth'",
  'persistSettingsEvidence({ compatibility })',
  'persistSettingsEvidence({ diagnostics, backendStatus: authDiagnostics })',
  'readSettingsEvidence()',
  'restoreWorkspaceBackupGuarded',
]) ok(runtime.includes(marker), `M89 M44/M43 runtime marker missing: ${marker}`);

const m78 = read('scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs');
for (const marker of [
  'stage-i-m89-settings-configuration-surfaces-target.ts',
  'settings-configuration-visual-migration.css',
  'settings-configuration-visual-migration-system.ts',
  'M89 Settings/configuration presentation mutation/additions authorized',
]) ok(m78.includes(marker), `M89 M78 successor authorization missing: ${marker}`);

const budgets = JSON.parse(read('config/performance-budgets.json'));
const m93BudgetAuthority=fs.existsSync(path.join(root,'M93-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'))?read('M93-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'):'';const m92BudgetAuthority=fs.existsSync(path.join(root,'M92-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'))?read('M92-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'):''; const m91BudgetAuthority=fs.existsSync(path.join(root,'M91-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'))?read('M91-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'):''; const m90BudgetAuthority=fs.existsSync(path.join(root,'M90-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'))?read('M90-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'):''; const activeCssBudgetCeiling=m93BudgetAuthority.includes('M93 successor CSS ceiling: `624000`')?624000:(m92BudgetAuthority.includes('M92 successor CSS ceiling: `621000`')?621000:(m91BudgetAuthority.includes('M91 successor CSS ceiling: `619000`')?619000:(m90BudgetAuthority.includes('M90 successor CSS ceiling: `616000`')?616000:613000))); ok(budgets.initialCssRawBytes === activeCssBudgetCeiling, 'M89 successor-governed adaptive CSS ceiling drift');

const pkg = JSON.parse(read('package.json'));
for (const key of [
  'settings-configuration-visual:source-guard','settings-configuration-visual:check','settings-configuration-visual:test','settings-configuration-visual:browser','settings-configuration-visual:certify','settings-configuration-visual:post-certification','settings-configuration-visual:package-hygiene','settings-configuration-visual:final-checkpoint','settings-configuration-visual:publish-certified'
]) ok(typeof pkg.scripts?.[key] === 'string', `M89 package script missing: ${key}`);

const m95SuccessorActive=fs.existsSync(path.join(root,'config/stage-i-m95-cross-module-responsive-harmonization-target.ts'));
if(!m95SuccessorActive){
  const guard = spawnSync(process.execPath,['scripts/verify-stage-i-m89-m88-source-guard.mjs'],{cwd:root,encoding:'utf8'});
  ok(guard.status === 0, `M89 source guard failed: ${(guard.stderr || guard.stdout).trim()}`);
}

if (failures.length) {
  console.error('M89 Settings & Configuration Surfaces verification FAILED');
  failures.forEach((failure)=>console.error(` - ${failure}`));
  process.exit(1);
}
console.log('M89 Settings & Configuration Surfaces verification: PASS');
console.log(`Verified Settings/theme/configuration presentation with ${refs.length} resolved foundation-token dependencies while preserving M43/M44/M60/M79 behavior authorities.`);
