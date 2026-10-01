import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const root=path.resolve(process.argv[2]||process.cwd());
const read=(relative)=>fs.readFileSync(path.join(root,relative),'utf8');
const failures=[]; const ok=(condition,message)=>{if(!condition)failures.push(message)};
const target=read('config/stage-i-m79-design-tokens-semantic-theme-target.ts');
const status=read('RELEASE-STATUS-v1.43.2-STAGE-I-M79-DESIGN-TOKENS-SEMANTIC-THEME-ARCHITECTURE.md');
const continuation=read('M79-CONTINUATION-STATE.md');
ok(target.includes("activationState: 'active-certified'"),'M79 target is not active-certified');
ok(status.includes('**State:** active-certified'),'M79 release status is not active-certified');
ok(continuation.includes('**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE'),'M79 continuation state is not FULLY COMPLETE');
if(failures.length){console.error('M79 certified-state verification FAILED');failures.forEach(x=>console.error(` - ${x}`));process.exit(1)}
console.log('M79 certified-state verification: PASS');
