import { parseCsv } from './csv.js';
import { parseExcelFile } from './excel-reader.js';
import { IMPORT_LIMITS } from './import-engine.js';

export const ACCEPTED_IMPORT_EXTENSIONS=['.csv','.xls','.xlsx'];
export const ACCEPTED_MIME_TYPES={
  '.csv':['text/csv','application/csv','text/plain','application/vnd.ms-excel',''],
  '.xls':['application/vnd.ms-excel','application/octet-stream','application/x-ole-storage',''],
  '.xlsx':['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/zip','application/octet-stream',''],
};
export function extensionOf(name){const m=String(name||'').toLowerCase().match(/\.[^.]+$/);return m?.[0]||'';}
export function validateImportFile(file){if(!file)throw new Error('Choose a CSV or Excel file.');const ext=extensionOf(file.name);if(!ACCEPTED_IMPORT_EXTENSIONS.includes(ext))throw new Error('Unsupported file extension. Allowed: .csv, .xls, .xlsx.');if(file.size>IMPORT_LIMITS.maxFileBytes)throw new Error(`File exceeds the ${Math.round(IMPORT_LIMITS.maxFileBytes/1024/1024)} MB safety limit.`);const mime=String(file.type||'').toLowerCase();const allowed=ACCEPTED_MIME_TYPES[ext];if(mime&&!allowed.includes(mime))throw new Error(`File MIME type “${mime}” does not match ${ext}.`);return ext;}
export async function parseImportFile(file){const ext=validateImportFile(file);if(ext==='.csv'){const text=await file.text();return {extension:ext,sheets:[{name:'CSV',rows:parseCsv(text)}]};}const bytes=new Uint8Array(await file.arrayBuffer());return {extension:ext,sheets:parseExcelFile(bytes,ext)};}
