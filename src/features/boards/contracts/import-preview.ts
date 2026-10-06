import type { BoardEnvelope, TimelineValue } from './domain.ts';
import type { BoardId } from '../../../types/identifiers.ts';
import type { BoardImportColumnMapping, BoardImportDataset, BoardImportDiagnostic, BoardImportOptions, BoardImportPrimitive } from './import.ts';

export type BoardImportNormalizedValue = BoardImportPrimitive | TimelineValue;
export type BoardImportRowDisposition = 'valid' | 'invalid' | 'duplicate' | 'conflict' | 'skipped';
export type BoardImportCommitOperation = 'create' | 'update';

export interface BoardImportPreviewRow {
  readonly sourceRow: number;
  readonly disposition: BoardImportRowDisposition;
  readonly excluded: boolean;
  readonly normalized: Readonly<Record<string, BoardImportNormalizedValue>>;
  readonly diagnostics: readonly BoardImportDiagnostic[];
  readonly existingItemId?: string;
  readonly groupId?: string;
  readonly operation?: BoardImportCommitOperation;
}

export interface BoardImportPreviewSummary {
  readonly valid: number;
  readonly invalid: number;
  readonly duplicate: number;
  readonly conflict: number;
  readonly skipped: number;
  readonly excluded: number;
  readonly committable: number;
  readonly creates: number;
  readonly updates: number;
}

export interface BoardImportPreview {
  readonly boardId: BoardId;
  readonly boardVersion: string;
  readonly dataset: BoardImportDataset;
  readonly mapping: readonly BoardImportColumnMapping[];
  readonly rows: readonly BoardImportPreviewRow[];
  readonly summary: BoardImportPreviewSummary;
  readonly blocking: boolean;
  readonly mutationAllowed: false;
}

export interface BoardImportPreviewOptions extends BoardImportOptions {
  readonly excludedSourceRows?: readonly number[];
}

export interface BoardImportCommitRow {
  readonly sourceRow: number;
  readonly operation: BoardImportCommitOperation;
  readonly itemId?: string;
  readonly expectedItemUpdatedAt?: string;
  readonly itemName: string;
  readonly groupId: string;
  readonly values: Readonly<Record<string, BoardImportNormalizedValue>>;
}

export interface BoardImportReviewSummary {
  readonly skipped: number;
  readonly rejected: number;
}

export interface BoardImportCommitRequest {
  readonly boardId: BoardId;
  readonly expectedBoardVersion: string;
  readonly rows: readonly BoardImportCommitRow[];
  readonly reviewSummary: BoardImportReviewSummary;
}

export interface BoardImportCompletionSummary {
  readonly created: number;
  readonly updated: number;
  readonly skipped: number;
  readonly rejected: number;
  readonly affected: number;
}

export interface BoardImportWorkflow {
  preview(dataset: BoardImportDataset, board: BoardEnvelope, options?: Readonly<{ excludedSourceRows?: readonly number[] }>): BoardImportPreview;
  remap(dataset: BoardImportDataset, board: BoardEnvelope, options: BoardImportPreviewOptions): Promise<BoardImportPreview>;
}
