import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseCsv, stringifyCsv } from '../src/import-export/csv.js';
import { detectHeaderRow, suggestColumnMapping, validateAndNormalizeRows, rowsForCommit } from '../src/import-export/import-engine.js';
import { MATERIAL_IMPORT_COLUMNS } from '../src/import-export/material-import-spec.js';
import { buildXlsxBytes } from '../src/skills/export/xlsx-writer.js';
import { parseXlsx, parseXls } from '../src/import-export/excel-reader.js';

const sample = {
  id:'mt-test-001', name:'PN-001', group:{id:'topics',title:'Items for Quotation'}, sourceType:'Local', materialDescription:'Valve', brand:'Brand A',
  quantity:2, buyingPrice:100.5, currency:'PHP', shippingCost:10, shippingCostCurrency:'PHP', leadtimeInWeeks:2, dateRequired:'2026-12-31',
  rfqRefNo:'RFQ-001', vendorDetails:'Vendor A', accounts:{linkedItems:[{id:'acc-1',name:'Account 1'}]}, supplierPoNo:{linkedItems:[{id:'po-1',name:'PO 1'}]},
};
const csv=stringifyCsv([MATERIAL_IMPORT_COLUMNS,[sample.id,sample.name,sample.group.id,sample.sourceType,sample.materialDescription,sample.brand,sample.quantity,sample.buyingPrice,sample.currency,sample.shippingCost,sample.shippingCostCurrency,sample.leadtimeInWeeks,sample.dateRequired,sample.rfqRefNo,sample.vendorDetails,'acc-1|Account 1','po-1|PO 1']]);
const matrix=parseCsv(csv); assert.equal(matrix[0][0],'Material ID'); assert.equal(matrix[1][1],'PN-001');
const detected=detectHeaderRow(matrix); assert.equal(detected.index,0); const mapping=suggestColumnMapping(matrix[0]);
const validated=validateAndNormalizeRows(matrix,0,mapping); assert.equal(validated.summary.valid,1); assert.equal(validated.rows[0].canonical.payload.quantity,2); assert.equal(rowsForCommit(validated.rows).length,1);
const dupMatrix=parseCsv(stringifyCsv([MATERIAL_IMPORT_COLUMNS,matrix[1],matrix[1]])); const dup=validateAndNormalizeRows(dupMatrix,0,suggestColumnMapping(dupMatrix[0])); assert.equal(dup.summary.duplicate,1);
const bad=parseCsv(stringifyCsv([MATERIAL_IMPORT_COLUMNS,[...matrix[1].slice(0,6),'not-a-number',...matrix[1].slice(7)]])); const badv=validateAndNormalizeRows(bad,0,suggestColumnMapping(bad[0])); assert.equal(badv.summary.invalid,1);
const wb={sheetName:'Materials',columns:MATERIAL_IMPORT_COLUMNS,rows:[matrix[1]],columnWidths:{},summaryRows:[]}; const bytes=buildXlsxBytes(wb); const xlsx=parseXlsx(bytes); assert.equal(xlsx[0].rows[0][1],'Part Number'); assert.equal(xlsx[0].rows[1][1],'PN-001');
const xml=`<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Materials"><Table><Row><Cell><Data ss:Type="String">Part Number</Data></Cell><Cell><Data ss:Type="String">Group</Data></Cell></Row><Row><Cell><Data ss:Type="String">PN-XLS</Data></Cell><Cell><Data ss:Type="String">topics</Data></Cell></Row></Table></Worksheet></Workbook>`;
const xls=parseXls(new TextEncoder().encode(xml)); assert.equal(xls[0].rows[1][0],'PN-XLS');
assert.ok(fs.existsSync('templates/material-tracker-import-template.csv')); assert.ok(fs.existsSync('templates/material-tracker-import-template.xlsx')); assert.ok(fs.existsSync('docs/MATERIAL_IMPORT_SPECIFICATION.md'));
console.log('PASS: CSV parse/export round trip');
console.log('PASS: header detection and configurable mapping');
console.log('PASS: schema/type validation and duplicate detection');
console.log('PASS: XLSX export/import round trip');
console.log('PASS: legacy .xls SpreadsheetML parsing');
console.log('PASS: reusable CSV/XLSX templates and formal specification present');
