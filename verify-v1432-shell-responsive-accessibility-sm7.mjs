import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('assets/js/app.ts');
const reactShell = read('src/app/shell/WorkManagementShell.tsx');
const manifest = read('config/application-manifest.ts');
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const presentation = architectureVersion >= 43 ? reactShell : app;
const css = read('assets/css/shell-accessibility.css');
const navCss = read('assets/css/shell-navigation.css');
const accountCss = read('assets/css/shell-account-menu.css');
const tokens = read('assets/css/foundation/tokens.css');
const main = read('src/main.ts');
const assets = read('config/runtime-assets.js');
const browser = read('tests/browser/run-cdp.mjs');

for (const token of [
  '--wm-shell-skip-link-min-height',
  '--wm-shell-skip-link-offset',
  '--wm-shell-route-focus-scroll-margin',
  '--wm-shell-a11y-outline-width',
  '--wm-shell-min-supported-viewport',
]) assert.ok(tokens.includes(token), `Shell M7 token missing: ${token}`);

assert.ok(main.includes("shell-accessibility.css"), 'Shell M7 accessibility layer must be loaded by Vite entry');
assert.ok(assets.includes("./assets/css/shell-accessibility.css"), 'Shell M7 accessibility layer must be cache-manifested');
assert.ok(main.indexOf('shell-account-menu.css') < main.indexOf('shell-accessibility.css'), 'Shell M7 must load after account-specific shell presentation');
assert.ok(main.indexOf('shell-accessibility.css') < main.indexOf('boards-monday.css'), 'Shell M7 must remain before Board-specific presentation');

assert.match(presentation, architectureVersion >= 43 ? /className="shell-skip-link"[^>]+data-shell-skip[^>]+href="#main"/i : /class="shell-skip-link"[^>]+data-shell-skip[^>]+href="#main"/i, 'Shell M7 must expose a skip-to-main control');
assert.ok(app.includes("if (action.matches('a[data-shell-skip]'))"), 'Shell M7 skip control must prevent hash-router takeover and focus main content');
assert.ok(app.includes("main.tabIndex = -1"), 'Shell M7 route targets must be programmatically focusable');
assert.ok(app.includes("focusShellMainContent"), 'Shell M7 must own SPA route-focus management');
if (architectureVersion >= 48) {
  assert.ok(app.includes("hashchange: () => { transitionUpdate(() => { render(); }, 'route'); },"), 'Shell M7 Architecture 48 hash routes must still rerender through the route transition boundary');
  assert.ok(app.includes('function commitRoutePresentationTransition('), 'Shell M7 Architecture 48 must transfer route focus from the lifecycle commit boundary');
  assert.ok(app.includes('isCurrent: (revision) => routeLifecycle.isCurrent(revision)'), 'Shell M7 Architecture 48 route focus must reject stale route generations');
  assert.ok(app.includes('presentationReadinessRuntime.requestFocus({'), 'Shell M7 Architecture 48 committed route changes must wait for owner presentation readiness before moving focus');
} else {
  assert.match(app, /hashchange:[^\n]+focusShellMainContent/, 'Shell M7 route changes must move focus into new route content');
}
assert.ok(architectureVersion >= 43 ? presentation.includes("role={mobile ? 'dialog' : undefined}") : app.includes("sidebar.setAttribute('role', 'dialog')"), 'Shell M7 mobile navigation must expose dialog semantics');
assert.ok(architectureVersion >= 43 ? presentation.includes('aria-modal={mobile && mobileOpen ? true : undefined}') : app.includes("sidebar.setAttribute('aria-modal', 'true')"), 'Shell M7 open mobile navigation must expose aria-modal');
assert.ok(app.includes("workspace.inert = mobile && shellNavigation().mobileOpen"), 'Shell M7 modal navigation must inert the workspace through the M9 client-state authority');
assert.ok(presentation.includes('aria-haspopup="dialog"'), 'Shell M7 mobile launcher must declare the dialog relationship');
assert.ok(presentation.includes('aria-keyshortcuts="ArrowLeft ArrowRight Home End"'), 'Shell M7 resizer must disclose keyboard resizing commands');
assert.ok(app.includes('aria-label="Search applications and boards"'), 'Shell M7 sidebar search input must have an explicit accessible name');

assert.ok(css.includes('.shell-skip-link:focus-visible'), 'Shell M7 skip link must become visible on focus');
assert.ok(css.includes('@media (max-width: 360px)'), 'Shell M7 must protect 320–360px layouts');
assert.ok(css.includes('@media (pointer: coarse)'), 'Shell M7 must protect touch/coarse-pointer targets');
assert.ok(css.includes('@media (prefers-contrast: more)'), 'Shell M7 must support increased contrast');
assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'Shell M7 must preserve reduced-motion behavior');
assert.ok(css.includes('@media (forced-colors: active)'), 'Shell M7 must support forced colors');
assert.ok(css.includes('.module-topbar'), 'Shell M7 must normalize embedded-app host chrome');
assert.ok(css.includes('.account-pill[data-account-menu-trigger]'), 'Shell M7 must finalize account-launcher touch ergonomics');
assert.ok(!/transition\s*:\s*all\b/i.test(css + navCss + accountCss), 'Shell M7 must not introduce transition: all');
assert.ok(!/https?:\/\//i.test(css), 'Shell M7 must not add remote visual dependencies');

for (const phrase of [
  'Shell M7 responsive and accessibility finalization',
  'Shell M7 skip link remains keyboard visible',
  'Shell M7 minimum-width host chrome remains contained',
]) assert.ok(browser.includes(phrase), `Shell M7 Chromium contract missing: ${phrase}`);

console.log('PASS Shell M7 responsive/accessibility finalization verifier');
