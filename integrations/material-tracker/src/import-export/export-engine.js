import { MATERIAL_IMPORT_COLUMNS, MATERIAL_IMPORT_FIELDS, groupIdFromValue } from './material-import-spec.js';
import { stringifyCsv } from './csv.js';
import { createSpreadsheet } from '@material/skills/xlsx-export.jsx';

function refs(value){const items=value?.linkedItems;if(!Array.isArray(items))return '';return items.map(x=>x?.id?`${x.id}|${x.name||x.id}`:(x?.name||'')).filter(Boolean).join(';');}
export function materialToImportRow(item){return [
  item.id||'', item.name||'', item.group?.id||groupIdFromValue(item.group?.title)||'', item.sourceType||'', item.materialDescription||'', item.brand||'',
  item.quantity??'', item.buyingPrice??'', item.currency||'', item.shippingCost??'', item.shippingCostCurrency||'', item.leadtimeInWeeks??'',
  item.dateRequired?new Date(item.dateRequired).toISOString().slice(0,10):'', item.rfqRefNo||'', item.vendorDetails||'', refs(item.accounts), refs(item.supplierPoNo),
];}
export function buildImportCompatibleRows(items){return items.map(materialToImportRow);}
export function buildImportCompatibleCsv(items){return stringifyCsv([MATERIAL_IMPORT_COLUMNS,...buildImportCompatibleRows(items)]);}
export function buildImportTemplateCsv(){return stringifyCsv([MATERIAL_IMPORT_COLUMNS]);}
export function buildImportCompatibleWorkbook(items,{sheetName='Materials'}={}){return createSpreadsheet({sheetName,columns:MATERIAL_IMPORT_COLUMNS,rows:buildImportCompatibleRows(items),columnWidths:Object.fromEntries(MATERIAL_IMPORT_FIELDS.map((f,i)=>[i,Math.min(40,Math.max(12,f.column.length+4))]))});}
export function buildImportTemplateWorkbook(){return buildImportCompatibleWorkbook([], {sheetName:'Materials'});}
export function downloadText(text,filename,type='text/csv;charset=utf-8'){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
