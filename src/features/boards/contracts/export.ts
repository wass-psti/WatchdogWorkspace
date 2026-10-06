import type { BoardColumnType, BoardEnvelope, TimelineValue } from './domain.ts';

export type BoardExportFormat = 'csv' | 'xlsx';
export type BoardImportExportScalar = string | number | boolean | null;
export type BoardImportExportValue = BoardImportExportScalar | TimelineValue;

export interface BoardPortableColumnSpecification {
  readonly key: string;
  readonly header: string;
  readonly label: string;
  readonly dataType: BoardColumnType | 'item_id' | 'item_name' | 'item_updated_at' | 'group_id' | 'group';
  readonly required: boolean;
  readonly acceptedValues: readonly string[];
  readonly format: string;
  readonly unique: boolean;
  readonly nullable: boolean;
  readonly blankAllowed: boolean;
  readonly maxLength: number | null;
  readonly example: string;
  readonly normalization: string;
  readonly relationship: string;
  readonly validation: string;
  readonly duplicateBehavior: string;
}

export interface BoardPortableSpecification {
  readonly version: '1.1';
  readonly boardId: string;
  readonly boardName: string;
  readonly columns: readonly BoardPortableColumnSpecification[];
  readonly duplicatePolicy: string;
  readonly conflictPolicy: string;
  readonly updatePolicy: string;
}

export interface BoardExportArtifact {
  readonly format: BoardExportFormat;
  readonly fileName: string;
  readonly mimeType: string;
  readonly bytes: Uint8Array;
  readonly specification: BoardPortableSpecification;
}

export interface BoardExportOptions {
  readonly includeArchived?: boolean;
  readonly template?: boolean;
  readonly includeExamples?: boolean;
}

export interface BoardExportService {
  specification(board: BoardEnvelope): BoardPortableSpecification;
  export(board: BoardEnvelope, format: BoardExportFormat, options?: BoardExportOptions): BoardExportArtifact;
}
