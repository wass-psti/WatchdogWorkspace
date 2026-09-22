import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const tokens = read('assets/css/foundation/tokens.css');
const css = read('assets/css/boards-monday.css');
const boardUi = read('assets/js/boards-ui.ts');
const workspace = read('assets/js/features/boards/views/board-workspace-view.ts');
const table = read('assets/js/features/boards/views/table-view.ts');
const kanban = read('assets/js/features/boards/views/kanban-view.ts');
const itemWorkspace = read('assets/js/features/boards/views/item-workspace-view.ts');
const itemRenderer = read('assets/js/features/boards/controllers/item-panel-renderer.ts');
const resize = read('assets/js/features/boards/controllers/column-resize-controller.ts');
const structureDrag = read('assets/js/features/boards/controllers/structure-drag-controller.ts');
const itemDrag = read('assets/js/features/boards/controllers/drag-drop-controller.ts');
const browser = read('tests/browser/run-cdp.mjs');
const pkg = JSON.parse(read('package.json'));

for (const token of [
  '--wm-board-content-gutter: clamp(12px, 1.5vw, 24px);',
  '--wm-board-readable-measure: 72ch;',
  '--wm-board-scrollbar-size: 10px;',
  '--wm-board-focus-offset: 2px;',
  '--wm-board-keyboard-resize-step: 8px;',
  '--wm-board-keyboard-resize-step-large: 24px;',
  '--wm-board-safe-area-bottom: max(12px, env(safe-area-inset-bottom));',
  '--wm-board-safe-area-inline: max(12px, env(safe-area-inset-left));',
]) assert.ok(tokens.includes(token), `Milestone 8 foundation token missing ${token}`);

for (const marker of [
  'Milestone 8 — Responsive, Accessibility and Final Production Polish',
  'scrollbar-gutter:stable',
  'overscroll-behavior:contain',
  '--wm-board-readable-measure',
  '@media (min-width:1440px)',
  '@media (max-width:1120px)',
  '@media (max-width:840px)',
  '@media (max-width:760px)',
  '@media (max-width:600px)',
  '@media (max-width:420px)',
  '@media (pointer:coarse)',
  '@media (prefers-contrast:more)',
  '@media (prefers-reduced-motion:reduce)',
  '@media (forced-colors:active)',
  '.column-resize-handle[tabindex="0"]:focus',
  ':is(.group-drag-handle,.column-drag-handle,.drag-handle):focus',
]) assert.ok(css.includes(marker), `Milestone 8 final presentation CSS missing ${marker}`);

assert.doesNotMatch(css, /transition\s*:\s*all\b/, 'Milestone 8 must not introduce transition-all');
assert.doesNotMatch(css, /https?:\/\//, 'Milestone 8 must not introduce remote visual dependencies');
assert.match(css, /@media \(pointer:coarse\)[\s\S]*min-height:var\(--wm-board-control-touch\)!important/, 'Milestone 8 structural touch controls must reach the semantic 44px target');
assert.match(css, /@media \(forced-colors:active\)[\s\S]*\.board-item-row\.is-selected/, 'Milestone 8 forced-colors selected-row identity is missing');
assert.match(css, /@media \(prefers-reduced-motion:reduce\)[\s\S]*transition-duration:\.01ms!important/, 'Milestone 8 reduced-motion normalization is missing');

for (const marker of [
  'id="boardViewTab-table"',
  'id="boardViewTab-kanban"',
  'tabindex="${view === \'table\' ? \'0\' : \'-1\'}"',
  'role="separator" aria-orientation="vertical"',
  'role="button" tabindex="0" aria-label="Reorder',
]) assert.ok(workspace.includes(marker), `Milestone 8 Board workspace accessibility contract missing ${marker}`);

for (const marker of [
  'role="region" aria-label="${esc(group.title)} table" tabindex="0" aria-describedby=',
  'role="separator" aria-orientation="vertical" aria-label="Resize item column"',
  'Use Tab or arrow keys to move through interactive cells.',
  'Column resize handles support Arrow Left and Arrow Right.',
]) assert.ok(table.includes(marker), `Milestone 8 Main Table accessibility contract missing ${marker}`);

assert.ok(kanban.includes('class="kanban-board" role="region" aria-label="Board Kanban view. Scroll horizontally to review status lanes." tabindex="0"'), 'Milestone 8 Kanban work surface must be keyboard-focusable');
assert.ok(kanban.includes('class="kanban-board kanban-board-empty" role="region" aria-label="Board Kanban view" tabindex="0"'), 'Milestone 8 empty Kanban work surface must remain keyboard-focusable');

for (const marker of [
  'const tabId = (id: ItemWorkspaceTab)',
  'tabindex="${tab === id ? \'0\' : \'-1\'}"',
  'role="tabpanel" aria-labelledby="${tabId(tab)}" tabindex="0"',
]) assert.ok(itemWorkspace.includes(marker), `Milestone 8 Item Workspace tab semantics missing ${marker}`);
for (const marker of [
  "button.setAttribute('tabindex', fresh.getAttribute('tabindex') || '-1')",
  "currentBody.setAttribute('aria-labelledby', labelledBy)",
]) assert.ok(itemRenderer.includes(marker), `Milestone 8 stable Item Workspace accessibility sync missing ${marker}`);

assert.ok(boardUi.includes('function syncBoardViewAccessibility'), 'Milestone 8 Board view tabpanel labeling synchronizer is missing');
assert.ok(boardUi.includes("viewHost.setAttribute('aria-labelledby', activeTab.id)"), 'Milestone 8 active Board view must label its tabpanel');

for (const marker of [
  'const KEYBOARD_STEP = 8;',
  'const KEYBOARD_STEP_LARGE = 24;',
  "['ArrowLeft', 'ArrowRight', 'Home', 'End']",
  "handle.setAttribute('aria-valuenow', String(width))",
  'event.shiftKey ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP',
]) assert.ok(resize.includes(marker), `Milestone 8 keyboard column resizing contract missing ${marker}`);

for (const marker of [
  'data-board-structure-live',
  "['ArrowLeft', 'ArrowRight', 'Home', 'End']",
  "['ArrowUp', 'ArrowDown', 'Home', 'End']",
  'void keyboardMove(',
]) assert.ok(structureDrag.includes(marker), `Milestone 8 keyboard structure reordering contract missing ${marker}`);

for (const marker of [
  'async function keyboardReorder',
  "['ArrowUp', 'ArrowDown', 'Home', 'End']",
]) assert.ok(itemDrag.includes(marker), `Milestone 8 keyboard item reordering contract missing ${marker}`);

const legacyInlineKeyboardItemHandle = "eventElement(event)?.closest<HTMLElement>('[data-item-drag]')";
const delegatedKeyboardItemTarget = 'const target = eventElement(event);';
const delegatedKeyboardItemHandle = "target?.closest<HTMLElement>('[data-item-drag]')";
assert.ok(
  itemDrag.includes(legacyInlineKeyboardItemHandle) ||
    (itemDrag.includes(delegatedKeyboardItemTarget) && itemDrag.includes(delegatedKeyboardItemHandle)),
  'Milestone 8 keyboard item reordering contract must resolve [data-item-drag] from eventElement(event), inline or through a local target',
);

for (const marker of [
  'Board keyboard resize and structural reordering',
  'Responsive, Accessibility and Final Production Polish Milestone 8 audit',
  "name:'minimum supported narrow',width:320,height:700",
  "name:'enlarged text',width:820,height:980,rootFontSize:'20px'",
  "name:'prefers-reduced-motion',value:'reduce'",
  "name:'forced-colors',value:'active'",
]) assert.ok(browser.includes(marker), `Milestone 8 browser regression coverage missing ${marker}`);

assert.match(pkg.scripts['verify:ui'], /verify-v1432-board-final-polish-m8\.mjs/, 'Milestone 8 verifier is not part of verify:ui');

console.log('Boards Responsive, Accessibility and Final Production Polish Milestone 8 verification: PASS');
