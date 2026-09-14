import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const tokens = read('assets/css/foundation/tokens.css');
const css = read('assets/css/boards-monday.css');
const kanban = read('assets/js/features/boards/views/kanban-view.ts');
const workspace = read('assets/js/features/boards/views/item-workspace-view.ts');
const renderer = read('assets/js/features/boards/controllers/item-panel-renderer.ts');
const browser = read('tests/browser/run-cdp.mjs');
const pkg = JSON.parse(read('package.json'));

for (const token of [
  '--wm-board-kanban-lane-width: 312px;',
  '--wm-board-kanban-lane-min-height: 520px;',
  '--wm-board-kanban-lane-header-height: 56px;',
  '--wm-board-kanban-card-min-height: 124px;',
  '--wm-board-kanban-avatar-size: 24px;',
  '--wm-board-item-panel-width: 720px;',
  '--wm-board-item-panel-min-width: 560px;',
  '--wm-board-item-panel-header-min-height: 132px;',
  '--wm-board-item-panel-tabs-height: 52px;',
  '--wm-board-item-panel-content-max-width: 660px;',
  '--wm-board-item-update-editor-min-height: 112px;',
  '--wm-board-item-empty-min-height: 180px;',
]) assert.ok(tokens.includes(token), `Milestone 7 foundation token missing ${token}`);

for (const marker of [
  'kanban-lane-identity',
  'kanban-lane-swatch',
  'kanban-lane-count',
  'kanban-card-context',
  'kanban-card-assignee',
  'kanban-card-due',
  'kanban-empty-add',
  'role="list"',
  'data-drop-status',
  'data-kanban-add-status',
  'data-open-item',
]) assert.ok(kanban.includes(marker), `Milestone 7 Kanban rendering contract missing ${marker}`);

for (const marker of [
  'item-panel-context-label',
  'item-panel-status-swatch',
  'item-panel-section-count',
  'item-file-drop-copy',
  'item-file-drop-action',
  'data-activity-tone',
  'data-item-panel-body',
  'data-item-tab-stage',
  'data-item-panel-tab',
  'data-item-update-form',
  'data-item-file-input',
]) assert.ok(workspace.includes(marker), `Milestone 7 Item Workspace rendering contract missing ${marker}`);

for (const marker of [
  "syncRegion(currentPanel.querySelector('.item-panel-head')",
  "currentPanel.querySelector<HTMLElement>('.item-panel-tabs')",
  'currentBody.replaceChildren(nextStage)',
  'scrollByTab.set(previousTab, currentBody.scrollTop)',
]) assert.ok(renderer.includes(marker), `Milestone 7 stable Item Workspace shell contract missing ${marker}`);

for (const selector of [
  '/* Milestone 7 — Kanban and Item Workspace harmonization.',
  '.kanban-lane-identity',
  '.kanban-card-context',
  '.kanban-card-meta',
  '.kanban-empty-add',
  '.board-item-panel',
  '.item-panel-context',
  '.item-panel-tabs.wm-motion-nav',
  '.item-update-compose-shell',
  '.item-file-drop-copy',
  '.item-activity-list',
  '@media (pointer:coarse)',
  '@media (prefers-reduced-motion:reduce)',
]) assert.ok(css.includes(selector), `Milestone 7 harmonization CSS missing ${selector}`);

assert.ok(css.includes('body[data-wm-surface="shell"] :is(.boards-page,.board-detail-page,.board-item-panel,.item-panel-scrim) {'), 'Milestone 7 portaled Item Workspace must inherit the Board semantic aliases outside the board page subtree');
assert.match(css, /grid-template-rows:auto var\(--wm-board-item-panel-tabs-height\) minmax\(0,1fr\)/, 'Milestone 7 drawer shell must keep header/tabs stationary while only the body scrolls');
assert.match(css, /\.kanban-board \{[\s\S]*grid-auto-columns:var\(--wm-board-kanban-lane-width\);/, 'Milestone 7 Kanban lanes must consume the fixed 312px semantic lane-width token on desktop');
assert.doesNotMatch(css, /grid-auto-columns:minmax\(var\(--wm-board-kanban-lane-width\),1fr\)/, 'Milestone 7 Kanban lanes must not expand beyond the semantic lane-width token on wide viewports');
assert.match(css, /\.item-panel-body \{[\s\S]*overflow:auto!important/, 'Milestone 7 drawer body must own collaboration scrolling');
assert.match(css, /\.kanban-card\.dragging[\s\S]*opacity:/, 'Milestone 7 Kanban drag feedback missing');
assert.match(css, /\.kanban-column\.drag-over[\s\S]*box-shadow:/, 'Milestone 7 Kanban lane drop feedback missing');
assert.doesNotMatch(css, /transition\s*:\s*all\b/, 'Milestone 7 must not introduce transition-all');
assert.doesNotMatch(css, /https?:\/\//, 'Milestone 7 must not introduce remote visual dependencies');
assert.ok(browser.includes('Kanban and Item Workspace Milestone 7 audit'), 'Milestone 7 browser audit is not registered');
assert.match(pkg.scripts['verify:ui'], /verify-v1432-board-kanban-workspace-m7\.mjs/, 'Milestone 7 verifier is not part of verify:ui');

console.log('Board Kanban and Item Workspace Harmonization Milestone 7 verification: PASS');
