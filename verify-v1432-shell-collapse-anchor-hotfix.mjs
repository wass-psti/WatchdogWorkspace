import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const navCss = read('assets/css/shell-navigation.css');
const browser = read('tests/browser/run-cdp.mjs');
const app = read('assets/js/app.ts');
const reactShell = read('src/app/shell/WorkManagementShell.tsx');
const manifest = read('config/application-manifest.ts');
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const pkg = JSON.parse(read('package.json'));

if (architectureVersion >= 43) {
  const rail = reactShell.indexOf('<div className="shell-sidebar-header-actions">');
  const pin = reactShell.indexOf('data-shell-navigation-pin', rail);
  const collapse = reactShell.indexOf('data-shell-navigation-toggle', rail);
  const railEnd = reactShell.indexOf('</div>', rail);
  assert.ok(rail >= 0 && pin > rail && collapse > pin && railEnd > collapse, 'Collapse control must live with the pin control inside the React structural sidebar-header action rail');
  assert.ok(!app.includes('shellNavigationPinMarkup()') && !app.includes('shellNavigationToggleMarkup()'), 'M35 must keep obsolete header-control markup helpers deleted.');
} else {
  assert.ok(app.includes('<div class="shell-sidebar-header-actions">${shellNavigationPinMarkup()}${shellNavigationToggleMarkup()}</div>'), 'Collapse control must live inside the structural sidebar-header action rail');
}
assert.ok(navCss.includes('The header action rail is the single structural anchor for pin + collapse.'), 'Collapse hotfix must document the structural header-anchor contract');
assert.ok(navCss.includes('.shell-sidebar-header-actions {'), 'Sidebar header action rail must remain authoritative');
assert.ok(navCss.includes('top: 50%;'), 'Header action rail must use a stable vertical center');
assert.ok(navCss.includes('transform: translateY(-50%);'), 'Header action rail must remain vertically centered regardless of control state');
assert.ok(navCss.includes('.shell-sidebar-collapse {\n  position: relative;'), 'Collapse control must be positioned by the header action rail rather than the viewport');
assert.ok(!navCss.includes('position: fixed;\n    top: calc(var(--wm-shell-sidebar-padding-block)'), 'Legacy saved-width fixed collapse anchor must be removed');
assert.ok(!navCss.includes("inset-inline-start: calc(clamp(var(--wm-shell-sidebar-width-min), var(--wm-shell-navigation-user-width)"), 'Collapse control must not anchor to saved expanded width');
assert.ok(navCss.includes('.shell[data-shell-navigation-state="compact"]:not([data-shell-navigation-peek="true"]) .shell-sidebar-collapse svg'), 'Compact state must rotate only the collapse icon');
assert.ok(!navCss.includes('.shell[data-shell-navigation-state="compact"]:not([data-shell-navigation-peek="true"]) .shell-sidebar-collapse {\n  transform: rotate(180deg);'), 'Compact state must not transform the collapse button itself');
assert.ok(!navCss.includes('.shell-sidebar-collapse:active {\n  margin-top:'), 'Collapse pressed feedback must not alter the button coordinate');
for (const phrase of [
  'Shell collapse control is structurally attached to the visible expanded sidebar edge',
  'Shell collapse control keeps its vertical header coordinate when unpinned preview opens',
  'Shell expand control stays attached to the compact rail edge instead of floating over workspace content',
  'Shell expand control remains in the header after navigation collapses',
]) assert.ok(browser.includes(phrase), `Collapse structural browser contract missing: ${phrase}`);

assert.ok(!/transition\s*:\s*all\b/i.test(navCss), 'Collapse structural hotfix must not introduce transition: all');
const deps = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) });
assert.ok(!deps.some((name) => /(?:monday|vibe)/i.test(name)), 'Collapse structural hotfix must remain independent of Monday/Vibe runtime packages');

console.log('PASS Shell collapse navigation structural-anchor verifier');
