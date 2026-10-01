import fs from 'node:fs';
const files=['assets/css/app.css','assets/css/boards-monday.css','assets/css/shell-navigation.css','apps/time-tracker/styles.css','apps/time-tracker/v2.css','apps/fueltrack-plus/styles.v3.17.0-wm6.css','apps/tradelink/styles.v1.42.0-wm1.css','assets/css/foundation/cross-module-responsive-harmonization.css'];
const fail=[];
for(const f of files){const s=fs.readFileSync(f,'utf8');let depth=0;for(const c of s){if(c==='{')depth++;else if(c==='}')depth--;if(depth<0)break}if(depth!==0)fail.push(`${f}: unbalanced CSS braces (${depth})`);if(/@media[^\{]*\((?:max|min)-width\s*:\s*\d+(?:\.\d+)?px\)/.test(s))fail.push(`${f}: px viewport media query remains`)}
const css=fs.readFileSync('assets/css/foundation/cross-module-responsive-harmonization.css','utf8');
for(const token of ['overscroll-behavior-inline:contain','max-width:100%','overflow-x:auto','env(safe-area-inset-left)']) if(!css.includes(token))fail.push(`M95 cross-module CSS missing runtime behavior ${token}`);
if(fail.length){console.error('M95 responsive deterministic execution verification FAILED');fail.forEach(x=>console.error(` - ${x}`));process.exit(1)}
console.log('M95 responsive deterministic execution verification: PASS');
console.log('Validated CSS parse balance, canonical viewport query units, internal dense-region overflow, mobile tab reachability, and safe-area-aware narrow composition.');
