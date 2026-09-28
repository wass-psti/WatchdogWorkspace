import fs from 'node:fs';import path from 'node:path';import process from 'node:process';
const root=path.resolve(process.argv[2]||process.cwd());const fail=(m)=>{console.error(`M77 staged-state verification FAILED: ${m}`);process.exit(1)};
const target=fs.readFileSync(path.join(root,'config/stage-h-m77-final-ui-production-certification-target.ts'),'utf8');
const status=fs.readFileSync(path.join(root,'RELEASE-STATUS-v1.43.2-STAGE-H-M77-FINAL-UI-PRODUCTION-CERTIFICATION.md'),'utf8');
const cont=fs.readFileSync(path.join(root,'M77-CONTINUATION-STATE.md'),'utf8');
if(!target.includes("activationState: 'active-certified'"))fail('target is not active-certified');
if(!status.includes('**State:** active-certified'))fail('release status is not active-certified');
if(!cont.includes('**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE'))fail('continuation state is not fully complete');
console.log('M77 post-certification staged-state verification: PASS');
