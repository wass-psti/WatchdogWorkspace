import assert from 'node:assert/strict';
import {
  BOARD_DRAG_DROP_REQUIREMENTS,
  DND_KIT_EVALUATION,
  evaluateDndKitCandidate,
} from '../src/app/boards/evaluation/index.ts';

assert.equal(DND_KIT_EVALUATION.architectureVersion, 27);
assert.equal(DND_KIT_EVALUATION.observedDate, '2026-09-07');
assert.equal(DND_KIT_EVALUATION.candidates[0]?.package, '@dnd-kit/react');
assert.equal(DND_KIT_EVALUATION.candidates[0]?.version, '0.5.0');
assert.equal(DND_KIT_EVALUATION.candidates[1]?.package, '@dnd-kit/dom');
assert.equal(DND_KIT_EVALUATION.candidates[1]?.version, '0.5.0');
assert.equal(DND_KIT_EVALUATION.candidates[2]?.version, '6.3.1 + 10.0.0');
assert.equal(DND_KIT_EVALUATION.requirements.length, BOARD_DRAG_DROP_REQUIREMENTS.length);
assert.equal(DND_KIT_EVALUATION.supportCounts.native, 3);
assert.equal(DND_KIT_EVALUATION.supportCounts.adapter, 10);
assert.equal(DND_KIT_EVALUATION.supportCounts['product-owned'], 5);
assert.equal(DND_KIT_EVALUATION.decision, 'defer-production-adoption');
for (const blocker of [
  'optimistic-history-rollback',
  'command-service-authority',
  'virtualization-drag-freeze',
  'non-react-board-island',
  'server-state-separation',
]) assert.ok(DND_KIT_EVALUATION.migrationBlockers.includes(blocker));

const hypothetical = evaluateDndKitCandidate([
  {
    id: 'sensors',
    label: 'Sensors',
    criticality: 'required',
    support: 'native',
    rationale: 'native',
  },
  {
    id: 'movement-adapter',
    label: 'Movement adapter',
    criticality: 'required',
    support: 'adapter',
    rationale: 'adapter',
  },
]);
assert.equal(hypothetical.decision, 'eligible-for-isolated-adapter-spike');
assert.deepEqual(hypothetical.migrationBlockers, []);
assert.equal(Object.isFrozen(DND_KIT_EVALUATION), true);
assert.equal(Object.isFrozen(DND_KIT_EVALUATION.candidates), true);
assert.equal(Object.isFrozen(DND_KIT_EVALUATION.requirements), true);
assert.equal(Object.isFrozen(DND_KIT_EVALUATION.supportCounts), true);

console.log('Stage D M19 dnd-kit drag-and-drop evaluation execution vectors: PASS');
