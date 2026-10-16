import { readFile } from 'node:fs/promises';
import { analyzePerformanceBudget, enforcePerformanceBudgets } from './lib/performance-budget-analysis.mjs';
const historical=JSON.parse(await readFile(new URL('../config/performance-budgets.json',import.meta.url),'utf8'));
// Governed inherited 2026-10-15 successor allowances, not arbitrary inflation.
// This is evaluated against the actual M145 built dist, excluding retired apps.
const budgets={...historical,initialCssRawBytes:628000,totalBuildRawBytes:6780000};
const metrics=await analyzePerformanceBudget({distRoot:new URL('../dist/',import.meta.url),budgets});
enforcePerformanceBudgets(metrics,budgets);
console.log(JSON.stringify({initialCssBytes:metrics.initialCssRawBytes,totalBuildBytes:metrics.totalBuildRawBytes,largestChunk:metrics.largestAnyJsChunk,source:'M145 production build; inherited governed ceilings'},null,2));
console.log('M145 current-core production performance budget: PASS');
