import type { BoardColumn, BoardColumnType } from './domain.ts';

export type BoardImportFileKind = 'csv' | 'xls' | 'xlsx';
export type BoardImportSeverity = 'error' | 'warning' | 'info';
export type BoardImportDiagnosticSourceKind = 'import-row' | 'persisted-item' | 'relationship' | 'schema' | 'parser';

export interface BoardImportDiagnosticSource {
  readonly kind: BoardImportDiagnosticSourceKind;
  readonly row?: number;
  readonly itemId?: string;
  readonly relationshipId?: string;
}

export interface BoardImportDiagnostic {
  readonly code: string;
  readonly severity: BoardImportSeverity;
  readonly message: string;
  readonly sheet?: string;
  readonly row?: number;
  readonly column?: number;
  readonly header?: string;
  /** Canonical imported field/key affected by this diagnostic. */
  readonly field?: string;
  /** Stable rule identifier suitable for programmatic handling. */
  readonly rule?: string;
  /** Imported value as received before semantic normalization. */
  readonly importedValue?: unknown;
  /** Human-readable expected format/constraint. */
  readonly expected?: string;
  /** Enumerated accepted values where the rule has a finite domain. */
  readonly acceptedValues?: readonly string[];
  /** Source of a duplicate decision, when applicable. */
  readonly duplicateSource?: BoardImportDiagnosticSource;
  /** Source of a conflict decision, when applicable. */
  readonly conflictSource?: BoardImportDiagnosticSource;
  /** Whether the issue blocks commit until corrected or explicitly excluded. */
  readonly blocking?: boolean;
}

export interface BoardImportSchemaField {
  readonly key: string;
  readonly label: string;
  readonly aliases?: readonly string[];
  readonly required?: boolean;
  readonly dataType?: BoardColumnType | 'item_id' | 'item_name' | 'item_updated_at' | 'group_id' | 'group';
}

export interface BoardImportSchema {
  readonly fields: readonly BoardImportSchemaField[];
}

export interface BoardImportColumnMapping {
  readonly source: string;
  readonly target: string | null;
}

export type BoardImportPrimitive = string | number | boolean | null;

export interface BoardImportRow {
  readonly sourceRow: number;
  readonly values: Readonly<Record<string, BoardImportPrimitive>>;
  readonly raw: readonly BoardImportPrimitive[];
}

export interface BoardImportWorksheet {
  readonly name: string;
  readonly index: number;
  readonly hidden: boolean;
  readonly rowCount: number;
  readonly columnCount: number;
}

export interface BoardImportDataset {
  readonly format: BoardImportFileKind;
  readonly fileName: string;
  readonly fileSize: number;
  readonly mimeType: string;
  readonly selectedWorksheet: string;
  readonly worksheets: readonly BoardImportWorksheet[];
  readonly headerRow: number;
  readonly headers: readonly string[];
  readonly mapping: readonly BoardImportColumnMapping[];
  readonly missingRequiredColumns: readonly string[];
  readonly unexpectedColumns: readonly string[];
  readonly rows: readonly BoardImportRow[];
  readonly diagnostics: readonly BoardImportDiagnostic[];
  readonly mutationAllowed: false;
}

export interface BoardImportOptions {
  readonly schema: BoardImportSchema;
  readonly worksheet?: string | number;
  readonly headerRow?: number;
  readonly columnMapping?: Readonly<Record<string, string | null>>;
  readonly maxFileBytes?: number;
  readonly maxRows?: number;
  readonly allowUnexpectedColumns?: boolean;
}

export interface BoardImportSource {
  readonly name: string;
  readonly type?: string;
  readonly size?: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export function createBoardImportSchema(columns: readonly BoardColumn[]): BoardImportSchema {
  return Object.freeze({
    fields: Object.freeze([
      Object.freeze({ key: 'item_id', label: 'Item ID', aliases: Object.freeze(['id', 'item uuid', 'record id']), required: false, dataType: 'item_id' as const }),
      Object.freeze({ key: 'item_name', label: 'Item Name', aliases: Object.freeze(['item', 'name', 'title', 'item title']), required: true, dataType: 'item_name' as const }),
      Object.freeze({ key: 'item_updated_at', label: 'Item Updated At', aliases: Object.freeze(['item version', 'updated at', 'item updated']), required: false, dataType: 'item_updated_at' as const }),
      Object.freeze({ key: 'group_id', label: 'Group ID', aliases: Object.freeze(['group uuid']), required: false, dataType: 'group_id' as const }),
      Object.freeze({ key: 'group', label: 'Group', aliases: Object.freeze(['group name', 'section']), required: false, dataType: 'group' as const }),
      ...columns.filter((column) => column.system_key !== 'title').map((column) => Object.freeze({
        key: String(column.column_key || column.id),
        label: column.name,
        aliases: Object.freeze([column.name, String(column.column_key || ''), String(column.system_key || '')].filter(Boolean)),
        required: Boolean(column.required),
        dataType: column.data_type,
      })),
    ]),
  });
}
