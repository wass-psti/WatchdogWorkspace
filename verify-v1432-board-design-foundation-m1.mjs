import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const tokens = read('assets/css/foundation/tokens.css');
const themes = read('assets/css/foundation/themes.css');
const boards = read('assets/css/boards-monday.css');
const browser = read('tests/browser/run-cdp.mjs');
const pkg = JSON.parse(read('package.json'));

const foundationTokens = [
  '--wm-board-space-micro:',
  '--wm-board-space-tight:',
  '--wm-board-space-compact:',
  '--wm-board-space-control:',
  '--wm-board-space-standard:',
  '--wm-board-space-section:',
  '--wm-board-space-major:',
  '--wm-board-font-meta:',
  '--wm-board-font-label:',
  '--wm-board-font-control:',
  '--wm-board-font-body:',
  '--wm-board-font-card-title:',
  '--wm-board-font-group-title:',
  '--wm-board-control-compact:',
  '--wm-board-control-small:',
  '--wm-board-control-default:',
  '--wm-board-control-touch:',
  '--wm-board-icon-small:',
  '--wm-board-icon-default:',
  '--wm-board-checkbox-size:',
  '--wm-board-view-tab-height:',
  '--wm-board-toolbar-min-height:',
  '--wm-board-group-header-height:',
  '--wm-board-column-header-height:',
  '--wm-board-row-compact:',
  '--wm-board-row-default:',
  '--wm-board-row-comfortable:',
  '--wm-board-inline-row-height:',
  '--wm-board-status-height:',
  '--wm-board-radius-control:',
  '--wm-board-radius-card:',
  '--wm-board-radius-surface:',
  '--wm-board-radius-status:',
  '--wm-board-shadow-card:',
  '--wm-board-shadow-raised:',
  '--wm-board-shadow-popover:',
  '--wm-board-motion-fast:',
  '--wm-board-motion-standard:',
  '--wm-board-motion-ease:',
];
for (const token of foundationTokens) {
  assert.ok(tokens.includes(token), `Board foundation token missing: ${token}`);
}

const semanticThemeRoles = [
  '--wm-board-primary:',
  '--wm-board-primary-hover:',
  '--wm-board-primary-soft:',
  '--wm-board-primary-contrast:',
  '--wm-board-text:',
  '--wm-board-muted:',
  '--wm-board-disabled:',
  '--wm-board-border:',
  '--wm-board-border-strong:',
  '--wm-board-grid-border:',
  '--wm-board-surface:',
  '--wm-board-surface-subtle:',
  '--wm-board-surface-elevated:',
  '--wm-board-hover:',
  '--wm-board-pressed:',
  '--wm-board-selected:',
  '--wm-board-focus:',
  '--wm-board-overlay:',
];
for (const role of semanticThemeRoles) {
  const escaped = role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const occurrences = themes.match(new RegExp(escaped, 'g')) ?? [];
  assert.equal(occurrences.length, 3, `Board semantic color role must exist exactly once in light, dark and system-dark modes: ${role}`);
}

for (const localAlias of [
  '--board-accent: var(--wm-board-primary);',
  '--board-accent-contrast: var(--wm-board-primary-contrast);',
  '--board-focus: var(--wm-board-focus);',
  '--board-row-height: var(--wm-board-row-default);',
  '--board-column-header-height: var(--wm-board-column-header-height);',
  '--board-group-header-height: var(--wm-board-group-header-height);',
  '--board-toolbar-min-height: var(--wm-board-toolbar-min-height);',
  '--board-radius-control: var(--wm-board-radius-control);',
  '--board-shadow-popover: var(--wm-board-shadow-popover);',
  '--board-motion-fast: var(--wm-board-motion-fast);',
]) assert.ok(boards.includes(localAlias), `Board presentation is not consuming foundation alias ${localAlias}`);

for (const densityMarker of [
  'data-board-density="compact"',
  '--board-row-height: var(--wm-board-row-compact);',
  'data-board-density="comfortable"',
  '--board-row-height: var(--wm-board-row-comfortable);',
]) assert.ok(boards.includes(densityMarker), `Board density foundation missing ${densityMarker}`);

for (const consumptionMarker of [
  'min-height: var(--board-toolbar-min-height);',
  'height:var(--board-row-height)!important;',
  'height:var(--board-column-header-height)!important;',
  'min-height: var(--board-group-header-height)!important;',
  'color: var(--board-accent-contrast)!important;',
  'background:var(--board-surface-elevated)!important;',
  'box-shadow:var(--board-shadow-popover)!important;',
  'transition:',
  'background-color var(--board-motion-fast) var(--board-motion-ease)',
  '@media (pointer:coarse)',
  'min-height: var(--wm-board-control-touch)!important;',
  '@media (prefers-reduced-motion: reduce)',
  'transition-duration:0.01ms!important;',
]) assert.ok(boards.includes(consumptionMarker), `Board foundation consumption missing ${consumptionMarker}`);

// Guard the key geometry roles against drifting back to local magic numbers.
assert.doesNotMatch(boards, /\.board-item-row\s*\{[^}]*height:\s*52px/s, 'Board row height regressed to a local magic number');
assert.doesNotMatch(boards, /\.board-sheet-table thead th\s*\{[^}]*height:\s*52px/s, 'Board column header height regressed to a local magic number');
assert.doesNotMatch(boards, /\.monday-board-toolbar\s*\{[^}]*min-height:\s*[0-9]+px/s, 'Board toolbar height must come from semantic tokens');
assert.doesNotMatch(boards, /transition\s*:\s*all\b/, 'Board foundation must not introduce transition-all');
assert.doesNotMatch(boards, /https?:\/\//, 'Board foundation must not introduce remote visual dependencies');

assert.ok(browser.includes('Board spreadsheet row density follows the semantic 44px default (42-46px rendered)'), 'Browser audit was not updated for the Milestone 1 row-density contract');
assert.match(pkg.scripts['verify:ui'], /verify-v1432-board-design-foundation-m1\.mjs/, 'Milestone 1 foundation verifier must participate in verify:ui');

console.log('v1.43.2 Boards Milestone 1 design foundation verification: PASS');
