import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('assets/js/app.ts');
const reactShell = read('src/app/shell/WorkManagementShell.tsx');
const manifest = read('config/application-manifest.ts');
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const css = read('assets/css/shell-navigation.css');
const tokens = read('assets/css/foundation/tokens.css');
const browser = read('tests/browser/run-cdp.mjs');
const pkg = JSON.parse(read('package.json'));

for (const marker of [
  '--wm-shell-sidebar-width-min: 224px;',
  '--wm-shell-sidebar-width-default: 256px;',
  '--wm-shell-sidebar-width-max: 360px;',
  '--wm-shell-sidebar-width-compact: 60px;',
  '--wm-shell-sidebar-pin-size: 28px;',
  '--wm-shell-sidebar-resizer-hit-width: 10px;',
  '--wm-shell-sidebar-resizer-active-width: 3px;',
  '--wm-shell-sidebar-resize-step: 8px;',
  '--wm-shell-sidebar-resize-step-large: 24px;',
  '--wm-shell-navigation-preview-shadow:',
]) assert.ok(tokens.includes(marker), `Shell M4 semantic token missing: ${marker}`);

for (const marker of [
  "type ShellNavigationPreference = Readonly<{ state: ShellNavigationMode; width: number; pinned: boolean }>;",
  "const SHELL_NAVIGATION_STORAGE_KEY = 'wm.platform.shell-navigation.v1';",
  'const shellNavigationWidthBounds =',
  'const clampShellNavigationWidth =',
  'const readShellNavigationPreference =',
  "if (raw === 'compact' || raw === 'expanded')",
  'JSON.stringify(value)',
  'workManagementClientState.hydratePersistentShell({',
  'const shellNavigation = () => shellClientState().navigation;',
  'workManagementClientState.updateShellNavigation',
  'function setShellNavigationPinned(',
  'function setShellNavigationPeek(',
  'function setShellNavigationWidth(',
  'function resetShellNavigationWidth()',
  'function startShellNavigationResize(',
  'setPointerCapture(pointerId)',
  'releasePointerCapture(pointerId)',
  "event.key === 'ArrowLeft'",
  "event.key === 'ArrowRight'",
  "event.key === 'Home'",
  "event.key === 'End'",
  "--wm-shell-sidebar-resize-step-large",
  "reactShellRoot.addEventListener('dblclick'",
  "reactShellRoot.addEventListener('pointerover'",
  "reactShellRoot.addEventListener('pointerout'",
  "reactShellRoot.addEventListener('focusin'",
  "reactShellRoot.addEventListener('focusout'",
  "event.key === SHELL_NAVIGATION_STORAGE_KEY",
  'Navigation unpinned. It will preview when hovered or focused.',
]) assert.ok(app.includes(marker), `Shell M4 runtime contract missing: ${marker}`);

if (architectureVersion >= 43) {
  for (const marker of [
    'data-shell-navigation-pinned={shellActive ? String(shell.navigation.pinned) : undefined}',
    'data-shell-navigation-peek={shellActive ? String(shell.navigation.peek && !shell.navigation.pinned) : undefined}',
    "'--wm-shell-navigation-user-width': `${shell.navigation.width}px`",
    'data-shell-navigation-pin',
    'aria-pressed={shell.navigation.pinned}',
    'data-shell-resizer',
    'role="separator"',
    'aria-orientation="vertical"',
    'aria-valuemin={224}',
    'aria-valuemax={360}',
    'aria-valuenow={shell.navigation.width}',
  ]) assert.ok(reactShell.includes(marker), `Shell M4 React runtime contract missing after M35: ${marker}`);
  assert.ok(!app.includes('function shellNavigationPinMarkup()') && !app.includes('function shellNavigationResizerMarkup()'), 'M35 must keep obsolete Shell M4 markup helpers deleted.');
} else {
  for (const marker of [
    'data-shell-navigation-pinned="${shellNavigation().pinned}"',
    'data-shell-navigation-peek="false"',
    '--wm-shell-navigation-user-width:${shellNavigation().width}px',
    'function shellNavigationPinMarkup()',
    'data-shell-navigation-pin',
    'aria-pressed="${shellNavigation().pinned}"',
    'function shellNavigationResizerMarkup()',
    'data-shell-resizer',
    'role="separator"',
    'aria-orientation="vertical"',
    'aria-valuemin=',
    'aria-valuemax=',
    'aria-valuenow=',
  ]) assert.ok(app.includes(marker), `Historical Shell M4 runtime contract missing: ${marker}`);
}


assert.doesNotMatch(app, /data-vibe|leftpaneMF|_leftpane_/i, 'Shell M4 must not import Monday/Vibe runtime DOM contracts');
assert.doesNotMatch(app, /my[_ -]?work/i, 'Shell M4 must not fabricate unsupported navigation destinations');

for (const marker of [
  '--wm-shell-navigation-user-width:',
  '--wm-shell-navigation-layout-width:',
  '--wm-shell-navigation-panel-width:',
  '[data-shell-navigation-pinned="false"][data-shell-navigation-peek="true"]',
  'margin-left: var(--wm-shell-navigation-layout-width);',
  'width: calc(100% - var(--wm-shell-navigation-layout-width));',
  'width: var(--wm-shell-navigation-panel-width);',
  '.shell-sidebar-header-actions',
  '.shell-sidebar-pin',
  '.shell-sidebar-resizer',
  '[data-shell-navigation-resizing]',
  'width: var(--wm-shell-sidebar-resizer-active-width);',
  'cursor: col-resize!important;',
  '@media (max-width:900px)',
  '@media (max-width:620px)',
  '@media (pointer:coarse)',
  '@media (prefers-reduced-motion:reduce)',
  '@media (forced-colors:active)',
]) assert.ok(css.includes(marker), `Shell M4 CSS contract missing: ${marker}`);

assert.doesNotMatch(css, /transition\s*:\s*all\b/i, 'Shell M4 must not introduce transition-all');
assert.doesNotMatch(css, /https?:\/\//, 'Shell M4 must not introduce remote visual dependencies');
assert.doesNotMatch(css, /(?:monday|vibe)[-_]/i, 'Shell M4 must not import vendor-specific CSS class contracts');

for (const marker of [
  'Shell M4 exposes a dedicated desktop pin control',
  'Shell M4 exposes the semantic desktop resize hit area',
  'Shell M4 custom width updates the expanded sidebar',
  'Shell M4 pinned custom width keeps workspace offset synchronized',
  'Shell M4 unpinned preview restores the saved expanded width',
  'Shell M4 unpinned preview overlays content without shifting the compact workspace footprint',
  'Shell M4 unpinned preview restores expanded navigation content',
  'Shell M4 unpinned navigation collapses back to the compact rail',
]) assert.ok(browser.includes(marker), `Browser integration missing Shell M4 assertion: ${marker}`);

assert.match(pkg.scripts['verify:ui'], /verify-v1432-shell-resizing-pinning-sm4\.mjs/, 'Shell M4 verifier must participate in verify:ui');

console.log('v1.43.2 Shell Milestone 4 resizing, pinning and navigation microinteractions verification: PASS');
