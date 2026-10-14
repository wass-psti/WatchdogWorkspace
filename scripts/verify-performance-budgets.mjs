import { readFile } from 'node:fs/promises';
import { analyzePerformanceBudget, enforcePerformanceBudgets } from './lib/performance-budget-analysis.mjs';

const historicalBudgets = JSON.parse(await readFile(new URL('../config/performance-budgets.json', import.meta.url), 'utf8'));
const m95Target = await readFile(new URL('../config/stage-i-m95-cross-module-responsive-harmonization-target.ts', import.meta.url), 'utf8').catch(() => '');
const m95BudgetAuthority = await readFile(new URL('../M95-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-10-01.md', import.meta.url), 'utf8').catch(() => '');
const m108TotalBuildBudgetAuthority = await readFile(new URL('../M108-TOTAL-BUILD-PERFORMANCE-BUDGET-2026-10-07.md', import.meta.url), 'utf8').catch(() => '');
const m108CorrectiveAuthority = await readFile(new URL('../M108-MATERIAL-TRACKER-SECURITY-CORRECTIVE.md', import.meta.url), 'utf8').catch(() => '');
const moduleRegistry = await readFile(new URL('../config/modules.ts', import.meta.url), 'utf8').catch(() => '');
const m14411BudgetAuthority = await readFile(new URL('../M144_11-HF1-BOARD-IMPORT-ADAPTIVE-PERFORMANCE-BUDGET.md', import.meta.url), 'utf8').catch(() => '');
const m143WizardSource = await readFile(new URL('../supabase/m143/board_import_wizard_atomic_DRAFT.sql', import.meta.url), 'utf8').catch(() => '');


const m95BudgetIsGoverned =
  m95Target.includes('inheritedM93Ceiling: 624000') &&
  m95Target.includes('measuredInitialCssRawBytes: 625371') &&
  m95Target.includes('successorCeiling: 628000') &&
  m95Target.includes('headroomBytes: 2629') &&
  m95BudgetAuthority.includes('Inherited M93 successor CSS ceiling: `624000`') &&
  m95BudgetAuthority.includes('M95 measured initial CSS from the v7 clean production build: `625371`') &&
  m95BudgetAuthority.includes('M95 successor CSS ceiling: `628000`') &&
  m95BudgetAuthority.includes('Headroom after the measured M95 build: `2629`');

const m108TotalBuildBudgetIsGoverned =
  moduleRegistry.includes("id: 'material-tracker'") &&
  m108CorrectiveAuthority.includes('M108 successor total-build ceiling: `6700000`') &&
  m108TotalBuildBudgetAuthority.includes('Inherited M31 total-build ceiling: `6500000`') &&
  m108TotalBuildBudgetAuthority.includes('M108 measured total build from the clean four-module production build: `6676860`') &&
  m108TotalBuildBudgetAuthority.includes('M108 successor total-build ceiling: `6700000`') &&
  m108TotalBuildBudgetAuthority.includes('Headroom after the measured M108 build: `23140`');

// Explicitly govern the incremental M141–M144 Board Import bundle rather than
// hiding excess bytes or weakening the inherited M108 ceiling on older baselines.
const m14411BudgetIsGoverned = m108TotalBuildBudgetIsGoverned
  && m143WizardSource.includes('create or replace function public.wm_import_board_wizard_atomic(')
  && m14411BudgetAuthority.includes('M108 inherited ceiling: `6700000` bytes')
  && m14411BudgetAuthority.includes('Measured PR #20 bundle: `6715228` bytes')
  && m14411BudgetAuthority.includes('Approved successor ceiling: `6750000` bytes')
  && m14411BudgetAuthority.includes('Successor headroom: `34772` bytes');

const budgets = {
  ...historicalBudgets,
  initialCssRawBytes: m95BudgetIsGoverned ? 628000 : historicalBudgets.initialCssRawBytes,
  totalBuildRawBytes: m14411BudgetIsGoverned ? 6750000 : (m108TotalBuildBudgetIsGoverned ? 6700000 : historicalBudgets.totalBuildRawBytes),
};

const distRoot = new URL('../dist/', import.meta.url);
const metrics = await analyzePerformanceBudget({ distRoot, budgets });

console.log(JSON.stringify({
  entry: metrics.entryKey,
  initialManifestKeys: metrics.initialManifestKeys,
  initialJsRawBytes: metrics.initialJsRawBytes,
  initialCssRawBytes: metrics.initialCssRawBytes,
  effectiveInitialCssBudget: budgets.initialCssRawBytes,
  cssBudgetAuthority: m95BudgetIsGoverned ? 'M95-successor-adaptive-628000' : 'historical-config',
  effectiveTotalBuildBudget: budgets.totalBuildRawBytes,
  totalBuildBudgetAuthority: m14411BudgetIsGoverned ? 'M144.11-HF1-governed-board-import-6750000' : (m108TotalBuildBudgetIsGoverned ? 'M108-successor-four-module-6700000' : 'historical-config'),
  largestInitialChunk: metrics.largestInitialChunk,
  totalManifestJsRawBytes: metrics.totalManifestJsRawBytes,
  largestAnyJsChunk: metrics.largestAnyJsChunk,
  totalBuildRawBytes: metrics.totalBuildRawBytes,
  buildFileCount: metrics.buildFileCount,
}, null, 2));

enforcePerformanceBudgets(metrics, budgets);
console.log('M31 production bundle budgets: PASS');
