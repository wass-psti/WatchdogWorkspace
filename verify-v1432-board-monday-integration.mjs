import fs from 'node:fs';
import assert from 'node:assert/strict';
import { renderBoardHeader, renderBoardControls } from './assets/js/features/boards/views/board-workspace-view.ts';

const read = (path) => fs.readFileSync(path, 'utf8');
const workspace = read('assets/js/features/boards/views/board-workspace-view.ts');
const table = read('assets/js/features/boards/views/table-view.ts');
const kanban = read('assets/js/features/boards/views/kanban-view.ts');
const boardsUi = read('assets/js/boards-ui.ts');
const css = read('assets/css/boards-monday.css');
const themes = read('assets/css/foundation/themes.css');
const main = read('src/main.ts');
const browser = read('tests/browser/run-cdp.mjs');
const pkg = JSON.parse(read('package.json'));

const requiredWorkspaceMarkers = [
  'monday-board-head',
  'board-breadcrumb',
  'board-role-badge',
  'board-view-bar',
  'Main table',
  'board-new-item-split',
  'data-board-menu-trigger="create"',
  'data-item-search',
  'data-item-status',
  'data-board-columns',
  'data-board-menu-trigger="view-options"',
];
for (const marker of requiredWorkspaceMarkers) assert.ok(workspace.includes(marker), `Board workspace integration missing ${marker}`);

for (const invariant of [
  'data-inline-add-focus',
  'data-add-group',
  'data-add-column-menu',
  'data-board-view="table"',
  'data-board-view="kanban"',
  'data-board-undo',
  'data-board-redo',
  'data-board-members',
  'data-board-activity',
]) assert.ok(workspace.includes(invariant), `Board workspace lost interaction invariant ${invariant}`);

for (const invariant of ['board-sheet-view','board-sheet-group','group-accent-rail','data-inline-add-item','data-select-visible','data-add-column']) {
  assert.ok(table.includes(invariant), `Grouped Table runtime lost ${invariant}`);
}
assert.ok(kanban.includes('--lane-color:${esc(statusLabel.color)}'), 'Kanban does not expose configured Status color to the presentation layer');

for (const handler of [
  "btn.matches('[data-inline-add-focus]')",
  "btn.matches('[data-board-view]')",
  "btn.matches('[data-board-columns]')",
  "btn.matches('[data-add-column-menu]')",
  "btn.matches('[data-add-column]')",
  "btn.matches('[data-toggle-archived-items]')",
  "btn.matches('[data-reset-board-view]')",
  "btn.matches('[data-add-group]')",
]) assert.ok(boardsUi.includes(handler), `Board command routing lost ${handler}`);

assert.match(main, /assets\/css\/motion-design\.css';\n(?:import '\.\.\/assets\/css\/shell-navigation\.css';\n)?(?:import '\.\.\/assets\/css\/shell-overlays\.css';\n)?(?:import '\.\.\/assets\/css\/shared-application-ui\.css';\n)?(?:import '\.\.\/assets\/css\/shell-account-menu\.css';\n)?(?:import '\.\.\/assets\/css\/shell-accessibility\.css';\n)?import '\.\.\/assets\/css\/boards-monday\.css';/, 'Board presentation layer must load after the established motion/application/shared-UI cascade');
for (const token of [
  '--wm-board-primary:',
  '--wm-board-primary-hover:',
  '--wm-board-primary-soft:',
  '--wm-board-text:',
  '--wm-board-border:',
  '--wm-board-surface:',
]) assert.ok((themes.match(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length >= 3, `Board theme token ${token} is not present in light/dark/system modes`);

for (const selector of [
  '.monday-board-head',
  '.monday-board-control-stack',
  '.board-view-bar',
  '.monday-board-toolbar',
  '.board-new-item-split',
  '.board-sheet-group',
  '.board-sheet-table',
  'td[data-column-type="status"]',
  '.kanban-column',
  '.board-floating-menu',
]) assert.ok(css.includes(selector), `Board presentation CSS missing ${selector}`);
assert.ok(css.includes('@media (max-width:760px)'), 'Board presentation is missing narrow-viewport behavior');
assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'Board presentation is missing reduced-motion behavior');
assert.ok(css.includes('@media (forced-colors: active)'), 'Board presentation is missing forced-colors behavior');
assert.doesNotMatch(css, /https?:\/\//, 'Board presentation must not depend on remote styles/assets');
assert.doesNotMatch(css, /transition\s*:\s*all\b/, 'Board presentation must not use broad transition-all rules');
for (const marker of ['Monday-style Board presentation audit','boardPresentationMarkup','desktop Board view/toolbar chrome remains sticky','narrow Board chrome releases sticky positioning','Board spreadsheet row density follows the semantic 44px default (42-46px rendered)']) assert.ok(browser.includes(marker), `Board browser audit missing ${marker}`);

const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
for (const dependency of Object.keys(deps)) {
  assert.doesNotMatch(dependency, /monday|vibe/i, `Monday/Vibe runtime dependency must not be introduced: ${dependency}`);
}

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);
const icons = { grid:'',clock:'',fuel:'',trade:'',search:'⌕',settings:'',arrow:'',back:'←',reload:'',external:'',star:'',download:'',upload:'',check:'',user:'',users:'◉',boards:'',lock:'',cloud:'' };
const board = { id:'b1', name:'Operations', description:'Current operational work', member_role:'owner', status:'active' };
const header = renderBoardHeader({ board, canEdit:true, canManage:true, icons, escapeHtml:esc });
assert.ok(header.includes('Operations') && header.includes('Members') && header.includes('Activity') && header.includes('data-board-edit'), 'Board header renderer lost primary/manage actions');

const controls = renderBoardControls({
  state: {
    board: { board: { id:'b1', view_mode:'table' }, groups:[{ id:'g1', title:'Main' }], items:[], columns:[], members:[] },
    boardPrefs: { column_filters:{}, sort_column_id:null, sort_direction:null },
    itemSearch:'', itemStatus:'all', showArchived:false,
  },
  canEdit:true,
  icons,
  escapeHtml:esc,
  historyState:{ canUndo:true, canRedo:false, undoLabel:'edit' },
  statusLabels:[{ id:'working', name:'Working on it', color:'#fdab3d', active:true }],
});
assert.ok(controls.includes('New item') && controls.includes('Main table') && controls.includes('Kanban'), 'Board control renderer lost the Monday-style primary hierarchy');
assert.ok(controls.includes('data-inline-add-focus="g1"') && controls.includes('data-add-group') && controls.includes('data-add-column-menu'), 'New Item split action is not connected to established creation commands');
assert.ok(controls.includes('All statuses') && controls.includes('Working on it'), 'Status filtering is not rendered from configured labels');

assert.match(pkg.scripts['verify:ui'], /verify-v1432-board-monday-integration\.mjs/, 'Board integration verifier must participate in the UI release gate');

console.log('v1.43.2 Monday-style Work Boards integration verification: PASS');
