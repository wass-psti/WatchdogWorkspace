/** M141: source-only, non-mutating wizard planning contract.
 * No existing Board Import or persistence interface is modified by this addition.
 */
import type { BoardColumnType } from './domain.ts';

export type BoardImportWizardStep = 'upload' | 'map-columns' | 'handle-matches';

export type BoardImportWizardColumnChoice =
  | Readonly<{ source: string; action: 'item' }>
  | Readonly<{ source: string; action: 'existing'; columnId: string }>
  | Readonly<{ source: string; action: 'create'; name: string; columnType: BoardColumnType }>
  | Readonly<{ source: string; action: 'skip' }>;

export type BoardImportWizardGroupChoice =
  | Readonly<{ action: 'existing'; groupId: string }>
  | Readonly<{ action: 'create'; name: string }>;

/** Match columns are existing target columns, not newly proposed columns. */
export type BoardImportWizardMatchChoice =
  | Readonly<{ behavior: 'add-new' }>
  | Readonly<{ behavior: 'skip' | 'update'; matchColumnId: 'item' | string }>;

export interface BoardImportWizardDraft {
  readonly sourceWorksheet: string;
  readonly mappings: readonly BoardImportWizardColumnChoice[];
  readonly group: BoardImportWizardGroupChoice;
  readonly matches: BoardImportWizardMatchChoice;
}

export interface BoardImportWizardIssue {
  readonly code: string;
  readonly message: string;
  readonly sourceRow?: number;
  readonly sourceColumn?: string;
}

export interface BoardImportWizardRowDecision {
  readonly sourceRow: number;
  readonly decision: 'create' | 'skip' | 'update' | 'blocked';
  readonly existingItemId?: string;
  readonly reason?: string;
}

export interface BoardImportWizardPlan {
  readonly sourceWorksheet: string;
  readonly boardId: string;
  readonly boardVersion: string;
  readonly mappings: readonly BoardImportWizardColumnChoice[];
  readonly plannedColumnCount: number;
  readonly mappedColumnCount: number;
  readonly excludedColumnCount: number;
  readonly group: BoardImportWizardGroupChoice;
  readonly matches: BoardImportWizardMatchChoice;
  readonly decisions: readonly BoardImportWizardRowDecision[];
  readonly errors: readonly BoardImportWizardIssue[];
  readonly cautions: readonly BoardImportWizardIssue[];
  /** A valid configuration is not a permission to mutate the database. */
  readonly configurationValid: boolean;
  readonly requiresExtendedBackend: boolean;
  readonly mutationAllowed: false;
}
