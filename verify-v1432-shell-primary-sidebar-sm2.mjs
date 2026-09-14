import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('assets/js/app.ts');
const reactShell = read('src/app/shell/WorkManagementShell.tsx');
const manifest = read('config/application-manifest.ts');
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const css = read('assets/css/shell-navigation.css');
const tokens = read('assets/css/foundation/tokens.css');
const themes = read('assets/css/foundation/themes.css');
const browser = read('tests/browser/run-cdp.mjs');
const pkg = JSON.parse(read('package.json'));

for (const marker of [
  '--wm-shell-sidebar-mobile-width: 304px;',
  '--wm-shell-sidebar-collapse-size: 28px;',
  '--wm-shell-sidebar-width-default: 256px;',
  '--wm-shell-sidebar-width-compact: 60px;',
  '--wm-shell-navigation-row-height: 36px;',
  '--wm-shell-navigation-row-touch-height: 44px;',
]) assert.ok(tokens.includes(marker), `Shell M2 token missing: ${marker}`);

const backdropMatches = themes.match(/--wm-shell-navigation-backdrop:/g) ?? [];
assert.equal(backdropMatches.length, 3, 'Shell navigation backdrop role must exist in light, dark and system-dark themes');

for (const marker of [
  "import type { ShellNavigationMode, ShellSectionClientState, ShellSectionId } from '../../src/platform/contracts/client-state.ts';",
  "wm.platform.shell-navigation.v1",
  'function sidebarNavMarkup(',
  'function syncShellNavigationPresentation()',
  'function setShellNavigationState(',
  'function setShellMobileOpen(',
  'function handleShellNavigationKeydown(',
  'workspace.inert = mobile && shellNavigation().mobileOpen;',
  "shellMobileQuery?.addEventListener('change'",
  "renderWorkspace(content, `app/${mod.id}`, 'module');",
]) assert.ok(app.includes(marker), `Shell M2 runtime contract missing: ${marker}`);

if (architectureVersion >= 43) {
  for (const marker of [
    'data-shell-navigation-state={shellActive ? shell.navigation.mode : undefined}',
    'data-shell-navigation-toggle',
    'data-shell-navigation-mobile-toggle',
    'data-shell-navigation-dismiss',
    'id="primarySidebar"',
    'className="shell-navigation-scroll"',
    '<nav data-shell-nav aria-label="Main"',
  ]) assert.ok(reactShell.includes(marker), `Shell M2 React runtime contract missing after M35: ${marker}`);
  assert.ok(!app.includes('function shellNavigationToggleMarkup()'), 'M35 must keep the obsolete Shell M2 toggle markup helper deleted.');
} else {
  for (const marker of [
    'function shellNavigationToggleMarkup()',
    'data-shell-navigation-state="${shellNavigation().mode}"',
    'data-shell-navigation-toggle',
    'data-shell-navigation-mobile-toggle',
    'data-shell-navigation-dismiss',
    'id="primarySidebar"',
    'class="shell-navigation-scroll"',
    'aria-label="Main"',
  ]) assert.ok(app.includes(marker), `Historical Shell M2 runtime contract missing: ${marker}`);
}


assert.doesNotMatch(app, /app\.innerHTML\s*=\s*`<div class="module-shell">\$\{content\}/, 'Embedded applications must no longer replace the persistent host sidebar shell');
assert.doesNotMatch(app, /my[_ -]?work/i, 'Shell M2 must not fabricate an unsupported My Work route');

for (const marker of [
  '.shell[data-shell-navigation-state="expanded"]',
  '.shell[data-shell-navigation-state="compact"]',
  'width: var(--wm-shell-navigation-panel-width);',
  'margin-left: var(--wm-shell-navigation-layout-width);',
  'width: calc(100% - var(--wm-shell-navigation-layout-width));',
  '.workspace.module-workspace',
  '.shell-sidebar-header',
  '.shell-sidebar-collapse',
  '.shell-navigation-scroll',
  '.shell-mobile-navigation-trigger',
  '.shell-sidebar-backdrop',
  '.shell[data-shell-mobile-open="true"] .sidebar',
  'left: calc(0px - var(--wm-shell-sidebar-mobile-width));',
  'visibility: hidden;',
  'width: min(var(--wm-shell-sidebar-mobile-width)',
  'height: 100dvh!important;',
  'body.shell-navigation-open',
  '@media (max-width:620px)',
  '@media (pointer:coarse)',
  '@media (prefers-reduced-motion:reduce)',
  '@media (forced-colors:active)',
]) assert.ok(css.includes(marker), `Shell M2 CSS contract missing: ${marker}`);

assert.doesNotMatch(css, /mobile shell navigation uses a single horizontal rail/i, 'Legacy bottom-rail architecture must not remain authoritative in Shell M2');
assert.doesNotMatch(css, /transition\s*:\s*all\b/i, 'Shell M2 must not introduce transition-all');
assert.doesNotMatch(css, /https?:\/\//, 'Shell M2 must not introduce remote visual dependencies');
assert.doesNotMatch(css, /(?:monday|vibe)[-_]/i, 'Shell M2 must not import vendor-specific class contracts');

for (const marker of [
  'Shell M2 explicit compact state uses the semantic 60px width',
  'Shell M2 compact state keeps workspace offset synchronized',
  'Shell M2 mobile navigation uses a vertical drawer',
  'Shell M2 mobile drawer stays within the viewport',
  'Shell M2 host workspace stays full width on mobile',
  'Shell M2 mobile trigger is at least 44px',
  'Shell M2 mobile drawer exposes a dismissible backdrop while open',
  'Shell M2 mobile drawer is fully off-canvas and hidden when closed',
]) assert.ok(browser.includes(marker), `Browser integration missing Shell M2 assertion: ${marker}`);

assert.match(pkg.scripts['verify:ui'], /verify-v1432-shell-primary-sidebar-sm2\.mjs/, 'Shell M2 verifier must participate in verify:ui');

console.log('v1.43.2 Shell Milestone 2 primary sidebar verification: PASS');
