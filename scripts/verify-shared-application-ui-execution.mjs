import assert from 'node:assert/strict';
import { sharedApplicationUiRuntime } from '../src/app/shared-ui/shared-application-ui-runtime.ts';

sharedApplicationUiRuntime.resetForTest();
let executed = '';
let updateApplied = 0;
let updateDismissed = 0;
let notifications = 0;
const unsubscribe = sharedApplicationUiRuntime.subscribe(() => { notifications += 1; });

sharedApplicationUiRuntime.configureCommandPalette({
  list(query) {
    const records = [
      Object.freeze({ id: 'navigate:home', title: 'Applications', subtitle: 'Work Management home', icon: '<svg></svg>', keywords: Object.freeze(['home']) }),
      Object.freeze({ id: 'navigate:boards', title: 'Boards', subtitle: 'Collaborative work boards', icon: '<svg></svg>', keywords: Object.freeze(['tasks']) }),
    ];
    const q = query.trim().toLowerCase();
    return Object.freeze(records.filter((item) => !q || `${item.title} ${item.subtitle} ${item.keywords.join(' ')}`.toLowerCase().includes(q)));
  },
  execute(id) { executed = id; },
  motionEnabled() { return false; },
});
sharedApplicationUiRuntime.configureUpdate({
  apply() { updateApplied += 1; },
  dismiss() { updateDismissed += 1; },
});

sharedApplicationUiRuntime.openCommandPalette();
let current = sharedApplicationUiRuntime.getSnapshot();
assert.equal(current.command.phase, 'open');
assert.equal(current.command.items.length, 2);
sharedApplicationUiRuntime.updateCommandQuery('board');
current = sharedApplicationUiRuntime.getSnapshot();
assert.equal(current.command.query, 'board');
assert.equal(current.command.items.length, 1);
assert.equal(current.command.items[0]?.id, 'navigate:boards');
await sharedApplicationUiRuntime.executeSelectedCommand();
assert.equal(executed, 'navigate:boards');
assert.equal(sharedApplicationUiRuntime.getSnapshot().command.phase, 'closed');

const toastId = sharedApplicationUiRuntime.pushToast('Saved.', 'success', 60_000);
assert.ok(toastId);
assert.equal(sharedApplicationUiRuntime.getSnapshot().toasts.length, 1);
sharedApplicationUiRuntime.dismissToast(toastId);
assert.equal(sharedApplicationUiRuntime.getSnapshot().toasts.length, 0);

sharedApplicationUiRuntime.showUpdate();
assert.equal(sharedApplicationUiRuntime.getSnapshot().update.available, true);
await sharedApplicationUiRuntime.applyUpdate();
assert.equal(updateApplied, 1);
sharedApplicationUiRuntime.dismissUpdate();
assert.equal(updateDismissed, 1);
assert.equal(sharedApplicationUiRuntime.getSnapshot().update.available, false);
assert.ok(notifications >= 8, 'M14 shared UI runtime should publish command, toast, and update transitions.');
unsubscribe();
sharedApplicationUiRuntime.resetForTest();

console.log('Stage C M14 shared application UI execution vectors: PASS');
process.exit(0);
