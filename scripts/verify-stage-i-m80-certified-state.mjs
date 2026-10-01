import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process';
const root=path.resolve(process.argv[2]||process.cwd()), failures=[]; const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const ok=(c,m)=>{if(!c)failures.push(m)};
ok(read('config/stage-i-m80-shared-primitive-component-layer-target.ts').includes("activationState: 'active-certified'"),'M80 target is not active-certified');
ok(read('RELEASE-STATUS-v1.43.2-STAGE-I-M80-SHARED-PRIMITIVE-COMPONENT-LAYER.md').includes('**State:** active-certified'),'M80 release status is not active-certified');
ok(read('M80-CONTINUATION-STATE.md').includes('**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE'),'M80 continuation state is not FULLY COMPLETE');
if(failures.length){console.error('M80 certified-state verification FAILED');failures.forEach(f=>console.error(` - ${f}`));process.exit(1)} console.log('M80 certified-state verification: PASS');
