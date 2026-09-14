import { readFile } from 'node:fs/promises';
import { analyzePerformanceBudget, enforcePerformanceBudgets } from './lib/performance-budget-analysis.mjs';

const budgets = JSON.parse(await readFile(new URL('../config/performance-budgets.json', import.meta.url), 'utf8'));
const distRoot = new URL('../dist/', import.meta.url);
const metrics = await analyzePerformanceBudget({ distRoot, budgets });

console.log(JSON.stringify({
  entry: metrics.entryKey,
  initialManifestKeys: metrics.initialManifestKeys,
  initialJsRawBytes: metrics.initialJsRawBytes,
  initialCssRawBytes: metrics.initialCssRawBytes,
  largestInitialChunk: metrics.largestInitialChunk,
  totalManifestJsRawBytes: metrics.totalManifestJsRawBytes,
  largestAnyJsChunk: metrics.largestAnyJsChunk,
  totalBuildRawBytes: metrics.totalBuildRawBytes,
  buildFileCount: metrics.buildFileCount,
}, null, 2));

enforcePerformanceBudgets(metrics, budgets);
console.log('M31 production bundle budgets: PASS');
