import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process';
const root=path.resolve(process.argv[2]||process.cwd()), failures=[]; const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const ok=(c,m)=>{if(!c)failures.push(m)};
ok(read('config/stage-i-m84-boards-visual-migration-target.ts').includes("activationState: 'certification-gates-passed-pending-regression'"),'M84 target must remain pending regression after dedicated certification');
ok(read('RELEASE-STATUS-v1.43.2-STAGE-I-M84-BOARDS-VISUAL-MIGRATION.md').includes('**State:** certification-gates-passed-pending-regression'),'M84 release status must remain pending regression');
ok(read('M84-CONTINUATION-STATE.md').includes('**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS'),'M84 continuation must remain pending until regression/package/final gates pass');
if(failures.length){console.error('M84 post-certification state verification FAILED');failures.forEach(f=>console.error(` - ${f}`));process.exit(1)}console.log('M84 post-certification state verification: PASS');
