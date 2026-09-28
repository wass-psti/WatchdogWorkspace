import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process';
const root=path.resolve(process.argv[2]||process.cwd()), read=p=>fs.readFileSync(path.join(root,p),'utf8'), failures=[], ok=(c,m)=>{if(!c)failures.push(m)};
ok(read('config/stage-h-m63-accessibility-foundation-target.ts').includes("activationState: 'active-certified'"),'M63 target is not active-certified');
ok(read('RELEASE-STATUS-v1.43.2-STAGE-H-M63-ACCESSIBILITY-FOUNDATION-INTERACTION-SEMANTICS.md').includes('**State:** active-certified'),'M63 release status is not active-certified');
ok(read('M63-CONTINUATION-STATE.md').includes('**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE'),'M63 continuation state is not FULLY COMPLETE');
if(failures.length){console.error('M63 post-certification state verification FAILED');failures.forEach(x=>console.error(` - ${x}`));process.exit(1)} console.log('M63 post-certification staged-state verification: PASS');
