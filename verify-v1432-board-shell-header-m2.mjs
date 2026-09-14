import fs from 'node:fs';
import assert from 'node:assert/strict';
import { renderBoardHeader } from './assets/js/features/boards/views/board-workspace-view.ts';

const read = (path) => fs.readFileSync(path, 'utf8');
const workspace = read('assets/js/features/boards/views/board-workspace-view.ts');
const css = read('assets/css/boards-monday.css');
const browser = read('tests/browser/run-cdp.mjs');
const pkg = JSON.parse(read('package.json'));

for (const marker of [
  'data-board-header',
  'aria-labelledby="board-workspace-title"',
  'board-breadcrumb-current',
  'board-header-main',
  'board-title-line',
  'board-role-badge',
  'board-description-control',
  'board-description-static',
  'board-description-edit-icon',
  'board-head-action',
  'board-head-action-divider',
  'board-head-menu-host',
  'board-action-icon',
  'board-more-icon',
]) assert.ok(workspace.includes(marker), `Milestone 2 Board header markup missing ${marker}`);

for (const invariant of [
  'data-board-back',
  'data-board-edit',
  'data-board-members',
  'data-board-activity',
  'data-board-menu-trigger="board"',
  'data-board-columns',
  'data-board-duplicate-current',
  'data-board-archive-current',
  'data-board-trash-current',
]) assert.ok(workspace.includes(invariant), `Milestone 2 lost established Board command hook ${invariant}`);

for (const selector of [
  '.board-workspace-shell > :is([data-board-header-host],[data-board-controls-host],[data-board-selection-host],[data-item-panel-host],.board-view-region)',
  '.monday-board-head',
  '.board-breadcrumb',
  '.board-breadcrumb-current',
  '.board-header-main',
  '.board-title-copy',
  '.board-title-line h2',
  '.board-role-badge',
  '.board-description-control',
  '.board-description-edit-icon',
  '.board-head-actions',
  '.board-head-actions .board-head-action',
  '.board-head-action-divider',
  '.board-head-actions .board-more-trigger',
  '@media (max-width:900px)',
  '@media (max-width:760px)',
  '@media (pointer:coarse)',
]) assert.ok(css.includes(selector), `Milestone 2 Board header CSS missing ${selector}`);

for (const contract of [
  'grid-template-columns: minmax(0,1fr);',
  'border: var(--wm-board-border-width) solid var(--board-line)!important;',
  'border-radius: var(--board-radius-surface)!important;',
  'background: var(--board-surface)!important;',
  'box-shadow: var(--board-shadow-card)!important;',
  'grid-template-columns: minmax(0,1fr) auto;',
  'font-size: clamp(var(--wm-board-font-title-min),2vw,var(--wm-board-font-title-max))!important;',
  'max-width: min(var(--wm-reading-max),100%);',
  'min-height: var(--board-control-small)!important;',
  'width: var(--board-control-small)!important;',
  'min-width: var(--board-control-small)!important;',
]) assert.ok(css.includes(contract), `Milestone 2 Board header geometry contract missing ${contract}`);

assert.doesNotMatch(css, /\.monday-board-title-row\b/, 'Obsolete Milestone 1 title-row compatibility selector remains in the authoritative Board layer');
assert.doesNotMatch(css, /\.monday-board-head\s*\{[^}]*padding:\s*(?:2[4-9]|[3-9]\d)px/s, 'Board header regressed to oversized local padding');
assert.doesNotMatch(css, /\.board-head-actions\s+\.board-head-action\s*\{[^}]*min-height:\s*[4-9]\dpx/s, 'Desktop Board header actions regressed to oversized local geometry');
assert.doesNotMatch(css, /transition\s*:\s*all\b/, 'Milestone 2 must not introduce transition-all');
assert.doesNotMatch(css, /https?:\/\//, 'Milestone 2 must not introduce remote visual dependencies');

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);
const icons = {
  grid:'',clock:'',fuel:'',trade:'',search:'',settings:'',arrow:'',
  back:'<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
  reload:'',external:'',star:'',download:'',upload:'',check:'',user:'',
  users:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/></svg>',
  boards:'',lock:'',cloud:'',
};

const managedHeader = renderBoardHeader({
  board: {
    id:'board-1',
    name:'Operations & Delivery',
    description:'Shared work <and> delivery context',
    member_role:'owner',
    status:'active',
  },
  canEdit:true,
  canManage:true,
  icons,
  escapeHtml,
});
assert.ok(managedHeader.includes('id="board-workspace-title"'), 'Board title does not expose the header label target');
assert.ok(managedHeader.includes('Operations &amp; Delivery'), 'Board header no longer escapes the title');
assert.ok(managedHeader.includes('Shared work &lt;and&gt; delivery context'), 'Board header no longer escapes the description');
assert.ok(managedHeader.includes('data-board-members') && managedHeader.includes('data-board-activity'), 'Manage-capable header lost Members or Activity');
assert.ok(managedHeader.includes('board-description-control') && managedHeader.includes('data-board-edit'), 'Editable description no longer routes through the established board-details action');
assert.ok(managedHeader.includes('board-head-action-divider') && managedHeader.includes('board-more-icon'), 'Header action hierarchy lost its overflow separation');
assert.ok(managedHeader.includes('aria-label="Your role on this board: Owner"'), 'Board role is not exposed accessibly');

const emptyEditableHeader = renderBoardHeader({
  board: { id:'board-2', name:'Empty board', description:'', member_role:'editor', status:'active' },
  canEdit:true,
  canManage:false,
  icons,
  escapeHtml,
});
assert.ok(emptyEditableHeader.includes('board-description-control is-placeholder'), 'Empty editable description does not expose the subtle placeholder field');
assert.ok(emptyEditableHeader.includes('Add a description so collaborators understand what this board tracks.'), 'Empty description guidance is missing');
assert.ok(!emptyEditableHeader.includes('data-board-members'), 'Non-manager header incorrectly exposes Members administration');
assert.ok(emptyEditableHeader.includes('data-board-activity'), 'Non-manager header lost Activity access');

const viewerHeader = renderBoardHeader({
  board: { id:'board-3', name:'Read only', description:'Viewer description', member_role:'viewer', status:'active' },
  canEdit:false,
  canManage:false,
  icons,
  escapeHtml,
});
assert.ok(viewerHeader.includes('board-description-static'), 'Read-only Board header does not render a non-interactive description');
assert.ok(!viewerHeader.includes('board-description-control'), 'Read-only Board header incorrectly exposes editable description affordance');
assert.ok(!viewerHeader.includes('data-board-edit'), 'Read-only Board header incorrectly exposes edit commands');
assert.ok(!viewerHeader.includes('data-board-menu-trigger="board"'), 'Read-only Board header renders an empty overflow menu');
assert.ok(viewerHeader.includes('data-board-activity'), 'Read-only Board header lost Activity access');

for (const browserMarker of [
  'Board shell/header Milestone 2 audit: header has a defined Board surface',
  'Board shell/header Milestone 2 audit: desktop header remains compact',
  'Board shell/header Milestone 2 audit: compact action rail follows board identity without overlap',
  "{ name:'compact workspace', width:820, height:980 }",
  "{ name:'coarse pointer narrow', width:390, height:844, touch:true }",
]) assert.ok(browser.includes(browserMarker), `Milestone 2 browser coverage missing ${browserMarker}`);

assert.match(pkg.scripts['verify:ui'], /verify-v1432-board-shell-header-m2\.mjs/, 'Milestone 2 verifier must participate in verify:ui');

console.log('v1.43.2 Boards Milestone 2 shell/header reconstruction verification: PASS');
