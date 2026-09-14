import assert from 'node:assert/strict';
import { authenticatedManagementUiRuntime } from '../src/app/management/authenticated-management-ui-runtime.ts';

const initial = authenticatedManagementUiRuntime.resetForTest();
assert.equal(initial.view, 'hidden');
assert.deepEqual(initial.accountBusy, []);
assert.deepEqual(initial.settingsBusy, []);
assert.equal('password' in initial, false);
assert.equal('confirmPassword' in initial, false);

let notifications = 0;
const unsubscribe = authenticatedManagementUiRuntime.subscribe(() => { notifications += 1; });

authenticatedManagementUiRuntime.show('account');
assert.equal(authenticatedManagementUiRuntime.getSnapshot().view, 'account');
authenticatedManagementUiRuntime.show('settings');
assert.equal(authenticatedManagementUiRuntime.getSnapshot().view, 'settings');
authenticatedManagementUiRuntime.show('users');
assert.equal(authenticatedManagementUiRuntime.getSnapshot().view, 'users');

authenticatedManagementUiRuntime.hide();
const hidden = authenticatedManagementUiRuntime.getSnapshot();
assert.equal(hidden.view, 'hidden');
assert.equal(hidden.accountBusy.length, 0);
assert.equal(hidden.settingsBusy.length, 0);
assert.ok(notifications >= 4, 'M13 runtime should publish management route ownership transitions.');
unsubscribe();

console.log('Stage C M13 authenticated management UI ownership execution vectors: PASS');
process.exit(0);
