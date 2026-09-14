import fs from 'node:fs';

const app = fs.readFileSync('assets/js/app.ts', 'utf8');
const home = fs.readFileSync('assets/js/features/home/index.ts', 'utf8');
const css = fs.readFileSync('assets/css/app.css', 'utf8');
const shellCss = fs.readFileSync('assets/css/shell-navigation.css', 'utf8');

const checks = [
  ['explicit shell action selector', app.includes('SHELL_ACTION_SELECTOR') && app.includes("'button[data-nav]'"), true],
  ['pointer/click pairing', app.includes('pointerActivationTarget') && app.includes('isValidActivation(event, action)'), true],
  ['module nested-control guard', app.includes('isNestedControlInsideModuleCard'), true],
  ['strict app action resolution', app.includes('resolveAppAction(event.target)'), true],
  ['no broad ripple target selector', !app.includes("closest?.('button, .module-card, .recent-list button, .module-action, .back-btn')"), true],
  ['decorative card arrow is not a button', home.includes('class="card-arrow"') && !home.includes('aria-hidden="true">${icons.arrow}</button>'), true],
  ['view transition snapshots inert', css.includes('::view-transition{pointer-events:none}'), true],
  ['workspace/sidebar isolated', /\.workspace\s*\{[\s\S]*position:\s*relative;[\s\S]*z-index:\s*0;[\s\S]*isolation:\s*isolate;/.test(shellCss) && /\.sidebar\s*\{[\s\S]*z-index:\s*20;/.test(shellCss), true],
  ['explicit pressed state', css.includes('.module-card.is-pressing'), true],
];

let failed = 0;
for (const [label, actual, expected] of checks) {
  const ok = actual === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log('Interaction-boundary verification passed.');
