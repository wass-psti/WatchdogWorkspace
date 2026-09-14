import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const tokens = read('assets/css/foundation/tokens.css');
const themes = read('assets/css/foundation/themes.css');
const css = read('assets/css/shell-overlays.css');
const accountCss = read('assets/css/shell-account-menu.css');
const app = read('assets/js/app.ts');
const overlay = read('assets/js/platform/ui/overlay-manager.ts');
const globalOverlay = read('assets/js/platform/ui/global-overlay-runtime.ts');
const floating = read('assets/js/platform/ui/floating-surface.ts');
const tooltip = read('assets/js/platform/ui/tooltip-controller.ts');
const profile = read('assets/js/features/account/profile-menu.ts');
const main = read('src/main.ts');
const browser = read('tests/browser/run-cdp.mjs');
const runtimeAssets = read('config/runtime-assets.js');
const runtime = read('assets/js/runtime/index.ts');
const pkg = JSON.parse(read('package.json'));

for (const marker of [
  '--wm-shell-overlay-gutter: 12px;',
  '--wm-shell-overlay-gap: 8px;',
  '--wm-shell-overlay-padding:',
  '--wm-shell-overlay-radius:',
  '--wm-shell-overlay-z: 1080;',
  '--wm-shell-overlay-motion-fast:',
  '--wm-shell-overlay-motion-standard:',
  '--wm-shell-tooltip-gap: 8px;',
  '--wm-shell-tooltip-max-width: 240px;',
  '--wm-shell-tooltip-radius:',
]) assert.ok(tokens.includes(marker), `Shell M6 semantic token missing: ${marker}`);

for (const marker of [
  '--wm-shell-overlay-surface:',
  '--wm-shell-overlay-text:',
  '--wm-shell-overlay-border:',
  '--wm-shell-overlay-shadow:',
  '--wm-shell-tooltip-surface:',
  '--wm-shell-tooltip-text:',
  '--wm-shell-tooltip-shadow:',
]) assert.ok((themes.match(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length >= 3, `Shell M6 theme role must exist in light, dark and system-dark scopes: ${marker}`);

assert.ok(main.indexOf('shell-navigation.css') < main.indexOf('shell-overlays.css'), 'Shell M6 shared overlay layer must load after navigation');
assert.ok(main.indexOf('shell-overlays.css') < main.indexOf('shell-account-menu.css'), 'Shell M6 shared overlay layer must load before account-specific rules');
assert.ok(main.indexOf('shell-account-menu.css') < main.indexOf('boards-monday.css'), 'Shell account layer must remain before Board-specific presentation');

for (const marker of [
  '.wm-shell-floating-surface',
  '.wm-shell-menu-surface',
  '.wm-shell-tooltip',
  '@media (prefers-reduced-motion: reduce)',
  '@media (forced-colors: active)',
]) assert.ok(css.includes(marker), `Shell M6 CSS contract missing: ${marker}`);
assert.doesNotMatch(css, /transition\s*:\s*all\b/i, 'Shell M6 must not introduce transition-all');
assert.doesNotMatch(css, /https?:\/\//, 'Shell M6 must not introduce remote visual dependencies');
assert.doesNotMatch(css, /(?:monday|vibe)[-_]/i, 'Shell M6 must not import vendor-specific CSS contracts');

for (const marker of [
  "export type FloatingSurfacePlacement = 'bottom-end'",
  'positionAnchoredSurface',
  "placement = 'bottom-end'",
  "resolvedPlacement = 'left-start'",
  "surface.dataset.placement = resolvedPlacement",
  'surface.style.maxHeight',
  'menuItemElements',
  'focusMenuItemByTypeahead',
]) assert.ok(floating.includes(marker), `Shell M6 floating-surface contract missing: ${marker}`);

// Shell M6's cross-scope exclusivity contract is preserved by the Stage C M11
// page-lifetime global overlay runtime. The feature-scoped manager remains the
// branch/focus adapter and delegates root ownership to that runtime.
for (const marker of [
  "export const GLOBAL_OVERLAY_OPEN_EVENT = 'wm:overlay-open';",
  'claim(claim: GlobalOverlayClaim): void',
  'previous.closeAll();',
  'announceOpen(normalized);',
  'update(instanceId: string, topId: string): void',
  'release(instanceId: string): void',
  'documentRef.dispatchEvent(new CustomEventConstructor(GLOBAL_OVERLAY_OPEN_EVENT',
]) assert.ok(globalOverlay.includes(marker), `Shell M6 global overlay authority missing after M11 migration: ${marker}`);

for (const marker of [
  "import { globalOverlayRuntime } from './global-overlay-runtime.ts';",
  'instanceId',
  'globalOverlayRuntime.claim({',
  'globalOverlayRuntime.update(instanceId',
  'globalOverlayRuntime.release(instanceId)',
  'closeAll: () => closeAll({ restoreFocus: false })',
]) assert.ok(overlay.includes(marker), `Shell M6 scoped overlay-manager adapter missing after M11 migration: ${marker}`);

for (const marker of [
  "import { cssPixelValue, positionAnchoredSurface } from './floating-surface.ts';",
  "selector = '[data-shell-tooltip]'",
  "tooltip.setAttribute('role', 'tooltip')",
  "candidate.setAttribute('aria-describedby'",
  "candidate.dataset.shellTooltipMode !== 'compact'",
  "documentRef.addEventListener('wm:overlay-open'",
  "documentRef.addEventListener('focusin'",
  "documentRef.addEventListener('pointerover'",
  "window.addEventListener('resize', reposition",
]) assert.ok(tooltip.includes(marker), `Shell M6 tooltip lifecycle missing: ${marker}`);

for (const marker of [
  "from '../../platform/ui/floating-surface.ts'",
  "className = 'wm-shell-floating-surface wm-shell-menu-surface shell-account-menu shell-account-submenu'",
  "root.className = 'wm-shell-floating-surface wm-shell-menu-surface shell-account-menu shell-account-profile-menu'", 
  'positionAnchoredSurface({',
  'focusMenuItemByTypeahead(',
]) assert.ok(profile.includes(marker), `Shell M6 account-menu harmonization missing: ${marker}`);

for (const marker of [
  "import { createShellTooltipController } from './platform/ui/tooltip-controller.ts';",
  'const shellTooltipController = createShellTooltipController();',
  'data-shell-tooltip=',
  'data-shell-tooltip-mode="compact"',
  'shellTooltipController.close();',
]) assert.ok(app.includes(marker), `Shell M6 app integration missing: ${marker}`);

for (const marker of [
  './assets/css/shell-overlays.css',
  './assets/js/platform/ui/floating-surface.ts',
  './assets/js/platform/ui/global-overlay-runtime.ts',
  './assets/js/platform/ui/tooltip-controller.ts',
  './assets/js/features/account/profile-menu.ts',
]) assert.ok(runtimeAssets.includes(marker), `Shell M6 runtime cache manifest missing: ${marker}`);
assert.ok(runtime.includes('positionAnchoredSurface') && runtime.includes('focusMenuItemByTypeahead'), 'Shell M6 floating utilities must be exposed through the runtime gateway');
assert.ok(runtime.includes('globalOverlayRuntime') && runtime.includes('resolveGlobalOverlayRoot') && runtime.includes('resolveGlobalToastRoot'), 'Shell M6 overlay compatibility behavior must remain reachable through the M11 runtime gateway');

assert.ok(accountCss.includes('.shell-account-menu'), 'Shell M5 account rules remain present above the shared Shell M6 foundation');
assert.doesNotMatch(accountCss, /@keyframes\s+wm-shell-account-menu-in/, 'Shell M6 shared overlay layer must own host menu entrance motion');

for (const marker of [
  'Shell M6 account menu consumes the shared host floating-surface contract',
  'Shell M6 compact navigation exposes a shared accessible tooltip',
  'Shell M6 tooltip links its trigger through aria-describedby',
  'Shell M6 opening a menu dismisses transient shell tooltips',
  'Shell M6 root overlays are exclusive across independent platform scopes',
  'Shell M6 preserves explicit parent-child overlay branches within one scope',
  'Shell M6 account menu uses the shared host overlay surface',
]) assert.ok(browser.includes(marker), `Browser integration missing Shell M6 assertion: ${marker}`);

assert.match(pkg.scripts['verify:ui'], /verify-v1432-shell-overlay-harmonization-sm6\.mjs/, 'Shell M6 verifier must participate in verify:ui');

console.log('v1.43.2 Shell Milestone 6 global overlay and menu harmonization verification: PASS');
