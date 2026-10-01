import fs from 'node:fs';
const failures=[];const ok=(v,m)=>{if(!v)failures.push(m)};const read=p=>fs.readFileSync(p,'utf8');
const retired=['host-ui-migration.css','boards-ui-migration.css','m74-harmonization.css','m75-harmonization.css','m76-harmonization.css'];
const runtimeFiles=['src/main.ts','apps/time-tracker/index.html','apps/fueltrack-plus/runtime.html','apps/tradelink/runtime.html'];
for(const p of runtimeFiles){const t=read(p);for(const r of retired)ok(!t.includes(r),`${p} still references retired ${r}`)}
const runtimeCode=read('apps/time-tracker/app.js')+read('apps/fueltrack-plus/app.v3.17.0-wm6.js')+read('apps/tradelink/app.v1.42.0-wm1.js');
for(const marker of ['wmTimeTrackerHarmonized','wmFuelTrackHarmonized','wmTradeLinkHarmonized','data-wm-time-tracker-harmonized','data-wm-fueltrack-harmonized','data-wm-tradelink-harmonized'])ok(!runtimeCode.includes(marker),`transitional presentation marker remains: ${marker}`);
const currentCss=['assets/css/foundation/boards-visual-migration.css','apps/time-tracker/m85-visual-migration.css','apps/fueltrack-plus/m86-visual-migration.css','apps/tradelink/m87-visual-migration.css','assets/css/foundation/cross-module-responsive-harmonization.css'].map(read).join('\n');
for(const token of ['--m85-tt-gap-xs','--m85-tt-gap-sm','--m87-tl-raised','--wm-m95-responsive-inline-gutter'])ok(!currentCss.includes(token),`unused token survived M96: ${token}`);
ok(read('assets/css/foundation/cross-module-responsive-harmonization.css').includes('grid-template-columns:1fr'),'canonical narrow update-banner composition missing');
ok(read('assets/css/foundation/boards-visual-migration.css').includes('border:0;border-radius:0;background:transparent'),'Board reconciliation outcome missing after bridge retirement');
ok(read('apps/fueltrack-plus/m86-visual-migration.css').includes('.app-dialog.wm-dialog{padding:0;}'),'FuelTrack+ dialog reconciliation outcome missing');
ok(read('apps/tradelink/m87-visual-migration.css').includes('.company-panel.wm-dialog){padding:0;}'),'TradeLink dialog reconciliation outcome missing');
if(failures.length){console.error('M96 deterministic retirement verification FAILED');for(const f of failures)console.error(` - ${f}`);process.exit(1)}
console.log('M96 deterministic retirement verification: PASS (retired paths absent; successor rules present; transitional markers and unused tokens removed)');
