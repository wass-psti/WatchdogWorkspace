import fs from 'node:fs';
import assert from 'node:assert/strict';
import { renderBoardItemRow, renderBoardColumnHeader } from './assets/js/features/boards/views/board-workspace-view.ts';

const read = (path) => fs.readFileSync(path, 'utf8');
const boardsUi = read('assets/js/boards-ui.ts');
const workspace = read('assets/js/features/boards/views/board-workspace-view.ts');
const inlineEditor = read('assets/js/features/boards/controllers/inline-edit-controller.ts');
const tokens = read('assets/css/foundation/tokens.css');
const css = read('assets/css/boards-monday.css');
const browser = read('tests/browser/run-cdp.mjs');
const pkg = JSON.parse(read('package.json'));

for (const token of [
  '--wm-board-cell-padding-inline: 10px;',
  '--wm-board-cell-icon-size: 16px;',
  '--wm-board-cell-chip-height: 28px;',
  '--wm-board-avatar-size: 26px;',
  '--wm-board-cell-editor-min-width: 280px;',
  '--wm-board-cell-editor-max-width: 420px;',
  '--wm-board-cell-editor-control-height: 36px;',
]) assert.ok(tokens.includes(token), `Milestone 5 foundation token missing ${token}`);

for (const marker of [
  'board-person-avatar',
  'board-person-name',
  'board-date-cell',
  'board-number-cell',
  'status-pill-dot',
  'status-pill-label',
  'choice-pill-label',
  'board-cell-leading-icon',
  'board-cell-empty--${column.data_type}',
]) assert.ok(boardsUi.includes(marker), `Milestone 5 typed cell formatter missing ${marker}`);

for (const marker of [
  'COLUMN_TYPE_GLYPHS',
  'cellActionLabel',
  'board-data-cell--${column.data_type}',
  'board-cell-button--${column.data_type}',
  'data-cell-state="${empty ? \'empty\' : \'value\'}"',
  'board-column-type-icon',
  'board-column-head--${column.data_type}',
  'column-header-title',
  'column-header-meta',
]) assert.ok(workspace.includes(marker), `Milestone 5 row/column contract missing ${marker}`);

for (const marker of [
  'displayInitials',
  'board-choice-option',
  'role="listbox" aria-label="Choose ${esc(column.name)}"',
  'board-cell-editor-heading',
  'board-person-choice-list',
  'board-person-choice-copy',
  'board-person-choice-check',
  'aria-selected="${selected}"',
]) assert.ok(inlineEditor.includes(marker), `Milestone 5 typed editor contract missing ${marker}`);

for (const selector of [
  '.board-column-type-icon',
  '.board-cell-button--number',
  '.board-number-cell',
  '.board-cell-button--checkbox',
  '.board-person-avatar',
  '.board-person-name',
  '.board-date-cell',
  '.timeline-cell',
  '.choice-pill',
  '.status-pill-dot',
  '.board-inline-editor-shell',
  '.board-inline-input',
  '.board-choice-option',
  '.board-person-choice',
  '.status-choice',
  '.board-inline-form',
]) assert.ok(css.includes(selector), `Milestone 5 cell/editor CSS missing ${selector}`);

for (const contract of [
  'grid-template-columns: var(--wm-board-column-drag-width) var(--wm-board-cell-icon-size) minmax(0,1fr) var(--board-control-compact) var(--board-control-small)!important;',
  'justify-content:flex-end!important;',
  'font-variant-numeric:tabular-nums;',
  'width:var(--wm-board-avatar-size);',
  'min-height:var(--wm-board-cell-chip-height);',
  'min-height:var(--wm-board-cell-editor-control-height)!important;',
]) assert.ok(css.includes(contract), `Milestone 5 typed geometry contract missing ${contract}`);

assert.doesNotMatch(css, /transition\s*:\s*all\b/, 'Milestone 5 must not introduce transition-all');
assert.doesNotMatch(css, /https?:\/\//, 'Milestone 5 must not introduce remote visual dependencies');

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);
const group = { id:'g1', board_id:'b1', title:'Active work', position:0, accent_color:'#579bfc' };
const item = { id:'i1', board_id:'b1', group_id:'g1', title:'Prepare monthly close', position:0, status:'done', archived:false, archived_at:null };
const status = { id:'c1', board_id:'b1', name:'Status', data_type:'status', position:0, visible:true, system_key:null };
const people = { id:'c2', board_id:'b1', name:'Owner', data_type:'people', position:1, visible:true, system_key:null };
const number = { id:'c3', board_id:'b1', name:'Amount', data_type:'number', position:2, visible:true, system_key:null };
const state = { itemPanel:{ itemId:null } };
const row = renderBoardItemRow({
  state, item, group, columns:[status, people, number], canEdit:true, isWrapped:()=>false,
  formatCell:(_item, column) => column.data_type === 'people'
    ? '<span class="board-person-cell"><span class="board-person-avatar">AM</span><span class="board-person-name">Alex Morgan</span></span>'
    : column.data_type === 'number'
      ? '<span class="board-number-cell">12,450.75</span>'
      : '<span class="status-pill configurable-status"><span class="status-pill-dot"></span><span class="status-pill-label">Done</span></span>',
  escapeHtml:esc, isSelected:false,
});
const header = renderBoardColumnHeader({ column:status, canEdit:true, sort:{ id:null, direction:null }, filter:'', wrapped:false, columnTypeLabel:()=> 'Status', escapeHtml:esc });

assert.ok(row.includes('board-data-cell--status') && row.includes('board-cell-button--status'), 'Milestone 5 typed Status cell class missing');
assert.ok(row.includes('board-data-cell--people') && row.includes('aria-label="Assign Owner for Prepare monthly close"'), 'Milestone 5 People cell semantics missing');
assert.ok(row.includes('board-data-cell--number') && row.includes('aria-label="Edit Amount for Prepare monthly close"'), 'Milestone 5 Number cell semantics missing');
assert.ok(header.includes('board-column-type-icon--status') && header.includes('data-column-type="status"'), 'Milestone 5 column-type identity missing');

assert.ok(browser.includes('Cell and Column Milestone 5 audit'), 'Milestone 5 browser visual audit is not registered');
assert.match(pkg.scripts['verify:ui'], /verify-v1432-board-cell-column-m5\.mjs/, 'Milestone 5 verifier is not part of verify:ui');

console.log('Board Cell and Column Milestone 5 verification: PASS');
