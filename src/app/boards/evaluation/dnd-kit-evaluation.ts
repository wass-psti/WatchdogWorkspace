import {
  BOARD_DRAG_DROP_REQUIREMENTS,
  type BoardDragDropRequirement,
  type BoardDragDropRequirementSupport,
} from './board-drag-drop-requirements.ts';

export type DndKitEvaluationDecision = 'defer-production-adoption' | 'eligible-for-isolated-adapter-spike';

export interface DndKitCandidate {
  readonly package: string;
  readonly version: string;
  readonly role: 'strategic-react-adapter' | 'dom-bridge' | 'legacy-stable-line';
  readonly productionDependencyInstalled: false;
}

export interface DndKitEvaluationSummary {
  readonly architectureVersion: 27;
  readonly observedDate: '2026-09-07';
  readonly candidates: readonly DndKitCandidate[];
  readonly requirements: readonly BoardDragDropRequirement[];
  readonly supportCounts: Readonly<Record<BoardDragDropRequirementSupport, number>>;
  readonly migrationBlockers: readonly string[];
  readonly decision: DndKitEvaluationDecision;
  readonly rationale: string;
  readonly nextGate: string;
}

function countSupport(requirements: readonly BoardDragDropRequirement[]): Readonly<Record<BoardDragDropRequirementSupport, number>> {
  const counts: Record<BoardDragDropRequirementSupport, number> = { native: 0, adapter: 0, 'product-owned': 0 };
  for (const requirement of requirements) counts[requirement.support] += 1;
  return Object.freeze(counts);
}

export function evaluateDndKitCandidate(
  requirements: readonly BoardDragDropRequirement[] = BOARD_DRAG_DROP_REQUIREMENTS,
): DndKitEvaluationSummary {
  const migrationBlockers = Object.freeze(
    requirements
      .filter((requirement) => requirement.criticality === 'required' && requirement.support === 'product-owned')
      .map((requirement) => requirement.id),
  );
  const decision: DndKitEvaluationDecision = migrationBlockers.length === 0
    ? 'eligible-for-isolated-adapter-spike'
    : 'defer-production-adoption';

  return Object.freeze({
    architectureVersion: 27,
    observedDate: '2026-09-07',
    candidates: Object.freeze([
      Object.freeze({ package: '@dnd-kit/react', version: '0.5.0', role: 'strategic-react-adapter', productionDependencyInstalled: false }),
      Object.freeze({ package: '@dnd-kit/dom', version: '0.5.0', role: 'dom-bridge', productionDependencyInstalled: false }),
      Object.freeze({ package: '@dnd-kit/core + @dnd-kit/sortable', version: '6.3.1 + 10.0.0', role: 'legacy-stable-line', productionDependencyInstalled: false }),
    ]),
    requirements: Object.freeze([...requirements]),
    supportCounts: countSupport(requirements),
    migrationBlockers,
    decision,
    rationale: decision === 'defer-production-adoption'
      ? 'dnd-kit provides strong sensor, accessibility, collision, and sortable primitives, but the certified Work Management Board drag lifecycle is not a drop-in library boundary. Persistence, optimistic history, M18 virtualization stability, and the current non-React Board DOM island must remain product-owned while drag intent ownership is migrated deliberately.'
      : 'All required product-owned blockers have been eliminated, so an isolated adapter spike may be considered.',
    nextGate: 'A later milestone may create an isolated dnd-kit adapter spike only after selecting React-provider ownership versus a DOM bridge, proving table/Kanban/group/column parity, preserving M18 virtualization stability, and retaining the certified keyboard, accessibility, history, rollback, overlay, and route-disposal contracts.',
  });
}

export const DND_KIT_EVALUATION = evaluateDndKitCandidate();
