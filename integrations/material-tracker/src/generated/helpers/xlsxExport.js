import { createSpreadsheet, addSummaryRow, createTheme, formatColumn } from '@material/skills/xlsx-export.jsx';
import { calcPhp, calcShippingPhp, calcLanded, calcTotalLanded, calcSelling, calcTotalCostVatin } from '@material/generated/utils/calculations';

const theme = createTheme({
  primary: 'FF5B47E0', secondary: 'FF3B82F6', accent: 'FF10B981',
  neutral: 'FFE5E7EB', font: 'Inter',
});

export function buildMaterialsWorkbook(items, rates) {
  const columns = [
    'Part Number', 'Group', 'Source', 'Brand', 'Vendor', 'Qty',
    'Buying Price', 'Currency', 'PHP Equiv', 'Shipping', 'Ship. Currency', 'Ship. PHP Equiv', 'Landed Cost',
    'Total Landed', 'Selling (VAT-EX)', 'Total (VAT-IN)',
    'Lead (wks)', 'Date Required', 'RFQ Ref', 'Description',
  ];
  const rows = items.map(i => [
    i.name || '', i.group?.title || '', i.sourceType || '', i.brand || '',
    i.vendorDetails || '', i.quantity || 0, i.buyingPrice || 0,
    i.currency || '', calcPhp(i) || 0, i.shippingCost || 0,
    i.shippingCostCurrency || 'PHP', calcShippingPhp(i, i.shippingCostCurrency) || 0,
    calcLanded(i, i.shippingCostCurrency) || 0, calcTotalLanded(i, i.shippingCostCurrency) || 0, calcSelling(i, i.shippingCostCurrency) || 0,
    calcTotalCostVatin(i, i.shippingCostCurrency) || 0, i.leadtimeInWeeks || '',
    i.dateRequired ? new Date(i.dateRequired).toLocaleDateString('en-US') : '',
    i.rfqRefNo || '', i.materialDescription || '',
  ]);
  const wb = createSpreadsheet({
    sheetName: 'Materials', title: 'Material Sourcing Export',
    columns, rows, theme, autoFilter: true, freezeHeader: true, alternateRows: true,
    columnWidths: { 0: 22, 1: 20, 5: 8, 6: 14, 8: 14, 9: 12, 10: 12, 11: 14, 12: 14, 13: 14, 14: 16, 15: 16, 19: 40 },
  });
  const ws = wb.getWorksheet('Materials');
  [6, 8, 9, 11, 12, 13, 14, 15].forEach(c => formatColumn(ws, `col_${c}`, 'decimal'));
  addSummaryRow(ws, { col_5: 'SUM', col_6: 'SUM', col_13: 'SUM', col_15: 'SUM' }, 'Totals', { theme });
  return wb;
}
