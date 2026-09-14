import assert from 'node:assert/strict';
import {
  BOARD_TABLE_REQUIREMENTS,
  TANSTACK_TABLE_EVALUATION,
  evaluateTanStackTableCandidate,
} from '../src/app/boards/evaluation/index.ts';

assert.equal(TANSTACK_TABLE_EVALUATION.candidatePackage, '@tanstack/react-table');
assert.equal(TANSTACK_TABLE_EVALUATION.candidateVersion, '9.2.4');
assert.equal(TANSTACK_TABLE_EVALUATION.runtimeDependencyInstalled, false);
assert.equal(TANSTACK_TABLE_EVALUATION.architectureVersion, 26);
assert.equal(TANSTACK_TABLE_EVALUATION.requirements.length, BOARD_TABLE_REQUIREMENTS.length);
assert.equal(TANSTACK_TABLE_EVALUATION.supportCounts.native, 4);
assert.equal(TANSTACK_TABLE_EVALUATION.supportCounts.adapter, 4);
assert.equal(TANSTACK_TABLE_EVALUATION.supportCounts.external, 8);
assert.equal(TANSTACK_TABLE_EVALUATION.decision, 'defer-production-adoption');
for (const requiredExternal of ['board-group-sections', 'typed-cell-editors', 'drag-drop', 'optimistic-history', 'accessibility-keyboard', 'server-state']) {
  assert.ok(TANSTACK_TABLE_EVALUATION.criticalExternalRequirements.includes(requiredExternal));
}

const hypothetical = evaluateTanStackTableCandidate([
  {
    id: 'headless',
    label: 'Headless markup',
    criticality: 'required',
    support: 'native',
    rationale: 'native',
  },
  {
    id: 'controlled-state',
    label: 'Controlled state',
    criticality: 'required',
    support: 'adapter',
    rationale: 'adapter',
  },
]);
assert.equal(hypothetical.decision, 'eligible-for-production-spike');
assert.deepEqual(hypothetical.criticalExternalRequirements, []);
assert.equal(Object.isFrozen(TANSTACK_TABLE_EVALUATION), true);
assert.equal(Object.isFrozen(TANSTACK_TABLE_EVALUATION.requirements), true);
assert.equal(Object.isFrozen(TANSTACK_TABLE_EVALUATION.supportCounts), true);

console.log('Stage D M17 TanStack Table evaluation execution vectors: PASS');
