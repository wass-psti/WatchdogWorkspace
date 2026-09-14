import fs from 'node:fs';
import assert from 'node:assert/strict';
import { renderBoardTableView } from './assets/js/features/boards/views/table-view.ts';
import { renderBoardItemRow, renderBoardColumnHeader } from './assets/js/features/boards/views/board-workspace-view.ts';

const read = (path) => fs.readFileSync(path, 'utf8');
const tableView = read('assets/js/features/boards/views/table-view.ts');
const workspace = read('assets/js/features/boards/views/board-workspace-view.ts');
const tokens = read('assets/css/foundation/tokens.css');
const css = read('assets/css/boards-monday.css');
const browser = read('tests/browser/run-cdp.mjs');
const pkg = JSON.parse(read('package.json'));

for (const marker of [
  'board-group-count',
  'board-group-select-all',
  'board-column-kind',
  'board-empty-row',
  'board-group-empty-state',
  'board-empty-add',
  'role="region" aria-label="${esc(group.title)} table" tabindex="0"',
  'aria-labelledby="${groupTitleId}"',
  'scope="col" class="board-item-name-head"',
  'data-inline-add-focus',
  'data-inline-add-item',
  'data-add-group',
  'data-add-column',
]) assert.ok(tableView.includes(marker), `Milestone 4 table markup missing ${marker}`);

for (const marker of [
  'aria-selected="${isSelected}"',
  'data-item-drag="${item.id}"',
  'board-item-accent',
  'aria-sort="${sortDirection}"',
  'data-column-quick-sort',
  'data-column-resize',
  'data-column-drag',
  'data-board-menu-trigger="column"',
]) assert.ok(workspace.includes(marker), `Milestone 4 row/column contract missing ${marker}`);

for (const token of [
  '--wm-board-drag-cell-width: 28px;',
  '--wm-board-action-cell-width: 44px;',
  '--wm-board-column-resize-hit-width: 10px;',
  '--wm-board-item-column-min-width: 220px;',
  '--wm-board-table-min-width: 820px;',
  '--wm-board-empty-state-min-height: 84px;',
]) assert.ok(tokens.includes(token), `Milestone 4 foundation token missing ${token}`);

for (const selector of [
  '.board-group-count',
  '.board-table-scroll:focus-visible',
  '.board-sheet-table .select-col',
  '.board-sheet-table .drag-col',
  '.board-sheet-table .actions-col',
  '.board-sheet-table .board-item-name-head',
  '.board-sheet-table .board-item-name-cell',
  '.board-sheet-table .board-column-head.is-sorted',
  '.board-sheet-table .column-resize-handle',
  '.board-sheet-table .board-item-accent',
  '.board-sheet-table .board-item-row.item-drop-before',
  '.board-sheet-table .board-item-row.item-drop-after',
  '.board-group-empty-state',
  '.board-empty-add',
  '.board-group-add-row',
  '@media (max-width:760px)',
  '@media (pointer:coarse)',
]) assert.ok(css.includes(selector), `Milestone 4 table CSS missing ${selector}`);

for (const contract of [
  'left: calc(var(--wm-board-selection-cell-width) + var(--wm-board-drag-cell-width))!important;',
  'min-width: max(100%,var(--wm-board-table-min-width));',
  'height:var(--board-row-height)!important;',
  'border-left: var(--wm-board-accent-rail-width) solid var(--group-accent);',
  'grid-template-columns: var(--wm-board-accent-rail-width) minmax(0,1fr) auto auto!important;',
  'background: color-mix(in srgb,var(--group-accent) 10%,var(--board-surface))!important;',
  'position: sticky!important;',
  'right: 0!important;',
]) assert.ok(css.includes(contract), `Milestone 4 table layout/state contract missing ${contract}`);

assert.doesNotMatch(css, /transition\s*:\s*all\b/, 'Milestone 4 must not introduce transition-all');
assert.doesNotMatch(css, /https?:\/\//, 'Milestone 4 must not introduce remote visual dependencies');

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);
const group = { id:'g1', board_id:'b1', title:'Active work', position:0, accent_color:'#579bfc' };
const column = { id:'c1', board_id:'b1', name:'Status', data_type:'status', position:0, visible:true, system_key:null };
const item = { id:'i1', board_id:'b1', group_id:'g1', title:'Prepare monthly close', position:0, status:'done', archived:false, archived_at:null };
const state = {
  boardPrefs:{ collapsed_groups:[], column_filters:{}, sort_column_id:null, sort_direction:null },
  selectedItems:['i1'], itemSearch:'', itemStatus:'all',
  itemPanel:{ itemId:null },
};
const row = renderBoardItemRow({
  state, item, group, columns:[column], canEdit:true, isWrapped:()=>false,
  formatCell:()=>'<span class="status-pill configurable-status-pill">Done</span>', escapeHtml:esc, isSelected:true,
});
const header = renderBoardColumnHeader({ column, canEdit:true, sort:{ id:'c1', direction:'asc' }, filter:'', wrapped:false, columnTypeLabel:()=> 'Status', escapeHtml:esc });
const table = renderBoardTableView({
  state, groups:[group], items:[item], visibleColumns:()=>[column], allColumns:()=>[column], canEdit:()=>true,
  itemMatches:()=>true, compareItems:()=>0, renderColumnHeader:()=>header, renderItemRow:()=>row, escapeHtml:esc,
  itemNameWidth:280, columnWidth:()=>160,
});

assert.ok(table.includes('aria-labelledby="boardGroupTitle-g1"'), 'Milestone 4 group/table association missing');
assert.ok(table.includes('tabindex="0"') && table.includes('role="region"'), 'Milestone 4 horizontal scroller is not keyboard reachable');
assert.ok(table.includes('board-group-count') && table.includes('1 item'), 'Milestone 4 group count hierarchy missing');
assert.ok(table.includes('board-group-select-all'), 'Milestone 4 group select-all control missing');
assert.ok(table.includes('board-group-add-row') && table.includes('data-inline-add-item="g1"'), 'Milestone 4 in-grid item creation lost');
assert.ok(row.includes('aria-selected="true"') && row.includes('board-item-accent'), 'Milestone 4 selected row identity missing');
assert.ok(header.includes('aria-sort="ascending"'), 'Milestone 4 sorted column does not expose aria-sort');

const emptyTable = renderBoardTableView({
  state:{ ...state, selectedItems:[] }, groups:[group], items:[], visibleColumns:()=>[column], allColumns:()=>[column], canEdit:()=>true,
  itemMatches:()=>true, compareItems:()=>0, renderColumnHeader:()=>header, renderItemRow:()=>row, escapeHtml:esc,
});
assert.ok(emptyTable.includes('This group is ready for work') && emptyTable.includes('Add first item'), 'Milestone 4 empty group lacks an actionable in-context state');

assert.ok(browser.includes('Main Table Milestone 4 audit'), 'Milestone 4 browser geometry audit is not registered');
assert.match(pkg.scripts['verify:ui'], /verify-v1432-board-main-table-m4\.mjs/, 'Milestone 4 verifier is not part of verify:ui');

console.log('Board Main Table Milestone 4 verification: PASS');
