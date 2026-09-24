import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const target=read('config/stage-g-m53-recovery-update-accessibility-quality-hardening-target.ts');
const spec=read('tests/modern/e2e/recovery-update-accessibility-quality-hardening.spec.mjs');
const backup=read('assets/js/core/backup.ts');
const sw=read('service-worker.js');
const coordinator=read('assets/js/platform/update/service-worker-update.ts');
const shell=read('assets/js/app.ts');
const timeTrackerV2=read('apps/time-tracker/v2.css');
const checks=[
 ['six stability transitions',['reload','application-update','backup-restore','role-change','responsive-viewport-change','keyboard-only'].every(x=>target.includes(x))],
 ['backup versions 1-4',target.includes('[1, 2, 3, 4]')&&backup.includes('const migrations')&&backup.includes('backupVersion: 4')],
 ['transactional restore',backup.includes('wm_restore_workspace_backup_v4')&&backup.includes('createRecoveryPackage(current)')&&backup.includes('backup-restore')],
 ['service worker controlled activation',sw.includes('WM_ACTIVATE_UPDATE')&&coordinator.includes('controllerchange')&&coordinator.includes('location.reload()')],
 ['stale cache cleanup',sw.includes('caches.delete')&&sw.includes('key !== CACHE')],
 ['mobile keyboard focus',spec.includes('@m53-mobile-keyboard')&&spec.includes("page.keyboard.press('Escape')")&&shell.includes('shellMobileRestoreFocus.focus()')],
 ['route focus accessibility',spec.includes('@m53-focus-accessibility')&&spec.includes('toBeFocused()')],
 ['responsive host+modules',spec.includes('@m53-responsive-modules')&&['time-tracker','fueltrack-plus','tradelink'].every(x=>spec.includes(x))&&timeTrackerV2.includes('grid-template-columns: minmax(0, 1fr);')&&timeTrackerV2.includes("body[data-tt-version='2'] .clock-layout > *")&&timeTrackerV2.includes("body[data-wm-surface='time-tracker'][data-tt-version='2'] .tt-v2-rail,")&&timeTrackerV2.includes(".tt-v2-rail .nav-tabs {")&&timeTrackerV2.includes('flex: 1 1 auto;')&&timeTrackerV2.includes("body[data-tt-version='2'] .gps-panel-head { flex-wrap: wrap; }")],
 ['reload identity stability',spec.includes('@m53-reload')&&spec.includes('page.reload()')],
 ['role transition hardening',spec.includes('@m53-role-transition')&&spec.includes("status: 'disabled'")],
 ['performance budget',target.includes('controlledRouteReadyMaxMs: 5000')&&spec.includes('timedRoute')],
];
for(const [name,ok] of checks) if(!ok) throw new Error(`M53 execution vector failed: ${name}`);
console.log(`Stage G M53 execution vectors: PASS (${checks.length}/${checks.length})`);
