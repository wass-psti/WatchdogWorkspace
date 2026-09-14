import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('assets/js/app.ts');
const menu = read('assets/js/features/account/profile-menu.ts');
const css = read('assets/css/shell-account-menu.css');
const tokens = read('assets/css/foundation/tokens.css');
const themes = read('assets/css/foundation/themes.css');
const main = read('src/main.ts');
const browser = read('tests/browser/run-cdp.mjs');
const pkg = JSON.parse(read('package.json'));

for (const marker of [
  '--wm-shell-account-trigger-height: 40px;',
  '--wm-shell-account-trigger-avatar: 30px;',
  '--wm-shell-account-menu-width: 340px;',
  '--wm-shell-account-submenu-width: 276px;',
  '--wm-shell-account-menu-max-height: 640px;',
  '--wm-shell-account-menu-gutter: 12px;',
  '--wm-shell-account-menu-row-height: 42px;',
  '--wm-shell-account-menu-row-touch-height: 48px;',
  '--wm-shell-account-menu-icon-size: 18px;',
  '--wm-shell-account-avatar-size: 42px;',
]) assert.ok(tokens.includes(marker), `Shell M5 semantic token missing: ${marker}`);

for (const marker of [
  '--wm-shell-account-surface:',
  '--wm-shell-account-surface-elevated:',
  '--wm-shell-account-header-surface:',
  '--wm-shell-account-hover:',
  '--wm-shell-account-selected:',
  '--wm-shell-account-text:',
  '--wm-shell-account-muted:',
  '--wm-shell-account-border:',
  '--wm-shell-account-focus:',
  '--wm-shell-account-shadow:',
]) assert.ok((themes.match(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length >= 3, `Shell M5 theme role must exist in light, dark and system-dark scopes: ${marker}`);

assert.ok(main.indexOf("shell-navigation.css") < main.indexOf("shell-overlays.css"), 'Shell M6 shared overlay layer must load after Shell navigation');
assert.ok(main.indexOf("shell-overlays.css") < main.indexOf("shell-account-menu.css"), 'Shell M5 account layer must consume the shared Shell M6 overlay foundation');
assert.ok(main.indexOf("shell-account-menu.css") < main.indexOf("boards-monday.css"), 'Shell M5 account layer must load before Board-specific presentation');

for (const marker of [
  "import { createAccountProfileMenu } from './features/account/profile-menu.ts';",
  'data-account-menu-trigger',
  'aria-haspopup="menu"',
  'aria-controls="wmShellAccountMenu"',
  'accountProfileMenu = createAccountProfileMenu({',
  "await auth.signOut({ scope:'local' });",
  "action.matches('button[data-account-menu-trigger]')",
  'accountProfileMenu?.close({ restoreFocus:false });',
  "window.addEventListener('resize', () => accountProfileMenu?.reposition()",
]) assert.ok(app.includes(marker), `Shell M5 app integration missing: ${marker}`);

for (const marker of [
  'createOverlayManager({ scope: \'shell-account\'',
  "setAttribute('role', 'menu')",
  'role="menuitem"',
  'role="menuitemradio"',
  'aria-checked=',
  'aria-haspopup="menu"',
  'aria-expanded="false"',
  'My profile & security',
  'User management',
  'Platform settings',
  'Appearance',
  'Sign out',
  'auth.canManageUsers ?',
  'savePreferences(next)',
  'applyTheme(theme)',
  "event.key === 'ArrowDown'",
  "event.key === 'ArrowUp'",
  "event.key === 'Home'",
  "event.key === 'End'",
  "event.key === 'ArrowRight'",
  "event.key === 'ArrowLeft'",
  'typeahead +=',
  'positionMenu(',
  'overlay.open({ id: ACCOUNT_MENU_ID',
  'overlay.open({ id: APPEARANCE_MENU_ID',
  'restoreTarget.focus()',
]) assert.ok(menu.includes(marker), `Shell M5 profile-menu contract missing: ${marker}`);

for (const forbidden of [
  /AI credits/i,
  /Try the AI Work Platform/i,
  /App marketplace/i,
  /monday\.labs/i,
  /Upgrade account/i,
  /files\.monday\.com/i,
  /cdn\.monday\.com/i,
  /APSGroup of Companies/i,
]) assert.doesNotMatch(menu, forbidden, `Shell M5 must not fabricate or import Monday-only account features: ${forbidden}`);

for (const marker of [
  '.account-pill[data-account-menu-trigger]',
  '.shell-account-menu',
  '.shell-account-menu-header',
  '.shell-account-menu-item',
  '.shell-account-menu-session',
  '@media (max-width: 620px)',
  '@media (pointer: coarse)',
  '@media (prefers-reduced-motion: reduce)',
  '@media (forced-colors: active)',
]) assert.ok(css.includes(marker), `Shell M5 CSS contract missing: ${marker}`);
assert.doesNotMatch(css, /transition\s*:\s*all\b/i, 'Shell M5 must not introduce transition-all');
assert.doesNotMatch(css, /https?:\/\//, 'Shell M5 must not introduce remote visual dependencies');
assert.doesNotMatch(css, /(?:monday|vibe)[-_]/i, 'Shell M5 must not import vendor-specific CSS class contracts');

for (const marker of [
  'Shell M5 account launcher opens an accessible menu',
  'Shell M5 account header renders authenticated identity',
  'Shell M5 admin account menu exposes User management',
  'Shell M5 account menu supports Arrow Down navigation',
  'Shell M5 Appearance opens as a child menu',
  'Shell M5 Appearance uses the authoritative global theme preference',
  'Shell M5 Escape closes the child menu and restores submenu-trigger focus',
  'Shell M5 Escape closes the account menu and restores launcher focus',
  'Shell M5 Sign out uses the existing authenticated session action',
  'Shell M5 account menu remains viewport-contained at its semantic width',
  'Shell M5 account actions meet pointer-appropriate row targets',
]) assert.ok(browser.includes(marker), `Browser integration missing Shell M5 assertion: ${marker}`);

assert.match(pkg.scripts['verify:ui'], /verify-v1432-shell-account-menu-sm5\.mjs/, 'Shell M5 verifier must participate in verify:ui');

console.log('v1.43.2 Shell Milestone 5 account/profile menu reconstruction verification: PASS');
