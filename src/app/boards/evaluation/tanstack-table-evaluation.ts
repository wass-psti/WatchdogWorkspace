import {
  BOARD_TABLE_REQUIREMENTS,
  type BoardTableRequirement,
  type BoardTableRequirementSupport,
} from './board-table-requirements.ts';

export type TanStackTableEvaluationDecision = 'defer-production-adoption' | 'eligible-for-production-spike';

export interface TanStackTableEvaluationSummary {
  readonly candidatePackage: '@tanstack/react-table';
  readonly candidateVersion: '9.2.4';
  readonly runtimeDependencyInstalled: false;
  readonly architectureVersion: 26;
  readonly requirements: readonly BoardTableRequirement[];
  readonly supportCounts: Readonly<Record<BoardTableRequirementSupport, number>>;
  readonly criticalExternalRequirements: readonly string[];
  readonly decision: TanStackTableEvaluationDecision;
  readonly rationale: string;
  readonly nextGate: string;
}

function countSupport(requirements: readonly BoardTableRequirement[]): Readonly<Record<BoardTableRequirementSupport, number>> {
  const counts: Record<BoardTableRequirementSupport, number> = { native: 0, adapter: 0, external: 0 };
  for (const requirement of requirements) counts[requirement.support] += 1;
  return Object.freeze(counts);
}

export function evaluateTanStackTableCandidate(
  requirements: readonly BoardTableRequirement[] = BOARD_TABLE_REQUIREMENTS,
): TanStackTableEvaluationSummary {
  const criticalExternalRequirements = Object.freeze(
    requirements
      .filter((requirement) => requirement.criticality === 'required' && requirement.support === 'external')
      .map((requirement) => requirement.id),
  );
  const decision: TanStackTableEvaluationDecision = criticalExternalRequirements.length === 0
    ? 'eligible-for-production-spike'
    : 'defer-production-adoption';

  return Object.freeze({
    candidatePackage: '@tanstack/react-table',
    candidateVersion: '9.2.4',
    runtimeDependencyInstalled: false,
    architectureVersion: 26,
    requirements: Object.freeze([...requirements]),
    supportCounts: countSupport(requirements),
    criticalExternalRequirements,
    decision,
    rationale: decision === 'defer-production-adoption'
      ? 'TanStack Table is a strong headless state/model candidate, but the current Board Table is not a drop-in migration because critical Work Management grouping, editing, drag/drop, history, and accessibility behavior remains product-owned.'
      : 'All required behaviors are either native or adapter-backed, so a production spike may be considered.',
    nextGate: 'A later milestone may create an isolated React Table spike only after defining controlled Zustand/preference adapters and proving browser parity for grouped sections, editors, drag/drop, sticky geometry, and keyboard accessibility.',
  });
}

export const TANSTACK_TABLE_EVALUATION = evaluateTanStackTableCandidate();
