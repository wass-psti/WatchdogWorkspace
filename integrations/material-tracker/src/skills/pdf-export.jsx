import { useState } from 'react';
import { buildPdfBytes, wrapPdfLine } from './export/pdf-writer';

function tableLines(root) {
  const table = root?.querySelector?.('table') || (root?.tagName === 'TABLE' ? root : null);
  if (!table) return ['Open the table view before exporting to PDF.'];
  const lines = [];
  for (const row of table.querySelectorAll('tr')) {
    const cells = [...row.querySelectorAll('th,td')]
      .map((cell) => cell.textContent?.replace(/\s+/g, ' ').trim() || '')
      .filter((text) => text !== '');
    if (!cells.length) continue;
    lines.push(...wrapPdfLine(cells.join(' | ')));
  }
  return lines.length ? lines : ['No table rows were available for export.'];
}

function downloadPdf(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);
  const exportToPdf = async (ref, filename='export.pdf') => {
    setIsExporting(true);
    try {
      const root = ref?.current || ref;
      downloadPdf(buildPdfBytes(tableLines(root)), filename);
    } finally { setIsExporting(false); }
  };
  return { exportToPdf, isExporting };
}
