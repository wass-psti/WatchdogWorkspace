import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process';
const root=path.resolve(process.argv[2]||process.cwd()), failures=[];const read=p=>fs.readFileSync(path.join(root,p),'utf8');const ok=(c,m)=>{if(!c)failures.push(m)};
ok(read('config/stage-i-m82-layout-surface-responsive-composition-target.ts').includes("activationState: 'active-certified'"),'M82 target is not active-certified');
ok(read('RELEASE-STATUS-v1.43.2-STAGE-I-M82-LAYOUT-SURFACE-RESPONSIVE-COMPOSITION.md').includes('**State:** active-certified'),'M82 release status is not active-certified');
ok(read('M82-CONTINUATION-STATE.md').includes('**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE'),'M82 continuation state is not FULLY COMPLETE');
if(failures.length){console.error('M82 certified-state verification FAILED');failures.forEach(f=>console.error(` - ${f}`));process.exit(1)}console.log('M82 certified-state verification: PASS');
