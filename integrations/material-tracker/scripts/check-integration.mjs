import fs from 'node:fs';

// This is a source-only theme token sheet: importing or fetching any CSS asset
// (including remote fonts) violates its offline, host-scoped design-token boundary.
// Reject resource directives outright rather than searching for a URL substring:
// a hostname can appear inside another origin or elsewhere in a URL.
const tokenCssIsSelfContained = css => !/(?:@import\b|\b(?:url|image-set)\s*\()/i.test(css);

const checks = [
  ['token CSS self-containment regression', () => [
    [':root { --material-primary: #fff; }', true],
    ['@import "https://fonts.googleapis.com/css2?family=Roboto";', false],
    ['@import "./local.css";', false],
    ['.x { background: url(https://fonts.googleapis.com.attacker.test/x); }', false],
    ['.x { background: url(https://attacker.test/fonts.googleapis.com/x); }', false],
    ['.x { background: url(//fonts.googleapis.com/x); }', false],
    ['.x { background: url(data:text/plain,x); }', false],
    ['.x { background: image-set("./x.png" 1x); }', false],
  ].every(([css, expected]) => tokenCssIsSelfContained(css) === expected)],
  ['embedded app entry', () => fs.existsSync('src/MaterialTrackerApp.jsx')],
  ['host session bootstrap', () => fs.readFileSync('src/platform/integration/bootstrap.js','utf8').includes('material_tracker_bootstrap')],
  ['Workspace storage keys', () => {
    const s=fs.readFileSync('src/platform/integration/workspace-session.js','utf8');
    return s.includes('wm.platform.auth.session.v1') && s.includes('wm.platform.identity.v1');
  }],
  ['Supabase RPC compatibility transport', () => fs.readFileSync('src/api/http.js','utf8').includes('material_tracker_list_materials')],
  ['no local/demo backend retained', () => !fs.existsSync('server') && !fs.existsSync('reference/legacy-local-server')],
  ['module-scoped aliases', () => {
    const s=fs.readFileSync('vite.config.js','utf8'); return s.includes('@material/generated') && !s.includes("'@generated'");
  }],
  ['no standalone API proxy', () => !fs.readFileSync('vite.config.js','utf8').includes('proxy:')],
  ['row-based comments', () => !fs.readFileSync('src/generated/hooks/useComments.jsx','utf8').includes('material_sourcing_comments')],
  ['RPC-backed presence', () => fs.readFileSync('src/generated/hooks/usePresence.js','utf8').includes('/api/presence/heartbeat')],
  ['host-owned embedded theme', () => fs.readFileSync('src/generated/utils/themeManager.js','utf8').includes('isEmbedded')],
  ['scoped Material Tracker CSS', () => {
    const a=fs.readFileSync('src/index.css','utf8'), b=fs.readFileSync('src/generated/theme-tokens.css','utf8');
    return a.includes('[data-module="material-tracker"]') && b.includes('[data-module="material-tracker"]') && tokenCssIsSelfContained(b);
  }],

  ['read-only VIEWER presentation boundary', () => {
    const a=fs.readFileSync('src/generated/App.jsx','utf8');
    const d=fs.readFileSync('src/generated/DetailView.jsx','utf8');
    const c=fs.readFileSync('src/generated/CommentsPanel.jsx','utf8');
    return a.includes('runtime?.canWrite') && d.includes('canWrite &&') && c.includes('Viewer access is read-only');
  }],
  ['secure export implementation', () => {
    const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
    const x=fs.readFileSync('src/skills/xlsx-export.jsx','utf8');
    const p=fs.readFileSync('src/skills/pdf-export.jsx','utf8');
    const xw=fs.readFileSync('src/skills/export/xlsx-writer.js','utf8');
    const pw=fs.readFileSync('src/skills/export/pdf-writer.js','utf8');
    return !!pkg.dependencies?.fflate
      && !pkg.dependencies?.xlsx
      && !pkg.dependencies?.jspdf
      && !pkg.dependencies?.['jspdf-autotable']
      && x.includes("./export/xlsx-writer")
      && p.includes("./export/pdf-writer")
      && xw.includes("from 'fflate'")
      && xw.includes('zipSync')
      && pw.includes('%PDF-1.4');
  }],
  ['notification write guard migration', () => fs.existsSync('supabase/migrations/20261003080739_material_tracker_notification_write_guard.sql')],
  ['dummy/test data guard available', () => fs.existsSync('scripts/check-data-clean.mjs') && JSON.parse(fs.readFileSync('package.json','utf8')).scripts?.['check:data-clean'] === 'node scripts/check-data-clean.mjs'],
  ['atomic file import subsystem', () => { const h=fs.readFileSync('src/api/http.js','utf8'), ui=fs.readFileSync('src/generated/components/BulkPasteImport.jsx','utf8'); return h.includes('material_tracker_import_preflight') && h.includes('material_tracker_import_commit') && ui.includes('Run Server Preflight') && ui.includes('Commit'); }],
  ['formal interchange specification/templates', () => fs.existsSync('docs/MATERIAL_IMPORT_SPECIFICATION.md') && fs.existsSync('templates/material-tracker-import-template.csv') && fs.existsSync('templates/material-tracker-import-template.xlsx')],
  ['live schema provenance migrations', () => ['20261003061912','20261003063134','20261003063657','20261003080739','20261003115017','20261003115954'].every(v => fs.readdirSync('supabase/migrations').some(n=>n.startsWith(v)))],
];
let failed=0;
for (const [name,fn] of checks) { let ok=false; try{ok=!!fn();}catch{} console.log(`${ok?'PASS':'FAIL'} ${name}`); if(!ok)failed++; }
if(failed) process.exit(1);
console.log('PASS: Material Tracker WatchdogWorkspace integration invariants satisfied');
