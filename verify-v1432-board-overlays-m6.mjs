import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const tokens = read('assets/css/foundation/tokens.css');
const css = read('assets/css/boards-monday.css');
const menu = read('assets/js/features/boards/controllers/board-menu-controller.ts');
const dialog = read('assets/js/features/boards/controllers/dialog-controller.ts');
const inline = read('assets/js/features/boards/controllers/inline-edit-controller.ts');
const presentation = read('src/features/boards/contracts/presentation.ts');
const boardsUi = read('assets/js/boards-ui.ts');
const browser = read('tests/browser/run-cdp.mjs');
const pkg = JSON.parse(read('package.json'));

for (const token of [
  '--wm-board-overlay-gutter: 12px;',
  '--wm-board-overlay-gap: 8px;',
  '--wm-board-menu-min-width: 216px;',
  '--wm-board-menu-max-width: 320px;',
  '--wm-board-menu-item-height: 36px;',
  '--wm-board-menu-max-height: 420px;',
  '--wm-board-popover-min-width: 280px;',
  '--wm-board-popover-max-width: 420px;',
  '--wm-board-popover-max-height: 520px;',
  '--wm-board-dialog-width: 560px;',
  '--wm-board-dialog-backdrop-blur: 8px;',
]) assert.ok(tokens.includes(token), `Milestone 6 overlay token missing ${token}`);

for (const marker of [
  'normalizeMenuMarkup',
  'board-menu-surface',
  'board-menu-item--danger',
  'data.placement',
  "--wm-board-overlay-gap",
  'focusByTypeahead',
  "event.key === 'Home' || event.key === 'End'",
]) assert.ok(menu.includes(marker.replace('data.placement','dataset.placement')), `Milestone 6 menu controller contract missing ${marker}`);

for (const marker of [
  'overlayCoordinator?: OverlayManager | null',
  'board-dialog-backdrop',
  'data-dialog-tone',
  'data.dialogState',
  'initialFocus',
  'aria-busy',
  'function confirm(message: string): Promise<boolean>',
  'MutationObserver',
]) assert.ok(dialog.includes(marker.replace('data.dialogState','dataset.dialogState')), `Milestone 6 dialog contract missing ${marker}`);

for (const marker of [
  'board-popover-surface',
  'data.popoverKind',
  'data.placement',
  '--wm-board-overlay-gutter',
  '--wm-board-popover-max-height',
  'aria-modal',
  'await confirmAction',
]) assert.ok(inline.includes(marker.replace('data.popoverKind','dataset.popoverKind').replace('data.placement','dataset.placement')), `Milestone 6 popover contract missing ${marker}`);

assert.ok(presentation.includes('boolean | Promise<boolean>'), 'Milestone 6 async confirmation contract missing');
for (const marker of [
  'const confirmBoardAction = (message: string): Promise<boolean> => dialogs.confirm(message);',
  'confirmAction: confirmBoardAction',
  'confirmAction:confirmBoardAction',
  'await confirmBoardAction',
]) assert.ok(boardsUi.includes(marker), `Milestone 6 Board confirmation wiring missing ${marker}`);
assert.doesNotMatch(boardsUi, /(^|[^.\w])confirm\s*\(/m, 'Milestone 6 must not use native confirm in the active Board feature composition');

for (const selector of [
  '.board-floating-menu.board-menu-surface',
  '.board-menu-item--danger',
  '.board-inline-popover.board-popover-surface',
  '.board-dialog-backdrop',
  '.board-dialog-heading',
  '.board-confirm-copy',
  '@keyframes boardM6SurfaceIn',
  '@keyframes boardM6DialogIn',
]) assert.ok(css.includes(selector), `Milestone 6 overlay CSS missing ${selector}`);

assert.doesNotMatch(css, /transition\s*:\s*all\b/, 'Milestone 6 must not introduce transition-all');
assert.doesNotMatch(css, /https?:\/\//, 'Milestone 6 must not introduce remote visual dependencies');
assert.ok(browser.includes('Menus, Popovers and Dialogs Milestone 6 audit'), 'Milestone 6 browser audit is not registered');
assert.match(pkg.scripts['verify:ui'], /verify-v1432-board-overlays-m6\.mjs/, 'Milestone 6 verifier is not part of verify:ui');

console.log('Board Menus, Popovers, Dialogs and Microinteractions Milestone 6 verification: PASS');
