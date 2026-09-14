import assert from 'node:assert/strict';
import { deriveBoardPresentationRouteModel } from '../src/app/boards/components/board-presentation-model.ts';

const hidden = deriveBoardPresentationRouteModel({ view: 'hidden', boardId: null, revision: 0 });
assert.deepEqual(hidden, { kind: 'inactive', view: 'hidden', boardId: null, ariaLabel: 'Board workspace content' });

const collection = deriveBoardPresentationRouteModel({ view: 'boards', boardId: null, revision: 1 });
assert.deepEqual(collection, { kind: 'collection', view: 'boards', boardId: null, ariaLabel: 'Boards collection' });

const workspace = deriveBoardPresentationRouteModel({ view: 'board', boardId: ' board-123 ', revision: 2 });
assert.deepEqual(workspace, { kind: 'workspace', view: 'board', boardId: 'board-123', ariaLabel: 'Board workspace' });

assert.throws(
  () => deriveBoardPresentationRouteModel({ view: 'board', boardId: null, revision: 3 }),
  /requires a board identifier/i,
);

assert.equal(Object.isFrozen(hidden), true);
assert.equal(Object.isFrozen(collection), true);
assert.equal(Object.isFrozen(workspace), true);

console.log('Stage D M16 Board component decomposition execution vectors: PASS');
