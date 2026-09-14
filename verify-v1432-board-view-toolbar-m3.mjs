import fs from 'node:fs';
import assert from 'node:assert/strict';
import { renderBoardControls } from './assets/js/features/boards/views/board-workspace-view.ts';

const read = (path) => fs.readFileSync(path, 'utf8');
const workspace = read('assets/js/features/boards/views/board-workspace-view.ts');
const boardsUi = read('assets/js/boards-ui.ts');
const menuController = read('assets/js/features/boards/controllers/board-menu-controller.ts');
const css = read('assets/css/boards-monday.css');
const browser = read('tests/browser/run-cdp.mjs');
const pkg = JSON.parse(read('package.json'));

for (const marker of [
  'data-board-command-stack',
  'board-view-tabs',
  'board-view-tab',
  'aria-controls="boardViewRegion"',
  'tabindex="${view === \'table\' ? \'0\' : \'-1\'}"',
  'board-view-state-summary',
  'board-command-search',
  'data-clear-item-search',
  'board-tool-status',
  'board-tool-people',
  'data-board-menu-trigger="filter"',
  'data-board-menu-trigger="sort"',
  'board-tool-columns',
  'board-history-button',
  'board-tool-more',
  'board-responsive-overflow-menu',
  'data-toolbar-status-value',
  'board-tool-badge',
]) assert.ok(workspace.includes(marker), `Milestone 3 Board command markup missing ${marker}`);

for (const hook of [
  'data-board-view="table"',
  'data-board-view="kanban"',
  'data-inline-add-focus',
  'data-board-menu-trigger="create"',
  'data-item-search',
  'data-item-status',
  'data-column-filter',
  'data-column-sort',
  'data-board-columns',
  'data-board-undo',
  'data-board-redo',
  'data-toggle-archived-items',
  'data-reset-board-view',
  'data-add-group',
  'data-add-column-menu',
]) assert.ok(workspace.includes(hook), `Milestone 3 lost established command hook ${hook}`);

for (const routingMarker of [
  "target.closest<HTMLButtonElement>('[data-board-view]')",
  "event.key === 'ArrowLeft'",
  "event.key === 'ArrowRight'",
  "event.key === 'Home'",
  "event.key === 'End'",
  "btn.matches('[data-clear-item-search]')",
  "btn.matches('[data-toolbar-status-value]')",
  "btn.matches('[data-column-filter]')",
  "btn.matches('[data-column-sort],[data-column-quick-sort]')",
  "document.querySelectorAll<HTMLButtonElement>('[data-board-undo]')",
  "document.querySelectorAll<HTMLButtonElement>('[data-board-redo]')",
  'id="boardViewRegion"',
  'role="tabpanel"',
]) assert.ok(boardsUi.includes(routingMarker), `Milestone 3 command routing/accessibility missing ${routingMarker}`);

for (const menuInvariant of [
  "target.closest<HTMLElement>('[data-board-menu-trigger]')",
  "button:not(:disabled),[role=\"menuitem\"]:not([aria-disabled=\"true\"])",
  "event.key === 'ArrowDown' || event.key === 'ArrowUp'",
  "event.key === 'Home' || event.key === 'End'",
  "event.key === 'Escape'",
]) assert.ok(menuController.includes(menuInvariant), `Milestone 3 menu keyboard contract missing ${menuInvariant}`);

for (const selector of [
  '.board-view-tabs',
  '.board-view-tab',
  '.board-view-state-summary',
  '.board-command-icon',
  '.board-command-button',
  '.board-tool-badge',
  '.board-command-search',
  '.board-search-clear',
  '.board-command-select',
  '.board-history-button',
  '.board-menu-section-label',
  '.board-sort-menu-group',
  '.board-responsive-overflow-menu',
  '@media (max-width:1180px)',
  '@media (max-width:900px)',
  '@media (max-width:760px)',
  '@media (max-width:480px)',
  '@media (pointer:coarse)',
]) assert.ok(css.includes(selector), `Milestone 3 command CSS missing ${selector}`);

for (const contract of [
  'grid-template-columns: auto minmax(0,1fr) auto;',
  'min-height: var(--board-toolbar-min-height);',
  'min-height: var(--board-control-default)!important;',
  'background: var(--board-selected)!important;',
  'color: var(--board-accent)!important;',
  'width: min(var(--wm-board-search-width),26vw);',
  'display:flex!important;',
  'flex-wrap:wrap;',
  ':is(.board-tool-status,.board-tool-people,.board-tool-columns) { display:none!important; }',
  '.board-responsive-overflow-menu { display:block; }',
]) assert.ok(css.includes(contract), `Milestone 3 layout/state contract missing ${contract}`);

assert.doesNotMatch(css, /transition\s*:\s*all\b/, 'Milestone 3 must not introduce transition-all');
assert.doesNotMatch(css, /https?:\/\//, 'Milestone 3 must not introduce remote visual dependencies');
assert.doesNotMatch(workspace, /Add view/, 'Milestone 3 must not invent unsupported saved-view creation capability');

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);
const icons = { grid:'',clock:'',fuel:'',trade:'',search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/></svg>',settings:'',arrow:'',back:'',reload:'',external:'',star:'',download:'',upload:'',check:'',user:'',users:'',boards:'',lock:'',cloud:'' };

const controls = renderBoardControls({
  state: {
    board: {
      board: { id:'b1', view_mode:'table' },
      groups:[{ id:'g1', title:'Main' }],
      items:[], members:[], values:[],
      columns:[
        { id:'status-col', board_id:'b1', name:'Workflow status', data_type:'status', position:0, visible:true },
        { id:'owner-col', board_id:'b1', name:'Owner', data_type:'people', position:1, visible:true },
        { id:'date-col', board_id:'b1', name:'Due date', data_type:'date', position:2, visible:true },
      ],
    },
    boardPrefs: {
      column_filters:{ 'owner-col':'Alex' },
      sort_column_id:'date-col',
      sort_direction:'asc',
    },
    itemSearch:'delivery',
    itemStatus:'working',
    showArchived:false,
  },
  canEdit:true,
  icons,
  escapeHtml:esc,
  historyState:{ canUndo:true, canRedo:false, undoLabel:'rename item', redoLabel:null },
  statusLabels:[
    { id:'working', name:'Working on it', color:'#fdab3d', active:true, position:0 },
    { id:'done', name:'Done', color:'#00c875', active:true, position:1 },
  ],
});

assert.ok(controls.includes('role="tablist"') && controls.includes('role="tab"'), 'Milestone 3 view navigation lost tab semantics');
assert.ok(controls.includes('aria-selected="true"') && controls.includes('tabindex="0"'), 'Active Board view is not represented as the roving tab stop');
assert.ok(controls.includes('role="search"') && controls.includes('id="boardItemSearch"'), 'Search is not rendered as one accessible command control');
assert.ok(controls.includes('data-clear-item-search'), 'Active search does not expose a clear action');
assert.ok(controls.includes('board-tool-people is-active') && controls.includes('data-column-filter="owner-col"'), 'People quick filter is not connected to the existing column filter workflow');
assert.ok(controls.includes('board-tool-filter is-active') && controls.includes('aria-label="2 active filters"'), 'Toolbar does not summarize active status + column filters');
assert.ok(controls.includes('board-tool-sort is-active') && controls.includes('Clear sorting · Due date'), 'Active sort state is not represented in the command hierarchy');
assert.ok(controls.includes('data-column-sort="date-col" data-direction="asc" class="is-selected"'), 'Sort menu does not expose active direction');
assert.ok(controls.includes('board-view-state-summary') && controls.includes('2 active filters') && controls.includes('Sorted by Due date'), 'View navigation does not summarize active view state');
assert.ok(controls.includes('data-board-columns') && controls.includes('board-tool-columns'), 'Editable toolbar lost Columns management');
assert.ok(controls.includes('board-responsive-overflow-menu') && controls.includes('data-toolbar-status-value="working"'), 'Responsive overflow does not preserve hidden Status filter access');
assert.ok(controls.includes('board-overflow-history') && controls.includes('data-board-undo'), 'Responsive overflow does not preserve hidden history access');
assert.ok(controls.includes('New item') && controls.includes('data-board-menu-trigger="create"'), 'New item split action regressed');

const viewer = renderBoardControls({
  state: {
    board:{ board:{ id:'b2', view_mode:'kanban' }, groups:[{ id:'g2', title:'Main' }], items:[], members:[], values:[], columns:[] },
    boardPrefs:{ column_filters:{}, sort_column_id:null, sort_direction:null },
    itemSearch:'', itemStatus:'all', showArchived:false,
  },
  canEdit:false,
  icons,
  escapeHtml:esc,
  historyState:{ canUndo:false, canRedo:false },
  statusLabels:[],
});
assert.ok(viewer.includes('data-board-view="kanban" class="board-view-tab active"'), 'Kanban view does not render active state');
assert.ok(viewer.includes('disabled title="Create a group before adding an item"'), 'Read-only New item action is not safely disabled');
assert.ok(!viewer.includes('board-tool-columns'), 'Read-only toolbar incorrectly exposes column administration');
assert.ok(!viewer.includes('data-board-menu-trigger="create"'), 'Read-only toolbar incorrectly exposes create overflow');

for (const browserMarker of [
  'Board view/toolbar Milestone 3 audit: active view tab has semantic underline',
  'Board view/toolbar Milestone 3 audit: primary toolbar controls share command geometry',
  'Board view/toolbar Milestone 3 audit: narrow toolbar progressively collapses secondary commands',
  'Board view/toolbar Milestone 3 audit: compact overflow preserves hidden command access',
  'Board view/toolbar Milestone 3 audit: command surface has no horizontal document overflow',
]) assert.ok(browser.includes(browserMarker), `Milestone 3 browser coverage missing ${browserMarker}`);

assert.match(pkg.scripts['verify:ui'], /verify-v1432-board-view-toolbar-m3\.mjs/, 'Milestone 3 verifier must participate in verify:ui');
const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
for (const dependency of Object.keys(deps)) assert.doesNotMatch(dependency, /monday|vibe/i, `Monday/Vibe runtime dependency must not be introduced: ${dependency}`);

console.log('v1.43.2 Boards Milestone 3 view navigation/command toolbar verification: PASS');
