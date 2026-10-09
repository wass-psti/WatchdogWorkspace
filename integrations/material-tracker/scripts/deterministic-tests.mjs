import fs from 'node:fs';
const tests=[];
const add=(n,f)=>tests.push([n,f]);
add('embedded boundary exists',()=>fs.readFileSync('src/MaterialTrackerApp.jsx','utf8').includes('data-module="material-tracker"'));
add('Workspace session is authoritative',()=>fs.readFileSync('src/platform/integration/bootstrap.js','utf8').includes('Authenticated WatchdogWorkspace session is required'));
add('app-scoped roles are explicit',()=>fs.readFileSync('src/platform/integration/bootstrap.js','utf8').includes("['ADMIN', 'USER']") && fs.readFileSync('src/platform/integration/bootstrap.js','utf8').includes("bootstrap?.role === 'ADMIN'"));
add('legacy local/demo backend is fully removed',()=>!fs.existsSync('server') && !fs.existsSync('reference/legacy-local-server'));
add('dummy/test data guard is enforced',()=>JSON.parse(fs.readFileSync('package.json','utf8')).scripts?.['check:data-clean']==='node scripts/check-data-clean.mjs');
add('user state remains workspace/user scoped',()=>fs.readFileSync('src/api/http.js','utf8').includes('material_tracker_put_user_state'));
add('comments use dedicated RPC rows',()=>fs.readFileSync('src/api/http.js','utf8').includes('material_tracker_add_comment'));
add('presence uses dedicated RPC',()=>fs.readFileSync('src/api/http.js','utf8').includes('material_tracker_presence_heartbeat'));
add('forex uses protected RPC',()=>fs.readFileSync('src/api/http.js','utf8').includes('material_tracker_set_forex'));
add('Material Tracker theme cannot own embedded document',()=>fs.readFileSync('src/generated/utils/themeManager.js','utf8').includes('if (isEmbedded()) return'));
add('global Tailwind preflight disabled',()=>{ const css=fs.readFileSync('src/index.css','utf8'); return css.includes('tailwindcss/theme.css') && css.includes('tailwindcss/utilities.css') && !css.includes('tailwindcss/preflight.css') && !css.includes('@import "tailwindcss"') && !css.includes('@tailwind base'); });
add('selling-cost formulas preserved',()=>{
 const s=fs.readFileSync('src/generated/utils/calculations.js','utf8');
 return /1\.30/.test(s) && /1\.12/.test(s);
});
add('package hygiene permits local generated install/build outputs',()=>{
 const s=fs.readFileSync('scripts/package-hygiene.mjs','utf8');
 return s.includes('must be excluded from checkpoint/certified ZIPs') && s.includes('node_modules') && s.includes('dist');
});

add('VIEWER mutation controls are suppressed',()=>{
 const files=['src/generated/App.jsx','src/generated/ItemDetail.jsx','src/generated/DetailView.jsx','src/generated/ItemsTable.jsx','src/generated/ItemRow.jsx','src/generated/SubitemsPanel.jsx','src/generated/CommentsPanel.jsx'];
 const text=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
 return text.includes('canWrite') && text.includes('Viewer access is read-only') && text.includes('enabled: !!runtime?.canWrite');
});
add('retired vulnerable export packages are absent',()=>{
 const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
 return !pkg.dependencies?.xlsx && !pkg.dependencies?.jspdf && !pkg.dependencies?.['jspdf-autotable'] && !!pkg.dependencies?.fflate;
});
add('standalone dev server is loopback-only',()=>{
 const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
 return String(pkg.scripts?.dev||'').includes('127.0.0.1') && !String(pkg.scripts?.dev||'').includes('0.0.0.0');
});
add('notification writes require write-capable role',()=>fs.readFileSync('supabase/migrations/20261003080739_material_tracker_notification_write_guard.sql','utf8').includes('material_tracker_can_write'));


add('module animation and scrollbar selectors are scoped',()=>{
 const css=fs.readFileSync('src/generated/theme-tokens.css','utf8');
 return !css.split(/\r?\n/).some(line=>/^\.(?:animate-|styled-scrollbar)/.test(line.trim()) || /^\[data-state=/.test(line.trim()))
   && css.includes('@keyframes mt-tabSlideIn') && css.includes('[data-module="material-tracker"] .animate-shimmer');
});
add('host invalidation bridge is available',()=>fs.readFileSync('src/generated/hooks/useAutoRefresh.js','utf8').includes('watchdog:material-tracker:invalidate'));
add('runtime transport enforces write/admin capabilities',()=>{
 const s=fs.readFileSync('src/api/http.js','utf8');
 return s.includes('requireWrite') && s.includes('requireAdmin') && s.includes("requireAdmin('forex administration')");
});


add('host mutation and notification bridges are namespaced',()=>{
 const s=fs.readFileSync('src/platform/integration/supabase-rpc.js','utf8');
 return s.includes('watchdog:material-tracker:changed') && s.includes('watchdog:material-tracker:invalidate') && s.includes('watchdog:module-notification-created');
});


add('production import/export subsystem is wired',()=>{
 const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
 const ui=fs.readFileSync('src/generated/components/BulkPasteImport.jsx','utf8');
 const http=fs.readFileSync('src/api/http.js','utf8');
 return pkg.scripts?.['test:import-export']==='node scripts/import-export-tests.mjs'
   && ui.includes('parseImportFile') && ui.includes('Run Server Preflight') && ui.includes('Commit')
   && http.includes('material_tracker_import_preflight') && http.includes('material_tracker_import_commit');
});
add('atomic import migration and uniqueness guard exist',()=>{
 const files=fs.readdirSync('supabase/migrations');
 const name=files.find(n=>n.startsWith('20261003115017_'));
 if(!name)return false;
 const sql=fs.readFileSync(`supabase/migrations/${name}`,'utf8');
 return sql.includes('material_tracker_import_preflight') && sql.includes('material_tracker_import_commit') && sql.includes('material_tracker_materials_workspace_active_name_uidx');
});
add('formal import specification and templates exist',()=>fs.existsSync('docs/MATERIAL_IMPORT_SPECIFICATION.md') && fs.existsSync('templates/material-tracker-import-template.csv') && fs.existsSync('templates/material-tracker-import-template.xlsx'));
add('CSV and Excel exports are import-compatible',()=>{
 const t=fs.readFileSync('src/generated/TableToolbar.jsx','utf8');
 const e=fs.readFileSync('src/import-export/export-engine.js','utf8');
 return t.includes('CSV') && t.includes('Excel') && e.includes('MATERIAL_IMPORT_COLUMNS') && e.includes('buildImportCompatibleCsv') && e.includes('buildImportCompatibleWorkbook');
});

let fail=0; for(const [n,f] of tests){let ok=false;try{ok=!!f();}catch{} console.log(`${ok?'PASS':'FAIL'}: ${n}`);if(!ok)fail++;} if(fail)process.exit(1);

