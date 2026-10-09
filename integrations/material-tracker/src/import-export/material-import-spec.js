export const MATERIAL_IMPORT_VERSION = '1.0';

export const MATERIAL_GROUPS = Object.freeze({
  new_group: 'Engineering Services',
  topics: 'Items for Quotation',
});

export const MATERIAL_IMPORT_FIELDS = Object.freeze([
  { key: 'id', column: 'Material ID', aliases: ['id','material id','material_id','materialid'], required: false, type: 'identifier', maxLength: 128, example: 'mt-550e8400-e29b-41d4-a716-446655440000', unique: true, description: 'Stable Material Tracker identifier. Leave blank for new records. Preserve for safe export/edit/re-import.' },
  { key: 'name', column: 'Part Number', aliases: ['part number','part no','part #','name','item name','material name','model/pn','model pn'], required: true, type: 'string', maxLength: 200, example: 'ABC-1234', unique: true, description: 'Workspace-unique part number / material name.' },
  { key: 'groupId', column: 'Group', aliases: ['group','group id','group_id','category'], required: true, type: 'enum', values: ['new_group','topics','Engineering Services','Items for Quotation'], maxLength: 80, example: 'topics', description: 'Material Tracker group ID or exact supported group label.' },
  { key: 'sourceType', column: 'Source Type', aliases: ['source type','source','source_type','sourcing type'], required: true, type: 'enum', values: ['Local','Import'], maxLength: 20, example: 'Local', description: 'Source classification.' },
  { key: 'materialDescription', column: 'Material Description', aliases: ['material description','description','specification','material specification'], required: true, type: 'string', maxLength: 4000, example: 'Industrial pressure transmitter, 4-20mA', description: 'Full material description/specification.' },
  { key: 'brand', column: 'Brand', aliases: ['brand','manufacturer','make'], required: true, type: 'string', maxLength: 200, example: 'Acme', description: 'Manufacturer / brand.' },
  { key: 'quantity', column: 'Quantity', aliases: ['quantity','qty','qtty'], required: true, type: 'number', min: 0.000001, max: 1000000000, example: '5', description: 'Positive quantity. Decimal quantities are allowed.' },
  { key: 'buyingPrice', column: 'Buying Price', aliases: ['buying price','price','unit price','buying_price','cost'], required: true, type: 'number', min: 0.000001, max: 1000000000000000, example: '1250.50', description: 'Positive unit buying price in Currency.' },
  { key: 'currency', column: 'Currency', aliases: ['currency','buying currency','price currency'], required: true, type: 'enum', values: ['PHP','USD','EUR'], maxLength: 3, example: 'PHP', description: 'Buying-price currency.' },
  { key: 'shippingCost', column: 'Shipping Cost', aliases: ['shipping cost','shipping','freight','shipping_cost'], required: false, type: 'number', min: 0, max: 1000000000000000, example: '250.00', description: 'Optional shipping/freight cost per unit. Blank means null.' },
  { key: 'shippingCostCurrency', column: 'Shipping Currency', aliases: ['shipping currency','ship currency','ship. currency','shipping_cost_currency'], required: false, type: 'enum', values: ['PHP','USD','EUR'], default: 'PHP', maxLength: 3, example: 'PHP', description: 'Currency for Shipping Cost. Defaults to PHP when Shipping Cost is provided.' },
  { key: 'leadtimeInWeeks', column: 'Lead Time (Weeks)', aliases: ['lead time (weeks)','lead time','leadtime','lead weeks','leadtimeinweeks'], required: false, type: 'integer', min: 0, max: 5200, example: '4', description: 'Non-negative whole number of weeks.' },
  { key: 'dateRequired', column: 'Date Required', aliases: ['date required','required date','need by','date_required'], required: false, type: 'date', example: '2026-12-31', description: 'ISO date YYYY-MM-DD preferred. Recognized spreadsheet dates are normalized to ISO.' },
  { key: 'rfqRefNo', column: 'RFQ Ref No', aliases: ['rfq ref no','rfq ref','rfq','rfq reference','rfq_ref_no'], required: false, type: 'string', maxLength: 200, example: 'RFQ-2026-001', description: 'RFQ/reference number.' },
  { key: 'vendorDetails', column: 'Vendor Details', aliases: ['vendor details','vendor','supplier','supplier name'], required: false, type: 'string', maxLength: 500, example: 'Supplier Company', description: 'Supplier/vendor details.' },
  { key: 'accountRefs', column: 'Account References', aliases: ['account references','accounts','account refs'], required: false, type: 'references', maxItems: 50, maxLength: 200, example: 'ACC-001|Main Account;ACC-002|Secondary', description: 'Semicolon-delimited references. Each token may be name-only or id|name.' },
  { key: 'supplierPoRefs', column: 'Supplier PO References', aliases: ['supplier po references','supplier po','supplier po no','po references','supplierporefs'], required: false, type: 'references', maxItems: 50, maxLength: 200, example: 'PO-001|PO 001', description: 'Semicolon-delimited supplier-PO references. Each token may be name-only or id|name.' },
]);

export const MATERIAL_IMPORT_COLUMNS = MATERIAL_IMPORT_FIELDS.map((field) => field.column);
export const REQUIRED_IMPORT_KEYS = MATERIAL_IMPORT_FIELDS.filter((field) => field.required).map((field) => field.key);
export const IMPORT_FIELD_BY_KEY = Object.freeze(Object.fromEntries(MATERIAL_IMPORT_FIELDS.map((field) => [field.key, field])));

export function normalizeHeader(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[_.-]+/g, ' ').replace(/\s+/g, ' ');
}

export const HEADER_ALIAS_MAP = (() => {
  const map = new Map();
  for (const field of MATERIAL_IMPORT_FIELDS) {
    for (const alias of [field.column, field.key, ...(field.aliases || [])]) map.set(normalizeHeader(alias), field.key);
  }
  return map;
})();

export function groupIdFromValue(value) {
  const text = String(value ?? '').trim();
  if (text === 'new_group' || text.toLowerCase() === 'engineering services') return 'new_group';
  if (text === 'topics' || text.toLowerCase() === 'items for quotation') return 'topics';
  return null;
}

export function groupLabel(groupId) { return MATERIAL_GROUPS[groupId] || groupId || ''; }

export function materialImportSpecRows() {
  return MATERIAL_IMPORT_FIELDS.map((f, index) => ({
    order: index + 1,
    column: f.column,
    key: f.key,
    required: f.required ? 'Yes' : 'No',
    type: f.type,
    acceptedValues: f.values?.join(' | ') || (f.type === 'date' ? 'YYYY-MM-DD; recognized Excel dates' : f.type === 'boolean' ? 'true/false, yes/no, y/n, 1/0' : ''),
    nullRule: f.required ? 'Blank not allowed' : 'Blank imports as null/empty; defaults apply where documented',
    maxLength: f.maxLength || '',
    unique: f.unique ? 'Yes' : 'No',
    example: f.example || '',
    description: f.description || '',
  }));
}
