import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('assets/js/app.ts');
const reactShell = read('src/app/shell/WorkManagementShell.tsx');
const manifest = read('config/application-manifest.ts');
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const shellMarkupSource = architectureVersion >= 43 ? reactShell : app;
const tokens = read('assets/css/foundation/tokens.css');
const navCss = read('assets/css/shell-navigation.css');
const overlayCss = read('assets/css/shell-overlays.css');
const tooltip = read('assets/js/platform/ui/tooltip-controller.ts');
const browser = read('tests/browser/run-cdp.mjs');
const pkg = JSON.parse(read('package.json'));

assert.ok(tokens.includes('--wm-shell-tooltip-action-max-width: 180px;'), 'Collapse hotfix must define a compact action-tooltip width');
assert.ok(overlayCss.includes('.wm-shell-tooltip--action'), 'Collapse hotfix must provide a dedicated compact action-tooltip treatment');
for (const contract of ['white-space: nowrap;', 'text-overflow: ellipsis;', 'min-height: 26px;']) {
  assert.ok(overlayCss.includes(contract), `Compact action tooltip missing ${contract}`);
}
assert.ok(shellMarkupSource.includes('data-shell-tooltip-variant="action" aria-controls="primarySidebar"'), 'Collapse navigation must opt into the compact action tooltip');
assert.ok(architectureVersion >= 43 ? shellMarkupSource.includes('data-shell-tooltip-variant="action" aria-pressed={shell.navigation.pinned}') : shellMarkupSource.includes('data-shell-tooltip-variant="action" aria-pressed="${shellNavigation().pinned}"'), 'Pin navigation should share the compact action tooltip treatment through the M9 client-state authority');
assert.ok(architectureVersion >= 43 ? shellMarkupSource.includes('className="wm-visually-hidden shell-navigation-status"') : shellMarkupSource.includes('class="wm-visually-hidden shell-navigation-status"'), 'Navigation status must remain assistive-only instead of visible persistent sidebar copy');
assert.ok(!shellMarkupSource.includes('class="sr-only shell-navigation-status"') && !shellMarkupSource.includes('className="sr-only shell-navigation-status"'), 'Undefined legacy sr-only class must not be used for navigation status');
assert.ok(tooltip.includes("shellTooltipVariant?: string"), 'Tooltip controller must understand semantic tooltip variants');
assert.ok(tooltip.includes("candidate.dataset.shellTooltipVariant === 'action'"), 'Tooltip controller must apply the action variant');
assert.ok(tooltip.includes("if (target && targetFrom(event.target) === target) close();"), 'Tooltips must dismiss when their trigger is activated');
assert.ok(navCss.includes('box-shadow: 0 2px 8px rgba(2,6,23,.16);'), 'Collapse control must use the restrained hotfix elevation');
for (const phrase of [
  'Shell collapse control uses the compact action-tooltip treatment',
  'Shell collapse action tooltip remains compact and single-line',
  'Shell action tooltip dismisses immediately when its trigger is activated',
  'Shell navigation status remains assistive-only and does not become persistent visible sidebar copy',
]) assert.ok(browser.includes(phrase), `Collapse-control browser contract missing: ${phrase}`);

const shellCss = [navCss, overlayCss].join('\n');
assert.ok(!/transition\s*:\s*all\b/i.test(shellCss), 'Collapse hotfix must not introduce transition: all');
const deps = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) });
assert.ok(!deps.some((name) => /(?:monday|vibe)/i.test(name)), 'Collapse hotfix must remain independent of Monday/Vibe runtime packages');

console.log('PASS Shell collapse navigation control hotfix verifier');
