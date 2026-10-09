import { useState } from 'react';
import { buildXlsxBytes } from './export/xlsx-writer';

export function createTheme(config = {}) { return config; }
export function createSpreadsheet({ sheetName='Sheet1', title='', columns=[], rows=[], columnWidths={} } = {}) {
  const model = { sheetName, title, columns, rows: [...rows], columnWidths, summaryRows: [] };
  model.getWorksheet = () => model;
  return model;
}
export function formatColumn() { /* Formatting is encoded by the OOXML writer where applicable. */ }
export function addSummaryRow(ws, formulas = {}, label = 'Totals') {
  const row = Array(ws.columns.length).fill('');
  row[0] = label;
  for (const [key, op] of Object.entries(formulas || {})) {
    const idx = Number(key.replace('col_', ''));
    if (Number.isInteger(idx) && op === 'SUM') row[idx] = ws.rows.reduce((sum, r) => sum + (Number(r[idx]) || 0), 0);
  }
  ws.summaryRows.push(row);
}

function downloadBytes(bytes, filename, type) {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function useXlsxExport() {
  const [isExporting, setIsExporting] = useState(false);
  const exportToXlsx = async (workbook, filename='export.xlsx') => {
    setIsExporting(true);
    try {
      const bytes = buildXlsxBytes(workbook);
      downloadBytes(bytes, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } finally { setIsExporting(false); }
  };
  return { exportToXlsx, isExporting };
}
