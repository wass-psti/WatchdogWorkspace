import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process';
const root=path.resolve(process.argv[2]||process.cwd()), failures=[]; const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const ok=(c,m)=>{if(!c)failures.push(m)};
ok(read('config/stage-i-m81-application-shell-global-navigation-target.ts').includes("activationState: 'certification-gates-passed-pending-regression'"),'M81 target is not in post-certification pending-regression state');
ok(read('RELEASE-STATUS-v1.43.2-STAGE-I-M81-APPLICATION-SHELL-GLOBAL-NAVIGATION.md').includes('**State:** certification-gates-passed-pending-regression'),'M81 release status is not pending regression');
ok(read('M81-CONTINUATION-STATE.md').includes('**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS'),'M81 continuation must remain pending until regression/package/final gates pass');
if(failures.length){console.error('M81 post-certification state verification FAILED');failures.forEach(f=>console.error(` - ${f}`));process.exit(1)} console.log('M81 post-certification state verification: PASS (dedicated certification gates passed; historical/package/final gates remain)');
