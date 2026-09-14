import { readFile } from 'node:fs/promises';
const req=async p=>readFile(new URL(p,import.meta.url),'utf8');
const target=await req('./config/stage-f-m31-performance-engineering-target.ts');
const manifest=await req('./config/application-manifest.ts');
const virt=await req('./src/features/boards/virtualization/board-table-virtualization.ts');
const route=await req('./assets/js/runtime/services/route-policy.ts');
const main=await req('./src/main.ts');
const analytics=await req('./assets/js/runtime/fueltrack-analytics.ts');
const vite=await req('./vite.config.js');
const analysis=await req('./scripts/lib/performance-budget-analysis.mjs');
const fixture=await req('./scripts/verify-performance-budget-analysis.mjs');
const pkg=JSON.parse(await req('./package.json'));
const budgets=JSON.parse(await req('./config/performance-budgets.json'));
const bench=await req('./scripts/run-performance-benchmarks.mjs');
const governedBench=pkg.scripts?.['performance:bench:governed'];
const governedCheck=pkg.scripts?.['performance:check:governed'];
const checks=[
  ['pending/certified state',/activationState: '(?:implementation-complete-pending-certification|active-pending-release-certification|active-certified)'/.test(target)],
  ['architecture >=39',/architectureVersion: (?:39|[4-9][0-9]|[1-9][0-9]{2,})/.test(manifest)],
  ['performance authority',manifest.includes("performanceEngineering: 'measured-budgets-hot-paths-v1'")],
  ['prefix widths',virt.includes('normalizedWidthsWithPrefix')&&virt.includes('prefix[start]')],
  ['route decision reuse',route.includes('const WAIT=Object.freeze')&&route.includes('return ALLOW')],
  ['startup marks',main.includes("performance.measure('wm:startup:total'")],
  ['benchmark execution authority',target.includes("benchmarkExecution: 'node-22-experimental-strip-types-v1'")&&target.includes("nodeTypeScriptExecutionFlag: '--experimental-strip-types'")],
  ['benchmark script uses governed TypeScript execution',governedBench==='node --experimental-strip-types scripts/run-performance-benchmarks.mjs'],
  ['benchmark imports TypeScript hot paths',bench.includes('board-table-virtualization.ts')&&bench.includes('route-policy.ts')],
  ['manifest budget semantics',budgets.version===2&&budgets.entrySource==='index.html'&&budgets.initialClosureMode==='vite-manifest-static-import-closure-v1'],
  ['corrective budget ceilings',budgets.initialCssRawBytes===590000&&budgets.largestAnyJsChunkRawBytes===600000&&budgets.totalManifestJsRawBytes===1800000],
  ['budget analysis uses Vite manifest static closure',analysis.includes(".vite/manifest.json")&&analysis.includes('collectStaticManifestClosure')&&analysis.includes('dynamicImports')===false],
  ['budget analysis accepts URL roots',analysis.includes('value instanceof URL ? fileURLToPath(value)')],
  ['budget analysis fixture governed',governedCheck==='node verify-stage-f-m31-performance-engineering.mjs && node scripts/verify-performance-budget-analysis.mjs'&&fixture.includes('Dynamic import leaked into initial closure')],
  ['ECharts tree-shakeable analytics',analytics.includes("from 'echarts/core'")&&analytics.includes('BarChart')&&analytics.includes('GridComponent')&&analytics.includes('TooltipComponent')&&analytics.includes('CanvasRenderer')&&!analytics.includes("from 'echarts';")],
  ['analytics vendor carveout',vite.includes("name: 'analytics-vendor'")&&vite.includes('(?:echarts|zrender)')&&vite.includes('entriesAware: true')],
  ['platform entry-aware split',/name: 'platform'[\s\S]{0,300}entriesAware: true[\s\S]{0,100}maxSize: 500000/.test(vite)],
  ['database unchanged by target',target.includes('migrationRequired: false')&&target.includes('schemaChangeRequired: false')],
];
for(const [n,ok] of checks){if(!ok) throw new Error(`M31 verifier failed: ${n}`)}
console.log(`Stage F Milestone 31 Performance engineering verification: PASS (architecture=39; checks=${checks.length}; budgets=vite-manifest-v2; largestAnyJs=600000; benchmarkTsExecution=strip-types)`);
