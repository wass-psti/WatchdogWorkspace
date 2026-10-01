import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process'; import {spawnSync} from 'node:child_process';
const root=process.cwd(), failures=[]; const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const ok=(c,m)=>{if(!c)failures.push(m)};
const guard=spawnSync(process.execPath,['scripts/verify-stage-i-m84-m83-source-guard.mjs'],{cwd:root,encoding:'utf8'}); ok(guard.status===0,`M84 source guard failed: ${(guard.stderr||guard.stdout).trim()}`);
const css=read('assets/css/foundation/boards-visual-migration.css');
const foundationCss=fs.readdirSync(path.join(root,'assets/css/foundation')).filter(name=>name.endsWith('.css')).map(name=>read(`assets/css/foundation/${name}`)).join('\n');
const wmRefs=[...new Set([...css.matchAll(/var\((--wm-[A-Za-z0-9_-]+)/g)].map(match=>match[1]))];
for(const ref of wmRefs) ok(new RegExp(`${ref.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s*:`).test(foundationCss),`M84 CSS references undefined foundation token: ${ref}`);

for(const token of ['boards shell + collection','Board workspace shell + views','Filters + search','Table / grid / list density','Statuses','Kanban','Dialogs + floating Board surfaces','Item workspace']) ok(css.toLowerCase().includes(token.toLowerCase()),`M84 CSS section missing: ${token}`);
for(const selector of ['data-board-search','data-item-search','data-group-table-scroll','data-kanban-item','board-item-panel']) ok(css.includes(selector)||read('assets/js/features/boards/views/board-workspace-view.ts').includes(selector)||read('assets/js/features/boards/views/item-workspace-view.ts').includes(selector),`M84 legacy behavior hook missing: ${selector}`);
for(const invariant of ['data-board-search','data-board-create','data-item-search','data-item-status','data-group-table-scroll','data-kanban-lane','data-item-panel','data-board-menu-trigger']) {
  const combined=['assets/js/features/boards/views/board-list-view.ts','assets/js/features/boards/views/board-workspace-view.ts','assets/js/features/boards/views/table-view.ts','assets/js/features/boards/views/kanban-view.ts','assets/js/features/boards/views/item-workspace-view.ts','assets/js/features/boards/controllers/dialog-controller.ts'].map(read).join('\n');
  ok(combined.includes(invariant),`M84 must preserve Board runtime hook: ${invariant}`);
}
const browserTest=read('tests/modern/e2e/m84-boards-visual-migration.spec.mjs'); ok(browserTest.includes("getPropertyValue('--m84-board-surface')"),'M84 real-browser test must assert the compiled runtime presentation marker'); ok(!browserTest.includes('document.styleSheets'),'M84 real-browser test must remain bundler-safe and filename-independent');
const packageScripts=JSON.parse(read('package.json')).scripts||{};
for(const s of ['boards-table-recovery:check','boards-table-recovery:test','boards-columns-cells-status:check','boards-columns-cells-status:test','boards-kanban-drag-drop:check','boards-kanban-drag-drop:test','boards-realtime-concurrency:check','boards-realtime-concurrency:test','cross-module-rbac-e2e:check','cross-module-rbac-e2e:test']) ok(Boolean(packageScripts[s]),`M84 predecessor regression script missing: ${s}`);
ok(!css.includes('display:none!important')&&!css.includes('pointer-events:none!important'),'M84 visual CSS must not suppress runtime controls');
ok(!css.includes('transition: all')&&!css.includes('transition:all'),'M84 visual CSS must not use transition-all');
if(failures.length){console.error('M84 Boards Visual Migration deterministic verification FAILED'); failures.forEach(f=>console.error(` - ${f}`)); process.exit(1)}
console.log('M84 Boards Visual Migration deterministic verification: PASS');
console.log('Validated shell/views/table-grid-list/cards/status/filter/dialog/Kanban/item-workspace presentation coverage while legacy hooks and M45–M52 Board behavior authorities remain protected.');
