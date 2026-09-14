import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const appCss = read('assets/css/app.css');
const migrationCss = read('assets/css/foundation/application-migration.css');
const motionCss = read('assets/css/motion-design.css');
const navCss = read('assets/css/shell-navigation.css');
const overlayCss = read('assets/css/shell-overlays.css');
const accountCss = read('assets/css/shell-account-menu.css');
const accessibilityCss = read('assets/css/shell-accessibility.css');
const tokens = read('assets/css/foundation/tokens.css');
const app = read('assets/js/app.ts');
const main = read('src/main.ts');
const browser = read('tests/browser/run-cdp.mjs');
const pkg = JSON.parse(read('package.json'));
const manifest = read('config/application-manifest.ts');
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);

// M8: one authoritative host-navigation geometry owner.
assert.ok(navCss.includes('Shell Milestones 1–8'), 'Shell M8 navigation layer must declare final ownership');
assert.match(navCss, /body\[data-wm-surface="shell"\] \.sidebar\s*\{[\s\S]*?position:\s*fixed;/, 'Shell M8 navigation must own fixed desktop sidebar positioning');
assert.match(navCss, /body\[data-wm-surface="shell"\] \.workspace\s*\{[\s\S]*?margin-left:\s*var\(--wm-shell-navigation-layout-width\)/, 'Shell M8 navigation must own semantic workspace offset');
assert.ok(navCss.includes('--wm-shell-navigation-panel-width'), 'Shell M8 must retain separate layout/panel width contracts');
assert.ok(navCss.includes('data-shell-mobile-open="true"'), 'Shell M8 must retain the off-canvas mobile drawer state');
assert.ok(navCss.includes('left: calc(0px - var(--wm-shell-sidebar-mobile-width))'), 'Shell M8 mobile drawer must remain off canvas without a legacy bottom rail');
assert.ok(navCss.includes('--wm-shell-brand-mark-size'), 'Shell M8 shell brand geometry must be semantic');
assert.ok(accountCss.includes('body[data-wm-surface="shell"] .account-pill'), 'Shell M8 account layer must own the generic host account launcher geometry');

// Historical shell geometry that has been superseded by M1–M7 must not return.
for (const [name, css] of [['app.css', appCss], ['application-migration.css', migrationCss], ['motion-design.css', motionCss]]) {
  assert.ok(!/--wm-sidebar-width\s*:\s*(?:250|278)px/i.test(css), `${name} must not restore the historical fixed host sidebar width`);
  assert.ok(!/--wm-mobile-nav-height\s*:\s*72px/i.test(css), `${name} must not restore the historical mobile bottom-rail height`);
  assert.ok(!/padding-bottom\s*:\s*72px/i.test(css), `${name} must not restore mobile bottom-rail workspace padding`);
}
assert.ok(!/body\[data-wm-surface="shell"\]\s+\.sidebar\s*\{[^}]*width\s*:\s*(?:250|278)px/is.test(motionCss), 'Motion CSS must not own fixed Work Management shell width');
assert.ok(!/body\[data-wm-surface="shell"\]\s+\.workspace\s*\{[^}]*margin-left\s*:\s*(?:250|278)px/is.test(motionCss), 'Motion CSS must not own fixed Work Management workspace offset');
assert.ok(!navCss.includes('--wm-sidebar-width:'), 'Final shell navigation must not publish the retired legacy sidebar-width alias');
assert.ok(!navCss.includes('--wm-mobile-nav-height:'), 'Final shell navigation must not publish the retired mobile-nav-height alias');

// Semantic foundation and stylesheet ordering remain explicit.
for (const token of ['--wm-shell-sidebar-width-min', '--wm-shell-sidebar-width-default', '--wm-shell-sidebar-width-max', '--wm-shell-sidebar-width-compact', '--wm-shell-brand-mark-size']) {
  assert.ok(tokens.includes(token), `Shell M8 semantic foundation token missing: ${token}`);
}
const order = ['shell-navigation.css', 'shell-overlays.css', 'shell-account-menu.css', 'shell-accessibility.css', 'boards-monday.css'];
for (let i = 1; i < order.length; i += 1) assert.ok(main.indexOf(order[i - 1]) < main.indexOf(order[i]), `Shell M8 stylesheet order must keep ${order[i - 1]} before ${order[i]}`);

// Direct routes, session restoration and persistent module-host integration.
assert.match(app, /async function bootstrap\(\)[\s\S]*?await auth\.init\(\);[\s\S]*?render\(\);/, 'Shell M8 bootstrap must restore auth/session state before rendering the requested route');
assert.ok(app.includes("wm.platform.auth.return-to.v1"), 'Shell M8 must preserve authentication return-to routing');
if (architectureVersion >= 48) {
  assert.ok(app.includes("hashchange: () => { transitionUpdate(() => { render(); }, 'route'); },"), 'Shell M8 Architecture 48 hash routes must rerender through the route transition boundary');
  assert.ok(app.includes('function commitRoutePresentationTransition('), 'Shell M8 Architecture 48 focus transfer must be lifecycle-owned');
  assert.ok(app.includes('isCurrent: (revision) => routeLifecycle.isCurrent(revision)'), 'Shell M8 Architecture 48 focus transfer must reject stale route generations');
  assert.ok(app.includes('presentationReadinessRuntime.requestFocus({'), 'Shell M8 Architecture 48 committed routes must transfer focus only after owner presentation readiness');
} else {
  assert.match(app, /hashchange:[^\n]+render\(\)[^\n]+focusShellMainContent/, 'Shell M8 hash routes must rerender and transfer focus to main content');
}
assert.ok(app.includes("renderWorkspace(content, `app/${mod.id}`, 'module')"), 'Shell M8 embedded applications must continue inside the persistent host workspace');

// Navigation preference migration must preserve M2/M4 installations.
assert.ok(app.includes("if (raw === 'compact' || raw === 'expanded')"), 'Shell M8 must migrate legacy string navigation preferences');
assert.ok(app.includes('JSON.parse(raw)'), 'Shell M8 must retain structured navigation preference restoration');
assert.ok(app.includes('wm.platform.shell-navigation.v1'), 'Shell M8 must retain the established navigation preference key');

// Final runtime browser coverage must exercise the cleaned integration rather than only static CSS.
for (const phrase of [
  'Shell M8 authoritative navigation owns fixed desktop sidebar positioning',
  'Shell M8 semantic brand mark retains the 40px foundation geometry',
  'Shell M8 mobile integration keeps the drawer off-canvas without legacy bottom-rail workspace offsets',
]) assert.ok(browser.includes(phrase), `Shell M8 Chromium contract missing: ${phrase}`);

const shellCss = [navCss, overlayCss, accountCss, accessibilityCss].join('\n');
assert.ok(!/transition\s*:\s*all\b/i.test(shellCss), 'Shell M8 must not regress to transition: all');
assert.ok(!/https?:\/\//i.test(shellCss), 'Shell M8 must not add remote shell visual dependencies');
const dependencyNames = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) });
assert.ok(!dependencyNames.some((name) => /(?:monday|vibe)/i.test(name)), 'Shell M8 must remain independent of Monday/Vibe runtime packages');

console.log('PASS Shell M8 production integration and legacy cleanup verifier');
