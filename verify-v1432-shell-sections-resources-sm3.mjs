import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('assets/js/app.ts');
const css = read('assets/css/shell-navigation.css');
const tokens = read('assets/css/foundation/tokens.css');
const browser = read('tests/browser/run-cdp.mjs');
const pkg = JSON.parse(read('package.json'));

for (const marker of [
  '--wm-shell-navigation-section-header-height: 32px;',
  '--wm-shell-navigation-resource-row-height: 40px;',
  '--wm-shell-navigation-resource-row-touch-height: 48px;',
  '--wm-shell-navigation-resource-icon-size: 24px;',
  '--wm-shell-navigation-resource-search-height: 34px;',
  '--wm-shell-navigation-section-chevron-size: 14px;',
]) assert.ok(tokens.includes(marker), `Shell M3 semantic token missing: ${marker}`);

for (const marker of [
  "import type { ShellNavigationMode, ShellSectionClientState, ShellSectionId } from '../../src/platform/contracts/client-state.ts';",
  "wm.platform.shell-sections.v1",
  'function shellActiveResourceKey(',
  'function shellResourceItemMarkup(',
  'function shellModuleResourceMarkup(',
  'function shellBoardResourceRows(',
  'function shellSectionMarkup(',
  'data-shell-resource-navigation',
  'data-shell-resource-search',
  'data-shell-section-toggle',
  "shellSectionMarkup('favorites', 'Favorites'",
  "shellSectionMarkup('applications', 'Applications'",
  "shellSectionMarkup('boards', 'Boards'",
  'preferences.favorites.includes(mod.id)',
  "platformServices.boards.service.list('active')",
  'auth.canAccessModule(mod.id)',
  'disabled aria-disabled="true"',
  'function applyShellResourceFilter()',
  'function refreshShellBoardResources()',
  'renderWorkspace(content, `app/${mod.id}`, \'module\');',
]) assert.ok(app.includes(marker), `Shell M3 runtime contract missing: ${marker}`);

assert.doesNotMatch(app, /data-vibe|leftpaneMF|_leftpane_/i, 'Shell M3 must translate reference behavior without importing Monday/Vibe runtime DOM contracts');
assert.doesNotMatch(app, /my[_ -]?work/i, 'Shell M3 must not fabricate an unsupported My Work route');

for (const marker of [
  '.shell-nav-primary',
  '.shell-resource-navigation',
  '.shell-resource-search',
  '.shell-nav-section-toggle',
  '.shell-nav-section-body',
  '.shell-resource-item',
  '.shell-resource-copy',
  '.shell-resource-favorite',
  '.shell-resource-empty',
  '[data-shell-section="favorites"]',
  '[data-shell-section="applications"]',
  '[data-shell-section="boards"]',
  '@media (max-width:900px) and (min-width:621px)',
  '@media (max-width:620px)',
  '@media (pointer:coarse)',
  '@media (prefers-reduced-motion:reduce)',
  '@media (forced-colors:active)',
]) assert.ok(css.includes(marker), `Shell M3 CSS contract missing: ${marker}`);

assert.doesNotMatch(css, /transition\s*:\s*all\b/i, 'Shell M3 must not introduce transition-all');
assert.doesNotMatch(css, /https?:\/\//, 'Shell M3 must not introduce remote visual dependencies');
assert.doesNotMatch(css, /(?:monday|vibe)[-_]/i, 'Shell M3 must not import vendor-specific CSS class contracts');

for (const marker of [
  'Shell M3 resource search uses the semantic compact search height',
  'Shell M3 application resources use the semantic 40px desktop row',
  'Shell M3 section headers use the semantic section header height',
  'Shell M3 resource navigation exposes current application semantics',
  'Shell M3 compact rail hides resource search instead of crushing it',
  'Shell M3 compact rail removes duplicate Favorites and Board resource sections',
  'Shell M3 compact rail retains direct application resources',
  'Shell M3 mobile drawer restores searchable resource navigation with a touch-safe field',
  'Shell M3 mobile drawer restores Favorites and Board resource sections',
  'Shell M3 mobile resource rows remain touch-safe',
]) assert.ok(browser.includes(marker), `Browser integration missing Shell M3 assertion: ${marker}`);

assert.match(pkg.scripts['verify:ui'], /verify-v1432-shell-sections-resources-sm3\.mjs/, 'Shell M3 verifier must participate in verify:ui');

console.log('v1.43.2 Shell Milestone 3 sections, applications and resource navigation verification: PASS');
