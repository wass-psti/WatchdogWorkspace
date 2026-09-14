import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('assets/js/app.ts');
const reactShell = read('src/app/shell/WorkManagementShell.tsx');
const manifest = read('config/application-manifest.ts');
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const css = read('assets/css/shell-navigation.css');
const browser = read('tests/browser/run-cdp.mjs');
const pkg = JSON.parse(read('package.json'));

if (architectureVersion >= 43) {
  const rail = reactShell.indexOf('<div className="shell-sidebar-header-actions">');
  const pin = reactShell.indexOf('data-shell-navigation-pin', rail);
  const collapse = reactShell.indexOf('data-shell-navigation-toggle', rail);
  const railEnd = reactShell.indexOf('</div>', rail);
  assert.ok(rail >= 0 && pin > rail && collapse > pin && railEnd > collapse, 'Pin and collapse controls must share one React header action rail');
  assert.ok(!app.includes('shellNavigationToggleMarkup()') && !app.includes('shellNavigationPinMarkup()'), 'M35 must keep obsolete structural markup helpers deleted.');
} else {
  assert.ok(app.includes('${shellNavigationPinMarkup()}${shellNavigationToggleMarkup()}'), 'Pin and collapse controls must share one header action rail');
  assert.ok(!app.includes('</div>\n        ${shellNavigationToggleMarkup()}'), 'Collapse control must not be rendered as a free-standing sibling below/outside the header action rail');
}
assert.ok(css.includes('position: relative;\n  z-index: 1;\n  flex: 0 0 auto;\n  width: var(--wm-shell-sidebar-collapse-size);'), 'Collapse control must use structural flow inside the action rail');
assert.ok(css.includes('inset-inline-end: calc(0px - var(--wm-shell-sidebar-effective-padding-inline) - var(--wm-shell-header-collapse-size) / 2 - var(--wm-shell-sidebar-divider-width));'), 'Header rail must attach the toggle to the actual visible sidebar boundary');
assert.ok(css.includes('.shell-sidebar-pin:disabled {\n  display: none;'), 'Disabled pin control must not reserve layout space that can displace the expand control');
assert.ok(css.includes('@media (max-width:900px) and (min-width:621px)'), 'Tablet rail behavior must remain explicit');
assert.ok(css.includes('.shell-sidebar-header-actions {\n    display: flex;\n    inset-inline-end: 0;'), 'Mobile drawer must keep the close control structurally in its header');
for (const phrase of [
  'Shell collapse control stays in the header and never drops into primary navigation',
  'Shell collapse control follows the visible preview sidebar edge instead of a stale saved-width viewport anchor',
  'Shell collapse control remains at the same vertical header coordinate in compact mode',
]) assert.ok(browser.includes(phrase), `Missing browser assertion: ${phrase}`);
assert.ok(!/transition\s*:\s*all\b/i.test(css), 'Structural collapse hotfix must not introduce transition: all');
const deps = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) });
assert.ok(!deps.some((name) => /(?:monday|vibe)/i.test(name)), 'Structural collapse hotfix must not add Monday/Vibe runtime packages');
console.log('PASS Shell collapse control structural hotfix verifier');
