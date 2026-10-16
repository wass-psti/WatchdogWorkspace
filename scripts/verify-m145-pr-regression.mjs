 import fs from 'node:fs';
 import path from 'node:path';
 import assert from 'node:assert/strict';
 import { fileURLToPath } from 'node:url';
 const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
 const read=p=>fs.readFileSync(path.join(root,p),'utf8');
 const manifest=JSON.parse(read('M145-REMOVAL-MANIFEST.json'));
 const require=(ok,message)=>assert.ok(ok,'M145 PR CURRENT-CORE BLOCKED: '+message);
 const known=['time-tracker','fueltrack-plus','tradelink','material-tracker'];
 require(manifest.baseReleaseCommit==='994e925898fa7de596050cd06ec68a5a94a7c92b','predecessor mismatch');
 require(known.every(k=>manifest.scope.includes(k))&&manifest.scope.length===4,'retirement scope');
 require(manifest.cloudMutation===false&&manifest.cloudDataDeleted===false,'cloud boundary');
 const ci=read('.github/workflows/ci.yml');
 const successor=read('.github/workflows/m145-clean-platform-successor.yml');
 require(ci.includes('uses: ./.github/workflows/m145-clean-platform-successor.yml'),'successor not mandatory');
 require(successor.includes('verify-m145-pr-regression.mjs'),'profile check not part of M145 certification');
 const jobs={
   'recovery-update-accessibility-quality-hardening.yml':['verify-m145-pr-regression.mjs','run-m145-current-core-browser.mjs quality','backup-dr:test','service-worker-update:test','verify-m145-successor-core.mjs --dist'],
   'backup-disaster-recovery.yml':['backup-dr:check','backup-dr:test','verify-m145-pr-regression.mjs','observability:check'],
   'performance.yml':['verify-performance-budget-analysis.mjs','performance:bench','verify-m145-performance-dist.mjs','npm run build'],
   'modern-tests.yml':['modern-tests:test','modern-tests:coverage','modern-tests:e2e','verify-m145-pr-regression.mjs'],
   'service-worker-updates.yml':['service-worker-update:check','service-worker-update:test','verify-m145-successor-core.mjs --dist','verify:preview'],
   'route-lifecycle-recovery.yml':['route-lifecycle:check','route-lifecycle:test','run-m145-current-core-browser.mjs route'],
   'auth-session-access-context.yml':['auth-stabilization:check','auth-stabilization:test','run-m145-current-core-browser.mjs auth'],
 };
 for(const [file,needed] of Object.entries(jobs)) {
   const text=read('.github/workflows/'+file);
  require(text.includes('  pull_request:'),'PR trigger absent '+file);
   require(needed.every(item=>text.includes(item)),'actual current-core verification removed in '+file);
 }
 const database=read('.github/workflows/database-tests.yml');
 require(database.includes('pull_request:')&&database.includes('database-rls:test:local'),'independent DB/RLS job missing');
 const script=read('tests/modern/e2e/m145-current-core.spec.mjs');
 for(const expected of ['@m145-auth','@m145-route','@m145-quality','time-tracker','fueltrack-plus','tradelink','material-tracker','boards','users','settings','account'])require(script.includes(expected),'browser profile missing '+expected);
 const runner=read('scripts/run-m145-current-core-browser.mjs');
 require(runner.includes('spawnSync(playwright')&&runner.includes('if(result.status!==0)throw Error'),'browser must fail closed');
 const perf=read('scripts/verify-m145-performance-dist.mjs');
 require(perf.includes('enforcePerformanceBudgets(metrics,budgets)'),'performance budget enforcement missing');
 console.log('M145 current-core PR regression routing: PASS (7 independent workflows retain substantive current-core test gates; historical originals preserved).');
