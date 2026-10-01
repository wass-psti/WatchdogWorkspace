import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process';
const root=path.resolve(process.argv[2]||process.cwd()), failures=[];const read=p=>fs.readFileSync(path.join(root,p),'utf8');const ok=(c,m)=>{if(!c)failures.push(m)};
ok(read('config/stage-i-m82-layout-surface-responsive-composition-target.ts').includes("activationState: 'certification-gates-passed-pending-regression'"),'M82 target is not in post-certification pending-regression state');
ok(read('RELEASE-STATUS-v1.43.2-STAGE-I-M82-LAYOUT-SURFACE-RESPONSIVE-COMPOSITION.md').includes('**State:** certification-gates-passed-pending-regression'),'M82 release status is not pending regression');
ok(read('M82-CONTINUATION-STATE.md').includes('**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS'),'M82 continuation must remain pending until regression/package/final gates pass');
if(failures.length){console.error('M82 post-certification state verification FAILED');failures.forEach(f=>console.error(` - ${f}`));process.exit(1)}console.log('M82 post-certification state verification: PASS (dedicated certification gates passed; historical/package/final gates remain)');
