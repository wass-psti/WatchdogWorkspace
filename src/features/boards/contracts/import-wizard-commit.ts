/** M143 wire contract. The server owns permissions, matches, schema and transactional validation. */
import type { BoardImportWizardDraft } from './import-wizard.ts';
import type { BoardColumnType } from './domain.ts';

export type WizardWireCell = string | number | boolean | null | Readonly<{ start: string; end: string }>;
export interface WizardWireColumn {
  readonly source: string;
  readonly name: string;
  readonly type: BoardColumnType;
  readonly config: Readonly<Record<string, unknown>>;
}
export interface WizardWireRow {
  readonly source_row: number;
  readonly title: string;
  readonly values: Readonly<Record<string, WizardWireCell>>;
  readonly expected_item_updated_at?: string;
}
export interface BoardImportWizardRpcRequest {
  readonly boardId: string;
  readonly expectedBoardVersion: string;
  readonly payload: Readonly<{
    readonly contract: 'm143-v1';
    readonly worksheet: string;
    readonly group: BoardImportWizardDraft['group'];
    readonly matches: BoardImportWizardDraft['matches'];
    readonly mappings: BoardImportWizardDraft['mappings'];
    readonly newColumns: readonly WizardWireColumn[];
    readonly rows: readonly WizardWireRow[];
  }>;
}
export interface BoardImportWizardCompletion {
  readonly created: number;
  readonly updated: number;
  readonly skipped: number;
  readonly rejected: number;
  readonly affected: number;
  readonly columnsCreated: number;
  readonly groupsCreated: number;
}
