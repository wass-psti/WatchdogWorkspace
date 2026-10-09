import fs from 'node:fs';
import path from 'node:path';

const roots=['src'];
const files=[];
function walk(dir){ for(const e of fs.readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir,e.name); if(e.isDirectory())walk(p); else if(/\.(js|jsx)$/.test(e.name))files.push(p); } }
roots.forEach(walk);
const forbidden=[
  ['active local REST server reference', /localhost:5174|server\/data\/db\.json/],
  ['legacy generic alias', /from ['"]@(generated|components|api|skills|lib)\//],
  ['production monday GraphQL dependency', /api\.monday\.com|monday\.api\(/],
  ['retired vulnerable export package import', /from ['"](?:xlsx|jspdf|jspdf-autotable)['"]/],
];
let failures=0;
for(const f of files){ const s=fs.readFileSync(f,'utf8'); for(const [name,re] of forbidden){ if(re.test(s)){console.error(`FAIL ${name}: ${f}`); failures++;} } }
const css=fs.readFileSync('src/generated/theme-tokens.css','utf8');
const unscoped=css.split(/\r?\n/).filter(line => /^\.(?:animate-|styled-scrollbar)/.test(line.trim()) || /^\[data-state=/.test(line.trim()));
if(unscoped.length){ console.error('FAIL unscoped Material Tracker CSS selectors:', unscoped); failures += unscoped.length; }
console.log(`Static source verification: files=${files.length}, forbiddenRefs=${failures}`);
if(failures)process.exit(1);
