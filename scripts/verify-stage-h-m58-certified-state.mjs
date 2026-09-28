import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process';
const root = path.resolve(process.argv[2] || process.cwd());
const read = (p) => fs.readFileSync(path.join(root,p),'utf8');
const failures=[]; const ok=(c,m)=>{if(!c)failures.push(m);};
ok(read('config/stage-h-m58-design-token-architecture-target.ts').includes("activationState: 'active-certified'"),'M58 target is not active-certified');
ok(read('RELEASE-STATUS-v1.43.2-STAGE-H-M58-DESIGN-TOKEN-ARCHITECTURE-CONSOLIDATION.md').includes('**State:** active-certified'),'M58 release status is not active-certified');
ok(read('M58-CONTINUATION-STATE.md').includes('**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE'),'M58 continuation state is not FULLY COMPLETE');
if(failures.length){console.error('M58 post-certification state verification FAILED'); failures.forEach(x=>console.error(` - ${x}`)); process.exit(1);} console.log('M58 post-certification staged-state verification: PASS');
