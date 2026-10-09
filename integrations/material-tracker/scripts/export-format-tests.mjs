import { unzipSync, strFromU8 } from 'fflate';
import { buildXlsxBytes } from '../src/skills/export/xlsx-writer.js';
import { buildPdfBytes } from '../src/skills/export/pdf-writer.js';

let failed = 0;
function check(name, ok) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}

const xlsx = buildXlsxBytes({
  sheetName: 'Materials',
  title: 'Material Sourcing Export',
  columns: ['Part Number', 'Qty', 'Buying Price'],
  rows: [['MT-1', 2, 125.5]],
  columnWidths: { 0: 22, 1: 8, 2: 14 },
  summaryRows: [['Totals', 2, 125.5]],
});
const parts = unzipSync(xlsx);
check('XLSX content-types part', !!parts['[Content_Types].xml']);
check('XLSX workbook part', !!parts['xl/workbook.xml']);
check('XLSX worksheet part', !!parts['xl/worksheets/sheet1.xml']);
check('XLSX worksheet preserves material data', strFromU8(parts['xl/worksheets/sheet1.xml']).includes('MT-1'));

const pdf = buildPdfBytes(['Part Number | Qty | Buying Price', 'MT-1 | 2 | 125.50']);
const pdfText = new TextDecoder().decode(pdf);
check('PDF header signature', pdfText.startsWith('%PDF-1.4'));
check('PDF contains xref/trailer', pdfText.includes('\nxref\n') && pdfText.includes('\ntrailer\n') && pdfText.endsWith('%%EOF\n'));
check('PDF preserves material data', pdfText.includes('MT-1'));

if (failed) process.exit(1);
console.log('PASS: export format regression suite');
