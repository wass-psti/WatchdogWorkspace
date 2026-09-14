import assert from 'node:assert/strict';
import { globalOverlayRuntime } from '../assets/js/platform/ui/global-overlay-runtime.ts';

let closedA = 0;
let closedB = 0;
let notifications = 0;
const unsubscribe = globalOverlayRuntime.subscribe(() => { notifications += 1; });

globalOverlayRuntime.reset();
globalOverlayRuntime.claim({
  instanceId: 'manager-a',
  scope: 'a',
  rootId: 'root-a',
  topId: 'root-a',
  documentRef: null,
  closeAll: () => { closedA += 1; },
});
assert.deepEqual(globalOverlayRuntime.getSnapshot(), {
  active: true,
  ownerInstanceId: 'manager-a',
  ownerScope: 'a',
  rootId: 'root-a',
  topId: 'root-a',
});

globalOverlayRuntime.update('manager-a', 'child-a');
assert.equal(globalOverlayRuntime.getSnapshot().topId, 'child-a');

globalOverlayRuntime.claim({
  instanceId: 'manager-b',
  scope: 'b',
  rootId: 'root-b',
  topId: 'root-b',
  documentRef: null,
  closeAll: () => { closedB += 1; },
});
assert.equal(closedA, 1, 'claiming a new root owner must close the previous global branch exactly once');
assert.equal(globalOverlayRuntime.getSnapshot().ownerInstanceId, 'manager-b');

globalOverlayRuntime.release('manager-a');
assert.equal(globalOverlayRuntime.getSnapshot().ownerInstanceId, 'manager-b', 'stale owner release must not clear the current global owner');

globalOverlayRuntime.release('manager-b');
assert.equal(globalOverlayRuntime.getSnapshot().active, false);
assert.equal(closedB, 0, 'normal release must not invoke the owner close callback');
assert.ok(notifications >= 4, 'global overlay runtime must publish meaningful ownership transitions');


// Re-entrant replacement must not resurrect an older claimant. This covers a
// close callback that synchronously opens another global surface while the
// previous branch is being replaced.
let closedReentrantB = 0;
globalOverlayRuntime.claim({
  instanceId: 'manager-reentrant-a',
  scope: 'reentrant-a',
  rootId: 'root-reentrant-a',
  topId: 'root-reentrant-a',
  documentRef: null,
  closeAll: () => {
    globalOverlayRuntime.claim({
      instanceId: 'manager-reentrant-c',
      scope: 'reentrant-c',
      rootId: 'root-reentrant-c',
      topId: 'root-reentrant-c',
      documentRef: null,
      closeAll: () => {},
    });
  },
});
globalOverlayRuntime.claim({
  instanceId: 'manager-reentrant-b',
  scope: 'reentrant-b',
  rootId: 'root-reentrant-b',
  topId: 'root-reentrant-b',
  documentRef: null,
  closeAll: () => { closedReentrantB += 1; },
});
assert.equal(closedReentrantB, 1, 'a re-entrant newer claim must close the superseded incoming branch');
assert.equal(globalOverlayRuntime.getSnapshot().ownerInstanceId, 'manager-reentrant-c', 'the newest re-entrant global claim must remain authoritative');
globalOverlayRuntime.release('manager-reentrant-c');

unsubscribe();
globalOverlayRuntime.reset();
console.log('Stage C M11 global overlay ownership execution vectors: PASS');
