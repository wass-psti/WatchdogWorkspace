import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const tokens = read('assets/css/foundation/tokens.css');
const themes = read('assets/css/foundation/themes.css');
const shellCss = read('assets/css/shell-navigation.css');
const entry = read('src/main.ts');
const browser = read('tests/browser/run-cdp.mjs');
const app = read('assets/js/app.ts');
const manifest = read('config/application-manifest.ts');
const architectureVersion = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const pkg = JSON.parse(read('package.json'));

const shellTokens = [
  '--wm-shell-sidebar-width-min:',
  '--wm-shell-sidebar-width-default:',
  '--wm-shell-sidebar-width-max:',
  '--wm-shell-sidebar-width-compact:',
  '--wm-shell-sidebar-mobile-height:',
  '--wm-shell-sidebar-padding-inline:',
  '--wm-shell-sidebar-padding-block:',
  '--wm-shell-sidebar-brand-height:',
  '--wm-shell-sidebar-divider-width:',
  '--wm-shell-sidebar-resizer-visual-width:',
  '--wm-shell-sidebar-resizer-hit-width:',
  '--wm-shell-sidebar-resize-step:',
  '--wm-shell-sidebar-resize-step-large:',
  '--wm-shell-navigation-row-height:',
  '--wm-shell-navigation-row-touch-height:',
  '--wm-shell-navigation-control-size:',
  '--wm-shell-navigation-control-touch-size:',
  '--wm-shell-navigation-icon-size:',
  '--wm-shell-navigation-active-indicator-width:',
  '--wm-shell-navigation-item-gap:',
  '--wm-shell-navigation-label-gap:',
  '--wm-shell-navigation-section-gap:',
  '--wm-shell-navigation-inline-padding:',
  '--wm-shell-navigation-section-indent:',
  '--wm-shell-navigation-child-indent:',
  '--wm-shell-navigation-scrollbar-size:',
  '--wm-shell-navigation-font-size:',
  '--wm-shell-navigation-section-font-size:',
  '--wm-shell-navigation-meta-font-size:',
  '--wm-shell-navigation-radius:',
  '--wm-shell-navigation-focus-width:',
  '--wm-shell-navigation-focus-offset:',
  '--wm-shell-navigation-motion-fast:',
  '--wm-shell-navigation-motion-standard:',
  '--wm-shell-navigation-motion-ease:',
  '--wm-shell-navigation-motion-ease-out:',
];
for (const token of shellTokens) assert.ok(tokens.includes(token), `Shell navigation foundation token missing: ${token}`);

for (const [token, value] of [
  ['--wm-shell-sidebar-width-min:', '224px'],
  ['--wm-shell-sidebar-width-default:', '256px'],
  ['--wm-shell-sidebar-width-max:', '360px'],
  ['--wm-shell-sidebar-width-compact:', '60px'],
  ['--wm-shell-sidebar-mobile-height:', '72px'],
  ['--wm-shell-navigation-row-height:', '36px'],
  ['--wm-shell-navigation-row-touch-height:', '44px'],
  ['--wm-shell-sidebar-resizer-hit-width:', '10px'],
]) {
  assert.match(tokens, new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*${value.replace('.', '\\.')}`), `Unexpected Shell M1 geometry for ${token}`);
}

const themeRoles = [
  '--wm-shell-navigation-surface:',
  '--wm-shell-navigation-surface-raised:',
  '--wm-shell-navigation-surface-hover:',
  '--wm-shell-navigation-surface-active:',
  '--wm-shell-navigation-text:',
  '--wm-shell-navigation-text-muted:',
  '--wm-shell-navigation-text-subtle:',
  '--wm-shell-navigation-border:',
  '--wm-shell-navigation-active-border:',
  '--wm-shell-navigation-active-indicator:',
  '--wm-shell-navigation-focus:',
  '--wm-shell-navigation-resizer:',
  '--wm-shell-navigation-resizer-hover:',
  '--wm-shell-navigation-scrollbar:',
  '--wm-shell-navigation-shadow:',
];
for (const role of themeRoles) {
  const escaped = role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = themes.match(new RegExp(escaped, 'g')) ?? [];
  assert.equal(matches.length, 3, `Shell semantic theme role must exist exactly once in light, dark and system-dark modes: ${role}`);
}

for (const marker of [
  'width: var(--wm-shell-navigation-panel-width);',
  'position: fixed;',
  'margin-left: var(--wm-shell-navigation-layout-width);',
  'min-height: var(--wm-shell-navigation-row-height);',
  'grid-template-columns: var(--wm-shell-navigation-icon-size) minmax(0,1fr) auto;',
  'background: var(--wm-shell-navigation-surface-active);',
  'var(--wm-shell-navigation-active-indicator-width)',
  'outline: var(--wm-shell-navigation-focus-width) solid var(--wm-shell-navigation-focus);',
  'width: var(--wm-shell-sidebar-resizer-hit-width);',
  'cursor: col-resize;',
  'data-shell-navigation-state="expanded"',
  'data-shell-navigation-state="compact"',
  'margin-left: var(--wm-shell-navigation-current-width);',
  'width: calc(100% - var(--wm-shell-navigation-current-width));',
  '@media (pointer:coarse)',
  'min-height: var(--wm-shell-navigation-row-touch-height);',
  '@media (prefers-reduced-motion:reduce)',
  'transition-duration: .01ms!important;',
  '@media (forced-colors:active)',
]) assert.ok(shellCss.includes(marker), `Shell foundation CSS missing contract: ${marker}`);

assert.match(entry, /foundation\/application-migration\.css';\nimport '\.\.\/assets\/css\/motion-design\.css';\nimport '\.\.\/assets\/css\/shell-navigation\.css';\n(?:import '\.\.\/assets\/css\/shell-overlays\.css';\n)?(?:import '\.\.\/assets\/css\/shared-application-ui\.css';\n)?(?:import '\.\.\/assets\/css\/shell-account-menu\.css';\n)?(?:import '\.\.\/assets\/css\/shell-accessibility\.css';\n)?import '\.\.\/assets\/css\/boards-monday\.css';/, 'Shell foundation stylesheet must load after the legacy motion layer and before the Board layer, while permitting later shared application UI layers');
assert.ok(browser.includes("await fs.readFile('assets/css/shell-navigation.css', 'utf8')"), 'Browser integration must load the Shell M1 stylesheet in production CSS order');
for (const marker of [
  'Shell navigation foundation uses the semantic 256px desktop width',
  'Shell navigation foundation uses the semantic 60px compact width',
  'Shell navigation foundation keeps desktop navigation rows at least 36px',
  'Shell navigation coarse-pointer row target is at least 44px tall',
]) assert.ok(browser.includes(marker), `Browser integration missing Shell M1 assertion: ${marker}`);

// Milestone 1 is intentionally presentation-only. Preserve the live navigation
// renderer and route/authorization ownership. M35 (Architecture 43+) deletes only
// the inert historical shell(content, active) serializer; the other live shell
// navigation authorities remain required.
for (const marker of ['function sidebarNavMarkup(', 'function syncPersistentShell(', 'data-shell-nav']) {
  assert.ok(app.includes(marker), `Existing shell runtime boundary missing: ${marker}`);
}
assert.ok(
  architectureVersion >= 43 ? !app.includes('function shell(') : app.includes('function shell('),
  architectureVersion >= 43
    ? 'M35 must keep the dead imperative shell serializer deleted.'
    : 'Historical pre-M35 shell serializer must remain present for the earlier architecture contract.',
);

assert.doesNotMatch(shellCss, /transition\s*:\s*all\b/i, 'Shell navigation foundation must not introduce transition-all');
assert.doesNotMatch(shellCss, /https?:\/\//, 'Shell navigation foundation must not introduce remote visual dependencies');
assert.doesNotMatch(shellCss, /(?:monday|vibe)[-_]/i, 'Shell foundation must not import vendor-specific class contracts');
assert.match(pkg.scripts['verify:ui'], /verify-v1432-shell-navigation-foundation-sm1\.mjs/, 'Shell M1 verifier must participate in verify:ui');

console.log('v1.43.2 Shell Milestone 1 navigation foundation verification: PASS');
