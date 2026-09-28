import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process';
const root=path.resolve(process.argv[2]||process.cwd()), read=p=>fs.readFileSync(path.join(root,p),'utf8'), failures=[], ok=(c,m)=>{if(!c)failures.push(m)};
ok(read('config/stage-h-m69-data-presentation-dense-ui-target.ts').includes("activationState: 'active-certified'"),'M69 target is not active-certified');
ok(read('RELEASE-STATUS-v1.43.2-STAGE-H-M69-DATA-PRESENTATION-DENSE-UI.md').includes('**State:** active-certified'),'M69 release status is not active-certified');
ok(read('M69-CONTINUATION-STATE.md').includes('**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE'),'M69 continuation state is not FULLY COMPLETE');
if(failures.length){console.error('M69 post-certification state verification FAILED');failures.forEach(x=>console.error(` - ${x}`));process.exit(1)} console.log('M69 post-certification staged-state verification: PASS');
