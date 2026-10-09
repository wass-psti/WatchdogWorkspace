import fs from 'node:fs';
const required=[
 'src/generated/AddItemForm.jsx','src/generated/ItemEditForm.jsx','src/generated/ItemsTable.jsx','src/generated/ItemDetail.jsx',
 'src/generated/SubitemsPanel.jsx','src/generated/KPISection.jsx','src/generated/helpers/xlsxExport.js','src/skills/pdf-export.jsx','src/skills/xlsx-export.jsx',
  'src/skills/export/xlsx-writer.js',
  'src/skills/export/pdf-writer.js',
 'src/generated/utils/calculations.js','src/generated/tableColumns.js'
];
let failed=0;
for(const f of required){const ok=fs.existsSync(f);console.log(`${ok?'PASS':'FAIL'} preserve ${f}`);if(!ok)failed++;}
const calc=fs.readFileSync('src/generated/utils/calculations.js','utf8');
for(const [n,re] of [['import selling formula',/1\.30/],['VAT formula',/1\.12/]]){const ok=re.test(calc);console.log(`${ok?'PASS':'FAIL'} ${n}`);if(!ok)failed++;}
if(failed)process.exit(1);
