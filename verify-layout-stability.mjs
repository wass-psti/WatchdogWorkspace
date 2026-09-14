import fs from 'node:fs';
const css=fs.readFileSync(new URL('./assets/css/app.css',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('./assets/js/app.ts',import.meta.url),'utf8');
const shellCss=fs.readFileSync(new URL('./assets/css/shell-navigation.css',import.meta.url),'utf8');
const checks=[
 ['stable scrollbar gutter',/html\{scrollbar-gutter:stable\}/],
 ['forced scrollbar reservation',/html\{overflow-y:scroll;overflow-x:hidden\}/],
 ['persistent shell structural guard', /\[data-workspace-shell\][\s\S]*transform:none!important;[\s\S]*animation:none!important;/.test(css) && /body\[data-wm-surface="shell"\] \.sidebar\s*\{[\s\S]*transform:\s*none!important;/.test(shellCss)],
 ['iframe has no scale transition',/\.module-stage iframe\{transform:none!important;transition:opacity/],
 ['scoped content motion',/\.content-motion-enter\{animation:wm-content-fade/],
 ['root transition API disabled',!js.includes('document.startViewTransition(update)')],
 ['app root not entrance animated',!js.includes("app.classList.add('motion-enter')")],
];
let failed=false; for(const [name,test] of checks){const ok=typeof test==='boolean'?test:test.test(css);console.log(`${ok?'PASS':'FAIL'}: ${name}`);failed ||= !ok;} if(failed)process.exit(1);
