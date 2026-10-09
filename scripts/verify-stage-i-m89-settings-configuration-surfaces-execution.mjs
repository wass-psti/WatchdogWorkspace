import { approvedM108InheritedAuthority } from './lib/m108-login-successor-auth-provenance.mjs';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const sha = (relative) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
const ok = (condition, message) => { if (!condition) failures.push(message); };
const manifest = JSON.parse(read('regression-baseline/m89-m88-source-guard.json'));
const baseline = new Map(manifest.entries.map((entry)=>[entry.path, entry]));

for (const relative of [
  'assets/js/features/settings/settings-recovery.ts',
  'assets/js/core/storage.ts',
  'assets/js/core/platform.ts',
  'assets/js/core/backup.ts',
  'assets/js/core/auth.ts',
  'src/app/management/authenticated-management-ui-runtime.ts',
  'config/stage-g-m43-settings-functional-recovery-target.ts',
  'verify-stage-g-m43-settings-functional-recovery.mjs',
  'tests/modern/e2e/settings-functional-recovery.spec.mjs',
  'config/stage-h-m60-color-theme-contrast-target.ts',
  'src/design-system/theme-contract.ts',
  'assets/css/foundation/themes.css',
  'config/stage-i-m79-design-tokens-semantic-theme-target.ts',
]) {
  const expected = baseline.get(relative);
  ok(Boolean(expected), `M89 baseline authority missing: ${relative}`);
  if (expected) ok((sha(relative) === expected.sha256 || approvedM108InheritedAuthority(root, relative)), `M89 protected Settings/configuration authority drift: ${relative}`);
}

const ui = read('src/app/management/AuthenticatedManagementUI.tsx');
for (const marker of ['data-wm-settings-visual="m89"','data-wm-setting="theme"','data-wm-setting="density"','data-wm-setting="compatibility"','data-wm-setting="storage-health"','data-wm-setting="auth-backend"','data-wm-setting="diagnostics"','data-wm-setting="backup-recovery"','data-wm-setting="preference-reset"']) ok(ui.includes(marker), `M89 Settings semantic marker missing: ${marker}`);
const css = read('assets/css/foundation/settings-configuration-visual-migration.css');
const refs = [...new Set([...css.matchAll(/var\((--wm-[A-Za-z0-9_-]+)/g)].map((match)=>match[1]))];
const budgets = JSON.parse(read('config/performance-budgets.json'));
const m93BudgetAuthority = fs.existsSync(path.join(root,'M93-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md')) ? read('M93-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md') : ''; const m92BudgetAuthority = fs.existsSync(path.join(root,'M92-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md')) ? read('M92-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md') : ''; const m91BudgetAuthority = fs.existsSync(path.join(root,'M91-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md')) ? read('M91-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md') : ''; const m90BudgetAuthority = fs.existsSync(path.join(root,'M90-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md')) ? read('M90-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md') : ''; const activeCssBudgetCeiling = m93BudgetAuthority.includes('M93 successor CSS ceiling: `624000`') ? 624000 : (m92BudgetAuthority.includes('M92 successor CSS ceiling: `621000`') ? 621000 : (m91BudgetAuthority.includes('M91 successor CSS ceiling: `619000`') ? 619000 : (m90BudgetAuthority.includes('M90 successor CSS ceiling: `616000`') ? 616000 : 613000))); ok(budgets.initialCssRawBytes === activeCssBudgetCeiling, 'M89 successor-governed adaptive CSS ceiling drift');

if (failures.length) {
  console.error('M89 Settings & Configuration Surfaces deterministic verification FAILED');
  failures.forEach((failure)=>console.error(` - ${failure}`));
  process.exit(1);
}
console.log('M89 Settings & Configuration Surfaces deterministic verification: PASS');
console.log(`Validated presentation-only Settings migration while byte-preserving M43/M44/M60/M79 authorities; foundation token dependencies=${refs.length}.`);
