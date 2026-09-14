import assert from 'node:assert/strict';
import { reactShellRuntime } from '../src/app/shell/shell-runtime-bridge.ts';

const initial = reactShellRuntime.getSnapshot();
assert.equal(initial.mode, 'standalone');
assert.equal(initial.workspaceMode, 'page');

let notifications = 0;
const unsubscribe = reactShellRuntime.subscribe(() => { notifications += 1; });
const active = reactShellRuntime.showShell({
  navigationMarkup: '<button data-nav="boards">Boards</button>',
  online: false,
  cloudModeLabel: 'Cloud connected',
  platformVersion: '1.43.2',
  activeRoute: 'boards',
  workspaceMode: 'module',
});
assert.equal(active.mode, 'shell');
assert.equal(active.activeRoute, 'boards');
assert.equal(active.workspaceMode, 'module');
assert.equal(active.online, false);
assert.equal(notifications, 1);

reactShellRuntime.update({ online: true, workspaceMode: 'page' });
assert.equal(reactShellRuntime.getSnapshot().online, true);
assert.equal(reactShellRuntime.getSnapshot().workspaceMode, 'page');
assert.equal(notifications, 2);

reactShellRuntime.showStandalone('login');
assert.equal(reactShellRuntime.getSnapshot().mode, 'standalone');
assert.equal(reactShellRuntime.getSnapshot().activeRoute, 'login');
assert.equal(notifications, 3);
unsubscribe();

console.log('Stage C M10 React shell runtime-bridge execution vectors: PASS');
