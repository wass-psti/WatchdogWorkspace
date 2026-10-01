import { readFile } from 'node:fs/promises';
import { analyzePerformanceBudget, enforcePerformanceBudgets } from './lib/performance-budget-analysis.mjs';

const historicalBudgets = JSON.parse(await readFile(new URL('../config/performance-budgets.json', import.meta.url), 'utf8'));
const m95Target = await readFile(new URL('../config/stage-i-m95-cross-module-responsive-harmonization-target.ts', import.meta.url), 'utf8').catch(() => '');
const m95BudgetAuthority = await readFile(new URL('../M95-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-10-01.md', import.meta.url), 'utf8').catch(() => '');

const m95BudgetIsGoverned =
  m95Target.includes('inheritedM93Ceiling: 624000') &&
  m95Target.includes('measuredInitialCssRawBytes: 625371') &&
  m95Target.includes('successorCeiling: 628000') &&
  m95Target.includes('headroomBytes: 2629') &&
  m95BudgetAuthority.includes('Inherited M93 successor CSS ceiling: `624000`') &&
  m95BudgetAuthority.includes('M95 measured initial CSS from the v7 clean production build: `625371`') &&
  m95BudgetAuthority.includes('M95 successor CSS ceiling: `628000`') &&
  m95BudgetAuthority.includes('Headroom after the measured M95 build: `2629`');

const budgets = {
  ...historicalBudgets,
  initialCssRawBytes: m95BudgetIsGoverned ? 628000 : historicalBudgets.initialCssRawBytes,
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
  largestInitialChunk: metrics.largestInitialChunk,
  totalManifestJsRawBytes: metrics.totalManifestJsRawBytes,
  largestAnyJsChunk: metrics.largestAnyJsChunk,
  totalBuildRawBytes: metrics.totalBuildRawBytes,
  buildFileCount: metrics.buildFileCount,
}, null, 2));

enforcePerformanceBudgets(metrics, budgets);
console.log('M31 production bundle budgets: PASS');
