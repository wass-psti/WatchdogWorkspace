import { readFile } from 'node:fs/promises';
import { parseBoardImport, BoardImportError } from './src/features/boards/import/board-import-parser.ts';

const schema = Object.freeze({ fields: Object.freeze([
  Object.freeze({ key: 'item_name', label: 'Item Name', aliases: Object.freeze(['item', 'title']), required: true, dataType: 'item_name' }),
  Object.freeze({ key: 'group', label: 'Group', required: false, dataType: 'group' }),
  Object.freeze({ key: 'budget', label: 'Budget', required: false, dataType: 'number' }),
]) });

const mime = Object.freeze({
  csv: 'text/csv',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});

const fixture = async (name, type) => {
  const bytes = await readFile(new URL(`./tests/fixtures/board-import/${name}`, import.meta.url));
  return new File([bytes], name, { type });
};

const assert = (value, message) => { if (!value) throw new Error(message); };

for (const ext of ['csv', 'xls', 'xlsx']) {
  const data = await parseBoardImport(await fixture(`boards-valid.${ext}`, mime[ext]), { schema, allowUnexpectedColumns: true });
  assert(data.format === ext, `${ext}: format mismatch`);
  assert(data.mutationAllowed === false, `${ext}: import foundation must be read-only`);
  assert(data.selectedWorksheet === (ext === 'csv' ? 'CSV' : 'Import'), `${ext}: worksheet selection mismatch`);
  assert(data.headerRow === 3, `${ext}: expected header row 3, got ${data.headerRow}`);
  assert(data.rows.length === 2, `${ext}: expected 2 rows, got ${data.rows.length}`);
  assert(data.rows[0].values.item_name === 'Task A', `${ext}: item normalization failed`);
  assert(data.rows[0].values.group === 'Backlog', `${ext}: group normalization failed`);
  assert(data.rows[0].values.budget === 1250.5 || data.rows[0].values.budget === '1250.5', `${ext}: budget normalization failed`);
  assert(data.unexpectedColumns.includes('Unexpected'), `${ext}: unexpected column diagnostic missing`);
  assert(data.missingRequiredColumns.length === 0, `${ext}: required column false positive`);
}

const xlsxSecond = await parseBoardImport(await fixture('boards-valid.xlsx', mime.xlsx), { schema, worksheet: 'Second' });
assert(xlsxSecond.selectedWorksheet === 'Second', 'xlsx: explicit worksheet selection failed');
assert(xlsxSecond.rows.length === 1, 'xlsx: second worksheet row count mismatch');

const mapped = await parseBoardImport(new File([new TextEncoder().encode('Title,Section\nMapped Task,Ops\n')], 'mapped.csv', { type: mime.csv }), {
  schema,
  columnMapping: { Title: 'item_name', Section: 'group' },
});
assert(mapped.rows[0].values.item_name === 'Mapped Task', 'configurable mapping failed');

const missing = await parseBoardImport(new File([new TextEncoder().encode('Group\nOps\n')], 'missing.csv', { type: mime.csv }), { schema });
assert(missing.missingRequiredColumns.includes('Item Name'), 'missing required column detection failed');
assert(missing.diagnostics.some((d) => d.code === 'IMPORT_MISSING_REQUIRED_COLUMNS'), 'missing required diagnostic absent');

await (async () => {
  try {
    await parseBoardImport(await fixture('boards-malformed.csv', mime.csv), { schema });
    throw new Error('malformed CSV was accepted');
  } catch (error) {
    assert(error instanceof BoardImportError && error.diagnostic.code === 'IMPORT_CSV_UNCLOSED_QUOTE', 'malformed CSV did not fail deterministically');
  }
})();

await (async () => {
  try {
    await parseBoardImport(await fixture('boards-corrupt.xlsx', mime.xlsx), { schema });
    throw new Error('corrupt XLSX was accepted');
  } catch (error) {
    assert(error instanceof BoardImportError && error.diagnostic.code === 'IMPORT_XLSX_CORRUPT_ZIP', 'corrupt XLSX did not fail deterministically');
  }
})();

await (async () => {
  try {
    await parseBoardImport(new File([new Uint8Array([1,2,3])], 'bad.exe', { type: 'application/octet-stream' }), { schema });
    throw new Error('unsupported extension was accepted');
  } catch (error) {
    assert(error instanceof BoardImportError && error.diagnostic.code === 'IMPORT_UNSUPPORTED_EXTENSION', 'extension validation failed');
  }
})();

await (async () => {
  try {
    await parseBoardImport(new File([new TextEncoder().encode('Item Name\nA')], 'bad.csv', { type: 'application/pdf' }), { schema });
    throw new Error('MIME mismatch was accepted');
  } catch (error) {
    assert(error instanceof BoardImportError && error.diagnostic.code === 'IMPORT_MIME_MISMATCH', 'MIME validation failed');
  }
})();

console.log('M100 Boards import foundation verification: PASS (csv/xls/xlsx; worksheets; header detection; mapping; required/unexpected columns; normalization; malformed inputs; mutationAllowed=false)');
